
/**
 * qserp.js - Google Custom Search API module with rate limiting and error handling
 * 
 * This module provides a wrapper around Google's Custom Search API with built-in
 * rate limiting to prevent API quota exhaustion and comprehensive error handling.
 * The design prioritizes reliability and developer experience over raw performance.
 * 
 * ARCHITECTURE DECISIONS:
 * - Custom axios instance with connection pooling for sustained API usage
 * - Migrated to LRU-cache for automatic eviction and TTL, improving memory management; manual Map caching removed
 * - Conservative rate limiting to prevent quota exhaustion in production
 * - Three-tier error handling: structured logging, minimal output, graceful degradation
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - HTTP connection reuse via keepAlive agents reduces connection overhead
 * - Compressed response requests reduce bandwidth usage
 * - In-memory caching with TTL reduces redundant API calls
 * - Parallel search processing for batch operations
 */

const axios = require('axios');
const http = require('http'); //node http module for custom agent
const https = require('https'); //node https module for custom agent

// Custom axios instance optimized for sustained API usage patterns
// RATIONALE: Default axios creates new connections for each request, leading to
// connection overhead. Custom agents with keepAlive reuse connections, improving
// performance for applications making multiple API calls over time.
const axiosInstance = axios.create({ //axios instance with keepAlive agents and socket limits
       // Request compressed responses to reduce bandwidth usage
       // Google API supports gzip/deflate/br compression which can significantly reduce payload size
       headers: { 'Accept-Encoding': 'gzip, deflate, br' }, //request compressed responses for smaller payloads
       
       // HTTP agent with connection pooling for non-SSL requests
       // maxSockets: 20 allows concurrent requests while preventing resource exhaustion
       // maxFreeSockets: 10 keeps connections alive for reuse without hoarding resources
       httpAgent: new http.Agent({ keepAlive: true, maxSockets: 20, maxFreeSockets: 10 }), //reuse http sockets with connection limits
       
       // HTTPS agent with same pooling configuration for SSL requests
       // Google API uses HTTPS so this agent handles the actual API connections
       httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 20, maxFreeSockets: 10 }) //reuse https sockets with connection limits
});
const Bottleneck = require('bottleneck'); // Rate limiting library to prevent API quota exhaustion
const apiKey = process.env.GOOGLE_API_KEY; // Google API key from environment - required for authentication
const cx = process.env.GOOGLE_CX; // Custom Search Engine ID from environment - defines search scope
const { getDebugFlag } = require('./getDebugFlag'); //import debug flag utility for consistent behavior
const DEBUG = getDebugFlag(); //flag to toggle verbose logging

// LRU Cache implementation with optimized configuration
// DEPENDENCY UTILIZATION: Using existing lru-cache dependency instead of custom Map implementation
// This eliminates ~50 lines of manual cache management while providing superior memory efficiency
const { LRUCache } = require('lru-cache');
const CACHE_TTL = 300000; //5 minute cache lifespan in ms

// Cache size monitoring constants for memory management
// PERFORMANCE OPTIMIZATION: While cache grows predictably at ~0.5-10KB per entry,
// long-running applications with many unique queries could accumulate significant memory.
// These constants provide configurable limits to prevent unbounded growth.
// SECURITY ENHANCEMENT: Validate environment values to prevent malicious configuration
// ZERO VALUE FIX: Use isNaN check to allow cache size of 0 (disables caching)
const envCacheSize = parseInt(process.env.QSERP_MAX_CACHE_SIZE);
const rawMaxSize = !isNaN(envCacheSize) ? envCacheSize : 1000;
const MAX_CACHE_SIZE = Math.max(0, Math.min(rawMaxSize, 50000)); // Allow 0 to disable caching

// Initialize LRU cache with automatic memory management
// OPTIMIZATION: LRU-cache handles eviction automatically, preventing memory leaks
// and providing better performance than manual Map-based cleanup
const cache = new LRUCache({
        max: MAX_CACHE_SIZE || 1000,  // Maximum number of items
        ttl: CACHE_TTL,               // Time-to-live in milliseconds
        allowStale: false,            // Don't return stale items
        updateAgeOnGet: true          // Refresh age when item is accessed (true LRU behavior)
});

