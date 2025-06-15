/**
 * testSetup.js - Shared test utilities for consistent test environment setup
 * 
 * This module provides reusable functions for setting up test environments with
 * proper mocks, environment variables, and cleanup procedures. The centralized
 * approach ensures all tests have consistent setup and reduces duplication.
 * 
 * JEST MOCK STRATEGY: Top-level jest.mock() calls are required by Jest's hoisting
 * behavior. These mocks must be defined before any require() statements that might
 * load the mocked modules. The mock references are stored in variables for later
 * configuration in individual tests.
 * 
 * ENVIRONMENT ISOLATION: Each test needs a clean environment state to prevent
 * cross-test contamination. The save/restore pattern ensures tests don't interfere
 * with each other's environment variable modifications.
 */

const { logStart, logReturn } = require('../../lib/logUtils'); //import log helpers

// Prepare top level mocks without closures to comply with Jest restrictions
// JEST HOISTING REQUIREMENT: Jest hoists jest.mock() calls to the top of the file
// before any other code executes. These variables store references to the mocked
// functions so individual tests can configure their behavior.
let scheduleMock; //Bottleneck schedule spy reference for rate limiting tests
jest.mock('bottleneck', () => jest.fn()); //mock Bottleneck constructor as jest function

let qerrorsMock; //qerrors spy reference for error handling tests
jest.mock('qerrors', () => jest.fn()); //mock qerrors as jest function

/**
 * Sets up standard test environment variables for qserp module testing
 * 
 * STANDARD VALUES RATIONALE: Uses simple, recognizable test values that are
 * clearly fake but satisfy the module's validation requirements. This prevents
 * accidental use of real API keys in tests while providing predictable values
 * for test assertions.
 * 
 * ENVIRONMENT SCOPE: Sets all required and optional environment variables to
 * ensure tests have a complete, valid configuration. This prevents test failures
 * due to missing environment variables in different test environments.
 */
function setTestEnv() {
  logStart('setTestEnv', 'default values'); //initial log via util
  // Set required environment variables for Google API integration
  process.env.GOOGLE_API_KEY = 'key'; //set common api key (simple test value)
  process.env.GOOGLE_CX = 'cx'; //set common cx id (simple test value)
  // Set optional environment variables to prevent warning messages in tests
  process.env.OPENAI_TOKEN = 'token'; //set common openai token (prevents warnings)
  process.env.GOOGLE_REFERER = 'http://example.com'; //set referer for header tests
  logReturn('setTestEnv', true); //final log via util
  return true; //confirm env set
}

/**
 * Captures current environment state for later restoration
 * 
 * ISOLATION STRATEGY: Creates a shallow copy of process.env to preserve the
 * environment state before test modifications. This enables complete restoration
 * after tests complete, preventing cross-test contamination.
 * 
 * SECURITY CONSIDERATION: Logs mask the actual environment data since it may
 * contain sensitive information like API keys. Only confirms that the operation
 * completed without exposing the captured values.
 */
function saveEnv() { //(capture current process.env)
  logStart('saveEnv', 'none'); //initial log via util
  // Create shallow copy of entire environment to preserve original state
  // Spread operator creates new object with all enumerable properties copied
  const savedEnv = { ...process.env }; //copy environment vars
  logReturn('saveEnv', 'env stored'); //final log via util //(mask env data)
  return savedEnv; //return copy
}

/**
 * Restores environment to previously saved state
 * 
 * COMPLETE RESTORATION APPROACH: First clears all current environment variables,
 * then restores the saved state. This two-step process ensures that variables
 * added during tests are completely removed, not just overwritten.
 * 
 * DELETION STRATEGY: Uses forEach with delete to remove properties rather than
 * reassigning process.env = {}. This approach works correctly with Node.js's
 * process.env object which has special behavior.
 */
function restoreEnv(savedEnv) { //(restore saved environment)
  logStart('restoreEnv', 'env restore'); //initial log via util
  // delete all env vars to start clean
  Object.keys(process.env).forEach(k => delete process.env[k]); //clear env
  // copy saved vars back to process.env
  Object.assign(process.env, savedEnv); //restore vars
  logReturn('restoreEnv', true); //final log via util
  return true; //confirm restore
}

