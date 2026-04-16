
# qserp

A robust Node.js module for performing Google Custom Searches using the Google Custom Search API. Features built-in rate limiting, comprehensive error handling, and offline testing capabilities.

## Why qserp?

Using the Google Custom Search API directly requires wiring up rate limiting, error handling, input validation, parallel request management, and a mock mode for development — before writing any application logic. qserp does all of that once so you don't have to do it in every project.

Use qserp when you need Google search results from Node.js and want:
- **No quota accidents** — rate limiting is already configured and enforced
- **No credential juggling during development** — the CODEX offline mode lets you build and test without a live API key
- **Parallel searches without boilerplate** — `getTopSearchResults` handles concurrent requests and deduplicates failures automatically
- **Structured errors** — failures are logged with context through qerrors, not silently swallowed

## Features

- **Rate Limited Requests**: Built-in rate limiting prevents API quota exhaustion
- **Comprehensive Error Handling**: Structured error logging with qerrors integration
- **Offline Testing**: Mock responses when `CODEX=true` for development without API calls
- **Parallel Processing**: Support for multiple concurrent searches with optimal performance
- **Input Validation**: Robust validation of search queries and parameters
- **Detailed Logging**: Optional detailed execution logging for debugging

## Installation

```bash
npm install qserp
```

## Environment Variables

### Required Variables
Before using the module, set these required environment variables:

