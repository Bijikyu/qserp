const { setTestEnv } = require('./utils/testSetup');

jest.mock('lru-cache', () => {
  return { LRUCache: function(opts){ global.lruOpts = opts; return { get: () => undefined, set: () => {} }; } };
});

describe('cache initialization', () => {
  beforeEach(() => {
    jest.resetModules();
    setTestEnv();
  });
  test('uses ttlAutopurge option', () => {
    require('../lib/qserp');
    expect(global.lruOpts).toEqual(expect.objectContaining({ ttlAutopurge: true }));
  });
});
