/**
 * Cache Store
 *
 * Zustand store with MMKV persistence for API response caching with TTL.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Lazy initialization of MMKV instance to avoid crash on app launch
let storageInstance: MMKV | null = null;
let fallbackStorage: Map<string, string> | null = null;
let useFallback = false;

function getStorage(): MMKV {
  if (useFallback && fallbackStorage) {
    throw new Error('Fallback storage active');
  }

  if (!storageInstance) {
    try {
      storageInstance = new MMKV({
        id: 'cache-storage',
      });
    } catch (error) {
      console.error('Failed to initialize MMKV storage, using fallback:', error);
      useFallback = true;
      fallbackStorage = new Map();
      throw error;
    }
  }
  return storageInstance;
}

function getFallbackStorage(): Map<string, string> {
  if (!fallbackStorage) {
    fallbackStorage = new Map();
  }
  return fallbackStorage;
}

// Custom storage adapter for Zustand with lazy initialization and fallback
const mmkvStorage = {
  getItem: (name: string): string | null => {
    try {
      if (useFallback) {
        const fallback = getFallbackStorage();
        return fallback.get(name) ?? null;
      }
      const storage = getStorage();
      const value = storage.getString(name);
      return value ?? null;
    } catch (error) {
      console.error('MMKV getItem error:', error);
      // Try fallback
      try {
        const fallback = getFallbackStorage();
        return fallback.get(name) ?? null;
      } catch {
        return null;
      }
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (useFallback) {
        const fallback = getFallbackStorage();
        fallback.set(name, value);
        return;
      }
      const storage = getStorage();
      storage.set(name, value);
    } catch (error) {
      console.error('MMKV setItem error:', error);
      // Try fallback
      try {
        const fallback = getFallbackStorage();
        fallback.set(name, value);
      } catch {
        // Silently fail
      }
    }
  },
  removeItem: (name: string): void => {
    try {
      if (useFallback) {
        const fallback = getFallbackStorage();
        fallback.delete(name);
        return;
      }
      const storage = getStorage();
      storage.delete(name);
    } catch (error) {
      console.error('MMKV removeItem error:', error);
      // Try fallback
      try {
        const fallback = getFallbackStorage();
        fallback.delete(name);
      } catch {
        // Silently fail
      }
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

// Cache size limits
export const CACHE_LIMITS = {
  messages: 1000, // Max 1000 messages per session
} as const;

export type CacheType = keyof typeof CACHE_TTL;

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  lastSyncAt: number;
  accessCount: number;
  lastAccessed: number;
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
  // Cache size management
  enforceMessageLimit: (sessionId: string, limit?: number) => void;
  getCacheStats: () => CacheStats;
  getLastSyncAt: (type: CacheType, key: string) => number | null;
}

export interface CacheStats {
  projects: { count: number; totalSize: number; lastSyncAt: number | null };
  sessions: { count: number; totalSize: number; lastSyncAt: number | null };
  messages: { count: number; totalSize: number; lastSyncAt: number | null };
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
        const now = Date.now();
        const existingEntry = get().getCacheEntry<unknown>(type, key);
        const entry: CacheEntry<unknown> = {
          data,
          timestamp: now,
          ttl: customTtl || CACHE_TTL[type] || DEFAULT_CACHE_TTL,
          lastSyncAt: now,
          accessCount: existingEntry ? existingEntry.accessCount + 1 : 1,
          lastAccessed: now,
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
        // Update access tracking
        const now = Date.now();
        set(state => ({
          [type]: {
            ...state[type],
            [key]: {
              ...entry,
              accessCount: entry.accessCount + 1,
              lastAccessed: now,
            },
          },
        }));
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

      enforceMessageLimit: (sessionId: string, limit?: number) => {
        const entry = get().messages[sessionId];
        if (!entry) return;

        const messages = entry.data as Array<unknown>;
        if (!Array.isArray(messages)) return;

        const maxSize = limit || CACHE_LIMITS.messages;
        if (messages.length <= maxSize) return;

        // LRU eviction: Sort by last accessed and remove oldest
        const messagesWithMeta = messages.map((msg, index) => ({
          msg,
          index,
          // Use message timestamp or index as fallback for ordering
          timestamp:
            (msg as { createdAt?: number })?.createdAt ||
            Date.now() - (messages.length - index) * 1000,
        }));

        // Sort by timestamp ascending (oldest first)
        messagesWithMeta.sort((a, b) => a.timestamp - b.timestamp);

        // Keep only the most recent maxSize messages
        const toKeep = messagesWithMeta.slice(-maxSize);
        const newMessages = toKeep.map(item => item.msg);

        // Update cache with trimmed messages
        set(state => ({
          messages: {
            ...state.messages,
            [sessionId]: {
              ...entry,
              data: newMessages,
              lastSyncAt: Date.now(),
            },
          },
        }));
      },

      getCacheStats: () => {
        const state = get();
        const now = Date.now();

        const calculateStats = (entries: Record<string, CacheEntry<unknown>>) => {
          const values = Object.values(entries);
          const count = values.length;
          const totalSize = values.reduce((sum, entry) => {
            const dataSize = JSON.stringify(entry.data).length;
            return sum + dataSize;
          }, 0);
          const lastSyncAt =
            values.length > 0 ? Math.max(...values.map(e => e.lastSyncAt || 0)) : null;
          return { count, totalSize, lastSyncAt: lastSyncAt || null };
        };

        return {
          projects: calculateStats(state.projects),
          sessions: calculateStats(state.sessions),
          messages: calculateStats(state.messages),
        };
      },

      getLastSyncAt: (type: CacheType, key: string): number | null => {
        const entry = get()[type][key];
        return entry?.lastSyncAt || null;
      },
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
