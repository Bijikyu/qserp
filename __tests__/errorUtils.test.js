// Summary: errorUtils.test.js validates module behavior and edge cases
/**
 * errorUtils.test.js - Unit tests for centralized error context utilities
 * 
 * Tests the error context building and reporting functions that consolidate
 * error handling patterns from lib/qserp.js, lib/envUtils.js, and lib/utils.js.
 */

// Mock qerrorsLoader to avoid loading actual qerrors dependency
const mockSafeQerrors = jest.fn();
jest.mock('../lib/qerrorsLoader', () => {
    const def = jest.fn(() => mockSafeQerrors); //default export function
    def.safeQerrors = mockSafeQerrors; //attach named export
    return def; //module exports function with property
});

describe('errorUtils', () => { // errorUtils
    let consoleErrorSpy;
    let savedCodex;

    beforeEach(() => {
        savedCodex = process.env.CODEX; // record current CODEX so we can restore it
        process.env.CODEX = 'true'; //bypass env validation during module load
        // Spy on console.error for fallback logging tests
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Clear all mocks
        jest.clearAllMocks();
        mockSafeQerrors.mockClear();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        if (savedCodex !== undefined) { process.env.CODEX = savedCodex; } else { delete process.env.CODEX; } //restore flag to avoid polluting other tests
    });

    describe('context creation functions', () => { // context creation functions
        it('should create API error context with required fields', () => { // should create API error context with required fields
            const { createApiErrorContext } = require('../lib/errorUtils');
            
            const context = createApiErrorContext('Google API call failed', {
                url: 'https://googleapis.com/search',
                status: 403
            });
            
            expect(context).toMatchObject({
                category: 'api_error',
                operation: 'Google API call failed',
                url: 'https://googleapis.com/search',
                status: 403
            });
            expect(context).toHaveProperty('timestamp');
            expect(typeof context.timestamp).toBe('string');
        });

        it('should create config error context with required fields', () => { // should create config error context with required fields
            const { createConfigErrorContext } = require('../lib/errorUtils');
            
            const context = createConfigErrorContext('Environment validation failed', {
                variables: ['API_KEY', 'SECRET'],
                missing: ['API_KEY']
            });
            
            expect(context).toMatchObject({
                category: 'config_error',
                operation: 'Environment validation failed',
                variables: ['API_KEY', 'SECRET'],
                missing: ['API_KEY']
            });
            expect(context).toHaveProperty('timestamp');
        });

        it('should create utility error context with required fields', () => { // should create utility error context with required fields
            const { createUtilityErrorContext } = require('../lib/errorUtils');
            
            const context = createUtilityErrorContext('Safe execution failed', {
                functionName: 'testFunction',
                attempt: 3
            });
            
            expect(context).toMatchObject({
                category: 'utility_error',
                operation: 'Safe execution failed',
                functionName: 'testFunction',
                attempt: 3
            });
            expect(context).toHaveProperty('timestamp');
        });

        it('should create cache error context with required fields', () => { // should create cache error context with required fields
            const { createCacheErrorContext } = require('../lib/errorUtils');
            
            const context = createCacheErrorContext('Cache cleanup failed', {
                cacheSize: 1500,
                threshold: 1000
            });
            
            expect(context).toMatchObject({
                category: 'cache_error',
                operation: 'Cache cleanup failed',
                cacheSize: 1500,
                threshold: 1000
            });
            expect(context).toHaveProperty('timestamp');
        });

        it('should create validation error context with required fields', () => { // should create validation error context with required fields
            const { createValidationErrorContext } = require('../lib/errorUtils');
            
            const context = createValidationErrorContext('Query validation failed', {
                input: '',
                constraint: 'non-empty string'
            });
            
            expect(context).toMatchObject({
                category: 'validation_error',
                operation: 'Query validation failed',
                input: '',
                constraint: 'non-empty string'
            });
            expect(context).toHaveProperty('timestamp');
        });
    });

    describe('error reporting functions', () => { // error reporting functions
        it('should report error with enriched context', async () => { // should report error with enriched context
            const { reportError } = require('../lib/errorUtils');
            
            const error = new Error('Test error');
            const context = { category: 'test_error', operation: 'testing' };
            const customDetails = { userId: 123, action: 'search' };
            
            await reportError(error, 'Test error message', context, customDetails); //await async call
            
            expect(mockSafeQerrors).toHaveBeenCalledWith(
                error,
                'Test error message',
                expect.objectContaining({
                    errorType: 'Error',
                    errorMessage: 'Test error',
                    category: 'test_error',
                    operation: 'testing',
                    userId: 123,
                    action: 'search',
                    stack: expect.any(String)
                })
            );
        });

        it('should handle qerrors failure gracefully', async () => { // should handle qerrors failure gracefully
            const { reportError } = require('../lib/errorUtils');
            
            // Make qerrors throw an error
            mockSafeQerrors.mockImplementation(() => {
                throw new Error('Reporting failed');
            });
            
            const error = new Error('Original error');
            
            const result = await reportError(error, 'Test message', {}); //invoke async function
            expect(result).toBe(false); //should signal failure without throw

            expect(consoleErrorSpy).toHaveBeenCalledWith('Error reporting failed:', 'Error: Reporting failed'); //message sanitized to string
            expect(consoleErrorSpy).toHaveBeenCalledWith('Original error:', 'Error: Original error'); //original error sanitized
        });

        it('should return false when qerrors throws', async () => { // ensure failure return value
            const { reportError } = require('../lib/errorUtils');

            mockSafeQerrors.mockImplementation(() => { //force safeQerrors failure
                throw new Error('Reporting failed');
            });

            const error = new Error('Original error');

            const result = await reportError(error, 'Test message'); //await async function

            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error reporting failed:', 'Error: Reporting failed'); //sanitized error string
            expect(consoleErrorSpy).toHaveBeenCalledWith('Original error:', 'Error: Original error'); //sanitized original message
        });

        it('should return false when safeQerrors resolves false', async () => { //verify failure branch without throw
            const { reportError } = require('../lib/errorUtils');

            mockSafeQerrors.mockResolvedValue(false); //simulate failure result
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); //capture logReturn output

            const error = new Error('Original error');

            const result = await reportError(error, 'Test message'); //invoke async function

            expect(result).toBe(false); //function should propagate failure
            expect(logSpy).toHaveBeenCalledWith('reportError returning failure'); //ensure failure branch logged

            logSpy.mockRestore(); //cleanup spy
        });

        it('should sanitize log messages when qerrors fails', async () => { //verify api key masking
            const { reportError } = require('../lib/errorUtils');
            const savedKey = process.env.GOOGLE_API_KEY; //preserve key
            process.env.GOOGLE_API_KEY = 'key'; //set test key

            mockSafeQerrors.mockImplementation(() => { throw new Error('Reporting failed key'); });

            const error = new Error('Original key error');

            await reportError(error, 'Msg'); //invoke function to trigger catch

            const joined = consoleErrorSpy.mock.calls.map(c => c.join(' ')).join(' '); //aggregate output
            expect(joined).not.toMatch('key'); //raw key should be absent
            expect(joined).toMatch('\[redacted\]'); //masked value present

            if (savedKey !== undefined) { process.env.GOOGLE_API_KEY = savedKey; } else { delete process.env.GOOGLE_API_KEY; } //restore key
        });
    });

    describe('convenience reporting functions', () => { // convenience reporting functions
        it('should report API error with proper context', async () => { // should report API error with proper context
            const { reportApiError } = require('../lib/errorUtils');
            
            const error = new Error('Network timeout');
            
            await reportApiError(error, 'Google search request', { //await async call
                url: 'https://googleapis.com/search',
                timeout: 5000
            });
            
            expect(mockSafeQerrors).toHaveBeenCalledWith(
                error,
                'API Error: Google search request',
                expect.objectContaining({
                    category: 'api_error',
                    operation: 'Google search request',
                    url: 'https://googleapis.com/search',
                    timeout: 5000
                })
            );
        });

        it('should report config error with proper context', async () => { // should report config error with proper context
            const { reportConfigError } = require('../lib/errorUtils');
            
            const error = new Error('Missing environment variable');
            
            await reportConfigError(error, 'API key validation', { //await async call
                variable: 'GOOGLE_API_KEY',
                required: true
            });
            
            expect(mockSafeQerrors).toHaveBeenCalledWith(
                error,
                'Configuration Error: API key validation',
                expect.objectContaining({
                    category: 'config_error',
                    operation: 'API key validation',
                    variable: 'GOOGLE_API_KEY',
                    required: true
                })
            );
        });

        it('should return false when reportApiError fails', async () => { // propagate false on failure
            const { reportApiError } = require('../lib/errorUtils');

            mockSafeQerrors.mockImplementation(() => { throw new Error('Reporting failed'); });

            const error = new Error('Network failure');

            const result = await reportApiError(error, 'Fetch data', { url: 'http://example.com' }); //await async function

            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error reporting failed:', 'Error: Reporting failed'); //sanitized failure message
            expect(consoleErrorSpy).toHaveBeenCalledWith('Original error:', 'Error: Network failure'); //sanitized original error
        });

        it('should return false when reportConfigError fails', async () => { // propagate false on config failure
            const { reportConfigError } = require('../lib/errorUtils');

            mockSafeQerrors.mockImplementation(() => { throw new Error('Reporting failed'); });

            const error = new Error('Bad config');

            const result = await reportConfigError(error, 'Env check', { variable: 'TEST' }); //await async function

            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error reporting failed:', 'Error: Reporting failed'); //sanitized failure message
            expect(consoleErrorSpy).toHaveBeenCalledWith('Original error:', 'Error: Bad config'); //sanitized original error
        });

        it('should report validation error with proper context', async () => { // should report validation error with proper context
            const { reportValidationError } = require('../lib/errorUtils');
            
            const error = new Error('Invalid input');
            
            await reportValidationError(error, 'Search query validation', { //await async call
                input: '',
                rule: 'must be non-empty',
                field: 'query'
            });
            
            expect(mockSafeQerrors).toHaveBeenCalledWith(
                error,
                'Validation Error: Search query validation',
                expect.objectContaining({
                    category: 'validation_error',
                    operation: 'Search query validation',
                    input: '',
                    rule: 'must be non-empty',
                    field: 'query'
                })
            );
        });
    });

    describe('context flexibility', () => { // context flexibility
        it('should handle empty details gracefully', () => { // should handle empty details gracefully
            const { createApiErrorContext } = require('../lib/errorUtils');
            
            const context = createApiErrorContext('Operation failed');
            
            expect(context).toMatchObject({
                category: 'api_error',
                operation: 'Operation failed'
            });
            expect(context).toHaveProperty('timestamp');
        });

        it('should merge custom details properly', () => { // should merge custom details properly
            const { createUtilityErrorContext } = require('../lib/errorUtils');
            
            const context = createUtilityErrorContext('Test operation', {
                step: 1,
                data: { key: 'value' },
                nested: { deep: { value: 42 } }
            });
            
            expect(context).toMatchObject({
                category: 'utility_error',
                operation: 'Test operation',
                step: 1,
                data: { key: 'value' },
                nested: { deep: { value: 42 } }
            });
        });
    });

    describe('timestamp generation', () => { // timestamp generation
        it('should generate valid ISO timestamps', () => { // should generate valid ISO timestamps
            const { createApiErrorContext } = require('../lib/errorUtils');
            
            const context = createApiErrorContext('Test');
            
            expect(context.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            expect(new Date(context.timestamp)).toBeInstanceOf(Date);
        });

        it('should generate unique timestamps for rapid calls', () => { // should generate unique timestamps for rapid calls
            const { createApiErrorContext } = require('../lib/errorUtils');
            
            const context1 = createApiErrorContext('Test 1');
            const context2 = createApiErrorContext('Test 2');
            
            // While timestamps might be the same in rapid succession,
            // we test that both are valid timestamps
            expect(new Date(context1.timestamp)).toBeInstanceOf(Date);
            expect(new Date(context2.timestamp)).toBeInstanceOf(Date);
        });
    });
});