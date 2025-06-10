/**
 * qerrorsLoader.js - Utility to obtain the qerrors function regardless of export style
 *
 * This loader normalizes the export shape of the qerrors dependency, which may
 * be exported as a default or named property. It returns the callable function
 * so that importing modules don't repeat this logic.
 * 
 * COMPATIBILITY RATIONALE: Different versions of the qerrors module may export
 * their functionality in different ways - sometimes as module.exports = function,
 * sometimes as module.exports = { qerrors: function }, and sometimes using
 * ES6 default exports. This loader abstracts those differences.
 * 
 * CENTRALIZATION BENEFIT: By handling export resolution in one place, we avoid
 * duplicating this logic across multiple files that need qerrors functionality.
 * This also makes it easier to update if the qerrors export pattern changes.
 * 
 * ERROR STRATEGY: The loader throws on failure rather than returning a fallback
 * because qerrors is critical for structured error reporting throughout the
 * application. A broken qerrors would silently degrade error handling quality.
 */

const { logStart, logReturn } = require('./logUtils'); //import standardized logging utilities

/**
 * Loads and normalizes the qerrors function from the qerrors module
 * 
 * EXPORT RESOLUTION STRATEGY: Uses a cascading approach to handle different
 * export patterns. First checks if the module itself is a function (direct export),
 * then checks for named exports (mod.qerrors), then ES6 default exports (mod.default).
 * 
 * VALIDATION LOGIC: After resolving the export, validates that the result is
 * actually a callable function. This prevents runtime errors later when other
 * modules attempt to call qerrors().
 * 
 * ERROR PROPAGATION: Throws rather than returning null/undefined because qerrors
 * is essential infrastructure. Failing fast here prevents subtle bugs where
 * error reporting silently stops working.
 */
function loadQerrors() {
        logStart('loadQerrors', 'qerrors module'); //log start before require
        try {
                const mod = require('qerrors'); //import qerrors module
                
                // Resolve function from various possible export patterns
                // This handles: module.exports = fn, module.exports = {qerrors: fn}, export default fn
                const qerrors = typeof mod === 'function' ? mod : mod.qerrors || mod.default; //resolve exported function
                
                // Validate that we successfully extracted a callable function
                // This prevents runtime errors when other modules try to call qerrors()
                if (typeof qerrors !== 'function') { //verify resolved export is callable
                        throw new Error('qerrors module does not export a callable function'); //throw explicit error when export invalid
                }
                
                logReturn('loadQerrors', qerrors.name); //log selected function name
                return qerrors; //return callable qerrors function
        } catch (error) {
                // Log the failure for debugging but re-throw to fail fast
                // This ensures that module loading issues are immediately visible
                console.error(error); //log loader failure
                throw error; //re-throw loader error
        }
}

module.exports = loadQerrors; //export loader

