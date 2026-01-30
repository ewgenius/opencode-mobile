/**
 * React Query Mutation Hooks
 *
 * TanStack Query mutation hooks for data mutations.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { queryKeys } from './useQueries';
import { useProjectStore, useSessionStore, useActiveServerId } from '@/stores';

// API Types
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

interface ApiMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  model?: string;
  timestamp: number;
}

/**
 * Hook to create a new project
 */
export function useCreateProject() {
  const { client } = useApi();
  const queryClient = useQueryClient();
  const activeServerId = useActiveServerId();
  const addProject = useProjectStore(state => state.addProject);

  return useMutation({
    mutationFn: async (name: string) => {
      if (!client) throw new Error('No API client available');
      return client.createProject(name);
    },
    onSuccess: (data: ApiProject) => {
      // Add to project store
      if (activeServerId) {
        addProject(activeServerId, {
          name: data.name,
          path: data.path,
        });
      }
      // Invalidate projects query
      if (activeServerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects(activeServerId) });
      }
    },
  });
}

/**
 * Hook to create a new session
 */
export function useCreateSession() {
  const { client } = useApi();
  const queryClient = useQueryClient();
  const addSession = useSessionStore(state => state.addSession);

  return useMutation({
    mutationFn: async ({ projectId, workspaceId }: { projectId: string; workspaceId?: string }) => {
      if (!client) throw new Error('No API client available');
      return client.createSession(projectId, workspaceId);
    },
    onSuccess: (data: ApiSession, variables) => {
      // Add to session store
      addSession(variables.projectId, {
        title: data.title,
        workspaceId: data.workspaceId,
      });
      // Invalidate sessions query
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(variables.projectId) });
    },
  });
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
  const { client } = useApi();
  const queryClient = useQueryClient();
  const addMessage = useSessionStore(state => state.addMessage);

  return useMutation({
    mutationFn: async ({
      sessionId,
      content,
      agent,
      model,
    }: {
      sessionId: string;
      content: string;
      agent?: string;
      model?: { providerID: string; modelID: string };
    }) => {
      if (!client) throw new Error('No API client available');

      // First add user message locally
      const userMessage: Omit<ApiMessage, 'id' | 'sessionId'> = {
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      addMessage(sessionId, userMessage);

      // Then send to API
      return client.sendMessage(sessionId, content, { agent, model });
    },
    onSuccess: (data: ApiMessage, variables) => {
      // Add assistant message to store
      addMessage(variables.sessionId, {
        role: data.role,
        content: data.content,
        agent: data.agent,
        model: data.model,
        timestamp: data.timestamp,
      });
      // Invalidate messages query
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.sessionId) });
    },
  });
}

/**
 * Hook to delete a session
 */
export function useDeleteSession() {
  const { client } = useApi();
  const queryClient = useQueryClient();
  const removeSession = useSessionStore(state => state.removeSession);

  return useMutation({
    mutationFn: async ({ projectId, sessionId }: { projectId: string; sessionId: string }) => {
      if (!client) throw new Error('No API client available');
      await client.deleteSession(sessionId);
      return { projectId, sessionId };
    },
    onSuccess: (_, variables) => {
      // Remove from session store
      removeSession(variables.projectId, variables.sessionId);
      // Invalidate sessions query
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(variables.projectId) });
    },
  });
}

/**
 * Hook to abort a running session
 */
export function useAbortSession() {
  const { client } = useApi();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!client) throw new Error('No API client available');
      await client.abortSession(sessionId);
    },
  });
}
