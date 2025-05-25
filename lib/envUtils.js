const qerrors = require('qerrors');

function getMissingEnvVars(varArr) {
        console.log(`getMissingEnvVars is running with ${varArr}`); //added log per style
        try {
                const missingArr = varArr.filter(name => !process.env[name]);
                console.log(`getMissingEnvVars returning ${missingArr}`); //current return log
                return missingArr;
        } catch (error) {
                qerrors(error, 'getMissingEnvVars error', {varArr}); //added qerrors usage
                console.log(`getMissingEnvVars returning []`); //return on error
                return [];
        }
}

function throwIfMissingEnvVars(varArr) {
        console.log(`throwIfMissingEnvVars is running with ${varArr}`); //added start log
        try {
                const missingArr = getMissingEnvVars(varArr);
                if (missingArr.length > 0) {
                        console.log(`throwIfMissingEnvVars has run resulting in a final value of ${missingArr}`); //log before throw
                        throw new Error(`Missing environment variables: ${missingArr.join(', ')}`);
                }
                console.log(`throwIfMissingEnvVars returning []`); //no vars missing
                return [];
        } catch (error) {
                qerrors(error, 'throwIfMissingEnvVars error', {varArr}); //error logging
                console.log(`throwIfMissingEnvVars returning []`); //return on error
                return [];
        }
}

function warnIfMissingEnvVars(varArr, warnMsg) {
        console.log(`warnIfMissingEnvVars is running with ${varArr}`); //start log
        try {
                if (getMissingEnvVars(varArr).length > 0) {
                        console.warn(warnMsg);
                        console.log(`warnIfMissingEnvVars returning false`); //warn issued
                        return false;
                }
                console.log(`warnIfMissingEnvVars returning true`); //no warning
                return true;
        } catch (error) {
                qerrors(error, 'warnIfMissingEnvVars error', {varArr, warnMsg}); //error logging
                console.log(`warnIfMissingEnvVars returning false`); //return on error
                return false;
        }
}

module.exports = { getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars };
