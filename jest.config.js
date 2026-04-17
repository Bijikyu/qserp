module.exports = {
  testEnvironment: 'node', //set node environment for tests
  testMatch: ['**/*.test.js'], //only treat files with .test.js suffix as tests
  forceExit: true, //force jest to exit after tests complete to prevent qerrors logger teardown errors
};
