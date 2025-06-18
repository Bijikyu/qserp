// Simple config for Jest running in Node; RATIONALE: minimal setup for faster runs and clarity in a server-side project
/**
 * Jest configuration for the qserp project.
 * RATIONALE: Tests run in Node, so we skip jsdom to avoid unnecessary browser
 * emulation. Using the `.test.js` suffix keeps helper files out of Jest's scan.
 */
module.exports = {
  testEnvironment: 'node', // ensures tests mirror the runtime environment of the library
  testMatch: ['**/*.test.js'], // restricts Jest to explicit unit tests so helpers and fixtures are skipped
  // No setup files, coverage or custom reporters needed to keep CI lightweight
};
