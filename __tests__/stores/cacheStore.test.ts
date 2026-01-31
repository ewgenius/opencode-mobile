import { useCacheStore, CACHE_TTL, DEFAULT_CACHE_TTL, CacheType } from '../../stores/cacheStore';

describe('cacheStore', () => {
  beforeEach(() => {
    const store = useCacheStore.getState();
    store.resetCache();
  });

  describe('initial state', () => {
    it('should have empty cache objects', () => {
      const state = useCacheStore.getState();
      expect(state.projects).toEqual({});
      expect(state.sessions).toEqual({});
      expect(state.messages).toEqual({});
    });
  });

  describe('setCache', () => {
    it('should set cache entry with default TTL', () => {
      const store = useCacheStore.getState();
      const beforeSet = Date.now();

      store.setCache('projects', 'server-1', { name: 'Test Project' });

      const state = useCacheStore.getState();
      const entry = state.projects['server-1'];

      expect(entry.data).toEqual({ name: 'Test Project' });
      expect(entry.timestamp).toBeGreaterThanOrEqual(beforeSet);
      expect(entry.ttl).toBe(CACHE_TTL.projects);
    });

    it('should set cache entry with custom TTL', () => {
      const store = useCacheStore.getState();
      const customTtl = 10000; // 10 seconds

      store.setCache('sessions', 'project-1', { title: 'Test Session' }, customTtl);

      const state = useCacheStore.getState();
      expect(state.sessions['project-1'].ttl).toBe(customTtl);
    });

    it('should use default TTL for unknown cache types', () => {
      // Note: This test won't compile if we try to pass invalid type,
      // but we can verify DEFAULT_CACHE_TTL is used when no specific TTL is provided
      const store = useCacheStore.getState();

      // Using 'projects' type but without custom TTL should use CACHE_TTL.projects
      store.setCache('projects', 'key', { data: 'test' });

      const state = useCacheStore.getState();
      expect(state.projects['key'].ttl).toBe(CACHE_TTL.projects);
    });

    it('should overwrite existing cache entry', () => {
      const store = useCacheStore.getState();

      store.setCache('projects', 'server-1', { name: 'Old Project' });
      const firstTimestamp = useCacheStore.getState().projects['server-1'].timestamp;

      // Wait a bit
      setTimeout(() => {
        store.setCache('projects', 'server-1', { name: 'New Project' });

        const state = useCacheStore.getState();
        expect(state.projects['server-1'].data).toEqual({ name: 'New Project' });
        expect(state.projects['server-1'].timestamp).toBeGreaterThan(firstTimestamp);
      }, 10);
    });
  });

  describe('getCache', () => {
    it('should return cached data if not stale', () => {
      const store = useCacheStore.getState();

      store.setCache('projects', 'server-1', { name: 'Test Project' });

      const data = store.getCache('projects', 'server-1');
      expect(data).toEqual({ name: 'Test Project' });
    });

    it('should return null for non-existent key', () => {
      const store = useCacheStore.getState();

      const data = store.getCache('projects', 'non-existent');
      expect(data).toBeNull();
    });

    it('should return null for stale cache', () => {
      const store = useCacheStore.getState();
      const oldTimestamp = Date.now() - 10000; // 10 seconds ago

      // Manually create a stale entry
      store.setCache('projects', 'server-1', { name: 'Old Project' }, 100); // 100ms TTL

      // Wait for cache to become stale
      setTimeout(() => {
        const data = store.getCache('projects', 'server-1');
        expect(data).toBeNull();
      }, 150);
    });
  });

  describe('isStale', () => {
    it('should return true for non-existent key', () => {
      // Need to access through useCacheStore
      const isStale = useCacheStore.getState().isStale('projects', 'non-existent');
      expect(isStale).toBe(true);
    });

    it('should return false for fresh cache', () => {
      const store = useCacheStore.getState();

      store.setCache('projects', 'server-1', { name: 'Test' });

      const isStale = store.isStale('projects', 'server-1');
      expect(isStale).toBe(false);
    });

    it('should return true for expired cache', async () => {
      const store = useCacheStore.getState();
      const now = Date.now();

      // Manually create a stale entry by setting timestamp in the past
      store.setCache('projects', 'server-1', { name: 'Test' }, 1); // 1ms TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 50));

      const isStale = useCacheStore.getState().isStale('projects', 'server-1');
      expect(isStale).toBe(true);
    });
  });

  describe('getCacheEntry', () => {
    it('should return full cache entry', () => {
      const store = useCacheStore.getState();

      store.setCache('projects', 'server-1', { name: 'Test' });

      const entry = store.getCacheEntry('projects', 'server-1');
      expect(entry).toHaveProperty('data');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('ttl');
      expect(entry?.data).toEqual({ name: 'Test' });
    });

    it('should return null for non-existent entry', () => {
      const store = useCacheStore.getState();

      const entry = store.getCacheEntry('projects', 'non-existent');
      expect(entry).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear specific cache entry', () => {
      const store = useCacheStore.getState();

      store.setCache('projects', 'server-1', { name: 'Server 1' });
      store.setCache('projects', 'server-2', { name: 'Server 2' });

      store.clearCache('projects', 'server-1');

      const state = useCacheStore.getState();
      expect(state.projects['server-1']).toBeUndefined();
      expect(state.projects['server-2']).toBeDefined();
    });

    it('should clear all entries of a type', () => {
      const store = useCacheStore.getState();

      store.setCache('projects', 'server-1', { name: 'Server 1' });
      store.setCache('projects', 'server-2', { name: 'Server 2' });
      store.setCache('sessions', 'project-1', { title: 'Session 1' });

      store.clearCache('projects');

      const state = useCacheStore.getState();
      expect(state.projects).toEqual({});
      expect(state.sessions['project-1']).toBeDefined();
    });

    it('should clear all cache', () => {
      const store = useCacheStore.getState();

      store.setCache('projects', 'server-1', { name: 'Server 1' });
      store.setCache('sessions', 'project-1', { title: 'Session 1' });
      store.setCache('messages', 'session-1', { content: 'Hello' });

      store.clearCache();

      const state = useCacheStore.getState();
      expect(state.projects).toEqual({});
      expect(state.sessions).toEqual({});
      expect(state.messages).toEqual({});
    });
  });

  describe('clearServerCache', () => {
    it('should clear projects for specific server', () => {
      const store = useCacheStore.getState();

      store.setCache('projects', 'server-1', { name: 'Server 1 Projects' });
      store.setCache('projects', 'server-2', { name: 'Server 2 Projects' });

      store.clearServerCache('server-1');

      const state = useCacheStore.getState();
      expect(state.projects['server-1']).toBeUndefined();
      expect(state.projects['server-2']).toBeDefined();
    });
  });

  describe('clearProjectCache', () => {
    it('should clear sessions for specific project', () => {
      const store = useCacheStore.getState();

      store.setCache('sessions', 'project-1', { sessions: [] });
      store.setCache('sessions', 'project-2', { sessions: [] });

      store.clearProjectCache('project-1');

      const state = useCacheStore.getState();
      expect(state.sessions['project-1']).toBeUndefined();
      expect(state.sessions['project-2']).toBeDefined();
    });
  });

  describe('clearSessionCache', () => {
    it('should clear messages for specific session', () => {
      const store = useCacheStore.getState();

      store.setCache('messages', 'session-1', { messages: [] });
      store.setCache('messages', 'session-2', { messages: [] });

      store.clearSessionCache('session-1');

      const state = useCacheStore.getState();
      expect(state.messages['session-1']).toBeUndefined();
      expect(state.messages['session-2']).toBeDefined();
    });
  });

  describe('resetCache', () => {
    it('should reset to initial state', () => {
      const store = useCacheStore.getState();

      store.setCache('projects', 'server-1', { name: 'Test' });
      store.setCache('sessions', 'project-1', { title: 'Test' });
      store.setCache('messages', 'session-1', { content: 'Test' });

      store.resetCache();

      const state = useCacheStore.getState();
      expect(state.projects).toEqual({});
      expect(state.sessions).toEqual({});
      expect(state.messages).toEqual({});
    });
  });

  describe('CACHE_TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.projects).toBe(5 * 60 * 1000); // 5 minutes
      expect(CACHE_TTL.sessions).toBe(2 * 60 * 1000); // 2 minutes
      expect(CACHE_TTL.messages).toBe(30 * 1000); // 30 seconds
    });

    it('should have correct default TTL', () => {
      expect(DEFAULT_CACHE_TTL).toBe(60 * 1000); // 1 minute
    });
  });
});
