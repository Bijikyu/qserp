const { safeRun } = require('./utils'); //import shared safeRun utility

function safeEnvCall(fnName, fn, defaultVal, context) { //(wrap env calls safely)
        console.log(`safeEnvCall is running with ${fnName}`); //(initial log for wrapper)
        const res = safeRun(fnName, fn, defaultVal, context); //(use shared utility)
        console.log(`safeEnvCall returning ${res}`); //(log final result)
        return res; //(return result from safeRun)
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
