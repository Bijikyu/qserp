const { createQerrorsMock } = require('./utils/testSetup'); //import qerrors mock helper

const { safeRun } = require('../lib/utils'); //import function under test

describe('safeRun', () => { //group safeRun tests
  test('returns result when function succeeds', () => { //success branch
    const qerrors = createQerrorsMock(); //reset qerrors mock
    const fn = jest.fn(() => 5); //mock function returning value
    const res = safeRun('testFn', fn, 0, { a: 1 }); //execute safeRun
    expect(res).toBe(5); //should return fn result
    expect(fn).toHaveBeenCalled(); //function called
    expect(qerrors).not.toHaveBeenCalled(); //qerrors unused
  });

  test('returns default value and logs error when function throws', () => { //failure branch
    const qerrors = createQerrorsMock(); //reset qerrors mock
    const fn = jest.fn(() => { throw new Error('fail'); }); //mock throwing fn
    const res = safeRun('badFn', fn, 1, { b: 2 }); //execute safeRun
    expect(res).toBe(1); //should return fallback
    expect(fn).toHaveBeenCalled(); //function called
    expect(qerrors).toHaveBeenCalledWith(expect.any(Error), 'badFn error', { b: 2 }); //qerrors invoked
  });

  test('loads qerrors only on first error', () => { //new lazy loading check
    jest.isolateModules(() => { //isolate module for clean cache
      const qMock = jest.fn(); //create jest mock for qerrors
      const loaderMock = jest.fn(() => qMock); //mock loader to return qerrors
      jest.doMock('../lib/qerrorsLoader', () => loaderMock); //mock loader path
      const { safeRun: sr } = require('../lib/utils'); //import after mocks
      sr('ok', () => 1, 0); //successful run shouldn't invoke qerrors
      expect(loaderMock).not.toHaveBeenCalled(); //loader unused
      sr('bad', () => { throw new Error('fail'); }, 0); //trigger error
      expect(loaderMock).toHaveBeenCalledTimes(1); //loader called on error
      expect(qMock).toHaveBeenCalledTimes(1); //qerrors called once
    });
  });
});
