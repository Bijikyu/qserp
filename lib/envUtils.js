
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

const qerrors = require('qerrors'); // Import qerrors for structured error logging

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
	console.log(`getMissingEnvVars is running with ${varArr}`); // Debug log for tracing execution
	
	try {
		// Filter returns only variables that are undefined or empty
		// process.env[name] is undefined for missing vars, empty string for set-but-empty vars
		// Both cases are treated as "missing" since empty env vars are rarely useful
		const missingArr = varArr.filter(name => !process.env[name]);
		
		console.log(`getMissingEnvVars returning ${missingArr}`); // Log results for debugging
		return missingArr;
	} catch (error) {
		// Error handling for unexpected failures (e.g., varArr not being an array)
		// Use qerrors for structured logging with context about what was being checked
		qerrors(error, 'getMissingEnvVars error', {varArr});
		console.log(`getMissingEnvVars returning []`); // Safe fallback on error
		return []; // Return empty array to prevent downstream errors
	}
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
	console.log(`throwIfMissingEnvVars is running with ${varArr}`); // Debug log for tracing execution
	
	try {
		// Get list of missing variables using our utility function
		// This centralizes the checking logic and ensures consistency
		const missingEnvVars = getMissingEnvVars(varArr);
		
		if (missingEnvVars.length > 0) {
			// Create comprehensive error message that lists all missing variables
			// This helps developers fix all issues at once rather than one-by-one
			const errorMessage = `Missing required environment variables: ${missingEnvVars.join(', ')}`;
			
			// Log the missing variables for debugging before throwing
			// This ensures the information is captured even if the error is caught elsewhere
			console.error(errorMessage);
			
			// Throw error to halt execution - required variables are non-negotiable
			// The application cannot function properly without these variables
			throw new Error(errorMessage);
		}
		
		console.log(`throwIfMissingEnvVars has run resulting in a final value of ${missingEnvVars}`);
		return missingEnvVars; // Return empty array when all variables are present (useful for testing)
		
	} catch (error) {
		// Handle both our intentionally thrown errors and unexpected errors
		// Unexpected errors (like varArr being invalid) should be logged but still halt execution
		qerrors(error, 'throwIfMissingEnvVars error', {varArr});
		
		// Re-throw the error because missing required env vars should always halt execution
		// This ensures the application doesn't continue in a broken state
		throw error;
	}
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
	console.log(`warnIfMissingEnvVars is running with ${varArr}`); // Debug log for tracing execution
	
	try {
		// Reuse our core missing variable detection logic
		// This ensures consistent behavior across all validation functions
		const missingEnvVars = getMissingEnvVars(varArr);
		
		if (missingEnvVars.length > 0) {
			// Use custom message if provided, otherwise create standard warning
			// Custom messages allow for more specific guidance about what functionality will be affected
			const warningMessage = customMessage || 
				`Warning: Optional environment variables missing: ${missingEnvVars.join(', ')}. Some features may not work as expected.`;
			
			// Use console.warn to indicate this is concerning but not fatal
			// This distinguishes from console.error which suggests a critical problem
			console.warn(warningMessage);
		}
		
                const result = missingEnvVars.length === 0; //determine if any vars missing //(compute boolean)
                console.log(`warnIfMissingEnvVars returning ${result}`); // Log boolean result for debugging
                return result; //inform caller if all vars present //(boolean instead of array)
		
	} catch (error) {
		// Error handling for unexpected failures
		// Even if warning fails, we shouldn't halt execution for optional variables
		qerrors(error, 'warnIfMissingEnvVars error', {varArr, customMessage});
                console.log(`warnIfMissingEnvVars returning false`); // Safe fallback on error
                return false; //Return false on error to indicate failure //(boolean result)
        }
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