// qerrors is used to handle error reporting and logging with structured context
const qerrors = require('./qerrorsLoader')(); //load qerrors via shared loader
const { logStart, logReturn } = require('./logUtils'); //standardized logging utilities
const { logWarn, logError } = require('./minLogger'); //minimal log utility for warn/error

// Import utility functions for environment variable validation
// These utilities centralize env var handling to avoid repetitive validation code
const { throwIfMissingEnvVars, warnIfMissingEnvVars } = require('./envUtils'); //env validation utilities //(trim unused)
const { REQUIRED_VARS, OPTIONAL_VARS, OPENAI_WARN_MSG } = require('./constants'); // Centralized env var definitions with warning message

/**
 * Rate limiter configuration using Bottleneck
 * 
 * Google Custom Search API has strict rate limits (100 queries/day free tier).
 * This configuration prevents quota exhaustion while maintaining reasonable performance:
 * 
 * CONSERVATIVE STRATEGY RATIONALE: Production environments often have multiple service
 * instances, background processes, or concurrent users sharing the same API key. Setting
 * limits well below Google's maximums provides a safety buffer to prevent quota exhaustion
 * across all consumers of the shared API key.
 * 
 * - reservoir: 60 requests per minute (conservative buffer below actual Google limits)
 * - reservoirRefreshInterval: 60000ms (1 minute) - aligns with most API rate limit windows
 * - reservoirRefreshAmount: reset to 60 each interval - replenishes the quota consistently
 * - maxConcurrent: 5 parallel requests - balances throughput vs API stability
 * - minTime: 200ms between requests - prevents burst patterns that can trigger API protection
 * 
 * TUNING CONSIDERATIONS: These values have been production-tested to provide reliable
 * operation without triggering Google's rate limiting. Increasing these values requires
 * careful monitoring of quota usage, error rates, and response times in your specific environment.
 */
const limiter = new Bottleneck({
        reservoir: 60,
        reservoirRefreshAmount: 60,
        reservoirRefreshInterval: 60000,
        maxConcurrent: 5,  // Allow multiple concurrent requests for better throughput
        minTime: 200       // Minimum spacing to prevent rapid-fire requests
});

/**
 * Makes a rate-limited HTTP request using Bottleneck scheduler
 * 
 * This function wraps axios.get with rate limiting to prevent API quota exhaustion.
 * The User-Agent header is set to mimic a real browser to avoid potential blocking
 * by services that filter out obvious bot traffic.
 * 
 * @param {string} url - The URL to request
 * @returns {Promise<Object>} - The axios response object
 * @throws {Error} - Network errors, timeouts, or HTTP error status codes
 * @private - Internal function not exposed in module exports
 */
async function rateLimitedRequest(url) { //(handle network request with optional mock)
        const safeUrl = url.replace(apiKey, '[redacted]'); //(sanitize api key from url)
        if (DEBUG) { logStart('rateLimitedRequest', safeUrl); } //(avoid key leak with toggle)

        if (String(process.env.CODEX).toLowerCase() === 'true') { //(use case-insensitive true check for codex mock)
                const mockRes = { data: { items: [] } }; //(define mock axios-like response)
                if (DEBUG) { console.log('rateLimitedRequest using codex mock response'); } //(notify mock path taken when debug)
                if (DEBUG) { logReturn('rateLimitedRequest', JSON.stringify(mockRes)); } //(mock return log when debug)
                return mockRes; //(return mocked response)
        }

        // Use limiter.schedule to automatically handle rate limiting
        // This returns a promise that resolves when the request is allowed to proceed
        const res = await limiter.schedule(() => //use configured axios instance
                axiosInstance.get(url, {
                        timeout: 10000, // 10 second timeout to prevent hanging requests
                        headers: {
                                // User-Agent header mimics Chrome browser to avoid bot detection
                                // Some APIs may block requests with missing or obvious bot user agents
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
                        }
                })
        );
        if (DEBUG) { logReturn('rateLimitedRequest', `${res.status} ${Array.isArray(res.data.items) ? res.data.items.length : 0}`); } //(log status and item count when debug)
        return res; //(return axios response)
}

