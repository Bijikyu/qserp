// Summary: minLogger.test.js validates module behavior and edge cases
const { mockConsole } = require('./utils/consoleSpies'); //reuse console spy helper
const { saveEnv, restoreEnv } = require('./utils/testSetup'); //env helpers
const fs = require('fs'); //fs for dynamic loading
const vm = require('vm'); //vm to evaluate module code
const path = require('path'); //path for file resolution

// Helper loads internal shouldLog using vm to mimic rewire
function loadShouldLog() {
  const code = fs.readFileSync(path.join(__dirname, '../lib/minLogger.js'), 'utf8'); //read module
  const context = { module: { exports: {} }, exports: {}, require, process, console }; //sandbox
  vm.runInNewContext(code, context); //execute code in sandbox
  return context.shouldLog; //return internal function
}

describe('minLogger', () => { // minLogger
  let savedEnv; //snapshot holder
  beforeEach(() => { savedEnv = saveEnv(); }); //store env
  afterEach(() => { restoreEnv(savedEnv); }); //restore env

  test('logWarn respects LOG_LEVEL warn', () => { //warn should log
    process.env.LOG_LEVEL = 'warn'; //set level
    const spy = mockConsole('warn'); //spy on console.warn
    const { logWarn } = require('../lib/minLogger'); //import function
    logWarn('a'); //call logger
    expect(spy).toHaveBeenCalledWith('a'); //should log
    spy.mockRestore(); //cleanup spy
  });

  test('logWarn suppressed when LOG_LEVEL error', () => { //warn not logged
    process.env.LOG_LEVEL = 'error'; //error only
    const spy = mockConsole('warn'); //spy on console.warn
    const { logWarn } = require('../lib/minLogger'); //import function
    logWarn('a'); //call logger
    expect(spy).not.toHaveBeenCalled(); //should not log
    spy.mockRestore(); //cleanup
  });

  test('logError always logs at error level', () => { //error should log
    process.env.LOG_LEVEL = 'warn'; //level permits error
    const spy = mockConsole('error'); //spy on console.error
    const { logError } = require('../lib/minLogger'); //import function
    logError('bad'); //call logger
    expect(spy).toHaveBeenCalledWith('bad'); //should log
    spy.mockRestore(); //cleanup
  });

  test('shouldLog returns false for invalid level', () => { //verify invalid input
    const shouldLog = loadShouldLog(); //get internal function
    const result = shouldLog('invalid'); //call with bad level
    expect(result).toBe(false); //should default to false
  });

  test('shouldLog defaults to info when env invalid', () => { //fallback env test
    process.env.LOG_LEVEL = 'bogus'; //set invalid env level
    const shouldLog = loadShouldLog(); //load internal fn
    const result = shouldLog('warn'); //warn compared to info fallback
    expect(result).toBe(true); //warn allowed when fallback info
  });

  test('logWarn returns false when console.warn throws', () => { //failure path
    process.env.LOG_LEVEL = 'warn'; //permit warn
    const { logWarn } = require('../lib/minLogger'); //import function
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => { throw new Error('fail'); }); //force error
    const result = logWarn('boom'); //call logger expecting false
    expect(result).toBe(false); //should report failure
    spy.mockRestore(); //cleanup spy
  });
});
