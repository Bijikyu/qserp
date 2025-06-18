/**
 * errorUtils.js - Centralized error context and reporting utilities
 * 
 * This utility consolidates the repeated error context building patterns found
 * across lib/qserp.js, lib/envUtils.js, and lib/utils.js where qerrors is called
 * with various context object structures.
 * 
 * CONSOLIDATION RATIONALE: The pattern of building error context objects for
 * qerrors reporting appears in 6+ functions across 3+ files with inconsistent
 * structure and content. Centralizing this logic provides:
 * 1. Consistent error context structure across all modules
 * 2. Standardized error classification and metadata
 * 3. Reduced code duplication in error handling
 * 4. Better error correlation and debugging capabilities
 * 
 * DESIGN STRATEGY: Provides factory functions for common error context patterns
 * while maintaining flexibility for module-specific context data.
 */

const { safeQerrors } = require('./qerrorsLoader'); //use wrapper so logging never crashes on reporting errors
const { logStart, logReturn } = require('./logUtils'); //logging utilities for tracing
const { sanitizeApiKey } = require('./qserp'); //reuse existing helper for mask to avoid duplication

/**
 * Creates standardized error context for API/network operations
 * 
 * This helper consolidates the error context patterns used in qserp.js
 * for Google API calls and network operations.
 * 
 * @param {string} operation - Description of the operation that failed
 * @param {Object} details - Operation-specific details (URL, query, etc.)
 * @returns {Object} Standardized error context object
 */
function createApiErrorContext(operation, details = {}) {
        logStart('createApiErrorContext', operation); //trace start with operation
        const context = { //build standardized object
                category: 'api_error', //identify error category
                operation, //operation description
                timestamp: new Date().toISOString(), //timestamp for correlation
                ...details //spread caller-provided details
        };
        logReturn('createApiErrorContext', context); //trace resulting object
        return context; //return context for reporting
}

/**
 * Creates standardized error context for environment/configuration operations
 * 
 * This helper consolidates the error context patterns used in envUtils.js
 * and envValidator.js for configuration validation failures.
 * 
 * @param {string} operation - Description of the validation that failed
 * @param {Object} details - Configuration-specific details (variables, values, etc.)
 * @returns {Object} Standardized error context object
 */
function createConfigErrorContext(operation, details = {}) {
        logStart('createConfigErrorContext', operation); //trace start with operation
        const context = {
                category: 'config_error', //categorize configuration errors
                operation,
                timestamp: new Date().toISOString(), //timestamp for consistency
                ...details
        };
        logReturn('createConfigErrorContext', context); //trace result object
        return context; //return constructed context
}

/**
 * Creates standardized error context for utility/helper operations
 * 
 * This helper consolidates the error context patterns used in utils.js
 * and other utility modules for general operation failures.
 * 
 * @param {string} operation - Description of the utility operation that failed
 * @param {Object} details - Operation-specific details
 * @returns {Object} Standardized error context object
 */
function createUtilityErrorContext(operation, details = {}) {
        logStart('createUtilityErrorContext', operation); //trace start with operation
        const context = {
                category: 'utility_error', //identify generic utility errors
                operation,
                timestamp: new Date().toISOString(), //time of occurrence
                ...details
        };
        logReturn('createUtilityErrorContext', context); //trace result context
        return context; //return standardized object
}

/**
 * Reports an error with standardized context and optional custom details
 * 
 * This function wraps qerrors calls with consistent error reporting patterns,
 * replacing the scattered qerrors(error, message, context) calls throughout
 * the codebase.
 * 
 * @param {Error} error - The error object to report
 * @param {string} message - Human-readable error message
 * @param {Object} context - Error context (from create*ErrorContext functions)
 * @param {Object} customDetails - Additional module-specific details
 */
