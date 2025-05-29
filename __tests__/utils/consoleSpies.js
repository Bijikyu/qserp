function mockConsole(method) {
  console.log(`mockConsole is running with ${method}`); //log start & method
  const spy = jest.spyOn(console, method).mockImplementation(() => {}); //create spy with blank impl
  console.log(`mockConsole returning spy`); //log returning spy
  return spy; //return jest spy
}

module.exports = { mockConsole }; //export helper
