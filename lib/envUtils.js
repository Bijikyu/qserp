const qerrors = require('qerrors');

function safeEnvCall(fnName, fn, defaultVal, context) { //(introduce central helper for env calls)
        console.log(`${fnName} is running with ${context.varArr}`); //(initial log with variables)
        try { //(start protected execution)
                const result = fn(); //(execute provided logic)
                console.log(`${fnName} returning ${result}`); //(log result before return)
                return result; //(return successful result)
        } catch (error) { //(handle any error)
                qerrors(error, `${fnName} error`, context); //(log error context)
                console.log(`${fnName} returning ${defaultVal}`); //(log fallback value)
                return defaultVal; //(return fallback)
        }
}

function getMissingEnvVars(varArr) {
        return safeEnvCall('getMissingEnvVars', () => varArr.filter(name => !process.env[name]), [], {varArr}); //(delegate to safeEnvCall)
}

function throwIfMissingEnvVars(varArr) {
        return safeEnvCall('throwIfMissingEnvVars', () => { //(delegate to safeEnvCall)
                const missingArr = getMissingEnvVars(varArr); //(check env vars)
                if (missingArr.length > 0) { //(detect missing)
                        console.log(`throwIfMissingEnvVars has run resulting in a final value of ${missingArr}`); //(log before throw)
                        throw new Error(`Missing environment variables: ${missingArr.join(', ')}`); //(throw error)
                }
                return []; //(return empty array)
        }, [], {varArr}); //(context for error logs)
}

function warnIfMissingEnvVars(varArr, warnMsg) {
        return safeEnvCall('warnIfMissingEnvVars', () => { //(delegate to helper)
                if (getMissingEnvVars(varArr).length > 0) { //(check for missing)
                        console.warn(warnMsg); //(issue warn)
                        return false; //(missing variables)
                }
                return true; //(no warning needed)
        }, false, {varArr, warnMsg}); //(context for qerrors)
}

module.exports = { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars };
