// Summary: missingEnv.test.js validates module behavior and edge cases

const { saveEnv, restoreEnv } = require('./utils/testSetup'); //import env helpers //(new utilities)
let savedEnv; //variable to store original env //(for restore)


let saveApi; //variable to store original api key
let saveCx; //variable to store original cx
let axiosMock; //axios adapter to intercept HTTP calls during require


describe('throwIfMissingEnvVars', () => { //describe missing env block
  beforeAll(() => { //setup before tests
    savedEnv = saveEnv(); // snapshot env so modifications here don't affect other suites
    delete process.env.GOOGLE_API_KEY; // remove key to simulate missing variable
    delete process.env.GOOGLE_CX; // remove cx to trigger validation error
    process.env.OPENAI_TOKEN = 'token'; // set minimal token required for qerrors
    jest.resetModules(); //reset modules to apply env changes
    const { createAxiosMock } = require('./utils/testSetup'); //import adapter creator for axios instance
    axiosMock = createAxiosMock(); //mock adapter so requiring module won't hit network
  });

  afterAll(() => { //restore env vars
    restoreEnv(savedEnv); // restore original env so later suites start clean
  });

  test('module throws when env vars missing', () => { //test thrown error on require
    expect(() => require('../lib/qserp')).toThrow(); //expect require to throw
  });

  test('module does not throw when CODEX true', () => { //verify codex bypasses env check
    process.env.CODEX = 'true'; //enable codex mode
    jest.resetModules(); //reload module with codex flag
    const { createAxiosMock } = require('./utils/testSetup'); //recreate axios mock
    createAxiosMock(); //initialize axios adapter for module
    expect(() => require('../lib/qserp')).not.toThrow(); //module should load without error
    delete process.env.CODEX; //cleanup codex flag
  });
});
