
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
- **Intelligent Caching**: LRU caching with normalized keys and automatic memory management
- **Memory Management**: Configurable LRU eviction with automatic cleanup to prevent memory leaks
- **Security Enhanced**: Input validation, environment bounds checking, and cache key normalization
- **Comprehensive Error Handling**: Structured error logging with qerrors integration
- **Offline Testing**: Mock responses when `CODEX=true` for development without API calls
- **Parallel Processing**: Support for multiple concurrent searches with optimal performance
- **Performance Optimized**: Connection pooling, compression, and LRU cache optimization
- **Detailed Logging**: Optional verbose logs enabled with `DEBUG=true`
- **Cache Maintenance Utilities**: `clearCache()` resets the cache and `performCacheCleanup()` purges stale entries for diagnostic tests

Google's API automatically compresses responses when `Accept-Encoding` includes `gzip`, `deflate`, or `br`. The library sets this header on all requests so payloads are smaller and parsing stays transparent.

## Installation

```bash
npm install qserp
```

## Environment Variables

### Required Variables
Before using the module, set these required environment variables:

- `GOOGLE_API_KEY` – Your Google API key. Obtain from the [Google Cloud Console](https://console.cloud.google.com/)
- `GOOGLE_CX` – Your Custom Search Engine ID. Set up at [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
Both values are URL encoded internally so keys containing characters like `+` or `/` work without additional configuration.
All API requests are sent to `https://customsearch.googleapis.com/customsearch/v1`.

### Optional Variables
These variables enhance functionality but are not required:

- `OPENAI_TOKEN` – Used by the `qerrors` dependency for enhanced error analysis and logging
- `CODEX` – When set to any case-insensitive `true` value, enables offline mode with mocked responses
- `LOG_LEVEL` – Sets logging level: `info` shows all messages, `warn` shows only warnings and errors, `error` logs only errors, `silent` disables output (default: `info`)
- `DEBUG` – When set to any case-insensitive `true` value, enables verbose debugging logs

- `QSERP_MAX_CACHE_SIZE` – Maximum cache entries (default: 1000, `0` disables caching; range: 10-50000 when enabled) for memory management
  Non-numeric values are ignored and the default is used.
- `GOOGLE_REFERER` – Adds a Referer header to requests when set

Environment values are parsed and validated with the helper functions in [`lib/envValidator.js`](lib/envValidator.js). Contributors can use `parseIntWithBounds`, `parseBooleanVar`, `parseStringVar`, and `validateEnvVar` when adding new configuration options. These utilities enforce secure bounds checking consistent with the library's own usage.

You can also verify environment variable presence with the helpers in [`lib/envUtils.js`](lib/envUtils.js). `getMissingEnvVars(arr)` returns the names of any missing variables, `throwIfMissingEnvVars(arr)` throws when required values are absent, and `warnIfMissingEnvVars(arr, message)` logs a warning for optional variables and returns a boolean.

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

Get just the top URL for multiple search terms efficiently. Duplicate terms are ignored:

```javascript
const { getTopSearchResults } = require('qserp');

// Parallel searches return array of top result URLs
getTopSearchResults(['Node.js', 'Express.js', 'MongoDB', 'Node.js'])
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

**Note:**
- `googleSearch`, `getTopSearchResults`, `fetchSearchItems`, `validateSearchQuery`, `clearCache`, and `performCacheCleanup` are the supported public API.
- Other exported functions are for internal use/testing and may change without notice.

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

Performs parallel searches for multiple terms and returns only the top result URL for each. Duplicate terms are removed before searching and results follow the order of the unique terms.

**Parameters:**
- `searchTerms` (string[]): Array of search terms to process

**Returns:**
- `Promise<string[]>`: Array of top result URLs (excludes failed searches)

**Throws:**
- `Error`: If searchTerms is not an array

---

### fetchSearchItems(query, num)

Fetches raw Google Custom Search API items for a query. Optional `num` sets the number of returned items and is always clamped between 1 and 10.

**Parameters:**
- `query` (string): The search query. Queries longer than 2048 characters throw an error.
- `num` (number, optional): Number of items to return. `0` becomes `1`, values above `10` clamp to `10`, and any negative or non-integer value defaults to `10`.

**Returns:**
- `Promise<Array>`: Raw items array from Google API or empty array on error

**Throws:**
- `Error`: If the query is not a valid string or exceeds the 2048 character limit

---

### clearCache()

Clears all cached search results. Returns `true` when the cache is emptied and performs no action when caching is disabled.

**Returns:**
- `boolean`: Always `true`. Acts as a no-op when caching is disabled.

```javascript
const { clearCache } = require('qserp');

clearCache();
// => true
```

---

### performCacheCleanup()

Purges any expired entries from the cache. Returns a boolean indicating whether stale items were removed. If caching is disabled, it simply returns `false` without altering state.

**Returns:**
- `boolean`: `true` if stale entries were removed, otherwise `false`. No operation when caching is disabled.

```javascript
const { performCacheCleanup } = require('qserp');

performCacheCleanup();
// => false when nothing to purge
```

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
- `validateSearchQuery(query)` — Input validation helper (also documented above as a public export)
- `createCacheKey(query)` — Normalizes a query string into a consistent lowercase-trimmed cache key
- `sanitizeApiKey(text)` — Replaces any occurrence of the configured API key in a string with `[redacted]`
- `normalizeNum(value, defaultVal)` — Clamps a number into the valid 1–10 API range with a fallback default
- `axiosInstance` — The pre-configured Axios instance used for all requests (connection pooling, compression headers)

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
- **qerrors loader** `lib/qerrorsLoader.js` loads qerrors and masks API keys via `safeQerrors`

Example access:

```javascript
const { loadQerrors, safeQerrors } = require('qserp/lib/qerrorsLoader');
const qerrors = loadQerrors();
safeQerrors(new Error('demo'), 'init');
```

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

Run the included Jest test suite. Install dependencies first if you haven't already:

```bash
npm install
npm test
```

Tests are run via the `qtests-runner.mjs` custom runner, which discovers and executes all `*.test.js` files using Jest internally. The runner prints a summary of passed and failed files on completion.

Tests include:
- Unit tests for all public and internal functions
- Integration tests for complete workflows
- Error handling validation
- Environment variable validation
- Mock response testing

Network requests are intercepted with `axios-mock-adapter` and required environment variables are set in test setup, so no API credentials are needed to run the suite.

## Offline Development (Codex Mode)

When the environment variable `CODEX` is set to any case-insensitive `true` value, the library operates in offline mode:

- **No network requests** are made to Google APIs
- **googleSearch** and **fetchSearchItems** return empty arrays
- **rateLimitedRequest** resolves to `{ data: { items: [] } }`
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

In offline mode `rateLimitedRequest` resolves to:

```javascript
{ data: { items: [] } }
```

This enables development and testing in environments without internet access or API credentials.

## Development Tools

Several helper scripts assist with profiling and security testing. They assume `CODEX=true` so no real network calls are made.

- `perf-analysis.js`, `memory-growth-analysis.js`, `rate-limit-analysis.js` – performance and memory profiling utilities.
- `security-test.js`, `advanced-security-test.js` – security-oriented stress tests.
- `cache-optimization-test.js` – exercises cache cleanup and eviction logic.
- `rate-limit-real-test.js` – validates real Bottleneck rate limiting using mocked API calls.

Run any script with Node, for example:

```bash
node perf-analysis.js
```

### Debug Utilities

The `lib/debugUtils.js` module consolidates all logging helpers. It now
re-exports `logStart` and `logReturn` to maintain compatibility, so
`lib/logUtils.js` is deprecated and merely re-exports these functions.

Use `debugLog` to print quick messages only when debugging is enabled. The
`createTracer` helper builds an object with `entry` and `exit` methods to reduce
boilerplate when a single function requires multiple trace points.

Example usage:

```javascript
const { debugEntry, debugExit } = require('qserp/lib/debugUtils'); // use package import path for clarity

function runTask() {
  debugEntry('runTask');
  // task logic
  debugExit('runTask');
}
```

`createTracer` example:

```javascript
const { createTracer } = require('./lib/debugUtils');

function runTask() {
  const trace = createTracer('runTask');
  trace.entry();
  // task logic
  trace.exit();
}
```

Output from these helpers is controlled by the `DEBUG` environment
variable.

## Caching System

The module implements intelligent LRU caching with automatic memory management to optimize performance and reduce API quota usage:

### Cache Behavior
- **TTL (Time To Live)**: 5 minutes (300,000ms) for all cached responses
- **Cache Keys**: Normalized keys (case-insensitive, trimmed) improve hit ratios
- **Memory Management**: Automatic LRU eviction with configurable size limits
- **Built-in Cleanup**: LRU-cache handles expiry and memory management automatically
- **True LRU Behavior**: Recently accessed items refresh their age for optimal retention

### Cache Benefits
- **Reduced API Calls**: Similar queries (case variations, whitespace) share cached results
- **Improved Performance**: Cached responses return instantly without network delay
- **Memory Efficiency**: LRU eviction prevents memory leaks in long-running applications
- **Quota Conservation**: Fewer API calls help stay within Google's daily limits
- **Automatic Management**: No manual cleanup required, handles TTL and size limits internally

### Memory Management
Configure cache behavior with the `QSERP_MAX_CACHE_SIZE` environment variable:
- **Default**: 1000 entries (~10MB typical usage)
- **Disable**: Set to `0` to turn off caching completely
- **Range**: 10-50000 entries when caching is enabled (automatically constrained for security)
- **Eviction**: Automatic LRU eviction when size limit reached

### Cache Examples

```javascript
const { fetchSearchItems } = require('qserp');

// These queries will share the same cache entry due to normalization
await fetchSearchItems('JavaScript');      // API call, cached
await fetchSearchItems('javascript');      // Cache hit (normalized)
await fetchSearchItems('  JavaScript  ');  // Cache hit (trimmed)
await fetchSearchItems('JAVASCRIPT');      // Cache hit (case-insensitive)

// Different queries create separate cache entries
await fetchSearchItems('Node.js');         // New API call, cached separately

// Memory management example
process.env.QSERP_MAX_CACHE_SIZE = '100';  // Limit to 100 entries
// LRU-cache automatically evicts least recently used entries when limit reached
```

### Manual Cache Cleanup

While LRU-cache evicts expired entries automatically, the module exports the
`clearCache()` and `performCacheCleanup()` utilities for manual maintenance or
diagnostic tests. Calling `performCacheCleanup()` triggers `cache.purgeStale()`
to remove expired items. When caching is disabled with `QSERP_MAX_CACHE_SIZE=0`,
both utilities are safe no-ops that return without modifying state.

## Security Features

The module implements multiple security layers to protect against common vulnerabilities:

### Input Security
- **Query Validation**: Type checking ensures only valid string inputs
- **URL Encoding**: Automatic encoding prevents injection attacks
- **Parameter Sanitization**: Safe handling of special characters and Unicode

### Credential Protection
- **Environment Isolation**: API keys never exposed in logs or error messages
- **Automatic Sanitization**: Credentials replaced with `[redacted]` in all output
- **No Hardcoding**: All sensitive data loaded from environment variables

### Memory Security
- **Bounded Cache**: Configurable limits prevent memory exhaustion attacks
- **Automatic Cleanup**: Proactive cleanup prevents resource exhaustion
- **Environment Validation**: Configuration values validated and constrained

### Rate Limiting Security
- **Quota Protection**: Conservative limits prevent API abuse
- **Burst Prevention**: Minimum request spacing prevents rapid-fire attacks
- **Concurrent Controls**: Maximum parallel requests prevent resource exhaustion

### Logging Security
- **Structured Error Context**: `lib/errorUtils.js` builds standardized objects for qerrors so logs share consistent metadata
- **OPENAI_TOKEN**: Advanced error reporting uses these helpers for AI-driven analysis and requires this token for full functionality

`lib/qerrorsLoader.js` exposes `safeQerrors`, a wrapper that calls `qerrors` while masking API keys and catching any logging failures. This prevents crashes if qerrors itself throws and ensures sensitive credentials never appear in logs.

## Dependencies

Runtime dependencies (installed when you `npm install qserp`):

- **axios**: HTTP client for API requests with connection pooling
- **bottleneck**: Rate limiting and request scheduling
- **lru-cache**: Cache implementation with automatic memory management and TTL handling
- **qerrors**: Structured error logging with optional OpenAI-enhanced analysis. Requires `OPENAI_TOKEN` for AI-assisted error context; works without it using standard logging only.

Development dependencies (used only when contributing, not installed by consumers):

- **qtests**: Custom test runner and stubbing utilities. Provides the `qtests-runner.mjs` runner, method stubbing via `stubMethod`, and no-op stubs for axios and winston to isolate units without making real network requests.
- **jest**: Test framework used internally by the qtests runner.
- **axios-mock-adapter**: Axios request interceptor used in tests to simulate API responses.

## Contributing

The project uses Jest for testing. Before submitting a pull request:

1. Run `npm test` to ensure all tests pass. The suite mocks network requests automatically — no API credentials are needed.
2. Set `CODEX=true` in your environment for development. This bypasses credential validation and returns mock responses, so you can work on the library without a live Google API key.
3. New functions should use `debugEntry` / `debugExit` from `lib/debugUtils.js` for DEBUG-gated tracing, or `logStart` / `logReturn` for always-on execution logging. `lib/logUtils.js` is deprecated and re-exports from `lib/debugUtils.js`.
4. Error paths should go through `qerrors` (via `lib/qerrorsLoader.js`) rather than plain `console.error` where possible, to keep error reporting consistent.
5. If adding a function that might fail non-fatally, consider wrapping it with `safeRun` from `lib/utils.js` to maintain graceful degradation behavior.

## License

ISC

## Support

For issues and questions:
- [GitHub Issues](https://github.com/Bijikyu/qserp/issues)
- [Repository](https://github.com/Bijikyu/qserp)
