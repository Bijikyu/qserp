
/**
 * minLogger.js - Minimal logging utility honoring LOG_LEVEL env
 *
 * Provides simple warn and error logging that can be disabled via environment
 * configuration. LOG_LEVEL accepts 'info', 'warn', 'error', or 'silent'.
 * 
 * DESIGN PHILOSOPHY: This module implements a lightweight logging system that
 * respects production environment constraints. Unlike full logging frameworks,
 * it focuses solely on warn/error output with simple level-based filtering.
 * 
 * LEVEL HIERARCHY RATIONALE: Lower numbers = higher priority messages that
 * should be shown more often. Error (0) is always shown unless silent,
 * warn (1) is shown unless error-only or silent, etc. This follows standard
 * logging conventions where more severe messages have precedence.
 * 
 * ENVIRONMENT INTEGRATION: The LOG_LEVEL environment variable allows operators
 * to control verbosity without code changes, enabling different logging
 * behavior in development vs production environments.
 */

// Numerical ranking system for log levels (lower = higher priority)
// This ordering ensures that error messages are shown in more restrictive
// environments than warning messages, following standard logging practices
const levelRank = { error: 0, warn: 1, info: 2, silent: 3 }; //rank map for levels
const util = require('util'); //use util.inspect when JSON.stringify fails

// Check if info level logging is allowed for trace messages //rationale: avoid noisy logs when not needed
function canLogInfo() {
        const envLvl = String(process.env.LOG_LEVEL || 'info').trim().toLowerCase(); //normalize env var trimming spaces
        return envLvl === 'info'; //only true when env requests info verbosity
}

/**
 * Determines if a message at the given level should be logged
 * 
 * COMPARISON LOGIC: Uses numerical comparison where requested level must be
 * less than or equal to the configured environment level. This means requesting
 * 'error' (0) will be allowed when LOG_LEVEL='warn' (1), but requesting
 * 'warn' (1) will be blocked when LOG_LEVEL='error' (0).
 * 
 * FALLBACK BEHAVIOR: Any error in level comparison defaults to blocking
 * the log message. This fail-safe approach prevents unexpected log spam
 * if environment variables contain invalid values.
 */
function shouldLog(level) {
        if (canLogInfo()) console.log(`shouldLog is running with ${level}`); //trace function start when allowed
        try {
                // LEVEL VALIDATION FIX: Check if level exists before array access
                // This prevents undefined comparison when invalid levels are passed
                if (!(level in levelRank)) {
                        if (canLogInfo()) console.log(`shouldLog invalid level: ${level}, returning false`); //only show when info allowed
                        return false; // Invalid levels are not allowed
                }

                // Convert environment variable to lowercase for case-insensitive matching
                // Default to 'info' if LOG_LEVEL is not set, providing reasonable verbosity
                const envLevel = String(process.env.LOG_LEVEL || 'info').trim().toLowerCase(); //get env level and remove spaces

                // Block all logs when LOG_LEVEL is silent
                if (envLevel === 'silent') { //explicit silent mode check
                        if (canLogInfo()) console.log(`shouldLog LOG_LEVEL silent, returning false`); //trace silent handling
                        if (canLogInfo()) console.log(`shouldLog is returning false`); //trace return value
                        return false; //no logging when silent
                }

                // Validate environment level exists in our ranking system
                if (!(envLevel in levelRank)) {
                        if (canLogInfo()) console.log(`shouldLog invalid env level: ${envLevel}, returning false`); //reject unknown
                        if (canLogInfo()) console.log(`shouldLog is returning false`); //trace return value
                        return false; //invalid level disables output
                }

                // Compare numerical rankings to determine if level is allowed
                // Lower-numbered (higher priority) levels are allowed in higher-numbered environments
                const result = levelRank[level] <= levelRank[envLevel]; //determine allowance
                if (canLogInfo()) console.log(`shouldLog is returning ${result}`); //trace result when allowed
                return result; //return boolean decision
        } catch (err) {
                // Fail safe: any error in level evaluation blocks logging
                // This prevents unexpected behavior from malformed environment variables
                if (canLogInfo()) console.log(`shouldLog returning false`); //trace failure path when allowed
                return false; //default to no log on error
        }
}

