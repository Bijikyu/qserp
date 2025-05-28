const axios = require('axios');
const Bottleneck = require('bottleneck'); // ADDED: Import Bottleneck for rate limiting
const apiKey = process.env.GOOGLE_API_KEY; // existing variable
const cx = process.env.GOOGLE_CX; // existing variable
// qerrors is used to handle error reporting and logging
// It requires an OPENAI_TOKEN environment variable to work properly
const qerrors = require('qerrors');
const { safeRun } = require('./utils'); //import shared safeRun utility
const { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } = require('./envUtils'); // import env utils
const { REQUIRED_VARS, OPTIONAL_VARS } = require('./constants'); //import env constants


// ADDED: Create a Bottleneck limiter with desired constraints:
// - reservoir: maximum 60 requests per minute
// - reservoirRefreshInterval: refresh every 60000ms (1 minute)
// - reservoirRefreshAmount: reset to 60 each interval
// - maxConcurrent: up to 5 concurrent requests (parallel execution)
// - minTime: at least 200ms between requests
const limiter = new Bottleneck({
	reservoir: 60,
	reservoirRefreshAmount: 60,
	reservoirRefreshInterval: 60000,
	maxConcurrent: 5,  // Allow more concurrent requests
	minTime: 200
});

/**
 * Makes a rate-limited HTTP request using Bottleneck.
 * @param {string} url - The URL to request
 * @returns {Promise<Object>} - The axios response object
 * @private
 */
const rateLimitedRequest = async (url) => {
	// ADDED: Use limiter.schedule to automatically handle rate limiting and include a proper User-Agent header.
	return limiter.schedule(() =>
		axios.get(url, {
			timeout: 10000,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
			}
		})
	);
};

// Validate required environment variables using util
throwIfMissingEnvVars(REQUIRED_VARS); //ensure API key and CX exist
warnIfMissingEnvVars(OPTIONAL_VARS, 'OPENAI_TOKEN environment variable is not set. This is required by the qerrors dependency for error logging.'); //warn if optional token missing


/**
 * Generates a Google Custom Search API URL
 * @param {string} query - The search query
 * @returns {string} The formatted Google search URL with API key and CX parameters
 * @throws {Error} If query is not properly URL encoded
 * @private
 */
function getGoogleURL(query) {
        return `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}`;
}

function handleAxiosError(error, contextMsg) { //central axios error handler
        console.log(`handleAxiosError is running with ${contextMsg}`); //start log
        const res = safeRun('handleAxiosError', () => { //use safeRun wrapper
                if (error.response) { //check for response
                        console.error(error.response); //log response object
                } else { //no response
                        console.error(error.message); //log error message
                }
                qerrors(error, contextMsg, {contextMsg}); //central error handling
                return true; //confirm handled
        }, false, {contextMsg});
        console.log(`handleAxiosError returning ${res}`); //final log
        return res; //return result
}

async function fetchSearchItems(query) { //pull raw items from google
        console.log(`fetchSearchItems is running with query: ${query}`); //start log
        try { //run request
                const url = getGoogleURL(query); //build request url
                const response = await rateLimitedRequest(url); //perform limited request
                const items = response.data.items || []; //normalize items array
                console.log(`fetchSearchItems returning ${items.length} items`); //final log
                return items; //return raw items
        } catch (error) { //handle error
                handleAxiosError(error, `Error in fetchSearchItems for query: ${query}`); //delegated error handling
                return []; //fallback to empty array
        }
}

/**
 * Get the top search result URL for each provided search term
 * @param {string[]} searchTerms - Array of search terms
 * @returns {Promise<string[]>} Array of top result URLs (null for failed searches)
 * @throws {Error} If searchTerms is not an array
 */
async function getTopSearchResults(searchTerms) {
	// Input validation
	if (!Array.isArray(searchTerms)) {
		throw new Error('searchTerms must be an array of strings');
	}
	
	// Filter out any non-string or empty values
	const validSearchTerms = searchTerms.filter(term => typeof term === 'string' && term.trim() !== '');
	if (validSearchTerms.length === 0) {
		console.warn('No valid search terms provided');
		return [];
	}
	
	console.log(`getTopSearchResults is running for search terms: ${validSearchTerms}`);
        const searchResults = await Promise.all(validSearchTerms.map(async (query) => {
                const items = await fetchSearchItems(query); //pull items via helper
                if (items.length > 0) { //return first link when available
                        return items[0].link;
                }
                console.log(`No results for "${query}"`); //log no results
                return null; //fallback when empty
        }));
	const validUrls = searchResults.filter(url => url !== null); // Filter out any null values if there were errors or no results
	console.log(`Final URLs: ${validUrls}`);
	return validUrls; // Return an array of strings (URLs)
}

/**
 * Perform a Google search and return formatted results
 * @param {string} query - The search query
 * @returns {Promise<Array<{title: string, snippet: string, link: string}>>} Array of search results
 * @throws {Error} If query is not a string or is empty
 */
async function googleSearch(query) {
	// Input validation
	if (typeof query !== 'string' || query.trim() === '') {
		throw new Error('Query must be a non-empty string');
	}
	
        console.log(`googleSearch is running with query: ${query}`);
        try {
                const items = await fetchSearchItems(query); //reuse helper for request
                const results = items.map(item => ({ //format returned items
                        title: item.title,
                        snippet: item.snippet,
                        link: item.link
                }));
                console.log(`googleSearch returning ${results.length} results`); //log result count
                return results; //return formatted results
        } catch (error) {
                handleAxiosError(error, `Error in googleSearch for query: ${query}`); //replaced direct logging with helper
                return []; //error fallback
        }
}


/**
 * @module qserp
 * @description Google Custom Search module for Node.js
 * @exports {Object} qserp - Contains search-related functions
 * @property {Function} googleSearch - Function to perform a Google search
 * @property {Function} getTopSearchResults - Function to get top search results for multiple queries
 */
module.exports = {
        googleSearch,
        getTopSearchResults,
        rateLimitedRequest,
        getGoogleURL, //added export so tests can access this & returns search url
        handleAxiosError, //added export so tests can access this & handle errors
        fetchSearchItems //added export so tests can access this new helper
};
