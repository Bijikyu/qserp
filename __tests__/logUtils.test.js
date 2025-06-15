// Summary: logUtils.test.js validates module behavior and edge cases
const { mockConsole } = require('./utils/consoleSpies'); //import helper for spies

// CONSOLIDATION: logUtils functionality moved to debugUtils for DRY compliance
const { logStart, logReturn } = require('../lib/debugUtils'); //functions under test

describe('log utils', () => { //group log utility tests
  test('logStart outputs expected message', () => { //verify logStart format
    const spy = mockConsole('log'); //spy on console.log
    logStart('fn', 'details'); //invoke logStart
    expect(spy).toHaveBeenCalledWith('fn is running with details'); //check message
    spy.mockRestore(); //restore console.log
  });

  test('logReturn outputs expected message', () => { //verify logReturn format
    const spy = mockConsole('log'); //spy on console.log
    logReturn('fn', 'result'); //invoke logReturn
    expect(spy).toHaveBeenCalledWith('fn returning result'); //check message
    spy.mockRestore(); //restore console.log
  });
});
