// Summary: minLogger.test.js validates module behavior and edge cases
const { mockConsole } = require('./utils/consoleSpies'); //reuse console spy helper
const { saveEnv, restoreEnv } = require('./utils/testSetup'); //env helpers

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
});
