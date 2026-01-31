/**
 * Project Store
 *
 * Zustand store with MMKV persistence for projects per server and active project.
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
        id: 'project-storage',
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

export interface Project {
  id: string;
  serverId: string;
  name: string;
  path?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectState {
  projects: Record<string, Project[]>; // keyed by serverId
  activeProjectId: string | null;

  // Actions
  setProjects: (serverId: string, projects: Project[]) => void;
  addProject: (
    serverId: string,
    project: Omit<Project, 'id' | 'serverId' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateProject: (
    serverId: string,
    projectId: string,
    updates: Partial<Omit<Project, 'id' | 'serverId' | 'createdAt'>>
  ) => void;
  removeProject: (serverId: string, projectId: string) => void;
  removeAllProjectsForServer: (serverId: string) => void;
  setActiveProject: (id: string | null) => void;
  getProjectsByServerId: (serverId: string) => Project[];
  getProjectById: (projectId: string) => Project | undefined;
  resetProjects: () => void;
}

const initialState = {
  projects: {},
  activeProjectId: null,
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProjects: (serverId, projects) => {
        set(state => ({
          projects: {
            ...state.projects,
            [serverId]: projects,
          },
        }));
      },

      addProject: (serverId, projectData) => {
        const newProject: Project = {
          ...projectData,
          id: generateProjectId(),
          serverId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set(state => ({
          projects: {
            ...state.projects,
            [serverId]: [...(state.projects[serverId] || []), newProject],
          },
          activeProjectId: state.activeProjectId || newProject.id,
        }));
      },

      updateProject: (serverId, projectId, updates) => {
        set(state => ({
          projects: {
            ...state.projects,
            [serverId]: (state.projects[serverId] || []).map(project =>
              project.id === projectId ? { ...project, ...updates, updatedAt: Date.now() } : project
            ),
          },
        }));
      },

      removeProject: (serverId, projectId) => {
        set(state => {
          const newProjects = {
            ...state.projects,
            [serverId]: (state.projects[serverId] || []).filter(
              project => project.id !== projectId
            ),
          };
          const newActiveId =
            state.activeProjectId === projectId
              ? newProjects[serverId]?.[0]?.id || null
              : state.activeProjectId;
          return {
            projects: newProjects,
            activeProjectId: newActiveId,
          };
        });
      },

      removeAllProjectsForServer: serverId => {
        set(state => {
          const { [serverId]: _, ...remainingProjects } = state.projects;
          const serverProjects = state.projects[serverId] || [];
          const wasActiveProjectFromServer = serverProjects.some(
            p => p.id === state.activeProjectId
          );
          return {
            projects: remainingProjects,
            activeProjectId: wasActiveProjectFromServer ? null : state.activeProjectId,
          };
        });
      },

      setActiveProject: id => {
        set({ activeProjectId: id });
      },

      getProjectsByServerId: serverId => {
        return get().projects[serverId] || [];
      },

      getProjectById: projectId => {
        const { projects } = get();
        for (const serverProjects of Object.values(projects)) {
          const project = serverProjects.find(p => p.id === projectId);
          if (project) return project;
        }
        return undefined;
      },

      resetProjects: () => set(initialState),
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Selector hooks for better performance
export const useProjects = () => useProjectStore(state => state.projects);
export const useActiveProjectId = () => useProjectStore(state => state.activeProjectId);
export const useActiveProject = () =>
  useProjectStore(state =>
    state.activeProjectId ? state.getProjectById(state.activeProjectId) : undefined
  );
export const useProjectsForServer = (serverId: string) =>
  useProjectStore(state => state.projects[serverId] || []);

// Helper function to generate unique project IDs
function generateProjectId(): string {
  return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
