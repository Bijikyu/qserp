const { performance } = require('perf_hooks');

// Mock environment for testing
process.env.CODEX = 'true';
process.env.DEBUG = 'false';

const qserp = require('./lib/qserp.js');

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
    const queries = [];
    for (let i = 0; i < 100; i++) {
        queries.push(`test query ${i}`);
    }
    
    const start = performance.now();
    
    // Fill cache with entries
    console.log('Filling cache with 100 entries...');
    for (const query of queries) {
        await qserp.fetchSearchItems(query);
    }
    
    const fillTime = performance.now() - start;
    console.log(`Cache fill time: ${fillTime.toFixed(2)}ms`);
    console.log('Memory after cache fill:', measureMemory());
    
    // Test cache hits
    console.log('Testing cache hit performance...');
    const hitStart = performance.now();
    for (let i = 0; i < 10; i++) {
        await qserp.fetchSearchItems(queries[i]);
    }
    const hitTime = performance.now() - hitStart;
    console.log(`Cache hit time (10 queries): ${hitTime.toFixed(2)}ms`);
    console.log(`Average hit time: ${(hitTime/10).toFixed(2)}ms per query`);
    
    // Test cache misses
    console.log('Testing cache miss performance...');
    const missStart = performance.now();
    for (let i = 0; i < 5; i++) {
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
    qserp.clearCache();
    console.log('Memory after cache clear:', measureMemory());
    
    console.log('=== Performance Analysis Complete ===');
}

cachePerformanceTest().catch(console.error);