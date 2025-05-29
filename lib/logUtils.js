
/**
 * logUtils.js - Standardized logging utilities for consistent debug output
 * 
 * This module provides helper functions to standardize logging across the qserp codebase.
 * Consistent logging patterns make debugging easier and provide better visibility into
 * function execution flow, especially important in async operations with rate limiting.
 * 
 * The design philosophy is to provide simple, reusable functions that eliminate
 * repetitive console.log formatting while maintaining readability and debuggability.
 */

/**
 * Logs the start of function execution with standardized formatting
 * 
 * This function creates consistent entry-point logs across the codebase.
 * It's designed to trace execution flow, especially useful when debugging
 * complex async operations, rate limiting, and API interactions.
 * 
 * The standardized format makes it easy to grep logs and understand
 * the execution sequence when multiple functions are running concurrently.
 * 
 * @param {string} fnName - Name of the function being executed
 * @param {string} details - Description of input parameters or execution context
 * @returns {void} - This is a pure side-effect function for logging only
 */
function logStart(fnName, details) {
	// Use template literal for consistent "X is running with Y" format
	// This pattern makes logs easily searchable and provides immediate context
	// about what function is executing and what data it's processing
	console.log(`${fnName} is running with ${details}`);
}

/**
 * Logs the completion of function execution with standardized formatting
 * 
 * This function creates consistent exit-point logs that pair with logStart.
 * It's particularly valuable for tracking return values and understanding
 * what data flows between functions in the module.
 * 
 * For async functions, this helps confirm when operations actually complete
 * versus when they're just initiated, which is crucial for debugging
 * rate limiting and API timing issues.
 * 
 * @param {string} fnName - Name of the function that's completing
 * @param {any} result - The return value or result description
 * @returns {void} - This is a pure side-effect function for logging only
 */
function logReturn(fnName, result) {
	// Use template literal for consistent "X returning Y" format
	// This pattern pairs with logStart to provide complete execution visibility
	// The result parameter accepts any type and logs it as-is for flexibility
	console.log(`${fnName} returning ${result}`);
}

/**
 * Module exports
 * 
 * These utility functions are designed to be imported and used consistently
 * across the entire qserp codebase. They provide:
 * 
 * - logStart: Entry point logging for function execution
 * - logReturn: Exit point logging for function completion
 * 
 * Benefits of this approach:
 * 1. Consistent log formatting across all modules
 * 2. Easy to search and filter logs during debugging
 * 3. Clear execution flow visibility for async operations
 * 4. Minimal overhead - simple string formatting only
 * 5. Flexible - works with any function name and data types
 */
module.exports = { 
	logStart,   // Standardized function entry logging
	logReturn   // Standardized function exit logging
};
