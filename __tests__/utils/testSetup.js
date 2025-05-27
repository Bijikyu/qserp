function resetTestMocks(mock, scheduleMock, qerrorsMock){ //(utility to reset mocks across tests)
  console.log(`resetTestMocks is running with ${mock},${scheduleMock},${qerrorsMock}`); //(start log for helper)
  try{ //(open try block)
    if(mock && typeof mock.reset === 'function'){ mock.reset(); } //(reset axios mock if provided)
    if(scheduleMock && typeof scheduleMock.mockClear === 'function'){ scheduleMock.mockClear(); } //(clear schedule mock)
    if(qerrorsMock && typeof qerrorsMock.mockClear === 'function'){ qerrorsMock.mockClear(); } //(clear qerrors mock)
    console.log(`resetTestMocks is returning true`); //(log success)
    return true; //(confirm operation success)
  }catch(err){ //(catch errors during reset)
    console.error(err); //(output caught error)
    console.log(`resetTestMocks returning false`); //(log failure)
    return false; //(confirm failure)
  }
}

module.exports = { resetTestMocks }; //(export helper function)
