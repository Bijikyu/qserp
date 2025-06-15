const { performance } = require('perf_hooks'); // high resolution timers

// Performance analysis for qserp cache and API interactions
// Demonstrates speed difference between cache hits and misses

// Mock environment for testing
process.env.CODEX = 'true'; // run in offline mode for predictable timing
process.env.DEBUG = 'false'; // suppress debug noise during metrics

const qserp = require('./lib/qserp.js'); // main module under test

// Performance measurement utilities
/**
 * measureMemory - snapshots process memory for performance tests
 * RATIONALE: quantifies impact of cache operations on system resources
 */
function measureMemory() {
    const used = process.memoryUsage();
    return {
        rss: Math.round(used.rss / 1024 / 1024),
        heapTotal: Math.round(used.heapTotal / 1024 / 1024),
        heapUsed: Math.round(used.heapUsed / 1024 / 1024),
        external: Math.round(used.external / 1024 / 1024)
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
    const queries = []; // container for synthetic queries
    for (let i = 0; i < 100; i++) { // 100 entries ensure measurable cache size
        queries.push(`test query ${i}`);
    }
    
    const start = performance.now(); // track cache fill duration
    
    // Fill cache with entries
    console.log('Filling cache with 100 entries...');
    for (const query of queries) { // populate cache to test retrieval speed
        await qserp.fetchSearchItems(query);
    }
    
    const fillTime = performance.now() - start;
    console.log(`Cache fill time: ${fillTime.toFixed(2)}ms`);
    console.log('Memory after cache fill:', measureMemory());
    
    // Test cache hits
    console.log('Testing cache hit performance...');
    const hitStart = performance.now(); // start hit timing
    for (let i = 0; i < 10; i++) { // hit cached queries to measure best case
        await qserp.fetchSearchItems(queries[i]);
    }
    const hitTime = performance.now() - hitStart;
    console.log(`Cache hit time (10 queries): ${hitTime.toFixed(2)}ms`);
    console.log(`Average hit time: ${(hitTime/10).toFixed(2)}ms per query`);
    
    // Test cache misses
    console.log('Testing cache miss performance...');
    const missStart = performance.now(); // start miss timing
    for (let i = 0; i < 5; i++) { // miss cache with new queries for comparison
        await qserp.fetchSearchItems(`new query ${i}`);
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
    const memAfterFill = measureMemory();
    console.log(`Heap used for 100 cache entries: ${memAfterFill.heapUsed}MB`);
    console.log(`Estimated memory per entry: ${(memAfterFill.heapUsed/100).toFixed(2)}MB`);
    
    // Clear cache and measure
    qserp.clearCache(); // ensure memory freed after test
    console.log('Memory after cache clear:', measureMemory());
    
    console.log('=== Performance Analysis Complete ===');
}

if (require.main === module) { cachePerformanceTest().catch(console.error); } //only auto-run when invoked directly

module.exports = { cachePerformanceTest }; //export for test invocation
