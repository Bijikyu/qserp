const { saveEnv, restoreEnv } = require('./utils/testSetup'); //import env helpers //(new utilities)
let savedEnv; //variable to store original env //(for restore)

describe('throwIfMissingEnvVars', () => { //describe missing env block
  beforeAll(() => { //setup before tests
    savedEnv = saveEnv(); //snapshot env //(using util)
    delete process.env.GOOGLE_API_KEY; //clear key
    delete process.env.GOOGLE_CX; //clear cx
    process.env.OPENAI_TOKEN = 'token'; //set token for qerrors
    jest.resetModules(); //reset modules to apply env changes
    jest.mock('axios'); //mock axios to avoid module error
  });

  afterAll(() => { //restore env vars
    restoreEnv(savedEnv); //restore full env //(using util)
  });

  test('module throws when env vars missing', () => { //test thrown error on require
    expect(() => require('../lib/qserp')).toThrow(); //expect require to throw
  });
});
