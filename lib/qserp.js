
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
// It requires an OPENAI_TOKEN environment variable to work properly for AI-enhanced error analysis
const qerrors = require('qerrors');

// Import utility functions for environment variable validation
// These utilities centralize env var handling to avoid repetitive validation code
const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('./envUtils');
const { REQUIRED_VARS, OPTIONAL_VARS } = require('./constants'); // Centralized env var definitions

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
        console.log(`rateLimitedRequest is running with ${url}`); //(function entry log)

        if (process.env.CODEX === 'True') { //(check if running on codex)
                const mockRes = { data: { items: [] } }; //(define mock axios-like response)
                console.log('rateLimitedRequest using codex mock response'); //(notify mock path taken)
                console.log(`rateLimitedRequest returning ${JSON.stringify(mockRes)}`); //(mock return log)
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
        console.log(`rateLimitedRequest returning ${JSON.stringify(res.data)}`); //(log real response)
        return res; //(return axios response)
}

// Validate required environment variables at module load time
// This ensures the module fails fast if critical configuration is missing
// rather than failing later during actual API calls
throwIfMissingEnvVars(REQUIRED_VARS); // Will throw Error if API key or CX missing

// Warn about optional environment variables that enhance functionality
// OPENAI_TOKEN is used by qerrors for enhanced error analysis but isn't strictly required
warnIfMissingEnvVars(OPTIONAL_VARS, 'OPENAI_TOKEN environment variable is not set. This is required by the qerrors dependency for error logging.');

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
	console.log(`handleAxiosError is running with ${contextMsg}`); // Debug log for error handling flow
	
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
		
		console.log(`handleAxiosError returning true`); // Confirm successful error handling
		return true; // Indicate error was handled successfully
	} catch (err) {
		// Error occurred within the error handler itself
		// This is a critical failure that needs separate logging
		qerrors(err, 'handleAxiosError error', {contextMsg});
		console.log(`handleAxiosError returning false`); // Indicate handler failure
		return false; // Indicate error handling failed
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
	
	console.log(`getTopSearchResults is running for search terms: ${validSearchTerms}`);
	
	// Use Promise.all() to execute all searches in parallel
	// This is much faster than sequential execution, especially with rate limiting
	// Each search is independent, so parallel execution is safe and beneficial
	const searchResults = await Promise.all(validSearchTerms.map(async (query) => {
		const url = getGoogleURL(query);
		console.log(`Making request to: ${url}`); // Debug log for request tracking
		
		try {
			const response = await rateLimitedRequest(url);
			const items = response.data.items; // Google API returns results in 'items' array
			
			if (items && items.length > 0) {
				// Return the URL of the first (top) result
				// Google orders results by relevance, so first result is most relevant
				return items[0].link;
			} else {
				// No results found for this query
				// This can happen with very specific or misspelled queries
				console.log(`No results for "${query}"`);
				return null; // Use null to indicate no result (will be filtered out)
			}
		} catch (error) {
			// Use centralized error handling for consistency
			// Continue processing other queries even if one fails
			handleAxiosError(error, `Error in getTopSearchResults for query: ${query}`);
			return null; // Return null on error so other results can still be processed
		}
	}));
	
	// Filter out null values (failed searches or no results)
	// This ensures the returned array contains only valid URLs
	const validUrls = searchResults.filter(url => url !== null);
	console.log(`Final URLs: ${validUrls}`);
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
	// Input validation: ensure query is a non-empty string
	// Empty queries would waste API quota and return meaningless results
	if (typeof query !== 'string' || query.trim() === '') {
		throw new Error('Query must be a non-empty string');
	}
	
	console.log(`googleSearch is running with query: ${query}`);
	
	try {
		const url = getGoogleURL(query);
		const response = await rateLimitedRequest(url);
		
		// Transform Google API response into simplified, consistent format
		// Extract only the fields most commonly needed by applications
		const results = response.data.items ? response.data.items.map(item => ({
			title: item.title,     // Page title
			snippet: item.snippet, // Brief description/excerpt
			link: item.link        // URL to the page
		})) : []; // Return empty array if no results rather than undefined
		
		console.log(`googleSearch returning ${results.length} results`);
		return results;
	} catch (error) {
		// Use centralized error handling for consistency
		handleAxiosError(error, `Error in googleSearch for query: ${query}`);
		return []; // Return empty array on error for graceful degradation
	}
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
	
	// Internal functions exported for testing
	rateLimitedRequest,     // HTTP request wrapper with rate limiting
	getGoogleURL,           // URL builder for Google API
	handleAxiosError        // Centralized error handler
};
