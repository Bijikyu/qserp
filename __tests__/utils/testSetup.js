const { logStart, logReturn } = require('../../lib/logUtils'); //import log helpers

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
  logReturn('saveEnv', JSON.stringify(savedEnv)); //final log via util
  return savedEnv; //return copy
}

function restoreEnv(savedEnv) { //(restore saved environment)
  logStart('restoreEnv', JSON.stringify(savedEnv)); //initial log via util
  process.env = { ...savedEnv }; //restore env vars
  logReturn('restoreEnv', true); //final log via util
  return true; //confirm restore
}

function createScheduleMock() {
  logStart('createScheduleMock', 'none'); //initial log via util
  const scheduleMock = jest.fn(fn => Promise.resolve(fn())); //mock schedule fn
  jest.mock('bottleneck', () => jest.fn().mockImplementation(() => ({ schedule: scheduleMock }))); //mock bottleneck
  logReturn('createScheduleMock', 'mock'); //final log via util
  return scheduleMock; //export schedule mock
}

function createQerrorsMock() {
  logStart('createQerrorsMock', 'none'); //initial log via util
  const qerrorsMock = jest.fn(); //mock qerrors fn
  jest.mock('qerrors', () => (...args) => qerrorsMock(...args)); //mock qerrors
  logReturn('createQerrorsMock', 'mock'); //final log via util
  return qerrorsMock; //export qerrors mock
}

function createAxiosMock() {
  logStart('createAxiosMock', 'none'); //initial log via util
  const MockAdapter = require('axios-mock-adapter'); //import mock adapter
  const axios = require('axios'); //import axios instance
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
  setTestEnv(); //prepare environment variables
  const scheduleMock = createScheduleMock(); //create schedule mock
  const qerrorsMock = createQerrorsMock(); //create qerrors mock
  const mock = createAxiosMock(); //create axios mock
  logReturn('initSearchTest', 'mocks'); //final log via util
  return { mock, scheduleMock, qerrorsMock }; //return configured mocks
}

module.exports = { setTestEnv, saveEnv, restoreEnv, createScheduleMock, createQerrorsMock, createAxiosMock, resetMocks, initSearchTest }; //export helpers

