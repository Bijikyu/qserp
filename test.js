// Test file verifying env utils with search functions
process.env.GOOGLE_API_KEY = 'test_key'; //(set mock API key for tests)
process.env.GOOGLE_CX = 'test_cx'; //(set mock search engine id)
process.env.OPENAI_TOKEN = 'test_token'; //(set mock token for qerrors)

const axios = require('axios'); //(import axios for mocking)
const { strictEqual } = require('assert'); //(import assert for checks)

const mockResp = { data: { items: [{ title: 'Mock title', snippet: 'Mock snippet', link: 'https://example.com' }] } }; //(define mock search response)
axios.get = async () => mockResp; //(mock axios.get to return response)

const { googleSearch, getTopSearchResults } = require('./index'); //(load module after env vars)
const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('./lib/envUtils'); //(import env utils for checks)
const { REQUIRED_VARS, OPTIONAL_VARS } = require('./lib/constants'); //(import env variable lists)

async function runTests() { //(declare test runner)
  console.log('Testing qserp module with mocked axios...'); //(log start)
  try { //(start try block)
    strictEqual(getMissingEnvVars(REQUIRED_VARS).length, 0); //(verify env vars exist)
    strictEqual(warnIfMissingEnvVars(OPTIONAL_VARS, 'warn'), true); //(warn util should pass)
    strictEqual(Array.isArray(throwIfMissingEnvVars(REQUIRED_VARS)), true); //(throw util returns array)

    const res = await googleSearch('nodejs'); //(run search)
    strictEqual(res[0].link, 'https://example.com'); //(check mocked link)

    const urls = await getTopSearchResults(['node']); //(run search for array)
    strictEqual(urls[0], 'https://example.com'); //(check top result)

    console.log('All tests passed!'); //(log success)
  } catch (err) { //(​catch errors)
    console.error('Test failed:', err); //(log failure)
    process.exit(1); //(exit with error)
  } //(close catch)
} //(close runTests function)

runTests(); //(invoke tests)
