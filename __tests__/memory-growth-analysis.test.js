// Summary: memory-growth-analysis.test.js verifies output of the memory growth analysis script
// Rationale: ensures logging banners appear and the script completes without errors //clarify test purpose
const { mockConsole } = require('./utils/consoleSpies'); //silence console.log during script execution
const { saveEnv, restoreEnv, setTestEnv } = require('./utils/testSetup'); //manage env vars for isolation


describe('memory-growth-analysis script', () => {
  let savedEnv;
  let logSpy;

  beforeEach(() => {
    savedEnv = saveEnv(); // snapshot env so each test can change vars without leaking state
    setTestEnv(); //ensure required vars defined
    process.env.CODEX = 'true'; //offline mode avoids network requests
    jest.resetModules(); //reset module cache between tests
    logSpy = mockConsole('log'); //capture log output for assertions
  });

  afterEach(() => {
    logSpy.mockRestore();
    restoreEnv(savedEnv); // restore saved environment to keep tests isolated
  });

  test('memoryGrowthAnalysis runs and logs completion', async () => {
    const { memoryGrowthAnalysis } = require('../memory-growth-analysis.js'); //import script under test
    await expect(memoryGrowthAnalysis()).resolves.toBeUndefined(); //script resolves with no return value
    const logs = logSpy.mock.calls.map(c => c[0]);
    expect(logs.some(l => l.includes('=== Memory Growth Analysis ==='))).toBe(true); //check start banner
    expect(logs.some(l => l.includes('=== Memory Analysis Complete ==='))).toBe(true); //check completion banner
  });
});
