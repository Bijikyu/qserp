const MockAdapter = require('axios-mock-adapter'); //import mock adapter for axios
const axios = require('axios'); //import axios for requests

process.env.GOOGLE_API_KEY = 'key'; //set mock api key for tests
process.env.GOOGLE_CX = 'cx'; //set mock custom search id for tests
process.env.OPENAI_TOKEN = 'token'; //set mock openai token for qerrors

const scheduleMock = jest.fn(fn => Promise.resolve(fn())); //create bottleneck schedule mock
jest.mock('bottleneck', () => jest.fn().mockImplementation(() => ({ schedule: scheduleMock }))); //mock bottleneck to use schedule mock

const qerrorsMock = jest.fn(); //create qerrors mock function
jest.mock('qerrors', () => (...args) => qerrorsMock(...args)); //mock qerrors module

const { googleSearch, getTopSearchResults } = require('../lib/qserp'); //load functions under test from library

const mock = new MockAdapter(axios); //create axios mock adapter instance

describe('qserp module', () => { //group qserp tests
  beforeEach(() => { //reset mocks before each test
    mock.reset(); //clear axios mock history
    scheduleMock.mockClear(); //clear bottleneck schedule mock
    qerrorsMock.mockClear(); //clear qerrors mock history
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

  test('getTopSearchResults returns top links', async () => { //verify top links returned
    mock.onGet(/Java/).reply(200, { items: [{ link: 'http://j' }] }); //mock java search
    mock.onGet(/Python/).reply(200, { items: [{ link: 'http://p' }] }); //mock python search
    const urls = await getTopSearchResults(['Java', 'Python']); //get urls from mocked data
    expect(urls).toEqual(['http://j', 'http://p']); //expect urls array
    expect(scheduleMock).toHaveBeenCalledTimes(2); //ensure rate limiter called twice
  });

  test('handles empty or invalid input', async () => { //verify validation paths
    await expect(googleSearch('')).rejects.toThrow(); //expect empty query throw
    await expect(getTopSearchResults('bad')).rejects.toThrow(); //expect invalid input throw
    const emptyUrls = await getTopSearchResults([]); //call with empty list
    expect(emptyUrls).toEqual([]); //expect empty array result
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
});
