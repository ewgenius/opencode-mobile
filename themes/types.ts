/**
 * Theme Types
 *
 * Type definitions for the mobile theme system.
 */

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  // Background
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Surface
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  surfaceRaised: string;
  surfaceRaisedHover: string;
  surfaceInset: string;
  surfaceBrand: string;
  surfaceBrandHover: string;
  surfaceInteractive: string;
  surfaceInteractiveHover: string;
  surfaceSuccess: string;
  surfaceWarning: string;
  surfaceError: string;
  surfaceInfo: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textStrong: string;
  textInvert: string;
  textInteractive: string;
  textOnBrand: string;
  textOnInteractive: string;
  textOnSuccess: string;
  textOnError: string;
  textOnWarning: string;
  textOnInfo: string;

  // Border
  border: string;
  borderHover: string;
  borderActive: string;
  borderSelected: string;
  borderInteractive: string;
  borderSuccess: string;
  borderWarning: string;
  borderError: string;
  borderInfo: string;

  // Input
  inputBackground: string;
  inputBackgroundHover: string;
  inputBackgroundActive: string;
  inputBackgroundSelected: string;
  inputBackgroundDisabled: string;

  // Button
  buttonSecondary: string;
  buttonSecondaryHover: string;
  buttonGhostHover: string;

  // Icon
  icon: string;
  iconHover: string;
  iconActive: string;
  iconDisabled: string;
  iconWeak: string;
  iconStrong: string;
  iconInteractive: string;
  iconSuccess: string;
  iconWarning: string;
  iconError: string;
  iconInfo: string;

  // Syntax (for code highlighting)
  syntaxComment: string;
  syntaxString: string;
  syntaxKeyword: string;
  syntaxPrimitive: string;
  syntaxVariable: string;
  syntaxProperty: string;
  syntaxType: string;
  syntaxConstant: string;
  syntaxSuccess: string;
  syntaxWarning: string;
  syntaxError: string;
  syntaxInfo: string;

  // Avatar
  avatarBackgroundPink: string;
  avatarBackgroundMint: string;
  avatarBackgroundOrange: string;
  avatarBackgroundPurple: string;
  avatarBackgroundCyan: string;
  avatarBackgroundLime: string;
  avatarTextPink: string;
  avatarTextMint: string;
  avatarTextOrange: string;
  avatarTextPurple: string;
  avatarTextCyan: string;
  avatarTextLime: string;
}

export interface MobileTheme {
  id: string;
  name: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export interface ThemeMetadata {
  id: string;
  name: string;
}

export interface ThemeIndex {
  themes: ThemeMetadata[];
  defaultTheme: string;
}

export interface ThemeContextValue {
  theme: MobileTheme;
  colors: ThemeColors;
  mode: 'dark' | 'light';
  themeMode: ThemeMode;
  colorSchemeId: string;
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (schemeId: string) => void;
  isDark: boolean;
  isReady: boolean;
}
