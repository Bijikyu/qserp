const axios = require('axios');

// mocks and env setup
process.env.GOOGLE_API_KEY = 'key';
process.env.GOOGLE_CX = 'cx';
process.env.OPENAI_TOKEN = 'tkn';

const scheduleMock = jest.fn(fn => Promise.resolve(fn()));
jest.mock('bottleneck', () => jest.fn().mockImplementation(() => ({ schedule: scheduleMock })));

jest.mock('axios');

const qerrorsMock = jest.fn();
jest.mock('qerrors', () => (...args) => qerrorsMock(...args));

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