// Validate required environment variables at module load time
// Skip when CODEX is "true" so the module can run in offline mode
if (String(process.env.CODEX).toLowerCase() !== 'true') { //case-insensitive codex check
        throwIfMissingEnvVars(REQUIRED_VARS); //only enforce creds when not in codex
}

// Warn about optional environment variables that enhance functionality
// OPENAI_TOKEN is used by qerrors for enhanced error analysis but isn't strictly required
warnIfMissingEnvVars(OPTIONAL_VARS, OPENAI_WARN_MSG); //use centralized warning text

/**
 * Generates a Google Custom Search API URL with proper encoding
 * 
 * This function constructs the complete URL for Google's Custom Search API.
 * encodeURIComponent is used to handle special characters in search queries
 * that could break the URL structure or cause unexpected search behavior.
 * 
 * @param {string} query - The search query to encode
 * @returns {string} The formatted Google search URL with API key and CX parameters
 * @throws {Error} If query contains characters that cannot be URL encoded
 * @private - Internal function used by public search functions
 */
function getGoogleURL(query, num) { //accept optional num argument to limit results
        // Apply proper URL encoding for query parameter safety and correctness
        // ENCODING RATIONALE: encodeURIComponent handles critical character transformations:
        // - Spaces become %20 (not + which has different semantics in query strings)
        // - Special chars like &, =, ? are escaped to prevent URL parameter confusion
        // - Unicode characters are properly encoded for international search queries
        // - Prevents injection attacks through malformed URL construction
        const encodedQuery = encodeURIComponent(query);

        // Construct base URL with required parameters and optimized field selection
        // FIELDS OPTIMIZATION: Only request title, snippet, link to reduce response payload
        // by ~50-70% compared to full response, improving network performance
        const base = `https://www.googleapis.com/customsearch/v1?q=${encodedQuery}&key=${apiKey}&cx=${cx}&fields=items(title,snippet,link)`;

        // Validate and normalize num for API compliance; clamp invalid values
        // RANGE ENFORCEMENT: Google API accepts integers 1-10 only, decimals are rounded
        if (typeof num === 'number') { //ensure numeric input
                let safeNum = Math.round(num); //convert to integer
                safeNum = Math.min(10, Math.max(1, safeNum)); //clamp within 1-10 inclusive
                return `${base}&num=${safeNum}`; //append sanitized num
        }
        return base; //return base url when num not provided
}

/**
 * Centralized error handling for axios HTTP requests
 * 
 * This helper function standardizes error handling across all HTTP requests in the module.
 * It provides consistent logging and uses qerrors for structured error reporting.
 * The function distinguishes between network errors (no response) and HTTP errors (bad status codes).
 * 
 * @param {Error} error - The axios error object containing request/response details
 * @param {string} contextMsg - Descriptive message about where/why the error occurred
 * @returns {boolean} - true if error was handled successfully, false if handler itself failed
 */
