// Summary: internalFunctions.test.js validates module behavior and edge cases
const { initSearchTest, resetMocks } = require('./utils/testSetup'); //import helpers for env and mocks
const { mockConsole } = require('./utils/consoleSpies'); //added console spy helper

let mock; //axios mock reference
let scheduleMock; //bottleneck schedule reference
let qerrorsMock; //qerrors mock reference

beforeEach(() => {
  ({ mock, scheduleMock, qerrorsMock } = initSearchTest()); //reinit env and mocks
  resetMocks(mock, scheduleMock, qerrorsMock); //clear histories
});

test('rateLimitedRequest calls limiter and sets headers', async () => { // rateLimitedRequest calls limiter and sets headers
  mock.onGet('http://test').reply(200, {}); //mock axios success
  const { rateLimitedRequest } = require('../lib/qserp');
  await rateLimitedRequest('http://test');
  expect(scheduleMock).toHaveBeenCalled();
  expect(typeof scheduleMock.mock.calls[0][0]).toBe('function');
  const config = mock.history.get[0].headers; //fetch request headers
  expect(config['User-Agent']).toMatch(/Mozilla/);
});

test('rateLimitedRequest sets Referer header when env set', async () => { // rateLimitedRequest sets Referer header when env set
  mock.onGet('http://refer').reply(200, {}); //mock axios response
  const { rateLimitedRequest } = require('../lib/qserp');
  await rateLimitedRequest('http://refer');
  const config = mock.history.get[0].headers; //inspect request headers
  expect(config.Referer).toBe('http://example.com'); //header should match env var
});

test('rateLimitedRequest uses custom axios instance', async () => { //verify instance path
  mock.onGet('http://inst').reply(200, {}); //mock via instance
  const { rateLimitedRequest, axiosInstance } = require('../lib/qserp');
  const globalSpy = jest.spyOn(require('axios'), 'get'); //spy default axios
  const instSpy = jest.spyOn(axiosInstance, 'get'); //spy instance
  await rateLimitedRequest('http://inst'); //trigger request
  expect(instSpy).toHaveBeenCalled(); //instance should handle call
  expect(globalSpy).not.toHaveBeenCalled(); //default axios unused
  globalSpy.mockRestore(); //cleanup spies
  instSpy.mockRestore();
});

test('rateLimitedRequest rejects on axios failure and schedules call', async () => { // rateLimitedRequest rejects on axios failure and schedules call
  mock.onGet('http://bad').networkError(); //simulate network error
  const { rateLimitedRequest } = require('../lib/qserp');
  await expect(rateLimitedRequest('http://bad')).rejects.toThrow('Network Error'); //axios rejects with error
  expect(scheduleMock).toHaveBeenCalled(); //ensure schedule invoked despite rejection
});

test('fetchSearchItems returns items and uses num argument', async () => { //ensure param passed
  mock.onGet(/term/).reply(200, { items: [{ link: 'x' }] }); //mock success using adapter
  const { fetchSearchItems } = require('../lib/qserp'); //load helper
  const items = await fetchSearchItems('term', 2); //invoke helper with num
  expect(items).toEqual([{ link: 'x' }]); //check items array
  expect(scheduleMock).toHaveBeenCalled(); //ensure schedule used
  expect(mock.history.get[0].url).toBe('https://customsearch.googleapis.com/customsearch/v1?q=term&key=key&cx=cx&fields=items(title,snippet,link)&num=2'); //url should include num and fields filter
});

test('getGoogleURL builds proper url', () => { // getGoogleURL builds proper url
  const { getGoogleURL } = require('../lib/qserp');
  const url = getGoogleURL('hello world');
  expect(url).toBe('https://customsearch.googleapis.com/customsearch/v1?q=hello%20world&key=key&cx=cx&fields=items(title,snippet,link)');
  const urlNum = getGoogleURL('hello', 5); //pass num argument
  expect(urlNum).toBe('https://customsearch.googleapis.com/customsearch/v1?q=hello&key=key&cx=cx&fields=items(title,snippet,link)&num=5'); //should include num param and fields filter
});

test('getGoogleURL encodes key and cx values', () => { // getGoogleURL encodes key and cx values
  process.env.GOOGLE_API_KEY = 'k+/val'; //set api key with special chars
  process.env.GOOGLE_CX = 'cx/+'; //set cx with special chars
  const { getGoogleURL } = require('../lib/qserp');
  const url = getGoogleURL('encode');
  expect(url).toBe('https://customsearch.googleapis.com/customsearch/v1?q=encode&key=k%2B%2Fval&cx=cx%2F%2B&fields=items(title,snippet,link)'); //encoded key and cx
});

