function setTestEnv() {
  console.log(`setTestEnv is running with default values`); //initial log
  process.env.GOOGLE_API_KEY = 'key'; //set common api key
  process.env.GOOGLE_CX = 'cx'; //set common cx id
  process.env.OPENAI_TOKEN = 'token'; //set common openai token
  console.log(`setTestEnv returning true`); //final log
  return true; //confirm env set
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

module.exports = { setTestEnv, createScheduleMock, createQerrorsMock, createAxiosMock }; //export helpers

