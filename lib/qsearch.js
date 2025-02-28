const axios = require('axios');
const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.GOOGLE_CX;
const qerrors = require('qerrors');

// Validate required environment variables
if (!apiKey) {
  throw new Error('GOOGLE_API_KEY environment variable is required');
}
if (!cx) {
  throw new Error('GOOGLE_CX environment variable is required');
}


function getGoogleURL(query) {
	return `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}`;
}
async function getTopSearchResults(searchTerms) { // searchTerms is an array of strings
	console.log(`getTopSearchResults is running for search terms: ${searchTerms}`);
	const searchResults = await Promise.all(searchTerms.map(async (query) => { // Use Promise.all() to wait for all promises returned by map() to resolve
		const url = getGoogleURL(query);
		console.log(`Making request to: ${url}`); // Log the request URL
		try {
			const response = await axios.get(url);
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
			return null; // Return null on error
		}
	}));
	const validUrls = searchResults.filter(url => url !== null); // Filter out any null values if there were errors or no results
	console.log(`Final URLs: ${validUrls}`);
	return validUrls; // Return an array of strings (URLs)
}
async function googleSearch(query) {
	console.log(`googleSearch is running with query: ${query}`);
	try {
		const url = getGoogleURL(query);
		const response = await axios.get(url);
		const results = response.data.items ? response.data.items.map(item => ({
			title: item.title,
			snippet: item.snippet,
			link: item.link
		})) : [];
		console.log(`googleSearch returning ${results.length} results`);
		return results;
	} catch (error) {
		qerrors(error, 'Error in googleSearch', null, null, null);
		return [];
	}
}


module.exports = {
	googleSearch,
	getTopSearchResults
};