/**
 * React Query Hooks
 *
 * TanStack Query hooks for data fetching with caching.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useCacheStore, useActiveServerId, CACHE_TTL } from '@/stores';
import type { MessageWithParts } from '@/types/messageParts';

// API Types (from SDK)
interface ApiProject {
  id: string;
  name: string;
  path?: string;
  createdAt: number;
  updatedAt: number;
}

interface ApiSession {
  id: string;
  projectId: string;
  title: string;
  workspaceId?: string;
  createdAt: number;
  updatedAt: number;
}

// Query Keys
export const queryKeys = {
  projects: (serverId: string) => ['projects', serverId] as const,
  sessions: (projectId: string) => ['sessions', projectId] as const,
  messages: (sessionId: string) => ['messages', sessionId] as const,
};

/**
 * Hook to fetch projects for the active server
 */
export function useProjects(
  options?: Omit<
    UseQueryOptions<ApiProject[], Error, ApiProject[], ReturnType<typeof queryKeys.projects>>,
    'queryKey' | 'queryFn'
  >
) {
  const { client, isConnected } = useApi();
  const activeServerId = useActiveServerId();
  const cacheStore = useCacheStore();

  return useQuery({
    queryKey: queryKeys.projects(activeServerId || ''),
    queryFn: async () => {
      if (!client) throw new Error('No API client available');
      const projects = await client.getProjects();
      // Update cache store
      if (activeServerId) {
        cacheStore.setCache('projects', activeServerId, projects);
      }
      return projects;
    },
    enabled: isConnected && !!activeServerId,
    staleTime: CACHE_TTL.projects,
    ...options,
  });
}

/**
 * Hook to fetch sessions for a project
 */
export function useSessions(
  projectId: string | null,
  options?: Omit<
    UseQueryOptions<ApiSession[], Error, ApiSession[], ReturnType<typeof queryKeys.sessions>>,
    'queryKey' | 'queryFn'
  >
) {
  const { client, isConnected } = useApi();
  const cacheStore = useCacheStore();

  return useQuery({
    queryKey: queryKeys.sessions(projectId || ''),
    queryFn: async () => {
      if (!client) throw new Error('No API client available');
      if (!projectId) throw new Error('No project ID provided');
      const sessions = await client.getSessions(projectId);
      // Update cache store
      cacheStore.setCache('sessions', projectId, sessions);
      return sessions;
    },
    enabled: isConnected && !!projectId,
    staleTime: CACHE_TTL.sessions,
    ...options,
  });
}

/**
 * Hook to fetch messages for a session
 */
export function useMessages(
  sessionId: string | null,
  options?: Omit<
    UseQueryOptions<
      MessageWithParts[],
      Error,
      MessageWithParts[],
      ReturnType<typeof queryKeys.messages>
    >,
    'queryKey' | 'queryFn'
  >
) {
  const { client, isConnected } = useApi();
  const cacheStore = useCacheStore();

  return useQuery({
    queryKey: queryKeys.messages(sessionId || ''),
    queryFn: async () => {
      if (!client) throw new Error('No API client available');
      if (!sessionId) throw new Error('No session ID provided');
      const messages = await client.getMessages(sessionId);
      // Update cache store
      cacheStore.setCache('messages', sessionId, messages);
      return messages;
    },
    enabled: isConnected && !!sessionId,
    staleTime: CACHE_TTL.messages,
    ...options,
  });
}
