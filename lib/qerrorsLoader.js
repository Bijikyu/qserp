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
const { getDebugFlag } = require('./getDebugFlag'); //import debug flag utility for conditional logging
const DEBUG = getDebugFlag(); //determine current debug state at load time

// Robust sanitizer to mask raw, encoded, and parameterized API key in strings
function sanitizeApiKey(text) { //avoid leaking sensitive key in logs
        let result; //store sanitized result for return
        let sanitizedInput; //log-friendly sanitized version
        try {
                const currentKey = process.env.GOOGLE_API_KEY; //read key each call for accuracy
                const escKey = currentKey ? currentKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : ''; //escape regex metachars
                const rawParamRegex = currentKey ? new RegExp(`([?&][^=&]*=)${escKey}`, 'g') : null; //match key as param value
                const encEscKey = currentKey ? encodeURIComponent(currentKey).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : ''; //escape encoded value
                const encValueRegex = currentKey ? new RegExp(`([?&][^=&]*=)${encEscKey}`, 'g') : null; //match encoded value form
                const encParamRegex = currentKey ? new RegExp(`([?&][^=&]*%3D)${encEscKey}`, 'gi') : null; //match encoded '=' form
                const plainRegex = currentKey ? new RegExp(`\\b${escKey}\\b(?!\\s*=)`, 'g') : null; //match plain key usage

                sanitizedInput = String(text); //normalize to string for replace calls

                if (rawParamRegex) sanitizedInput = sanitizedInput.replace(rawParamRegex, '$1[redacted]'); //mask param value
                if (encValueRegex) sanitizedInput = sanitizedInput.replace(encValueRegex, '$1[redacted]'); //mask encoded value
                if (encParamRegex) sanitizedInput = sanitizedInput.replace(encParamRegex, '$1[redacted]'); //mask encoded '='
                if (plainRegex) sanitizedInput = sanitizedInput.replace(plainRegex, '[redacted]'); //mask standalone value
                if (DEBUG) { logStart('sanitizeApiKey', sanitizedInput); } //trace sanitized result
                result = sanitizedInput; //assign sanitized value to result
        } catch (err) {
                const currentKey = process.env.GOOGLE_API_KEY; //re-read in fallback
                const escKey = currentKey ? currentKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : ''; //escape for fallback regex
                const rawParamRegex = currentKey ? new RegExp(`([?&][^=&]*=)${escKey}`, 'g') : null; //fallback param regex
                let encValueRegex; //placeholder for encoded value regex
                let encParamRegex; //placeholder for encoded '=' regex
                try { //attempt to build encoded regex even if error triggered
                        const encEscKey = currentKey ? encodeURIComponent(currentKey).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
                        encValueRegex = currentKey ? new RegExp(`([?&][^=&]*=)${encEscKey}`, 'g') : null; //encoded value regex
                        encParamRegex = currentKey ? new RegExp(`([?&][^=&]*%3D)${encEscKey}`, 'gi') : null; //encoded '=' regex
                } catch (e) {
                        encValueRegex = null; //graceful fallback
                        encParamRegex = null; //graceful fallback
                }
                const plainRegex = currentKey ? new RegExp(`\\b${escKey}\\b(?!\\s*=)`, 'g') : null; //fallback plain regex

                sanitizedInput = String(text); //ensure string for replacement

                if (rawParamRegex) sanitizedInput = sanitizedInput.replace(rawParamRegex, '$1[redacted]'); //mask value portion
                if (encValueRegex) sanitizedInput = sanitizedInput.replace(encValueRegex, '$1[redacted]'); //mask encoded value
                if (encParamRegex) sanitizedInput = sanitizedInput.replace(encParamRegex, '$1[redacted]'); //mask encoded '=' value
                if (plainRegex) sanitizedInput = sanitizedInput.replace(plainRegex, '[redacted]'); //mask plain occurrences
                if (DEBUG) { logStart('sanitizeApiKey', sanitizedInput); } //trace fallback sanitized result
                result = sanitizedInput; //assign sanitized fallback
        }
        if (DEBUG) { logReturn('sanitizeApiKey', result); } //trace output when debug
        return result; //return sanitized string to caller
}

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
        if (DEBUG) { logStart('loadQerrors', 'qerrors module'); } //log start before require when debugging
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
                
                if (DEBUG) { logReturn('loadQerrors', qerrors.name); } //log selected function name when debug enabled
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
 * @returns {Promise<*>} - Result from qerrors or false on failure
 */
