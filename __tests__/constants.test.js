// Summary: constants.test.js validates module behavior and edge cases
const { REQUIRED_VARS, OPTIONAL_VARS } = require('../lib/constants'); //import constants to test their values

test('constants arrays have expected entries', () => { //verify exports
  expect(REQUIRED_VARS).toEqual(['GOOGLE_API_KEY', 'GOOGLE_CX']); //should match required list
  expect(OPTIONAL_VARS).toEqual(['OPENAI_TOKEN', 'GOOGLE_REFERER']); //should match optional list
});
