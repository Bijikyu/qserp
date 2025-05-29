function logStart(fnName, details) { //helper to standardize start logs
        console.log(`${fnName} is running with ${details}`); //log start message
}

function logReturn(fnName, result) { //helper to standardize return logs
        console.log(`${fnName} returning ${result}`); //log return message
}

module.exports = { logStart, logReturn }; //export helpers at bottom
