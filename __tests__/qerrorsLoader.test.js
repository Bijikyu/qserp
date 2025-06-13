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

describe('safeQerrors', () => { //new tests for sanitized logging
  test('logStart omits error message', () => {
    jest.isolateModules(() => { //isolate module for mocking
      const qerr = jest.fn(); //mock qerrors
      jest.doMock('qerrors', () => qerr); //provide mock implementation
      const { safeQerrors } = require('../lib/qerrorsLoader'); //load function
      const { mockConsole } = require('./utils/consoleSpies'); //console spy helper
      const spy = mockConsole('log'); //spy on console.log
      safeQerrors(new Error('secret'), 'ctx'); //invoke with error
      expect(spy).toHaveBeenCalledWith('safeQerrors is running with ctx'); //should log generic context only
      spy.mockRestore(); //cleanup spy
    });
  });

  test('fallback logs sanitized message', () => {
    jest.isolateModules(() => { //isolate module for mocking
      const qerr = jest.fn(() => { throw new Error('fail'); }); //mock throwing
      jest.doMock('qerrors', () => qerr); //mock module
      const { safeQerrors } = require('../lib/qerrorsLoader'); //load function
      const { mockConsole } = require('./utils/consoleSpies'); //console helper
      const spy = mockConsole('error'); //spy on console.error
      safeQerrors(new Error('bad\nline'), 'ctx'); //invoke with newline
      const joined = spy.mock.calls.map(c => c.join(' ')).join(' '); //aggregate output
      expect(joined).not.toMatch(/\n/); //newline should be removed
      spy.mockRestore(); //cleanup
    });
  });
});
