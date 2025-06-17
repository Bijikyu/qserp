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
    let safeQerrors, spy, mockConsole;
    const savedKey = process.env.GOOGLE_API_KEY; //preserve existing key
    process.env.GOOGLE_API_KEY = 'key'; //set test key
    jest.isolateModules(() => { //isolate module for mocking
      const qerr = jest.fn(() => { throw new Error('fail key'); }); //mock throwing with key
      jest.doMock('qerrors', () => qerr); //mock qerrors dependency
      ({ safeQerrors } = require('../lib/qerrorsLoader')); //load function under test
      ({ mockConsole } = require('./utils/consoleSpies')); //console spy helper
      spy = mockConsole('error'); //intercept error logs
    });
    await safeQerrors(new Error('bad key'), 'ctx key'); //invoke with key in inputs
    const output = spy.mock.calls.map(c => c.join(' ')).join(' '); //aggregate logs
    expect(output).not.toMatch('key'); //raw api key should not appear
    spy.mockRestore(); //cleanup
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
