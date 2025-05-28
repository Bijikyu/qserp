
let saveApi; //variable to store original api key
let saveCx; //variable to store original cx
let axiosMock; //adapter instance

describe('throwIfMissingEnvVars', () => { //describe missing env block
  beforeAll(() => { //setup before tests
    saveApi = process.env.GOOGLE_API_KEY; //save key
    saveCx = process.env.GOOGLE_CX; //save cx
    delete process.env.GOOGLE_API_KEY; //clear key
    delete process.env.GOOGLE_CX; //clear cx
    process.env.OPENAI_TOKEN = 'token'; //set token for qerrors
    jest.resetModules(); //reset modules to apply env changes
    const { createAxiosMock } = require('./utils/testSetup'); //import adapter
    axiosMock = createAxiosMock(); //create axios adapter
  });

  afterAll(() => { //restore env vars
    process.env.GOOGLE_API_KEY = saveApi; //restore key
    process.env.GOOGLE_CX = saveCx; //restore cx
  });

  test('module throws when env vars missing', () => { //test thrown error on require
    expect(() => require('../lib/qserp')).toThrow(); //expect require to throw
  });
});
