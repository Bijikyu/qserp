/**
 * Converts DEBUG environment variable to boolean with case-insensitive handling
 * 
 * DESIGN RATIONALE: This function centralizes debug flag evaluation to ensure
 * consistent behavior across the entire codebase. Rather than having each module
 * interpret process.env.DEBUG differently, we standardize on case-insensitive
 * "true" matching with graceful fallback to false.
 * 
 * CHECK STRATEGY: String(process.env.DEBUG).trim().toLowerCase() === 'true'
 * performs a strict equality check after trimming whitespace and normalizing case.
 * This eliminates false positives from partial matches while still supporting
 * values like ' true ' or 'TRUE'.
 * 
 * ERROR HANDLING: The try-catch ensures that any unexpected issues with
 * environment variable access don't crash the application. Debug functionality
 * should never break core application flow.
 */
function getDebugFlag() { //reads DEBUG env once to produce boolean
        try {
                // Convert env to string and normalize whitespace/case for strict check
                const flag = String(process.env.DEBUG).trim().toLowerCase() === 'true'; //compute strict equality boolean
                return flag; //return boolean
        } catch (err) {
                // Graceful fallback ensures debug system never breaks core functionality
                // Any error in debug flag evaluation defaults to no debugging
                return false; //fallback to false on error
        }
}

module.exports = { getDebugFlag }; //export function for reuse
