
// Summary: cacheSizeParsing.test.js validates module behavior and edge cases
const { saveEnv, restoreEnv, setTestEnv } = require('./utils/testSetup'); // helpers to manage env vars between tests


let savedEnv;

beforeEach(() => {
  savedEnv = saveEnv(); // snapshot current env so each test can mutate variables without affecting others
  jest.resetModules(); // clear module cache so env changes apply to reloaded modules
});

afterEach(() => {
  restoreEnv(savedEnv); // restore env snapshot to avoid cross-test contamination
  jest.resetModules(); // reset modules so the next test gets a clean instance
});


test('parses QSERP_MAX_CACHE_SIZE with leading zero as decimal', () => { // parses QSERP_MAX_CACHE_SIZE with leading zero as decimal
  setTestEnv();
  process.env.QSERP_MAX_CACHE_SIZE = '08';


  const LRUCacheMock = jest.fn().mockImplementation(() => ({
    get: jest.fn(), // placeholder methods for interface compatibility
    set: jest.fn(), // cache setter mock to avoid actual caching
    clear: jest.fn(), // clear mock
    purgeStale: jest.fn(() => false), // stub TTL cleanup
    size: 0
  })); // mock constructor to inspect configuration
  jest.doMock('lru-cache', () => ({ LRUCache: LRUCacheMock })); // replace lru-cache so we can check max option

  require('../lib/qserp'); // load module under test after mocking

  expect(LRUCacheMock).toHaveBeenCalledWith(expect.objectContaining({ max: 8 })); // ensure parsed value 8 is passed to cache constructor
});

test('invalid QSERP_MAX_CACHE_SIZE falls back to default', () => { // non-numeric value uses default
  setTestEnv();
  process.env.QSERP_MAX_CACHE_SIZE = '10abc';

  const LRUCacheMock = jest.fn().mockImplementation(() => ({
    get: jest.fn(), // placeholder methods for interface compatibility
    set: jest.fn(), // cache setter mock to avoid actual caching
    clear: jest.fn(), // clear mock
    purgeStale: jest.fn(() => false), // stub TTL cleanup
    size: 0
  })); // mock constructor to inspect configuration
  jest.doMock('lru-cache', () => ({ LRUCache: LRUCacheMock })); // replace lru-cache so we can check max option

  require('../lib/qserp'); // load module under test after mocking

  expect(LRUCacheMock).toHaveBeenCalledWith(expect.objectContaining({ max: 1000 })); // default value applied
});