- `GOOGLE_API_KEY` – Your Google API key. Obtain from the [Google Cloud Console](https://console.cloud.google.com/)
- `GOOGLE_CX` – Your Custom Search Engine ID. Set up at [Google Programmable Search Engine](https://programmablesearchengine.google.com/)

### Optional Variables
These variables enhance functionality but are not required:

- `OPENAI_TOKEN` – Used by the `qerrors` dependency for enhanced error analysis and logging
- `CODEX` – When set to any case-insensitive `true` value, enables offline mode with mocked responses

## Usage

### Basic Search

Perform a single search and get detailed results:

```javascript
const { googleSearch } = require('qserp');

// Search returns array of objects with title, snippet, and link
googleSearch('Node.js tutorials')
  .then(results => {
    results.forEach(result => {
      console.log(`Title: ${result.title}`);
      console.log(`Snippet: ${result.snippet}`);
      console.log(`URL: ${result.link}`);
    });
  })
  .catch(error => console.error('Search failed:', error));
```

### Batch Top Results

Get just the top URL for multiple search terms efficiently:

```javascript
const { getTopSearchResults } = require('qserp');

// Parallel searches return array of top result URLs
getTopSearchResults(['Node.js', 'Express.js', 'MongoDB'])
  .then(urls => {
    console.log('Top results:', urls);
    // Output: ['https://nodejs.org/', 'https://expressjs.com/', ...]
  })
  .catch(error => console.error('Batch search failed:', error));
```

### Advanced Usage

Access raw Google API response data:

```javascript
const { fetchSearchItems } = require('qserp');

// Get raw Google Custom Search API items
fetchSearchItems('JavaScript frameworks')
  .then(items => {
    // Access full Google API response structure
    items.forEach(item => {
      console.log('Full item data:', item);
    });
  });
```

## API Reference

### googleSearch(query)

Performs a single Google Custom Search and returns formatted results.

**Parameters:**
- `query` (string): The search query (must be non-empty)

**Returns:** 
- `Promise<Array<{title: string, snippet: string, link: string}>>`: Array of formatted search results

**Throws:**
- `Error`: If query is not a non-empty string

---

### getTopSearchResults(searchTerms)

Performs parallel searches for multiple terms and returns only the top result URL for each.

**Parameters:**
- `searchTerms` (string[]): Array of search terms to process

**Returns:**
- `Promise<string[]>`: Array of top result URLs (excludes failed searches)

**Throws:**
- `Error`: If searchTerms is not an array

---

### fetchSearchItems(query)

Fetches raw Google Custom Search API items for a query.

**Parameters:**
- `query` (string): The search query (must be non-empty)

**Returns:**
- `Promise<Array>`: Raw items array from Google API or empty array on error

**Throws:**
- `Error`: If query is not a non-empty string

---

### validateSearchQuery(query)

Validates that a value is a non-empty string suitable for use as a search query. Used internally by `googleSearch` and `fetchSearchItems`, but also exported for use in consuming code that wants to pre-validate input before calling search functions.

**Parameters:**
- `query` (any): The value to validate

**Returns:**
- `true` if the query is valid

**Throws:**
- `Error`: If query is not a string or is empty/whitespace-only

---

### Internal functions (exported for testing)

The following functions are exported so the test suite can unit-test them in isolation. They are not part of the public API and should not be used directly in application code:

- `rateLimitedRequest(url)` — HTTP request wrapper with Bottleneck rate limiting and CODEX mock support
- `getGoogleURL(query)` — Builds the full Google Custom Search API URL with encoded query
- `handleAxiosError(error, contextMsg)` — Centralized error handler that distinguishes network errors from HTTP errors

## Rate Limiting

The module includes built-in rate limiting to prevent API quota exhaustion:

- **60 requests per minute** with automatic replenishment
- **Maximum 5 concurrent requests** for optimal performance
- **200ms minimum spacing** between requests to prevent burst failures

These conservative limits work with most Google API quotas while maintaining reasonable performance.

## Error Handling

The module provides comprehensive error handling:

- **Network errors** are logged and handled gracefully
- **HTTP errors** include full response details for debugging
- **Structured error logging** via qerrors integration
- **Graceful degradation** returns empty arrays instead of throwing when possible

## Utilities

### safeRun(fnName, fn, defaultVal, context)

A general-purpose safe execution wrapper exported from `lib/utils.js`. It runs a provided function inside a try/catch, logs any error through qerrors with the supplied context, and returns a fallback value instead of propagating the exception.

```javascript
const { safeRun } = require('qserp/lib/utils');

const result = safeRun(
  'parseConfig',          // name used in log output
  () => JSON.parse(raw),  // function to run (parameterless)
  {},                     // fallback value if it throws
  { raw }                 // context attached to any error log
);
```

**Parameters:**
- `fnName` (string): Descriptive label used in log output
- `fn` (Function): Parameterless function to execute
- `defaultVal` (any): Value returned if `fn` throws
- `context` (Object): Additional data attached to the error log

**Returns:** Result of `fn()` on success, `defaultVal` on failure

## Testing

Run the included Jest test suite:

```bash
npm test
```

Tests include:
- Unit tests for all public and internal functions
- Integration tests for complete workflows
- Error handling validation
- Environment variable validation
- Mock response testing

Tests automatically mock network requests and set required environment variables, so no API credentials are needed.

## Offline Development (Codex Mode)

When the environment variable `CODEX` is set to any case-insensitive `true` value, the library operates in offline mode:

- **No network requests** are made to Google APIs
- **Mock responses** are returned from all search functions
- **Environment validation** is bypassed for API credentials
- **Full functionality** is preserved for testing and development

Example:

```javascript
process.env.CODEX = 'true';
const { googleSearch } = require('qserp');

googleSearch('test').then(results => {
  console.log(results); // Returns empty array [] without API call
});
```

This enables development and testing in environments without internet access or API credentials.

## Dependencies

- **axios**: HTTP client for API requests
- **bottleneck**: Rate limiting and request scheduling
- **qerrors**: Structured error logging with optional OpenAI-enhanced analysis. Requires `OPENAI_TOKEN` for AI-assisted error context; works without it using standard logging only.
- **qtests**: Testing utilities providing method stubbing (`stubMethod`) and no-op stubs for axios and winston. Used in the test suite to isolate units without making real network requests or generating log output.

## Contributing

The project uses Jest for testing. Before submitting a pull request:

1. Run `npm test` to ensure all tests pass. The suite mocks network requests automatically — no API credentials are needed.
2. Set `CODEX=true` in your environment for development. This bypasses credential validation and returns mock responses, so you can work on the library without a live Google API key.
3. New functions should follow the existing `logStart` / `logReturn` logging pattern from `lib/logUtils.js` so execution flow is traceable.
4. Error paths should go through `qerrors` (via `lib/qerrorsLoader.js`) rather than plain `console.error` where possible, to keep error reporting consistent.
5. If adding a function that might fail non-fatally, consider wrapping it with `safeRun` from `lib/utils.js` to maintain graceful degradation behavior.

## License

ISC

## Support

For issues and questions:
- [GitHub Issues](https://github.com/Bijikyu/qserp/issues)
- [Repository](https://github.com/Bijikyu/qserp)
