/**
 * Stores Index
 *
 * Central export for all Zustand stores with MMKV persistence.
 */

// Preferences Store
export {
  usePreferencesStore,
  useThemeMode,
  useColorSchemeId,
  useUIFont,
  useCodeFont,
  useServerHost,
  useServerPort,
  type PreferencesState,
} from './preferencesStore';

// Server Store
export {
  useServerStore,
  useServers,
  useActiveServerId,
  useActiveServer,
  type Server,
  type ServerState,
} from './serverStore';

// Project Store
export {
  useProjectStore,
  useProjects,
  useActiveProjectId,
  useActiveProject,
  useProjectsForServer,
  type Project,
  type ProjectState,
} from './projectStore';

// Session Store
export {
  useSessionStore,
  useSessions,
  useActiveSessionId,
  useActiveSession,
  useSessionsForProject,
  useMessagesForSession,
  type Session,
  type Message,
  type SessionState,
} from './sessionStore';

// Cache Store
export {
  useCacheStore,
  useCacheEntry,
  useIsCacheStale,
  useCachedProjects,
  useCachedSessions,
  useCachedMessages,
  CACHE_TTL,
  DEFAULT_CACHE_TTL,
  type CacheType,
  type CacheEntry,
  type CacheState,
} from './cacheStore';
