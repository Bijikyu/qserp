jest.mock('qerrors', () => jest.fn()); //switch to jest mock //(clarify usage)
let qerrors; //will hold mocked function after module reset
const { saveEnv, restoreEnv } = require('./utils/testSetup'); //import env helpers //(new utilities)
const { mockConsole } = require('./utils/consoleSpies'); //added console spy helper

describe('envUtils', () => { //wrap all env util tests //(use describe as requested)
  let warnSpy; //declare warn spy //(track console warning)

  let savedEnv; //holder for env snapshot //(for restoration)
  beforeEach(() => { //prepare each test //(reset env and mocks)
    savedEnv = saveEnv(); //capture current env //(using util)
    warnSpy = mockConsole('warn'); //mock console.warn via helper
    jest.resetModules(); //reload modules so env vars re-evaluated //(ensures clean require)
    qerrors = require('qerrors'); //re-acquire mock after module reset
  });

  afterEach(() => { //cleanup after each test //(restore settings)
    restoreEnv(savedEnv); //reset environment after test //(using util)
    warnSpy.mockRestore(); //restore console.warn //(remove spy)
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
    expect(qerrors).toHaveBeenCalledTimes(1); //qerrors invoked once //(check)
  });

  test('handles undefined variable array', () => { //verify undefined input //(third case)
    const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //require utils fresh //(ensure env captured)
    expect(getMissingEnvVars(undefined)).toEqual([]); //returns empty array //(assert)
    expect(throwIfMissingEnvVars(undefined)).toEqual([]); //throws handled //(assert)
    expect(warnIfMissingEnvVars(undefined, 'warn')).toBe(true); //should not warn //(assert)
    expect(warnSpy).not.toHaveBeenCalled(); //warn not called //(check)
    expect(qerrors).toHaveBeenCalledTimes(3); //qerrors invoked three times //(check)
  });
});
