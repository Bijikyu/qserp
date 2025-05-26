jest.mock('qerrors', () => jest.fn()); //switch to jest mock //(changed to clarify usage and current mocking)
const qerrors = require('qerrors'); //get the mocked function //(added note that qerrors is mocked)

const originalEnv = { ...process.env }; //capture starting environment //(store snapshot for reset)

describe('envUtils', () => { //wrap all env util tests //(use describe as requested)
  let warnSpy; //declare warn spy //(track console warning)

  beforeEach(() => { //prepare each test //(reset env and mocks)
    process.env = { ...originalEnv }; //reset environment between tests //(ensures isolation)
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); //mock console.warn //(avoid actual warnings)
    jest.resetModules(); //reload modules so env vars re-evaluated //(ensures clean require)
  });

  afterEach(() => { //cleanup after each test //(restore settings)
    process.env = { ...originalEnv }; //restore environment after test //(reset env)
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
    expect(throwIfMissingEnvVars(['A', 'B'])).toEqual([]); //error path handled //(assert)
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
