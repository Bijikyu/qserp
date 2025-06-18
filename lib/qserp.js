
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

const axios = require('axios'); //HTTP client for performing Google API requests
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
const defaultApiKey = process.env.GOOGLE_API_KEY; //capture initial key so later changes can be masked
const defaultCx = process.env.GOOGLE_CX; //capture initial cx for reuse if env changes at runtime
const { getDebugFlag } = require('./getDebugFlag'); //import debug flag utility for consistent behavior
const DEBUG = getDebugFlag(); //flag to toggle verbose logging

// LRU Cache implementation with optimized configuration
// DEPENDENCY UTILIZATION: Using existing lru-cache dependency instead of custom Map implementation
// This eliminates ~50 lines of manual cache management while providing superior memory efficiency
const { LRUCache } = require('lru-cache'); //LRU cache class for automatic eviction
const CACHE_TTL = 300000; //5 minute cache lifespan in ms

// Cache size monitoring constants for memory management
// PERFORMANCE OPTIMIZATION: While cache grows predictably at ~0.5-10KB per entry,
// long-running applications with many unique queries could accumulate significant memory.
// These constants provide configurable limits to prevent unbounded growth.
// SECURITY ENHANCEMENT: Validate environment values to prevent malicious configuration
// STRICT PARSING: use centralized utility to reject non-numeric values like '10abc'
const { parseIntWithBounds } = require('./envValidator'); //import validator utility for env integers
const MAX_CACHE_SIZE = parseIntWithBounds('QSERP_MAX_CACHE_SIZE', 1000, 0, 50000); //parse with clamping 0-50000

