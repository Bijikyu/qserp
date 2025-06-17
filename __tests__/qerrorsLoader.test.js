// Summary: qerrorsLoader.test.js validates module behavior and edge cases
describe('loadQerrors', () => { //group loader tests
  test('returns default exported function', () => { //test default export shape
    jest.isolateModules(() => { //isolate module for mocking
      jest.doMock('qerrors', () => jest.fn(() => 'def')); //mock module as function
      const loadQerrors = require('../lib/qerrorsLoader'); //import loader after mock
      const fn = loadQerrors(); //invoke loader
      expect(fn()).toBe('def'); //returned function works
    });
  });

  test('returns named qerrors export', () => { //test named property shape
    jest.isolateModules(() => { //isolate module for mocking
      const qf = jest.fn(() => 'named'); //mock function
      jest.doMock('qerrors', () => ({ qerrors: qf })); //mock module object
      const loadQerrors = require('../lib/qerrorsLoader'); //import loader
      const fn = loadQerrors(); //invoke loader
      expect(fn()).toBe('named'); //returned function works
    });
  });

  test('returns default property export', () => { //test default property shape
    jest.isolateModules(() => { //isolate module for mocking
      const df = jest.fn(() => 'prop'); //mock function
      jest.doMock('qerrors', () => ({ default: df })); //mock module object
      const loadQerrors = require('../lib/qerrorsLoader'); //import loader
      const fn = loadQerrors(); //invoke loader
      expect(fn()).toBe('prop'); //returned function works
    });
  });

  test('throws when export is not function', () => { //invalid export should throw
    jest.isolateModules(() => { //isolate module for mocking
      jest.doMock('qerrors', () => ({ qerrors: 'bad' })); //mock bad export shape
      const loadQerrors = require('../lib/qerrorsLoader'); //import loader
      expect(loadQerrors).toThrow('qerrors module does not export a callable function'); //assert error message
    });
  });
});

describe('createCompatible', () => { //validate compatibility wrapper
  test('converts string error and forwards', () => { //string input becomes Error
    jest.isolateModules(() => { //isolate per test
      const qerr = jest.fn(); //mock qerrors
      jest.doMock('qerrors', () => qerr); //replace dependency
      const { createCompatible } = require('../lib/qerrorsLoader'); //import creator
      const wrap = createCompatible(); //build wrapped fn
      wrap('oops', 'ctx', { extra: 1 }); //invoke with string
      const arg = qerr.mock.calls[0][0]; //capture first arg
      expect(arg).toBeInstanceOf(Error); //should convert
      expect(arg.message).toBe('oops'); //preserve message
      expect(qerr).toHaveBeenCalledWith(arg, 'ctx', { extra: 1 }); //forward args
    });
  });

  test('passes Error instance through', () => { //existing Error unchanged
    jest.isolateModules(() => { //isolate per test
      const qerr = jest.fn(); //mock qerrors
      jest.doMock('qerrors', () => qerr); //replace dependency
      const { createCompatible } = require('../lib/qerrorsLoader'); //import creator
      const wrap = createCompatible(); //build wrapped fn
      const err = new Error('boom'); //prepare error
      wrap(err, 'ctx2'); //call with Error
      expect(qerr).toHaveBeenCalledWith(err, 'ctx2', {}); //expect same object
    });
  });
});
describe('safeQerrors', () => { //new tests for sanitized logging
  test('logStart omits error message', async () => { // logStart omits error message
    let safeQerrors, spy, mockConsole;
    jest.isolateModules(() => { //isolate module for mocking
      const qerr = jest.fn(); //mock qerrors
      jest.doMock('qerrors', () => qerr); //provide mock implementation
      ({ safeQerrors } = require('../lib/qerrorsLoader')); //load function
      ({ mockConsole } = require('./utils/consoleSpies')); //import helper
      spy = mockConsole('log'); //spy on console.log
    });
    await safeQerrors(new Error('secret'), 'ctx'); //invoke with error
    expect(spy).toHaveBeenCalledWith('safeQerrors is running with ctx'); //should log generic context only
    spy.mockRestore(); //cleanup spy
  });

  test('fallback logs sanitized message', async () => { // fallback logs sanitized message
    let safeQerrors, spy, mockConsole;
    jest.isolateModules(() => { //isolate module for mocking
      const qerr = jest.fn(() => { throw new Error('fail'); }); //mock throwing
      jest.doMock('qerrors', () => qerr); //mock module
      ({ safeQerrors } = require('../lib/qerrorsLoader')); //load function
      ({ mockConsole } = require('./utils/consoleSpies')); //console helper
      spy = mockConsole('error'); //spy on console.error
    });
    await safeQerrors(new Error('bad\nline'), 'ctx'); //invoke with newline
    const joined = spy.mock.calls.map(c => c.join(' ')).join(' '); //aggregate output
    expect(joined).not.toMatch(/\n/); //newline should be removed
    spy.mockRestore(); //cleanup
  });

  test('fallback masks api key in logs', async () => { // verify key never logged
    let safeQerrors, errSpy, logSpy, mockConsole;
    const savedKey = process.env.GOOGLE_API_KEY; //preserve existing key
    process.env.GOOGLE_API_KEY = 'key'; //set test key
    jest.isolateModules(() => { //isolate module for mocking
      const qerr = jest.fn(() => { throw new Error('fail key'); }); //mock throwing with key
      jest.doMock('qerrors', () => qerr); //mock qerrors dependency
      ({ safeQerrors } = require('../lib/qerrorsLoader')); //load function under test
      ({ mockConsole } = require('./utils/consoleSpies')); //console spy helper
      errSpy = mockConsole('error'); //intercept error logs
      logSpy = mockConsole('log'); //intercept logStart output
    });
    await safeQerrors(new Error('bad key'), 'ctx key'); //invoke with key in inputs
    const errOut = errSpy.mock.calls.map(c => c.join(' ')).join(' '); //aggregate error logs
    const logOut = logSpy.mock.calls.map(c => c.join(' ')).join(' '); //aggregate logStart logs
    expect(errOut).not.toMatch('key'); //raw api key should not appear in errors
    expect(logOut).not.toMatch('key'); //raw api key should not appear in logs
    expect(logOut).toMatch('safeQerrors is running with ctx [redacted]'); //context sanitized in logStart
    errSpy.mockRestore(); //cleanup error spy
    logSpy.mockRestore(); //cleanup log spy
    if (savedKey !== undefined) { process.env.GOOGLE_API_KEY = savedKey; } else { delete process.env.GOOGLE_API_KEY; } //restore key
  });

  test('returns false when thrown value lacks message', async () => { //non-Error input should not crash
    jest.resetModules(); //reset module cache for clean mocks
    let safeQerrors;
    jest.isolateModules(() => { //isolate module for mocking
      const qerr = jest.fn(() => { throw new Error('fail'); }); //mock qerrors that fails
      jest.doMock('qerrors', () => qerr); //replace dependency
      ({ safeQerrors } = require('../lib/qerrorsLoader')); //load function under test
    });
    const result = await safeQerrors({ bad: true }, 'ctx'); //object without message
    expect(result).toBe(false); //should return false rather than throw
  });
});