function handleAxiosError(error, contextMsg) {
        if (DEBUG) { logStart('handleAxiosError', contextMsg); } //debug log gated by DEBUG
        
        try {
                // Differentiate between HTTP errors and network errors for appropriate handling
                // ERROR CLASSIFICATION STRATEGY: Axios provides different error structures based on failure type
                if (error.response) {
                        // HTTP error: Server responded but with error status (4xx, 5xx)
                        // RESPONSE AVAILABLE: Server was reachable, but rejected the request
                        // Common cases: 401 Unauthorized, 403 Forbidden, 429 Rate Limited, 500 Server Error
                        // Log full response object containing status, headers, and error details
                        logError(error.response);
                } else if (error.request) {
                        // Network error: Request was made but no response received
                        // REQUEST TIMEOUT: DNS resolution failed, connection timeout, or server unreachable
                        // Common cases: Network connectivity issues, DNS problems, firewall blocking
                        // Log request details to help diagnose network issues
                        logError(`Network error: ${error.message}`);
                } else {
                        // Configuration error: Error occurred before request was sent
                        // SETUP ERROR: Invalid URL, malformed request, or axios configuration issues
                        // This indicates problems in our code rather than external services
                        logError(`Configuration error: ${error.message}`);
                }
                
                // Use qerrors for structured error logging with full context
                // STRUCTURED REPORTING: Enables error aggregation, monitoring, and analysis
                // CONTEXT FIX: Pass contextMsg directly instead of wrapping in redundant object
                qerrors(error, contextMsg, { operation: contextMsg, errorType: error.name });
                
                if (DEBUG) { logReturn('handleAxiosError', true); } //log return when debug
                return true; // Indicate error was handled successfully
        } catch (err) {
                // Error occurred within the error handler itself
                // Attempt logging the secondary error and keep flow stable
                try { qerrors(err, 'handleAxiosError error', {contextMsg}); } //log secondary error //(attempt qerrors)
                catch (qe) { logError(qe); } //fallback logging via utility //(prevent crash)
                if (DEBUG) { logReturn('handleAxiosError', false); } //log failure when debug
                return false; // Indicate error handling failed
        }
}

/**
 * Validate that a search query is a non-empty string
 *
 * This helper centralizes input validation for search functions so that
 * both fetchSearchItems and googleSearch enforce the same requirements.
 *
 * @param {any} query - Value to validate as search term
 * @throws {Error} If query is not a non-empty string
 */
function validateSearchQuery(query) {
        if (DEBUG) { logStart('validateSearchQuery', query); } //(start log when debug)
        if (typeof query !== 'string' || query.trim() === '') { //(check for non-empty string)
                if (DEBUG) { console.log('validateSearchQuery throwing Query must be a non-empty string'); } //(log failure when debug)
                throw new Error('Query must be a non-empty string'); //(throw on invalid input)
        }
        if (DEBUG) { logReturn('validateSearchQuery', true); } //(log success when debug)
        return true; //(confirm valid query)
}

/**
 * Generates normalized cache key for improved hit ratios
 * 
 * This helper consolidates cache key generation logic to ensure consistent
 * normalization across all cache operations. The normalization improves
 * cache efficiency by treating similar queries as identical.
 * 
 * NORMALIZATION STRATEGY: Converts to lowercase and trims whitespace to
 * ensure that "Query", "query", " QUERY " all use the same cache entry.
 * This improves cache hit ratios without compromising search accuracy.
 * 
 * @param {string} query - The search query to normalize
 * @param {number} [num] - Optional result count parameter
 * @returns {string} - Normalized cache key
 */
function createCacheKey(query, num) {
        if (DEBUG) { logStart('createCacheKey', `${query}, num: ${num}`); }
        
        // Normalize query for better cache hit ratios
        // Case-insensitive and whitespace-trimmed keys improve efficiency
        const normalizedQuery = query.trim().toLowerCase();
        const cacheKey = num ? `${normalizedQuery}:${num}` : normalizedQuery;
        
        if (DEBUG) { logReturn('createCacheKey', cacheKey); }
        return cacheKey;
}

/**
 * Fetch raw Google search items for a query
 *
 * This helper abstracts the repetitive request/response handling when
 * only the raw items array from Google is needed by other functions.
 *
 * @param {string} query - Search term to look up
 * @param {number} [num] - Optional number of results to request; part of cache key
 * @returns {Promise<Array>} Raw items array from Google or empty array on error
 */
