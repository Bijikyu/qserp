const { performance } = require('perf_hooks'); // used for timing analysis

// Rate limiting analysis script for qserp
// Exercises Bottleneck configuration under simulated load

// Mock environment for testing
process.env.CODEX = 'true'; // offline mode ensures tests don't hit Google
process.env.DEBUG = 'false'; // keep output focused on timing metrics

const qserp = require('./lib/qserp.js'); // main module to throttle

/**
 * rateLimitingAnalysis - measures throughput under different concurrency levels
 * RATIONALE: ensures Bottleneck settings handle bursts without exceeding quotas
 */
async function rateLimitingAnalysis() {
    console.log('=== Rate Limiting Performance Analysis ===');
    
    // Test concurrent request handling
    const concurrentTests = [1, 5, 10, 20, 50]; // range stresses limiter behavior
    
    for (const concurrency of concurrentTests) { // evaluate throughput at each level
        console.log(`\n--- Testing ${concurrency} concurrent requests ---`);
        
        const start = performance.now(); // timing per batch
        const promises = []; // store concurrent query promises
        
        for (let i = 0; i < concurrency; i++) { // fire multiple requests simultaneously
            promises.push(qserp.googleSearch(`concurrent test ${i}`));
        }
        
        const results = await Promise.all(promises);
        const duration = performance.now() - start;
        
        console.log(`Duration: ${duration.toFixed(2)}ms`);
        console.log(`Average per request: ${(duration / concurrency).toFixed(2)}ms`);
        console.log(`Throughput: ${(concurrency / (duration / 1000)).toFixed(2)} requests/sec`);
        console.log(`Successful responses: ${results.filter(r => r.length >= 0).length}/${concurrency}`);
    }
    
    // Test burst vs sustained patterns
    console.log('\n--- Burst vs Sustained Request Pattern Analysis ---');
    
    // Burst pattern: 20 requests immediately
    console.log('Testing burst pattern (20 requests immediately)...'); // stress test bottleneck
    const burstStart = performance.now(); // measure immediate burst
    const burstPromises = Array.from({length: 20}, (_, i) => // queue 20 rapid requests
        qserp.googleSearch(`burst ${i}`)
    );
    await Promise.all(burstPromises);
    const burstDuration = performance.now() - burstStart;
    console.log(`Burst duration: ${burstDuration.toFixed(2)}ms`);
    
    // Wait and test sustained pattern
    console.log('Testing sustained pattern (20 requests with 100ms spacing)...');
    const sustainedStart = performance.now(); // measure paced traffic
    for (let i = 0; i < 20; i++) { // paced requests show effect of minTime
        await qserp.googleSearch(`sustained ${i}`);
        if (i < 19) await new Promise(resolve => setTimeout(resolve, 100)); // 100ms gap simulates steady traffic
    }
    const sustainedDuration = performance.now() - sustainedStart;
    console.log(`Sustained duration: ${sustainedDuration.toFixed(2)}ms`);
    
    const efficiency = ((sustainedDuration - burstDuration) / sustainedDuration * 100).toFixed(1);
    console.log(`Rate limiting overhead: ${efficiency}%`);
    
    console.log('\n=== Rate Limiting Analysis Complete ===');
}

rateLimitingAnalysis().catch(console.error); // execute when script run
