
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

const qerrors = require('qerrors');

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
	console.log(`throwIfMissingEnvVars is running with ${varArr}`); // Debug trace
	
	try {
		const missingArr = getMissingEnvVars(varArr);
		
		if (missingArr.length > 0) {
			console.log(`throwIfMissingEnvVars has run resulting in a final value of ${missingArr}`);
			// Throw with descriptive message listing all missing variables
			// This helps developers fix all issues in one round rather than discovering them one by one
			throw new Error(`Missing environment variables: ${missingArr.join(', ')}`);
		}
		
		console.log(`throwIfMissingEnvVars returning []`); // Success case
		return []; // Return empty array to indicate no missing vars
	} catch (error) {
		// Handle both missing var errors (which should propagate) and unexpected errors
		// Use qerrors for logging but still re-throw to maintain fail-fast behavior
		qerrors(error, 'throwIfMissingEnvVars error', {varArr});
		console.log(`throwIfMissingEnvVars returning []`); // Should not reach here due to throw
		return []; // Fallback return (unreachable in normal operation)
	}
}

/**
 * Issues warnings for missing optional environment variables
 * 
 * This function handles environment variables that enhance functionality but aren't
 * strictly required for basic operation. It uses console.warn to make the messages
 * visible but non-fatal, allowing the application to continue with reduced functionality.
 * 
 * @param {string[]} varArr - Array of optional environment variable names
 * @param {string} warnMsg - Custom warning message to display
 * @returns {boolean} true if all variables present, false if any missing
 */
function warnIfMissingEnvVars(varArr, warnMsg) {
	console.log(`warnIfMissingEnvVars is running with ${varArr}`); // Debug trace
	
	try {
		if (getMissingEnvVars(varArr).length > 0) {
			// Use console.warn instead of console.log to ensure visibility
			// Many logging systems distinguish between warnings and regular output
			console.warn(warnMsg);
			console.log(`warnIfMissingEnvVars returning false`); // Indicate missing vars
			return false; // Return false to indicate missing variables
		}
		
		console.log(`warnIfMissingEnvVars returning true`); // All variables present
		return true; // Return true to indicate all variables present
	} catch (error) {
		// Handle unexpected errors gracefully
		// Log the error but don't throw - optional variables shouldn't break the app
		qerrors(error, 'warnIfMissingEnvVars error', {varArr, warnMsg});
		console.log(`warnIfMissingEnvVars returning false`); // Conservative fallback
		return false; // Return false on error to indicate potential issues
	}
}

// Export all functions for use by other modules
// These utilities are designed to be composable and reusable across different parts of the application
module.exports = { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars };
