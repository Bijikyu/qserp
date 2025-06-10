/**
 * debugLogger.test.js - Comprehensive unit tests for debug logging utilities
 * 
 * Tests the centralized debug logging functions that consolidate debug patterns
 * across the codebase. Tests the cached DEBUG behavior with disabled state.
 */

// Mock dependencies before requiring debugLogger
jest.mock('../lib/getDebugFlag');
jest.mock('../lib/logUtils');

const { getDebugFlag } = require('../lib/getDebugFlag');
const { logStart, logReturn } = require('../lib/logUtils');

// Set DEBUG to false for the cached behavior test
getDebugFlag.mockReturnValue(false);

const { debugStart, debugReturn, debugLog, isDebugEnabled } = require('../lib/debugLogger');

describe('debugLogger with DEBUG=false (cached)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('debugStart', () => {
        it('should not call logStart when DEBUG is disabled', () => {
            debugStart('testFunction', 'test details');
            expect(logStart).not.toHaveBeenCalled();
        });

        it('should handle undefined details parameter', () => {
            debugStart('testFunction');
            expect(logStart).not.toHaveBeenCalled();
        });

        it('should handle complex object details', () => {
            const complexDetails = { nested: { data: 'value' }, array: [1, 2, 3] };
            debugStart('testFunction', complexDetails);
            expect(logStart).not.toHaveBeenCalled();
        });
    });

    describe('debugReturn', () => {
        it('should not call logReturn when DEBUG is disabled', () => {
            debugReturn('testFunction', 'test result');
            expect(logReturn).not.toHaveBeenCalled();
        });

        it('should handle null result values', () => {
            debugReturn('testFunction', null);
            expect(logReturn).not.toHaveBeenCalled();
        });

        it('should handle undefined result values', () => {
            debugReturn('testFunction');
            expect(logReturn).not.toHaveBeenCalled();
        });
    });

    describe('debugLog', () => {
        it('should not log message when DEBUG is disabled', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            debugLog('test debug message');
            
            expect(consoleSpy).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle empty string messages', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            debugLog('');
            
            expect(consoleSpy).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('isDebugEnabled', () => {
        it('should return false when debug flag is cached as disabled', () => {
            const result = isDebugEnabled();
            expect(result).toBe(false);
        });
    });

    describe('function signatures and error handling', () => {
        it('should handle all debugStart calls without errors', () => {
            expect(() => {
                debugStart('test1', 'details');
                debugStart('test2', { obj: 'value' });
                debugStart('test3', null);
                debugStart('test4');
            }).not.toThrow();
        });

        it('should handle all debugReturn calls without errors', () => {
            expect(() => {
                debugReturn('test1', 'result');
                debugReturn('test2', { obj: 'value' });
                debugReturn('test3', null);
                debugReturn('test4');
            }).not.toThrow();
        });

        it('should handle all debugLog calls without errors', () => {
            expect(() => {
                debugLog('message');
                debugLog('');
                debugLog(null);
                debugLog(undefined);
            }).not.toThrow();
        });
    });

    describe('module exports', () => {
        it('should export all expected functions', () => {
            expect(typeof debugStart).toBe('function');
            expect(typeof debugReturn).toBe('function');
            expect(typeof debugLog).toBe('function');
            expect(typeof isDebugEnabled).toBe('function');
        });

        it('should export functions with correct arities', () => {
            expect(debugStart.length).toBe(2);
            expect(debugReturn.length).toBe(2);
            expect(debugLog.length).toBe(1);
            expect(isDebugEnabled.length).toBe(0);
        });
    });
});