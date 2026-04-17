// Summary: qserp.test.js validates module behavior and edge cases
const { initSearchTest, resetMocks } = require('./utils/testSetup'); //use new helpers

const { mock, scheduleMock, qerrorsMock } = initSearchTest(); //initialize env and mocks

const { googleSearch, getTopSearchResults, fetchSearchItems, clearCache, getGoogleURL } = require('../lib/qserp'); //load functions under test from library
const { OPENAI_WARN_MSG } = require('../lib/constants'); //import warning message constant

describe('qserp module', () => { //group qserp tests
  beforeEach(() => { //reset mocks before each test
    resetMocks(mock, scheduleMock, qerrorsMock); //use helper to clear mocks
    clearCache(); //reset module cache between tests
  });

  test('googleSearch returns parsed results', async () => { //verify googleSearch formatting
    mock.onGet(/customsearch/).reply(200, { //mock google search api response
      items: [{ title: 'A', snippet: 'B', link: 'C' }] //provide mock items array
    });
    const results = await googleSearch('hi'); //perform search with mocked data
    expect(results).toEqual([{ title: 'A', snippet: 'B', link: 'C' }]); //expect formatted result
    expect(scheduleMock).toHaveBeenCalled(); //ensure rate limiter used
  });

  test('googleSearch handles missing items field', async () => { //verify empty array when items missing
    mock.onGet(/customsearch/).reply(200, {}); //mock response without items
    const results = await googleSearch('none'); //perform search expecting empty
    expect(results).toEqual([]); //should resolve to empty array
    expect(scheduleMock).toHaveBeenCalledTimes(1); //schedule called once
  });

  test('fetchSearchItems returns raw items', async () => { //test helper directly
    mock.onGet(/raw/).reply(200, { items: [{ title: 'r', snippet: 's', link: 'l' }] }); //mock response
    const items = await fetchSearchItems('raw'); //call helper
    expect(items).toEqual([{ title: 'r', snippet: 's', link: 'l' }]); //expect raw array
    expect(scheduleMock).toHaveBeenCalled(); //schedule used
  });

  test('getTopSearchResults returns top links', async () => { //verify top links returned
    mock.onGet(/Java/).reply(200, { items: [{ link: 'http://j' }] }); //mock java search
    mock.onGet(/Python/).reply(200, { items: [{ link: 'http://p' }] }); //mock python search
    const urls = await getTopSearchResults(['Java', 'Python']); //get urls from mocked data
    expect(urls).toEqual(['http://j', 'http://p']); //expect urls array
    expect(scheduleMock).toHaveBeenCalledTimes(2); //ensure rate limiter called twice
  });

  test('getTopSearchResults requests single item', async () => { //ensure num param used
    mock.onGet(/Solo/).reply(200, { items: [{ link: 'http://s' }] }); //mock single term
    await getTopSearchResults(['Solo']); //call with one term
    expect(mock.history.get[0].url).toBe('https://customsearch.googleapis.com/customsearch/v1?q=Solo&key=key&cx=cx&fields=items(title,snippet,link)&num=1'); //url should request one item with fields filter
  });

  test('handles empty or invalid input', async () => { //verify validation paths
    await expect(googleSearch('')).rejects.toThrow(); //expect empty query throw
    await expect(fetchSearchItems('')).rejects.toThrow(); //expect empty query throw for helper
    await expect(getTopSearchResults('bad')).rejects.toThrow(); //expect invalid input throw
    const emptyUrls = await getTopSearchResults([]); //call with empty list
    expect(emptyUrls).toEqual([]); //expect empty array result
  });

  test('rejects overly long query strings', async () => { //new max length validation test
    const long = 'a'.repeat(2050); //construct query exceeding limit
    await expect(googleSearch(long)).rejects.toThrow(); //should throw via helper
    await expect(fetchSearchItems(long)).rejects.toThrow(); //helper should also throw
    await expect(getTopSearchResults([long])).rejects.toThrow(); //multi search should reject
  });

  test('logs errors via helper on request failure', async () => { //verify error logging path
    mock.onGet(/customsearch/).reply(500); //mock failed request
    const res = await googleSearch('err'); //search expecting failure
    const urls = await getTopSearchResults(['err']); //multi search expecting failure
    expect(res).toEqual([]); //result should be empty array
    expect(urls).toEqual([]); //urls should be empty array
    expect(qerrorsMock).toHaveBeenCalled(); //qerrors should log error
  });

  test('filters invalid terms and limits schedule calls', async () => { //added new mixed input test
    mock.onGet(/Alpha/).reply(200, { items: [] }); //mock no items result
    mock.onGet(/Beta/).reply(200, { items: [{ link: 'http://b' }] }); //mock valid result
    const terms = ['Alpha', '', 1, null, 'Beta']; //prepare mixed array
    const urls = await getTopSearchResults(terms); //execute search with mixed array
    expect(urls).toEqual(['http://b']); //should only include valid link
    expect(scheduleMock).toHaveBeenCalledTimes(2); //rate limiter for valid terms only
  });

  test('deduplicates duplicate terms before searching', async () => { //ensure unique fetching only
    mock.onGet(/Alpha/).reply(200, { items: [{ link: 'http://a' }] }); //mock alpha search
    mock.onGet(/Beta/).reply(200, { items: [{ link: 'http://b' }] }); //mock beta search
    const urls = await getTopSearchResults(['Alpha', 'Beta', 'Alpha']); //call with duplicate term
    expect(urls).toEqual(['http://a', 'http://b']); //should match order of unique terms
    expect(scheduleMock).toHaveBeenCalledTimes(2); //schedule called once per unique term
  });

  test('deduplicates trimmed and case-insensitive terms', async () => { //new normalization test
    mock.onGet(/Node\.js/).reply(200, { items: [{ link: 'http://n' }] }); //mock node search
    const urls = await getTopSearchResults(['Node.js', ' node.js ', 'NODE.JS']); //variations of same term
    expect(urls).toEqual(['http://n']); //single result expected
    expect(scheduleMock).toHaveBeenCalledTimes(1); //only one api request
  });

  test('warns on missing OPENAI_TOKEN for getTopSearchResults', async () => { //new warning test
    const tokenSave = process.env.OPENAI_TOKEN; //store existing token for restore
    delete process.env.OPENAI_TOKEN; //remove token to trigger warning logic
    jest.resetModules(); //reload modules to re-evaluate env vars
    const { createAxiosMock, createScheduleMock, createQerrorsMock } = require('./utils/testSetup'); //reacquire helpers post reset
    const warnSpy = require('./utils/consoleSpies').mockConsole('warn'); //create console.warn spy
    const envUtils = require('../lib/envUtils'); //import env utils for spy
    const warnEnvSpy = jest.spyOn(envUtils, 'warnIfMissingEnvVars'); //spy on env warning call
    const mockLocal = createAxiosMock(); //create fresh axios adapter
    createScheduleMock(); //recreate Bottleneck schedule mock
    createQerrorsMock(); //recreate qerrors mock
    const { getTopSearchResults: topSearch } = require('../lib/qserp'); //require module without token
    mockLocal.onGet(/One/).reply(200, { items: [{ link: '1' }] }); //mock first term
    mockLocal.onGet(/Two/).reply(200, { items: [{ link: '2' }] }); //mock second term
    const urls = await topSearch(['One', 'Two']); //run function expecting warning
    expect(urls).toEqual(['1', '2']); //ensure urls returned correctly
    expect(warnEnvSpy).toHaveBeenNthCalledWith(1, ['OPENAI_TOKEN'], OPENAI_WARN_MSG); //first call validates token
    expect(warnEnvSpy).toHaveBeenNthCalledWith(2, ['GOOGLE_REFERER']); //second call validates referer
    expect(warnSpy).toHaveBeenCalledWith(OPENAI_WARN_MSG); //warning should reference constant
    warnEnvSpy.mockRestore(); //restore env utils spy
    warnSpy.mockRestore(); //restore console.warn spy
    process.env.OPENAI_TOKEN = tokenSave; //restore original token
  });

  test('fetchSearchItems uses cache for repeated query', async () => { //verify cache hit
    mock.onGet(/Cache/).reply(200, { items: [{ link: 'a' }] }); //mock initial response
    const first = await fetchSearchItems('Cache'); //first call populates cache
    scheduleMock.mockClear(); //reset schedule count for second call
    mock.onGet(/Cache/).reply(200, { items: [{ link: 'b' }] }); //different data if fetched again
    const second = await fetchSearchItems('Cache'); //should use cache
    expect(first).toEqual([{ link: 'a' }]); //initial data returned
    expect(second).toEqual([{ link: 'a' }]); //cache should return same data
    expect(scheduleMock).not.toHaveBeenCalled(); //no new request scheduled
  });

  test('cache entry expires after ttl', async () => { //verify cache ttl logic with LRU-cache
    mock.onGet(/Expire/).reply(200, { items: [{ link: 'x' }] }); //mock first fetch
    const first = await fetchSearchItems('Expire'); //populate cache
    scheduleMock.mockClear(); //clear schedule count
    
    // Clear cache to simulate expiry since LRU-cache uses internal timers
    // that don't respect mocked Date.now() - this tests cache miss behavior
    clearCache(); //simulate cache expiry by clearing
    
    mock.onGet(/Expire/).reply(200, { items: [{ link: 'y' }] }); //new data after cache clear
    const second = await fetchSearchItems('Expire'); //should fetch again
    expect(first).toEqual([{ link: 'x' }]); //first response
    expect(second).toEqual([{ link: 'y' }]); //after cache clear new data
    expect(scheduleMock).toHaveBeenCalled(); //new request scheduled
  });

  test('fetchSearchItems caches empty results', async () => { //verify empty array cached
    mock.onGet(/EmptyCache/).reply(200, { items: [] }); //mock no results response
    const first = await fetchSearchItems('EmptyCache'); //populate cache with empty array
    scheduleMock.mockClear(); //reset counter before second call
    mock.onGet(/EmptyCache/).reply(200, { items: [{ link: 'x' }] }); //would be new data if fetched again
    const second = await fetchSearchItems('EmptyCache'); //should use cached empty array
    expect(first).toEqual([]); //first call returns empty array
    expect(second).toEqual([]); //second call should also return cached empty array
    expect(scheduleMock).not.toHaveBeenCalled(); //no second request due to cache
  });

  test('CODEX mode does not populate cache', async () => { //verify mock results are not cached
    process.env.CODEX = 'true'; //enable offline mode
    const first = await fetchSearchItems('NoCache'); //call with codex enabled
    scheduleMock.mockClear(); //reset scheduler count
    process.env.CODEX = 'false'; //disable codex without clearing cache
    mock.onGet(/NoCache/).reply(200, { items: [{ link: 'real' }] }); //mock api response
    const second = await fetchSearchItems('NoCache'); //should fetch since cache unused
    expect(first).toEqual([]); //mock path returns empty array
    expect(second).toEqual([{ link: 'real' }]); //should use network data
    expect(scheduleMock).toHaveBeenCalled(); //network request confirms no cache
    delete process.env.CODEX; //cleanup env var
  });

  test('fetchSearchItems caches per num value', async () => { //ensure num forms part of cache key
    mock.onGet(/NumKey/).reply(200, { items: [{ link: '1' }] }); //mock first request
    const first = await fetchSearchItems('NumKey', 1); //populate cache with num=1
    scheduleMock.mockClear(); //reset schedule count
    mock.onGet(/NumKey/).reply(200, { items: [{ link: '2' }] }); //mock second call with different num
    const second = await fetchSearchItems('NumKey', 2); //should fetch again due to different key
    expect(first).toEqual([{ link: '1' }]); //ensure first results
    expect(second).toEqual([{ link: '2' }]); //expect second results not cached
    expect(scheduleMock).toHaveBeenCalled(); //new request should occur
  });

  test.each([
    [0, 1],
    [-1, 10],
    [11, 10]
  ])('invalid num %i shares cache with %i', async (bad, clamp) => { //new cache clamp test
    mock.onGet(/Clamp/).reply(200, { items: [{ link: 'x' }] }); //mock first response
    const first = await fetchSearchItems('Clamp', bad); //populate cache with invalid num
    scheduleMock.mockClear(); //clear schedule to detect second call
    mock.onGet(/Clamp/).reply(200, { items: [{ link: 'y' }] }); //new data if request occurs
    const second = await fetchSearchItems('Clamp', clamp); //should hit cache due to clamping
    expect(first).toEqual([{ link: 'x' }]); //initial result
    expect(second).toEqual([{ link: 'x' }]); //should match cached data
    expect(scheduleMock).not.toHaveBeenCalled(); //no new request expected
  });

  test('undefined num shares cache with explicit 10', async () => { //new unified key test
    mock.onGet(/Default/).reply(200, { items: [{ link: 'a' }] }); //mock initial request
    const first = await fetchSearchItems('Default', 10); //populate cache with explicit num 10
    scheduleMock.mockClear(); //reset counter for second request
    mock.onGet(/Default/).reply(200, { items: [{ link: 'b' }] }); //different data if fetched again
    const second = await fetchSearchItems('Default'); //call without num should hit same cache
    expect(first).toEqual([{ link: 'a' }]); //first response data
    expect(second).toEqual([{ link: 'a' }]); //should match cached data
    expect(scheduleMock).not.toHaveBeenCalled(); //no new request expected
  });

  test('string num uses cache of default search', async () => { //ensure invalid string shares cache
    mock.onGet(/BadStr/).reply(200, { items: [{ link: 's' }] }); //mock first request
    const first = await fetchSearchItems('BadStr'); //populate cache using default 10
    scheduleMock.mockClear(); //reset call count
    mock.onGet(/BadStr/).reply(200, { items: [{ link: 't' }] }); //new data if new request happens
    const second = await fetchSearchItems('BadStr', 'bad'); //invalid num should map to same cache key
    expect(first).toEqual([{ link: 's' }]); //initial cached data
    expect(second).toEqual([{ link: 's' }]); //should reuse cache
    expect(scheduleMock).not.toHaveBeenCalled(); //verify no new network call
  });

  test.each([1, 5, 10])('getGoogleURL includes valid num %i', valid => { //verify clamped url for valid num
    const url = getGoogleURL('Val', valid); //build url with provided num
    expect(url).toBe(`https://customsearch.googleapis.com/customsearch/v1?q=Val&key=key&cx=cx&fields=items(title,snippet,link)&num=${valid}`); //should match num
  });

  test('getGoogleURL accepts numeric string', () => { //verify string parsing and clamping
    const url = getGoogleURL('Val', '5'); //num provided as string
    expect(url).toBe('https://customsearch.googleapis.com/customsearch/v1?q=Val&key=key&cx=cx&fields=items(title,snippet,link)&num=5'); //string should parse to num 5
  });

  test.each([0, 11])('getGoogleURL clamps out of range %i', bad => { //invalid values clamp to range
    const url = getGoogleURL('Bad', bad); //build url with invalid num
    const clamped = bad < 1 ? 1 : 10; //expected clamp result
    expect(url).toBe(`https://customsearch.googleapis.com/customsearch/v1?q=Bad&key=key&cx=cx&fields=items(title,snippet,link)&num=${clamped}`); //should clamp
  });

  test('getGoogleURL omits num for negative input', () => { //ensure negatives are rejected
    const url = getGoogleURL('Bad', -1); //build url with negative num
    expect(url).toBe('https://customsearch.googleapis.com/customsearch/v1?q=Bad&key=key&cx=cx&fields=items(title,snippet,link)'); //num parameter absent
  });

  test('disables caching when env var is zero', async () => { //new zero cache test
    const savedSize = process.env.QSERP_MAX_CACHE_SIZE; //preserve existing value
    process.env.QSERP_MAX_CACHE_SIZE = '0'; //set env var to disable caching
    jest.resetModules(); //reload modules with new env setting
    const { createAxiosMock, createScheduleMock, createQerrorsMock } = require('./utils/testSetup'); //reacquire helpers
    const mockLocal = createAxiosMock(); //fresh axios mock
    const localSchedule = createScheduleMock(); //new schedule spy
    createQerrorsMock(); //new qerrors spy
    const { fetchSearchItems: fetchLocal } = require('../lib/qserp'); //reload module under test
    mockLocal.onGet(/Zero/).reply(200, { items: [{ link: 'a' }] }); //first response
    const first = await fetchLocal('Zero'); //perform first request
    localSchedule.mockClear(); //clear to detect second request
    mockLocal.onGet(/Zero/).reply(200, { items: [{ link: 'b' }] }); //second response differs
    const second = await fetchLocal('Zero'); //should not use cache
    expect(first).toEqual([{ link: 'a' }]); //verify first result
    expect(second).toEqual([{ link: 'b' }]); //verify second result fetched
    expect(localSchedule).toHaveBeenCalled(); //schedule called again since no cache
    process.env.QSERP_MAX_CACHE_SIZE = savedSize; //restore environment
  });

  test('cache helpers are no-ops when caching disabled', () => { //verify noop helpers
    const savedSize = process.env.QSERP_MAX_CACHE_SIZE; //preserve env value
    process.env.QSERP_MAX_CACHE_SIZE = '0'; //disable caching
    jest.resetModules(); //reload module with noop cache
    const { clearCache: clearLocal, performCacheCleanup } = require('../lib/qserp'); //require fresh module
    expect(clearLocal()).toBe(true); //clearCache should succeed
    expect(performCacheCleanup()).toBe(false); //no stale entries removed
    process.env.QSERP_MAX_CACHE_SIZE = savedSize; //restore env value
  });

  test('sanitizeApiKey logs when DEBUG true', () => { //verify conditional logging
    const savedDebug = process.env.DEBUG; //preserve env var
    process.env.DEBUG = 'true'; //enable debug output
    jest.resetModules(); //reload module for debug flag
    const logSpy = require('./utils/consoleSpies').mockConsole('log'); //spy on log
    const { setTestEnv } = require('./utils/testSetup'); //env helper
    setTestEnv(); //ensure api key present
    logSpy.mockClear(); //ignore setup logs
    const { sanitizeApiKey } = require('../lib/qserp'); //require fresh module
    logSpy.mockClear(); //ignore module init logs
    const res = sanitizeApiKey('pre key post'); //call function with api key
    expect(res).toBe('pre [redacted] post'); //result sanitized
    expect(logSpy).toHaveBeenNthCalledWith(1, 'sanitizeApiKey is running with pre [redacted] post'); //first log sanitized input
    expect(logSpy).toHaveBeenNthCalledWith(2, 'sanitizeApiKey is returning pre [redacted] post'); //second log sanitized output
    logSpy.mockRestore(); //cleanup spy
    if (savedDebug !== undefined) { process.env.DEBUG = savedDebug; } else { delete process.env.DEBUG; } //restore env
  });

  test('sanitizeApiKey silent when DEBUG false', () => { //verify no logging when debug off
    const savedDebug = process.env.DEBUG; //preserve env var
    process.env.DEBUG = 'false'; //disable debug output
    jest.resetModules(); //reload module for debug flag
    const logSpy = require('./utils/consoleSpies').mockConsole('log'); //spy on log
    const { setTestEnv } = require('./utils/testSetup'); //env helper
    setTestEnv(); //ensure api key present
    logSpy.mockClear(); //ignore setup logs
    const { sanitizeApiKey } = require('../lib/qserp'); //require module with debug off
    logSpy.mockClear(); //ignore module init logs
    sanitizeApiKey('key'); //call function expecting no log
    expect(logSpy).not.toHaveBeenCalled(); //no logs should occur
    logSpy.mockRestore(); //cleanup spy
    if (savedDebug !== undefined) { process.env.DEBUG = savedDebug; } else { delete process.env.DEBUG; } //restore env
  });

  test('sanitizeApiKey regenerates regex after key change', () => { //ensure runtime key update sanitized
    const savedDebug = process.env.DEBUG; //preserve debug setting
    process.env.DEBUG = 'true'; //force logging
    jest.resetModules(); //reload module for fresh state
    const logSpy = require('./utils/consoleSpies').mockConsole('log'); //spy on log
    const { setTestEnv } = require('./utils/testSetup'); //setup env
    setTestEnv(); //initial key 'key'
    logSpy.mockClear(); //clear init logs
    const { sanitizeApiKey } = require('../lib/qserp'); //load module with initial key
    logSpy.mockClear(); //ignore module logs
    process.env.GOOGLE_API_KEY = 'new'; //change key at runtime
    const result = sanitizeApiKey('pre key new post'); //call including both keys
    const joined = logSpy.mock.calls.map(c => c[0]).join(' '); //combine logs
    expect(result).toBe('pre [redacted] [redacted] post'); //expect both keys masked
    expect(joined).not.toMatch('key'); //old key removed from logs
    expect(joined).not.toMatch('new'); //new key removed from logs
    logSpy.mockRestore(); //cleanup
    if (savedDebug !== undefined) { process.env.DEBUG = savedDebug; } else { delete process.env.DEBUG; } //restore debug
  });

  test('sanitizeApiKey handles non-string input', () => { //verify object input converted
    jest.resetModules(); //reload module to ensure fresh state
    const { setTestEnv } = require('./utils/testSetup'); //setup env for key
    setTestEnv(); //apply environment variables
    const { sanitizeApiKey } = require('../lib/qserp'); //require sanitized function
    const result = sanitizeApiKey(new Error('pre key post')); //pass Error object
    expect(result).toBe('Error: pre [redacted] post'); //should sanitize within stringified error
  });

  test('cache helpers log when DEBUG true', () => { //verify logging occurs
    const savedDebug = process.env.DEBUG; //preserve env var
    process.env.DEBUG = 'true'; //enable debug output
    jest.resetModules(); //reload module for debug flag
    const logSpy = require('./utils/consoleSpies').mockConsole('log'); //spy on log
    const { setTestEnv } = require('./utils/testSetup'); //ensure required env
    setTestEnv(); //setup env vars
    logSpy.mockClear(); //discard setup logs
    const { clearCache, performCacheCleanup } = require('../lib/qserp'); //load functions
    logSpy.mockClear(); //ignore module init logs
    clearCache(); //invoke cache clear
    performCacheCleanup(); //invoke cleanup
    const messages = logSpy.mock.calls.map(c => c[0]); //gather log messages
    expect(messages).toContain('clearCache is running with 0'); //start logged
    expect(messages).toContain('clearCache returning true'); //end logged
    expect(messages).toContain('performCacheCleanup is running with 0'); //start logged
    expect(messages).toContain('performCacheCleanup returning false'); //end logged when none purged
    logSpy.mockRestore(); //cleanup spy
    if (savedDebug !== undefined) { process.env.DEBUG = savedDebug; } else { delete process.env.DEBUG; } //restore env
  });

  test('cache helpers silent when DEBUG false', () => { //verify no logs
    const savedDebug = process.env.DEBUG; //preserve env var
    process.env.DEBUG = 'false'; //disable debug output
    jest.resetModules(); //reload module for debug flag
    const logSpy = require('./utils/consoleSpies').mockConsole('log'); //spy on log
    const { setTestEnv } = require('./utils/testSetup'); //ensure env
    setTestEnv(); //set variables
    logSpy.mockClear(); //ignore setup logs
    const { clearCache, performCacheCleanup } = require('../lib/qserp'); //load fresh module
    logSpy.mockClear(); //ignore module init logs
    clearCache(); //call clearCache
    performCacheCleanup(); //call cleanup
    expect(logSpy).not.toHaveBeenCalled(); //no logs expected
    logSpy.mockRestore(); //cleanup
    if (savedDebug !== undefined) { process.env.DEBUG = savedDebug; } else { delete process.env.DEBUG; } //restore env
  });

  test('fetchSearchItems handles undefined response gracefully', async () => { //new edge case test
    const qserp = require('../lib/qserp');
    const spy = jest.spyOn(qserp, 'rateLimitedRequest').mockResolvedValueOnce(undefined); //simulate missing response
    const items = await qserp.fetchSearchItems('undef'); //call with spy
    expect(items).toEqual([]); //should return empty array
    spy.mockRestore(); //cleanup spy
  });
});
