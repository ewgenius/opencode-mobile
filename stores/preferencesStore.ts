/**
 * Preferences Store
 *
 * Zustand store with MMKV persistence for theme and UI preferences.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { ThemeMode } from '@/themes/types';

// Create MMKV instance
const storage = createMMKV({
  id: 'preferences-storage',
});

// Custom storage adapter for Zustand
const mmkvStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.remove(name);
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
    (set) => ({
      ...initialState,

      setThemeMode: (mode) => set({ themeMode: mode }),
      setColorScheme: (schemeId) => set({ colorSchemeId: schemeId }),
      setUIFont: (font) => set({ uiFont: font }),
      setCodeFont: (font) => set({ codeFont: font }),
      setServerHost: (host) => set({ serverHost: host }),
      setServerPort: (port) => set({ serverPort: port }),

      resetPreferences: () => set(initialState),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Selector hooks for better performance
export const useThemeMode = () =>
  usePreferencesStore((state) => state.themeMode);
export const useColorSchemeId = () =>
  usePreferencesStore((state) => state.colorSchemeId);
export const useUIFont = () => usePreferencesStore((state) => state.uiFont);
export const useCodeFont = () =>
  usePreferencesStore((state) => state.codeFont);
export const useServerHost = () =>
  usePreferencesStore((state) => state.serverHost);
export const useServerPort = () =>
  usePreferencesStore((state) => state.serverPort);
