// Simple test file for qserp module
const { googleSearch, getTopSearchResults } = require('./index');

async function runTests() {
  console.log('Testing qserp module...');
  
  try {
    // Test single search query
    console.log('\nTesting googleSearch:');
    const results = await googleSearch('Node.js tutorials');
    console.log(`Found ${results.length} results for 'Node.js tutorials'`);
    if (results.length > 0) {
      console.log('First result:', results[0]);
    } else {
      console.warn('Warning: No results found for googleSearch test');
    }
    
    // Test multiple search queries
    console.log('\nTesting getTopSearchResults:');
    const urls = await getTopSearchResults(['JavaScript', 'TypeScript']);
    console.log('Top results for JavaScript and TypeScript:');
    console.log(urls);
    
    if (urls.length === 0) {
      console.warn('Warning: No URLs returned from getTopSearchResults test');
    } else if (urls.length < 2) {
      console.warn(`Warning: Only ${urls.length}/2 queries returned results`);
    }
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Check if environment variables are set before running tests
if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CX) {
  console.error('Error: GOOGLE_API_KEY and GOOGLE_CX environment variables must be set to run tests');
  console.log('Set these in the Secrets tool in Replit before running tests');
  process.exit(1);
}

if (!process.env.OPENAI_TOKEN) {
  console.warn('Warning: OPENAI_TOKEN environment variable is not set. This is required by the qerrors dependency.');
  console.log('Consider setting this in the Secrets tool in Replit.');
}

runTests();
