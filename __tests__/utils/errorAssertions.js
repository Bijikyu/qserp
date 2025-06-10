/**
 * errorAssertions.js - Centralized error testing utilities for consistent validation
 * 
 * This utility consolidates the repeated error assertion patterns found across 4+ test files.
 * It provides standardized functions for testing error conditions, error messages, and
 * error reporting behavior, reducing duplication and ensuring consistent error testing.
 * 
 * CONSOLIDATION RATIONALE: Error testing patterns appear frequently across test files
 * with similar structures but slight variations. Centralizing these patterns provides:
 * 1. Consistent error assertion behavior across all tests
 * 2. Standardized error message validation
 * 3. Simplified qerrors integration testing
 * 4. Reduced boilerplate in individual test files
 */

/**
 * Asserts that a function throws an error with specific message
 * 
 * This function provides a standard way to test error throwing behavior
 * with message validation, eliminating repeated try-catch blocks in tests.
 * 
 * @param {Function} fn - Function that should throw an error
 * @param {string|RegExp} expectedMessage - Expected error message or pattern
 * @param {string} description - Optional description for assertion failure
 */
function expectToThrow(fn, expectedMessage, description = '') {
    let thrownError = null;
    
    try {
        fn();
    } catch (error) {
        thrownError = error;
    }
    
    expect(thrownError).not.toBeNull();
    
    if (typeof expectedMessage === 'string') {
        expect(thrownError.message).toBe(expectedMessage);
    } else if (expectedMessage instanceof RegExp) {
        expect(thrownError.message).toMatch(expectedMessage);
    }
    
    if (description) {
        expect(thrownError.message).toBeDefined();
    }
}

/**
 * Asserts that an async function throws an error with specific message
 * 
 * This function handles async error testing with proper await handling
 * and message validation for Promise-based functions.
 * 
 * @param {Function} asyncFn - Async function that should throw
 * @param {string|RegExp} expectedMessage - Expected error message or pattern
 * @returns {Promise} - Promise that resolves when assertion completes
 */
async function expectAsyncToThrow(asyncFn, expectedMessage) {
    let thrownError = null;
    
    try {
        await asyncFn();
    } catch (error) {
        thrownError = error;
    }
    
    expect(thrownError).not.toBeNull();
    
    if (typeof expectedMessage === 'string') {
        expect(thrownError.message).toBe(expectedMessage);
    } else if (expectedMessage instanceof RegExp) {
        expect(thrownError.message).toMatch(expectedMessage);
    }
}

/**
 * Asserts that qerrors was called with expected parameters
 * 
 * This function standardizes qerrors call validation across tests,
 * ensuring consistent error reporting verification.
 * 
 * @param {jest.MockFunction} qerrorsMock - The mocked qerrors function
 * @param {string|Error} expectedError - Expected error or error message
 * @param {string} expectedContext - Expected context string
 * @param {Object} additionalData - Optional additional data to verify
 */
function expectQerrorsCall(qerrorsMock, expectedError, expectedContext, additionalData = {}) {
    expect(qerrorsMock).toHaveBeenCalled();
    
    const calls = qerrorsMock.mock.calls;
    const lastCall = calls[calls.length - 1];
    
    // Verify error parameter
    if (typeof expectedError === 'string') {
        expect(lastCall[0].message || lastCall[0]).toMatch(expectedError);
    } else if (expectedError instanceof Error) {
        expect(lastCall[0]).toBe(expectedError);
    }
    
    // Verify context parameter
    expect(lastCall[1]).toBe(expectedContext);
    
    // Verify additional data if provided
    if (Object.keys(additionalData).length > 0) {
        expect(lastCall[2]).toMatchObject(additionalData);
    }
}

/**
 * Asserts that qerrors was not called
 * 
 * This function provides a clean way to verify that error reporting
 * was not triggered when testing successful operations.
 * 
 * @param {jest.MockFunction} qerrorsMock - The mocked qerrors function
 */
function expectNoQerrorsCall(qerrorsMock) {
    expect(qerrorsMock).not.toHaveBeenCalled();
}

/**
 * Asserts console spy behavior for error testing
 * 
 * This function validates console output during error conditions,
 * ensuring proper logging behavior during error scenarios.
 * 
 * @param {jest.SpyInstance} consoleSpy - Console method spy
 * @param {string|RegExp} expectedMessage - Expected console message
 * @param {number} callCount - Expected number of calls (default: 1)
 */
function expectConsoleOutput(consoleSpy, expectedMessage, callCount = 1) {
    expect(consoleSpy).toHaveBeenCalledTimes(callCount);
    
    if (callCount > 0) {
        const calls = consoleSpy.mock.calls;
        const lastCall = calls[calls.length - 1];
        const message = Array.isArray(lastCall) ? lastCall.join(' ') : lastCall[0];
        
        if (typeof expectedMessage === 'string') {
            expect(message).toContain(expectedMessage);
        } else if (expectedMessage instanceof RegExp) {
            expect(message).toMatch(expectedMessage);
        }
    }
}

/**
 * Creates a comprehensive error test scenario
 * 
 * This function sets up complete error testing scenarios with multiple
 * assertion points, reducing boilerplate in complex error tests.
 * 
 * @param {Object} scenario - Error test scenario configuration
 * @returns {Function} - Test function that validates the complete scenario
 */
function createErrorScenario({
    name,
    setup,
    action,
    expectedError,
    expectedContext,
    shouldCallQerrors = true,
    shouldLogToConsole = false,
    consoleSpy = null
}) {
    return async () => {
        // Setup test environment
        if (setup) {
            await setup();
        }
        
        // Execute action and capture any error
        let actualError = null;
        try {
            await action();
        } catch (error) {
            actualError = error;
        }
        
        // Validate error was thrown if expected
        if (expectedError) {
            expect(actualError).not.toBeNull();
            if (typeof expectedError === 'string') {
                expect(actualError.message).toBe(expectedError);
            } else if (expectedError instanceof RegExp) {
                expect(actualError.message).toMatch(expectedError);
            }
        }
        
        // Validate qerrors behavior
        if (shouldCallQerrors && global.qerrorsMock) {
            expectQerrorsCall(global.qerrorsMock, actualError || expectedError, expectedContext);
        } else if (!shouldCallQerrors && global.qerrorsMock) {
            expectNoQerrorsCall(global.qerrorsMock);
        }
        
        // Validate console output if specified
        if (shouldLogToConsole && consoleSpy) {
            expectConsoleOutput(consoleSpy, expectedError);
        }
    };
}

module.exports = {
    expectToThrow,
    expectAsyncToThrow,
    expectQerrorsCall,
    expectNoQerrorsCall,
    expectConsoleOutput,
    createErrorScenario
};