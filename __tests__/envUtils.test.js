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
    savedEnv = saveEnv(); // snapshot env to maintain isolation when tests mutate vars
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
    restoreEnv(savedEnv); // restore environment to prevent cross-test contamination
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

  test('treats whitespace-only values as missing', () => { //verify whitespace handling //(new case)
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh
    process.env.A = '   '; //set env A to whitespace only
    process.env.B = 'val'; //define env B normally
    expect(getMissingEnvVars(['A', 'B'])).toEqual(['A']); //should detect A as missing
    expect(() => throwIfMissingEnvVars(['A', 'B'])).toThrow('Missing required'); //should throw on whitespace value
    expect(warnIfMissingEnvVars(['A', 'B'], 'warn')).toBe(false); //should warn when whitespace present
    expect(warnSpy).toHaveBeenCalledWith('warn'); //warn called with message
    expect(errorSpy).toHaveBeenCalledWith('Missing required environment variables: A'); //error logged for A
    expect(qerrors).not.toHaveBeenCalled(); //qerrors not used directly
    expect(safeQerrors).toHaveBeenCalledTimes(1); //safeQerrors invoked once
  });

  test('handles undefined variable array', () => { //verify undefined input //(third case)
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh //(ensure env captured)
    expect(() => getMissingEnvVars(undefined)).toThrow(TypeError); //should throw when param invalid //(assert)
    expect(() => throwIfMissingEnvVars(undefined)).toThrow(TypeError); //should propagate error //(assert)
    expect(() => warnIfMissingEnvVars(undefined, 'warn')).toThrow(TypeError); //should throw on misuse //(assert)
    expect(warnSpy).not.toHaveBeenCalled(); //warn not called //(check)
    expect(errorSpy).not.toHaveBeenCalled(); //error not called //(check)
    expect(qerrors).not.toHaveBeenCalled(); //qerrors not used directly //(check)

    expect(safeQerrors).toHaveBeenCalledTimes(3); //safeQerrors invoked three times //(check)
  });

  test('handles non-array variable type', () => { //verify invalid object input //(new case)
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh //(ensure env captured)
    const badVal = { foo: 'bar' }; //object passed instead of array //(setup)
    expect(() => getMissingEnvVars(badVal)).toThrow(TypeError); //should throw when param invalid //(assert)
    expect(() => throwIfMissingEnvVars(badVal)).toThrow(TypeError); //should also throw //(assert)
    expect(() => warnIfMissingEnvVars(badVal, 'warn')).toThrow(TypeError); //should throw as well //(assert)
    expect(warnSpy).not.toHaveBeenCalled(); //warn not called //(check)
    expect(errorSpy).not.toHaveBeenCalled(); //error not called //(check)
    expect(qerrors).not.toHaveBeenCalled(); //qerrors not used directly //(check)
    expect(safeQerrors).toHaveBeenCalledTimes(3); //safeQerrors invoked three times //(check)
  });

  test('safeQerrors context for calcMissing error', () => { //verify catch block context
    const { getMissingEnvVars } = require('../lib/envUtils'); //require utils fresh
    const arr = ['A']; //valid array base for filter
    arr.filter = () => { throw new Error('boom'); }; //force error during filter
    expect(getMissingEnvVars(arr)).toEqual([]); //should fallback to empty array
    expect(safeQerrors).toHaveBeenCalledWith(expect.any(Error), 'calcMissing error', { varArr: arr }); //ensure context string
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

  test('safeQerrors promise handled to avoid unhandled rejection', done => { //new test for promise handling
    jest.resetModules(); //reload modules for isolated mock
    const handler = () => { done.fail('unhandled rejection'); }; //fail test if triggered
    process.once('unhandledRejection', handler); //listen for unhandled
    jest.doMock('../lib/qerrorsLoader', () => { //mock loader with rejecting safeQerrors
      const mockFn = jest.fn();
      const loader = jest.fn(() => mockFn);
      loader.safeQerrors = jest.fn(() => Promise.reject(new Error('fail')));
      loader.default = loader;
      return loader;
    });
    const { getMissingEnvVars } = require('../lib/envUtils'); //require with mock
    expect(() => getMissingEnvVars(undefined)).toThrow(TypeError); //trigger safeQerrors while asserting throw
    setImmediate(() => { //allow promise microtask to run
      process.removeListener('unhandledRejection', handler); //cleanup listener
      done(); //complete test if no rejection
    });
  });
});