test('handleAxiosError logs with qerrors and returns true', async () => { // handleAxiosError logs with qerrors and returns true
  const { handleAxiosError } = require('../lib/qserp');
  const err = new Error('fail');
  const res = await handleAxiosError(err, 'ctx');
  expect(res).toBe(true);
  expect(qerrorsMock).toHaveBeenCalled();
});

test('handleAxiosError logs sanitized response object and returns true', async () => { //updated test to verify sanitization
  const { handleAxiosError } = require('../lib/qserp'); //require function under test
  const err = { response: { status: 500, config: { url: 'http://x?key=key' } } }; //mock error with key in url
  const spy = mockConsole('error'); //spy on console.error via helper
  const res = await handleAxiosError(err, 'ctx'); //call function with response error
  expect(res).toBe(true); //should return true
  const logged = spy.mock.calls[0][0]; //capture logged string for inspection
  expect(logged).not.toContain('key=key'); //verify key removed from log
  const parsed = JSON.parse(logged); //parse JSON string back to object
  expect(parsed.config.url).toBe('http://x?key=[redacted]'); //parameter name preserved
  spy.mockRestore(); //restore console.error
});

test('handleAxiosError masks api key in network error logs', async () => { // handleAxiosError masks api key in network error logs
  const { handleAxiosError } = require('../lib/qserp'); //load function under test
  const err = { request: {}, message: 'bad key=key', config: { url: 'http://x?key=key' } }; //mock network error with key
  const spy = mockConsole('error'); //spy on console.error
  const res = await handleAxiosError(err, 'ctx'); //call handler
  expect(res).toBe(true); //should succeed
  const logged = spy.mock.calls[0][0]; //grab logged string
  expect(logged).not.toContain('key=key'); //ensure key removed
  spy.mockRestore(); //cleanup spy
});

test('handleAxiosError passes sanitized error to qerrors', async () => { //verify qerrors arg
  const { handleAxiosError } = require('../lib/qserp'); //load function
  const err = new Error('bad key=key'); //create error with key in message
  err.config = { url: 'http://x?key=key' }; //attach url containing key
  await handleAxiosError(err, 'ctx'); //invoke handler
  const arg = qerrorsMock.mock.calls[0][0]; //extract error passed to qerrors
  expect(arg).not.toBe(err); //should be copied
  expect(arg.message).toBe('bad key=[redacted]'); //only api key value masked
  expect(arg.config.url).toBe('http://x?key=[redacted]'); //parameter name kept
  expect(arg.stack).toBe(err.stack); //stack should be retained on sanitized copy
});

test('handleAxiosError passes original error name to qerrors', async () => { //verify preserved name
  const { handleAxiosError } = require('../lib/qserp'); //import function
  const err = new Error('named');
  err.name = 'NamedError';
  await handleAxiosError(err, 'ctx');
  const arg = qerrorsMock.mock.calls[0][0];
  expect(arg.name).toBe('NamedError'); //sanitized error keeps original name
});

test('handleAxiosError returns false when qerrors throws', async () => { //verify fallback on qerrors failure
  const { handleAxiosError } = require('../lib/qserp'); //load function under test
  const err = new Error('bad'); //mock basic error
  qerrorsMock.mockImplementationOnce(() => { throw new Error('qe'); }); //first call throws
  qerrorsMock.mockImplementation(() => {}); //subsequent calls succeed
  const spy = mockConsole('error'); //spy on console.error via helper
  const res = await handleAxiosError(err, 'ctx'); //invoke handler expecting false
  expect(res).toBe(false); //should return false due to catch block
  expect(spy).toHaveBeenCalled(); //console.error should log error message
  spy.mockRestore(); //restore console.error
}); //end test ensuring failure path

test.each(['True', 'true', 'TRUE', true, ' true '])('rateLimitedRequest returns mock when CODEX=%s', async val => {
  process.env.CODEX = val; //set CODEX variant to trigger mock response
  ({ mock, scheduleMock, qerrorsMock } = initSearchTest()); //reinit with CODEX set
  const { rateLimitedRequest } = require('../lib/qserp'); //import after env setup
  const res = await rateLimitedRequest('http://codex'); //call function expecting mock
  const expected = { data: { items: [] } }; //expected mock structure
  expect(res).toEqual(expected); //mocked object should match structure
  expect(scheduleMock).not.toHaveBeenCalled(); //limiter should be bypassed
  expect(mock.history.get.length).toBe(0); //axios should not receive any request
  delete process.env.CODEX; //clean up env variable for other tests
}); //test ensures CODEX variants including whitespace bypass network

