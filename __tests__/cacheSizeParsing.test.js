// Summary: cacheSizeParsing.test.js validates module behavior and edge cases
const { saveEnv, restoreEnv, setTestEnv } = require('./utils/testSetup');

let savedEnv;

beforeEach(() => {
  savedEnv = saveEnv();
  jest.resetModules();
});

afterEach(() => {
  restoreEnv(savedEnv);
  jest.resetModules();
});

test('parses QSERP_MAX_CACHE_SIZE with leading zero as decimal', () => { // parses QSERP_MAX_CACHE_SIZE with leading zero as decimal
  setTestEnv();
  process.env.QSERP_MAX_CACHE_SIZE = '08';

  const LRUCacheMock = jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    purgeStale: jest.fn(() => 0),
    size: 0
  }));
  jest.doMock('lru-cache', () => ({ LRUCache: LRUCacheMock }));

  require('../lib/qserp');

  expect(LRUCacheMock).toHaveBeenCalledWith(expect.objectContaining({ max: 8 }));
});
