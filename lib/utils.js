const qerrors = require('qerrors'); //import qerrors for error handling

function safeRun(fnName, fn, defaultVal, context) { //add shared safe executor
        console.log(`safeRun is running with ${JSON.stringify({fnName, context})}`); //log input
        try { //begin try
                const result = fn(); //execute callback
                console.log(`safeRun returning ${result}`); //log result
                return result; //return successful result
        } catch (error) { //catch errors
                qerrors(error, `${fnName} error`, context); //report with qerrors
                console.log(`safeRun returning ${defaultVal}`); //log fallback
                return defaultVal; //return fallback value
        }
}

module.exports = { safeRun }; //export utility
