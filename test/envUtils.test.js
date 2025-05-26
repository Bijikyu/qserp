jest.mock('qerrors', () => jest.fn()); //mock qerrors with jest
const qerrors = require('qerrors'); //get mocked qerrors function
const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //load utils after mock

const originalEnv = { ...process.env }; //store original environment
let warnSpy; //declare warn spy variable

beforeEach(() => {
  process.env = { ...originalEnv }; //reset environment before each test
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); //mock console.warn
});

afterEach(() => {
  process.env = { ...originalEnv }; //restore environment after each test
  warnSpy.mockRestore(); //restore console.warn
  jest.clearAllMocks(); //clear mock calls
});

describe('envUtils', () => { //start envUtils describe block
  test('handles all variables present', () => { //test when all vars exist
    process.env.A = '1'; //set env A
    process.env.B = '2'; //set env B
    expect(getMissingEnvVars(['A', 'B'])).toEqual([]); //expect no missing vars
    expect(throwIfMissingEnvVars(['A', 'B'])).toEqual([]); //expect no errors
    expect(warnIfMissingEnvVars(['A', 'B'], 'warn')).toBe(true); //expect warning not triggered
    expect(warnSpy).not.toHaveBeenCalled(); //ensure warn not called
    expect(qerrors).not.toHaveBeenCalled(); //ensure qerrors not called
  });

  test('handles some variables missing', () => { //test when one var missing
    process.env.A = '1'; //set env A only
    delete process.env.B; //ensure B missing
    expect(getMissingEnvVars(['A', 'B'])).toEqual(['B']); //expect B missing
    expect(throwIfMissingEnvVars(['A', 'B'])).toEqual([]); //expect catch handled
    expect(warnIfMissingEnvVars(['A', 'B'], 'warn')).toBe(false); //expect warn executed
    expect(warnSpy).toHaveBeenCalledWith('warn'); //ensure warn called with message
    expect(qerrors).toHaveBeenCalledTimes(1); //expect qerrors called once
  });

  test('handles undefined variable array', () => { //test error path
    expect(getMissingEnvVars(undefined)).toEqual([]); //expect empty array on error
    expect(throwIfMissingEnvVars(undefined)).toEqual([]); //expect catch on undefined
    expect(warnIfMissingEnvVars(undefined, 'warn')).toBe(true); //expect warn returns true
    expect(warnSpy).not.toHaveBeenCalled(); //ensure warn not called
    expect(qerrors).toHaveBeenCalledTimes(3); //expect qerrors called three times
  });
});
