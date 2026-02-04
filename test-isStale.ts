// Simple test to verify isStale logic
const CACHE_TTL = {
  projects: 5 * 60 * 1000,
  sessions: 2 * 60 * 1000,
  messages: 30 * 1000,
};

const DEFAULT_CACHE_TTL = 60 * 1000;

// Simulating the cache entry structure
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// Simulating the isStale function
function isStale(entry: CacheEntry): boolean {
  if (!entry) return true;
  const age = Date.now() - entry.timestamp;
  console.log(`  age: ${age}ms, ttl: ${entry.ttl}ms, age > ttl: ${age > entry.ttl}`);
  return age > entry.ttl;
}

console.log('Test: should return true for expired cache');
const now = Date.now();
console.log(`  Current time: ${now}`);

// Create entry with 1ms TTL
const entry: CacheEntry = {
  data: { name: 'Test' },
  timestamp: now,
  ttl: 1,
};
console.log(`  Entry created at: ${entry.timestamp} with TTL: ${entry.ttl}ms`);

// Wait 50ms
setTimeout(() => {
  console.log(`\n  After 50ms, current time: ${Date.now()}`);
  const result = isStale(entry);
  console.log(`  isStale result: ${result}`);
  console.log(`  Expected: true`);
  console.log(`  Test ${result === true ? 'PASSED' : 'FAILED'}`);
  process.exit(result === true ? 0 : 1);
}, 50);
