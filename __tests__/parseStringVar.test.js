// Mock debugUtils before loading any modules that depend on it
jest.mock('../lib/debugUtils'); //ensures debug calls are tracked correctly

// Summary: parseStringVar.test.js validates module behavior and edge cases
/**
 * parseStringVar.test.js - Additional unit tests for string parsing functionality
 *
 * Tests the parseStringVar and validateEnvVar functions from envValidator
 * to ensure comprehensive coverage of string validation scenarios.
 */

let saveEnv; //helper loaded after modules reset
let restoreEnv; //helper loaded after modules reset

let parseStringVar; //function reference loaded after modules reset
let validateEnvVar; //function reference loaded after modules reset
let debugEntry; //mocked debugEntry loaded after modules reset
let debugExit; //mocked debugExit loaded after modules reset

describe('parseStringVar', () => { // parseStringVar
    let savedEnv; //snapshot of environment for restoration

    beforeEach(() => {
        jest.resetModules(); //reload modules so mocks apply correctly
        ({ debugEntry, debugExit } = require('../lib/debugUtils')); //obtain mocked utils after reset
        ({ parseStringVar, validateEnvVar } = require('../lib/envValidator')); //load functions under test
        ({ saveEnv, restoreEnv } = require('./utils/testSetup')); //reload helpers using mocked debug utils

        savedEnv = saveEnv(); // snapshot env so later tests run with their own settings
        jest.clearAllMocks(); //reset mocks
    });

    afterEach(() => {
        restoreEnv(savedEnv); // restore original env to avoid cross-test interference
    });

    describe('basic string parsing', () => { // basic string parsing
        it('should return environment variable value when set', () => { // should return environment variable value when set
            process.env.TEST_STRING = 'hello world';

            const result = parseStringVar('TEST_STRING', 'default');

            expect(result).toBe('hello world');
            expect(debugEntry).toHaveBeenCalledWith('parseStringVar', 'TEST_STRING, default: default, maxLength: 0');
            expect(debugExit).toHaveBeenCalledWith('parseStringVar', 'length: 11');
            expect(debugEntry).toHaveBeenCalledTimes(1); //ensure mocked calls tracked correctly
            expect(debugExit).toHaveBeenCalledTimes(1); //ensure mocked calls tracked correctly
        });

        it('should return default value when environment variable is not set', () => { // should return default value when environment variable is not set
            delete process.env.TEST_STRING;
            
            const result = parseStringVar('TEST_STRING', 'default');
            
            expect(result).toBe('default');
            expect(debugExit).toHaveBeenCalledWith('parseStringVar', 'length: 7');
        });

        it('should trim whitespace from values', () => { // should trim whitespace from values
            process.env.TEST_STRING = '  trimmed  ';
            
            const result = parseStringVar('TEST_STRING', 'default');
            
            expect(result).toBe('trimmed');
            expect(debugExit).toHaveBeenCalledWith('parseStringVar', 'length: 7');
        });

        it('should handle empty string values', () => { // should handle empty string values
            process.env.TEST_STRING = '';
            
            const result = parseStringVar('TEST_STRING', 'default');
            
            // parseStringVar uses || operator, so empty string falls back to default
            expect(result).toBe('default');
            expect(debugExit).toHaveBeenCalledWith('parseStringVar', 'length: 7');
        });
    });

    describe('length constraints', () => { // length constraints
        it('should truncate values exceeding maxLength', () => { // should truncate values exceeding maxLength
            process.env.TEST_STRING = 'this is a very long string';
            
            const result = parseStringVar('TEST_STRING', 'default', 10);
            
            expect(result).toBe('this is a ');
            expect(debugExit).toHaveBeenCalledWith('parseStringVar', 'truncated to 10 chars');
        });

        it('should not truncate values within maxLength', () => { // should not truncate values within maxLength
            process.env.TEST_STRING = 'short';
            
            const result = parseStringVar('TEST_STRING', 'default', 10);
            
            expect(result).toBe('short');
            expect(debugExit).toHaveBeenCalledWith('parseStringVar', 'length: 5');
        });

        it('should handle maxLength of 0 as no limit', () => { // should handle maxLength of 0 as no limit
            process.env.TEST_STRING = 'very long string that should not be truncated';
            
            const result = parseStringVar('TEST_STRING', 'default', 0);
            
            expect(result).toBe('very long string that should not be truncated');
            expect(debugExit).toHaveBeenCalledWith('parseStringVar', 'length: 45');
        });

        it('should handle exact maxLength values', () => { // should handle exact maxLength values
            process.env.TEST_STRING = 'exactly10c';
            
            const result = parseStringVar('TEST_STRING', 'default', 10);
            
            expect(result).toBe('exactly10c');
            expect(debugExit).toHaveBeenCalledWith('parseStringVar', 'length: 10');
        });
    });

    describe('security scenarios', () => { // security scenarios
        it('should handle very large input strings safely', () => { // should handle very large input strings safely
            const largeString = 'x'.repeat(100000);
            process.env.TEST_STRING = largeString;
            
            const result = parseStringVar('TEST_STRING', 'default', 1000);
            
            expect(result).toBe('x'.repeat(1000));
            expect(debugExit).toHaveBeenCalledWith('parseStringVar', 'truncated to 1000 chars');
        });

        it('should handle special characters correctly', () => { // should handle special characters correctly
            process.env.TEST_STRING = '!@#$%^&*()[]{}|;:,.<>?';
            
            const result = parseStringVar('TEST_STRING', 'default');
            
            expect(result).toBe('!@#$%^&*()[]{}|;:,.<>?');
        });

        it('should handle unicode characters', () => { // should handle unicode characters
            process.env.TEST_STRING = '测试中文字符';
            
            const result = parseStringVar('TEST_STRING', 'default');
            
            expect(result).toBe('测试中文字符');
        });
    });
});

