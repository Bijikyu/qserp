/**
 * qerrorsLoader.js - Enhanced qerrors utility with safe error reporting wrapper
 *
 * This enhanced loader not only normalizes qerrors export patterns but also provides
 * a safe wrapper for error reporting that handles failures gracefully. This consolidates
 * the error handling pattern found across multiple files in the codebase.
 * 
 * CONSOLIDATION RATIONALE: The pattern of wrapping qerrors calls in try-catch blocks
 * appears in lib/qserp.js, lib/envUtils.js, and lib/minLogger.js. Centralizing this
 * pattern provides consistent error handling behavior across all modules.
 */

const { logStart, logReturn } = require('./logUtils'); //import standardized logging utilities
const { logError } = require('./minLogger'); //import error logging utility

/**
 * Loads and normalizes the qerrors function from the qerrors module
 * 
 * EXPORT RESOLUTION STRATEGY: Uses a cascading approach to handle different
 * export patterns. First checks if the module itself is a function (direct export),
 * then checks for named exports (mod.qerrors), then ES6 default exports (mod.default).
 * 
 * VALIDATION LOGIC: After resolving the export, validates that the result is
 * actually a callable function. This prevents runtime errors later when other
 * modules attempt to call qerrors().
 * 
 * ERROR PROPAGATION: Throws rather than returning null/undefined because qerrors
 * is essential infrastructure. Failing fast here prevents subtle bugs where
 * error reporting silently stops working.
 */
function loadQerrors() {
        logStart('loadQerrors', 'qerrors module'); //log start before require
        try {
                const mod = require('qerrors'); //import qerrors module
                
                // Resolve function from various possible export patterns
                // Updated for qerrors v1.2.3+ which exports an object with named functions
                // Priority: mod.qerrors (v1.2.3+), mod (direct function), mod.default (ES6)
                const qerrors = mod.qerrors || (typeof mod === 'function' ? mod : mod.default); //resolve exported function
                
                // Validate that we successfully extracted a callable function
                // This prevents runtime errors when other modules try to call qerrors()
                if (typeof qerrors !== 'function') { //verify resolved export is callable
                        throw new Error('qerrors module does not export a callable function'); //throw explicit error when export invalid
                }
                
                logReturn('loadQerrors', qerrors.name); //log selected function name
                return qerrors; //return callable qerrors function
        } catch (error) {
                // Log the failure for debugging but re-throw to fail fast
                // This ensures that module loading issues are immediately visible
                console.error(error); //log loader failure
                throw error; //re-throw loader error
        }
}

/**
 * Safe wrapper for qerrors calls that handles failures gracefully
 * 
 * This function consolidates the repeated pattern of wrapping qerrors calls
 * in try-catch blocks found across multiple files. It ensures that error
 * reporting failures never crash the application.
 * 
 * COMPATIBILITY LAYER: qerrors v1.2.3+ requires Error objects, so this wrapper
 * automatically converts string errors to Error objects while preserving
 * existing Error objects unchanged.
 * 
 * FAILURE STRATEGY: If qerrors itself fails, the function falls back to
 * basic logging and returns false to indicate the failure. This prevents
 * cascading errors while preserving error information.
 * 
 * @param {Error|string} error - Error object or message to report
 * @param {string} context - Contextual information about where error occurred
 * @param {Object} additionalData - Additional structured data for error analysis
 * @returns {boolean} - True if error was reported successfully, false if qerrors failed
 */
function safeQerrors(error, context, additionalData = {}) {
        logStart('safeQerrors', `${context}: ${error?.message || error}`);
        
        try {
                const qerrors = loadQerrors();
                
                // Ensure error is an Error object for qerrors v1.2.3+ compatibility
                const errorObj = error instanceof Error ? error : new Error(String(error));
                
                qerrors(errorObj, context, additionalData);
                logReturn('safeQerrors', 'success');
                return true;
        } catch (qerrorsError) {
                // qerrors itself failed - fall back to basic logging
                try {
                        logError(`qerrors failed: ${qerrorsError.message}`);
                        logError(`Original error: ${error?.message || error}`);
                        logError(`Context: ${context}`);
                } catch (logErr) {
                        // Even basic logging failed - use console as last resort
                        console.error('Critical: All error reporting systems failed');
                        console.error('qerrors error:', qerrorsError.message);
                        console.error('Original error:', error?.message || error);
                        console.error('Context:', context);
                }
                logReturn('safeQerrors', 'failed');
                return false;
        }
}

/**
 * Creates a backward-compatible qerrors function wrapper
 * 
 * This wrapper ensures that the qerrors function works with both Error objects
 * and strings, automatically converting strings to Error objects as needed for
 * qerrors v1.2.3+ compatibility while maintaining the existing API.
 * 
 * @returns {Function} - Wrapped qerrors function with automatic error conversion
 */
function createCompatibleQerrors() {
        const qerrors = loadQerrors();
        
        return function compatibleQerrors(error, context, additionalData = {}) {
                // Convert string errors to Error objects for v1.2.3+ compatibility
                const errorObj = error instanceof Error ? error : new Error(String(error));
                return qerrors(errorObj, context, additionalData);
        };
}

/**
 * Module exports
 * 
 * The default export is now a function that returns a compatible qerrors wrapper,
 * maintaining backward compatibility with existing `require('./qerrorsLoader')()`
 * calls throughout the codebase.
 */
module.exports = function() {
        return createCompatibleQerrors();
};

// Named exports for enhanced functionality
module.exports.loadQerrors = loadQerrors;       // Direct loader access
module.exports.safeQerrors = safeQerrors;       // Safe wrapper with fallback
module.exports.createCompatible = createCompatibleQerrors; // Explicit wrapper creation

// Maintain backward compatibility with existing imports
module.exports.default = module.exports;

