// Summary: getDebugFlag.test.js validates module behavior and edge cases
/**
 * getDebugFlag.test.js - Comprehensive unit tests for debug flag utility
 * 
 * Tests the centralized debug flag evaluation with case-insensitive handling
 * and graceful error recovery for environment variable parsing.
 */

const { getDebugFlag } = require('../lib/getDebugFlag');
const { saveEnv, restoreEnv } = require('./utils/testSetup'); //import env helpers for isolation

describe('getDebugFlag', () => { // getDebugFlag
    let savedEnv; //holds snapshot of process.env for restoration
    let consoleSpy; //console spy for log assertions

    beforeEach(() => {
        savedEnv = saveEnv(); // snapshot env so modifications in this test don't bleed into others
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); //stub console.log
    });

    afterEach(() => {
        restoreEnv(savedEnv); // restore env to its original state to keep suites independent
        consoleSpy.mockRestore(); //restore console
    });

    describe('case-insensitive true detection', () => { // case-insensitive true detection
        it('should return true for lowercase "true"', () => { // should return true for lowercase 
            process.env.DEBUG = 'true';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with true');
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is returning true');
        });

        it('should return true for uppercase "TRUE"', () => { // should return true for uppercase 
            process.env.DEBUG = 'TRUE';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });

        it('should return true for mixed case "True"', () => { // should return true for mixed case 
            process.env.DEBUG = 'True';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });

        it('should return true for mixed case "TrUe"', () => { // should return true for mixed case 
            process.env.DEBUG = 'TrUe';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });
    });

    describe('non-matching strings', () => { // non-matching strings
        it('should return false when "true" appears in longer string', () => { // should return false when 
            process.env.DEBUG = 'debug=true,verbose';

            const result = getDebugFlag();

            expect(result).toBe(false);
        });

        it('should return false when "true" appears with prefix', () => { // should return false when 
            process.env.DEBUG = 'enable-true';

            const result = getDebugFlag();

            expect(result).toBe(false);
        });

        it('should return false when "true" appears with suffix', () => { // should return false when 
            process.env.DEBUG = 'true-mode';

            const result = getDebugFlag();

            expect(result).toBe(false);
        });
    });

    describe('false cases', () => { // false cases
        it('should return false for "false"', () => { // should return false for 
            process.env.DEBUG = 'false';
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with false');
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is returning false');
        });

        it('should return false for "0"', () => { // should return false for 
            process.env.DEBUG = '0';
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
        });

        it('should return false for empty string', () => { // should return false for empty string
            process.env.DEBUG = '';
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
        });

        it('should return false for undefined DEBUG variable', () => { // should return false for undefined DEBUG variable
            delete process.env.DEBUG;
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with undefined');
        });

        it('should return false for null-like values', () => { // should return false for null-like values
            process.env.DEBUG = 'null';
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
        });

        it('should return false for random strings', () => { // should return false for random strings
            process.env.DEBUG = 'random-value';

            const result = getDebugFlag();

            expect(result).toBe(false);
        });

        it('should return false for "not true"', () => { // should return false for 
            process.env.DEBUG = 'not true';

            const result = getDebugFlag();

            expect(result).toBe(false);
        });
    });

    describe('error handling', () => { // error handling
        it('should handle graceful error recovery without throwing', () => { // should handle graceful error recovery without throwing
            // Test that getDebugFlag handles various edge cases without crashing
            const edgeCases = [null, undefined, '', 'invalid'];
            
            edgeCases.forEach(testCase => {
                process.env.DEBUG = testCase;
                expect(() => getDebugFlag()).not.toThrow();
            });
        });

        it('should handle very long DEBUG values', () => { // should handle very long DEBUG values
            const longValue = 'x'.repeat(10000) + 'true' + 'y'.repeat(10000);
            process.env.DEBUG = longValue;

            const result = getDebugFlag();

            expect(result).toBe(false);
        });
    });


    describe('logging behavior', () => { // logging behavior
        it('should log entry with current DEBUG value', () => { // should log entry with current DEBUG value
            process.env.DEBUG = 'test-value';
            
            getDebugFlag();
            
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with test-value');
        });

        it('should log result value', () => { // should log result value
            process.env.DEBUG = 'true';
            
            getDebugFlag();
            
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is returning true');
        });

        it('should log consistent format for various input types', () => { // should log consistent format for various input types
            const testCases = [
                { input: 'true', expected: true },
                { input: 'false', expected: false },
                { input: undefined, expected: false },
                { input: '', expected: false }
            ];
            
            testCases.forEach(({ input, expected }) => {
                process.env.DEBUG = input;
                const result = getDebugFlag();
                expect(result).toBe(expected);
                expect(consoleSpy).toHaveBeenCalledWith(`getDebugFlag is running with ${input}`);
                expect(consoleSpy).toHaveBeenCalledWith(`getDebugFlag is returning ${expected}`);
                consoleSpy.mockClear();
            });
        });
    });

    describe('edge cases', () => { // edge cases
        it('should handle whitespace around true', () => { // should handle whitespace around true
            process.env.DEBUG = ' true ';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });

        it('should handle newlines and tabs', () => { // should handle newlines and tabs
            process.env.DEBUG = '\ttrue\n';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });

        it('should handle very long strings with true', () => { // should handle very long strings with true
            const longString = 'a'.repeat(1000) + 'true' + 'b'.repeat(1000);
            process.env.DEBUG = longString;

            const result = getDebugFlag();

            expect(result).toBe(false);
        });

        it('should handle special characters', () => { // should handle special characters
            process.env.DEBUG = '!@#$%^&*()true[]{}|;:,.<>?';

            const result = getDebugFlag();

            expect(result).toBe(false);
        });
    });

    describe('performance considerations', () => { // performance considerations
        it('should handle repeated calls efficiently', () => { // should handle repeated calls efficiently
            process.env.DEBUG = 'true';
            
            // Call multiple times to ensure no memory leaks or performance issues
            for (let i = 0; i < 100; i++) {
                expect(getDebugFlag()).toBe(true);
            }
        });

        it('should handle large environment values', () => { // should handle large environment values
            const largeValue = 'true' + 'x'.repeat(10000);
            process.env.DEBUG = largeValue;

            const result = getDebugFlag();

            expect(result).toBe(false);
        });
    });
});