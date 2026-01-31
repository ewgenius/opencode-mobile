/**
 * Preferences Store
 *
 * Zustand store with MMKV persistence for theme and UI preferences.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { ThemeMode } from '@/themes/types';

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
        id: 'preferences-storage',
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

export interface PreferencesState {
  // Theme preferences
  themeMode: ThemeMode;
  colorSchemeId: string;

  // Font preferences
  uiFont: string;
  codeFont: string;

  // Server preferences
  serverHost: string;
  serverPort: number;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (schemeId: string) => void;
  setUIFont: (font: string) => void;
  setCodeFont: (font: string) => void;
  setServerHost: (host: string) => void;
  setServerPort: (port: number) => void;
  resetPreferences: () => void;
}

const initialState = {
  themeMode: 'system' as ThemeMode,
  colorSchemeId: 'oc-1',
  uiFont: 'System',
  codeFont: 'System',
  serverHost: 'localhost',
  serverPort: 3000,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    set => ({
      ...initialState,

      setThemeMode: mode => set({ themeMode: mode }),
      setColorScheme: schemeId => set({ colorSchemeId: schemeId }),
      setUIFont: font => set({ uiFont: font }),
      setCodeFont: font => set({ codeFont: font }),
      setServerHost: host => set({ serverHost: host }),
      setServerPort: port => set({ serverPort: port }),

      resetPreferences: () => set(initialState),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Selector hooks for better performance
export const useThemeMode = () => usePreferencesStore(state => state.themeMode);
export const useColorSchemeId = () => usePreferencesStore(state => state.colorSchemeId);
export const useUIFont = () => usePreferencesStore(state => state.uiFont);
export const useCodeFont = () => usePreferencesStore(state => state.codeFont);
export const useServerHost = () => usePreferencesStore(state => state.serverHost);
export const useServerPort = () => usePreferencesStore(state => state.serverPort);