/**
 * Creates and configures a mock for Bottleneck's schedule function
 * 
 * RATE LIMITING MOCK STRATEGY: The mock bypasses actual rate limiting by immediately
 * executing the provided function. This allows tests to verify that rate limiting
 * integration is properly wired without waiting for actual delays.
 * 
 * PROMISE PATTERN: Returns a resolved promise to match Bottleneck's async interface.
 * Tests can await the result just like they would with real rate limiting, ensuring
 * test code matches production usage patterns.
 * 
 * DEPENDENCY INJECTION: Modifies the mocked Bottleneck constructor to return an
 * object with the schedule property pointing to our spy function. This allows
 * tests to verify rate limiter calls and behavior.
 */
function createScheduleMock() {
  logStart('createScheduleMock', 'none'); //initial log via util
  // jest spy executes fn immediately to bypass delay
  scheduleMock = jest.fn(fn => Promise.resolve(fn())); //schedule spy
  const Bottleneck = require('bottleneck'); //require mocked Bottleneck
  // return object with schedule spy
  Bottleneck.mockImplementation(() => ({ schedule: scheduleMock })); //inject spy
  logReturn('createScheduleMock', 'mock'); //final log via util
  return scheduleMock; //export schedule mock
}

/**
 * Creates and resets the qerrors mock for error logging tests
 * 
 * MOCK RESET RATIONALE: Each test needs a clean mock with no previous call history
 * to ensure test isolation. mockReset() clears both call history and return values
 * while preserving the mock function structure.
 * 
 * ERROR TESTING STRATEGY: The mock allows tests to verify that errors are properly
 * reported through the qerrors system without requiring actual error logging
 * infrastructure. Tests can assert on call counts, arguments, and timing.
 */
function createQerrorsMock() {
  logStart('createQerrorsMock', 'none'); //initial log via util
  // Retrieve Jest mock function created by top-level jest.mock() call
  qerrorsMock = require('qerrors'); //retrieve jest mock function
  // Clear all previous call history to ensure test isolation
  // mockReset() preserves mock structure while clearing usage data
  qerrorsMock.mockReset(); //reset mock call history
  logReturn('createQerrorsMock', 'mock'); //final log via util
  return qerrorsMock; //export qerrors mock
}

/**
 * Creates an axios mock adapter for HTTP isolation
 *
 * NETWORK STRATEGY: intercepts requests so tests never hit real APIs,
 * keeping results deterministic and quota free.
 *
 * @param {Object} instance - axios instance to attach to
 * @returns {Object} axios-mock-adapter instance
 */
function createAxiosMock(instance) {
  logStart('createAxiosMock', 'none'); //initial log via util
  const MockAdapter = require('axios-mock-adapter'); //import mock adapter
  const axios = instance || require('axios'); //use provided instance or default
  const mock = new MockAdapter(axios); //create adapter instance
  logReturn('createAxiosMock', 'adapter'); //final log via util
  return mock; //export axios mock
}

/**
 * Resets all mock call history for a clean slate
 *
 * STATE RESET: clearing mocks ensures tests remain independent and
 * prevents cross-test leakage of previous calls.
 *
 * @param {Object} mock - axios-mock-adapter instance
 * @param {jest.Mock} scheduleMock - Bottleneck schedule spy
 * @param {jest.Mock} qerrorsMock - qerrors spy
 * @returns {boolean} confirmation
 */
function resetMocks(mock, scheduleMock, qerrorsMock) {
  logStart('resetMocks', 'mocks'); //initial log via util
  mock.reset(); //clear axios mock history
  scheduleMock.mockClear(); //clear Bottleneck schedule calls
  qerrorsMock.mockClear(); //clear qerrors call history
  logReturn('resetMocks', true); //final log via util
  return true; //confirm reset
}

/**
 * Initializes environment and mocks for search tests
 *
 * COMBINED SETUP: prepares env vars and mock instances in one call
 * so individual tests can focus on assertions rather than boilerplate.
 *
 * @returns {Object} configured mocks for use in tests
 */
function initSearchTest() {
  logStart('initSearchTest', 'none'); //initial log via util
  jest.resetModules(); //ensure fresh modules for each test suite
  setTestEnv(); //prepare environment variables
  const scheduleMock = createScheduleMock(); //create schedule mock
  const qerrorsMock = createQerrorsMock(); //create qerrors mock
  const qserp = require('../../lib/qserp'); //load module for axios instance
  const mock = createAxiosMock(qserp.axiosInstance); //create adapter for instance
  logReturn('initSearchTest', 'mocks'); //final log via util
  return { mock, scheduleMock, qerrorsMock }; //return configured mocks
}

module.exports = { setTestEnv, saveEnv, restoreEnv, createScheduleMock, createQerrorsMock, createAxiosMock, resetMocks, initSearchTest }; //export helpers