async function safeQerrors(error, context, additionalData = {}) { //async to return awaited qerrors result
        const cleanCtx = sanitizeApiKey(context); //mask api key before logging context
        if (DEBUG) { logStart('safeQerrors', cleanCtx); } //avoid leaking raw context value when debugging

        const safeMsg = String(error?.message || error).replace(/\n/g, ' '); //newline sanitize for later logs
        
        try {
                const qerrors = loadQerrors();
                
                // Ensure error is an Error object for qerrors v1.2.3+ compatibility
                const errorObj = error instanceof Error ? error : new Error(safeMsg); //use sanitized message when wrapping
                
                const result = await qerrors(errorObj, context, additionalData); //await qerrors call for async modules
                if (DEBUG) { logReturn('safeQerrors', result); } //log returned value when debug enabled
                return result; //propagate qerrors result
        } catch (qerrorsError) {
                // qerrors itself failed - fall back to basic logging
                try {
                        const failMsg = sanitizeApiKey(String(qerrorsError && qerrorsError.message || qerrorsError).replace(/\n/g, ' ')); //safely sanitize nested error message
                        const origMsg = sanitizeApiKey(safeMsg); //sanitize original error message
                        const safeCtx = sanitizeApiKey(context); //sanitize provided context
                        logError(`qerrors failed: ${failMsg}`); //log sanitized nested message
                        logError(`Original error: ${origMsg}`); //log sanitized original message
                        logError(`Context: ${safeCtx}`); //log sanitized context
                } catch (logErr) {
                        // Even basic logging failed - use console as last resort
                        console.error('Critical: All error reporting systems failed');
                        const failMsg = sanitizeApiKey(String(qerrorsError && qerrorsError.message || qerrorsError).replace(/\n/g, ' ')); //safely sanitize nested error message for console
                        console.error('qerrors error:', failMsg); //output sanitized nested message
                        console.error('Original error:', sanitizeApiKey(safeMsg)); //sanitize original for console
                        console.error('Context:', sanitizeApiKey(context)); //sanitize context for console
                }
                if (DEBUG) { logReturn('safeQerrors', 'failed'); }
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
        if (DEBUG) { logStart('createCompatibleQerrors', 'wrapper'); } //trace function start when debug
        const qerrors = loadQerrors(); //load base qerrors implementation

        const compatibleQerrors = function compatibleQerrors(error, context, additionalData = {}) {
                if (DEBUG) { logStart('compatibleQerrors', context); } //trace call context when debug
                const errorObj = error instanceof Error ? error : new Error(String(error)); //ensure Error instance
                const result = qerrors(errorObj, context, additionalData); //delegate to loaded qerrors
                if (DEBUG) { logReturn('compatibleQerrors', result); } //trace result for debugging when debug
                return result; //propagate outcome
        };

        if (DEBUG) { logReturn('createCompatibleQerrors', 'function'); } //trace wrapper creation when debug
        return compatibleQerrors; //return wrapped function
}

/**
 * Module exports
 * 
 * The default export is now a function that returns a compatible qerrors wrapper,
 * maintaining backward compatibility with existing `require('./qerrorsLoader')()`
 * calls throughout the codebase.
 */
module.exports = function() {
        if (DEBUG) { logStart('defaultExport', 'init'); } //trace loader wrapper start when debug
        const wrapped = createCompatibleQerrors(); //create wrapper function
        if (DEBUG) { logReturn('defaultExport', 'function'); } //trace wrapper created when debug
        return wrapped; //return new wrapper
};

// Named exports for enhanced functionality
module.exports.loadQerrors = loadQerrors;       // Direct loader access
module.exports.safeQerrors = safeQerrors;       // Safe wrapper with fallback
module.exports.createCompatible = createCompatibleQerrors; // Explicit wrapper creation

// Maintain backward compatibility with existing imports
module.exports.default = module.exports;

