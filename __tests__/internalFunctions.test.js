const axios = require('axios');
const { setTestEnv, createScheduleMock, createQerrorsMock } = require('./utils/testSetup'); //import helpers

setTestEnv(); //set up env vars
const scheduleMock = createScheduleMock(); //mock Bottleneck

jest.mock('axios'); //mock axios module

const qerrorsMock = createQerrorsMock(); //mock qerrors

beforeEach(() => {
  jest.resetModules();
  axios.get.mockClear();
  scheduleMock.mockClear();
  qerrorsMock.mockClear();
});

test('rateLimitedRequest calls limiter and sets headers', async () => {
  axios.get.mockResolvedValue({ data: {} });
  const { rateLimitedRequest } = require('../lib/qserp');
  await rateLimitedRequest('http://test');
  expect(scheduleMock).toHaveBeenCalled();
  expect(typeof scheduleMock.mock.calls[0][0]).toBe('function');
  const config = axios.get.mock.calls[0][1];
  expect(config.headers['User-Agent']).toMatch(/Mozilla/);
});

test('rateLimitedRequest rejects on axios failure and schedules call', async () => {
  axios.get.mockRejectedValue(new Error('net')); //mock axios failure & schedule check
  const { rateLimitedRequest } = require('../lib/qserp');
  await expect(rateLimitedRequest('http://bad')).rejects.toThrow('net'); //promise rejects with error
  expect(scheduleMock).toHaveBeenCalled(); //ensure schedule invoked despite rejection
});

test('getGoogleURL builds proper url', () => {
  const { getGoogleURL } = require('../lib/qserp');
  const url = getGoogleURL('hello world');
  expect(url).toBe('https://www.googleapis.com/customsearch/v1?q=hello%20world&key=key&cx=cx');
});

test('handleAxiosError logs with qerrors and returns true', () => {
  const { handleAxiosError } = require('../lib/qserp');
  const err = new Error('fail');
  const res = handleAxiosError(err, 'ctx');
  expect(res).toBe(true);
  expect(qerrorsMock).toHaveBeenCalled();
});

test('handleAxiosError logs response object and returns true', () => { //added new test for console.error
  const { handleAxiosError } = require('../lib/qserp'); //require function under test
  const err = { response: { status: 500 } }; //mock error with response
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {}); //spy on console.error
  const res = handleAxiosError(err, 'ctx'); //call function with response error
  expect(res).toBe(true); //should return true
  expect(spy).toHaveBeenCalledWith(err.response); //console.error called with response
  spy.mockRestore(); //restore console.error
});

test('handleAxiosError returns false when qerrors throws', () => { //verify fallback on qerrors failure
  const { handleAxiosError } = require('../lib/qserp'); //load function under test
  const err = new Error('bad'); //mock basic error
  qerrorsMock.mockImplementationOnce(() => { throw new Error('qe'); }); //first call throws
  qerrorsMock.mockImplementation(() => {}); //subsequent calls succeed
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {}); //spy on console.error
  const res = handleAxiosError(err, 'ctx'); //invoke handler expecting false
  expect(res).toBe(false); //should return false due to catch block
  expect(spy).toHaveBeenCalled(); //console.error should log error message
  spy.mockRestore(); //restore console.error
}); //end test ensuring failure path
