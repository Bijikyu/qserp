
/**
 * qserp.js - Google Custom Search API module with rate limiting and error handling
 * 
 * This module provides a wrapper around Google's Custom Search API with built-in
 * rate limiting to prevent API quota exhaustion and comprehensive error handling.
 * The design prioritizes reliability and developer experience over raw performance.
 */

const axios = require('axios');
const Bottleneck = require('bottleneck'); // Rate limiting library to prevent API quota exhaustion
const apiKey = process.env.GOOGLE_API_KEY; // Google API key from environment - required for authentication
const cx = process.env.GOOGLE_CX; // Custom Search Engine ID from environment - defines search scope

// qerrors is used to handle error reporting and logging with structured context
const qerrors = require('./qerrorsLoader')(); //load qerrors via shared loader
const { logStart, logReturn } = require('./logUtils'); //standardized logging utilities
const { LRUCache } = require('lru-cache'); //cache module for search results

// Import utility functions for environment variable validation
// These utilities centralize env var handling to avoid repetitive validation code
const { throwIfMissingEnvVars, warnIfMissingEnvVars } = require('./envUtils'); //env validation utilities //(trim unused)
const { REQUIRED_VARS, OPTIONAL_VARS, OPENAI_WARN_MSG } = require('./constants'); // Centralized env var definitions with warning message

// Cache configuration using environment variables
const cacheTtl = parseInt(process.env.CACHE_TTL, 10) || 300000; //ttl in ms from env with default 5min
const cacheMax = parseInt(process.env.CACHE_MAX, 10) || 100; //max items from env with default 100
const searchCache = new LRUCache({ max: cacheMax, ttl: cacheTtl }); //instantiate LRU cache for search results

/**
 * Rate limiter configuration using Bottleneck
 * 
 * Google Custom Search API has strict rate limits (100 queries/day free tier).
 * This configuration prevents quota exhaustion while maintaining reasonable performance:
 * 
 * - reservoir: 60 requests per minute (conservative estimate based on typical usage)
 * - reservoirRefreshInterval: 60000ms (1 minute) - aligns with most API rate limit windows
 * - reservoirRefreshAmount: reset to 60 each interval - replenishes the quota
 * - maxConcurrent: 5 parallel requests - balances speed vs resource usage
 * - minTime: 200ms between requests - adds buffer to prevent burst-induced failures
 * 
 * These values are chosen to be conservative enough to work with most Google API quotas
 * while still providing reasonable performance for typical search workloads.
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
        logStart('rateLimitedRequest', safeUrl); //(avoid key leak)

        if (String(process.env.CODEX).toLowerCase() === 'true') { //(use case-insensitive true check for codex mock)
                const mockRes = { data: { items: [] } }; //(define mock axios-like response)
                console.log('rateLimitedRequest using codex mock response'); //(notify mock path taken)
                logReturn('rateLimitedRequest', JSON.stringify(mockRes)); //(mock return log)
                return mockRes; //(return mocked response)
        }

        // Use limiter.schedule to automatically handle rate limiting
        // This returns a promise that resolves when the request is allowed to proceed
        const res = await limiter.schedule(() =>
                axios.get(url, {
                        timeout: 10000, // 10 second timeout to prevent hanging requests
                        headers: {
                                // User-Agent header mimics Chrome browser to avoid bot detection
                                // Some APIs may block requests with missing or obvious bot user agents
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
                        }
                })
        );
        logReturn('rateLimitedRequest', JSON.stringify(res.data)); //(log real response)
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
function getGoogleURL(query) {
	// encodeURIComponent handles special characters, spaces, and Unicode properly
	// This prevents URL malformation and ensures the query is interpreted correctly by Google
	return `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}`;
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
        logStart('handleAxiosError', contextMsg); //debug log for error handling flow
	
	try {
		// Check if error has a response (HTTP error) vs no response (network error)
		if (error.response) {
			// HTTP error: server responded with error status code
			// Log the full response object which contains status, headers, and data
			console.error(error.response);
		} else {
			// Network error: request never reached server or no response received
			// Log just the error message as there's no response to examine
			console.error(error.message);
		}
		
		// Use qerrors for structured error logging with context
		// This enables better error tracking and analysis across the application
		qerrors(error, contextMsg, {contextMsg});
		
                logReturn('handleAxiosError', true); // Confirm successful error handling
                return true; // Indicate error was handled successfully
	} catch (err) {
                // Error occurred within the error handler itself
                // Attempt logging the secondary error and keep flow stable
                try { qerrors(err, 'handleAxiosError error', {contextMsg}); } //log secondary error //(attempt qerrors)
                catch (qe) { console.error(qe); } //fallback logging //(prevent crash)
                logReturn('handleAxiosError', false); // Indicate handler failure
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
        logStart('validateSearchQuery', query); //(start log of validation)
        if (typeof query !== 'string' || query.trim() === '') { //(check for non-empty string)
                console.log('validateSearchQuery throwing Query must be a non-empty string'); //(log failure)
                throw new Error('Query must be a non-empty string'); //(throw on invalid input)
        }
        logReturn('validateSearchQuery', true); //(log successful validation)
        return true; //(confirm valid query)
}

/**
 * Fetch raw Google search items for a query
 *
 * This helper abstracts the repetitive request/response handling when
 * only the raw items array from Google is needed by other functions.
 *
 * @param {string} query - Search term to look up
 * @returns {Promise<Array>} Raw items array from Google or empty array on error
 */
