/**
 * getDebugFlag.test.js - Comprehensive unit tests for debug flag utility
 * 
 * Tests the centralized debug flag evaluation with case-insensitive handling
 * and graceful error recovery for environment variable parsing.
 */

const { getDebugFlag } = require('../lib/getDebugFlag');

describe('getDebugFlag', () => {
    let originalEnv;
    let consoleSpy;

    beforeEach(() => {
        // Save original environment and mock console
        originalEnv = { ...process.env };
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore original environment and console
        process.env = originalEnv;
        consoleSpy.mockRestore();
    });

    describe('case-insensitive true detection', () => {
        it('should return true for lowercase "true"', () => {
            process.env.DEBUG = 'true';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with true');
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is returning true');
        });

        it('should return true for uppercase "TRUE"', () => {
            process.env.DEBUG = 'TRUE';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });

        it('should return true for mixed case "True"', () => {
            process.env.DEBUG = 'True';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });

        it('should return true for mixed case "TrUe"', () => {
            process.env.DEBUG = 'TrUe';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });
    });

    describe('partial string matching', () => {
        it('should return true when "true" appears in longer string', () => {
            process.env.DEBUG = 'debug=true,verbose';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });

        it('should return true when "true" appears with prefix', () => {
            process.env.DEBUG = 'enable-true';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });

        it('should return true when "true" appears with suffix', () => {
            process.env.DEBUG = 'true-mode';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });
    });

    describe('false cases', () => {
        it('should return false for "false"', () => {
            process.env.DEBUG = 'false';
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with false');
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is returning false');
        });

        it('should return false for "0"', () => {
            process.env.DEBUG = '0';
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
        });

        it('should return false for empty string', () => {
            process.env.DEBUG = '';
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
        });

        it('should return false for undefined DEBUG variable', () => {
            delete process.env.DEBUG;
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with undefined');
        });

        it('should return false for null-like values', () => {
            process.env.DEBUG = 'null';
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
        });

        it('should return false for random strings', () => {
            process.env.DEBUG = 'random-value';
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should return false when regex test throws error', () => {
            // Mock process.env.DEBUG to throw when accessed
            Object.defineProperty(process.env, 'DEBUG', {
                get: () => {
                    throw new Error('Environment access error');
                },
                configurable: true
            });
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag returning false');
        });

        it('should handle toString conversion errors gracefully', () => {
            // Create object that throws on toString
            const problematicValue = {
                toString: () => {
                    throw new Error('toString error');
                }
            };
            
            process.env.DEBUG = problematicValue;
            
            const result = getDebugFlag();
            
            expect(result).toBe(false);
        });
    });

    describe('regex behavior', () => {
        it('should match "true" anywhere in the string', () => {
            const testCases = [
                'true',
                'prefix-true',
                'true-suffix',
                'prefix-true-suffix',
                'debug=true,verbose=false'
            ];
            
            testCases.forEach(testCase => {
                process.env.DEBUG = testCase;
                expect(getDebugFlag()).toBe(true);
            });
        });

        it('should not match similar words', () => {
            const testCases = [
                'truth',
                'untrue',
                'truest',
                'truly',
                'tru',
                'ture'
            ];
            
            testCases.forEach(testCase => {
                process.env.DEBUG = testCase;
                expect(getDebugFlag()).toBe(false);
            });
        });
    });

    describe('logging behavior', () => {
        it('should log entry with current DEBUG value', () => {
            process.env.DEBUG = 'test-value';
            
            getDebugFlag();
            
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is running with test-value');
        });

        it('should log result value', () => {
            process.env.DEBUG = 'true';
            
            getDebugFlag();
            
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag is returning true');
        });

        it('should log fallback message on error', () => {
            Object.defineProperty(process.env, 'DEBUG', {
                get: () => {
                    throw new Error('Access error');
                },
                configurable: true
            });
            
            getDebugFlag();
            
            expect(consoleSpy).toHaveBeenCalledWith('getDebugFlag returning false');
        });
    });

    describe('edge cases', () => {
        it('should handle whitespace around true', () => {
            process.env.DEBUG = ' true ';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });

        it('should handle newlines and tabs', () => {
            process.env.DEBUG = '\ttrue\n';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });

        it('should handle very long strings with true', () => {
            const longString = 'a'.repeat(1000) + 'true' + 'b'.repeat(1000);
            process.env.DEBUG = longString;
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });

        it('should handle special characters', () => {
            process.env.DEBUG = '!@#$%^&*()true[]{}|;:,.<>?';
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });
    });

    describe('performance considerations', () => {
        it('should handle repeated calls efficiently', () => {
            process.env.DEBUG = 'true';
            
            // Call multiple times to ensure no memory leaks or performance issues
            for (let i = 0; i < 100; i++) {
                expect(getDebugFlag()).toBe(true);
            }
        });

        it('should handle large environment values', () => {
            const largeValue = 'true' + 'x'.repeat(10000);
            process.env.DEBUG = largeValue;
            
            const result = getDebugFlag();
            
            expect(result).toBe(true);
        });
    });
});