require('qtests/setup'); //enable automatic stubbing for tests
const { REQUIRED_VARS, OPTIONAL_VARS, OPENAI_WARN_MSG } = require('../lib/constants'); //import constants to test their values

test('constants arrays have expected entries', () => { //verify exports
  expect(REQUIRED_VARS).toEqual(['GOOGLE_API_KEY', 'GOOGLE_CX']); //should match required list
  expect(OPTIONAL_VARS).toEqual(['OPENAI_TOKEN', 'CACHE_TTL', 'CACHE_MAX']); //should match optional list with cache vars
  expect(OPENAI_WARN_MSG).toBe('OPENAI_TOKEN environment variable is not set. This is required by the qerrors dependency for error logging.'); //should match warning text
});
