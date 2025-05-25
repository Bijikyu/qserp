const { googleSearch, getTopSearchResults } = require('../index'); //load functions under test
const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('../lib/envUtils'); //load environment helpers
const { REQUIRED_VARS, OPTIONAL_VARS } = require('../lib/constants'); //load required variable lists

describe('qserp module', () => {
  beforeAll(() => { //check env vars before tests
    const missing = getMissingEnvVars(REQUIRED_VARS); //get missing required vars
    if (missing.length > 0) { //throw if any missing
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    warnIfMissingEnvVars(OPTIONAL_VARS, `Warning: OPENAI_TOKEN environment variable is not set. This is required by the qerrors dependency.`); //warn if optional missing
  });

  test('googleSearch returns results', async () => { //verify googleSearch works
    const results = await googleSearch('Node.js tutorials'); //perform search
    expect(Array.isArray(results)).toBe(true); //confirm result array
  });

  test('getTopSearchResults returns urls', async () => { //verify multi-search
    const urls = await getTopSearchResults(['JavaScript', 'TypeScript']); //get urls
    expect(Array.isArray(urls)).toBe(true); //confirm result array
  });
});
