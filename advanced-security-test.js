// Advanced security test suite for qserp
// Exercises edge cases to uncover hard-to-find vulnerabilities
// Test environment setup
process.env.CODEX = 'true'; // rely on mocked requests for repeatability
process.env.DEBUG = 'false'; // suppress verbose logs during analysis

const qserp = require('./lib/qserp.js'); // module under scrutiny

/**
 * advancedSecurityTesting - runs extensive vulnerability checks against the
 * search module to ensure resistance to malicious input and configuration
 * RATIONALE: exposes potential cache or environment exploits in isolation
 */
async function advancedSecurityTesting() {
    console.log('=== Advanced Security Vulnerability Testing ==='); // banner for manual runs
    
    // Test 1: Cache Poisoning Attacks
    console.log('\n--- Cache Poisoning Attack Vectors ---');
    
    const cacheTests = [ // various formatting of same query to probe cache keys
        'normal query',
        'NORMAL QUERY',              // Case sensitivity
        'normal query ',             // Trailing space
        ' normal query',             // Leading space
        'normal\tquery',            // Tab character
        'normal\nquery',            // Newline injection
        'normal\rquery',            // Carriage return
        'normal\u0000query',        // Null byte
        'normal\u2028query',        // Unicode line separator
    ];
    
    let cacheVulnerabilities = 0; // track cache inconsistencies
    
    // Fill cache with variations
    for (const query of cacheTests) { // populate cache with each variant
        try {
            await qserp.googleSearch(query);
        } catch (error) {
            // Expected for invalid inputs
        }
    }
    
    // Test if different variations produce different cache entries
    for (let i = 0; i < cacheTests.length - 1; i++) { // compare normalized variants
        for (let j = i + 1; j < cacheTests.length; j++) { // cross-check each pair
            if (cacheTests[i].trim().toLowerCase() === cacheTests[j].trim().toLowerCase()) {
                // These should ideally use the same cache entry
                // But our current implementation treats them as different
                console.log(`Cache separation: "${cacheTests[i]}" vs "${cacheTests[j]}"`);
            }
        }
    }
    
    // Test 2: Memory Timing Attacks
    console.log('\n--- Memory Timing Attack Analysis ---');
    
    const timingTests = []; // record miss vs hit timing per query
    
    // Test cache hit vs miss timing
    for (let i = 0; i < 10; i++) { // 10 iterations provide sample size for averages
        const query = `timing-test-${i}`;
        
        // First request (cache miss)
        const start1 = process.hrtime.bigint();
        await qserp.googleSearch(query);
        const end1 = process.hrtime.bigint();
        const missTime = Number(end1 - start1) / 1000000; // Convert to ms
        
        // Second request (cache hit)
        const start2 = process.hrtime.bigint();
        await qserp.googleSearch(query);
        const end2 = process.hrtime.bigint();
        const hitTime = Number(end2 - start2) / 1000000;
        
        timingTests.push({ query, missTime, hitTime, ratio: missTime / hitTime });
    }
    
    const avgRatio = timingTests.reduce((sum, test) => sum + test.ratio, 0) / timingTests.length; // avg miss/hit ratio
    
    if (avgRatio > 10) {
        console.log(`Potential timing attack vector: ${avgRatio.toFixed(1)}x difference between cache hit/miss`);
    } else {
        console.log(`Timing difference acceptable: ${avgRatio.toFixed(1)}x cache hit/miss ratio`);
    }
    
    // Test 3: Environment Variable Injection
    console.log('\n--- Environment Variable Security ---');
    
    const originalEnv = { ...process.env };
    
    // Test malicious environment values
    const maliciousEnvTests = [ // intentionally bad env values to confirm validation
        { key: 'QSERP_MAX_CACHE_SIZE', value: '-1' },
        { key: 'QSERP_MAX_CACHE_SIZE', value: 'Infinity' },
        { key: 'QSERP_MAX_CACHE_SIZE', value: 'NaN' },
        { key: 'QSERP_MAX_CACHE_SIZE', value: '999999999999' },
        { key: 'DEBUG', value: 'true; rm -rf /' },
        { key: 'LOG_LEVEL', value: 'error\nmalicious_command' }
    ];
    
    for (const test of maliciousEnvTests) { // iterate over invalid env values
        process.env[test.key] = test.value;
        
        try {
            // Test if malicious env values cause issues
            const parsedValue = parseInt(process.env.QSERP_MAX_CACHE_SIZE, 10) || 1000; //use base 10 to match production parsing
            if (parsedValue < 0 || parsedValue > 100000 || isNaN(parsedValue)) {
                console.log(`Environment validation needed for ${test.key}=${test.value}`);
            } else {
                console.log(`Environment value safely handled: ${test.key}=${test.value}`);
            }
        } catch (error) {
            console.log(`Environment value rejected: ${test.key}=${test.value}`);
        }
        
        // Restore original
        if (originalEnv[test.key]) {
            process.env[test.key] = originalEnv[test.key];
        } else {
            delete process.env[test.key];
        }
    }
    
    // Test 4: Prototype Pollution Checks
    console.log('\n--- Prototype Pollution Protection ---');
    
    const originalObjectPrototype = Object.prototype.toString; // preserve original method
    
    try {
        // Attempt prototype pollution through query processing
        const pollutionTests = [ // attempts to modify object prototype
            '{"__proto__": {"polluted": true}}',
            'constructor.prototype.polluted=true',
            '__proto__.polluted=true'
        ];
        
        for (const test of pollutionTests) { // run each malicious payload
            await qserp.googleSearch(test);
        }
        
        // Check if prototype was polluted
        if (Object.prototype.polluted) {
            console.log('CRITICAL: Prototype pollution vulnerability detected');
        } else {
            console.log('Prototype pollution protection effective');
        }
        
    } finally {
        // Clean up any pollution
        delete Object.prototype.polluted;
        Object.prototype.toString = originalObjectPrototype;
    }
    
    // Test 5: Resource Exhaustion Patterns
    console.log('\n--- Resource Exhaustion Testing ---');
    
    const initialResources = {
        memory: process.memoryUsage().heapUsed,
        handles: process._getActiveHandles().length,
        requests: process._getActiveRequests().length
    };
    
    // Rapid cache operations
    for (let i = 0; i < 100; i++) { // repeated clear/fill cycles stress resource cleanup
        await qserp.fetchSearchItems(`resource-test-${i}`);
        qserp.clearCache();
    }
    
    const finalResources = {
        memory: process.memoryUsage().heapUsed,
        handles: process._getActiveHandles().length,
        requests: process._getActiveRequests().length
    };
    
    const memoryGrowth = (finalResources.memory - initialResources.memory) / 1024 / 1024;
    const handleGrowth = finalResources.handles - initialResources.handles;
    
    console.log(`Memory growth after rapid operations: ${memoryGrowth.toFixed(2)}MB`);
    console.log(`Handle growth: ${handleGrowth}`);
    
    if (memoryGrowth > 50 || handleGrowth > 10) {
        console.log('Potential resource leak detected');
    } else {
        console.log('Resource management healthy');
    }
    
    // Test 6: Error Handling Edge Cases
    console.log('\n--- Error Handling Security ---');
    
    const errorTests = [ // unusual inputs for error handler
        () => qserp.handleAxiosError(null, 'null error'),
        () => qserp.handleAxiosError(undefined, 'undefined error'),
        () => qserp.handleAxiosError({}, 'empty error'),
        () => qserp.handleAxiosError({ message: 'test' }, null),
        () => qserp.handleAxiosError({ message: 'test' }, undefined),
        () => qserp.handleAxiosError(new Error('circular'), { circular: {} })
    ];
    
    let errorHandlingIssues = 0; // count handler failures
    
    for (const test of errorTests) { // each test should not throw unexpectedly
        try {
            const result = await test(); //await async handler
            if (result === false) {
                errorHandlingIssues++;
            }
        } catch (error) {
            console.log(`Error handler threw exception: ${error.message.substring(0, 50)}`);
            errorHandlingIssues++;
        }
    }
    
    console.log(`Error handling robustness: ${errorTests.length - errorHandlingIssues}/${errorTests.length} tests passed`);
    
    console.log('\n=== Advanced Security Assessment Complete ===');
}

advancedSecurityTesting().catch(console.error); // launch when executed
