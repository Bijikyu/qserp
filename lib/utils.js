const qerrors = require('qerrors'); //import qerrors for error handling
const { logStart, logReturn } = require('./logUtils'); //import log helpers

function safeRun(fnName, fn, defaultVal, context) { //add shared safe executor
        logStart('safeRun', JSON.stringify({ fnName, context })); //log input via util
        try { //begin try
                const result = fn(); //execute callback
                logReturn('safeRun', result); //log result via util
                return result; //return successful result
        } catch (error) { //catch errors
                qerrors(error, `${fnName} error`, context); //report with qerrors
                logReturn('safeRun', defaultVal); //log fallback via util
                return defaultVal; //return fallback value
        }
}

module.exports = { safeRun }; //export utility
