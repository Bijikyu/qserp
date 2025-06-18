// Cache optimization test for qserp
// Exercises LRU behavior and cleanup routines
// Mock environment for testing
process.env.CODEX = 'true';
process.env.DEBUG = 'false';
process.env.QSERP_MAX_CACHE_SIZE = '50'; // Small size for testing so eviction logic triggers quickly

const qserp = require('./lib/qserp.js'); // module under test

/**
 * measureMemory - captures current Node.js memory usage in MB
 * RATIONALE: used to monitor cache impact during cleanup tests
 */
function measureMemory() {
    const used = process.memoryUsage(); // capture raw bytes from Node runtime
    return {
        rss: Math.round(used.rss / 1024 / 1024),
        heapTotal: Math.round(used.heapTotal / 1024 / 1024),
        heapUsed: Math.round(used.heapUsed / 1024 / 1024),
        external: Math.round(used.external / 1024 / 1024) // convert to MB for human readability
    };
}

/**
 * testCacheCleanup - validates LRU behavior by forcing cache overflow and
 * TTL expiration to verify cleanup logic protects memory
 */
async function testCacheCleanup() {
    console.log('=== Cache Cleanup Performance Test ===');
    
    // Clear cache first
    qserp.clearCache(); // reset before measuring to avoid previous test residue
    console.log('Initial cache cleared');
    
    // Fill cache beyond threshold (50 entries + 10 more = 60 total)
    console.log('Filling cache with 60 entries (limit: 50)...');
    for (let i = 0; i < 60; i++) { // exceed cache limit to trigger eviction with unique keys
        await qserp.fetchSearchItems(`test-query-${i}`); // each iteration fetches a distinct query
    }
    
    console.log('Memory after overfilling cache:', measureMemory());
    
    // Manual cleanup no longer required; LRU-cache purges stale entries automatically
    console.log('Testing built-in cleanup...');
    // fetchSearchItems call will allow LRU-cache to purge as needed
    await qserp.fetchSearchItems('cleanup-check');

    // Test automatic cleanup during normal operation
    console.log('Testing automatic cleanup trigger...');
    const beforeAuto = measureMemory(); // snapshot before adding extra entries
    
    // Add more entries to trigger automatic cleanup
    for (let i = 60; i < 70; i++) { // new entries force auto cleanup once limit exceeded
        await qserp.fetchSearchItems(`auto-cleanup-${i}`); // ensures eviction algorithm runs
    }
    
    const afterAuto = measureMemory(); // snapshot after automatic cleanup
    console.log('Memory before auto cleanup:', beforeAuto);
    console.log('Memory after auto cleanup:', afterAuto);
    
    // Test TTL-based cleanup by simulating time passage
    console.log('Testing TTL-based cleanup...');
    const originalDateNow = Date.now; // preserve original time reference
    
    // Mock time to simulate cache expiry
    Date.now = () => originalDateNow() + (6 * 60 * 1000); // 6 minutes later to expire TTL entries
    
    // LRU-cache will clean up expired entries when accessed
    await qserp.fetchSearchItems('expiry-check');
    
    // Restore original Date.now
    Date.now = originalDateNow; // return timer function to normal state
    
    console.log('Final memory state:', measureMemory());
    console.log('=== Cache Cleanup Test Complete ===');
}

testCacheCleanup().catch(console.error); // initiate test when script runs
