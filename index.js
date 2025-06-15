
/**
 * Entry point for the qserp package.
 * RATIONALE: Keeps the root clean and allows internal refactoring while exposing
 * the same public API. Requiring this file triggers initialization logic inside
 * lib/qserp.js so consumers don't need to know internal paths.
 */

// Re-export all functionality from the main library file
// This indirection allows internal reorganization without breaking the public API
// Users can require('qserp') and get access to all exported functions
// RATIONALE: Direct delegation preserves all export metadata and ensures identical
// behavior to importing lib/qserp.js directly, while maintaining the standard
// npm package structure consumers expect
module.exports = require('./lib/qserp'); // expose all library exports
