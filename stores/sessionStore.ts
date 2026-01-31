/**
 * Session Store
 *
 * Zustand store with MMKV persistence for sessions and messages.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Lazy initialization of MMKV instance to avoid crash on app launch
let storageInstance: MMKV | null = null;

function getStorage(): MMKV {
  if (!storageInstance) {
    try {
      storageInstance = new MMKV({
        id: 'session-storage',
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
      storage.delete(name);
    } catch (error) {
      console.error('MMKV removeItem error:', error);
    }
  },
};

export interface Session {
  id: string;
  projectId: string;
  title: string;
  workspaceId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  model?: string;
  timestamp: number;
}

export interface SessionState {
  sessions: Record<string, Session[]>; // keyed by projectId
  messages: Record<string, Message[]>; // keyed by sessionId
  activeSessionId: string | null;

  // Actions
  setSessions: (projectId: string, sessions: Session[]) => void;
  addSession: (
    projectId: string,
    session: Omit<Session, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateSession: (
    projectId: string,
    sessionId: string,
    updates: Partial<Omit<Session, 'id' | 'projectId' | 'createdAt'>>
  ) => void;
  removeSession: (projectId: string, sessionId: string) => void;
  removeAllSessionsForProject: (projectId: string) => void;

  setMessages: (sessionId: string, messages: Message[]) => void;
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'sessionId'>) => void;
  updateMessage: (
    sessionId: string,
    messageId: string,
    updates: Partial<Omit<Message, 'id' | 'sessionId'>>
  ) => void;
  removeMessage: (sessionId: string, messageId: string) => void;
  clearMessagesForSession: (sessionId: string) => void;

  setActiveSession: (id: string | null) => void;
  getSessionsByProjectId: (projectId: string) => Session[];
  getSessionById: (sessionId: string) => Session | undefined;
  getMessagesBySessionId: (sessionId: string) => Message[];
  resetSessions: () => void;
}

const initialState = {
  sessions: {},
  messages: {},
  activeSessionId: null,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSessions: (projectId, sessions) => {
        set(state => ({
          sessions: {
            ...state.sessions,
            [projectId]: sessions,
          },
        }));
      },

      addSession: (projectId, sessionData) => {
        const newSession: Session = {
          ...sessionData,
          id: generateSessionId(),
          projectId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set(state => ({
          sessions: {
            ...state.sessions,
            [projectId]: [...(state.sessions[projectId] || []), newSession],
          },
          activeSessionId: state.activeSessionId || newSession.id,
        }));
      },

      updateSession: (projectId, sessionId, updates) => {
        set(state => ({
          sessions: {
            ...state.sessions,
            [projectId]: (state.sessions[projectId] || []).map(session =>
              session.id === sessionId ? { ...session, ...updates, updatedAt: Date.now() } : session
            ),
          },
        }));
      },

      removeSession: (projectId, sessionId) => {
        set(state => {
          const newSessions = {
            ...state.sessions,
            [projectId]: (state.sessions[projectId] || []).filter(
              session => session.id !== sessionId
            ),
          };
          // Also clear messages for this session
          const { [sessionId]: _, ...remainingMessages } = state.messages;
          const newActiveId =
            state.activeSessionId === sessionId
              ? newSessions[projectId]?.[0]?.id || null
              : state.activeSessionId;
          return {
            sessions: newSessions,
            messages: remainingMessages,
            activeSessionId: newActiveId,
          };
        });
      },

      removeAllSessionsForProject: projectId => {
        set(state => {
          const { [projectId]: sessionsToRemove, ...remainingSessions } = state.sessions;
          // Remove messages for all sessions in this project
          const sessionIdsToRemove = (sessionsToRemove || []).map(s => s.id);
          const remainingMessages = Object.fromEntries(
            Object.entries(state.messages).filter(
              ([sessionId]) => !sessionIdsToRemove.includes(sessionId)
            )
          );
          const wasActiveSessionFromProject = sessionIdsToRemove.some(
            id => id === state.activeSessionId
          );
          return {
            sessions: remainingSessions,
            messages: remainingMessages,
            activeSessionId: wasActiveSessionFromProject ? null : state.activeSessionId,
          };
        });
      },

      setMessages: (sessionId, messages) => {
        set(state => ({
          messages: {
            ...state.messages,
            [sessionId]: messages,
          },
        }));
      },

      addMessage: (sessionId, messageData) => {
        const newMessage: Message = {
          ...messageData,
          id: generateMessageId(),
          sessionId,
        };
        set(state => ({
          messages: {
            ...state.messages,
            [sessionId]: [...(state.messages[sessionId] || []), newMessage],
          },
        }));
      },

      updateMessage: (sessionId, messageId, updates) => {
        set(state => ({
          messages: {
            ...state.messages,
            [sessionId]: (state.messages[sessionId] || []).map(message =>
              message.id === messageId ? { ...message, ...updates } : message
            ),
          },
        }));
      },

      removeMessage: (sessionId, messageId) => {
        set(state => ({
          messages: {
            ...state.messages,
            [sessionId]: (state.messages[sessionId] || []).filter(
              message => message.id !== messageId
            ),
          },
        }));
      },

      clearMessagesForSession: sessionId => {
        set(state => {
          const { [sessionId]: _, ...remainingMessages } = state.messages;
          return { messages: remainingMessages };
        });
      },

      setActiveSession: id => {
        set({ activeSessionId: id });
      },

      getSessionsByProjectId: projectId => {
        return get().sessions[projectId] || [];
      },

      getSessionById: sessionId => {
        const { sessions } = get();
        for (const projectSessions of Object.values(sessions)) {
          const session = projectSessions.find(s => s.id === sessionId);
          if (session) return session;
        }
        return undefined;
      },

      getMessagesBySessionId: sessionId => {
        return get().messages[sessionId] || [];
      },

      resetSessions: () => set(initialState),
    }),
    {
      name: 'session-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Selector hooks for better performance
export const useSessions = () => useSessionStore(state => state.sessions);
export const useActiveSessionId = () => useSessionStore(state => state.activeSessionId);
export const useActiveSession = () =>
  useSessionStore(state =>
    state.activeSessionId ? state.getSessionById(state.activeSessionId) : undefined
  );
export const useSessionsForProject = (projectId: string) =>
  useSessionStore(state => state.sessions[projectId] || []);
export const useMessagesForSession = (sessionId: string) =>
  useSessionStore(state => state.messages[sessionId] || []);

// Helper functions to generate unique IDs
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
