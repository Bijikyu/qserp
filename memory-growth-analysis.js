const { performance } = require('perf_hooks');

// Mock environment for testing
process.env.CODEX = 'true';
process.env.DEBUG = 'false';

const qserp = require('./lib/qserp.js');

/**
 * measureMemory - reports process memory usage to evaluate cache pressure
 * RATIONALE: baseline and post-cache metrics help identify leaks
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
 * memoryGrowthAnalysis - fills cache in stages to observe heap growth and
 * garbage collection effectiveness under heavy use
 */
async function memoryGrowthAnalysis() {
    console.log('=== Memory Growth Analysis ===');
    
    const baseline = measureMemory();
    console.log('Baseline memory:', baseline);
    
    // Simulate sustained cache usage
    const phases = [100, 500, 1000, 2000, 5000];
    
    for (const phase of phases) {
        console.log(`\n--- Testing ${phase} cache entries ---`);
        
        // Clear cache before each phase
        qserp.clearCache();
        
        // Fill cache with unique queries
        for (let i = 0; i < phase; i++) {
            await qserp.fetchSearchItems(`query-${i}-${Date.now()}`);
        }
        
        const current = measureMemory();
        const growth = current.heapUsed - baseline.heapUsed;
        
        console.log(`Memory used: ${current.heapUsed}MB (+${growth}MB)`);
        console.log(`Memory per entry: ${(growth / phase * 1024).toFixed(2)}KB`);
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
            const afterGC = measureMemory();
            console.log(`After GC: ${afterGC.heapUsed}MB`);
        }
    }
    
    console.log('\n=== Memory Analysis Complete ===');
}

memoryGrowthAnalysis().catch(console.error);