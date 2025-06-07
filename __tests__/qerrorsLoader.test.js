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