async function fetchSearchItems(query) {
        logStart('fetchSearchItems', query); //(start log of function execution)
        validateSearchQuery(query); //(reuse validation helper)
        try {
                const cached = searchCache.get(query); //check cache for existing items
                if (cached) {
                        logReturn('fetchSearchItems', JSON.stringify(cached)); //log cached return
                        return cached; //return cached items without request
                }
                const url = getGoogleURL(query); //(build search url)
                const response = await rateLimitedRequest(url); //(perform rate limited axios request)
                const items = response.data.items || []; //(extract items array if present)
                if (items.length > 0) { searchCache.set(query, items); } //store successful items in cache
                logReturn('fetchSearchItems', JSON.stringify(items)); //(log return value)
                return items; //(return extracted items array)
        } catch (error) {
                handleAxiosError(error, `Error in fetchSearchItems for query: ${query}`); //(handle and log any axios errors)
                logReturn('fetchSearchItems', '[]'); //(log empty array due to failure)
                return []; //(gracefully return empty array)
        }
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
	
	// Filter out invalid entries (non-strings, empty strings, whitespace-only strings)
	// This defensive programming prevents API calls with invalid queries that would fail anyway
	const validSearchTerms = searchTerms.filter(term => typeof term === 'string' && term.trim() !== '');
	
	if (validSearchTerms.length === 0) {
		console.warn('No valid search terms provided');
		return []; // Return empty array rather than failing - graceful degradation
	}
	
        logStart('getTopSearchResults', validSearchTerms); //(log start with valid terms)
	
	// Use Promise.all() to execute all searches in parallel
	// This is much faster than sequential execution, especially with rate limiting
	// Each search is independent, so parallel execution is safe and beneficial
        const searchResults = await Promise.all(validSearchTerms.map(async (query) => {
                const items = await fetchSearchItems(query); //(reuse helper for request)
                if (items.length > 0) { //(check for available results)
                        return items[0].link; //(return first result link)
                }
                console.log(`No results for "${query}"`); //(log when query yields nothing)
                return null; //(indicate absence of result)
        }));
	
	// Filter out null values (failed searches or no results)
	// This ensures the returned array contains only valid URLs
        const validUrls = searchResults.filter(url => url !== null);
        logReturn('getTopSearchResults', validUrls); //(log return array of urls)
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
        validateSearchQuery(query); //(ensure non-empty string input)
        logStart('googleSearch', query); //(start log of search)
        const items = await fetchSearchItems(query); //(perform search via helper)
        const results = items.map(item => ({ //(map items to simplified objects)
                title: item.title,
                snippet: item.snippet,
                link: item.link
        }));
        logReturn('googleSearch', results.length); //(log number of results)
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
};
