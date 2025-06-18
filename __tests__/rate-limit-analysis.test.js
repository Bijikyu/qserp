// Summary: rate-limit-analysis.test.js validates the rate limiting script and checks expected log output //added descriptive summary
const { mockConsole } = require('./utils/consoleSpies');
const { saveEnv, restoreEnv, setTestEnv } = require('./utils/testSetup');

describe('rate-limit-analysis script', () => {
  let savedEnv;
  let logSpy;

  beforeEach(() => {
    savedEnv = saveEnv(); // snapshot env so this test's changes don't persist
    setTestEnv(); //ensure required vars present for script
    process.env.CODEX = 'true'; //offline mode prevents real API calls
    jest.resetModules();
    logSpy = mockConsole('log');
  });

  afterEach(() => {
    logSpy.mockRestore();
    restoreEnv(savedEnv); // restore env to original values for next test
  });

  test('rateLimitingAnalysis runs and logs completion', async () => {
    const { rateLimitingAnalysis } = require('../rate-limit-analysis.js');
    await expect(rateLimitingAnalysis()).resolves.toBeUndefined();
    const logs = logSpy.mock.calls.map(c => c[0]);
    expect(logs.some(l => l.includes('=== Rate Limiting Performance Analysis ==='))).toBe(true); //verify start banner
    expect(logs.some(l => l.includes('=== Rate Limiting Analysis Complete ==='))).toBe(true); //verify completion banner
  });
});
