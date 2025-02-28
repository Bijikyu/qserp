# qsearch

This module provides functions to perform Google Custom Searches using the Google API.

## Installation

```bash
npm install qsearch
```

## Environment Variables
Before using the module, set the following environment variables:

GOOGLE_API_KEY – Your Google API key.
GOOGLE_CX – Your Custom Search Engine ID.

This module also has qerrors module as a dependency, which requires you to set OPENAI_TOKEN.

## Usage

```
const { googleSearch, getTopSearchResults } = require('googlesearchmodule');

// Example: Search for a single query
googleSearch('Node.js tutorials').then(results => console.log(results));

// Example: Get top search results for an array of queries
getTopSearchResults(['Node.js', 'Express.js']).then(urls => console.log(urls));
```

## License

ISC