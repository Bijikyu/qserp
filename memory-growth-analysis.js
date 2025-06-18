// Memory growth analysis to validate qserp cache health
// Uses qserp module to fill cache and track Node.js memory usage

// Mock environment for testing
process.env.CODEX = 'true'; // use mocked results for deterministic memory metrics
process.env.DEBUG = 'false'; // disable verbose logging for clarity

const qserp = require('./lib/qserp.js');

/**
 * measureMemory - reports process memory usage to evaluate cache pressure
 * RATIONALE: baseline and post-cache metrics help identify leaks
 */
function measureMemory() {
    const used = process.memoryUsage(); // Node built-in metrics, trade-off: quick snapshot but not as detailed as profilers
    return { // convert bytes to MB for human readability
        rss: Math.round(used.rss / 1024 / 1024), // Resident Set Size indicates total memory allocation
        heapTotal: Math.round(used.heapTotal / 1024 / 1024), // V8 heap size limit
        heapUsed: Math.round(used.heapUsed / 1024 / 1024), // Actual used heap memory
        external: Math.round(used.external / 1024 / 1024) // Memory used by C++ objects bound to JS
    };
}

/**
 * memoryGrowthAnalysis - fills cache in stages to observe heap growth and
 * garbage collection effectiveness under heavy use
 */
async function memoryGrowthAnalysis() {
    console.log('=== Memory Growth Analysis ==='); // entry banner to mark analysis start
    
    const baseline = measureMemory(); // snapshot before stressing cache
    console.log('Baseline memory:', baseline); // show base metrics to compare growth
    
    // Simulate sustained cache usage
    const phases = [100, 500, 1000, 2000, 5000]; // escalate entry count to reveal memory curve
    
    for (const phase of phases) { // measure memory cost per cache size
        console.log(`\n--- Testing ${phase} cache entries ---`); // stage header for clarity in output
        
        // Clear cache before each phase
        qserp.clearCache(); // ensures each phase starts fresh to isolate memory effects
        
        // Fill cache with unique queries
        for (let i = 0; i < phase; i++) { // repeated fetch simulates load under stress
            await qserp.fetchSearchItems(`query-${i}-${Date.now()}`); // unique key avoids cache hits
        }
        
        const current = measureMemory(); // memory after phase
        const growth = current.heapUsed - baseline.heapUsed; // delta from baseline shows added heap
        
        console.log(`Memory used: ${current.heapUsed}MB (+${growth}MB)`); // show total memory use
        console.log(`Memory per entry: ${(growth / phase * 1024).toFixed(2)}KB`); // normalized cost per cache key
        
        // Force garbage collection if available
        if (global.gc) { // optional GC to observe reclaim effectiveness
            global.gc(); // manually trigger garbage collector
            const afterGC = measureMemory(); // memory snapshot after GC
            console.log(`After GC: ${afterGC.heapUsed}MB`); // log reclaimed usage
        }
    }
    
    console.log('\n=== Memory Analysis Complete ===');
}

if (require.main === module) { memoryGrowthAnalysis().catch(console.error); } //auto-run only when executed directly

module.exports = { memoryGrowthAnalysis }; //export for test execution
