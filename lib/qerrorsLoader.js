/**
 * qerrorsLoader.js - Utility to obtain the qerrors function regardless of export style
 *
 * This loader normalizes the export shape of the qerrors dependency, which may
 * be exported as a default or named property. It returns the callable function
 * so that importing modules don't repeat this logic.
 */

function loadQerrors() {
        console.log(`loadQerrors is running with ${JSON.stringify(Object.keys(require('qerrors')))}?`); //debug module keys
        try {
                const mod = require('qerrors'); //import qerrors module
                const qerrors = typeof mod === 'function' ? mod : mod.qerrors || mod.default; //resolve exported function
                console.log(`loadQerrors returning ${qerrors.name}`); //log selected function name
                return qerrors; //return callable qerrors function
        } catch (error) {
                console.error(error); //log loader failure
                throw error; //re-throw loader error
        }
}

module.exports = loadQerrors; //export loader

