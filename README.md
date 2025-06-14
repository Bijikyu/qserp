
# qserp

A robust Node.js module for performing Google Custom Searches using the Google Custom Search API. Features built-in rate limiting, comprehensive error handling, and offline testing capabilities.

## Features

- **Rate Limited Requests**: Built-in rate limiting prevents API quota exhaustion
- **Intelligent Caching**: LRU caching with normalized keys and automatic memory management
- **Memory Management**: Configurable LRU eviction with automatic cleanup to prevent memory leaks
- **Security Enhanced**: Input validation, environment bounds checking, and cache key normalization
- **Comprehensive Error Handling**: Structured error logging with qerrors integration
- **Offline Testing**: Mock responses when `CODEX=true` for development without API calls
- **Parallel Processing**: Support for multiple concurrent searches with optimal performance
- **Performance Optimized**: Connection pooling, compression, and LRU cache optimization
- **Detailed Logging**: Optional detailed execution logging for debugging

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
- `LOG_LEVEL` – Controls `warn` and `error` output (`info` by default)
- `QSERP_MAX_CACHE_SIZE` – Maximum cache entries (default: 1000, range: 10-50000) for memory management
- `GOOGLE_REFERER` – Adds a Referer header to requests when set

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

### googleSearch(query)

Performs a single Google Custom Search and returns formatted results.

**Parameters:**
- `query` (string): The search query (must be non-empty)

**Returns:** 
- `Promise<Array<{title: string, snippet: string, link: string}>>`: Array of formatted search results

**Throws:**
- `Error`: If query is not a non-empty string

### getTopSearchResults(searchTerms)

Performs parallel searches for multiple terms and returns only the top result URL for each. Duplicate terms are removed before searching and results follow the order of the unique terms.

**Parameters:**
- `searchTerms` (string[]): Array of search terms to process

**Returns:**
- `Promise<string[]>`: Array of top result URLs (excludes failed searches)

**Throws:**
- `Error`: If searchTerms is not an array

### fetchSearchItems(query, num)

Fetches raw Google Custom Search API items for a query. Optional `num` limits the number of returned items.

**Parameters:**
- `query` (string): The search query (must be non-empty)
- `num` (number, optional): Maximum number of items to return (range 1-10; values outside this range are clamped)

**Returns:**
- `Promise<Array>`: Raw items array from Google API or empty array on error

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

In offline mode `rateLimitedRequest` resolves to:

```javascript
{ data: { items: [] } }
```

Only the items array is returned.

This enables development and testing in environments without internet access or API credentials.

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
- **Range**: 10-50000 entries (automatically constrained for security)
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

While LRU-cache evicts expired entries automatically, the library exposes
`performCacheCleanup()` for diagnostic tests. Calling this function triggers
`cache.purgeStale()` to remove any expired items. When caching is disabled with
`QSERP_MAX_CACHE_SIZE=0`, both `clearCache()` and `performCacheCleanup()` are
safe no-ops that return without modifying state.

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

## Dependencies

- **axios**: HTTP client for API requests with connection pooling
- **bottleneck**: Rate limiting and request scheduling
- **lru-cache**: Cache implementation with automatic memory management and TTL handling
- **qerrors**: Enhanced error logging and analysis
- **qtests**: Testing utilities for development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass with `npm test`
5. Submit a pull request

## License

ISC

## Support

For issues and questions:
- [GitHub Issues](https://github.com/Bijikyu/qserp/issues)
- [Repository](https://github.com/Bijikyu/qserp)
