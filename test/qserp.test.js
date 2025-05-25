const MockAdapter = require('axios-mock-adapter');
const axios = require('axios');

process.env.GOOGLE_API_KEY = 'key';
process.env.GOOGLE_CX = 'cx';
process.env.OPENAI_TOKEN = 'token';

const scheduleMock = jest.fn(fn => Promise.resolve(fn()));
jest.mock('bottleneck', () => jest.fn().mockImplementation(() => ({ schedule: scheduleMock })));

const qerrorsMock = jest.fn();
jest.mock('qerrors', () => (...args) => qerrorsMock(...args));

const { googleSearch, getTopSearchResults } = require('../lib/qserp');

const mock = new MockAdapter(axios);

describe('qserp module', () => {
  beforeEach(() => {
    mock.reset();
    scheduleMock.mockClear();
    qerrorsMock.mockClear();
  });

  test('googleSearch returns parsed results', async () => {
    mock.onGet(/customsearch/).reply(200, {
      items: [{ title: 'A', snippet: 'B', link: 'C' }]
    });
    const results = await googleSearch('hi');
    expect(results).toEqual([{ title: 'A', snippet: 'B', link: 'C' }]);
    expect(scheduleMock).toHaveBeenCalled();
  });

  test('getTopSearchResults returns top links', async () => {
    mock.onGet(/Java/).reply(200, { items: [{ link: 'http://j' }] });
    mock.onGet(/Python/).reply(200, { items: [{ link: 'http://p' }] });
    const urls = await getTopSearchResults(['Java', 'Python']);
    expect(urls).toEqual(['http://j', 'http://p']);
    expect(scheduleMock).toHaveBeenCalledTimes(2);
  });

  test('handles empty or invalid input', async () => {
    await expect(googleSearch('')).rejects.toThrow();
    await expect(getTopSearchResults('bad')).rejects.toThrow();
    const emptyUrls = await getTopSearchResults([]);
    expect(emptyUrls).toEqual([]);
  });

  test('logs errors via helper on request failure', async () => {
    mock.onGet(/customsearch/).reply(500);
    const res = await googleSearch('err');
    const urls = await getTopSearchResults(['err']);
    expect(res).toEqual([]);
    expect(urls).toEqual([]);
    expect(qerrorsMock).toHaveBeenCalled();
  });
});
