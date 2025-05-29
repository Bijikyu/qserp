# qserp

This module provides functions to perform Google Custom Searches using the Google API.

## Installation

```bash
npm install qserp
```

## Environment Variables
Before using the module, set the following environment variables:

- `GOOGLE_API_KEY` – Your Google API key. You can obtain this from the [Google Cloud Console](https://console.cloud.google.com/).
- `GOOGLE_CX` – Your Custom Search Engine ID. Set this up at [Google Programmable Search Engine](https://programmablesearchengine.google.com/).
- `OPENAI_TOKEN` – Required by the qerrors dependency for error logging.



## Usage

```
const { googleSearch, getTopSearchResults } = require('qserp');

// Example: Search for a single query
googleSearch('Node.js tutorials').then(results => console.log(results));

// Example: Get top search results for an array of queries
getTopSearchResults(['Node.js', 'Express.js']).then(urls => console.log(urls));
```

## Testing

To run the included tests (executed with Jest):

```bash
npm test
```

These tests mock network requests and set the necessary environment variables
internally, so no API credentials are required.

## Running on Codex

When the environment variable `CODEX` is set to `True`, the library avoids
network requests and instead returns a mocked response from search functions.
This behavior enables local execution inside Codex where outbound internet
access is disabled.

Example:

```javascript
process.env.CODEX = 'True';
const { googleSearch } = require('qserp');
googleSearch('test').then(res => console.log(res)); // returns []
```

## License

ISC
