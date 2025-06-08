const { createQerrorsMock } = require('./utils/testSetup'); //import qerrors mock helper

const { safeRun } = require('../lib/utils'); //import function under test

describe('safeRun', () => { //group safeRun tests
  test('returns result when function succeeds', async () => { //success branch
    const qerrors = createQerrorsMock(); //reset qerrors mock
    const fn = jest.fn(() => 5); //mock function returning value
    const res = safeRun('testFn', fn, 0, { a: 1 }); //execute safeRun
    await new Promise(setImmediate); //wait for async qerrors
    expect(res).toBe(5); //should return fn result
    expect(fn).toHaveBeenCalled(); //function called
    expect(qerrors).not.toHaveBeenCalled(); //qerrors unused
  });

  test('returns default value and logs error when function throws', async () => { //failure branch
    const qerrors = createQerrorsMock(); //reset qerrors mock
    const fn = jest.fn(() => { throw new Error('fail'); }); //mock throwing fn
    const res = safeRun('badFn', fn, 1, { b: 2 }); //execute safeRun
    await new Promise(setImmediate); //wait for async qerrors
    expect(res).toBe(1); //should return fallback
    expect(fn).toHaveBeenCalled(); //function called
    expect(qerrors).toHaveBeenCalledWith(expect.any(Error), 'badFn error', { b: 2 }); //qerrors invoked
  });

  test('does not call qerrors when QERRORS_DISABLE is set', async () => { //new disable check
    process.env.QERRORS_DISABLE = '1'; //set flag
    const qerrors = createQerrorsMock(); //reset qerrors mock
    const fn = jest.fn(() => { throw new Error('fail'); }); //mock throwing fn
    const res = safeRun('badFn', fn, 1, {}); //execute safeRun
    await new Promise(setImmediate); //wait for async qerrors
    expect(res).toBe(1); //should return fallback
    expect(qerrors).not.toHaveBeenCalled(); //qerrors bypassed
    delete process.env.QERRORS_DISABLE; //cleanup flag
  });
});