test('rateLimitedRequest returns mock when CODEX has spaces', async () => { // verify trimming of CODEX env var
  process.env.CODEX = ' true '; //value with spaces should still enable mock mode
  ({ mock, scheduleMock, qerrorsMock } = initSearchTest()); //reinitialize with CODEX set
  const { rateLimitedRequest } = require('../lib/qserp'); //require after env modifications
  const res = await rateLimitedRequest('http://codex-space'); //expect mocked response due to trimmed true
  expect(res).toEqual({ data: { items: [] } }); //mocked structure should match
  expect(scheduleMock).not.toHaveBeenCalled(); //no rate limiting when offline
  expect(mock.history.get.length).toBe(0); //axios not executed
  delete process.env.CODEX; //cleanup env variable
}); //test ensures CODEX with whitespace bypasses network

test('fetchSearchItems bypasses url build in CODEX mode', async () => { // fetchSearchItems bypasses url build in CODEX mode
  process.env.CODEX = 'true'; //enable codex offline mode
  ({ mock, scheduleMock, qerrorsMock } = initSearchTest()); //reinit with codex flag
  const qserp = require('../lib/qserp'); //import after env set
  const spy = jest.spyOn(qserp, 'rateLimitedRequest'); //spy on internal request function
  const items = await qserp.fetchSearchItems('offline'); //call fetch expecting mock
  expect(items).toEqual([]); //mock response should be empty array
  expect(scheduleMock).not.toHaveBeenCalled(); //rate limiter should not schedule
  expect(mock.history.get.length).toBe(0); //axios should not build any url
  expect(spy).not.toHaveBeenCalled(); //verify no call to rateLimitedRequest
  spy.mockRestore(); //clean up spy
  delete process.env.CODEX; //cleanup codex flag
}); //test verifies fetchSearchItems skips url creation and internal request when CODEX true

test('fetchSearchItems does not create cache key in CODEX mode', async () => { //ensure cache bypassed
  process.env.CODEX = 'true'; //enable codex offline
  ({ mock, scheduleMock, qerrorsMock } = initSearchTest()); //reinitialize mocks
  const qserp = require('../lib/qserp'); //require module with CODEX true
  const keySpy = jest.spyOn(qserp, 'createCacheKey'); //spy on key creation helper
  const res = await qserp.fetchSearchItems('skipKey'); //invoke fetch expecting bypass
  expect(res).toEqual([]); //mocked empty array
  expect(keySpy).not.toHaveBeenCalled(); //no cache key generated
  expect(qserp.performCacheCleanup()).toBe(false); //cache remains empty
  keySpy.mockRestore(); //restore spy
  delete process.env.CODEX; //clean environment
}); //test ensures CODEX mode avoids cache access

test('validateSearchQuery accepts non-empty strings', () => { //(verify valid input)
  const { validateSearchQuery } = require('../lib/qserp'); //import helper
  expect(validateSearchQuery('ok')).toBe(true); //should return true for normal string
});

test.each(['', '   ', 1, {}, []])('validateSearchQuery throws for %p', val => { //(verify invalid inputs)
  const { validateSearchQuery } = require('../lib/qserp'); //import helper
  expect(() => validateSearchQuery(val)).toThrow('Query must be a non-empty string'); //expect error thrown
});

test('sanitizeApiKey replaces all matches', () => { //ensure global replacement
  const { sanitizeApiKey } = require('../lib/qserp'); //import function under test
  const res = sanitizeApiKey('start key middle key end'); //call with repeated key
  expect(res).toBe('start [redacted] middle [redacted] end'); //expect both replaced
});

test('sanitizeApiKey ignores partial-word matches', () => { //verify no substring replacement
  const { sanitizeApiKey } = require('../lib/qserp'); //load helper
  const res = sanitizeApiKey('monkey business key=key'); //include word containing key
  expect(res).toBe('monkey business key=[redacted]'); //only value replaced
});

test('sanitizeApiKey masks encoded api key parameters', () => { //verify encoded value replaced
  process.env.GOOGLE_API_KEY = 'a+b'; //set key with special char
  const { sanitizeApiKey } = require('../lib/qserp'); //load function
  const res = sanitizeApiKey(`http://x?key=${encodeURIComponent('a+b')}`); //call with encoded value
  expect(res).toBe('http://x?key=[redacted]'); //value should be masked
});

test('sanitizeApiKey escapes special characters in logs and urls', () => { //verify chars like * and .
  const savedDebug = process.env.DEBUG; //preserve debug
  process.env.DEBUG = 'true'; //enable logging to inspect output
  process.env.GOOGLE_API_KEY = 'a*b'; //set key with metachar
  jest.resetModules(); //reload module with new env
  const { sanitizeApiKey } = require('../lib/qserp'); //import after env change
  const logSpy = require('./utils/consoleSpies').mockConsole('log'); //spy log output
  const url = `http://x?key=${encodeURIComponent('a*b')}`; //build url containing key
  const res = sanitizeApiKey(url); //sanitize url with special key
  expect(res).toBe('http://x?key=[redacted]'); //url should be sanitized
  const logs = logSpy.mock.calls.map(c => c[0].toString()).join(' '); //collect logs
  expect(logs).not.toContain('a*b'); //raw key should not appear
  expect(logs).not.toContain(encodeURIComponent('a*b')); //encoded key should not appear
  logSpy.mockRestore(); //cleanup spy
  if (savedDebug !== undefined) { process.env.DEBUG = savedDebug; } else { delete process.env.DEBUG; } //restore debug
});

