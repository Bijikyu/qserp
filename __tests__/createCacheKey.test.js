// Summary: createCacheKey.test.js validates query normalization and num handling
const { setupStandardTest } = require('./utils/testEnvironment'); //import env+spy manager

describe('createCacheKey', () => {
  let teardown; //holds cleanup function from setup

  beforeEach(() => { //prepare fresh env and console spies for each test
    ({ teardown } = setupStandardTest({
      envVars: { //env vars required by module
        GOOGLE_API_KEY: 'key',
        GOOGLE_CX: 'cx',
        OPENAI_TOKEN: 'token',
        GOOGLE_REFERER: 'http://example.com'
      },
      consoleSpies: ['log'] //silence debug logs
    }));
  });

  afterEach(() => { //restore env and spies
    teardown();
  });

  test('trims and lowercases query without num', () => { //verify base normalization
    const { createCacheKey } = require('../lib/qserp'); //load helper under test
    const res = createCacheKey('  TeSt  '); //call without num
    expect(res).toBe('test'); //should trim and lowercase
  });

  test('includes valid num parameter', () => { //verify num appended when valid
    const { createCacheKey } = require('../lib/qserp'); //load helper
    const res = createCacheKey('Query', 3); //call with valid num
    expect(res).toBe('query:3'); //should append colon and num
  });

  test.each([
    [0, 1],
    [-1, 1],
    [11, 10]
  ])('clamps out of range %p to %p', (input, clamp) => { //verify clamping logic
    const { createCacheKey } = require('../lib/qserp');
    const res = createCacheKey('Clamp', input); //call with invalid num
    expect(res).toBe(`clamp:${clamp}`); //should use clamped value
  });

  test.each([undefined, null, NaN, 'bad'])('omits num when invalid %p', val => { //verify omission on invalid values
    const { createCacheKey } = require('../lib/qserp');
    const res = createCacheKey('NoNum', val); //call with invalid value
    expect(res).toBe('nonum'); //should return normalized query only
  });
});
