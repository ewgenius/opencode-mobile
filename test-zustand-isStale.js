// Test to simulate Zustand persist behavior with isStale
const { create } = require('zustand');
const { persist, createJSONStorage } = require('zustand/middleware');

// Simple in-memory storage to simulate MMKV
const mockStorage = {
  data: new Map(),
  getItem: name => mockStorage.data.get(name) ?? null,
  setItem: (name, value) => mockStorage.data.set(name, value),
  removeItem: name => mockStorage.data.delete(name),
};

const CACHE_TTL = {
  projects: 5 * 60 * 1000,
  sessions: 2 * 60 * 1000,
  messages: 30 * 1000,
};

const DEFAULT_CACHE_TTL = 60 * 1000;

// Create the store similar to cacheStore.ts
const useCacheStore = create(
  persist(
    (set, get) => ({
      projects: {},
      sessions: {},
      messages: {},

      setCache: (type, key, data, customTtl) => {
        const now = Date.now();
        const entry = {
          data,
          timestamp: now,
          ttl: customTtl || CACHE_TTL[type] || DEFAULT_CACHE_TTL,
          lastSyncAt: now,
          accessCount: 1,
          lastAccessed: now,
        };
        set(state => ({
          [type]: {
            ...state[type],
            [key]: entry,
          },
        }));
      },

      isStale: (type, key) => {
        const entry = get()[type][key];
        if (!entry) {
          console.log('  Entry not found, returning true');
          return true;
        }
        const age = Date.now() - entry.timestamp;
        console.log(`  age: ${age}ms, ttl: ${entry.ttl}ms`);
        console.log(`  timestamp: ${entry.timestamp}, now: ${Date.now()}`);
        console.log(`  age > ttl: ${age > entry.ttl}`);
        return age > entry.ttl;
      },

      resetCache: () => set({ projects: {}, sessions: {}, messages: {} }),
    }),
    {
      name: 'test-cache-storage',
      storage: createJSONStorage(() => mockStorage),
    }
  )
);

async function runTest() {
  console.log('Test: should return true for expired cache');
  console.log('-------------------------------------------');

  // Reset storage
  mockStorage.data.clear();

  // Reset store
  useCacheStore.getState().resetCache();

  const store = useCacheStore.getState();
  console.log(`Setting cache with 1ms TTL at: ${Date.now()}`);
  store.setCache('projects', 'server-1', { name: 'Test' }, 1);

  console.log('\nWaiting 50ms...');
  await new Promise(resolve => setTimeout(resolve, 50));

  console.log(`\nChecking isStale at: ${Date.now()}`);
  const isStale = useCacheStore.getState().isStale('projects', 'server-1');

  console.log(`\nResult: isStale = ${isStale}`);
  console.log(`Expected: true`);
  console.log(`Test ${isStale === true ? 'PASSED ✓' : 'FAILED ✗'}`);

  process.exit(isStale === true ? 0 : 1);
}

runTest();
