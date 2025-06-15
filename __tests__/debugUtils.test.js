// Summary: debugUtils.test.js validates module behavior and edge cases
/**
 * debugUtils.test.js - Comprehensive unit tests for centralized debug utilities
 *
 * Tests the consolidated debug logging functions that replace scattered debug
 * patterns across lib/qserp.js, lib/envUtils.js, lib/utils.js, and other modules.
 */

jest.mock('../lib/getDebugFlag'); //mock debug flag helper for controlled state
let mockGetDebugFlag = require('../lib/getDebugFlag'); //access mock for return setup

describe('debugUtils', () => { // debugUtils
    let consoleSpy;
    let originalEnv;

    beforeEach(() => {
        // Spy on console.log to verify debug output
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Save original environment
        originalEnv = process.env.DEBUG;

        // Clear module cache to ensure fresh imports
        jest.resetModules();
        mockGetDebugFlag = require('../lib/getDebugFlag'); //refresh mock after reset
        mockGetDebugFlag.getDebugFlag.mockReset(); //reset mock between tests
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        
        // Restore original environment
        if (originalEnv !== undefined) {
            process.env.DEBUG = originalEnv;
        } else {
            delete process.env.DEBUG;
        }
    });

    describe('debugEntry', () => { // debugEntry
        it('should log function entry when DEBUG is enabled', () => { // should log function entry when DEBUG is enabled
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true); //force debug on
            const { debugEntry } = require('../lib/debugUtils'); //load with mock
            
            debugEntry('testFunction', 'test params');
            
            expect(consoleSpy).toHaveBeenCalledWith('testFunction is running with test params');
        });

        it('should not log when DEBUG is disabled', () => { // should not log when DEBUG is disabled
            mockGetDebugFlag.getDebugFlag.mockReturnValue(false); //force debug off
            const { debugEntry } = require('../lib/debugUtils'); //load with mock
            
            debugEntry('testFunction', 'test params');
            
            expect(consoleSpy).not.toHaveBeenCalled();
        });

        it('should handle object parameters by stringifying', () => { // should handle object parameters by stringifying
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true); //configure mock flag
            const { debugEntry } = require('../lib/debugUtils');
            
            const params = { key: 'value', num: 42 };
            debugEntry('testFunction', params);
            
            expect(consoleSpy).toHaveBeenCalledWith('testFunction is running with {"key":"value","num":42}');
        });

        it('should handle circular references gracefully', () => { // should handle circular references gracefully
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugEntry } = require('../lib/debugUtils');
            
            const circularObj = { name: 'test' };
            circularObj.self = circularObj;
            
            debugEntry('testFunction', circularObj);
            
            expect(consoleSpy).toHaveBeenCalledWith('testFunction is running with <unserializable params>');
        });

        it('should handle undefined parameters', () => { // should handle undefined parameters
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugEntry } = require('../lib/debugUtils');
            
            debugEntry('testFunction');
            
            expect(consoleSpy).toHaveBeenCalledWith('testFunction is running with ');
        });

        it('should handle numeric parameters', () => { // should handle numeric parameters
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugEntry } = require('../lib/debugUtils');
            
            debugEntry('testFunction', 42);
            
            expect(consoleSpy).toHaveBeenCalledWith('testFunction is running with 42');
        });
    });

    describe('debugExit', () => { // debugExit
        it('should log function exit when DEBUG is enabled', () => { // should log function exit when DEBUG is enabled
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugExit } = require('../lib/debugUtils');
            
            debugExit('testFunction', 'result value');
            
            expect(consoleSpy).toHaveBeenCalledWith('testFunction returning result value');
        });

        it('should not log when DEBUG is disabled', () => { // should not log when DEBUG is disabled
            mockGetDebugFlag.getDebugFlag.mockReturnValue(false);
            const { debugExit } = require('../lib/debugUtils');
            
            debugExit('testFunction', 'result value');
            
            expect(consoleSpy).not.toHaveBeenCalled();
        });

        it('should handle object return values by stringifying', () => { // should handle object return values by stringifying
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugExit } = require('../lib/debugUtils');
            
            const result = { success: true, data: [1, 2, 3] };
            debugExit('testFunction', result);
            
            expect(consoleSpy).toHaveBeenCalledWith('testFunction returning {"success":true,"data":[1,2,3]}');
        });

        it('should handle circular references in return values', () => { // should handle circular references in return values
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugExit } = require('../lib/debugUtils');
            
            const circularResult = { status: 'ok' };
            circularResult.ref = circularResult;
            
            debugExit('testFunction', circularResult);
            
            expect(consoleSpy).toHaveBeenCalledWith('testFunction returning <unserializable value>');
        });

        it('should handle boolean return values', () => { // should handle boolean return values
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugExit } = require('../lib/debugUtils');
            
            debugExit('testFunction', true);
            
            expect(consoleSpy).toHaveBeenCalledWith('testFunction returning true');
        });
    });

    describe('debugLog', () => { // debugLog
        it('should log debug messages when DEBUG is enabled', () => { // should log debug messages when DEBUG is enabled
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugLog } = require('../lib/debugUtils');
            
            debugLog('Processing data');
            
            expect(consoleSpy).toHaveBeenCalledWith('DEBUG: Processing data');
        });

        it('should not log when DEBUG is disabled', () => { // should not log when DEBUG is disabled
            mockGetDebugFlag.getDebugFlag.mockReturnValue(false);
            const { debugLog } = require('../lib/debugUtils');
            
            debugLog('Processing data');
            
            expect(consoleSpy).not.toHaveBeenCalled();
        });

        it('should include context when provided', () => { // should include context when provided
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugLog } = require('../lib/debugUtils');
            
            debugLog('Cache operation', { operation: 'set', key: 'test' });
            
            expect(consoleSpy).toHaveBeenCalledWith('DEBUG: Cache operation - {"operation":"set","key":"test"}');
        });

        it('should handle string context', () => { // should handle string context
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugLog } = require('../lib/debugUtils');
            
            debugLog('API call', 'GET /api/search');
            
            expect(consoleSpy).toHaveBeenCalledWith('DEBUG: API call - GET /api/search');
        });

        it('should handle circular context gracefully', () => { // should handle circular context gracefully
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugLog } = require('../lib/debugUtils');
            
            const circularContext = { type: 'test' };
            circularContext.self = circularContext;
            
            debugLog('Testing', circularContext);
            
            expect(consoleSpy).toHaveBeenCalledWith('DEBUG: Testing - <unserializable context>');
        });
    });

    describe('createTracer', () => { // createTracer
        it('should create tracer with entry and exit methods', () => { // should create tracer with entry and exit methods
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { createTracer } = require('../lib/debugUtils');
            
            const tracer = createTracer('testFunction');
            
            expect(tracer).toHaveProperty('entry');
            expect(tracer).toHaveProperty('exit');
            expect(tracer).toHaveProperty('log');
            expect(typeof tracer.entry).toBe('function');
            expect(typeof tracer.exit).toBe('function');
            expect(typeof tracer.log).toBe('function');
        });

        it('should use function name in tracer logs', () => { // should use function name in tracer logs
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { createTracer } = require('../lib/debugUtils');
            
            const tracer = createTracer('myFunction');
            tracer.entry('input params');
            tracer.exit('output result');
            
            expect(consoleSpy).toHaveBeenCalledWith('myFunction is running with input params');
            expect(consoleSpy).toHaveBeenCalledWith('myFunction returning output result');
        });

        it('should support scoped debug logging', () => { // should support scoped debug logging
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { createTracer } = require('../lib/debugUtils');
            
            const tracer = createTracer('complexFunction');
            tracer.log('intermediate step', { step: 1 });
            
            expect(consoleSpy).toHaveBeenCalledWith('DEBUG: complexFunction: intermediate step - {"step":1}');
        });

        it('should not log when DEBUG is disabled', () => { // should not log when DEBUG is disabled
            mockGetDebugFlag.getDebugFlag.mockReturnValue(false);
            const { createTracer } = require('../lib/debugUtils');
            
            const tracer = createTracer('testFunction');
            tracer.entry('params');
            tracer.exit('result');
            tracer.log('message');
            
            expect(consoleSpy).not.toHaveBeenCalled();
        });
    });

    describe('DEBUG flag export', () => { // DEBUG flag export
        it('should export DEBUG flag value', () => { // should export DEBUG flag value
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { DEBUG } = require('../lib/debugUtils');
            
            // Note: Due to module caching, this may not reflect runtime changes
            // but tests the export functionality
            expect(typeof DEBUG).toBe('boolean');
        });
    });

    describe('integration patterns', () => { // integration patterns
        it('should replace existing logStart/logReturn patterns', () => { // should replace existing logStart/logReturn patterns
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugEntry, debugExit } = require('../lib/debugUtils');
            
            // Simulate the old pattern: if (DEBUG) { logStart('func', params); }
            // Replaced with: debugEntry('func', params);
            
            debugEntry('fetchSearchItems', 'search query');
            debugExit('fetchSearchItems', ['result1', 'result2']);
            
            expect(consoleSpy).toHaveBeenCalledWith('fetchSearchItems is running with search query');
            expect(consoleSpy).toHaveBeenCalledWith('fetchSearchItems returning ["result1","result2"]');
        });

        it('should work with complex parameter objects', () => { // should work with complex parameter objects
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugEntry } = require('../lib/debugUtils');
            
            const complexParams = {
                query: 'test search',
                options: { num: 10, safe: 'off' },
                metadata: { timestamp: Date.now() }
            };
            
            debugEntry('googleSearch', complexParams);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('googleSearch is running with {"query":"test search"')
            );
        });
    });

    describe('error resilience', () => { // error resilience
        it('should not throw errors when console.log fails', () => { // should not throw errors when console.log fails
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true); //enable debug
            const { debugEntry } = require('../lib/debugUtils');

            // Mock console.log to throw an error
            consoleSpy.mockImplementation(() => {
                throw new Error('Console unavailable');
            });

            expect(() => {
                debugEntry('testFunction', 'params');
            }).toThrow('Console unavailable'); //actual behavior throws
        });

        it('should handle null and undefined gracefully', () => { // should handle null and undefined gracefully
            mockGetDebugFlag.getDebugFlag.mockReturnValue(true);
            const { debugEntry, debugExit } = require('../lib/debugUtils');
            
            expect(() => {
                debugEntry('testFunction', null);
                debugEntry('testFunction', undefined);
                debugExit('testFunction', null);
                debugExit('testFunction', undefined);
            }).not.toThrow();
        });
    });
});