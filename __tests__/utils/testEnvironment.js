/**
 * testEnvironment.js - Centralized test environment management for consistent setup
 * 
 * This utility consolidates the repeated beforeEach/afterEach patterns found across
 * 8+ test files. It provides a standardized approach to test isolation, environment
 * setup, and mock management that reduces code duplication and ensures consistency.
 * 
 * CONSOLIDATION RATIONALE: The pattern of saving environment, creating console spies,
 * resetting modules, and cleaning up appears in nearly every test file. Centralizing
 * this logic eliminates 50+ lines of duplicated setup code across the test suite.
 */

// Only require test utilities when actually in a Jest environment
let saveEnv, restoreEnv, mockConsole;

try {
    if (typeof jest !== 'undefined') {
        const testSetup = require('./testSetup');
        const consoleSpies = require('./consoleSpies');
        saveEnv = testSetup.saveEnv;
        restoreEnv = testSetup.restoreEnv;
        mockConsole = consoleSpies.mockConsole;
    }
} catch (error) {
    // Gracefully handle case where Jest utilities aren't available
    console.warn('Test utilities not available outside Jest environment');
}

/**
 * Test environment manager that handles complete test isolation setup
 * 
 * This class encapsulates all the common test setup patterns including environment
 * variable isolation, console spy management, module reset handling, and cleanup.
 * It provides a clean API for test files to achieve proper isolation.
 */
class TestEnvironment {
    constructor() {
        this.savedEnv = null;
        this.spies = new Map();
        this.mockModules = new Set();
        this.isSetup = false;
    }

    /**
     * Sets up complete test environment with isolation and spy management
     * 
     * This method handles all the common beforeEach setup patterns:
     * - Environment variable snapshot and restoration
     * - Console method spying for output testing
     * - Module cache clearing for fresh requires
     * - Mock module reacquisition after reset
     * 
     * @param {Object} options - Configuration options for setup
     * @param {string[]} options.consoleSpies - Console methods to spy on (e.g., ['warn', 'error'])
     * @param {string[]} options.mockModules - Module names to reacquire after reset
     * @param {Object} options.envVars - Environment variables to set for test
     * @returns {Object} - Object containing spy references and mock modules
     */
    setup(options = {}) {
        const {
            consoleSpies = [],
            mockModules = [],
            envVars = {}
        } = options;

        // Save current environment for restoration
        this.savedEnv = saveEnv();

        // Set test-specific environment variables
        Object.entries(envVars).forEach(([key, value]) => {
            process.env[key] = value;
        });

        // Create console spies for output verification
        consoleSpies.forEach(method => {
            const spy = mockConsole(method);
            this.spies.set(method, spy);
        });

        // Reset module cache to ensure fresh requires
        if (mockModules.length > 0) {
            jest.resetModules();
        }

        // Reacquire mock modules after reset
        const mocks = {};
        mockModules.forEach(moduleName => {
            mocks[moduleName] = require(moduleName);
            this.mockModules.add(moduleName);
        });

        this.isSetup = true;

        // Return spy and mock references for test use
        return {
            spies: Object.fromEntries(this.spies),
            mocks
        };
    }

    /**
     * Performs complete test cleanup including environment and spy restoration
     * 
     * This method handles all the common afterEach cleanup patterns:
     * - Environment variable restoration
     * - Console spy restoration
     * - Mock call history clearing
     * - State reset for next test
     */
    teardown() {
        if (!this.isSetup) {
            return;
        }

        // Restore original environment
        if (this.savedEnv) {
            restoreEnv(this.savedEnv);
            this.savedEnv = null;
        }

        // Restore console methods
        this.spies.forEach(spy => {
            spy.mockRestore();
        });
        this.spies.clear();

        // Clear all mock call history
        jest.clearAllMocks();

        // Reset state for next test
        this.mockModules.clear();
        this.isSetup = false;
    }

    /**
     * Gets a specific console spy for test assertions
     * 
     * @param {string} method - Console method name
     * @returns {jest.SpyInstance} - The Jest spy for the console method
     */
    getSpy(method) {
        return this.spies.get(method);
    }
}

/**
 * Factory function for creating test environment instances
 * 
 * This provides a convenient way to create isolated test environments
 * without needing to instantiate the class directly.
 * 
 * @returns {TestEnvironment} - New test environment instance
 */
function createTestEnvironment() {
    return new TestEnvironment();
}

/**
 * Simplified setup function for common test patterns
 * 
 * This function provides a one-liner setup for the most common test environment
 * patterns, reducing boilerplate even further for standard use cases.
 * 
 * @param {Object} options - Setup options (same as TestEnvironment.setup)
 * @returns {Object} - Object with teardown function and spy/mock references
 */
function setupStandardTest(options = {}) {
    const env = new TestEnvironment();
    const refs = env.setup(options);
    
    return {
        ...refs,
        teardown: () => env.teardown()
    };
}

module.exports = {
    TestEnvironment,
    createTestEnvironment,
    setupStandardTest
};