describe('validateEnvVar', () => { // validateEnvVar
    let savedEnv; //env snapshot for restore

    beforeEach(() => {
        savedEnv = saveEnv(); // snapshot env so validation tests start from a known state
        jest.clearAllMocks(); //reset mocks per test
    });

    afterEach(() => {
        restoreEnv(savedEnv); // restore env to keep subsequent tests independent
    });

    describe('required variable validation', () => { // required variable validation
        it('should return true when required variable exists with value', () => { // should return true when required variable exists with value
            process.env.REQUIRED_VAR = 'some value';
            
            const result = validateEnvVar('REQUIRED_VAR', true);
            
            expect(result).toBe(true);
            expect(debugEntry).toHaveBeenCalledWith('validateEnvVar', 'REQUIRED_VAR, required: true');
            expect(debugExit).toHaveBeenCalledWith('validateEnvVar', 'valid');
        });

        it('should throw error when required variable is missing', () => { // should throw error when required variable is missing
            delete process.env.REQUIRED_VAR;
            
            expect(() => {
                validateEnvVar('REQUIRED_VAR', true);
            }).toThrow('Required environment variable REQUIRED_VAR is missing or empty');
            
            expect(debugExit).toHaveBeenCalledWith('validateEnvVar', 'missing required variable');
        });

        it('should throw error when required variable is empty', () => { // should throw error when required variable is empty
            process.env.REQUIRED_VAR = '';
            
            expect(() => {
                validateEnvVar('REQUIRED_VAR', true);
            }).toThrow('Required environment variable REQUIRED_VAR is missing or empty');
        });

        it('should throw error when required variable is whitespace only', () => { // should throw error when required variable is whitespace only
            process.env.REQUIRED_VAR = '   ';
            
            expect(() => {
                validateEnvVar('REQUIRED_VAR', true);
            }).toThrow('Required environment variable REQUIRED_VAR is missing or empty');
        });
    });

    describe('optional variable validation', () => { // optional variable validation
        it('should return true when optional variable exists with value', () => { // should return true when optional variable exists with value
            process.env.OPTIONAL_VAR = 'some value';
            
            const result = validateEnvVar('OPTIONAL_VAR', false);
            
            expect(result).toBe(true);
            expect(debugExit).toHaveBeenCalledWith('validateEnvVar', 'valid');
        });

        it('should return false when optional variable is missing', () => { // should return false when optional variable is missing
            delete process.env.OPTIONAL_VAR;
            
            const result = validateEnvVar('OPTIONAL_VAR', false);
            
            expect(result).toBe(false);
            expect(debugExit).toHaveBeenCalledWith('validateEnvVar', 'optional missing');
        });

        it('should return false when optional variable is empty', () => { // should return false when optional variable is empty
            process.env.OPTIONAL_VAR = '';
            
            const result = validateEnvVar('OPTIONAL_VAR', false);
            
            expect(result).toBe(false);
            expect(debugExit).toHaveBeenCalledWith('validateEnvVar', 'optional missing');
        });
    });

    describe('default behavior', () => { // default behavior
        it('should default to required=true when not specified', () => { // should default to required=true when not specified
            delete process.env.DEFAULT_VAR;
            
            expect(() => {
                validateEnvVar('DEFAULT_VAR');
            }).toThrow('Required environment variable DEFAULT_VAR is missing or empty');
        });
    });
});