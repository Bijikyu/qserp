
/**
 * logUtils.js - DEPRECATED: Use lib/debugUtils.js instead
 * 
 * DEPRECATION NOTICE: This module has been consolidated into lib/debugUtils.js
 * to eliminate code duplication and provide a single source of truth for logging.
 * 
 * MIGRATION: Replace imports with:
 * const { logStart, logReturn } = require('./debugUtils');
 * 
 * This module now re-exports from debugUtils for backward compatibility
 * but will be removed in a future version.
 */

// Re-export consolidated functions from debugUtils for backward compatibility
const { logStart, logReturn } = require('./debugUtils'); //delegate to new implementation

module.exports = { 
        logStart,   // Re-exported from debugUtils
        logReturn   // Re-exported from debugUtils
};