// Initialize LRU cache with automatic memory management
// OPTIMIZATION: LRU-cache handles eviction automatically, preventing memory leaks
// and providing better performance than manual Map-based cleanup
const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
        { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
        new LRUCache({
                max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
                ttl: CACHE_TTL,               // Time-to-live in milliseconds
                allowStale: false,            // Don't return stale items
                updateAgeOnGet: true          // Refresh age when item is accessed (true LRU behavior)
        });

// qerrors is used to handle error reporting and logging with structured context
const qerrors = require('./qerrorsLoader')(); //load qerrors via shared loader
const { logStart, logReturn } = require('./logUtils'); //standardized logging utilities
const { logWarn, logError } = require('./minLogger'); //minimal log utility for warn/error

// Replaces occurrences of the API key with a redacted token.
// The input value is coerced to a string before any replacement so callers can
// pass numbers or objects without risking TypeError from String.replace.
// @param {any} text - Value potentially containing the API key
// @returns {string} sanitized string with key values masked
function sanitizeApiKey(text) { //mask api key values so logs never leak secrets
        let result; //final sanitized value holder
        let sanitizedInput; //input sanitized only for logging
        const applyPatterns = (str, key) => { //helper applies regex set for one key
                if (!key) return str; //skip when no key provided
                try {
                        const escKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //escape regex metachars
                        const rawParamRegex = new RegExp(`([?&][^=&]*=)${escKey}`, 'g'); //match key after '='
                        const encEscKey = encodeURIComponent(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //escape encoded key
                        const encValueRegex = new RegExp(`([?&][^=&]*=)${encEscKey}`, 'g'); //match encoded value
                        const encParamRegex = new RegExp(`([?&][^=&]*%3D)${encEscKey}`, 'gi'); //match encoded '=' param
                        const plainRegex = new RegExp(`\\b${escKey}\\b(?!\\s*=)`, 'g'); //match standalone key
                        let out = str; //mutable result string
                        out = out.replace(rawParamRegex, '$1[redacted]'); //mask raw parameter
                        out = out.replace(encValueRegex, '$1[redacted]'); //mask encoded value
                        out = out.replace(encParamRegex, '$1[redacted]'); //mask encoded '=' value
                        out = out.replace(plainRegex, '[redacted]'); //mask standalone occurrence
                        return out; //return masked string
                } catch (e) { //fallback when regex creation fails
                        try {
                                const escKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //escape again for safety
                                const rawParamRegex = new RegExp(`([?&][^=&]*=)${escKey}`, 'g'); //raw param
                                let out = str.replace(rawParamRegex, '$1[redacted]'); //mask raw param
                                let encEscKey;
                                try { encEscKey = encodeURIComponent(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); } catch (_) { encEscKey = null; } //attempt encode
                                if (encEscKey) {
                                        out = out.replace(new RegExp(`([?&][^=&]*=)${encEscKey}`, 'g'), '$1[redacted]'); //mask encoded value
                                        out = out.replace(new RegExp(`([?&][^=&]*%3D)${encEscKey}`, 'gi'), '$1[redacted]'); //mask encoded '=' value
                                }
                                out = out.replace(new RegExp(`\\b${escKey}\\b(?!\\s*=)`, 'g'), '[redacted]'); //mask plain
                                return out; //return sanitized fallback
                        } catch (_) { return str; } //on repeated failure, return unchanged
                }
        };
        try {
                const envKey = process.env.GOOGLE_API_KEY; //read runtime key each call
                sanitizedInput = String(text); //normalize input to string
                sanitizedInput = applyPatterns(sanitizedInput, envKey); //mask env key
                if (defaultApiKey && defaultApiKey !== envKey) { //mask initial key when different
                        sanitizedInput = applyPatterns(sanitizedInput, defaultApiKey); //apply second key patterns
                }
                if (DEBUG) { console.log(`sanitizeApiKey is running with ${sanitizedInput}`); } //trace sanitized input
                result = sanitizedInput; //capture result after masking
        } catch (err) { //retry with catch logic when failure occurs
                const envKey = process.env.GOOGLE_API_KEY; //re-read runtime key
                sanitizedInput = String(text); //stringify fallback
                sanitizedInput = applyPatterns(sanitizedInput, envKey); //mask env key
                if (defaultApiKey && defaultApiKey !== envKey) {
                        sanitizedInput = applyPatterns(sanitizedInput, defaultApiKey); //mask initial key again
                }
                if (DEBUG) { console.log(`sanitizeApiKey is running with ${sanitizedInput}`); } //trace sanitized fallback
                result = sanitizedInput; //use fallback sanitized result
        }
        if (DEBUG) { console.log(`sanitizeApiKey is returning ${result}`); } //final sanitized result log
        return result; //return sanitized string
}

// Import utility functions for environment variable validation
// These utilities centralize env var handling to avoid repetitive validation code
const { throwIfMissingEnvVars, warnIfMissingEnvVars } = require('./envUtils'); //env validation utilities //(trim unused)
const { REQUIRED_VARS, OPTIONAL_VARS, OPENAI_WARN_MSG } = require('./constants'); // Centralized env var definitions with warning message

// Rate limiter configuration using Bottleneck.
// Google Custom Search API has strict rate limits (100 queries/day free tier).
// This configuration prevents quota exhaustion while maintaining reasonable performance.
// CONSERVATIVE STRATEGY RATIONALE: production often has many service instances sharing one API key,
// so limits are kept well below Google's maximums as a safety buffer across consumers.
// - reservoir: 60 requests per minute (conservative buffer below actual Google limits)
// - reservoirRefreshInterval: 60000ms (1 minute)
// - reservoirRefreshAmount: reset to 60 each interval
// - maxConcurrent: 5 parallel requests balances throughput vs stability
// - minTime: 200ms between requests prevents burst patterns
// TUNING CONSIDERATIONS: these values were production-tested; raising them requires monitoring quota usage and error rates.
const limiter = new Bottleneck({
        reservoir: 60,
        reservoirRefreshAmount: 60,
        reservoirRefreshInterval: 60000,
        maxConcurrent: 5,  // Allow multiple concurrent requests for better throughput
        minTime: 200       // Minimum spacing to prevent rapid-fire requests
});

// Makes a rate-limited HTTP request using Bottleneck scheduler.
// This wraps axios.get with rate limiting to prevent API quota exhaustion.
// The User-Agent header mimics a browser so services don't block obvious bots.
// @param {string} url - The URL to request
// @returns {Promise<Object>} - The axios response object
// @throws {Error} - Network errors, timeouts, or HTTP error status codes
// @private - Internal function not exposed in module exports
async function rateLimitedRequest(url) { //wraps axios.get with limiter to avoid quota exhaustion
        const safeUrl = sanitizeApiKey(url); //(sanitize api key from url)
        if (DEBUG) { logStart('rateLimitedRequest', safeUrl); } //(avoid key leak with toggle)


        if (String(process.env.CODEX).trim().toLowerCase() === 'true') { //offline mode allows running without hitting Google

                const mockRes = { data: { items: [] } }; //(return only items array to match offline mode)
                if (DEBUG) { console.log('rateLimitedRequest using codex mock response'); } //(notify mock path taken when debug)
                if (DEBUG) { logReturn('rateLimitedRequest', JSON.stringify(mockRes)); } //(mock return log when debug)
                return mockRes; //(return mocked response)
        }

        // Use limiter.schedule to automatically handle rate limiting
        // This returns a promise that resolves when the request is allowed to proceed
        const res = await limiter.schedule(() => //await ensures rate limiter controls concurrency
                axiosInstance.get(url, {
                        timeout: 10000, // 10 second timeout to prevent hanging requests
                        headers: {
                                // User-Agent header mimics Chrome browser to avoid bot detection
                                // Some APIs may block requests with missing or obvious bot user agents
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
                                ...(process.env.GOOGLE_REFERER ? { Referer: process.env.GOOGLE_REFERER } : {}) //include referer header when provided
                        }
                })
        );
        if (DEBUG) { logReturn('rateLimitedRequest', `${res.status} ${Array.isArray(res.data.items) ? res.data.items.length : 0}`); } //(log status and item count when debug)
        return res; //(return axios response)
}

// Validate required environment variables at module load time
// Skip when CODEX is "true" so the module can run in offline mode

if (String(process.env.CODEX).trim().toLowerCase() !== 'true') { //case-insensitive codex check trimming spaces for robust offline toggle

        throwIfMissingEnvVars(REQUIRED_VARS); //only enforce creds when not in codex
}

// Warn about optional environment variables that enhance functionality
// OPENAI_TOKEN is used by qerrors for enhanced error analysis
warnIfMissingEnvVars(['OPENAI_TOKEN'], OPENAI_WARN_MSG); //custom message for token warning
// GOOGLE_REFERER improves search analytics but is optional
warnIfMissingEnvVars(['GOOGLE_REFERER']); //no message: absence only reduces analytics

// Normalizes the "num" parameter used for search result count.
// The API only accepts values from 1 to 10. This helper parses the input,
// clamps it to that range and returns null when the value cannot be converted to a finite number.
// @param {any} num - Desired result count
// @returns {number|null} Integer between 1 and 10 or null when invalid
// @private - Shared utility for validation
function normalizeNum(num) { //clamps count to Google allowed range ensuring predictable caching
       if (DEBUG) { console.log(`normalizeNum is running with ${num}`); } //debug trace start when enabled
       try {
               const str = String(num).trim(); //convert to trimmed string for validation
               if (!/^\d+$/.test(str)) { if (DEBUG) { console.log('normalizeNum is returning null'); } return null; } //reject non-integer strings
               let safe = parseInt(str, 10); //parse validated digits into number
               safe = Math.min(Math.max(safe, 1), 10); //clamp value to accepted range
               if (DEBUG) { console.log(`normalizeNum is returning ${safe}`); } //debug trace return when enabled
               return safe; //propagate normalized number
       } catch (err) {
               if (DEBUG) { console.log('normalizeNum is returning null'); } //debug trace for errors when enabled
               return null; //return null if normalization fails
       }
}

function getGoogleURL(query, num) { //accept optional num argument to limit results
        if (DEBUG) { logStart('getGoogleURL', `${query}, num: ${num}`); } //log start with raw params
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
        const key = process.env.GOOGLE_API_KEY || defaultApiKey; //re-read every call so key rotation takes effect
        const searchCx = process.env.GOOGLE_CX || defaultCx; //re-read every call so config changes apply

        const params = [`q=${encodedQuery}`]; //start with encoded query in param list
        if (key) { params.push(`key=${encodeURIComponent(key)}`); } //add key param only when defined to avoid undefined value
        if (searchCx) { params.push(`cx=${encodeURIComponent(searchCx)}`); } //add cx param when provided for same reason
        params.push('fields=items(title,snippet,link)'); //always request minimal fields for smaller response
        const base = `https://customsearch.googleapis.com/customsearch/v1?${params.join('&')}`; //assemble base URL from params

        // Normalize num parameter to Google's allowed range 1-10
        // REUSE LOGIC: Delegates clamping to normalizeNum for consistency
        const safeNum = normalizeNum(num); //clamp or null via helper
        if (safeNum !== null) { //append num parameter when valid
                const urlWithNum = `${base}&num=${safeNum}`; //construct final URL with num
                if (DEBUG) { logReturn('getGoogleURL', urlWithNum); } //log computed URL
                return urlWithNum; //return encoded URL with num
        }
        if (DEBUG) { logReturn('getGoogleURL', base); } //log base URL when no num
        return base; //omit num when not provided
}

// Centralized error handling for axios HTTP requests.
// This helper standardizes error handling across all requests in the module and logs via qerrors.
// It differentiates between network errors and HTTP status errors for clearer reporting.
// @param {Error|any} error - The axios error object or arbitrary value thrown (converted to Error when needed)
// @param {string} contextMsg - Descriptive message about where/why the error occurred
// @returns {Promise<boolean>} - true if error was handled successfully, false if handler itself failed
async function handleAxiosError(error, contextMsg) { //logs with qerrors to keep consistent monitoring
        if (DEBUG) { logStart('handleAxiosError', contextMsg); } //debug log gated by DEBUG

        try {
                let errObj = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error)); //ensure Error instance from input
                if (error && typeof error === 'object' && !(error instanceof Error)) { Object.assign(errObj, error); } //preserve props from plain object

                const sanitized = Object.assign(new Error(), errObj); //clone properties into new Error object
                sanitized.message = sanitizeApiKey(errObj.message); //overwrite message with sanitized value
                sanitized.name = errObj.name || 'Error'; //preserves error context for qerrors
                if (errObj.stack) { sanitized.stack = errObj.stack; } //retain original stack when provided
                if (errObj && errObj.config && errObj.config.url) { //check for config before copy
                        sanitized.config = { ...errObj.config, url: sanitizeApiKey(errObj.config.url) }; //sanitize url field
                }

                // Differentiate between HTTP errors and network errors for appropriate handling
                // ERROR CLASSIFICATION STRATEGY: Axios provides different error structures based on failure type
                if (errObj && errObj.response) { //check for response before usage
                        // HTTP error: Server responded but with error status (4xx, 5xx)
                        // RESPONSE AVAILABLE: Server was reachable, but rejected the request
                        // Log full response object after sanitizing URL to protect API key
                        const respCopy = { ...errObj.response, message: sanitized.message }; //copy response with sanitized msg
                        if (respCopy.config && respCopy.config.url) {
                                respCopy.config = { ...respCopy.config, url: sanitizeApiKey(respCopy.config.url) }; //sanitize url in response config
                        }
                        logError(respCopy); //log sanitized response object
                } else if (errObj && errObj.request) { //check for request before usage
                        // Network error: Request was made but no response received
                        const urlInfo = sanitized.config && sanitized.config.url ? ` url: ${sanitized.config.url}` : ''; //optional sanitized url
                        logError(`Network error: ${sanitized.message}${urlInfo}`); //log sanitized text
                } else {
                        // Configuration error: Error occurred before request was sent
                        const urlInfo = sanitized.config && sanitized.config.url ? ` url: ${sanitized.config.url}` : ''; //optional sanitized url
                        logError(`Configuration error: ${sanitized.message}${urlInfo}`); //log sanitized message
                }

                // Use qerrors for structured error logging with sanitized copy
                // STRUCTURED REPORTING: Enables error aggregation, monitoring, and analysis without leaking secrets
                await qerrors(sanitized, contextMsg, { operation: contextMsg, errorType: sanitized.name }); //await async qerrors call
                
                if (DEBUG) { logReturn('handleAxiosError', true); } //log return when debug
                return true; // Indicate error was handled successfully
        } catch (err) {
                // Error occurred within the error handler itself
                // Attempt logging the secondary error and keep flow stable
                try { await qerrors(err, 'handleAxiosError error', {contextMsg}); } //await fallback qerrors //(ensure async wait)
                catch (qe) { logError(qe); } //fallback logging via utility //(prevent crash)
                if (DEBUG) { logReturn('handleAxiosError', false); } //log failure when debug
                return false; // Indicate error handling failed
        }
}

