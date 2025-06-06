const { logStart, logReturn } = require('../../lib/logUtils'); //import logging utilities

function mockConsole(method) {
  logStart('mockConsole', method); //log start & method
  const spy = jest.spyOn(console, method).mockImplementation(() => {}); //create spy with blank impl
  logReturn('mockConsole', 'spy'); //log returning spy
  return spy; //return jest spy
}

module.exports = { mockConsole }; //export helper
