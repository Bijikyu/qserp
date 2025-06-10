/**
 * debugLogger.js - Centralized debug logging utility for consistent function tracing
 * 
 * This utility consolidates the repeated debug logging pattern found across multiple files.
 * It provides standardized function entry/exit logging when DEBUG mode is enabled,
 * eliminating code duplication while maintaining consistent logging format.
 * 
 * DESIGN RATIONALE: The debug logging pattern (logStart/logReturn with DEBUG checks)
 * appears in 6+ files throughout the codebase. Centralizing this pattern:
 * 1. Reduces code duplication and maintenance overhead
 * 2. Ensures consistent debug output format across all modules
 * 3. Provides single point of control for debug behavior changes
 * 4. Simplifies function instrumentation with minimal code impact
 */

const { getDebugFlag } = require('./getDebugFlag'); //import debug flag utility for consistent behavior
const { logStart, logReturn } = require('./logUtils'); //standardized logging utilities

// Cache debug flag to avoid repeated environment checks
// DEBUG flag is evaluated once at module load time for performance
const DEBUG = getDebugFlag();

/**
 * Logs function entry with standardized formatting when DEBUG is enabled
 * 
 * This function wraps logStart with DEBUG checking to provide consistent
 * entry point logging across all modules without repeating the debug check.
 * 
 * PERFORMANCE CONSIDERATION: Debug flag is checked once at module load rather
 * than on every call to minimize runtime overhead in production environments.
 * 
 * @param {string} fnName - Name of the function being entered
 * @param {any} details - Parameters or context information for the function
 * @returns {void} - Pure side-effect function for logging only
 */
function debugStart(fnName, details) {
    if (DEBUG) {
        logStart(fnName, details);
    }
}

/**
 * Logs function exit with standardized formatting when DEBUG is enabled
 * 
 * This function wraps logReturn with DEBUG checking to provide consistent
 * exit point logging across all modules without repeating the debug check.
 * 
 * The function pairs with debugStart to create complete execution traces
 * that help with debugging complex async operations and function call flows.
 * 
 * @param {string} fnName - Name of the function being exited
 * @param {any} result - Return value or result description
 * @returns {void} - Pure side-effect function for logging only
 */
function debugReturn(fnName, result) {
    if (DEBUG) {
        logReturn(fnName, result);
    }
}

/**
 * Logs debug messages with consistent formatting when DEBUG is enabled
 * 
 * This function provides a simple way to add debug-only log messages
 * throughout the codebase without repeating DEBUG flag checks.
 * 
 * @param {string} message - Debug message to log
 * @returns {void} - Pure side-effect function for logging only
 */
function debugLog(message) {
    if (DEBUG) {
        console.log(message);
    }
}

/**
 * Returns current debug state for conditional logic
 * 
 * Some functions need to perform different logic based on debug state
 * (e.g., sanitizing sensitive data for logs). This function provides
 * consistent access to the debug flag state.
 * 
 * @returns {boolean} - Current debug flag state
 */
function isDebugEnabled() {
    return DEBUG;
}

/**
 * Module exports
 * 
 * These functions provide a complete debug logging toolkit that eliminates
 * the need for DEBUG flag checks and logStart/logReturn imports across
 * multiple files. The API is designed to be drop-in replacements for
 * existing debug logging patterns.
 */
module.exports = {
    debugStart,     // Standardized function entry logging
    debugReturn,    // Standardized function exit logging
    debugLog,       // General debug message logging
    isDebugEnabled  // Debug state accessor for conditional logic
};