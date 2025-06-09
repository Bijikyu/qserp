/**
 * qerrorsLoader.js - Utility to obtain the qerrors function regardless of export style
 *
 * This loader normalizes the export shape of the qerrors dependency, which may
 * be exported as a default or named property. It returns the callable function
 * so that importing modules don't repeat this logic.
 */

const { logStart, logReturn } = require('./logUtils'); //import standardized logging utilities
const { getDebugFlag } = require('./getDebugFlag'); //import debug flag utility for conditional logs
const DEBUG = getDebugFlag(); //determine current debug state

function loadQerrors() {
        if (DEBUG) { logStart('loadQerrors', 'qerrors module'); } //log start when debug
        try {
                const mod = require('qerrors'); //import qerrors module
                const qerrors = typeof mod === 'function' ? mod : mod.qerrors || mod.default; //resolve exported function
                if (typeof qerrors !== 'function') { //verify resolved export is callable
                        throw new Error('qerrors module does not export a callable function'); //throw explicit error when export invalid
                }
                if (DEBUG) { logReturn('loadQerrors', qerrors.name); } //log function name when debug
                return qerrors; //return callable qerrors function
        } catch (error) {
                console.error(error); //log loader failure
                throw error; //re-throw loader error
        }
}

module.exports = loadQerrors; //export loader

