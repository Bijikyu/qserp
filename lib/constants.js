
/**
 * constants.js - Environment variable definitions and categorization
 * 
 * This module centralizes the definition of which environment variables are required
 * versus optional for the qserp module. This separation allows for different handling
 * strategies - required variables cause startup failure while optional ones only generate warnings.
 * 
 * Centralizing these definitions in a constants file rather than hardcoding them throughout
 * the codebase makes it easier to maintain and modify the requirements as the module evolves.
 */

/**
 * Required environment variables that are absolutely necessary for basic functionality
 * 
 * GOOGLE_API_KEY: Required for authenticating with Google's Custom Search API
 *                Without this, no search requests can be made
 * 
 * GOOGLE_CX: Custom Search Engine ID that defines the search scope and configuration
 *           Without this, Google doesn't know which search engine to use
 * 
 * These variables are checked at module startup and will cause the application to fail
 * immediately if missing, following the "fail fast" principle.
 */
const REQUIRED_VARS = ['GOOGLE_API_KEY', 'GOOGLE_CX'];

/**
 * Optional environment variables that enhance functionality but aren't strictly required
 * 
 * OPENAI_TOKEN: Used by the qerrors dependency for AI-enhanced error analysis and reporting
 *              The module can function without this, but error reporting will be less sophisticated
 * 
 * These variables are checked at startup but only generate warnings if missing,
 * allowing the application to continue with reduced functionality.
 */
const OPTIONAL_VARS = ['OPENAI_TOKEN'];

// Export both arrays for use by environment validation utilities
// This allows other modules to import and use these definitions consistently
module.exports = { REQUIRED_VARS, OPTIONAL_VARS };
