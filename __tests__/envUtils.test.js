// Summary: envUtils.test.js validates module behavior and edge cases
let qerrors; //holds mock loaded after reset (setup in testSetup)
const { saveEnv, restoreEnv } = require('./utils/testSetup'); //import env helpers //(new utilities)
const { mockConsole } = require('./utils/consoleSpies'); //added console spy helper

describe('envUtils', () => { //wrap all env util tests //(use describe as requested)
  let warnSpy; //declare warn spy //(track minLogger warn)
  let errorSpy; //declare error spy //(track minLogger error)

  let savedEnv; //holder for env snapshot //(for restoration)
  beforeEach(() => { //prepare each test //(reset env and mocks)
    savedEnv = saveEnv(); //capture current env //(using util)
    jest.resetModules(); //reload modules so env vars re-evaluated //(ensures clean require)
    qerrors = require('qerrors'); //re-acquire mock after module reset
    const minLogger = require('../lib/minLogger'); //import logger after reset
    warnSpy = jest.spyOn(minLogger, 'logWarn').mockImplementation(() => {}); //spy warn
    errorSpy = jest.spyOn(minLogger, 'logError').mockImplementation(() => {}); //spy error
  });

  afterEach(() => { //cleanup after each test //(restore settings)
    restoreEnv(savedEnv); //reset environment after test //(using util)
    warnSpy.mockRestore(); //restore logWarn spy //(remove spy)
    errorSpy.mockRestore(); //restore logError spy //(remove spy)
    jest.clearAllMocks(); //clear any mock usage //(reset mock counts)
  });

  test('handles all variables present', () => { //verify no missing vars //(first case)
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh //(ensure env captured)
    process.env.A = '1'; //define env A //(setup)
    process.env.B = '2'; //define env B //(setup)
    expect(getMissingEnvVars(['A', 'B'])).toEqual([]); //should find none missing //(assert)
    expect(throwIfMissingEnvVars(['A', 'B'])).toEqual([]); //should return empty //(assert)
    expect(warnIfMissingEnvVars(['A', 'B'], 'warn')).toBe(true); //should not warn //(assert)
    expect(warnSpy).not.toHaveBeenCalled(); //warn not called //(check)
    expect(errorSpy).not.toHaveBeenCalled(); //error not called //(check)
    expect(qerrors).not.toHaveBeenCalled(); //qerrors not called //(check)
  });

  test('handles some variables missing', () => { //verify missing logic //(second case)
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh //(ensure env captured)
    process.env.A = '1'; //define env A only //(setup)
    delete process.env.B; //remove env B //(force missing)
    expect(getMissingEnvVars(['A', 'B'])).toEqual(['B']); //should detect B missing //(assert)
    expect(() => throwIfMissingEnvVars(['A', 'B'])).toThrow('Missing required'); //should throw on missing vars //(assert)
    expect(warnIfMissingEnvVars(['A', 'B'], 'warn')).toBe(false); //should warn //(assert)
    expect(warnSpy).toHaveBeenCalledWith('warn'); //warn called with message //(check)
    expect(errorSpy).toHaveBeenCalledWith('Missing required environment variables: B'); //error logged //(check)
    expect(qerrors).toHaveBeenCalledTimes(1); //qerrors invoked once //(check)
  });

  test('handles undefined variable array', () => { //verify undefined input //(third case)
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh //(ensure env captured)
    expect(getMissingEnvVars(undefined)).toEqual([]); //returns empty array //(assert)
    expect(throwIfMissingEnvVars(undefined)).toEqual([]); //throws handled //(assert)
    expect(warnIfMissingEnvVars(undefined, 'warn')).toBe(true); //should not warn //(assert)
    expect(warnSpy).not.toHaveBeenCalled(); //warn not called //(check)
    expect(errorSpy).not.toHaveBeenCalled(); //error not called //(check)
    expect(qerrors).toHaveBeenCalledTimes(3); //qerrors invoked three times //(check)
  });

  test('does not log when DEBUG false', () => { //verify debug gating
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); //spy on console.log
    delete process.env.DEBUG; //ensure debug flag unset
    const { getMissingEnvVars } = require('../lib/envUtils'); //import after env set
    const before = logSpy.mock.calls.length; //record initial log count
    getMissingEnvVars([]); //call function expecting no logs
    expect(logSpy.mock.calls.length).toBe(before); //no additional logs when debug off
    logSpy.mockRestore(); //restore console.log
  });
});
