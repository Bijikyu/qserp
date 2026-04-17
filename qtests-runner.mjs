#!/usr/bin/env node
// GENERATED RUNNER: qtests-runner.mjs - auto-created by qtests TestGenerator
// Safe to delete; will be recreated as needed.
// Mirrors bin/qtests-ts-runner behavior (batching, DEBUG_TESTS.md, stable exits).
// Provides batching, summaries, and debug report creation for failing tests.

// qtests Test Runner - Feature-rich CLI with batching, summaries, and debug file
// Restores original functionality while ensuring Jest is launched with project config

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

// ANSI color codes for terminal output
const colors = {
  green: '\u001b[32m',
  red: '\u001b[31m',
  yellow: '\u001b[33m',
  blue: '\u001b[34m',
  magenta: '\u001b[35m',
  cyan: '\u001b[36m',
  white: '\u001b[37m',
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m'
};

// Test discovery patterns
const TEST_PATTERNS = [
  /\.test\.(js|ts|jsx|tsx)$/,
  /\.spec\.(js|ts|jsx|tsx)$/,
  /_test\.(js|ts|jsx|tsx)$/,
  /_spec\.(js|ts|jsx|tsx)$/
];

class TestRunner {
  constructor() {
    this.passedTests = 0;
    this.failedTests = 0;
    this.testResults = [];
    this.startTime = Date.now();
    // Lazily-initialized reference to Jest's runCLI (API-only execution)
    this._runCLI = null;
  }
  // Resolve a binary path from PATH, preferring earlier entries explicitly.
  resolveBin(binName) {
    try {
      const pathVar = process.env.PATH || process.env.Path || process.env.path || '';
      const parts = pathVar.split(path.delimiter).filter(Boolean);
      for (const dir of parts) {
        const candidate = path.join(dir, binName);
        try {
          const st = fs.statSync(candidate);
          if (st.isFile()) {
            try { fs.accessSync(candidate, fs.constants.X_OK); } catch {}
            return candidate;
          }
        } catch {}
      }
    } catch {}
    return null;
  }

  // Parse common truthy env values: '1', 'true', 'yes' (case-insensitive)
  isEnvTruthy(name) {
    const v = process.env[name];
    if (!v) return false;
    const s = String(v).trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes';
  }

