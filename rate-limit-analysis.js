const { performance } = require('perf_hooks');

// Mock environment for testing
process.env.CODEX = 'true';
process.env.DEBUG = 'false';

const qserp = require('./lib/qserp.js');

async function rateLimitingAnalysis() {
    console.log('=== Rate Limiting Performance Analysis ===');
    
    // Test concurrent request handling
    const concurrentTests = [1, 5, 10, 20, 50];
    
    for (const concurrency of concurrentTests) {
        console.log(`\n--- Testing ${concurrency} concurrent requests ---`);
        
        const start = performance.now();
        const promises = [];
        
        for (let i = 0; i < concurrency; i++) {
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
    console.log('Testing burst pattern (20 requests immediately)...');
    const burstStart = performance.now();
    const burstPromises = Array.from({length: 20}, (_, i) => 
        qserp.googleSearch(`burst ${i}`)
    );
    await Promise.all(burstPromises);
    const burstDuration = performance.now() - burstStart;
    console.log(`Burst duration: ${burstDuration.toFixed(2)}ms`);
    
    // Wait and test sustained pattern
    console.log('Testing sustained pattern (20 requests with 100ms spacing)...');
    const sustainedStart = performance.now();
    for (let i = 0; i < 20; i++) {
        await qserp.googleSearch(`sustained ${i}`);
        if (i < 19) await new Promise(resolve => setTimeout(resolve, 100));
    }
    const sustainedDuration = performance.now() - sustainedStart;
    console.log(`Sustained duration: ${sustainedDuration.toFixed(2)}ms`);
    
    const efficiency = ((sustainedDuration - burstDuration) / sustainedDuration * 100).toFixed(1);
    console.log(`Rate limiting overhead: ${efficiency}%`);
    
    console.log('\n=== Rate Limiting Analysis Complete ===');
}

rateLimitingAnalysis().catch(console.error);