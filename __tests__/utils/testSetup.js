const { logStart, logReturn } = require('../../lib/logUtils'); //import log helpers

// Prepare top level mocks without closures to comply with Jest restrictions
let scheduleMock; //Bottleneck schedule spy reference
jest.mock('bottleneck', () => jest.fn()); //mock Bottleneck constructor as jest function

let qerrorsMock; //qerrors spy reference
jest.mock('qerrors', () => jest.fn()); //mock qerrors as jest function

function setTestEnv() {
  logStart('setTestEnv', 'default values'); //initial log via util
  process.env.GOOGLE_API_KEY = 'key'; //set common api key
  process.env.GOOGLE_CX = 'cx'; //set common cx id
  process.env.OPENAI_TOKEN = 'token'; //set common openai token
  logReturn('setTestEnv', true); //final log via util
  return true; //confirm env set
}

function saveEnv() { //(capture current process.env)
  logStart('saveEnv', 'none'); //initial log via util
  const savedEnv = { ...process.env }; //copy environment vars
  logReturn('saveEnv', 'env stored'); //final log via util //(mask env data)
  return savedEnv; //return copy
}

function restoreEnv(savedEnv) { //(restore saved environment)
  logStart('restoreEnv', 'env restore'); //initial log via util //(mask env data)
  Object.keys(process.env).forEach(k => delete process.env[k]); //clear current env //(avoid reassignment)
  Object.assign(process.env, savedEnv); //copy saved vars back //(restore vars)
  logReturn('restoreEnv', true); //final log via util
  return true; //confirm restore
}

function createScheduleMock() {
  logStart('createScheduleMock', 'none'); //initial log via util
  scheduleMock = jest.fn(fn => Promise.resolve(fn())); //reset schedule spy for new test
  const Bottleneck = require('bottleneck'); //require mocked Bottleneck
  Bottleneck.mockImplementation(() => ({ schedule: scheduleMock })); //inject schedule spy into mock
  logReturn('createScheduleMock', 'mock'); //final log via util
  return scheduleMock; //export schedule mock
}

function createQerrorsMock() {
  logStart('createQerrorsMock', 'none'); //initial log via util
  qerrorsMock = require('qerrors'); //retrieve jest mock function
  qerrorsMock.mockReset(); //reset mock call history
  logReturn('createQerrorsMock', 'mock'); //final log via util
  return qerrorsMock; //export qerrors mock
}

function createAxiosMock(instance) {
  logStart('createAxiosMock', 'none'); //initial log via util
  const MockAdapter = require('axios-mock-adapter'); //import mock adapter
  const axios = instance || require('axios'); //use provided instance or default
  const mock = new MockAdapter(axios); //create adapter instance
  logReturn('createAxiosMock', 'adapter'); //final log via util
  return mock; //export axios mock
}

function resetMocks(mock, scheduleMock, qerrorsMock) { //helper to clear mocks
  logStart('resetMocks', 'mocks'); //initial log via util
  mock.reset(); //clear axios mock history
  scheduleMock.mockClear(); //clear Bottleneck schedule calls
  qerrorsMock.mockClear(); //clear qerrors call history
  logReturn('resetMocks', true); //final log via util
  return true; //confirm reset
}

function initSearchTest() { //helper to init env and mocks
  logStart('initSearchTest', 'none'); //initial log via util
  jest.resetModules(); //ensure fresh modules for each test suite
  setTestEnv(); //prepare environment variables
  const scheduleMock = createScheduleMock(); //create schedule mock
  const qerrorsMock = createQerrorsMock(); //create qerrors mock
  const qserp = require('../../lib/qserp'); //load module for axios instance
  const mock = createAxiosMock(qserp.axiosInstance); //create adapter for instance
  logReturn('initSearchTest', 'mocks'); //final log via util
  return { mock, scheduleMock, qerrorsMock }; //return configured mocks
}

module.exports = { setTestEnv, saveEnv, restoreEnv, createScheduleMock, createQerrorsMock, createAxiosMock, resetMocks, initSearchTest }; //export helpers

