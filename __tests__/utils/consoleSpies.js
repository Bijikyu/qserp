/**
 * consoleSpies.js - Console mocking utilities for test isolation
 * 
 * This module provides utilities to mock console methods during tests to prevent
 * output noise and enable verification of logging behavior. The approach uses
 * Jest spies with blank implementations to capture calls without producing output.
 * 
 * TESTING PHILOSOPHY: Console output during tests can clutter test results and
 * make it difficult to identify actual test failures. By mocking console methods,
 * we maintain clean test output while still being able to verify that logging
 * functions are called correctly.
 * 
 * SPY STRATEGY: Uses jest.spyOn() to preserve the ability to restore original
 * console behavior after tests complete. This is safer than directly overwriting
 * console methods, which could cause issues if restoration fails.
 */

const { logStart, logReturn } = require('../../lib/logUtils'); //import logging utilities

/**
 * Creates a Jest spy for the specified console method with silent implementation
 * 
 * SILENT IMPLEMENTATION RATIONALE: Uses empty function () => {} instead of
 * Jest's automatic mock to ensure no output is produced. This keeps test output
 * clean while still capturing call information for assertions.
 * 
 * SPY BENEFITS: Jest spies provide call tracking (call count, arguments, timing)
 * while allowing restoration of original behavior. This enables tests to verify
 * logging behavior without affecting other tests or producing unwanted output.
 * 
 * FLEXIBILITY: Accepts any console method name (log, warn, error, etc.) making
 * it reusable across different types of console output testing scenarios.
 */
function mockConsole(method) {
  logStart('mockConsole', method); //log start & method
  // Create Jest spy on console method with silent implementation
  // jest.spyOn preserves original method for restoration after test
  // mockImplementation(() => {}) prevents any console output during tests
  const spy = jest.spyOn(console, method).mockImplementation(() => {}); //create spy with blank impl
  logReturn('mockConsole', 'spy'); //log returning spy
  return spy; //return jest spy
}

module.exports = { mockConsole }; //export helper
