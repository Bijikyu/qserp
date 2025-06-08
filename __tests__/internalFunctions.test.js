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

test('rateLimitedRequest rejects on axios failure and schedules call', async () => {
  mock.onGet('http://bad').networkError(); //simulate network error
  const { rateLimitedRequest } = require('../lib/qserp');
  await expect(rateLimitedRequest('http://bad')).rejects.toThrow('Network Error'); //axios rejects with error
  expect(scheduleMock).toHaveBeenCalled(); //ensure schedule invoked despite rejection
});

test('fetchSearchItems returns items and schedules call', async () => { //new helper test
  mock.onGet(/term/).reply(200, { items: [{ link: 'x' }] }); //mock success using adapter
  const { fetchSearchItems } = require('../lib/qserp'); //load helper
  const items = await fetchSearchItems('term'); //invoke helper
  expect(items).toEqual([{ link: 'x' }]); //check items array
  expect(scheduleMock).toHaveBeenCalled(); //ensure schedule used
});

test('getGoogleURL builds proper url', () => {
  const { getGoogleURL } = require('../lib/qserp');
  const url = getGoogleURL('hello world');
  expect(url).toBe('https://www.googleapis.com/customsearch/v1?q=hello%20world&key=key&cx=cx');
});

test('handleAxiosError logs with qerrors and returns true', async () => {
  const { handleAxiosError } = require('../lib/qserp');
  const err = new Error('fail');
  const res = handleAxiosError(err, 'ctx');
  await new Promise(setImmediate); //wait for async qerrors
  expect(res).toBe(true);
  expect(qerrorsMock).toHaveBeenCalled();
});

test('handleAxiosError logs response object and returns true', async () => { //added new test for console.error
  const { handleAxiosError } = require('../lib/qserp'); //require function under test
  const err = { response: { status: 500 } }; //mock error with response
  const spy = mockConsole('error'); //spy on console.error via helper
  const res = handleAxiosError(err, 'ctx'); //call function with response error
  await new Promise(setImmediate); //wait for async qerrors
  expect(res).toBe(true); //should return true
  expect(spy).toHaveBeenCalledWith(err.response); //console.error called with response
  spy.mockRestore(); //restore console.error
});

test('handleAxiosError ignores qerrors failure', async () => { //verify async error handling
  const { handleAxiosError } = require('../lib/qserp'); //load function under test
  const err = new Error('bad'); //mock basic error
  qerrorsMock.mockImplementationOnce(() => { throw new Error('qe'); }); //first call throws
  qerrorsMock.mockImplementation(() => {}); //subsequent calls succeed
  const spy = mockConsole('error'); //spy on console.error via helper
  const res = handleAxiosError(err, 'ctx'); //invoke handler expecting true
  await new Promise(setImmediate); //wait for async qerrors
  expect(res).toBe(true); //handler should still return true
  expect(spy).toHaveBeenCalled(); //console.error should log error message
  spy.mockRestore(); //restore console.error
}); //end test ensuring failure path

test('handleAxiosError skips qerrors when QERRORS_DISABLE set', async () => { //new disable test
  process.env.QERRORS_DISABLE = '1'; //set flag
  const { handleAxiosError } = require('../lib/qserp');
  const err = new Error('x');
  const res = handleAxiosError(err, 'ctx');
  await new Promise(setImmediate); //wait for async qerrors
  expect(res).toBe(true); //should return true
  expect(qerrorsMock).not.toHaveBeenCalled(); //qerrors bypassed
  delete process.env.QERRORS_DISABLE; //cleanup
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
