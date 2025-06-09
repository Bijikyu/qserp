function getDebugFlag() {
        const envValue = process.env.DEBUG; //capture DEBUG env value for checks
        const debugFlag = /true/i.test(envValue); //determine debug boolean from env
        if (debugFlag) { console.log(`getDebugFlag is running with ${envValue}`); } //log start only when debug
        try {
                if (debugFlag) { console.log(`getDebugFlag is returning ${debugFlag}`); } //log result when debug
                return debugFlag; //return computed flag
        } catch (err) {
                if (debugFlag) { console.log(`getDebugFlag returning false`); } //log fallback when debug
                return false; //fallback to false on error
        }
}

module.exports = { getDebugFlag }; //export function for reuse
