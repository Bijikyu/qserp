
/**
 * index.js - Main entry point for the qserp module
 * 
 * This file serves as the public interface for the qserp npm package.
 * It follows the common Node.js pattern of having a simple index.js that
 * re-exports functionality from the actual implementation in the lib/ directory.
 * 
 * This separation provides several benefits:
 * 1. Keeps the main directory clean with just the entry point
 * 2. Allows for complex internal structure without affecting the public API
 * 3. Makes it easy to refactor internal organization without breaking imports
 * 4. Follows npm package conventions that many developers expect
 * 
 * The module.exports line simply passes through all exports from lib/qserp.js,
 * making them available as if they were defined directly in this file.
 */

// Re-export all functionality from the main library file
// This indirection allows internal reorganization without breaking the public API
// Users can require('qserp') and get access to all exported functions
module.exports = require('./lib/qserp');
