// Mock debugUtils before requiring any modules that depend on it
jest.mock('../lib/debugUtils'); //ensures debug calls are intercepted

// Summary: envValidator.test.js validates module behavior and edge cases
/**
 * envValidator.test.js - Comprehensive unit tests for environment variable validation
 *
 * Tests the centralized environment variable parsing and validation utilities
 * that provide secure bounds checking and type conversion across the codebase.
 */

let saveEnv; //helper loaded after modules reset
let restoreEnv; //helper loaded after modules reset

let parseIntWithBounds; //function loaded after reset
let parseBooleanVar; //function loaded after reset
let parseStringVar; //function loaded after reset
let validateEnvVar; //function loaded after reset
let debugEntry; //mocked debugEntry after reset
let debugExit; //mocked debugExit after reset

describe('envValidator', () => { // envValidator
    let savedEnv; //snapshot for env restoration

    beforeEach(() => {
        jest.resetModules(); //reload modules so mocks apply correctly
        ({ debugEntry, debugExit } = require('../lib/debugUtils')); //get mocked utils after reset
        ({ parseIntWithBounds, parseBooleanVar, parseStringVar, validateEnvVar } = require('../lib/envValidator')); //load functions under test
        ({ saveEnv, restoreEnv } = require('./utils/testSetup')); //reload helpers using mocked debug utils

        savedEnv = saveEnv(); //capture environment state
        jest.clearAllMocks(); //reset mocks
    });

    afterEach(() => {
        restoreEnv(savedEnv); //restore environment state
    });

    describe('parseIntWithBounds', () => { // parseIntWithBounds
        it('should return default value when environment variable is not set', () => { // should return default value when environment variable is not set
            delete process.env.TEST_VAR;

            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);

            expect(result).toBe(50);
            expect(debugEntry).toHaveBeenCalledWith('parseIntWithBounds', 'TEST_VAR, default: 50, range: 10-100');
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 50);
            expect(debugEntry).toHaveBeenCalledTimes(1); //verify call count from mock
            expect(debugExit).toHaveBeenCalledTimes(1); //verify call count from mock
        });

        it('should parse valid environment variable within bounds', () => { // should parse valid environment variable within bounds
            process.env.TEST_VAR = '75';
            
            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);
            
            expect(result).toBe(75);
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 75);
        });

        it('should enforce minimum bounds when value is too low', () => { // should enforce minimum bounds when value is too low
            process.env.TEST_VAR = '5';
            
            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);
            
            expect(result).toBe(10);
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 10);
        });

        it('should enforce maximum bounds when value is too high', () => { // should enforce maximum bounds when value is too high
            process.env.TEST_VAR = '150';
            
            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);
            
            expect(result).toBe(100);
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 100);
        });

        it('should handle non-numeric environment variables by using default', () => { // should handle non-numeric environment variables by using default
            process.env.TEST_VAR = 'not-a-number';
            
            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);
            
            expect(result).toBe(50);
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 50);
        });

        it('should handle empty string environment variables by using default', () => { // should handle empty string environment variables by using default
            process.env.TEST_VAR = '';
            
            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);
            
            expect(result).toBe(50);
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 50);
        });

        it('should fallback to default for floating point numbers', () => { // decimals are invalid; default should be used
            process.env.TEST_VAR = '75.8';

            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);

            expect(result).toBe(50);
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 50);
        });

        it('should fallback to default for values with trailing characters', () => { // ensure trailing chars are rejected
            process.env.TEST_VAR = '10abc';

            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);

            expect(result).toBe(50);
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 50);
        });

        it('should handle negative values correctly with negative bounds', () => { // should handle negative values correctly with negative bounds
            process.env.TEST_VAR = '-25';
            
            const result = parseIntWithBounds('TEST_VAR', -10, -50, 0);
            
            expect(result).toBe(-25);
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', -25);
        });

        it('should handle zero values correctly', () => { // should handle zero values correctly
            process.env.TEST_VAR = '0';
            
            const result = parseIntWithBounds('TEST_VAR', 50, 0, 100);
            
            // BUG FIX: Zero values should now be handled correctly with isNaN check
            // Previously 0 || defaultValue returned defaultValue, now 0 is preserved
            expect(result).toBe(0);
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 0);
        });

        it('should parse values with leading zeros as decimal', () => { // should parse values with leading zeros as decimal
            process.env.TEST_VAR = '08';

            const result = parseIntWithBounds('TEST_VAR', 50, 0, 100);

            expect(result).toBe(8); //explicit base 10 prevents octal interpretation
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 8);
        });

        it('should handle boundary values exactly at limits', () => { // should handle boundary values exactly at limits
            process.env.TEST_VAR = '10';
            
            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);
            
            expect(result).toBe(10);
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 10);
        });

        it('should handle upper boundary values exactly at limits', () => { // should handle upper boundary values exactly at limits
            process.env.TEST_VAR = '100';
            
            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);
            
            expect(result).toBe(100);
            expect(debugExit).toHaveBeenCalledWith('parseIntWithBounds', 100);
        });
    });

    describe('parseBooleanVar', () => { // parseBooleanVar
        it('should return default value when environment variable is not set', () => { // should return default value when environment variable is not set
            delete process.env.TEST_BOOL;
            
            const result = parseBooleanVar('TEST_BOOL', true);
            
            expect(result).toBe(true);
        });

        it('should parse "true" as boolean true (case insensitive)', () => { // should parse 
            process.env.TEST_BOOL = 'true';
            
            const result = parseBooleanVar('TEST_BOOL', false);
            
            expect(result).toBe(true);
        });

        it('should parse "TRUE" as boolean true', () => { // should parse 
            process.env.TEST_BOOL = 'TRUE';
            
            const result = parseBooleanVar('TEST_BOOL', false);
            
            expect(result).toBe(true);
        });

        it('should parse "True" as boolean true', () => { // should parse 
            process.env.TEST_BOOL = 'True';
            
            const result = parseBooleanVar('TEST_BOOL', false);
            
            expect(result).toBe(true);
        });

        it('should parse "false" as boolean false', () => { // should parse 
            process.env.TEST_BOOL = 'false';
            
            const result = parseBooleanVar('TEST_BOOL', true);
            
            expect(result).toBe(false);
        });

        it('should parse "FALSE" as boolean false', () => { // should parse 
            process.env.TEST_BOOL = 'FALSE';
            
            const result = parseBooleanVar('TEST_BOOL', true);
            
            expect(result).toBe(false);
        });

        it('should return default for non-true values like "1"', () => { // should return default for non-true values like 
            process.env.TEST_BOOL = '1';
            
            const result = parseBooleanVar('TEST_BOOL', false);
            
            expect(result).toBe(false);
        });

        it('should return false for non-true values like "0"', () => { // should return false for non-true values like 
            process.env.TEST_BOOL = '0';
            
            const result = parseBooleanVar('TEST_BOOL', true);
            
            // parseBooleanVar only returns true for exact "true" match, false otherwise
            expect(result).toBe(false);
        });

        it('should return false for non-true values like "yes"', () => { // should return false for non-true values like 
            process.env.TEST_BOOL = 'yes';
            
            const result = parseBooleanVar('TEST_BOOL', false);
            
            // parseBooleanVar only returns true for exact "true" match, false otherwise
            expect(result).toBe(false);
        });

        it('should return false for non-true values like "no"', () => { // should return false for non-true values like 
            process.env.TEST_BOOL = 'no';
            
            const result = parseBooleanVar('TEST_BOOL', true);
            
            // parseBooleanVar only returns true for exact "true" match, false otherwise
            expect(result).toBe(false);
        });

        it('should return false for unrecognized values', () => { // should return false for unrecognized values
            process.env.TEST_BOOL = 'maybe';
            
            const result = parseBooleanVar('TEST_BOOL', true);
            
            // parseBooleanVar only returns true for exact "true" match, false otherwise
            expect(result).toBe(false);
        });

        it('should handle empty string by returning default', () => { // should handle empty string by returning default
            process.env.TEST_BOOL = '';
            
            const result = parseBooleanVar('TEST_BOOL', false);
            
            expect(result).toBe(false);
        });

        it('should handle whitespace-only values by trimming and checking', () => { // should handle whitespace-only values by trimming and checking
            process.env.TEST_BOOL = '   true   ';
            
            const result = parseBooleanVar('TEST_BOOL', false);
            
            expect(result).toBe(true);
        });
    });

    describe('security and bounds checking', () => { // security and bounds checking
        it('should prevent memory exhaustion from extremely large values', () => { // should prevent memory exhaustion from extremely large values
            process.env.TEST_VAR = '999999999999999999999999999';
            
            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);
            
            expect(result).toBe(100); // Should be clamped to maximum
        });

        it('should prevent negative overflow attacks', () => { // should prevent negative overflow attacks
            process.env.TEST_VAR = '-999999999999999999999999999';
            
            const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);
            
            expect(result).toBe(10); // Should be clamped to minimum
        });

        it('should handle malicious input attempts gracefully', () => { // should handle malicious input attempts gracefully
            const maliciousInputs = ['<script>', 'DROP TABLE', '../../../etc/passwd', 'null', 'undefined'];
            
            maliciousInputs.forEach(input => {
                process.env.TEST_VAR = input;
                const result = parseIntWithBounds('TEST_VAR', 50, 10, 100);
                expect(result).toBe(50); // Should fallback to default
            });
        });
    });

    describe('integration scenarios', () => { // integration scenarios
        it('should handle typical cache size configuration', () => { // should handle typical cache size configuration
            process.env.CACHE_SIZE = '200';
            
            const result = parseIntWithBounds('CACHE_SIZE', 100, 50, 1000);
            
            expect(result).toBe(200);
        });

        it('should handle rate limit configuration', () => { // should handle rate limit configuration
            process.env.RATE_LIMIT = '10';
            
            const result = parseIntWithBounds('RATE_LIMIT', 5, 1, 100);
            
            expect(result).toBe(10);
        });

        it('should handle debug flag configuration', () => { // should handle debug flag configuration
            process.env.DEBUG_ENABLED = 'true';
            
            const result = parseBooleanVar('DEBUG_ENABLED', false);
            
            expect(result).toBe(true);
        });
    });
});