const axios = require('axios');
const Bottleneck = require('bottleneck'); // ADDED: Import Bottleneck for rate limiting
const apiKey = process.env.GOOGLE_API_KEY; // existing variable
const cx = process.env.GOOGLE_CX; // existing variable
// qerrors is used to handle error reporting and logging
// It requires an OPENAI_TOKEN environment variable to work properly
const qerrors = require('qerrors');
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

function handleAxiosError(error, contextMsg) { //ADDED helper for axios errors
        console.log(`handleAxiosError is running with ${contextMsg}`); //start log
        try { //start try
                if (error.response) { //check for response
                        console.error(error.response); //log response object
                } else { //no response
                        console.error(error.message); //log error message
                }
                qerrors(error, contextMsg, {contextMsg}); //central error handling
                console.log(`handleAxiosError returning true`); //final log
                return true; //confirm handled
        } catch (err) { //error in handler
                qerrors(err, 'handleAxiosError error', {contextMsg}); //log internal error
                console.log(`handleAxiosError returning false`); //fail log
                return false; //confirm failure
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
	const searchResults = await Promise.all(validSearchTerms.map(async (query) => { // Use Promise.all() to wait for all promises returned by map() to resolve
		const url = getGoogleURL(query);
		console.log(`Making request to: ${url}`); // Log the request URL
		try {
			const response = await rateLimitedRequest(url);
			const items = response.data.items;
			if (items && items.length > 0) {
				//console.log(`URL for "${query}": ${items[0].link}`);
				return items[0].link; // Return the URL directly
			} else {
				console.log(`No results for "${query}"`);
				return null; // Return null if no results
			}
                } catch (error) {
                        handleAxiosError(error, `Error in getTopSearchResults for query: ${query}`); //replaced direct logging with helper
                        return null; // Return null on error
                }
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
		const url = getGoogleURL(query);
		const response = await rateLimitedRequest(url);
		const results = response.data.items ? response.data.items.map(item => ({
			title: item.title,
			snippet: item.snippet,
			link: item.link
		})) : [];
		console.log(`googleSearch returning ${results.length} results`);
		return results;
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
	rateLimitedRequest
};
