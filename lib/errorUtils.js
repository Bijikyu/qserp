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

const qerrors = require('./qerrorsLoader')();

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
        return {
                category: 'api_error',
                operation,
                timestamp: new Date().toISOString(),
                ...details
        };
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
        return {
                category: 'config_error',
                operation,
                timestamp: new Date().toISOString(),
                ...details
        };
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
        return {
                category: 'utility_error',
                operation,
                timestamp: new Date().toISOString(),
                ...details
        };
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
function reportError(error, message, context = {}, customDetails = {}) {
        try {
                const enrichedContext = {
                        errorType: error.name || 'Error',
                        errorMessage: error.message,
                        stack: error.stack,
                        ...context,
                        ...customDetails
                };
                
                qerrors(error, message, enrichedContext);
        } catch (reportingError) {
                // Fallback logging if qerrors itself fails
                console.error('Error reporting failed:', reportingError);
                console.error('Original error:', error);
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
        return {
                category: 'cache_error',
                operation,
                timestamp: new Date().toISOString(),
                ...details
        };
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
        return {
                category: 'validation_error',
                operation,
                timestamp: new Date().toISOString(),
                ...details
        };
}

/**
 * Convenience function for reporting API errors with proper context
 * 
 * @param {Error} error - The API error to report
 * @param {string} operation - API operation description
 * @param {Object} apiDetails - API-specific details (URL, response, etc.)
 */
function reportApiError(error, operation, apiDetails = {}) {
        const context = createApiErrorContext(operation, apiDetails);
        reportError(error, `API Error: ${operation}`, context);
}

/**
 * Convenience function for reporting configuration errors with proper context
 * 
 * @param {Error} error - The configuration error to report
 * @param {string} operation - Configuration operation description
 * @param {Object} configDetails - Config-specific details (variables, values, etc.)
 */
function reportConfigError(error, operation, configDetails = {}) {
        const context = createConfigErrorContext(operation, configDetails);
        reportError(error, `Configuration Error: ${operation}`, context);
}

/**
 * Convenience function for reporting validation errors with proper context
 * 
 * @param {Error} error - The validation error to report
 * @param {string} operation - Validation operation description
 * @param {Object} validationDetails - Validation-specific details
 */
function reportValidationError(error, operation, validationDetails = {}) {
        const context = createValidationErrorContext(operation, validationDetails);
        reportError(error, `Validation Error: ${operation}`, context);
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
