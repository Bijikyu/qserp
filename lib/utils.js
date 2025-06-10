
/**
 * utils.js - Shared utility functions for safe execution and error handling
 * 
 * This module provides reusable utility functions that implement common patterns
 * across the qserp codebase. The focus is on safe execution with graceful
 * error handling and consistent logging.
 * 
 * The design philosophy emphasizes defensive programming - functions should
 * handle errors gracefully and provide fallback values rather than crashing
 * the entire application when non-critical operations fail.
 */

const qerrors = require('./qerrorsLoader')(); //import qerrors via loader to support varied export styles
const { logStart, logReturn } = require('./logUtils'); // Import standardized logging utilities
const { getDebugFlag } = require('./getDebugFlag'); //import debug flag utility
const DEBUG = getDebugFlag(); //determine current debug state

/**
 * Safely executes a function with error handling and fallback values
 * 
 * This utility function implements the "try-catch with fallback" pattern that's
 * used throughout the qserp module. It provides consistent error handling,
 * logging, and fallback behavior for operations that might fail but shouldn't
 * crash the entire application.
 * 
 * The function is designed to be generic and reusable across different contexts
 * where safe execution with graceful degradation is needed.
 * 
 * Use cases:
 * - API calls that might fail but have reasonable fallbacks
 * - Data processing operations where partial failure is acceptable
 * - Environment validation where some features are optional
 * - Any operation where you want to log errors but continue execution
 * 
 * @param {string} fnName - Descriptive name for the operation (used in logging)
 * @param {Function} fn - The function to execute safely (should be parameterless)
 * @param {any} defaultVal - Fallback value to return if the function fails
 * @param {Object} context - Additional context for error reporting (optional)
 * @returns {any} Result of fn() if successful, defaultVal if fn() throws an error
 */
function safeRun(fnName, fn, defaultVal, context) {
        // Log the start of safe execution with context for debugging
        // JSON.stringify handles the context object safely even if it contains complex data
    if (DEBUG) { logStart('safeRun', JSON.stringify({ fnName, context })); } //log start when debug enabled
        
        try {
                // Execute the provided function within controlled error boundary
                // PARAMETER DESIGN: Function should be parameterless to simplify error handling.
                // Any required parameters should be bound using .bind() or arrow functions beforehand.
                // This design prevents parameter-related errors and makes the safe execution pattern consistent.
                const result = fn();
                
                // Log successful execution result for debugging
                // This helps track when operations succeed vs when they fall back
                if (DEBUG) { logReturn('safeRun', result); } //log success when debug enabled
                return result; // Return the successful result
                
        } catch (error) {
                // Handle any error that occurs during function execution
                // ERROR REPORTING STRATEGY: Use qerrors for structured error logging with full context
                // This provides consistent error reporting across the application and enables
                // better debugging by including the operation name and any relevant context data
                qerrors(error, `${fnName} error`, context);
                
                // Log the fallback value being returned for debugging visibility
                // FALLBACK TRANSPARENCY: Makes it clear in logs when fallback behavior is triggered,
                // helping developers understand when operations fail vs succeed normally.
                // This is crucial for distinguishing between normal operation and degraded functionality.
                if (DEBUG) { logReturn('safeRun', defaultVal); }
                
                // Return the fallback value for graceful degradation
                // GRACEFUL DEGRADATION: Rather than crashing, return a sensible default that allows
                // the application to continue operating with reduced functionality
                return defaultVal;
        }
}

/**
 * Module exports
 * 
 * This module currently exports a single utility function, but is designed
 * to be expanded with additional shared utilities as the codebase grows.
 * 
 * The safeRun function provides:
 * - Consistent error handling across the application
 * - Graceful degradation with fallback values
 * - Structured error logging with context
 * - Standardized debug logging for execution flow
 * 
 * Future utilities might include:
 * - Data validation helpers
 * - Async operation wrappers
 * - Configuration parsing utilities
 * - Additional error handling patterns
 */
module.exports = { 
        safeRun // Safe function execution with error handling and fallbacks
};
