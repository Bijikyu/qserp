// Summary: memory-growth-analysis.test.js verifies script runs and logs start and completion banners //added descriptive summary
const { mockConsole } = require('./utils/consoleSpies');
const { saveEnv, restoreEnv, setTestEnv } = require('./utils/testSetup');

describe('memory-growth-analysis script', () => {
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

  test('memoryGrowthAnalysis runs and logs completion', async () => {
    const { memoryGrowthAnalysis } = require('../memory-growth-analysis.js');
    await expect(memoryGrowthAnalysis()).resolves.toBeUndefined();
    const logs = logSpy.mock.calls.map(c => c[0]);
    expect(logs.some(l => l.includes('=== Memory Growth Analysis ==='))).toBe(true); //check start banner
    expect(logs.some(l => l.includes('=== Memory Analysis Complete ==='))).toBe(true); //check completion banner
  });
});