// Validate that a search query is a non-empty string.
// This centralizes input checks so fetchSearchItems and googleSearch follow the same rules.
// @param {any} query - Value to validate as search term
// @throws {Error} If query is not a non-empty string
function validateSearchQuery(query) { //ensures queries meet API expectations
        if (DEBUG) { logStart('validateSearchQuery', query); } //(start log when debug)
        if (typeof query !== 'string' || query.trim() === '') { //(check for non-empty string)
                if (DEBUG) { console.log('validateSearchQuery throwing Query must be a non-empty string'); } //(log failure when debug)
                throw new Error('Query must be a non-empty string'); //(throw on invalid input)
        }
        if (query.length > 2048) { //(enforce max character length)
                if (DEBUG) { console.log('validateSearchQuery throwing Query exceeds 2048 characters'); } //(log failure when debug)
                throw new Error('Query exceeds 2048 character limit'); //(throw on overly long input)
        }
        if (DEBUG) { logReturn('validateSearchQuery', true); } //(log success when debug)
        return true; //(confirm valid query)
}

// Generates normalized cache key for improved hit ratios.
// Consolidates key generation logic to keep cache operations consistent and efficient.
// NORMALIZATION STRATEGY: lowercase and trim the query so variants share the same cache entry.
// @param {string} query - The search query to normalize
// @param {number} [num] - Optional result count parameter
// @returns {string} - Normalized cache key
function createCacheKey(query, num) { //standardizes keys to maximise cache hits
        if (DEBUG) { logStart('createCacheKey', `${query}, num: ${num}`); }

        // Normalize query for better cache hit ratios
        // Case-insensitive and whitespace-trimmed keys improve efficiency
        const normalizedQuery = query.trim().toLowerCase(); //standardize spaces and case for caching
        const safeNum = normalizeNum(num); //clamp requested results to Google's allowed range
        const cacheKey = safeNum ? `${normalizedQuery}:${safeNum}` : normalizedQuery; //use clamped value in key
        
        if (DEBUG) { logReturn('createCacheKey', cacheKey); }
        return cacheKey;
}

