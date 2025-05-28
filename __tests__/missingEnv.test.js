const { saveEnv, restoreEnv } = require('./utils/testSetup'); //import env helpers //(refactored shared env logic)

let envCopy; //variable to store env snapshot

describe('throwIfMissingEnvVars', () => { //describe missing env block
  beforeAll(() => { //setup before tests
    envCopy = saveEnv(); //snapshot env for restore //(use helper)
    delete process.env.GOOGLE_API_KEY; //clear key
    delete process.env.GOOGLE_CX; //clear cx
    process.env.OPENAI_TOKEN = 'token'; //set token for qerrors
    jest.resetModules(); //reset modules to apply env changes
    jest.mock('axios'); //mock axios to avoid module error
  });

  afterAll(() => { //restore env vars
    restoreEnv(envCopy); //return env to original //(use helper)
  });

  test('module throws when env vars missing', () => { //test thrown error on require
    expect(() => require('../lib/qserp')).toThrow(); //expect require to throw
  });
});
