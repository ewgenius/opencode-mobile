/**
 * Theme Provider
 *
 * React context provider that loads pre-resolved themes and handles
 * dark/light/system modes. Provides useTheme() hook for components.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { MobileTheme, ThemeColors, ThemeContextValue } from '../themes/types';
import { loadTheme, getDefaultThemeId } from '../themes';
import { usePreferencesStore, useThemeMode, useColorSchemeId } from '../stores/preferencesStore';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
}

export function ThemeProvider({
  children,
  defaultTheme,
}: ThemeProviderProps): React.ReactElement | null {
  const systemColorScheme = useColorScheme();
  const themeMode = useThemeMode();
  const colorSchemeId = useColorSchemeId();
  const { setThemeMode, setColorScheme } = usePreferencesStore();

  const [theme, setTheme] = useState<MobileTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine effective color scheme based on mode
  const effectiveMode: 'dark' | 'light' = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  // Load theme
  useEffect(() => {
    let isMounted = true;

    async function loadCurrentTheme() {
      try {
        setIsLoading(true);
        const themeId = colorSchemeId || defaultTheme || (await getDefaultThemeId());
        const loadedTheme = await loadTheme(themeId);

        if (isMounted && loadedTheme) {
          setTheme(loadedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCurrentTheme();

    return () => {
      isMounted = false;
    };
  }, [colorSchemeId, defaultTheme]);

  // Get current colors based on mode
  const colors: ThemeColors = useMemo(() => {
    if (!theme) {
      // Return fallback colors while loading
      return getFallbackColors(effectiveMode);
    }
    return effectiveMode === 'dark' ? theme.dark : theme.light;
  }, [theme, effectiveMode]);

  // Track if theme is ready (loaded or has fallback)
  const isReady = useMemo(() => {
    return !isLoading || theme !== null;
  }, [isLoading, theme]);

  // Context value
  const contextValue: ThemeContextValue = useMemo(
    () => ({
      theme: theme || getFallbackTheme(effectiveMode),
      colors,
      mode: effectiveMode,
      themeMode,
      colorSchemeId: theme?.id || colorSchemeId,
      setThemeMode,
      setColorScheme,
      isDark: effectiveMode === 'dark',
      isReady,
    }),
    [theme, colors, effectiveMode, themeMode, colorSchemeId, setThemeMode, setColorScheme, isReady]
  );

  // Block rendering until theme is ready to prevent color flashes
  if (!isReady) {
    return null;
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

// Fallback colors for when theme is loading
function getFallbackColors(mode: 'dark' | 'light'): ThemeColors {
  if (mode === 'dark') {
    return {
      background: '#0a0a0a',
      backgroundSecondary: '#141414',
      backgroundTertiary: '#1a1a1a',
      surface: '#1a1a1a',
      surfaceHover: '#222222',
      surfaceActive: '#2a2a2a',
      surfaceRaised: '#222222',
      surfaceRaisedHover: '#2a2a2a',
      surfaceInset: '#141414',
      surfaceBrand: '#dcde8d',
      surfaceBrandHover: '#e8ea9a',
      surfaceInteractive: '#1a3a8a',
      surfaceInteractiveHover: '#2348a8',
      surfaceSuccess: '#1a4a1a',
      surfaceWarning: '#4a3a0a',
      surfaceError: '#4a1a1a',
      surfaceInfo: '#2a1a4a',
      text: '#e0e0e0',
      textSecondary: '#a0a0a0',
      textTertiary: '#808080',
      textStrong: '#ffffff',
      textInvert: '#0a0a0a',
      textInteractive: '#4a9eff',
      textOnBrand: '#0a0a0a',
      textOnInteractive: '#ffffff',
      textOnSuccess: '#4aff4a',
      textOnError: '#ff4a4a',
      textOnWarning: '#ffcc00',
      textOnInfo: '#9a4aff',
      border: '#2a2a2a',
      borderHover: '#3a3a3a',
      borderActive: '#4a4a4a',
      borderSelected: '#4a9eff',
      borderInteractive: '#4a9eff',
      borderSuccess: '#4aff4a',
      borderWarning: '#ffcc00',
      borderError: '#ff4a4a',
      borderInfo: '#9a4aff',
      inputBackground: '#141414',
      inputBackgroundHover: '#1a1a1a',
      inputBackgroundActive: '#1a3a8a',
      inputBackgroundSelected: '#2348a8',
      inputBackgroundDisabled: '#2a2a2a',
      buttonSecondary: '#1a1a1a',
      buttonSecondaryHover: '#222222',
      buttonGhostHover: '#1a1a1a',
      icon: '#808080',
      iconHover: '#a0a0a0',
      iconActive: '#c0c0c0',
      iconDisabled: '#505050',
      iconWeak: '#606060',
      iconStrong: '#e0e0e0',
      iconInteractive: '#4a9eff',
      iconSuccess: '#4aff4a',
      iconWarning: '#ffcc00',
      iconError: '#ff4a4a',
      iconInfo: '#9a4aff',
      syntaxComment: '#808080',
      syntaxString: '#00ceb9',
      syntaxKeyword: '#a0a0a0',
      syntaxPrimitive: '#ffba92',
      syntaxVariable: '#ffffff',
      syntaxProperty: '#ff9ae2',
      syntaxType: '#ecf58c',
      syntaxConstant: '#93e9f6',
      syntaxSuccess: '#4aff4a',
      syntaxWarning: '#ffcc00',
      syntaxError: '#ff4a4a',
      syntaxInfo: '#93e9f6',
      avatarBackgroundPink: '#501b3f',
      avatarBackgroundMint: '#033a34',
      avatarBackgroundOrange: '#5f2a06',
      avatarBackgroundPurple: '#432155',
      avatarBackgroundCyan: '#0f3058',
      avatarBackgroundLime: '#2b3711',
      avatarTextPink: '#e34ba9',
      avatarTextMint: '#95f3d9',
      avatarTextOrange: '#ff802b',
      avatarTextPurple: '#9d5bd2',
      avatarTextCyan: '#369eff',
      avatarTextLime: '#c4f042',
    };
  }

  return {
    background: '#f8f7f7',
    backgroundSecondary: '#f0f0f0',
    backgroundTertiary: '#fcfcfc',
    surface: '#ffffff',
    surfaceHover: '#f5f5f5',
    surfaceActive: '#eeeeee',
    surfaceRaised: '#ffffff',
    surfaceRaisedHover: '#f5f5f5',
    surfaceInset: '#f0f0f0',
    surfaceBrand: '#dcde8d',
    surfaceBrandHover: '#d0d280',
    surfaceInteractive: '#e0e8ff',
    surfaceInteractiveHover: '#d0d8f0',
    surfaceSuccess: '#e0f0e0',
    surfaceWarning: '#f0e8d0',
    surfaceError: '#f0e0e0',
    surfaceInfo: '#e8e0f0',
    text: '#1a1a1a',
    textSecondary: '#606060',
    textTertiary: '#808080',
    textStrong: '#000000',
    textInvert: '#ffffff',
    textInteractive: '#034cff',
    textOnBrand: '#1a1a1a',
    textOnInteractive: '#ffffff',
    textOnSuccess: '#0a8a0a',
    textOnError: '#cc1a1a',
    textOnWarning: '#8a6a00',
    textOnInfo: '#6a1acc',
    border: '#e0e0e0',
    borderHover: '#d0d0d0',
    borderActive: '#c0c0c0',
    borderSelected: '#034cff',
    borderInteractive: '#034cff',
    borderSuccess: '#0a8a0a',
    borderWarning: '#ccaa00',
    borderError: '#cc1a1a',
    borderInfo: '#6a1acc',
    inputBackground: '#ffffff',
    inputBackgroundHover: '#f5f5f5',
    inputBackgroundActive: '#e0e8ff',
    inputBackgroundSelected: '#d0d8f0',
    inputBackgroundDisabled: '#e0e0e0',
    buttonSecondary: '#f0f0f0',
    buttonSecondaryHover: '#e8e8e8',
    buttonGhostHover: '#f5f5f5',
    icon: '#808080',
    iconHover: '#606060',
    iconActive: '#404040',
    iconDisabled: '#c0c0c0',
    iconWeak: '#a0a0a0',
    iconStrong: '#1a1a1a',
    iconInteractive: '#034cff',
    iconSuccess: '#0a8a0a',
    iconWarning: '#ccaa00',
    iconError: '#cc1a1a',
    iconInfo: '#6a1acc',
    syntaxComment: '#808080',
    syntaxString: '#006656',
    syntaxKeyword: '#606060',
    syntaxPrimitive: '#fb4804',
    syntaxVariable: '#000000',
    syntaxProperty: '#ed6dc8',
    syntaxType: '#596600',
    syntaxConstant: '#007b80',
    syntaxSuccess: '#0a8a0a',
    syntaxWarning: '#ccaa00',
    syntaxError: '#cc1a1a',
    syntaxInfo: '#0092a8',
    avatarBackgroundPink: '#feeef8',
    avatarBackgroundMint: '#e1fbf4',
    avatarBackgroundOrange: '#fff1e7',
    avatarBackgroundPurple: '#f9f1fe',
    avatarBackgroundCyan: '#e7f9fb',
    avatarBackgroundLime: '#eefadc',
    avatarTextPink: '#cd1d8d',
    avatarTextMint: '#147d6f',
    avatarTextOrange: '#ed5f00',
    avatarTextPurple: '#8445bc',
    avatarTextCyan: '#0894b3',
    avatarTextLime: '#5d770d',
  };
}

function getFallbackTheme(mode: 'dark' | 'light'): MobileTheme {
  return {
    id: 'fallback',
    name: 'Fallback',
    light: getFallbackColors('light'),
    dark: getFallbackColors('dark'),
  };
}
