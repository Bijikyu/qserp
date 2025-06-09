function getDebugFlag() {
        console.log(`getDebugFlag is running with ${process.env.DEBUG}`); //log start with current DEBUG env
        try {
                const flag = /true/i.test(process.env.DEBUG); //compute case-insensitive boolean
                console.log(`getDebugFlag is returning ${flag}`); //log computed flag
                return flag; //return boolean
        } catch (err) {
                console.log(`getDebugFlag returning false`); //log fallback on error
                return false; //fallback to false on error
        }
}

module.exports = { getDebugFlag }; //export function for reuse
