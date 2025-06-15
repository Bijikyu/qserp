const { mockConsole } = require('./utils/consoleSpies');
const { saveEnv, restoreEnv, setTestEnv } = require('./utils/testSetup');

describe('rate-limit-analysis script', () => {
  let savedEnv;
  let logSpy;

  beforeEach(() => {
    savedEnv = saveEnv();
    setTestEnv();
    process.env.CODEX = 'true';
    jest.resetModules();
    logSpy = mockConsole('log');
  });

  afterEach(() => {
    logSpy.mockRestore();
    restoreEnv(savedEnv);
  });

  test('rateLimitingAnalysis runs and logs completion', async () => {
    const { rateLimitingAnalysis } = require('../rate-limit-analysis.js');
    await expect(rateLimitingAnalysis()).resolves.toBeUndefined();
    const logs = logSpy.mock.calls.map(c => c[0]);
    expect(logs.some(l => l.includes('=== Rate Limiting Performance Analysis ==='))).toBe(true); //verify start banner
    expect(logs.some(l => l.includes('=== Rate Limiting Analysis Complete ==='))).toBe(true); //verify completion banner
  });
});