async function reportError(error, message, context = {}, customDetails = {}) {
        logStart('reportError', message); //trace message being reported
        try {
                const enrichedContext = {
                        errorType: error.name || 'Error', //standardize error name
                        errorMessage: error.message,
                        stack: error.stack,
                        ...context,
                        ...customDetails
                };
                const result = await safeQerrors(error, message, enrichedContext); //capture result from safeQerrors
                if (result === false) { //check if reporting failed as indicated by safeQerrors
                        logReturn('reportError', 'failure'); //trace failure branch for log analysis
                        return false; //propagate failure to caller
                }
                logReturn('reportError', 'success'); //trace success only when result is not false
                return true; //indicate handled
        } catch (reportingError) {
                console.error('Error reporting failed:', sanitizeApiKey(reportingError)); //mask sensitive data in reporting error
                console.error('Original error:', sanitizeApiKey(error)); //mask sensitive data in original error
                logReturn('reportError', 'failure'); //trace failure
                return false; //indicate failure
        }
}

/**
 * Creates error context for cache operations
 * 
 * Specialized context builder for cache-related errors in qserp.js
 * and other modules that use caching functionality.
 * 
 * @param {string} operation - Cache operation (get, set, cleanup, etc.)
 * @param {Object} details - Cache-specific details (key, size, etc.)
 * @returns {Object} Cache error context object
 */
function createCacheErrorContext(operation, details = {}) {
        logStart('createCacheErrorContext', operation); //trace cache operation
        const context = {
                category: 'cache_error', //label cache-related issue
                operation,
                timestamp: new Date().toISOString(), //time for log correlation
                ...details
        };
        logReturn('createCacheErrorContext', context); //trace resulting object
        return context; //return standardized context
}

/**
 * Creates error context for validation operations
 * 
 * Specialized context builder for input validation errors across
 * multiple modules (qserp.js, envValidator.js, etc.).
 * 
 * @param {string} operation - Validation operation (query, env var, etc.)
 * @param {Object} details - Validation-specific details (input, constraints, etc.)
 * @returns {Object} Validation error context object
 */
function createValidationErrorContext(operation, details = {}) {
        logStart('createValidationErrorContext', operation); //trace start
        const context = {
                category: 'validation_error', //category label for validators
                operation,
                timestamp: new Date().toISOString(), //timestamp for trace
                ...details
        };
        logReturn('createValidationErrorContext', context); //trace object
        return context; //return structured context
}

/**
 * Convenience function for reporting API errors with proper context
 * 
 * @param {Error} error - The API error to report
 * @param {string} operation - API operation description
 * @param {Object} apiDetails - API-specific details (URL, response, etc.)
 */
async function reportApiError(error, operation, apiDetails = {}) {
        logStart('reportApiError', operation); //trace operation
        const context = createApiErrorContext(operation, apiDetails); //build context
        const result = await reportError(error, `API Error: ${operation}`, context); //await delegate reporting
        logReturn('reportApiError', result); //trace result
        return result; //return outcome of reportError
}

/**
 * Convenience function for reporting configuration errors with proper context
 * 
 * @param {Error} error - The configuration error to report
 * @param {string} operation - Configuration operation description
 * @param {Object} configDetails - Config-specific details (variables, values, etc.)
 */
async function reportConfigError(error, operation, configDetails = {}) {
        logStart('reportConfigError', operation); //trace operation
        const context = createConfigErrorContext(operation, configDetails); //build context
        const result = await reportError(error, `Configuration Error: ${operation}`, context); //await delegate
        logReturn('reportConfigError', result); //trace result
        return result; //propagate
}

/**
 * Convenience function for reporting validation errors with proper context
 * 
 * @param {Error} error - The validation error to report
 * @param {string} operation - Validation operation description
 * @param {Object} validationDetails - Validation-specific details
 */
async function reportValidationError(error, operation, validationDetails = {}) {
        logStart('reportValidationError', operation); //trace operation
        const context = createValidationErrorContext(operation, validationDetails); //build context
        const result = await reportError(error, `Validation Error: ${operation}`, context); //await delegate
        logReturn('reportValidationError', result); //trace result
        return result; //return result
}

/**
 * Module exports
 * 
 * These utilities provide consistent error reporting patterns that replace
 * the scattered qerrors calls throughout the codebase. The functions are
 * designed to work with existing error handling while providing better
 * structure and consistency.
 */
module.exports = {
        createApiErrorContext,
        createConfigErrorContext,
        createUtilityErrorContext,
        createCacheErrorContext,
        createValidationErrorContext,
        reportError,
        reportApiError,
        reportConfigError,
        reportValidationError
};