// Fetch raw Google search items for a query.
// This abstracts repetitive request/response handling when only the raw items array is needed.
// @param {string} query - Search term to look up
// @param {number} [num] - Optional number of results to request; part of cache key
// @returns {Promise<Array>} Raw items array from Google or empty array on error
async function fetchSearchItems(query, num) { //core helper for cached API requests
        if (DEBUG) { logStart('fetchSearchItems', query); } //(start log when debug)
        validateSearchQuery(query); //(reuse validation helper)
        try {
               if (String(process.env.CODEX).trim().toLowerCase() === 'true') { //(mock path when codex true using trimmed case-insensitive check)

                       const items = []; //use static empty array without network call
                       if (DEBUG) { logReturn('fetchSearchItems', JSON.stringify(items)); } //(log mock return)
                       return items; //return mock array directly without cache or network
               }

               // Normalize num once to share between cache key and URL
               const safeNum = normalizeNum(num); //clamp value or null when invalid

               // Default to 10 when normalizeNum returns null so cache keys match default search
               const keyNum = safeNum === null ? 10 : safeNum; //use default 10 when num invalid for stable cache keys

               // Generate normalized cache key using centralized helper
               // CONSOLIDATION: Uses createCacheKey helper to ensure consistent normalization
               const cacheKey = createCacheKey(query, keyNum); //use helper with key-specific num
               let cachedItems;
               if (MAX_CACHE_SIZE !== 0) { //skip cache when disabled
                       cachedItems = cache.get(cacheKey); //lookup existing cache entry with automatic TTL handling
                       if (cachedItems !== undefined) { //treat empty arrays as valid cache results
                               if (DEBUG) { console.log('fetchSearchItems returning cached'); } //(log cache hit)
                               logReturn('fetchSearchItems', JSON.stringify(cachedItems)); //(log cached return)
                               return cachedItems; //use cached array
                       }
               }

               const url = getGoogleURL(query, safeNum); //(build search url with clamped num)

               const response = await rateLimitedRequest(url); //(perform rate limited axios request)
               const items = Array.isArray(response?.data?.items) ? response.data.items : []; //optional chaining prevents crash when response or data missing
               
               // Store in LRU cache - TTL and size limits handled automatically
               // OPTIMIZATION: LRU-cache manages expiry and eviction without manual intervention
               if (MAX_CACHE_SIZE !== 0) { cache.set(cacheKey, items); } //store results when cache enabled
                if (DEBUG) { logReturn('fetchSearchItems', JSON.stringify(items)); } //(log return value when debug)
                return items; //(return extracted items array)
        } catch (error) {
                await handleAxiosError(error, `Error in fetchSearchItems for query: ${query}`); //await async error handler
                if (DEBUG) { logReturn('fetchSearchItems', '[]'); } //(log empty array when debug)
                return []; //(gracefully return empty array)
        }
}



