/**
 * Theme Index
 * 
 * Theme list and utilities for loading themes.
 */

import type { MobileTheme, ThemeIndex, ThemeMetadata } from './types';

// Theme index loaded from generated assets
let themeIndex: ThemeIndex | null = null;

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
    // In React Native, we need to require the JSON file dynamically
    const theme = require(`../assets/themes/${themeId}.json`);
    return theme as MobileTheme;
  } catch (error) {
    console.error(`Failed to load theme ${themeId}:`, error);
    return null;
  }
}

/**
 * Get colors for a specific mode from a theme
 */
export function getThemeColors(
  theme: MobileTheme,
  mode: 'dark' | 'light'
): MobileTheme['light'] {
  return mode === 'dark' ? theme.dark : theme.light;
}

// Re-export types
export * from './types';
