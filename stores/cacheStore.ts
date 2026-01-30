/**
 * Cache Store
 *
 * Zustand store with MMKV persistence for API response caching with TTL.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV, type MMKV } from 'react-native-mmkv';

// Lazy initialization of MMKV instance to avoid crash on app launch
let storageInstance: MMKV | null = null;

function getStorage(): MMKV {
  if (!storageInstance) {
    try {
      storageInstance = createMMKV({
        id: 'cache-storage',
      });
    } catch (error) {
      console.error('Failed to initialize MMKV storage:', error);
      throw error;
    }
  }
  return storageInstance;
}

// Custom storage adapter for Zustand with lazy initialization
const mmkvStorage = {
  getItem: (name: string): string | null => {
    try {
      const storage = getStorage();
      const value = storage.getString(name);
      return value ?? null;
    } catch (error) {
      console.error('MMKV getItem error:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      const storage = getStorage();
      storage.set(name, value);
    } catch (error) {
      console.error('MMKV setItem error:', error);
    }
  },
  removeItem: (name: string): void => {
    try {
      const storage = getStorage();
      storage.remove(name);
    } catch (error) {
      console.error('MMKV removeItem error:', error);
    }
  },
};

// Cache TTL configuration (in milliseconds)
export const CACHE_TTL = {
  projects: 5 * 60 * 1000, // 5 minutes
  sessions: 2 * 60 * 1000, // 2 minutes
  messages: 30 * 1000, // 30 seconds
} as const;

export const DEFAULT_CACHE_TTL = 60 * 1000; // 1 minute

export type CacheType = keyof typeof CACHE_TTL;

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheState {
  // Cached data keyed by type and id
  projects: Record<string, CacheEntry<unknown>>; // keyed by serverId
  sessions: Record<string, CacheEntry<unknown>>; // keyed by projectId
  messages: Record<string, CacheEntry<unknown>>; // keyed by sessionId

  // Actions
  setCache: <T>(type: CacheType, key: string, data: T, customTtl?: number) => void;
  getCache: <T>(type: CacheType, key: string) => T | null;
  isStale: (type: CacheType, key: string) => boolean;
  getCacheEntry: <T>(type: CacheType, key: string) => CacheEntry<T> | null;
  clearCache: (type?: CacheType, key?: string) => void;
  clearServerCache: (serverId: string) => void;
  clearProjectCache: (projectId: string) => void;
  clearSessionCache: (sessionId: string) => void;
  resetCache: () => void;
}

const initialState = {
  projects: {},
  sessions: {},
  messages: {},
};

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCache: (type, key, data, customTtl) => {
        const entry: CacheEntry<unknown> = {
          data,
          timestamp: Date.now(),
          ttl: customTtl || CACHE_TTL[type] || DEFAULT_CACHE_TTL,
        };
        set(state => ({
          [type]: {
            ...state[type],
            [key]: entry,
          },
        }));
      },

      getCache: <T>(type: CacheType, key: string): T | null => {
        const entry = get().getCacheEntry<T>(type, key);
        if (!entry) return null;
        if (get().isStale(type, key)) return null;
        return entry.data;
      },

      isStale: (type, key) => {
        const entry = get()[type][key];
        if (!entry) return true;
        const age = Date.now() - entry.timestamp;
        return age > entry.ttl;
      },

      getCacheEntry: <T>(type: CacheType, key: string): CacheEntry<T> | null => {
        const entry = get()[type][key];
        return entry ? (entry as CacheEntry<T>) : null;
      },

      clearCache: (type, key) => {
        if (type && key) {
          // Clear specific entry
          set(state => ({
            [type]: {
              ...state[type],
              [key]: undefined,
            },
          }));
        } else if (type) {
          // Clear all entries of a type
          set({ [type]: {} });
        } else {
          // Clear all cache
          set(initialState);
        }
      },

      clearServerCache: serverId => {
        set(state => {
          const { [serverId]: _, ...remainingProjects } = state.projects;
          return { projects: remainingProjects };
        });
      },

      clearProjectCache: projectId => {
        set(state => {
          const { [projectId]: _, ...remainingSessions } = state.sessions;
          return { sessions: remainingSessions };
        });
      },

      clearSessionCache: sessionId => {
        set(state => {
          const { [sessionId]: _, ...remainingMessages } = state.messages;
          return { messages: remainingMessages };
        });
      },

      resetCache: () => set(initialState),
    }),
    {
      name: 'cache-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Selector hooks for better performance
export const useCacheEntry = <T>(type: CacheType, key: string) =>
  useCacheStore(state => state.getCacheEntry<T>(type, key));

export const useIsCacheStale = (type: CacheType, key: string) =>
  useCacheStore(state => state.isStale(type, key));

// Utility hooks for common cache operations
export const useCachedProjects = (serverId: string) =>
  useCacheStore(state => state.getCache<unknown>('projects', serverId));

export const useCachedSessions = (projectId: string) =>
  useCacheStore(state => state.getCache<unknown>('sessions', projectId));

export const useCachedMessages = (sessionId: string) =>
  useCacheStore(state => state.getCache<unknown>('messages', sessionId));
