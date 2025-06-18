/**
 * envValidator.js - Centralized environment variable validation and processing
 * 
 * This utility consolidates environment variable parsing and validation patterns
 * found across multiple files. It provides secure, consistent handling of
 * configuration values with proper bounds checking and type conversion.
 * 
 * CONSOLIDATION RATIONALE: The pattern of parsing environment variables with
 * default values and bounds checking appears in lib/qserp.js and lib/envUtils.js.
 * Centralizing this logic provides:
 * 1. Consistent validation behavior across all configuration
 * 2. Security through centralized bounds checking
 * 3. Reduced code duplication and maintenance overhead
 * 4. Single point of control for environment variable processing
 */

const { debugEntry, debugExit } = require('./debugUtils'); //centralized debug logging

/**
 * Parses and validates an integer environment variable with bounds checking
 * 
 * SECURITY CONSIDERATION: This function prevents malicious configuration values
 * from causing memory exhaustion or other security issues by enforcing strict
 * bounds on all numeric environment variables.
 * 
 * @param {string} varName - Environment variable name
 * @param {number} defaultValue - Default value if variable is missing or invalid
 * @param {number} minValue - Minimum allowed value (inclusive)
 * @param {number} maxValue - Maximum allowed value (inclusive)
 * @returns {number} - Validated integer within specified bounds
 */
function parseIntWithBounds(varName, defaultValue, minValue, maxValue) {
    debugEntry('parseIntWithBounds', `${varName}, default: ${defaultValue}, range: ${minValue}-${maxValue}`);

    // Improved validation rejects strings with trailing characters
    // VALIDATION UPDATE: ensure entire value is numeric before parsing to prevent partial parsing of values like '10abc'
    const rawString = (process.env[varName] || '').trim(); //trim to remove accidental spaces
    const numericMatch = /^-?\d+$/.test(rawString); //regex now only accepts whole numbers to reject decimals
    const envValue = numericMatch ? parseInt(rawString, 10) : NaN; //parse only if valid
    const rawValue = !isNaN(envValue) ? envValue : defaultValue; //retain default when NaN
    
    // Apply bounds checking for security and stability
    // Math.max ensures value >= minValue, Math.min ensures value <= maxValue
    const validatedValue = Math.max(minValue, Math.min(rawValue, maxValue));
    
    debugExit('parseIntWithBounds', validatedValue);
    return validatedValue;
}

/**
 * Parses a boolean environment variable with case-insensitive handling
 * 
 * This function standardizes boolean environment variable parsing across
 * the codebase, supporting various common boolean representations.
 * 
 * @param {string} varName - Environment variable name
 * @param {boolean} defaultValue - Default value if variable is missing
 * @returns {boolean} - Parsed boolean value
 */
function parseBooleanVar(varName, defaultValue = false) {
    debugEntry('parseBooleanVar', `${varName}, default: ${defaultValue}`);
    
    const rawValue = process.env[varName]; //undefined when not set
    if (!rawValue) {
        debugExit('parseBooleanVar', defaultValue);
        return defaultValue;
    }
    
    // Case-insensitive true detection
    const isTrue = /^true$/i.test(rawValue.trim()); //accepts TRUE/True/ true etc.
    
    debugExit('parseBooleanVar', isTrue);
    return isTrue;
}

/**
 * Validates that a string environment variable is non-empty
 * 
 * This function provides consistent string validation with optional
 * trimming and length constraints for security purposes.
 * 
 * @param {string} varName - Environment variable name
 * @param {string} defaultValue - Default value if variable is missing
 * @param {number} maxLength - Maximum allowed length (0 = no limit)
 * @returns {string} - Validated string value
 */
function parseStringVar(varName, defaultValue = '', maxLength = 0) {
    debugEntry('parseStringVar', `${varName}, default: ${defaultValue}, maxLength: ${maxLength}`);
    
    const rawValue = process.env[varName] || defaultValue; //fallback ensures defined string
    const trimmedValue = rawValue.trim(); //normalize spacing for validation
    
    // Apply length constraints for security
    if (maxLength > 0 && trimmedValue.length > maxLength) {
        const truncatedValue = trimmedValue.substring(0, maxLength);
        debugExit('parseStringVar', `truncated to ${maxLength} chars`);
        return truncatedValue;
    }
    
    debugExit('parseStringVar', `length: ${trimmedValue.length}`);
    return trimmedValue;
}

/**
 * Validates environment variable existence and provides detailed error context
 * 
 * This function enhances the basic environment validation with better error
 * messages and debugging information for troubleshooting configuration issues.
 * 
 * @param {string} varName - Environment variable name to check
 * @param {boolean} required - Whether the variable is required
 * @returns {boolean} - True if variable exists or is not required
 * @throws {Error} - If required variable is missing
 */
function validateEnvVar(varName, required = true) {
    debugEntry('validateEnvVar', `${varName}, required: ${required}`);
    
    const exists = process.env[varName] !== undefined; //true even for empty string
    const hasValue = exists && process.env[varName].trim().length > 0; //treat blanks as missing
    
    if (required && !hasValue) {
        const error = new Error(`Required environment variable ${varName} is missing or empty`);
        debugExit('validateEnvVar', 'missing required variable');
        throw error;
    }
    
    debugExit('validateEnvVar', hasValue ? 'valid' : 'optional missing');
    return hasValue;
}

/**
 * Module exports
 * 
 * These functions provide comprehensive environment variable processing
 * that can replace scattered validation logic throughout the codebase.
 * The functions are designed to be secure by default with proper bounds
 * checking and validation.
 */
module.exports = {
    parseIntWithBounds,    // Integer parsing with security bounds
    parseBooleanVar,       // Boolean parsing with case handling
    parseStringVar,        // String parsing with length limits
    validateEnvVar         // Existence validation with error context
};
