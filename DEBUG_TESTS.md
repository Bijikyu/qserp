# Test Failure Analysis

Analyze and address the following test failures:

## Failed Test 1: /home/runner/workspace/__tests__/errorUtils.test.js

### Output:
```
  ● errorUtils › context creation functions › should create API error context with required fields

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:39:47)

  ● errorUtils › context creation functions › should create config error context with required fields

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:57:50)

  ● errorUtils › context creation functions › should create utility error context with required fields

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:74:51)

  ● errorUtils › context creation functions › should create cache error context with required fields

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:91:49)

  ● errorUtils › context creation functions › should create validation error context with required fields

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:108:54)

  ● errorUtils › error reporting functions › should report error with enriched context

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:127:37)

  ● errorUtils › error reporting functions › should handle qerrors failure gracefully

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:151:37)

  ● errorUtils › error reporting functions › should return false when qerrors throws

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:168:37)

  ● errorUtils › error reporting functions › should return false when safeQerrors resolves false

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:184:37)

  ● errorUtils › error reporting functions › should sanitize log messages when qerrors fails

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:200:37)

  ● errorUtils › convenience reporting functions › should report API error with proper context

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:220:40)

  ● errorUtils › convenience reporting functions › should report config error with proper context

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:242:43)

  ● errorUtils › convenience reporting functions › should return false when reportApiError fails

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:264:40)

  ● errorUtils › convenience reporting functions › should return false when reportConfigError fails

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:278:43)

  ● errorUtils › convenience reporting functions › should report validation error with proper context

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:292:47)

  ● errorUtils › context flexibility › should handle empty details gracefully

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:318:47)

  ● errorUtils › context flexibility › should merge custom details properly

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:330:51)

  ● errorUtils › timestamp generation › should generate valid ISO timestamps

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:350:47)

  ● errorUtils › timestamp generation › should generate unique timestamps for rapid calls

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (lib/errorUtils.js:24:28)
      at Object.require (__tests__/errorUtils.test.js:359:47)

```

### Duration: 1621ms

---

## Failed Test 2: /home/runner/workspace/__tests__/createCacheKey.test.js

### Output:
```
  ● createCacheKey › trims and lowercases query without num

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (__tests__/createCacheKey.test.js:24:32)

  ● createCacheKey › includes valid num parameter

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (__tests__/createCacheKey.test.js:30:32)

  ● createCacheKey › clamps out of range 0 to 1

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/createCacheKey.test.js:39:32)

  ● createCacheKey › clamps out of range 11 to 10

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/createCacheKey.test.js:39:32)

  ● createCacheKey › omits num when invalid undefined

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/createCacheKey.test.js:45:32)

  ● createCacheKey › omits num when invalid null

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/createCacheKey.test.js:45:32)

  ● createCacheKey › omits num when invalid NaN

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/createCacheKey.test.js:45:32)

  ● createCacheKey › omits num when invalid "bad"

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/createCacheKey.test.js:45:32)

  ● createCacheKey › omits num when invalid -1

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/createCacheKey.test.js:45:32)

```

### Duration: 243ms

---

## Failed Test 3: /home/runner/workspace/__tests__/memory-growth-analysis.test.js

### Output:
```
  ● memory-growth-analysis script › memoryGrowthAnalysis runs and logs completion

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (memory-growth-analysis.js:8:15)
      at Object.require (__tests__/memory-growth-analysis.test.js:24:38)

```

### Duration: 188ms

---

## Failed Test 4: /home/runner/workspace/__tests__/perf-analysis.test.js

### Output:
```
  ● perf-analysis script › cachePerformanceTest runs and logs summary

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (perf-analysis.js:10:15)
      at Object.require (__tests__/perf-analysis.test.js:24:38)

```

### Duration: 191ms

---

## Failed Test 5: /home/runner/workspace/__tests__/rate-limit-analysis.test.js

### Output:
```
  ● rate-limit-analysis script › rateLimitingAnalysis runs and logs completion

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (rate-limit-analysis.js:10:15)
      at Object.require (__tests__/rate-limit-analysis.test.js:23:38)

```

### Duration: 177ms

---

## Failed Test 6: /home/runner/workspace/__tests__/internalFunctions.test.js

