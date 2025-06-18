// Summary: perf-analysis.test.js ensures the performance script runs and logs its summary output //added descriptive summary
const { mockConsole } = require('./utils/consoleSpies');
const { saveEnv, restoreEnv, setTestEnv } = require('./utils/testSetup');

describe('perf-analysis script', () => {
  let savedEnv;
  let logSpy;

  beforeEach(() => {
    savedEnv = saveEnv(); //snapshot env for restoration
    setTestEnv(); //ensure required env vars present
    process.env.CODEX = 'true'; //offline mode for deterministic test
    jest.resetModules(); //reset module cache
    logSpy = mockConsole('log'); //capture console.log output
  });

  afterEach(() => {
    logSpy.mockRestore(); //restore console.log
    restoreEnv(savedEnv); //restore original env
  });

  test('cachePerformanceTest runs and logs summary', async () => {
    const { cachePerformanceTest } = require('../perf-analysis.js');
    await expect(cachePerformanceTest()).resolves.toBeUndefined();
    const logs = logSpy.mock.calls.map(c => c[0]);
    expect(logs.some(l => l.includes('=== Cache Performance Analysis ==='))).toBe(true); //verify start log
    expect(logs.some(l => l.includes('=== Performance Analysis Complete ==='))).toBe(true); //verify end log
  });
});
