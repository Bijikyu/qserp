/**
 * debugUtils.js - Centralized debug logging utilities for consistent tracing
 * 
 * This utility consolidates the repeated debug logging patterns found across
 * lib/qserp.js, lib/envUtils.js, lib/utils.js, lib/minLogger.js, and lib/envValidator.js.
 * 
 * CONSOLIDATION RATIONALE: The pattern of `if (DEBUG) { logStart/logReturn }` appears
 * in 15+ functions across 5+ files, creating maintenance overhead and inconsistency.
 * Centralizing this logic provides:
 * 1. Consistent debug output format across all modules
 * 2. Single point of control for debug behavior
 * 3. Reduced code duplication and maintenance burden
 * 4. Easier testing and mocking of debug functionality
 * 
 * DESIGN STRATEGY: Uses a simple functional approach that can be easily imported
 * and called without changing existing function signatures. The DEBUG flag check
 * is centralized here rather than at each call site for cleaner code.
 */

const { getDebugFlag } = require('./getDebugFlag');

// Cache the debug flag to avoid repeated environment variable access
// PERFORMANCE OPTIMIZATION: Checking process.env repeatedly is expensive,
// so we cache the result during module initialization
const DEBUG = getDebugFlag();

/**
 * Logs function entry with parameters for debugging
 * 
 * This helper standardizes the "function is running with params" logging pattern
 * found throughout the codebase. It provides consistent formatting and handles
 * parameter serialization safely.
 * 
 * USAGE PATTERN: Replace `if (DEBUG) { logStart('func', params); }` with `debugEntry('func', params);`
 * 
 * @param {string} functionName - Name of the function being traced
 * @param {any} params - Parameters or context to log (safely serialized)
 */
function debugEntry(functionName, params = '') {
        if (!DEBUG) return; // Early exit when debugging disabled
        
        try {
                // Format parameters safely, handling various data types
                const paramStr = typeof params === 'string' ? params : 
                               typeof params === 'object' ? JSON.stringify(params) : 
                               String(params);
                console.log(`${functionName} is running with ${paramStr}`);
        } catch (error) {
                // Fallback to basic logging if parameter serialization fails
                console.log(`${functionName} is running with <unserializable params>`);
        }
}

/**
 * Logs function exit with return value for debugging
 * 
 * This helper standardizes the "function returning value" logging pattern
 * found throughout the codebase. It provides consistent formatting and handles
 * return value serialization safely.
 * 
 * USAGE PATTERN: Replace `if (DEBUG) { logReturn('func', result); }` with `debugExit('func', result);`
 * 
 * @param {string} functionName - Name of the function being traced
 * @param {any} returnValue - Value being returned (safely serialized)
 */
function debugExit(functionName, returnValue = '') {
        if (!DEBUG) return; // Early exit when debugging disabled
        
        try {
                // Format return value safely, handling various data types
                const valueStr = typeof returnValue === 'string' ? returnValue : 
                               typeof returnValue === 'object' ? JSON.stringify(returnValue) : 
                               String(returnValue);
                console.log(`${functionName} returning ${valueStr}`);
        } catch (error) {
                // Fallback to basic logging if return value serialization fails
                console.log(`${functionName} returning <unserializable value>`);
        }
}

/**
 * Logs arbitrary debug messages when debugging is enabled
 * 
 * This helper provides a simple way to add conditional debug logging
 * without repeating the `if (DEBUG)` check throughout the codebase.
 * 
 * @param {string} message - Debug message to log
 * @param {any} context - Optional context data to include
 */
function debugLog(message, context = null) {
        if (!DEBUG) return; // Early exit when debugging disabled
        
        if (context !== null) {
                try {
                        const contextStr = typeof context === 'object' ? JSON.stringify(context) : String(context);
                        console.log(`DEBUG: ${message} - ${contextStr}`);
                } catch (error) {
                        console.log(`DEBUG: ${message} - <unserializable context>`);
                }
        } else {
                console.log(`DEBUG: ${message}`);
        }
}

/**
 * Creates a function-scoped debug tracer for consistent entry/exit logging
 * 
 * This helper returns a tracer object that can log entry and exit for a specific
 * function, reducing boilerplate when functions need multiple trace points.
 * 
 * USAGE PATTERN: 
 * ```
 * const trace = createTracer('myFunction');
 * trace.entry(params);
 * // ... function logic ...
 * trace.exit(result);
 * ```
 * 
 * @param {string} functionName - Name of the function to trace
 * @returns {Object} Tracer object with entry() and exit() methods
 */
function createTracer(functionName) {
        return {
                entry: (params) => debugEntry(functionName, params),
                exit: (returnValue) => debugExit(functionName, returnValue),
                log: (message, context) => debugLog(`${functionName}: ${message}`, context)
        };
}

/**
 * Module exports
 * 
 * These utilities replace the scattered debug logging patterns throughout
 * the codebase with consistent, centralized alternatives. The functions
 * are designed to be drop-in replacements for existing debug code.
 */
module.exports = {
        debugEntry,
        debugExit,
        debugLog,
        createTracer,
        DEBUG  // Export for modules that need the flag directly
};