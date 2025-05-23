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

To run the included tests:

```bash
npm test
```

Make sure you've set the required environment variables before running tests.

## License

ISC
