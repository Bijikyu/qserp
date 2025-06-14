const { initSearchTest, resetMocks } = require('./utils/testSetup'); //import helpers for env and mocks
const { mockConsole } = require('./utils/consoleSpies'); //added console spy helper

let mock; //axios mock reference
let scheduleMock; //bottleneck schedule reference
let qerrorsMock; //qerrors mock reference

beforeEach(() => {
  ({ mock, scheduleMock, qerrorsMock } = initSearchTest()); //reinit env and mocks
  resetMocks(mock, scheduleMock, qerrorsMock); //clear histories
});

test('rateLimitedRequest calls limiter and sets headers', async () => {
  mock.onGet('http://test').reply(200, {}); //mock axios success
  const { rateLimitedRequest } = require('../lib/qserp');
  await rateLimitedRequest('http://test');
  expect(scheduleMock).toHaveBeenCalled();
  expect(typeof scheduleMock.mock.calls[0][0]).toBe('function');
  const config = mock.history.get[0].headers; //fetch request headers
  expect(config['User-Agent']).toMatch(/Mozilla/);
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

test('rateLimitedRequest rejects on axios failure and schedules call', async () => {
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
  expect(mock.history.get[0].url).toBe('https://www.googleapis.com/customsearch/v1?q=term&key=key&cx=cx&fields=items(title,snippet,link)&num=2'); //url should include num and fields filter
});

test('getGoogleURL builds proper url', () => {
  const { getGoogleURL } = require('../lib/qserp');
  const url = getGoogleURL('hello world');
  expect(url).toBe('https://www.googleapis.com/customsearch/v1?q=hello%20world&key=key&cx=cx&fields=items(title,snippet,link)');
  const urlNum = getGoogleURL('hello', 5); //pass num argument
  expect(urlNum).toBe('https://www.googleapis.com/customsearch/v1?q=hello&key=key&cx=cx&fields=items(title,snippet,link)&num=5'); //should include num param and fields filter
});

test('getGoogleURL encodes key and cx values', () => {
  process.env.GOOGLE_API_KEY = 'k+/val'; //set api key with special chars
  process.env.GOOGLE_CX = 'cx/+'; //set cx with special chars
  jest.resetModules(); //reload module with new env vars
  const { getGoogleURL } = require('../lib/qserp');
  const url = getGoogleURL('encode');
  expect(url).toBe('https://www.googleapis.com/customsearch/v1?q=encode&key=k%2B%2Fval&cx=cx%2F%2B&fields=items(title,snippet,link)'); //encoded key and cx
});

test('handleAxiosError logs with qerrors and returns true', () => {
  const { handleAxiosError } = require('../lib/qserp');
  const err = new Error('fail');
  const res = handleAxiosError(err, 'ctx');
  expect(res).toBe(true);
  expect(qerrorsMock).toHaveBeenCalled();
});

test('handleAxiosError logs sanitized response object and returns true', () => { //updated test to verify sanitization
  const { handleAxiosError } = require('../lib/qserp'); //require function under test
  const err = { response: { status: 500, config: { url: 'http://x?key=key' } } }; //mock error with key in url
  const spy = mockConsole('error'); //spy on console.error via helper
  const res = handleAxiosError(err, 'ctx'); //call function with response error
  expect(res).toBe(true); //should return true
  const logged = spy.mock.calls[0][0]; //capture logged object for inspection
  expect(JSON.stringify(logged)).not.toContain('key=key'); //verify key removed from log
  expect(logged.config.url).toBe('http://x?[redacted]=[redacted]'); //url should be fully sanitized
  spy.mockRestore(); //restore console.error
});

test('handleAxiosError masks api key in network error logs', () => {
  const { handleAxiosError } = require('../lib/qserp'); //load function under test
  const err = { request: {}, message: 'bad key=key', config: { url: 'http://x?key=key' } }; //mock network error with key
  const spy = mockConsole('error'); //spy on console.error
  const res = handleAxiosError(err, 'ctx'); //call handler
  expect(res).toBe(true); //should succeed
  const logged = spy.mock.calls[0][0]; //grab logged string
  expect(logged).not.toContain('key=key'); //ensure key removed
  spy.mockRestore(); //cleanup spy
});

test('handleAxiosError passes sanitized error to qerrors', () => { //verify qerrors arg
  const { handleAxiosError } = require('../lib/qserp'); //load function
  const err = new Error('bad key=key'); //create error with key in message
  err.config = { url: 'http://x?key=key' }; //attach url containing key
  handleAxiosError(err, 'ctx'); //invoke handler
  const arg = qerrorsMock.mock.calls[0][0]; //extract error passed to qerrors
  expect(arg).not.toBe(err); //should be copied
  expect(arg.message).toBe('bad [redacted]=[redacted]'); //message sanitized
  expect(arg.config.url).toBe('http://x?[redacted]=[redacted]'); //url sanitized
});

test('handleAxiosError returns false when qerrors throws', () => { //verify fallback on qerrors failure
  const { handleAxiosError } = require('../lib/qserp'); //load function under test
  const err = new Error('bad'); //mock basic error
  qerrorsMock.mockImplementationOnce(() => { throw new Error('qe'); }); //first call throws
  qerrorsMock.mockImplementation(() => {}); //subsequent calls succeed
  const spy = mockConsole('error'); //spy on console.error via helper
  const res = handleAxiosError(err, 'ctx'); //invoke handler expecting false
  expect(res).toBe(false); //should return false due to catch block
  expect(spy).toHaveBeenCalled(); //console.error should log error message
  spy.mockRestore(); //restore console.error
}); //end test ensuring failure path

test.each(['True', 'true', 'TRUE', true])('rateLimitedRequest returns mock when CODEX=%s', async val => {
  process.env.CODEX = val; //set CODEX variant to trigger mock response
  ({ mock, scheduleMock, qerrorsMock } = initSearchTest()); //reinit with CODEX set
  const { rateLimitedRequest } = require('../lib/qserp'); //import after env setup
  const res = await rateLimitedRequest('http://codex'); //call function expecting mock
  expect(res).toEqual({ data: { items: [] } }); //mocked empty items returned
  expect(scheduleMock).not.toHaveBeenCalled(); //limiter should be bypassed
  expect(mock.history.get.length).toBe(0); //axios should not receive any request
  delete process.env.CODEX; //clean up env variable for other tests
}); //test ensures CODEX casings bypass network

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
