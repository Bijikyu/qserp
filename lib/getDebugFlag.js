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
 * 
 * LOGGING STRATEGY: This function logs its own execution to help debug the
 * debug system itself. This meta-debugging is useful when troubleshooting
 * why debug output is or isn't appearing.
 */
function getDebugFlag() {
        console.log(`getDebugFlag is running with ${process.env.DEBUG}`); //unconditional log so debug flag issues are visible
        try {
                // Convert env to string and normalize whitespace/case for strict check
                const flag = String(process.env.DEBUG).trim().toLowerCase() === 'true'; //compute strict equality boolean
                console.log(`getDebugFlag is returning ${flag}`); //log computed flag
                return flag; //return boolean
        } catch (err) {
                // Graceful fallback ensures debug system never breaks core functionality
                // Any error in debug flag evaluation defaults to no debugging
                console.log(`getDebugFlag returning false`); //log fallback on error
                return false; //fallback to false on error
        }
}

module.exports = { getDebugFlag }; //export function for reuse
