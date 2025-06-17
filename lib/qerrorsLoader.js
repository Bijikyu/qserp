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
const defaultApiKey = process.env.GOOGLE_API_KEY; //initial key captured for later masking

// Sanitizes strings by masking the API key wherever it appears
function sanitizeApiKey(text) { //prevent leaking key values in logs
        let result; //value after sanitization for return logging
        const applyPatterns = (str, key) => { //helper masks one key
                if (!key) return str; //skip when key missing
                try {
                        const escKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //escape metachars
                        const rawParam = new RegExp(`([?&][^=&]*=)${escKey}`, 'g'); //raw param regex
                        const encEscKey = encodeURIComponent(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //escape encoded key
                        const encValue = new RegExp(`([?&][^=&]*=)${encEscKey}`, 'g'); //encoded value regex
                        const encParam = new RegExp(`([?&][^=&]*%3D)${encEscKey}`, 'gi'); //encoded '=' regex
                        const plain = new RegExp(`\\b${escKey}\\b(?!\\s*=)`, 'g'); //plain key regex
                        return str
                                .replace(rawParam, '$1[redacted]') //mask raw value
                                .replace(encValue, '$1[redacted]') //mask encoded value
                                .replace(encParam, '$1[redacted]') //mask encoded '=' value
                                .replace(plain, '[redacted]'); //mask standalone key
                } catch (e) { //fallback to simpler replacement on failure
                        try {
                                const escKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //escape again safely
                                let out = str.replace(new RegExp(`([?&][^=&]*=)${escKey}`, 'g'), '$1[redacted]'); //mask raw
                                let encEscKey;
                                try { encEscKey = encodeURIComponent(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); } catch (_) { encEscKey = null; }
                                if (encEscKey) {
                                        out = out.replace(new RegExp(`([?&][^=&]*=)${encEscKey}`, 'g'), '$1[redacted]'); //encoded value
                                        out = out.replace(new RegExp(`([?&][^=&]*%3D)${encEscKey}`, 'gi'), '$1[redacted]'); //encoded '='
                                }
                                out = out.replace(new RegExp(`\\b${escKey}\\b(?!\\s*=)`, 'g'), '[redacted]'); //plain key
                                return out; //return sanitized fallback
                        } catch (_) { return str; } //give up on error
                }
        };
        const maskKeys = value => { //apply patterns for current and initial keys sequentially
                let out = String(value); //ensure string for replacement
                const envKey = process.env.GOOGLE_API_KEY; //current key
                const keys = []; //keys to mask
                if (envKey) keys.push(envKey); //mask current key when present
                if (defaultApiKey && defaultApiKey !== envKey) keys.push(defaultApiKey); //mask initial key when changed
                for (const k of keys) out = applyPatterns(out, k); //apply patterns sequentially
                return out; //return sanitized output
        };
        try {
                const sanitizedInput = maskKeys(text); //sanitize using helper
                logStart('sanitizeApiKey', sanitizedInput); //log sanitized input
                result = sanitizedInput; //capture sanitized result
        } catch (err) { //fallback when regex building fails
                const sanitizedInput = maskKeys(text); //retry sanitization
                logStart('sanitizeApiKey', sanitizedInput); //log sanitized fallback
                result = sanitizedInput; //use fallback sanitized string
        }
        logReturn('sanitizeApiKey', result); //log return value for traceability
        return result; //provide sanitized string back to caller
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
 * @returns {Promise<*>} - Result from qerrors or false on failure
 */
async function safeQerrors(error, context, additionalData = {}) { //async to return awaited qerrors result
        const cleanCtx = sanitizeApiKey(context); //mask api key before logging context
        logStart('safeQerrors', cleanCtx); //avoid leaking raw context value

        const safeMsg = String(error?.message || error).replace(/\n/g, ' '); //newline sanitize for later logs
        
        try {
                const qerrors = loadQerrors();
                
                // Ensure error is an Error object for qerrors v1.2.3+ compatibility
                const errorObj = error instanceof Error ? error : new Error(safeMsg); //use sanitized message when wrapping
                
                const result = await qerrors(errorObj, context, additionalData); //await qerrors call for async modules
                logReturn('safeQerrors', result); //log returned value
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
        logStart('createCompatibleQerrors', 'wrapper'); //trace function start
        const qerrors = loadQerrors(); //load base qerrors implementation

        const compatibleQerrors = function compatibleQerrors(error, context, additionalData = {}) {
                logStart('compatibleQerrors', context); //trace call context
                const errorObj = error instanceof Error ? error : new Error(String(error)); //ensure Error instance
                const result = qerrors(errorObj, context, additionalData); //delegate to loaded qerrors
                logReturn('compatibleQerrors', result); //trace result for debugging
                return result; //propagate outcome
        };

        logReturn('createCompatibleQerrors', 'function'); //trace wrapper creation
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
        logStart('defaultExport', 'init'); //trace loader wrapper start
        const wrapped = createCompatibleQerrors(); //create wrapper function
        logReturn('defaultExport', 'function'); //trace wrapper created
        return wrapped; //return new wrapper
};

// Named exports for enhanced functionality
module.exports.loadQerrors = loadQerrors;       // Direct loader access
module.exports.safeQerrors = safeQerrors;       // Safe wrapper with fallback
module.exports.createCompatible = createCompatibleQerrors; // Explicit wrapper creation
module.exports.sanitizeApiKey = sanitizeApiKey; // Export sanitizer for testing

// Maintain backward compatibility with existing imports
module.exports.default = module.exports;

