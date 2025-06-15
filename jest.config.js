/**
 * Jest configuration for the qserp project.
 * RATIONALE: Tests run in Node, so we skip jsdom to avoid unnecessary browser
 * emulation. Using the `.test.js` suffix keeps helper files out of Jest's scan.
 */
module.exports = {
  testEnvironment: 'node', // Node-only module, DOM emulation unnecessary
  testMatch: ['**/*.test.js'], // ignore helper files, only run real tests
  // No setup files, coverage or custom reporters needed
};
