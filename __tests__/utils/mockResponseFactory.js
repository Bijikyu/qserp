/**
 * mockResponseFactory.js - Centralized mock response creation for Google API testing
 * 
 * This utility consolidates the repeated mock response patterns found across 6+ test files.
 * It provides standardized mock data structures that match Google Custom Search API
 * responses, ensuring consistent test data and reducing duplication.
 * 
 * CONSOLIDATION RATIONALE: Mock response creation follows similar patterns across
 * multiple test files with slight variations. Centralizing this provides:
 * 1. Consistent mock data structure across all tests
 * 2. Easy maintenance of mock response format
 * 3. Reduced code duplication in test files
 * 4. Single point of truth for API response structure
 */

/**
 * Creates a standard Google Custom Search API response mock
 * 
 * This function generates mock responses that match the actual Google API structure,
 * ensuring tests accurately reflect real API behavior without requiring live API calls.
 * 
 * @param {Array} items - Array of search result items to include in response
 * @param {Object} options - Additional response configuration
 * @returns {Object} - Complete mock response object
 */
function createGoogleSearchResponse(items = [], options = {}) {
    const {
        kind = 'customsearch#search',
        searchInformation = {
            searchTime: 0.123456,
            formattedSearchTime: '0.12',
            totalResults: '123456',
            formattedTotalResults: '123,456'
        }
    } = options;

    return {
        kind,
        items,
        searchInformation
    };
}

/**
 * Creates a single search result item with standard structure
 * 
 * This function generates individual search result items that match Google's
 * response format, providing realistic test data with customizable properties.
 * 
 * @param {Object} overrides - Properties to override in the default item
 * @returns {Object} - Single search result item
 */
function createSearchItem(overrides = {}) {
    const defaultItem = {
        kind: 'customsearch#result',
        title: 'Test Result Title',
        snippet: 'This is a test result snippet that describes the content.',
        link: 'https://example.com/test-result',
        displayLink: 'example.com',
        formattedUrl: 'https://example.com/test-result'
    };

    return { ...defaultItem, ...overrides };
}

/**
 * Creates multiple search items with sequential numbering
 * 
 * This helper generates multiple search items with unique identifiers,
 * useful for testing pagination, result counting, and list processing.
 * 
 * @param {number} count - Number of items to create
 * @param {string} baseTitle - Base title for items (will be numbered)
 * @param {string} baseUrl - Base URL for items (will be numbered)
 * @returns {Array} - Array of search result items
 */
function createMultipleItems(count = 3, baseTitle = 'Test Result', baseUrl = 'https://example.com/result') {
    return Array.from({ length: count }, (_, index) => { //create predictable sequence of items
        const num = index + 1; //use 1-based numbering for readability
        return createSearchItem({
            title: `${baseTitle} ${num}`,
            snippet: `This is test result number ${num} with sample content.`,
            link: `${baseUrl}-${num}`,
            displayLink: `example.com/result-${num}`,
            formattedUrl: `${baseUrl}-${num}`
        });
    }); //return array of generated items
}

/**
 * Creates an empty response for testing no-results scenarios
 * 
 * This function generates responses that match Google's behavior when
 * no search results are found, ensuring tests handle empty states correctly.
 * 
 * @returns {Object} - Empty search response
 */
function createEmptyResponse() {
    return createGoogleSearchResponse([], {
        searchInformation: {
            searchTime: 0.123456,
            formattedSearchTime: '0.12',
            totalResults: '0',
            formattedTotalResults: '0'
        }
    });
}

/**
 * Creates an error response for testing API failure scenarios
 * 
 * This function generates error responses that match Google's error format,
 * enabling tests to verify proper error handling behavior.
 * 
 * @param {number} code - HTTP error code
 * @param {string} message - Error message
 * @returns {Object} - Error response object
 */
function createErrorResponse(code = 400, message = 'Bad Request') {
    return {
        error: {
            code,
            message,
            errors: [{
                domain: 'global',
                reason: 'badRequest',
                message
            }]
        }
    };
}

/**
 * Creates mock responses for batch testing scenarios
 * 
 * This function generates multiple different responses for testing
 * batch operations and parallel processing scenarios.
 * 
 * @param {Array} queries - Array of query strings
 * @returns {Array} - Array of mock responses corresponding to queries
 */
function createBatchResponses(queries = ['query1', 'query2', 'query3']) {
    return queries.map(query => { //produce response per query for parallel tests
        const items = createMultipleItems(1, `Result for ${query}`, `https://example.com/${query}`);
        return createGoogleSearchResponse(items); //each item uses createMultipleItems helper
    }); //result array mirrors input order
}

/**
 * Mock response presets for common testing scenarios
 * 
 * These presets provide ready-to-use mock responses for the most common
 * testing scenarios, reducing setup time in individual test files.
 */
const MOCK_PRESETS = {
    // Single result response
    SINGLE_RESULT: createGoogleSearchResponse([
        createSearchItem({
            title: 'Single Test Result',
            snippet: 'This is the only result for this test query.',
            link: 'https://example.com/single'
        })
    ]),

    // Multiple results response
    MULTIPLE_RESULTS: createGoogleSearchResponse(createMultipleItems(5)),

    // Empty results response
    EMPTY_RESULTS: createEmptyResponse(),

    // API error responses
    QUOTA_EXCEEDED: createErrorResponse(403, 'Quota exceeded'),
    INVALID_KEY: createErrorResponse(400, 'Invalid API key'),
    NOT_FOUND: createErrorResponse(404, 'Not found')
};

module.exports = {
    createGoogleSearchResponse,
    createSearchItem,
    createMultipleItems,
    createEmptyResponse,
    createErrorResponse,
    createBatchResponses,
    MOCK_PRESETS
};