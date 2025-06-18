
const { mockConsole } = require('./utils/consoleSpies'); //silence console.log during script execution
const { saveEnv, restoreEnv, setTestEnv } = require('./utils/testSetup'); //manage env vars for isolation


describe('memory-growth-analysis script', () => {
  let savedEnv;
  let logSpy;

  beforeEach(() => {
    savedEnv = saveEnv(); //snapshot current environment
    setTestEnv(); //ensure required vars defined
    process.env.CODEX = 'true'; //offline mode avoids network requests
    jest.resetModules(); //reset module cache between tests
    logSpy = mockConsole('log'); //capture log output for assertions
  });

  afterEach(() => {
    logSpy.mockRestore();
    restoreEnv(savedEnv);
  });

  test('memoryGrowthAnalysis runs and logs completion', async () => {
    const { memoryGrowthAnalysis } = require('../memory-growth-analysis.js');
    await expect(memoryGrowthAnalysis()).resolves.toBeUndefined();
    const logs = logSpy.mock.calls.map(c => c[0]);
    expect(logs.some(l => l.includes('=== Memory Growth Analysis ==='))).toBe(true); //check start banner
    expect(logs.some(l => l.includes('=== Memory Analysis Complete ==='))).toBe(true); //check completion banner
  });
});
