
/**
 * minLogger.js - Minimal logging utility honoring LOG_LEVEL env
 *
 * Provides simple warn and error logging that can be disabled via environment
 * configuration. LOG_LEVEL accepts 'info', 'warn', 'error', or 'silent'.
 */

const levelRank = { error: 0, warn: 1, info: 2, silent: 3 }; //rank map for levels

function shouldLog(level) {
        console.log(`shouldLog is running with ${level}`); //trace function start
        try {
                const envLevel = String(process.env.LOG_LEVEL || 'info').toLowerCase(); //get env level
                const result = levelRank[level] <= levelRank[envLevel]; //determine allowance
                console.log(`shouldLog is returning ${result}`); //trace result
                return result; //return boolean decision
        } catch (err) {
                console.log(`shouldLog returning false`); //trace failure path
                return false; //default to no log on error
        }
}

function logWarn(msg) {
        console.log(`logWarn is running with ${msg}`); //trace run with message
        try {
                if (shouldLog('warn')) { //respect LOG_LEVEL for warnings
                        console.warn(msg); //emit warning when allowed
                }
                console.log(`logWarn is returning true`); //trace successful end
                return true; //confirm execution
        } catch (err) {
                console.log(`logWarn returning false`); //trace failure path
                return false; //indicate failure
        }
}

function logError(msg) {
        console.log(`logError is running with ${msg}`); //trace run with message
        try {
                if (shouldLog('error')) { //respect LOG_LEVEL for errors
                        console.error(msg); //emit error when allowed
                }
                console.log(`logError is returning true`); //trace successful end
                return true; //confirm execution
        } catch (err) {
                console.log(`logError returning false`); //trace failure path
                return false; //indicate failure
        }
}

module.exports = { logWarn, logError }; //export logging functions
