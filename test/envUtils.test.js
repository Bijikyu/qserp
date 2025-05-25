const assert = require('assert'); //(added assert for test assertions)
const Module = require('module'); //(added to allow mocking of qerrors)

const originalRequire = Module.prototype.require; //(added original require backup)
Module.prototype.require = function(request) { //(added require override for mocking)
  if (request === 'qerrors') { //(added condition to intercept qerrors)
    return () => {}; //(added stub function return)
  }
  return originalRequire.apply(this, arguments); //(added fallback to original require)
};

const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //(added env utils import)
Module.prototype.require = originalRequire; //(added restore of require)

const originalEnv = { ...process.env }; //(added backup of environment)

function resetEnv() { //(added helper to reset env)
  process.env = { ...originalEnv }; //(added restoration logic)
}

function testAllPresent() { //(added test for all vars present)
  resetEnv(); //(added env reset call)
  process.env.A = '1'; //(added test variable A)
  process.env.B = '2'; //(added test variable B)

  assert.deepStrictEqual(getMissingEnvVars(['A','B']), []); //(added assertion for no missing vars)
  assert.doesNotThrow(() => throwIfMissingEnvVars(['A','B'])); //(added ensure no throw)
  const warned = warnIfMissingEnvVars(['A','B'], 'warn'); //(added call to warnIfMissingEnvVars)
  assert.strictEqual(warned, true); //(added assertion for true return)
}

function testSomeMissing() { //(added test for some vars missing)
  resetEnv(); //(added env reset call)
  process.env.A = '1'; //(added variable A only)
  delete process.env.B; //(added ensure B missing)

  assert.deepStrictEqual(getMissingEnvVars(['A','B']), ['B']); //(added assertion for B missing)
  assert.doesNotThrow(() => throwIfMissingEnvVars(['A','B'])); //(added ensure no throw even if missing)
  let warnCalled = false; //(added flag to check console.warn)
  const originalWarn = console.warn; //(added backup of console.warn)
  console.warn = () => { warnCalled = true; }; //(added override to capture warn)
  const warned = warnIfMissingEnvVars(['A','B'], 'warn'); //(added call expecting warn)
  console.warn = originalWarn; //(added restore of console.warn)
  assert.strictEqual(warnCalled, true); //(added assertion that warn was called)
  assert.strictEqual(warned, false); //(added assertion for false return)
}

function testErrorHandling() { //(added test for error handling)
  resetEnv(); //(added env reset call)

  assert.deepStrictEqual(getMissingEnvVars(undefined), []); //(added assertion for error path)
  assert.doesNotThrow(() => throwIfMissingEnvVars(undefined)); //(added ensure no throw on error)
  const warned = warnIfMissingEnvVars(undefined, 'warn'); //(added call expecting true)
  assert.strictEqual(warned, true); //(added assertion for true return because error handled)
}

try { //(added try block for test runner)
  testAllPresent(); //(added run of all present test)
  testSomeMissing(); //(added run of some missing test)
  testErrorHandling(); //(added run of error handling test)
  console.log('envUtils tests passed'); //(added success log)
} catch (error) { //(added catch for failures)
  console.error('envUtils tests failed', error); //(added error log)
  process.exit(1); //(added exit failure)
}
