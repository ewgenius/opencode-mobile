/**
 * Theme Index
 *
 * Theme list and utilities for loading themes.
 */

import type { MobileTheme, ThemeIndex, ThemeMetadata } from './types';

// Theme index loaded from generated assets
let themeIndex: ThemeIndex | null = null;

// Static map of theme IDs to their require statements
// This is required for Metro bundler to properly include all theme files
const themeModules: Record<string, () => MobileTheme> = {
  'oc-1': () => require('../assets/themes/oc-1.json'),
  ayu: () => require('../assets/themes/ayu.json'),
  aura: () => require('../assets/themes/aura.json'),
  catppuccin: () => require('../assets/themes/catppuccin.json'),
  carbonfox: () => require('../assets/themes/carbonfox.json'),
  dracula: () => require('../assets/themes/dracula.json'),
  gruvbox: () => require('../assets/themes/gruvbox.json'),
  monokai: () => require('../assets/themes/monokai.json'),
  nightowl: () => require('../assets/themes/nightowl.json'),
  nord: () => require('../assets/themes/nord.json'),
  onedarkpro: () => require('../assets/themes/onedarkpro.json'),
  shadesofpurple: () => require('../assets/themes/shadesofpurple.json'),
  solarized: () => require('../assets/themes/solarized.json'),
  tokyonight: () => require('../assets/themes/tokyonight.json'),
  vesper: () => require('../assets/themes/vesper.json'),
};

/**
 * Load the theme index from assets
 */
export async function loadThemeIndex(): Promise<ThemeIndex> {
  if (themeIndex) {
    return themeIndex;
  }

  try {
    // In React Native, we need to require the JSON file
    const index = require('../assets/themes/index.json');
    themeIndex = index as ThemeIndex;
    return themeIndex;
  } catch (error) {
    console.error('Failed to load theme index:', error);
    // Return default fallback
    return {
      themes: [{ id: 'oc-1', name: 'OC-1' }],
      defaultTheme: 'oc-1',
    };
  }
}

/**
 * Get list of available themes
 */
export async function getAvailableThemes(): Promise<ThemeMetadata[]> {
  const index = await loadThemeIndex();
  return index.themes;
}

/**
 * Get default theme ID
 */
export async function getDefaultThemeId(): Promise<string> {
  const index = await loadThemeIndex();
  return index.defaultTheme;
}

/**
 * Load a specific theme by ID
 */
export async function loadTheme(themeId: string): Promise<MobileTheme | null> {
  try {
    const themeLoader = themeModules[themeId];
    if (!themeLoader) {
      console.error(`Theme ${themeId} not found in theme map`);
      return null;
    }
    return themeLoader();
  } catch (error) {
    console.error(`Failed to load theme ${themeId}:`, error);
    return null;
  }
}

/**
 * Get colors for a specific mode from a theme
 */
export function getThemeColors(theme: MobileTheme, mode: 'dark' | 'light'): MobileTheme['light'] {
  return mode === 'dark' ? theme.dark : theme.light;
}

// Re-export types
export * from './types';
