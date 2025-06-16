// Summary: envUtils.test.js validates module behavior and edge cases
let qerrors; //holds mock loaded after reset (setup in testSetup)
let safeQerrors; //mocked safeQerrors reference for assertions
const { saveEnv, restoreEnv } = require('./utils/testSetup'); //import env helpers //(new utilities)
const { mockConsole } = require('./utils/consoleSpies'); //added console spy helper

describe('envUtils', () => { //wrap all env util tests //(use describe as requested)
  let warnSpy; //declare warn spy //(track minLogger warn)
  let errorSpy; //declare error spy //(track minLogger error)

  let savedEnv; //holder for env snapshot //(for restoration)
  beforeEach(() => { //prepare each test //(reset env and mocks)
    savedEnv = saveEnv(); //capture current env //(using util)
    jest.resetModules(); //reload modules so env vars re-evaluated //(ensures clean require)
    jest.doMock('../lib/qerrorsLoader', () => { //mock qerrors loader per test
      const mockFn = jest.fn(); //placeholder qerrors function
      const loader = jest.fn(() => mockFn); //callable default export
      loader.safeQerrors = jest.fn(); //spy for resilience wrapper
      loader.default = loader; //support .default usage
      return loader; //export loader function
    });
    const loader = require('../lib/qerrorsLoader'); //get mocked loader
    qerrors = loader(); //qerrors function used by utils
    safeQerrors = loader.safeQerrors; //capture safeQerrors spy for assertions
    const minLogger = require('../lib/minLogger'); //import logger after reset
    warnSpy = jest.spyOn(minLogger, 'logWarn').mockImplementation(() => {}); //spy warn
    errorSpy = jest.spyOn(minLogger, 'logError').mockImplementation(() => {}); //spy error
  });

  afterEach(() => { //cleanup after each test //(restore settings)
    restoreEnv(savedEnv); //reset environment after test //(using util)
    warnSpy.mockRestore(); //restore logWarn spy //(remove spy)
    errorSpy.mockRestore(); //restore logError spy //(remove spy)
    jest.clearAllMocks(); //clear any mock usage //(reset mock counts)
    jest.dontMock('../lib/qerrorsLoader'); //remove loader mock to avoid cross-suite impact
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
    expect(safeQerrors).not.toHaveBeenCalled(); //safeQerrors not called //(check)
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
    expect(qerrors).not.toHaveBeenCalled(); //qerrors not used directly //(check)
    expect(safeQerrors).toHaveBeenCalledTimes(1); //safeQerrors invoked once //(check)
  });

  test('handles undefined variable array', () => { //verify undefined input //(third case)
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh //(ensure env captured)
    expect(getMissingEnvVars(undefined)).toEqual([]); //returns empty array //(assert)
    expect(throwIfMissingEnvVars(undefined)).toEqual([]); //throws handled //(assert)
    expect(warnIfMissingEnvVars(undefined, 'warn')).toBe(true); //should not warn //(assert)
    expect(warnSpy).not.toHaveBeenCalled(); //warn not called //(check)
    expect(errorSpy).not.toHaveBeenCalled(); //error not called //(check)
    expect(qerrors).not.toHaveBeenCalled(); //qerrors not used directly //(check)

    expect(safeQerrors).toHaveBeenCalledTimes(3); //safeQerrors invoked three times //(check)
  });

  test('handles non-array variable input', () => { //verify input type guarding //added new test
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh
    expect(getMissingEnvVars('A')).toEqual([]); //returns empty when input string //added assertion
    expect(throwIfMissingEnvVars('A')).toEqual([]); //returns empty without throw //added assertion
    expect(warnIfMissingEnvVars('A', 'warn')).toBe(true); //should not warn //added assertion
    expect(warnSpy).not.toHaveBeenCalled(); //warn not called //added check
    expect(errorSpy).not.toHaveBeenCalled(); //error not called //added check
    expect(qerrors).not.toHaveBeenCalled(); //qerrors not used directly //added check
    expect(safeQerrors).toHaveBeenCalledTimes(3); //safeQerrors invoked for each function //added check
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