describe('sanitizeApiKey', () => { //verify key masking logic
  test('keeps words containing key intact', () => { //word with key should remain
    const savedKey = process.env.GOOGLE_API_KEY; //save environment key
    process.env.GOOGLE_API_KEY = 'key'; //set predictable key for test
    jest.resetModules(); //reload module with new key
    let sanitizeApiKey;
    jest.isolateModules(() => { //isolate to avoid cache interference
      ({ sanitizeApiKey } = require('../lib/qerrorsLoader')); //import function
    });
    const result = sanitizeApiKey('monkey key keyhole'); //call sanitizer
    expect(result).toBe('monkey [redacted] keyhole'); //only actual key masked
    if (savedKey !== undefined) { process.env.GOOGLE_API_KEY = savedKey; } else { delete process.env.GOOGLE_API_KEY; } //restore key
  });

  test('logs when DEBUG true', () => { //ensure conditional logging on
    const savedDebug = process.env.DEBUG; //preserve debug flag
    process.env.DEBUG = 'true'; //enable logging
    jest.resetModules(); //reload modules for debug flag
    const logSpy = require('./utils/consoleSpies').mockConsole('log'); //spy log output
    const { setTestEnv } = require('./utils/testSetup'); //env helper
    setTestEnv(); //ensure key present
    logSpy.mockClear(); //clear setup logs
    const { sanitizeApiKey } = require('../lib/qerrorsLoader'); //load sanitized fn
    logSpy.mockClear(); //clear module logs
    const result = sanitizeApiKey('pre key post'); //invoke with key
    expect(result).toBe('pre [redacted] post'); //sanitization works
    expect(logSpy).toHaveBeenNthCalledWith(1, 'sanitizeApiKey is running with pre [redacted] post'); //start log
    expect(logSpy).toHaveBeenNthCalledWith(2, 'sanitizeApiKey returning pre [redacted] post'); //end log
    logSpy.mockRestore(); //cleanup spy
    if (savedDebug !== undefined) { process.env.DEBUG = savedDebug; } else { delete process.env.DEBUG; } //restore flag
  });

  test('silent when DEBUG false', () => { //logging disabled
    const savedDebug = process.env.DEBUG; //preserve debug flag
    process.env.DEBUG = 'false'; //disable logging
    jest.resetModules(); //reload modules for flag
    const logSpy = require('./utils/consoleSpies').mockConsole('log'); //spy log
    const { setTestEnv } = require('./utils/testSetup'); //env helper
    setTestEnv(); //set api key
    logSpy.mockClear(); //ignore setup
    const { sanitizeApiKey } = require('../lib/qerrorsLoader'); //require module
    logSpy.mockClear(); //ignore module logs
    sanitizeApiKey('key'); //call expecting no log
    expect(logSpy).not.toHaveBeenCalled(); //should be silent
    logSpy.mockRestore(); //cleanup spy
    if (savedDebug !== undefined) { process.env.DEBUG = savedDebug; } else { delete process.env.DEBUG; } //restore flag
  });
});
