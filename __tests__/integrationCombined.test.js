const MockAdapter = require('axios-mock-adapter'); //setup axios mock adapter
const axios = require('axios'); //import axios for mocking

process.env.GOOGLE_API_KEY = 'key'; //set fake google api key
process.env.GOOGLE_CX = 'cx'; //set fake google cx id
process.env.OPENAI_TOKEN = 'token'; //set fake openai token

const scheduleMock = jest.fn(fn => Promise.resolve(fn())); //mock bottleneck schedule
jest.mock('bottleneck', () => jest.fn().mockImplementation(() => ({ schedule: scheduleMock }))); //mock Bottleneck constructor

const qerrorsMock = jest.fn(); //mock qerrors logging
jest.mock('qerrors', () => (...args) => qerrorsMock(...args)); //replace qerrors with mock

const { googleSearch, getTopSearchResults } = require('../lib/qserp'); //load functions under test

const mock = new MockAdapter(axios); //create axios mock instance

describe('integration googleSearch and getTopSearchResults', () => { //describe block
  beforeEach(() => { //reset mocks
    mock.reset(); //reset axios mock
    scheduleMock.mockClear(); //clear schedule calls
    qerrorsMock.mockClear(); //clear qerrors calls
  });

  test('multiple terms return arrays of urls and schedule invoked per request', async () => { //success path test
    mock.onGet(/First/).reply(200, { items: [{ title: 'a', snippet: 'b', link: 'f' }] }); //mock first search
    mock.onGet(/One/).reply(200, { items: [{ link: '1' }] }); //mock one
    mock.onGet(/Two/).reply(200, { items: [{ link: '2' }] }); //mock two
    const searchRes = await googleSearch('First'); //call googleSearch
    const urls = await getTopSearchResults(['One', 'Two']); //call getTopSearchResults
    expect(searchRes[0].link).toBe('f'); //assert googleSearch result link
    expect(urls).toEqual(['1', '2']); //assert urls array
    expect(scheduleMock).toHaveBeenCalledTimes(3); //schedule called once per request
  });

  test('handles request failures gracefully and logs error', async () => { //failure path test
    mock.onGet(/Bad/).reply(500); //mock googleSearch fail
    mock.onGet(/Fail/).reply(500); //mock first failure
    mock.onGet(/Good/).reply(200, { items: [{ link: 'g' }] }); //mock successful request
    const searchRes = await googleSearch('Bad'); //call failing googleSearch
    const urls = await getTopSearchResults(['Fail', 'Good']); //call multi search with one fail
    expect(searchRes).toEqual([]); //googleSearch should return empty array
    expect(urls).toEqual(['g']); //only successful url returned
    expect(scheduleMock).toHaveBeenCalledTimes(3); //schedule called for each attempt
    expect(qerrorsMock).toHaveBeenCalled(); //ensure qerrors invoked
  });

  test('warns when optional token missing but still returns results', async () => { //new warning path test
    const saveToken = process.env.OPENAI_TOKEN; //store original token
    delete process.env.OPENAI_TOKEN; //remove token to trigger warning
    jest.resetModules(); //reset modules to reread env vars
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); //spy on console.warn
    const { googleSearch: tokenlessSearch } = require('../lib/qserp'); //require module without token
    mock.onGet(/Warn/).reply(200, { items: [{ title: 't', snippet: 's', link: 'l' }] }); //mock search success
    const res = await tokenlessSearch('Warn'); //perform search with mocked data
    expect(res).toEqual([{ title: 't', snippet: 's', link: 'l' }]); //ensure results returned
    expect(warnSpy).toHaveBeenCalledWith('OPENAI_TOKEN environment variable is not set. This is required by the qerrors dependency for error logging.'); //check warning message
    warnSpy.mockRestore(); //restore console.warn
    process.env.OPENAI_TOKEN = saveToken; //restore original token
  });
});
