
/**
 * envUtils.js - Environment variable validation utilities
 * 
 * This module provides centralized environment variable validation to ensure
 * required configuration is present before the application attempts to use it.
 * 
 * The design philosophy is "fail fast" - detect missing configuration early
 * rather than failing deep in business logic where errors are harder to debug.
 * This approach improves developer experience and reduces troubleshooting time.
 */

// Import safeQerrors using shared loader
const { safeQerrors } = require('./qerrorsLoader'); //retrieve safe wrapper for qerrors
// safeQerrors is async; calls below use `void` to discard the returned promise
// This prevents Node from warning about an unhandled promise while keeping
// these utility functions synchronous for simplicity
const { logStart, logReturn } = require('./logUtils'); //standard logging to match other modules
// safeRun now returns a promise; env utils implement sync logic internally
const { getDebugFlag } = require('./getDebugFlag'); //import debug flag utility
const { logWarn, logError } = require('./minLogger'); //minimal logging for warn/error
const DEBUG = getDebugFlag(); //determine current debug state

// Helper replicates old safeRun behavior synchronously for env checks
function calcMissing(varArr) {
       if (DEBUG) { logStart('calcMissing', varArr); } //trace call for debugging

       if (!Array.isArray(varArr)) { //validate input and fail fast when not array
               const err = new TypeError('varArr must be array'); //construct explicit type error
               void Promise.resolve(safeQerrors(err, 'calcMissing invalid varArr', { varArr })).catch(() => {}); //ignore promise result to keep function sync
               if (DEBUG) { logReturn('calcMissing', 'TypeError'); } //trace thrown condition
               throw err; //propagate misuse error to caller
       }

       try { //attempt to filter normally without upfront checks to mimic prior behavior
               const result = varArr.filter(name => { //filter env vars, treat whitespace as missing
                       const val = process.env[name]; //retrieve env var value for name
                       return !val || val.trim() === ''; //flag missing when undefined or trimmed empty
               });
               if (DEBUG) { logReturn('calcMissing', result); } //trace filtered list
               return result; //return computed array
       } catch (err) {
               void Promise.resolve(safeQerrors(err, 'calcMissing error', { varArr })).catch(() => {}); //fire-and-forget to avoid blocking sync API
               if (DEBUG) { logReturn('calcMissing', []); } //trace fallback result
               return []; //error encountered -> treat as no vars missing
       }
}

/**
 * Identifies which environment variables from a given list are missing
 * 
 * This function serves as the foundation for all other environment validation.
 * It uses Array.filter to efficiently check multiple variables in a single pass.
 * The function is designed to be pure (no side effects) and reusable.
 * 
 * @param {string[]} varArr - Array of environment variable names to check
 * @returns {string[]} Array of missing variable names (empty if all present)
 */
function getMissingEnvVars(varArr) {
       if (DEBUG) { logStart('getMissingEnvVars', varArr); } //log start only when debug enabled

       const missingArr = calcMissing(varArr); //throws TypeError when input not array

       if (DEBUG) { logReturn('getMissingEnvVars', missingArr); } //log result only when debug enabled
       return missingArr; //array of missing names, empty when all present
}

/**
 * Throws an error if any required environment variables are missing
 * 
 * This function implements the "fail fast" principle for critical configuration.
 * It's designed for variables that are absolutely required for application function.
 * The thrown error includes all missing variables to help developers fix all issues at once.
 * 
 * @param {string[]} varArr - Array of required environment variable names
 * @throws {Error} If any variables are missing, with descriptive message
 * @returns {string[]} Empty array if no variables are missing (for testing purposes)
 */
function throwIfMissingEnvVars(varArr) {
       if (DEBUG) { logStart('throwIfMissingEnvVars', varArr); } //log start only when debug enabled

       const missingEnvVars = calcMissing(varArr); //calcMissing may throw TypeError for bad input

       if (missingEnvVars.length > 0) {
               // Construct comprehensive error message listing all missing variables
               // DESIGN CHOICE: Include all missing vars in single message rather than failing
               // on first missing var - this allows developers to fix all issues at once
               const errorMessage = `Missing required environment variables: ${missingEnvVars.join(', ')}`; 
               
               // Log error before throwing to ensure visibility even if exception is caught
               // VISIBILITY RATIONALE: Some calling code might catch and handle the exception,
               // but we still want the error logged for debugging and monitoring purposes
                logError(errorMessage); //use minLogger instead of console.error
               
               const err = new Error(errorMessage);
               
               // Report through safeQerrors with context for structured error tracking
               // CONTEXT INCLUSION: varArr provides debugging context about which variables
               // were being validated when the error occurred
               void Promise.resolve(safeQerrors(err, 'throwIfMissingEnvVars error', { varArr })).catch(() => {}); //don't await so validation remains synchronous
               
               throw err; // Fail fast - required variables are non-negotiable
       }

       if (DEBUG) { logReturn('throwIfMissingEnvVars', missingEnvVars); } //log result only when debug enabled
       return missingEnvVars; //empty array means all required vars exist
}

/**
 * Logs warnings for missing optional environment variables
 * 
 * This function handles variables that enhance functionality but aren't strictly required.
 * It uses console.warn rather than throwing errors to allow graceful degradation.
 * The function is designed to provide helpful feedback without breaking the application.
 * 
 * @param {string[]} varArr - Array of optional environment variable names to check
 * @param {string} customMessage - Custom warning message to display (optional)
 * @returns {boolean} True if all variables are present, otherwise false
 */
function warnIfMissingEnvVars(varArr, customMessage = '') {
       if (DEBUG) { logStart('warnIfMissingEnvVars', varArr); } //log start only when debug enabled

       const missingEnvVars = calcMissing(varArr); //sync detection with safe error handling

       if (missingEnvVars.length > 0) {
               // Use custom message if provided, otherwise generate default warning
               // FLEXIBILITY RATIONALE: Custom messages allow callers to provide specific
               // context about what functionality will be affected by missing variables
               const warningMessage = customMessage ||
                       `Warning: Optional environment variables missing: ${missingEnvVars.join(', ')}. Some features may not work as expected.`;
               
               // Use console.warn for optional variables to distinguish from errors
               // WARNING LEVEL: Indicates potential issues without blocking execution,
               // allowing graceful degradation of non-critical functionality
                logWarn(warningMessage); //use minLogger instead of console.warn
       }

       const result = missingEnvVars.length === 0; //true when no optional vars missing
       if (DEBUG) { logReturn('warnIfMissingEnvVars', result); } //log result only when debug enabled
       return result; //false signals optional vars absent but execution continues
}

/**
 * Module exports
 * 
 * These functions provide a complete toolkit for environment variable validation:
 * - getMissingEnvVars: Core detection logic (pure function for testing)
 * - throwIfMissingEnvVars: Fail-fast validation for critical configuration  
 * - warnIfMissingEnvVars: Graceful handling of optional configuration
 * 
 * The functions are designed to work together and follow consistent patterns
 * for error handling, logging, and return values.
 */
module.exports = {
        getMissingEnvVars,      // Core missing variable detection
        throwIfMissingEnvVars,  // Fatal validation for required variables
        warnIfMissingEnvVars    // Non-fatal validation for optional variables
};
