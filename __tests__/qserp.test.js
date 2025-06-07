const { initSearchTest, resetMocks } = require('./utils/testSetup'); //use new helpers

const { mock, scheduleMock, qerrorsMock } = initSearchTest(); //initialize env and mocks

const { googleSearch, getTopSearchResults, fetchSearchItems } = require('../lib/qserp'); //load functions under test from library
const { OPENAI_WARN_MSG } = require('../lib/constants'); //import warning message constant

describe('qserp module', () => { //group qserp tests
  beforeEach(() => { //reset mocks before each test
    resetMocks(mock, scheduleMock, qerrorsMock); //use helper to clear mocks
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

  test('handles empty or invalid input', async () => { //verify validation paths
    await expect(googleSearch('')).rejects.toThrow(); //expect empty query throw
    await expect(fetchSearchItems('')).rejects.toThrow(); //expect empty query throw for helper
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

  test('warns on missing OPENAI_TOKEN for getTopSearchResults', async () => { //new warning test
    const tokenSave = process.env.OPENAI_TOKEN; //store existing token for restore
    delete process.env.OPENAI_TOKEN; //remove token to trigger warning logic
    jest.resetModules(); //reload modules to re-evaluate env vars
    const { createAxiosMock, createScheduleMock, createQerrorsMock } = require('./utils/testSetup'); //reacquire helpers post reset
    const warnSpy = require('./utils/consoleSpies').mockConsole('warn'); //create console.warn spy
    const mockLocal = createAxiosMock(); //create fresh axios adapter
    createScheduleMock(); //recreate Bottleneck schedule mock
    createQerrorsMock(); //recreate qerrors mock
    const { getTopSearchResults: topSearch } = require('../lib/qserp'); //require module without token
    mockLocal.onGet(/One/).reply(200, { items: [{ link: '1' }] }); //mock first term
    mockLocal.onGet(/Two/).reply(200, { items: [{ link: '2' }] }); //mock second term
    const urls = await topSearch(['One', 'Two']); //run function expecting warning
    expect(urls).toEqual(['1', '2']); //ensure urls returned correctly
    expect(warnSpy).toHaveBeenCalledWith(OPENAI_WARN_MSG); //warning should reference constant
    warnSpy.mockRestore(); //restore console.warn spy
    process.env.OPENAI_TOKEN = tokenSave; //restore original token
  });
});
