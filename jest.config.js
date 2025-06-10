/**
 * jest.config.js - Jest testing framework configuration
 * 
 * This configuration file defines how Jest should execute tests for the qserp module.
 * The settings optimize for Node.js library testing while maintaining compatibility
 * with standard Jest workflows.
 * 
 * ENVIRONMENT CHOICE: Node.js environment is selected because qserp is a server-side
 * library that doesn't require DOM simulation. This reduces overhead compared to
 * the default jsdom environment which includes browser APIs not needed here.
 * 
 * FILE PATTERN: The .test.js suffix convention clearly identifies test files and
 * prevents accidental execution of utility files or mock data as tests.
 */
module.exports = {
  // Use Node.js test environment for server-side library testing
  // RATIONALE: Avoids unnecessary DOM simulation overhead since qserp operates
  // in Node.js environments and doesn't require browser APIs
  testEnvironment: 'node',
  
  // Only execute files with .test.js extension as tests
  // RATIONALE: Prevents Jest from attempting to run utility files, mock factories,
  // or other JavaScript files in the test directory that aren't actual test suites
  testMatch: ['**/*.test.js'],
  
  // No custom setup files needed - tests handle their own mocking via testSetup.js
  // No coverage thresholds enforced - allows flexible test development
  // No custom reporters - default Jest output provides sufficient information
};
