// Summary: minLogger.test.js validates module behavior and edge cases
const { mockConsole } = require('./utils/consoleSpies'); //reuse console spy helper
const { saveEnv, restoreEnv } = require('./utils/testSetup'); //env helpers

describe('minLogger', () => { // minLogger
  let savedEnv; //snapshot holder
  beforeEach(() => { savedEnv = saveEnv(); }); // take env snapshot so log level changes don't pollute other tests
  afterEach(() => { restoreEnv(savedEnv); }); // restore snapshot to prevent cross-test leakage

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

  test('silences output when LOG_LEVEL silent', () => { //no output expected
    process.env.LOG_LEVEL = 'silent'; //activate silent mode
    const warnSpy = mockConsole('warn'); //spy console.warn
    const errorSpy = mockConsole('error'); //spy console.error
    const { logWarn, logError } = require('../lib/minLogger'); //import funcs
    logWarn('x'); //call warn
    logError('y'); //call error
    expect(warnSpy).not.toHaveBeenCalled(); //warn suppressed
    expect(errorSpy).not.toHaveBeenCalled(); //error suppressed
    warnSpy.mockRestore(); //restore warn
    errorSpy.mockRestore(); //restore error
  });

  test('invalid LOG_LEVEL disables output', () => { //unknown should mute
    process.env.LOG_LEVEL = 'unknown'; //set invalid level
    const warnSpy = mockConsole('warn'); //spy console.warn
    const errorSpy = mockConsole('error'); //spy console.error
    const { logWarn, logError } = require('../lib/minLogger'); //import funcs
    logWarn('x'); //call warn
    logError('y'); //call error
    expect(warnSpy).not.toHaveBeenCalled(); //warn suppressed
    expect(errorSpy).not.toHaveBeenCalled(); //error suppressed
    warnSpy.mockRestore(); //restore warn
    errorSpy.mockRestore(); //restore error
  });

  test('console.log not called when silent', () => { //verify trace suppression
    process.env.LOG_LEVEL = 'silent'; //force silent mode
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); //direct spy to avoid helper noise
    const { logWarn } = require('../lib/minLogger'); //import warn for check
    logWarn('trace'); //execute warn
    expect(logSpy).not.toHaveBeenCalled(); //console.log should be muted
    logSpy.mockRestore(); //cleanup spy
  });

  test('trims trailing space on warn level', () => { //ensure whitespace is ignored
    process.env.LOG_LEVEL = 'warn '; //set level with trailing space
    const spy = mockConsole('warn'); //spy on console.warn
    const { logWarn } = require('../lib/minLogger'); //import function
    logWarn('b'); //call logger
    expect(spy).toHaveBeenCalledWith('b'); //should log despite space
    spy.mockRestore(); //cleanup spy
  });

  test('trims spaces on error level', () => { //error level should still suppress warn
    process.env.LOG_LEVEL = ' error '; //level with spaces around
    const warnSpy = mockConsole('warn'); //spy console.warn
    const errorSpy = mockConsole('error'); //spy console.error
    const { logWarn, logError } = require('../lib/minLogger'); //import funcs
    logWarn('x'); //call warn
    logError('y'); //call error
    expect(warnSpy).not.toHaveBeenCalled(); //warn suppressed due to level
    expect(errorSpy).toHaveBeenCalledWith('y'); //error logged despite spaces
    warnSpy.mockRestore(); //cleanup warn spy
    errorSpy.mockRestore(); //cleanup error spy
  });

  test('logs object input as JSON string', () => { //object serialization check
    process.env.LOG_LEVEL = 'warn'; //allow warnings
    const spy = mockConsole('warn'); //spy console.warn
    const { logWarn } = require('../lib/minLogger'); //import function
    const obj = { a: 1 }; //sample object
    logWarn(obj); //call logger with object
    expect(spy).toHaveBeenCalledWith(JSON.stringify(obj)); //should log as string
    spy.mockRestore(); //cleanup
  });
});
