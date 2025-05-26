const MockAdapter = require('axios-mock-adapter'); //(added for axios mocking)
const axios = require('axios'); //(added axios import)

process.env.GOOGLE_API_KEY = 'key'; //(added env var setup)
process.env.GOOGLE_CX = 'cx'; //(added env var setup)
process.env.OPENAI_TOKEN = 'token'; //(added env var setup)

const scheduleMock = jest.fn(fn => Promise.resolve(fn())); //(added rate limiter mock)
jest.mock('bottleneck', () => jest.fn().mockImplementation(() => ({ schedule: scheduleMock }))); //(mock Bottleneck schedule)

const qerrorsMock = jest.fn(); //(added qerrors mock)
jest.mock('qerrors', () => (...args) => qerrorsMock(...args)); //(mock qerrors module)

const { googleSearch, getTopSearchResults } = require('../lib/qserp'); //(import functions under test)

const mock = new MockAdapter(axios); //(create axios mock adapter)

describe('combined googleSearch and getTopSearchResults', () => { //(describe block)
  beforeEach(() => { //(reset mocks before each test)
    mock.reset(); //(reset axios mock)
    scheduleMock.mockClear(); //(clear schedule mock)
    qerrorsMock.mockClear(); //(clear qerrors mock)
  });

  test('successful searches return arrays and call schedule correct times', async () => { //(test success)
    mock.onGet(/Java/).reply(200, { items: [{ title: 't', snippet: 's', link: 'j' }] }); //(mock java)
    mock.onGet(/Node/).reply(200, { items: [{ link: 'n' }] }); //(mock node)
    mock.onGet(/Python/).reply(200, { items: [{ link: 'p' }] }); //(mock python)
    const searchRes = await googleSearch('Java'); //(call googleSearch)
    const topUrls = await getTopSearchResults(['Node', 'Python']); //(call getTopSearchResults)
    expect(searchRes[0].link).toBe('j'); //(assert first result)
    expect(topUrls).toEqual(['n', 'p']); //(assert urls array)
    expect(scheduleMock).toHaveBeenCalledTimes(3); //(check schedule called thrice)
  });

  test('handles individual request failures gracefully', async () => { //(test error handling)
    mock.onGet(/Fail/).reply(500); //(mock failure)
    mock.onGet(/OK/).reply(200, { items: [{ link: 'ok' }] }); //(mock success)
    const res = await googleSearch('Fail'); //(call failing googleSearch)
    const urls = await getTopSearchResults(['Fail', 'OK']); //(call getTopSearchResults with one fail)
    expect(res).toEqual([]); //(googleSearch returns empty array)
    expect(urls).toEqual(['ok']); //(only successful url returned)
    expect(scheduleMock).toHaveBeenCalledTimes(3); //(called for each request)
    expect(qerrorsMock).toHaveBeenCalled(); //(qerrors should have been called)
  });
});