### Output:
```
  ● rateLimitedRequest calls limiter and sets headers

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● rateLimitedRequest sets Referer header when env set

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● rateLimitedRequest uses custom axios instance

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● rateLimitedRequest rejects on axios failure and schedules call

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● fetchSearchItems returns items and uses num argument

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● getGoogleURL builds proper url

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● getGoogleURL encodes key and cx values

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● getGoogleURL omits credentials when absent in CODEX mode

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● handleAxiosError logs with qerrors and returns true

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● handleAxiosError logs sanitized response object and returns true

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● handleAxiosError masks api key in network error logs

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● handleAxiosError passes sanitized error to qerrors

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● handleAxiosError passes original error name to qerrors

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● handleAxiosError returns false when qerrors throws

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● rateLimitedRequest returns mock when CODEX=True

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● rateLimitedRequest returns mock when CODEX=true

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● rateLimitedRequest returns mock when CODEX=TRUE

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● rateLimitedRequest returns mock when CODEX=true

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● rateLimitedRequest returns mock when CODEX= true 

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● rateLimitedRequest returns mock when CODEX has spaces

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● fetchSearchItems bypasses url build in CODEX mode

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● fetchSearchItems does not create cache key in CODEX mode

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● validateSearchQuery accepts non-empty strings

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● validateSearchQuery throws for ""

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● validateSearchQuery throws for "   "

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● validateSearchQuery throws for 1

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● validateSearchQuery throws for {}

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● validateSearchQuery throws for []

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● sanitizeApiKey replaces all matches

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● sanitizeApiKey ignores partial-word matches

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● sanitizeApiKey masks encoded api key parameters

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● sanitizeApiKey escapes special characters in logs and urls

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● sanitizeApiKey returns sanitized string when regex fails

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● sanitizeApiKey masks encoded key when encodeURIComponent fails

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● sanitizeApiKey handles object input via toString

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● sanitizeApiKey handles number input without error

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● normalizeNum returns null when parseInt throws

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● normalizeNum returns null for invalid integer strings "10abc"

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● normalizeNum returns null for invalid integer strings "4.5"

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● handleAxiosError handles "plain error" input

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

  ● handleAxiosError handles {"foo": "bar"} input

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/internalFunctions.test.js:10:42)

```

### Duration: 1569ms

---

## Failed Test 7: /home/runner/workspace/__tests__/qserp.test.js

### Output:
```
  ● Test suite failed to run

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/qserp.test.js:4:45)

```

### Duration: 0ms

---

## Failed Test 8: /home/runner/workspace/__tests__/integrationCombined.test.js

### Output:
```
  ● Test suite failed to run

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/utils/testSetup.js:195:17)
      at Object.initSearchTest (__tests__/integrationCombined.test.js:5:43)

```

### Duration: 0ms

---

## Failed Test 9: /home/runner/workspace/__tests__/missingEnv.test.js

### Output:
```
  ● throwIfMissingEnvVars › module does not throw when CODEX true

    expect(received).not.toThrow()

    Error name:    "TypeError"
    Error message: "LRUCache is not a constructor"

          68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
          69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
        > 70 |         new LRUCache({
             |         ^
          71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
          72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
          73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at require (__tests__/missingEnv.test.js:36:18)
      at Object.<anonymous> (node_modules/expect/build/toThrowMatchers.js:74:11)
      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:320:21)
      at Object.toThrow (__tests__/missingEnv.test.js:36:47)
      at Object.toThrow (__tests__/missingEnv.test.js:36:47)

```

### Duration: 222ms

---

## Failed Test 10: /home/runner/workspace/__tests__/indexExport.test.js

### Output:
```
  ● Test suite failed to run

    TypeError: LRUCache is not a constructor

      68 | const cache = MAX_CACHE_SIZE === 0 ? //create noop cache when disabled
      69 |         { get: () => undefined, set: () => {}, clear: () => {}, purgeStale: () => false, size: 0 } : //keep interface stable for tests when caching is off
    > 70 |         new LRUCache({
         |         ^
      71 |                 max: MAX_CACHE_SIZE || 1000,  //LRU max entries when enabled
      72 |                 ttl: CACHE_TTL,               // Time-to-live in milliseconds
      73 |                 allowStale: false,            // Don't return stale items

      at Object.<anonymous> (lib/qserp.js:70:9)
      at Object.require (index.js:15:18)
      at Object.require (__tests__/indexExport.test.js:5:22)

```

### Duration: 0ms

---

## Summary

- Total failed tests: 10
- Failed test files: /home/runner/workspace/__tests__/errorUtils.test.js, /home/runner/workspace/__tests__/createCacheKey.test.js, /home/runner/workspace/__tests__/memory-growth-analysis.test.js, /home/runner/workspace/__tests__/perf-analysis.test.js, /home/runner/workspace/__tests__/rate-limit-analysis.test.js, /home/runner/workspace/__tests__/internalFunctions.test.js, /home/runner/workspace/__tests__/qserp.test.js, /home/runner/workspace/__tests__/integrationCombined.test.js, /home/runner/workspace/__tests__/missingEnv.test.js, /home/runner/workspace/__tests__/indexExport.test.js
- Generated: 2026-04-17T18:21:29.668Z
