// Summary: missingEnv.test.js validates module behavior and edge cases

const { saveEnv, restoreEnv } = require('./utils/testSetup'); //import env helpers //(new utilities)
let savedEnv; //variable to store original env //(for restore)


let saveApi; //variable to store original api key
let saveCx; //variable to store original cx
let axiosMock; //adapter instance


describe('throwIfMissingEnvVars', () => { //describe missing env block
  beforeAll(() => { //setup before tests
    savedEnv = saveEnv(); //snapshot env //(using util)
    delete process.env.GOOGLE_API_KEY; //clear key
    delete process.env.GOOGLE_CX; //clear cx
    process.env.OPENAI_TOKEN = 'token'; //set token for qerrors
    jest.resetModules(); //reset modules to apply env changes
    const { createAxiosMock } = require('./utils/testSetup'); //import adapter
    axiosMock = createAxiosMock(); //create axios adapter
  });

  afterAll(() => { //restore env vars
    restoreEnv(savedEnv); //restore full env //(using util)
  });

  test('module logs error when env vars missing', async () => { //verify error output on require
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); //spy console.error
    require('../lib/qserp'); //require module with missing vars
    await new Promise(r => setImmediate(r)); //allow async handler to run
    expect(errSpy).toHaveBeenCalled(); //error should be logged
    errSpy.mockRestore(); //cleanup spy
  });

  test('module does not throw when CODEX true', async () => { //verify codex bypasses env check
    process.env.CODEX = 'true'; //enable codex mode
    jest.resetModules(); //reload module with codex flag
    const { createAxiosMock } = require('./utils/testSetup'); //recreate axios mock
    createAxiosMock(); //initialize axios adapter for module
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); //spy console.error
    expect(() => require('../lib/qserp')).not.toThrow(); //module should load without error
    await new Promise(r => setImmediate(r)); //allow async handler to run
    expect(errSpy).not.toHaveBeenCalled(); //no error logged in codex mode
    errSpy.mockRestore(); //cleanup spy
    delete process.env.CODEX; //cleanup codex flag
  });
});
