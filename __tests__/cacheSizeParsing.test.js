const { saveEnv, restoreEnv, setTestEnv } = require('./utils/testSetup'); // helpers to manage env vars between tests

let savedEnv;

beforeEach(() => {
  savedEnv = saveEnv(); // store current env to keep tests isolated
  jest.resetModules(); // clear module cache so env changes take effect
});

afterEach(() => {
  restoreEnv(savedEnv); // restore original env after each test
  jest.resetModules(); // reset modules so next test has clean state
});

test('parses QSERP_MAX_CACHE_SIZE with leading zero as decimal', () => {
  setTestEnv(); // load base env values needed by qserp
  process.env.QSERP_MAX_CACHE_SIZE = '08'; // set test value to verify decimal parsing

  const LRUCacheMock = jest.fn().mockImplementation(() => ({
    get: jest.fn(), // placeholder methods for interface compatibility
    set: jest.fn(), // cache setter mock to avoid actual caching
    clear: jest.fn(), // clear mock
    purgeStale: jest.fn(() => 0), // stub TTL cleanup
    size: 0
  })); // mock constructor to inspect configuration
  jest.doMock('lru-cache', () => ({ LRUCache: LRUCacheMock })); // replace lru-cache so we can check max option

  require('../lib/qserp'); // load module under test after mocking

  expect(LRUCacheMock).toHaveBeenCalledWith(expect.objectContaining({ max: 8 })); // ensure parsed value 8 is passed to cache constructor
});