test('sanitizeApiKey returns sanitized string when regex fails', () => { //trigger catch branch
  const savedDebug = process.env.DEBUG; //preserve debug flag
  process.env.DEBUG = 'true'; //enable debug logging
  jest.resetModules(); //reload module to capture debug flag
  const { sanitizeApiKey } = require('../lib/qserp'); //load function with debug
  const logSpy = require('./utils/consoleSpies').mockConsole('log'); //spy console.log
  const originalEncode = global.encodeURIComponent; //capture original function
  global.encodeURIComponent = jest.fn(() => { throw new Error('boom'); }); //force failure
  const result = sanitizeApiKey('text key text'); //execute with failing encode and key present
  expect(result).toBe('text [redacted] text'); //should return sanitized value
  const logs = logSpy.mock.calls.map(c => c[0]); //captured log messages
  expect(logs).toContain('sanitizeApiKey is running with text [redacted] text'); //logs contain sanitized start message
  expect(logs).toContain('sanitizeApiKey is returning text [redacted] text'); //logs contain sanitized end message
  global.encodeURIComponent = originalEncode; //restore encodeURIComponent
  logSpy.mockRestore(); //cleanup spy
  if (savedDebug !== undefined) { process.env.DEBUG = savedDebug; } else { delete process.env.DEBUG; } //restore env
});

test('sanitizeApiKey masks encoded key when encodeURIComponent fails', () => { //verify encoded regex in catch
  const savedDebug = process.env.DEBUG; //preserve debug
  process.env.DEBUG = 'true'; //enable logging to trigger messages
  const encoded = encodeURIComponent('key'); //prepare encoded key before stub
  jest.resetModules(); //reload with debug
  const { sanitizeApiKey } = require('../lib/qserp'); //import sanitized helper
  const logSpy = require('./utils/consoleSpies').mockConsole('log'); //spy log output
  const originalEncode = global.encodeURIComponent; //save original function
  global.encodeURIComponent = jest.fn(() => { throw new Error('fail'); }); //force failure
  const res = sanitizeApiKey(`http://x?key=${encoded}`); //call with encoded key
  expect(res).toBe('http://x?key=[redacted]'); //encoded parameter masked
  global.encodeURIComponent = originalEncode; //restore function
  logSpy.mockRestore(); //cleanup spy
  if (savedDebug !== undefined) { process.env.DEBUG = savedDebug; } else { delete process.env.DEBUG; } //restore env
});

test('sanitizeApiKey handles object input via toString', () => { //non-string object sanitization
  const { sanitizeApiKey } = require('../lib/qserp'); //load helper after env setup
  const obj = { toString() { return 'obj key=key'; } }; //object with key in toString
  const res = sanitizeApiKey(obj); //invoke with object
  expect(res).toBe('obj key=[redacted]'); //object string sanitized
});

test('sanitizeApiKey handles number input without error', () => { //numeric input sanitization
  const { sanitizeApiKey } = require('../lib/qserp'); //load helper
  const res = sanitizeApiKey(123); //invoke with number
  expect(res).toBe('123'); //result coerced to string
});

test('normalizeNum returns null when parseInt throws', () => { //validate catch path
  const { normalizeNum } = require('../lib/qserp'); //load function under test
  const parseSpy = jest.spyOn(global, 'parseInt').mockImplementation(() => { throw new Error('bad'); }); //mock parseInt throw
  const logSpy = require('./utils/consoleSpies').mockConsole('log'); //spy on logging
  const res = normalizeNum('5'); //invoke with numeric string
  expect(res).toBeNull(); //should return null due to error
  parseSpy.mockRestore(); //restore parseInt
  logSpy.mockRestore(); //restore console
});

test.each(['10abc', '4.5'])('normalizeNum returns null for invalid integer strings %p', val => { //reject mixed characters and decimals
  const { normalizeNum } = require('../lib/qserp'); //load helper
  const res = normalizeNum(val); //validate with invalid input
  expect(res).toBeNull(); //should return null for invalid string
});

test.each(['plain error', { foo: 'bar' }])('handleAxiosError handles %p input', async val => {
  const { handleAxiosError } = require('../lib/qserp'); //load function under test
  const res = await handleAxiosError(val, 'ctx'); //invoke with arbitrary input
  expect(res).toBe(true); //should succeed without throwing
  expect(qerrorsMock).toHaveBeenCalled(); //qerrors should still log
});