// Formats any message into a readable string for logging //ensures objects are serialized
function normalizeMsg(msg) {
        if (shouldLog('info')) console.log(`normalizeMsg is running with ${msg}`); //trace start
        try {
                let formatted; //holder for output string
                if (typeof msg === 'string') { //message already string
                        formatted = msg; //no change needed
                } else if (typeof msg === 'object') { //object requires serialization
                        try {
                                formatted = JSON.stringify(msg); //attempt JSON serialization
                        } catch (jsonErr) {
                                formatted = util.inspect(msg); //fallback to util.inspect
                        }
                } else {
                        formatted = String(msg); //primitive conversion for numbers/booleans
                }
                if (shouldLog('info')) console.log(`normalizeMsg is returning ${formatted}`); //trace end
                return formatted; //return processed string
        } catch (err) {
                if (shouldLog('info')) console.log(`normalizeMsg returning ${String(msg)}`); //trace failure fallback
                return String(msg); //ensure string on failure
        }
}

/**
 * Logs warning messages when LOG_LEVEL permits
 * 
 * DESIGN PATTERN: Delegates level checking to shouldLog() for consistency
 * across all logging functions. This ensures that level comparison logic
 * is centralized and uniform.
 * 
 * OUTPUT CHOICE: Uses console.warn() which typically displays in yellow
 * in most terminal environments, providing visual distinction from regular
 * console.log() output.
 * 
 * ERROR RESILIENCE: Any exception during warning output is caught and
 * reported via the return value rather than being thrown. This ensures
 * that logging issues never crash the application.
 */
function logWarn(msg) {
        if (shouldLog('info')) console.log(`logWarn is running with ${msg}`); //trace run with message when allowed
        try {
                // Check if warning level is allowed by current LOG_LEVEL setting
                // This delegation ensures consistent level handling across all log functions
                if (shouldLog('warn')) { //respect LOG_LEVEL for warnings
                        console.warn(normalizeMsg(msg)); //serialize message before warn
                }
                if (shouldLog('info')) console.log(`logWarn is returning true`); //trace successful end when allowed
                return true; //confirm execution
        } catch (err) {
                // Any error in warning output is contained and reported
                // This prevents logging failures from disrupting application flow
                if (shouldLog('info')) console.log(`logWarn returning false`); //trace failure path when allowed
                return false; //indicate failure
        }
}

/**
 * Logs error messages when LOG_LEVEL permits
 * 
 * CRITICAL MESSAGE HANDLING: Error messages are the highest priority
 * in the logging hierarchy and will be shown unless LOG_LEVEL is set
 * to 'silent'. This ensures important error information reaches operators.
 * 
 * OUTPUT METHOD: Uses console.error() which typically displays in red
 * and may be directed to stderr in some environments, making errors
 * more visible and allowing separate handling by log aggregation systems.
 * 
 * RELIABILITY: The try-catch pattern ensures that even if error logging
 * itself fails, the application continues running and reports the failure
 * through the return value.
 */
function logError(msg) {
        if (shouldLog('info')) console.log(`logError is running with ${msg}`); //trace run with message when allowed
        try {
                // Check if error level is allowed (should be true unless LOG_LEVEL='silent')
                // This maintains consistency with the level checking pattern
                if (shouldLog('error')) { //respect LOG_LEVEL for errors
                        console.error(normalizeMsg(msg)); //serialize message before error
                }
                if (shouldLog('info')) console.log(`logError is returning true`); //trace successful end when allowed
                return true; //confirm execution
        } catch (err) {
                // Handle the rare case where error logging itself fails
                // This prevents infinite error loops and maintains application stability
                if (shouldLog('info')) console.log(`logError returning false`); //trace failure path when allowed
                return false; //indicate failure
        }
}

module.exports = { logWarn, logError }; //export logging functions
