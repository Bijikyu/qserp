const { performance } = require('perf_hooks');

// Test with real bottleneck behavior (no CODEX mode)
process.env.DEBUG = 'false';
// Remove CODEX to test actual rate limiting
delete process.env.CODEX;

const qserp = require('./lib/qserp.js');

async function testRealRateLimiting() {
    console.log('=== Real Rate Limiting Test ===');
    
    // Test actual Bottleneck behavior with mock axios
    const MockAdapter = require('axios-mock-adapter');
    const axios = require('axios');
    const mock = new MockAdapter(qserp.axiosInstance);
    
    // Mock Google API responses
    mock.onGet().reply(200, {
        items: [
            { title: 'Test Result', snippet: 'Test snippet', link: 'https://example.com' }
        ]
    });
    
    console.log('Testing 20 requests with real rate limiting...');
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 20; i++) {
        promises.push(qserp.googleSearch(`rate-test-${i}`));
    }
    
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    const requestsPerSecond = 20 / (duration / 1000);
    
    console.log(`Duration: ${duration}ms`);
    console.log(`Rate: ${requestsPerSecond.toFixed(2)} requests/second`);
    
    // Test burst behavior
    console.log('Testing burst vs sustained patterns...');
    
    const burstStart = Date.now();
    const burstPromises = [];
    for (let i = 0; i < 10; i++) {
        burstPromises.push(qserp.googleSearch(`burst-${i}`));
    }
    await Promise.all(burstPromises);
    const burstDuration = Date.now() - burstStart;
    
    console.log(`Burst pattern (10 requests): ${burstDuration}ms`);
    console.log(`Burst rate: ${(10 / (burstDuration / 1000)).toFixed(2)} req/sec`);
    
    // Expected rate limiting: 60 requests/minute = 1 req/sec max
    // With minTime: 200ms = 5 req/sec max
    // Actual limit should be around 5 req/sec due to minTime setting
    
    if (requestsPerSecond > 10) {
        console.log('Rate limiting may need adjustment for production use');
    } else {
        console.log('Rate limiting working effectively');
    }
    
    mock.restore();
    console.log('=== Rate Limiting Test Complete ===');
}

testRealRateLimiting().catch(console.error);