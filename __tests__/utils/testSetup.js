function setTestEnv() {
  console.log(`setTestEnv is running with default values`); //initial log
  process.env.GOOGLE_API_KEY = 'key'; //set common api key
  process.env.GOOGLE_CX = 'cx'; //set common cx id
  process.env.OPENAI_TOKEN = 'token'; //set common openai token
  console.log(`setTestEnv returning true`); //final log
  return true; //confirm env set
}

function saveEnv() {
  console.log(`saveEnv is running with none`); //initial log
  const envCopy = { ...process.env }; //create env snapshot
  console.log(`saveEnv returning copy`); //final log
  return envCopy; //export snapshot
}

function restoreEnv(savedEnv) {
  console.log(`restoreEnv is running with ${savedEnv}`); //initial log
  process.env = { ...savedEnv }; //restore env from copy
  console.log(`restoreEnv returning true`); //final log
  return true; //confirm restore
}

function createScheduleMock() {
  console.log(`createScheduleMock is running with none`); //initial log
  const scheduleMock = jest.fn(fn => Promise.resolve(fn())); //mock schedule fn
  jest.mock('bottleneck', () => jest.fn().mockImplementation(() => ({ schedule: scheduleMock }))); //mock bottleneck
  console.log(`createScheduleMock returning mock`); //final log
  return scheduleMock; //export schedule mock
}

function createQerrorsMock() {
  console.log(`createQerrorsMock is running with none`); //initial log
  const qerrorsMock = jest.fn(); //mock qerrors fn
  jest.mock('qerrors', () => (...args) => qerrorsMock(...args)); //mock qerrors
  console.log(`createQerrorsMock returning mock`); //final log
  return qerrorsMock; //export qerrors mock
}

function createAxiosMock() {
  console.log(`createAxiosMock is running with none`); //initial log
  const MockAdapter = require('axios-mock-adapter'); //import mock adapter
  const axios = require('axios'); //import axios instance
  const mock = new MockAdapter(axios); //create adapter instance
  console.log(`createAxiosMock returning adapter`); //final log
  return mock; //export axios mock
}

function resetMocks(mock, scheduleMock, qerrorsMock) { //helper to clear mocks
  console.log(`resetMocks is running with mocks`); //initial log
  mock.reset(); //clear axios mock history
  scheduleMock.mockClear(); //clear Bottleneck schedule calls
  qerrorsMock.mockClear(); //clear qerrors call history
  console.log(`resetMocks returning true`); //final log
  return true; //confirm reset
}

function initSearchTest() { //helper to init env and mocks
  console.log(`initSearchTest is running with none`); //initial log
  setTestEnv(); //prepare environment variables
  const scheduleMock = createScheduleMock(); //create schedule mock
  const qerrorsMock = createQerrorsMock(); //create qerrors mock
  const mock = createAxiosMock(); //create axios mock
  console.log(`initSearchTest returning mocks`); //final log
  return { mock, scheduleMock, qerrorsMock }; //return configured mocks
}

module.exports = { setTestEnv, saveEnv, restoreEnv, createScheduleMock, createQerrorsMock, createAxiosMock, resetMocks, initSearchTest }; //export helpers

