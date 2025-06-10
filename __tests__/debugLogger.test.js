/**
 * debugLogger.test.js - Comprehensive unit tests for debug logging utilities
 * 
 * Tests the centralized debug logging functions that consolidate debug patterns
 * across the codebase. Verifies conditional logging behavior and debug flag integration.
 */

// Mock dependencies before requiring debugLogger to control the cached DEBUG flag
jest.mock('../lib/getDebugFlag');
jest.mock('../lib/logUtils');

const { getDebugFlag } = require('../lib/getDebugFlag');
const { logStart, logReturn } = require('../lib/logUtils');

// Set up mocks before requiring debugLogger since it caches the DEBUG flag
getDebugFlag.mockReturnValue(false); // Default to disabled for most tests

const { debugStart, debugReturn, debugLog, isDebugEnabled } = require('../lib/debugLogger');

describe('debugLogger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('debugStart with cached DEBUG=false', () => {
        it('should not call logStart when DEBUG is disabled (cached)', () => {
            debugStart('testFunction', 'test details');
            
            expect(logStart).not.toHaveBeenCalled();
        });

        it('should handle undefined details parameter', () => {
            debugStart('testFunction');
            
            expect(logStart).not.toHaveBeenCalled();
        });

        it('should handle undefined details parameter', () => {
            getDebugFlag.mockReturnValue(true);
            
            debugStart('testFunction');
            
            expect(logStart).toHaveBeenCalledWith('testFunction', undefined);
        });

        it('should handle complex object details', () => {
            getDebugFlag.mockReturnValue(true);
            const complexDetails = { nested: { data: 'value' }, array: [1, 2, 3] };
            
            debugStart('testFunction', complexDetails);
            
            expect(logStart).toHaveBeenCalledWith('testFunction', complexDetails);
        });
    });

    describe('debugReturn', () => {
        it('should call logReturn when DEBUG is enabled', () => {
            getDebugFlag.mockReturnValue(true);
            
            debugReturn('testFunction', 'test result');
            
            expect(logReturn).toHaveBeenCalledWith('testFunction', 'test result');
        });

        it('should not call logReturn when DEBUG is disabled', () => {
            getDebugFlag.mockReturnValue(false);
            
            debugReturn('testFunction', 'test result');
            
            expect(logReturn).not.toHaveBeenCalled();
        });

        it('should handle null result values', () => {
            getDebugFlag.mockReturnValue(true);
            
            debugReturn('testFunction', null);
            
            expect(logReturn).toHaveBeenCalledWith('testFunction', null);
        });

        it('should handle undefined result values', () => {
            getDebugFlag.mockReturnValue(true);
            
            debugReturn('testFunction');
            
            expect(logReturn).toHaveBeenCalledWith('testFunction', undefined);
        });
    });

    describe('debugLog', () => {
        it('should log message when DEBUG is enabled', () => {
            getDebugFlag.mockReturnValue(true);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            debugLog('test debug message');
            
            expect(consoleSpy).toHaveBeenCalledWith('test debug message');
            
            consoleSpy.mockRestore();
        });

        it('should not log message when DEBUG is disabled', () => {
            getDebugFlag.mockReturnValue(false);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            debugLog('test debug message');
            
            expect(consoleSpy).not.toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        it('should handle empty string messages', () => {
            getDebugFlag.mockReturnValue(true);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            debugLog('');
            
            expect(consoleSpy).toHaveBeenCalledWith('');
            
            consoleSpy.mockRestore();
        });
    });

    describe('isDebugEnabled', () => {
        it('should return true when debug flag is enabled', () => {
            getDebugFlag.mockReturnValue(true);
            
            const result = isDebugEnabled();
            
            expect(result).toBe(true);
        });

        it('should return false when debug flag is disabled', () => {
            getDebugFlag.mockReturnValue(false);
            
            const result = isDebugEnabled();
            
            expect(result).toBe(false);
        });

        it('should handle getDebugFlag throwing errors', () => {
            getDebugFlag.mockImplementation(() => {
                throw new Error('Debug flag error');
            });
            
            expect(() => isDebugEnabled()).toThrow('Debug flag error');
        });
    });

    describe('integration behavior', () => {
        it('should consistently use the same debug state across all functions', () => {
            getDebugFlag.mockReturnValue(true);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            debugStart('test', 'details');
            debugReturn('test', 'result');
            debugLog('message');
            const debugState = isDebugEnabled();
            
            expect(logStart).toHaveBeenCalled();
            expect(logReturn).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();
            expect(debugState).toBe(true);
            
            consoleSpy.mockRestore();
        });

        it('should not call any logging when debug is disabled', () => {
            getDebugFlag.mockReturnValue(false);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            debugStart('test', 'details');
            debugReturn('test', 'result');
            debugLog('message');
            
            expect(logStart).not.toHaveBeenCalled();
            expect(logReturn).not.toHaveBeenCalled();
            expect(consoleSpy).not.toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });
});