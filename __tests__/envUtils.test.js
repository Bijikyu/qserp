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

  test('handles all variables present', async () => { //verify no missing vars //(first case)
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh //(ensure env captured)
    process.env.A = '1'; //define env A //(setup)
    process.env.B = '2'; //define env B //(setup)
    await expect(getMissingEnvVars(['A', 'B'])).resolves.toEqual([]); //should find none missing //(assert)
    await expect(throwIfMissingEnvVars(['A', 'B'])).resolves.toEqual([]); //should return empty //(assert)
    await expect(warnIfMissingEnvVars(['A', 'B'], 'warn')).resolves.toBe(true); //should not warn //(assert)
    expect(warnSpy).not.toHaveBeenCalled(); //warn not called //(check)
    expect(errorSpy).not.toHaveBeenCalled(); //error not called //(check)
    expect(qerrors).not.toHaveBeenCalled(); //qerrors not called //(check)
    expect(safeQerrors).not.toHaveBeenCalled(); //safeQerrors not called //(check)
  });

  test('handles some variables missing', async () => { //verify missing logic //(second case)
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh //(ensure env captured)
    process.env.A = '1'; //define env A only //(setup)
    delete process.env.B; //remove env B //(force missing)
    await expect(getMissingEnvVars(['A', 'B'])).resolves.toEqual(['B']); //should detect B missing //(assert)
    await expect(throwIfMissingEnvVars(['A', 'B'])).rejects.toThrow('Missing required'); //should throw on missing vars //(assert)
    await expect(warnIfMissingEnvVars(['A', 'B'], 'warn')).resolves.toBe(false); //should warn //(assert)
    expect(warnSpy).toHaveBeenCalledWith('warn'); //warn called with message //(check)
    expect(errorSpy).toHaveBeenCalledWith('Missing required environment variables: B'); //error logged //(check)
    expect(qerrors).not.toHaveBeenCalled(); //qerrors not used directly //(check)
    expect(safeQerrors).toHaveBeenCalledTimes(1); //safeQerrors invoked once //(check)
  });

  test('handles undefined variable array', async () => { //verify undefined input //(third case)
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh //(ensure env captured)
    await expect(getMissingEnvVars(undefined)).resolves.toEqual([]); //returns empty array //(assert)
    await expect(throwIfMissingEnvVars(undefined)).resolves.toEqual([]); //throws handled //(assert)
    await expect(warnIfMissingEnvVars(undefined, 'warn')).resolves.toBe(true); //should not warn //(assert)
    expect(warnSpy).not.toHaveBeenCalled(); //warn not called //(check)
    expect(errorSpy).not.toHaveBeenCalled(); //error not called //(check)
    expect(qerrors).not.toHaveBeenCalled(); //qerrors not used directly //(check)

    expect(safeQerrors).toHaveBeenCalledTimes(3); //safeQerrors invoked three times //(check)
  });

  test('does not log when DEBUG false', async () => { //verify debug gating
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); //spy on console.log
    delete process.env.DEBUG; //ensure debug flag unset
    const { getMissingEnvVars } = require('../lib/envUtils'); //import after env set
    const before = logSpy.mock.calls.length; //record initial log count
    await getMissingEnvVars([]); //call function expecting no logs
    expect(logSpy.mock.calls.length).toBe(before); //no additional logs when debug off
    logSpy.mockRestore(); //restore console.log
  });

  test('safeQerrors rejection handled', async () => { //ensure no unhandled rejection
    const { getMissingEnvVars } = require('../lib/envUtils'); //load utils
    safeQerrors.mockRejectedValueOnce(new Error('fail')); //force rejection
    const unhandled = jest.fn(); //spy for unhandled rejections
    process.once('unhandledRejection', unhandled); //attach spy
    await getMissingEnvVars(undefined); //trigger error path
    await new Promise(r => setImmediate(r)); //allow promise chain to settle
    expect(unhandled).not.toHaveBeenCalled(); //verify no unhandled rejection
  });
});
