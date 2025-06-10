
/**
 * index.js - Main entry point for the qserp module
 * 
 * This file serves as the public interface for the qserp npm package.
 * It follows the common Node.js pattern of having a simple index.js that
 * re-exports functionality from the actual implementation in the lib/ directory.
 * 
 * DESIGN RATIONALE: The proxy pattern implemented here provides several critical benefits:
 * 1. Keeps the main directory clean with just the entry point
 * 2. Allows for complex internal structure without affecting the public API
 * 3. Makes it easy to refactor internal organization without breaking imports
 * 4. Follows npm package conventions that many developers expect
 * 5. Enables future addition of cross-cutting concerns (validation, logging) at the entry point
 * 
 * ALTERNATIVE CONSIDERED: We could implement all functionality directly in index.js,
 * but this would make the file unwieldy and harder to test individual components.
 * The lib/ organization pattern scales better as the codebase grows.
 * 
 * IMPORT STRATEGY: Direct require() delegation means any environment validation or
 * initialization logic in lib/qserp.js will execute when this module is required.
 * This ensures proper setup occurs automatically without additional consumer steps.
 * 
 * The module.exports line simply passes through all exports from lib/qserp.js,
 * making them available as if they were defined directly in this file.
 */

// Re-export all functionality from the main library file
// This indirection allows internal reorganization without breaking the public API
// Users can require('qserp') and get access to all exported functions
// RATIONALE: Direct delegation preserves all export metadata and ensures identical
// behavior to importing lib/qserp.js directly, while maintaining the standard
// npm package structure consumers expect
module.exports = require('./lib/qserp');
