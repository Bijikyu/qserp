# Test Failure Analysis

Analyze and address the following test failures:

## Failed Test 1: /home/runner/workspace/__tests__/getDebugFlag.test.js

### Output:
```
  ● getDebugFlag › case-insensitive true detection › should return true for lowercase "true"

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "getDebugFlag is running with true"

    Number of calls: 0

      31 |             
      32 |             expect(result).toBe(true);
    > 33 |             expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with true');
         |                                ^
      34 |             expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is returning true');
      35 |         });
      36 |

      at Object.toHaveBeenCalledWith (__tests__/getDebugFlag.test.js:33:32)

  ● getDebugFlag › false cases › should return false for "false"

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "getDebugFlag is running with false"

    Number of calls: 0

      93 |             
      94 |             expect(result).toBe(false);
    > 95 |             expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with false');
         |                                ^
      96 |             expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is returning false');
      97 |         });
      98 |

      at Object.toHaveBeenCalledWith (__tests__/getDebugFlag.test.js:95:32)

  ● getDebugFlag › false cases › should return false for undefined DEBUG variable

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "getDebugFlag is running with undefined"

    Number of calls: 0

      119 |             
      120 |             expect(result).toBe(false);
    > 121 |             expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with undefined');
          |                                ^
      122 |         });
      123 |
      124 |         it('should return false for null-like values', () => { // should return false for null-like values

      at Object.toHaveBeenCalledWith (__tests__/getDebugFlag.test.js:121:32)

  ● getDebugFlag › logging behavior › should log entry with current DEBUG value

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "getDebugFlag is running with test-value"

    Number of calls: 0

      175 |             getDebugFlag();
      176 |             
    > 177 |             expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with test-value');
          |                                ^
      178 |         });
      179 |
      180 |         it('should log result value', () => { // should log result value

      at Object.toHaveBeenCalledWith (__tests__/getDebugFlag.test.js:177:32)

  ● getDebugFlag › logging behavior › should log result value

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "getDebugFlag is returning true"

    Number of calls: 0

      183 |             getDebugFlag();
      184 |             
    > 185 |             expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is returning true');
          |                                ^
      186 |         });
      187 |
      188 |         it('should log consistent format for various input types', () => { // should log consistent format for various input types

      at Object.toHaveBeenCalledWith (__tests__/getDebugFlag.test.js:185:32)

  ● getDebugFlag › logging behavior › should log consistent format for various input types

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "getDebugFlag is running with true"

    Number of calls: 0

      198 |                 const result = getDebugFlag();
      199 |                 expect(result).toBe(expected);
    > 200 |                 expect(consoleSpy).toHaveBeenCalledWith(`getDebugFlag is running with ${input}`);
          |                                    ^
      201 |                 expect(consoleSpy).toHaveBeenCalledWith(`getDebugFlag is returning ${expected}`);
      202 |                 consoleSpy.mockClear();
      203 |             });

      at toHaveBeenCalledWith (__tests__/getDebugFlag.test.js:200:36)
          at Array.forEach (<anonymous>)
      at Object.forEach (__tests__/getDebugFlag.test.js:196:23)

```

### Duration: 620ms

---

## Summary

- Total failed tests: 1
- Failed test files: /home/runner/workspace/__tests__/getDebugFlag.test.js
- Generated: 2026-04-17T18:29:10.692Z
