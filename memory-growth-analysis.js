// Memory growth analysis to validate qserp cache health
// Uses qserp module to fill cache and track Node.js memory usage

// Mock environment for testing
process.env.CODEX = 'true'; // use mocked results for deterministic memory metrics
process.env.DEBUG = 'false'; // disable verbose logging for clarity during analysis

const qserp = require('./lib/qserp.js');

/**
 * measureMemory - reports process memory usage to evaluate cache pressure
 * RATIONALE: baseline and post-cache metrics help identify leaks
 */
function measureMemory() {
    const used = process.memoryUsage(); // Node provides current process stats
    return {
        rss: Math.round(used.rss / 1024 / 1024),
        heapTotal: Math.round(used.heapTotal / 1024 / 1024),
        heapUsed: Math.round(used.heapUsed / 1024 / 1024),
        external: Math.round(used.external / 1024 / 1024) // convert to MB for easier reporting
    };
}

/**
 * memoryGrowthAnalysis - fills cache in stages to observe heap growth and
 * garbage collection effectiveness under heavy use
 */
async function memoryGrowthAnalysis() {
    console.log('=== Memory Growth Analysis ===');
    
    const baseline = measureMemory(); // snapshot before stressing cache
    console.log('Baseline memory:', baseline);
    
    // Simulate sustained cache usage
    const phases = [100, 500, 1000, 2000, 5000]; // escalating counts highlight memory trends
    
    for (const phase of phases) { // iterate over each test size to gauge scaling
        console.log(`\n--- Testing ${phase} cache entries ---`); // heading per phase for readability
        
        // Clear cache before each phase
        qserp.clearCache(); // ensures each phase starts fresh without residual data
        
        // Fill cache with unique queries
        for (let i = 0; i < phase; i++) { // sequentially add unique entries to cache
            await qserp.fetchSearchItems(`query-${i}-${Date.now()}`); // unique key avoids collisions
        }
        
        const current = measureMemory();
        const growth = current.heapUsed - baseline.heapUsed; // delta from baseline shows added heap
        
        console.log(`Memory used: ${current.heapUsed}MB (+${growth}MB)`);
        console.log(`Memory per entry: ${(growth / phase * 1024).toFixed(2)}KB`);
        
        // Force garbage collection if available
        if (global.gc) { // optional GC to observe reclaim effectiveness (requires --expose-gc)
            global.gc(); // manually trigger garbage collector to compare memory after cleanup
            const afterGC = measureMemory();
            console.log(`After GC: ${afterGC.heapUsed}MB`);
        }
    }
    
    console.log('\n=== Memory Analysis Complete ===');
}

if (require.main === module) { memoryGrowthAnalysis().catch(console.error); } //auto-run only when executed directly

module.exports = { memoryGrowthAnalysis }; //export for test execution
