const { saveEnv, restoreEnv } = require('./utils/testSetup');

let savedEnv;

beforeEach(() => {
  savedEnv = saveEnv();
  jest.resetModules();
});

afterEach(() => {
  restoreEnv(savedEnv);
  jest.resetModules();
});

test('throws error when GOOGLE_API_KEY exceeds max length', () => {
  process.env.GOOGLE_API_KEY = 'a'.repeat(257);
  process.env.GOOGLE_CX = 'cx';
  process.env.OPENAI_TOKEN = 'token';
  expect(() => require('../lib/qserp')).toThrow('GOOGLE_API_KEY exceeds maximum length');
});

test('throws error when GOOGLE_CX exceeds max length', () => {
  process.env.GOOGLE_API_KEY = 'key';
  process.env.GOOGLE_CX = 'c'.repeat(257);
  process.env.OPENAI_TOKEN = 'token';
  expect(() => require('../lib/qserp')).toThrow('GOOGLE_CX exceeds maximum length');
});
