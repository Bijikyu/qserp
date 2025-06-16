
/**
 * constants.js - Centralized configuration constants for environment variables
 * 
 * This module defines which environment variables are required vs optional for the qserp module.
 * Centralizing these definitions in one place provides several benefits:
 * 
 * 1. Single source of truth - prevents inconsistencies across the codebase
 * 2. Easy maintenance - adding new env vars only requires updating this file
 * 3. Clear documentation - developers can see all configuration requirements at a glance
 * 4. Testability - tests can import these constants to verify validation logic
 * 
 * The separation between REQUIRED_VARS and OPTIONAL_VARS allows for different
 * handling strategies: required variables cause startup failure, optional variables
 * generate warnings but allow graceful degradation.
 */

/**
 * Required environment variables for core functionality
 * 
 * These variables are absolutely essential for the qserp module to function.
 * Missing any of these will cause the module to throw an error during initialization.
 * 
 * GOOGLE_API_KEY: Authentication token for Google Custom Search API
 * - Without this, no API calls can be made
 * - Obtained from Google Cloud Console
 * - Should be kept secret and not logged
 * 
 * GOOGLE_CX: Custom Search Engine ID that defines search scope and behavior
 * - Determines which sites/content are searched
 * - Configured at Google Programmable Search Engine
 * - Each CX represents a different search configuration
 */
const REQUIRED_VARS = ['GOOGLE_API_KEY', 'GOOGLE_CX'];

/**
 * Optional environment variables for enhanced functionality
 * 
 * These variables enable additional features but are not required for basic operation.
 * Missing these will generate warnings but won't prevent the module from working.
 * 
 * OPENAI_TOKEN: API key for OpenAI services used by the qerrors dependency
 * - Enables AI-enhanced error analysis and reporting
 * - Without this, qerrors falls back to basic error logging
 * - Not directly used by qserp but required by the qerrors dependency
 * 
 * The rationale for making this optional:
 * - qserp's core search functionality doesn't depend on AI error analysis
 * - Developers should be able to use qserp even without OpenAI access
 * - Error logging will still work, just without AI enhancement
 */
const OPTIONAL_VARS = ['OPENAI_TOKEN', 'GOOGLE_REFERER']; //referer header optional for custom analytics


/**
 * Module exports
 * 
 * These constants are exported for use by environment validation functions
 * and tests. By exporting arrays rather than individual strings, we make
 * it easy for validation functions to process multiple variables at once.
 * 
 * The naming convention (REQUIRED_VARS, OPTIONAL_VARS) clearly indicates
 * the criticality level and expected handling for each group.
 */
module.exports = {
        REQUIRED_VARS,  // Critical variables that must be present
        OPTIONAL_VARS   // Enhancing variables that improve functionality but aren't essential
};