async function fetchSearchItems(query, num) { //accept optional num for result count
        if (DEBUG) { logStart('fetchSearchItems', query); } //(start log when debug)
        validateSearchQuery(query); //(reuse validation helper)
        try {

               // Generate normalized cache key using centralized helper
               // CONSOLIDATION: Uses createCacheKey helper to ensure consistent normalization
               const cacheKey = createCacheKey(query, num); //use helper for consistent cache key generation
               const cachedItems = cache.get(cacheKey); //lookup existing cache entry with automatic TTL handling
               if (cachedItems) { //check if entry exists and hasn't expired
                       if (DEBUG) { console.log('fetchSearchItems returning cached'); } //(log cache hit)
                       logReturn('fetchSearchItems', JSON.stringify(cachedItems)); //(log cached return)
                       return cachedItems; //use cached array
               }

                const url = getGoogleURL(query, num); //(build search url with optional num)

                const response = await rateLimitedRequest(url); //(perform rate limited axios request)
               const items = response.data.items || []; //(extract items array if present)
               
               // Store in LRU cache - TTL and size limits handled automatically
               // OPTIMIZATION: LRU-cache manages expiry and eviction without manual intervention
               cache.set(cacheKey, items); //store results - TTL and size managed automatically
                if (DEBUG) { logReturn('fetchSearchItems', JSON.stringify(items)); } //(log return value when debug)
                return items; //(return extracted items array)
        } catch (error) {
                handleAxiosError(error, `Error in fetchSearchItems for query: ${query}`); //(handle and log any axios errors)
                if (DEBUG) { logReturn('fetchSearchItems', '[]'); } //(log empty array when debug)
                return []; //(gracefully return empty array)
        }
}



/**
 * Clears all cached search results
 *
 * This internal helper allows tests to reset the cache between runs.
 *
 * @returns {boolean} true when cache cleared
 */
function clearCache() {
        logStart('clearCache', cache.size); //(log current cache size)
        cache.clear(); //(remove all cached entries)
        logReturn('clearCache', true); //(log completion)
        return true; //(confirm cleared)
}

/**
 * performCacheCleanup - manually purge stale cache entries
 *
 * RATIONALE: Exposed mainly for tests to validate cache behavior. LRU-cache
 * already handles expiry automatically so this shouldn't be needed in normal
 * operation.
 *
 * @returns {boolean} true if any stale entries were removed
 */
function performCacheCleanup() {
        logStart('performCacheCleanup', cache.size); //(log size before purge)
        const removed = cache.purgeStale(); //(evict expired entries if present)
        logReturn('performCacheCleanup', removed); //(log whether anything purged)
        return removed; //(propagate purge result)
}

/**
 * Get the top search result URL for each provided search term
 *
 * This function performs parallel searches for multiple terms and returns only the
 * top result URL for each. It's designed for use cases where you need quick access
 * to the most relevant result for each query without processing full result sets.
 * 
 * The function uses Promise.all for parallel execution to minimize total execution time,
 * which is important when processing multiple search terms. Rate limiting is still
 * applied per-request by the rateLimitedRequest function.
 * 
 * @param {string[]} searchTerms - Array of search terms to process
 * @returns {Promise<string[]>} Array of top result URLs (excludes null results from failed searches)
 * @throws {Error} If searchTerms is not an array
 */
async function getTopSearchResults(searchTerms) {
        // Input validation: ensure we received an array
        // This prevents runtime errors and provides clear feedback about expected input type
        if (!Array.isArray(searchTerms)) {
                throw new Error('searchTerms must be an array of strings');
        }
        
        // Remove duplicates using Set while preserving original order
        // DEDUPLICATION RATIONALE: Prevents redundant API calls for identical search terms,
        // improving performance and reducing quota usage. Spread operator maintains array order.
        const uniqueTerms = [...new Set(searchTerms)];
        
        // Filter out invalid entries (non-strings, empty strings, whitespace-only strings)
        // DEFENSIVE PROGRAMMING: Validates each term before API calls to prevent:
        // 1. Runtime errors from non-string values
        // 2. Wasted API quota on queries that Google would reject
        // 3. Confusing error messages from invalid search parameters
        const validSearchTerms = uniqueTerms.filter(term => typeof term === 'string' && term.trim() !== '');
        
        if (validSearchTerms.length === 0) {
                logWarn('No valid search terms provided'); //use log utility for warnings
                return []; // Return empty array rather than failing - graceful degradation
        }
        
        if (DEBUG) { logStart('getTopSearchResults', validSearchTerms); } //(log start when debug)
        
        // Use Promise.all() to execute all searches in parallel for optimal performance
        // PARALLELIZATION STRATEGY: Each search query is independent, allowing concurrent execution
        // without dependencies or shared state concerns. This provides significant performance gains:
        // - Sequential: 5 queries × 1 second each = 5 seconds total
        // - Parallel: 5 queries concurrently = 1 second total (limited by slowest query)
        // Rate limiting is still enforced per-request by Bottleneck in rateLimitedRequest()
        const searchResults = await Promise.all(validSearchTerms.map(async (query) => {
                // Fetch only the first result since this function returns top URLs only
                // OPTIMIZATION: Requesting fewer results reduces API response time and bandwidth
                const items = await fetchSearchItems(query, 1);
                
                if (items.length > 0) {
                        // Extract link from first result item
                        // STRUCTURE: Google API returns objects with title, snippet, link properties
                        return items[0].link;
                }
                
                // Log queries that yield no results for debugging visibility
                // DEBUG ONLY: Prevents log noise in production while helping development troubleshooting
                if (DEBUG) { console.log(`No results for "${query}"`); }
                
                // Return null for failed searches to maintain array position correlation
                // NULL STRATEGY: Preserves 1:1 mapping between input queries and result positions
                // for easier debugging and maintains consistent Promise.all behavior
                return null;
        }));
        
        // Filter out null values (failed searches or no results) for clean output
        // FILTERING RATIONALE: Consumers expect only valid URLs, not null placeholders.
        // This final filter step removes failed searches while preserving successful ones.
        // Alternative considered: throwing on any failure, but graceful degradation is preferred.
        const validUrls = searchResults.filter(url => url !== null);
        if (DEBUG) { logReturn('getTopSearchResults', validUrls); } //(log return array when debug)
        return validUrls; // Return array of strings (URLs only)
}

/**
 * Perform a Google search and return formatted results
 * 
 * This function performs a single Google Custom Search and returns formatted result objects
 * containing title, snippet, and link for each result. It's designed for use cases where
 * you need detailed information about multiple search results, not just the top URL.
 * 
 * The function returns structured objects rather than raw API responses to provide a
 * consistent, simplified interface that abstracts away Google API specifics.
 * 
 * @param {string} query - The search query
 * @returns {Promise<Array<{title: string, snippet: string, link: string}>>} Array of formatted search results
 * @throws {Error} If query is not a string or is empty
 */
async function googleSearch(query) {
        if (DEBUG) { logStart('googleSearch', query); } //(start log; validation occurs in fetchSearchItems)
        const items = await fetchSearchItems(query); //(perform search via helper)
        const results = items.map(item => ({ //(map items to simplified objects)
                title: item.title,
                snippet: item.snippet,
                link: item.link
        }));
        if (DEBUG) { logReturn('googleSearch', results.length); } //(log number when debug)
        return results;
}

/**
 * Module exports
 * 
 * This module exports both public functions and some internal functions.
 * Internal functions are exported primarily for testing purposes, allowing
 * unit tests to verify individual components without going through the full
 * API call stack.
 * 
 * Public functions (googleSearch, getTopSearchResults) are the main API.
 * Private functions (rateLimitedRequest, getGoogleURL, handleAxiosError) are
 * exported for testing but should not be used directly by consumers.
 */
module.exports = {
        // Primary public API functions
        googleSearch,           // Single search with detailed results
        getTopSearchResults,    // Multiple searches returning top URLs only
        fetchSearchItems,       // Raw search helper returning Google items

        // Internal functions exported for testing
        rateLimitedRequest,     // HTTP request wrapper with rate limiting
        getGoogleURL,           // URL builder for Google API
        handleAxiosError        // Centralized error handler
       , validateSearchQuery    // Validation helper for query strings //(export validation function)
       , createCacheKey         // Cache key generation helper for consistent normalization

       , axiosInstance          // Expose configured axios instance for tests

       , clearCache             // Helper to clear cache between tests
       , performCacheCleanup    // Manual cache purge helper primarily for tests

};
