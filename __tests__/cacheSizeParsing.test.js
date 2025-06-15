const { saveEnv, restoreEnv, setTestEnv } = require('./utils/testSetup'); //setup helpers manage env & mocks
//Test ensures env parsing uses base 10 for cache size even when leading zero present

let savedEnv; //snapshot of env before each test for isolation

beforeEach(() => {
  savedEnv = saveEnv(); //preserve environment before mutation
  jest.resetModules(); //clear require cache so env vars re-read
});

afterEach(() => {
  restoreEnv(savedEnv); //restore environment to original state
  jest.resetModules(); //reset modules to avoid cross-test pollution
});

test('parses QSERP_MAX_CACHE_SIZE with leading zero as decimal', () => { //verifies env parsing handles leading zero
  setTestEnv(); //populate required env vars with defaults
  process.env.QSERP_MAX_CACHE_SIZE = '08'; //simulate decimal string with leading zero

  const LRUCacheMock = jest.fn().mockImplementation(() => ({ //mock LRU cache constructor to inspect config
    get: jest.fn(), //stub cache methods used in module
    set: jest.fn(),
    clear: jest.fn(),
    purgeStale: jest.fn(() => 0), //simulate zero entries purged
    size: 0
  }));
  jest.doMock('lru-cache', () => ({ LRUCache: LRUCacheMock })); //replace library with mock implementation

  require('../lib/qserp'); //load module which should parse env and instantiate cache

  expect(LRUCacheMock).toHaveBeenCalledWith(expect.objectContaining({ max: 8 })); //assert parsed max value is decimal 8
});
