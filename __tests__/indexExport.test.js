const indexExports = require('../index'); //(import index module to test re-export)
const libExports = require('../lib/qserp'); //(import direct lib module)

test('index exports match lib exports', () => { //(test equality)
  expect(Object.keys(indexExports)).toEqual(Object.keys(libExports)); //(confirm same keys)
  Object.keys(libExports).forEach(key => {
    expect(indexExports[key]).toBe(libExports[key]); //(ensure same references)
  });
});
