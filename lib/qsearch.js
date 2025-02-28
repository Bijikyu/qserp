const axios = require('axios');
const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.GOOGLE_CX;
const qerrors = require('qerrors');

// Rate limiting configuration
const RATE_LIMIT = {
  MIN_INTERVAL: 200, // milliseconds between requests
  MAX_REQUESTS_PER_MINUTE: 60, // Google API typically allows 100 queries per 100 seconds
  requestCount: 0,
  resetTime: Date.now() + 60000,
  lastRequestTime: 0
};

/**
 * Makes a rate-limited HTTP request to avoid API quota issues
 * @param {string} url - The URL to request
 * @returns {Promise<Object>} - The axios response object
 * @private
 */
const rateLimitedRequest = async (url) => {
  const now = Date.now();
  
  // Reset counter if minute has passed
  if (now > RATE_LIMIT.resetTime) {
    RATE_LIMIT.requestCount = 0;
    RATE_LIMIT.resetTime = now + 60000;
  }
  
  // Check if we've hit the per-minute limit
  if (RATE_LIMIT.requestCount >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
    const waitTime = RATE_LIMIT.resetTime - now;
    console.warn(`Rate limit reached. Waiting ${waitTime}ms before next request.`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    // Reset after waiting
    RATE_LIMIT.requestCount = 0;
    RATE_LIMIT.resetTime = Date.now() + 60000;
  }
  
  // Enforce minimum interval between requests
  const timeElapsed = now - RATE_LIMIT.lastRequestTime;
  if (timeElapsed < RATE_LIMIT.MIN_INTERVAL) {
    const delay = RATE_LIMIT.MIN_INTERVAL - timeElapsed;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // Update request tracking
  RATE_LIMIT.lastRequestTime = Date.now();
  RATE_LIMIT.requestCount++;
  
  return axios.get(url);
};

// Validate required environment variables
if (!apiKey) {
  throw new Error('GOOGLE_API_KEY environment variable is required');
}
if (!cx) {
  throw new Error('GOOGLE_CX environment variable is required');
}


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
			if (error.response) {
					console.error(`Error fetching search results for query "${query}": ${error.response.status} - ${error.response.data.error.message}`);
			} else {
					console.error(`Error fetching search results for query "${query}":`, error.message);
			}
			// Use qerrors module for proper error handling
			qerrors(error, `Error in getTopSearchResults for query: ${query}`, null, null, null);
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
		if (error.response) {
			console.error(`Google API Error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
		} else {
			console.error(`Error in googleSearch: ${error.message}`);
		}
		qerrors(error, `Error in googleSearch for query: ${query}`, null, null, null);
		return [];
	}
}


module.exports = {
	googleSearch,
	getTopSearchResults
};