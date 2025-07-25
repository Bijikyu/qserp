// Summary: perf-analysis.test.js checks the performance analysis script and its log output in offline mode verifying console logs

const { mockConsole } = require('./utils/consoleSpies'); //spy utility for verifying logs
const { saveEnv, restoreEnv, setTestEnv } = require('./utils/testSetup'); //environment helpers


describe('perf-analysis script', () => {
  let savedEnv;
  let logSpy;

  beforeEach(() => {
    savedEnv = saveEnv(); // snapshot env so CODEX and other vars don't persist to other tests
    setTestEnv(); //ensure required env vars present
    process.env.CODEX = 'true'; //offline mode for deterministic test
    jest.resetModules(); //reset module cache
    logSpy = mockConsole('log'); //capture console.log output
  });

  afterEach(() => {
    logSpy.mockRestore(); //restore console.log
    restoreEnv(savedEnv); // restore env so next test starts clean
  });

  test('cachePerformanceTest runs and logs summary', async () => { //verifies script outputs banner messages
    const { cachePerformanceTest } = require('../perf-analysis.js'); //import script for execution
    await expect(cachePerformanceTest()).resolves.toBeUndefined(); //script resolves when complete
    const logs = logSpy.mock.calls.map(c => c[0]);
    expect(logs.some(l => l.includes('=== Cache Performance Analysis ==='))).toBe(true); //verify start log
    expect(logs.some(l => l.includes('=== Performance Analysis Complete ==='))).toBe(true); //verify end log
  });
});
