// Summary: utils.test.js validates module behavior and edge cases
const { createQerrorsMock } = require('./utils/testSetup'); //import qerrors mock helper

describe('safeRun', () => { //group safeRun tests
  test('returns result when function succeeds', async () => { //success branch
    let safeRun;
    let safeSpy;
    let qerrors;
    jest.isolateModules(() => {
      const qerrorsLoader = require('../lib/qerrorsLoader'); //load loader for spy setup
      safeSpy = jest.spyOn(qerrorsLoader, 'safeQerrors'); //spy on safeQerrors
      safeRun = require('../lib/utils').safeRun; //load function under test
      qerrors = createQerrorsMock(); //reset qerrors mock after module load
    });
    const fn = jest.fn(() => 5); //mock function returning value
    const res = await safeRun('testFn', fn, 0, { a: 1 }); //execute safeRun asynchronously
    expect(res).toBe(5); //should return fn result
    expect(fn).toHaveBeenCalled(); //function called
    expect(safeSpy).not.toHaveBeenCalled(); //safeQerrors unused
    expect(qerrors).not.toHaveBeenCalled(); //qerrors unused
  });

  test('returns default value and logs error when function throws', async () => { //failure branch
    let safeRun;
    let safeSpy;
    let qerrors;
    jest.isolateModules(() => {
      const qerrorsLoader = require('../lib/qerrorsLoader'); //load loader for spy
      safeSpy = jest.spyOn(qerrorsLoader, 'safeQerrors'); //spy on wrapper
      safeRun = require('../lib/utils').safeRun; //load function under test
      qerrors = createQerrorsMock(); //reset qerrors mock after load
    });
    const fn = jest.fn(() => { throw new Error('fail'); }); //mock throwing fn
    const res = await safeRun('badFn', fn, 1, { b: 2 }); //execute safeRun asynchronously
    expect(res).toBe(1); //should return fallback
    expect(fn).toHaveBeenCalled(); //function called
    expect(safeSpy).toHaveBeenCalledWith(expect.any(Error), 'badFn error', { b: 2 }); //wrapper invoked
  });

  test('does not log when DEBUG false', async () => { //verify debug gating
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); //spy on console.log
    delete process.env.DEBUG; //ensure debug flag unset
    jest.resetModules(); //reload modules to pick up env change
    const { safeRun } = require('../lib/utils'); //re-import after reset
    const fn = jest.fn(() => 1); //simple function
    const before = logSpy.mock.calls.length; //record initial log count
    await safeRun('noLog', fn, 0); //call expecting no logs
    expect(logSpy.mock.calls.length).toBe(before); //no additional logs when debug off
    logSpy.mockRestore(); //restore console.log
  });
});
