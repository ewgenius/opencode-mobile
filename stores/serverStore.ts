/**
 * Server Store
 *
 * Zustand store with MMKV persistence for server connections and active server.
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
        id: 'server-storage',
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

export interface Server {
  id: string;
  name: string;
  url: string;
  password?: string;
  createdAt: number;
}

export interface ServerState {
  servers: Server[];
  activeServerId: string | null;

  // Actions
  addServer: (server: Omit<Server, 'id' | 'createdAt'>) => void;
  updateServer: (id: string, updates: Partial<Omit<Server, 'id' | 'createdAt'>>) => void;
  removeServer: (id: string) => void;
  setActiveServer: (id: string | null) => void;
  getServerById: (id: string) => Server | undefined;
  resetServers: () => void;
}

const initialState = {
  servers: [],
  activeServerId: null,
};

export const useServerStore = create<ServerState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addServer: serverData => {
        const newServer: Server = {
          ...serverData,
          id: generateServerId(),
          createdAt: Date.now(),
        };
        set(state => ({
          servers: [...state.servers, newServer],
          activeServerId: state.activeServerId || newServer.id,
        }));
      },

      updateServer: (id, updates) => {
        set(state => ({
          servers: state.servers.map(server =>
            server.id === id ? { ...server, ...updates } : server
          ),
        }));
      },

      removeServer: id => {
        set(state => {
          const newServers = state.servers.filter(server => server.id !== id);
          const newActiveId =
            state.activeServerId === id
              ? newServers.length > 0
                ? newServers[0].id
                : null
              : state.activeServerId;
          return {
            servers: newServers,
            activeServerId: newActiveId,
          };
        });
      },

      setActiveServer: id => {
        set({ activeServerId: id });
      },

      getServerById: id => {
        return get().servers.find(server => server.id === id);
      },

      resetServers: () => set(initialState),
    }),
    {
      name: 'server-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Selector hooks for better performance
export const useServers = () => useServerStore(state => state.servers);
export const useActiveServerId = () => useServerStore(state => state.activeServerId);
export const useActiveServer = () =>
  useServerStore(state =>
    state.activeServerId ? state.servers.find(s => s.id === state.activeServerId) : undefined
  );

// Helper function to generate unique server IDs
function generateServerId(): string {
  return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
