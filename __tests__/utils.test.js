// Summary: utils.test.js validates module behavior and edge cases
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

  test('does not log when DEBUG false', () => { //verify debug gating
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); //spy on console.log
    delete process.env.DEBUG; //ensure debug flag unset
    jest.resetModules(); //reload modules to pick up env change
    const { safeRun } = require('../lib/utils'); //re-import after reset
    const fn = jest.fn(() => 1); //simple function
    const before = logSpy.mock.calls.length; //record initial log count
    safeRun('noLog', fn, 0); //call expecting no logs
    expect(logSpy.mock.calls.length).toBe(before); //no additional logs when debug off
    logSpy.mockRestore(); //restore console.log
  });
});