// Clears all cached search results.
// Exposed mainly for tests so cache state can be reset between runs.
// @returns {boolean} true when cache cleared
function clearCache() { //removes all entries from the LRU cache
        if (DEBUG) { logStart('clearCache', cache.size); } //only log when debugging
        cache.clear(); //(remove all cached entries)
        if (DEBUG) { logReturn('clearCache', true); } //log success when debugging
        return true; //(confirm cleared)
}

// performCacheCleanup - manually purge stale cache entries.
// RATIONALE: primarily for tests; LRU-cache normally evicts stale items automatically.
// @returns {boolean} true if any stale entries were removed, false otherwise
function performCacheCleanup() { //forces stale entry purge when test needs immediate cleanup
        if (DEBUG) { logStart('performCacheCleanup', cache.size); } //trace start when debugging
        const removed = cache.purgeStale(); //(evict expired entries if present)
        if (DEBUG) { logReturn('performCacheCleanup', removed); } //trace result when debugging
        return removed; //(propagate purge result)
}

// Get the top search result URL for each provided search term.
// Performs parallel searches and returns only the top URL from each response to save bandwidth.
// Promise.all minimizes total execution time while rateLimitedRequest enforces API quotas.
// @param {string[]} searchTerms - Array of search terms to process
// @returns {Promise<string[]>} Array of top result URLs (excludes null results from failed searches)
// @throws {Error} If searchTerms is not an array
async function getTopSearchResults(searchTerms) { //parallel search helper returning first link only
        if (DEBUG) { logStart('getTopSearchResults', searchTerms); } //log initial array
        // Input validation: ensure we received an array
        // This prevents runtime errors and provides clear feedback about expected input type
        if (!Array.isArray(searchTerms)) {
                throw new Error('searchTerms must be an array of strings');
        }
        
        // Remove duplicates after trimming and lower-casing
        // UPDATED STRATEGY: Normalizes terms to avoid redundant requests for "A" vs " a " vs "a"
        // while preserving the original order of the first normalized occurrence.
        const seen = new Set(); //track normalized terms for deduping
        const validSearchTerms = []; //store final sanitized terms
        for (const term of searchTerms) {
                if (typeof term !== 'string') { continue; } //skip non-strings early
                const trimmed = term.trim(); //remove leading/trailing whitespace
                if (trimmed === '') { continue; } //ignore empty after trim
                const norm = trimmed.toLowerCase(); //case-insensitive key for dedup
                if (!seen.has(norm)) { //only first occurrence allowed
                        seen.add(norm); //mark normalized term as seen
                        validSearchTerms.push(trimmed); //store trimmed term for search
                }
        }
        
        if (validSearchTerms.length === 0) {
                logWarn('No valid search terms provided'); //warn about empty input
                if (DEBUG) { logReturn('getTopSearchResults', '[]'); } //log empty return
                return []; //graceful degradation for invalid input
        }

        if (DEBUG) { logStart('getTopSearchResults', validSearchTerms); } //log sanitized term list
        
        // Use Promise.all() to execute all searches in parallel for optimal performance
        // PARALLELIZATION STRATEGY: Each search query is independent, allowing concurrent execution
        // without dependencies or shared state concerns. This provides significant performance gains:
        // - Sequential: 5 queries × 1 second each = 5 seconds total
        // - Parallel: 5 queries concurrently = 1 second total (limited by slowest query)
        // Rate limiting is still enforced per-request by Bottleneck in rateLimitedRequest()
        const searchResults = await Promise.all(validSearchTerms.map(async (query) => { //aggregate promises to run searches concurrently
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

// Perform a Google search and return formatted results.
// Returns structured objects (title, snippet, link) so consumers are insulated from raw API details.
// @param {string} query - The search query
// @returns {Promise<Array<{title: string, snippet: string, link: string}>>} Array of formatted search results
// @throws {Error} If query is not a string or is empty
async function googleSearch(query) { //wrapper returning full result objects
        if (DEBUG) { logStart('googleSearch', query); } //(start log; validation occurs in fetchSearchItems)
        const items = await fetchSearchItems(query); //reuse helper to honor caching and rate limits
        const results = items.map(item => ({ //create stable interface for consumers
                title: item.title,
                snippet: item.snippet,
                link: item.link
        }));
        if (DEBUG) { logReturn('googleSearch', results.length); } //(log number when debug)
        return results;
}

// Module exports - public API and selected internals for testing.
// Public functions: googleSearch and getTopSearchResults.
// Internal helpers are exported to facilitate unit tests.
module.exports = { //exporting ordered list of functions
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
       , sanitizeApiKey         // Sanitization helper exported for testing
       , normalizeNum           // Number normalization helper exported for reuse

       , axiosInstance          // Expose configured axios instance for tests

       , clearCache             // Helper to clear cache between tests
       , performCacheCleanup    // Manual cache purge helper primarily for tests

};
