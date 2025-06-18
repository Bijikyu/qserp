const { performance } = require('perf_hooks'); // high resolution timers

// Performance analysis for qserp cache and API interactions
// Demonstrates speed difference between cache hits and misses

// Mock environment for testing
process.env.CODEX = 'true'; // run in offline mode for predictable timing
process.env.DEBUG = 'false'; // suppress debug noise during metrics collection

const qserp = require('./lib/qserp.js'); // main module under test

// Performance measurement utilities
/**
 * measureMemory - snapshots process memory for performance tests
 * RATIONALE: quantifies impact of cache operations on system resources
 */
function measureMemory() {
    const used = process.memoryUsage(); // gather real-time memory stats
    return {
        rss: Math.round(used.rss / 1024 / 1024),
        heapTotal: Math.round(used.heapTotal / 1024 / 1024),
        heapUsed: Math.round(used.heapUsed / 1024 / 1024),
        external: Math.round(used.external / 1024 / 1024) // convert to MB for clarity
    };
}

/**
 * cachePerformanceTest - benchmarks cache fill, hit and miss timings to
 * demonstrate speed benefits of caching compared to direct API calls
 */
async function cachePerformanceTest() {
    console.log('=== Cache Performance Analysis ===');
    console.log('Initial memory:', measureMemory());
    
    // Generate test queries
    const queries = []; // container for synthetic queries to fill cache
    for (let i = 0; i < 100; i++) { // build 100 unique terms for a meaningful dataset
        queries.push(`test query ${i}`); // sequential naming guarantees distinct keys
    }
    
    const start = performance.now(); // track cache fill duration
    
    // Fill cache with entries
    console.log('Filling cache with 100 entries...');
    for (const query of queries) { // prime cache sequentially for consistent timing
        await qserp.fetchSearchItems(query); // offline mode returns instantly
    }
    
    const fillTime = performance.now() - start;
    console.log(`Cache fill time: ${fillTime.toFixed(2)}ms`);
    console.log('Memory after cache fill:', measureMemory());
    
    // Test cache hits
    console.log('Testing cache hit performance...');
    const hitStart = performance.now(); // start hit timing
    for (let i = 0; i < 10; i++) { // repeat cached queries for optimal speed measurement
        await qserp.fetchSearchItems(queries[i]); // hits should return from cache
    }
    const hitTime = performance.now() - hitStart;
    console.log(`Cache hit time (10 queries): ${hitTime.toFixed(2)}ms`);
    console.log(`Average hit time: ${(hitTime/10).toFixed(2)}ms per query`);
    
    // Test cache misses
    console.log('Testing cache miss performance...');
    const missStart = performance.now(); // start miss timing
    for (let i = 0; i < 5; i++) { // use uncached queries to show slower path
        await qserp.fetchSearchItems(`new query ${i}`); // forces network mock each iteration
    }
    const missTime = performance.now() - missStart;
    console.log(`Cache miss time (5 queries): ${missTime.toFixed(2)}ms`);
    console.log(`Average miss time: ${(missTime/5).toFixed(2)}ms per query`);
    
    // Performance comparison
    const hitSpeed = hitTime / 10;
    const missSpeed = missTime / 5;
    const speedup = (missSpeed / hitSpeed).toFixed(1);
    console.log(`Cache provides ${speedup}x speedup`);
    
    // Memory analysis
    console.log('Memory usage analysis:');
    const memAfterFill = measureMemory(); // snapshot after caching to calculate memory per entry
    console.log(`Heap used for 100 cache entries: ${memAfterFill.heapUsed}MB`);
    console.log(`Estimated memory per entry: ${(memAfterFill.heapUsed/100).toFixed(2)}MB`);
    
    // Clear cache and measure
    qserp.clearCache(); // ensure memory freed after test so next runs start clean
    console.log('Memory after cache clear:', measureMemory());
    
    console.log('=== Performance Analysis Complete ===');
}

if (require.main === module) { cachePerformanceTest().catch(console.error); } //only auto-run when invoked directly

module.exports = { cachePerformanceTest }; //export for test invocation