  // Discover all test files in the project (from current working directory)
  discoverTests(dir = process.cwd(), depth = 0, maxDepth = 10) {
    const testFiles = [];
    if (depth > maxDepth) return testFiles;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        // Skip node_modules, hidden directories, and common build output
        if (
          entry.name.startsWith('.') ||
          entry.name === 'node_modules' ||
          entry.name === 'demo' ||
          entry.name === 'dist' ||
          entry.name === 'build'
        ) {
          continue;
        }
        if (entry.isDirectory()) {
          testFiles.push(...this.discoverTests(fullPath, depth + 1, maxDepth));
        } else if (entry.isFile()) {
          const isTestFile = TEST_PATTERNS.some(pattern => pattern.test(entry.name));
          if (!isTestFile) continue;
          // Skip tests in __mocks__ and other ignored folders
          if (fullPath.includes(`${path.sep}__mocks__${path.sep}`)) continue;
          // In generated-tests, only include files that follow the GeneratedTest naming convention
          if (fullPath.includes(`${path.sep}generated-tests${path.sep}`) && !/GeneratedTest/.test(entry.name)) {
            continue;
          }
          testFiles.push(fullPath);
        }
      }
    } catch {
      // Silently skip directories we can't read
    }
    // Optional pattern filter via env to limit scope for large repos/CI
    const pattern = process.env.QTESTS_PATTERN;
    if (pattern) {
      try {
        const rx = new RegExp(pattern);
        return testFiles.filter(f => rx.test(f));
      } catch {
        return testFiles; // invalid pattern, ignore
      }
    }
    return testFiles;
  }

  

  // API-only: execute all tests via Jest's programmatic API in one run
  async runAll(testFiles) {
    let stdout = '';
    let stderr = '';
    try {
      // Lazily require jest to avoid upfront overhead and allow CJS interop from ESM
      if (!this._runCLI) {
        const require = createRequire(import.meta.url);
        const jestModule = require('jest');
        this._runCLI = jestModule && jestModule.runCLI ? jestModule.runCLI : null;
      }
      if (!this._runCLI) {
        const msg = 'Jest API not available for fallback execution.';
        console.error(msg);
        process.exit(1);
      }

      // Determine config path
      const configCandidates = [
        path.join(process.cwd(), 'config', 'jest.config.mjs'),
        path.join(process.cwd(), 'jest.config.mjs')
      ];
      const cfg = configCandidates.find(p => {
        try { return fs.existsSync(p); } catch { return false; }
      });

      const runInBand = this.isEnvTruthy('QTESTS_INBAND') || (!process.env.QTESTS_FILE_WORKERS && !process.env.QTESTS_CONCURRENCY);
      const argv = {
        runInBand,
        passWithNoTests: true,
        silent: false,
        runTestsByPath: true,
        cache: true,
        coverage: false,
        _: testFiles,
        $0: 'jest'
      };
      const workerStr = process.env.QTESTS_FILE_WORKERS || process.env.QTESTS_CONCURRENCY;
      const maxW = workerStr ? parseInt(String(workerStr), 10) : undefined;
      if (!runInBand && Number.isFinite(maxW) && maxW > 0) {
        argv.maxWorkers = maxW;
      }
      if (cfg) argv.config = cfg; // jest accepts path string for --config

      // Record intended Jest invocation for debugging/tests
      try {
        const intendedArgs = [];
        if (cfg) intendedArgs.push('--config', cfg);
        intendedArgs.push('--passWithNoTests');
        if (runInBand) intendedArgs.push('--runInBand');
        else if (Number.isFinite(maxW) && maxW > 0) intendedArgs.push(`--maxWorkers=${maxW}`);
        intendedArgs.push('--cache', '--no-coverage');
        fs.writeFileSync(path.join(process.cwd(), 'runner-jest-args.json'), JSON.stringify(intendedArgs), 'utf8');
      } catch { /* best effort only */ }

      const { results } = await this._runCLI(argv, [process.cwd()]);
      for (const tr of (results.testResults || [])) {
        const file = tr.testFilePath || 'unknown';
        const success = (tr.numFailingTests || 0) === 0 && !tr.failureMessage;
        const duration = tr.perfStats && tr.perfStats.end && tr.perfStats.start ? (tr.perfStats.end - tr.perfStats.start) : 0;
        const output = tr.failureMessage || '';
        const rec = { file, success, duration, output, stdout: '', stderr: '' };
        if (rec.success) this.passedTests++; else this.failedTests++;
        this.testResults.push(rec);
        this.printTestResult(rec);
      }
    } catch (err) {
      const msg = (err && (err.stack || err.message)) || 'Jest API run error';
      console.error(msg);
      this.failedTests++;
    }
    if (this.failedTests > 0) this.generateDebugFile();
    this.printSummary();
    process.exit(this.failedTests > 0 ? 1 : 0);
  }

  // Print colored status indicator
  printStatus(success, text) {
    const indicator = success ? `${colors.green}${colors.bold}✓${colors.reset}` : `${colors.red}${colors.bold}✗${colors.reset}`;
    console.log(`${indicator} ${text}`);
  }

  // Print test file result
  printTestResult(result) {
    const { file, success, duration } = result;
    const durationText = `${colors.dim}(${duration}ms)${colors.reset}`;
    const fileText = `${colors.cyan}${file}${colors.reset}`;
    this.printStatus(success, `${fileText} ${durationText}`);
    if (!success && result.output) {
      const lines = result.output.split('\n');
      lines.forEach(line => { if (line.trim()) console.log(`  ${colors.dim}${line}${colors.reset}`); });
    }
  }

  // Generate debug file for failed tests
  generateDebugFile() {
    const failedResults = this.testResults.filter(r => !r.success);
    if (failedResults.length === 0) return;
    // Allow CI/tests to suppress creating a repo-root debug artifact when undesired
    if (this.isEnvTruthy('QTESTS_SUPPRESS_DEBUG') || this.isEnvTruthy('QTESTS_NO_DEBUG_FILE')) {
      return;
    }
    // Allow overriding the debug file output path to avoid cross-test interference
    const debugFilePath = (process.env.QTESTS_DEBUG_FILE && String(process.env.QTESTS_DEBUG_FILE).trim()) || 'DEBUG_TESTS.md';
    let debugContent = '# Test Failure Analysis\n\n';
    debugContent += 'Analyze and address the following test failures:\n\n';
    failedResults.forEach((result, index) => {
      debugContent += `## Failed Test ${index + 1}: ${result.file}\n\n`;
      debugContent += '### Output:\n';
      debugContent += '```\n';
      debugContent += result.output;
      debugContent += '\n```\n\n';
      debugContent += `### Duration: ${result.duration}ms\n\n`;
      debugContent += '---\n\n';
    });
    debugContent += '## Summary\n\n';
    debugContent += `- Total failed tests: ${failedResults.length}\n`;
    debugContent += `- Failed test files: ${failedResults.map(r => r.file).join(', ')}\n`;
    debugContent += `- Generated: ${new Date().toISOString()}\n`;
    try {
      fs.writeFileSync(debugFilePath, debugContent);
    } catch {
      // Best-effort; ignore write errors in restricted environments
    }
    if (!this.isEnvTruthy('QTESTS_SILENT')) {
      console.log(`\n${colors.yellow}📋 Debug file created: ${debugFilePath}${colors.reset}`);
    }
  }

  // Print comprehensive summary
  printSummary() {
    const duration = Date.now() - this.startTime;
    const totalFiles = this.testResults.length;
    console.log(`\n${colors.bold}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.white}           TEST SUMMARY${colors.reset}`);
    console.log(`${colors.bold}═══════════════════════════════════════${colors.reset}`);
    const allPassed = this.failedTests === 0;
    const statusColor = allPassed ? colors.green : colors.red;
    const statusText = allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED';
    console.log(`${statusColor}${colors.bold}${statusText}${colors.reset}\n`);
    console.log(`${colors.green}✓ Passed:${colors.reset} ${colors.bold}${this.passedTests}${colors.reset}`);
    console.log(`${colors.red}✗ Failed:${colors.reset} ${colors.bold}${this.failedTests}${colors.reset}`);
    console.log(`${colors.blue}📁 Files:${colors.reset} ${colors.bold}${totalFiles}${colors.reset}`);
    console.log(`${colors.magenta}⏱  Duration:${colors.reset} ${colors.bold}${duration}ms${colors.reset}`);
    if (this.failedTests > 0) {
      console.log(`\n${colors.red}Failed test files:${colors.reset}`);
      this.testResults.filter(r => !r.success).forEach(r => console.log(`  ${colors.red}•${colors.reset} ${r.file}`));
    }
    console.log(`\n${colors.bold}═══════════════════════════════════════${colors.reset}`);
  }

  // Main runner method - API-only execution via jest.runCLI
  async run() {
    if (!this.isEnvTruthy('QTESTS_SILENT')) {
      console.log(`${colors.bold}${colors.blue}🧪 qtests Test Runner - API Mode${colors.reset}`);
      console.log(`${colors.dim}Discovering and running all tests...\n${colors.reset}`);
    }
    const files = this.discoverTests();
    if (files.length === 0) {
      if (!this.isEnvTruthy('QTESTS_SILENT')) {
        console.log(`${colors.yellow}⚠  No test files found${colors.reset}`);
        console.log(`${colors.dim}Looked for files matching: ${TEST_PATTERNS.map(p => p.toString()).join(', ')}${colors.reset}`);
      }
      process.exit(0);
    }
    if (!this.isEnvTruthy('QTESTS_SILENT')) {
      console.log(`${colors.blue}Found ${files.length} test file(s):${colors.reset}`);
      files.forEach(file => console.log(`  ${colors.dim}•${colors.reset} ${file}`));
      console.log(``);
    }
    await this.runAll(files);
  }
}

// Run the test suite
const runner = new TestRunner();
runner.run().catch(error => {
  console.error(`${colors.red}Test runner error:${colors.reset}`, error);
  process.exit(1);
});
