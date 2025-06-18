/**
 * debugUtils.js - Centralized logging utilities for consistent tracing and debugging
 * 
 * This utility consolidates all logging patterns found across the codebase, replacing
 * both the scattered debug logging patterns and the lib/logUtils.js module to eliminate
 * code duplication and provide a single source of truth for logging functionality.
 * 
 * CONSOLIDATION RATIONALE: 
 * - The pattern of `if (DEBUG) { logStart/logReturn }` appears in 15+ functions across 5+ files
 * - lib/logUtils.js provided similar logStart/logReturn functions without DEBUG gating
 * - Multiple modules import different logging utilities for the same functionality
 * 
 * UNIFIED DESIGN BENEFITS:
 * 1. Single logging utility replacing lib/logUtils.js and scattered debug patterns
 * 2. Consistent debug output format across all modules  
 * 3. DEBUG-aware and non-DEBUG logging options in one place
 * 4. Reduced maintenance burden from multiple logging implementations
 * 5. Better parameter handling and error resilience than original utilities
 * 
 * BACKWARD COMPATIBILITY: Provides both DEBUG-gated functions (debugEntry/debugExit)
 * and always-on functions (logStart/logReturn) to support existing usage patterns.
 */

const { getDebugFlag } = require('./getDebugFlag'); //import helper for DEBUG env parsing

const DEBUG = getDebugFlag(); //cache debug flag to avoid repeated env reads

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
 * Always-on logging functions for backward compatibility with lib/logUtils.js
 * 
 * These functions provide the same interface as the original logUtils module
 * but with enhanced parameter handling and error resilience. They log regardless
 * of DEBUG flag state, maintaining compatibility with existing code.
 */

/**
 * Logs function entry with standardized formatting (always enabled)
 * 
 * BACKWARD COMPATIBILITY: Drop-in replacement for logUtils.logStart()
 * Enhanced with better parameter serialization and error handling.
 * 
 * @param {string} fnName - Name of the function being executed
 * @param {any} details - Description of input parameters or execution context
 */
function logStart(fnName, details = '') {
        try {
                // Format details safely, handling various data types like debugEntry
                const detailStr = typeof details === 'string' ? details : 
                                typeof details === 'object' ? JSON.stringify(details) : 
                                String(details);
                console.log(`${fnName} is running with ${detailStr}`);
        } catch (error) {
                // Fallback for serialization errors
                console.log(`${fnName} is running with <unserializable details>`);
        }
}

/**
 * Logs function completion with standardized formatting (always enabled)
 * 
 * BACKWARD COMPATIBILITY: Drop-in replacement for logUtils.logReturn()
 * Enhanced with better parameter serialization and error handling.
 * 
 * @param {string} fnName - Name of the function that's completing
 * @param {any} result - The return value or result description
 */
function logReturn(fnName, result = '') {
        try {
                // Format result safely, handling various data types like debugExit
                const resultStr = typeof result === 'string' ? result : 
                                typeof result === 'object' ? JSON.stringify(result) : 
                                String(result);
                console.log(`${fnName} returning ${resultStr}`);
        } catch (error) {
                // Fallback for serialization errors
                console.log(`${fnName} returning <unserializable result>`);
        }
}

/**
 * Module exports
 * 
 * CONSOLIDATION COMPLETE: This module now replaces both:
 * 1. Scattered debug logging patterns (debugEntry, debugExit, debugLog, createTracer)
 * 2. lib/logUtils.js functionality (logStart, logReturn)
 * 
 * All logging utilities are now centralized with consistent error handling,
 * parameter serialization, and both DEBUG-gated and always-on options.
 */
module.exports = {
        // Debug-gated logging (replaces scattered if(DEBUG) patterns)
        debugEntry,
        debugExit,
        debugLog,
        createTracer,
        
        // Always-on logging (replaces lib/logUtils.js)
        logStart,
        logReturn,
        
        // Utility exports
        DEBUG  // Export for modules that need the flag directly
};
