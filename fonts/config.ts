/**
 * Font Configuration
 *
 * Defines available fonts for UI and code display.
 * System fonts are used by default for immediate availability.
 */

import { Platform } from 'react-native';

export interface FontConfig {
  ui: string;
  code: string;
}

export interface FontOption {
  value: string;
  label: string;
  family: string;
}

// Platform-specific system UI fonts
const getSystemUIFonts = (): FontOption[] => {
  const baseFonts: FontOption[] = [{ value: 'System', label: 'System Default', family: 'System' }];

  if (Platform.OS === 'ios') {
    return [
      ...baseFonts,
      { value: 'SF Pro', label: 'SF Pro', family: 'SFPro-Regular' },
      { value: 'Helvetica', label: 'Helvetica', family: 'Helvetica' },
      { value: 'Arial', label: 'Arial', family: 'Arial' },
    ];
  }

  if (Platform.OS === 'android') {
    return [
      ...baseFonts,
      { value: 'Roboto', label: 'Roboto', family: 'Roboto' },
      { value: 'Helvetica', label: 'Helvetica', family: 'Helvetica' },
      { value: 'Arial', label: 'Arial', family: 'Arial' },
    ];
  }

  // Web platform
  return [
    ...baseFonts,
    { value: 'SF Pro', label: 'SF Pro', family: 'SF Pro' },
    { value: 'Roboto', label: 'Roboto', family: 'Roboto' },
    { value: 'Helvetica', label: 'Helvetica', family: 'Helvetica' },
    { value: 'Arial', label: 'Arial', family: 'Arial' },
  ];
};

// Monospace fonts for code display
export const MONOSPACE_FONTS: FontOption[] = [
  { value: 'System', label: 'System Monospace', family: 'monospace' },
  { value: 'Courier', label: 'Courier', family: 'Courier' },
  { value: 'Courier New', label: 'Courier New', family: 'Courier New' },
  { value: 'Menlo', label: 'Menlo', family: 'Menlo' },
  { value: 'Monaco', label: 'Monaco', family: 'Monaco' },
  { value: 'SF Mono', label: 'SF Mono', family: 'SFMono-Regular' },
  { value: 'Roboto Mono', label: 'Roboto Mono', family: 'Roboto Mono' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', family: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code', family: 'Fira Code' },
];

// System fonts for UI
export const SYSTEM_FONTS: FontOption[] = getSystemUIFonts();

// Font loading status tracker (for future custom font support)
export const LOADED_FONTS = new Set<string>();

// Default font configuration
export const DEFAULT_FONT_CONFIG: FontConfig = {
  ui: 'System',
  code: 'System',
};

// Get font family for a given font value
export function getFontFamily(value: string, type: 'ui' | 'code'): string {
  if (type === 'ui') {
    const font = SYSTEM_FONTS.find(f => f.value === value);
    return font?.family || 'System';
  } else {
    const font = MONOSPACE_FONTS.find(f => f.value === value);
    return font?.family || 'monospace';
  }
}

// Get font label for display
export function getFontLabel(value: string, type: 'ui' | 'code'): string {
  if (type === 'ui') {
    const font = SYSTEM_FONTS.find(f => f.value === value);
    return font?.label || value;
  } else {
    const font = MONOSPACE_FONTS.find(f => f.value === value);
    return font?.label || value;
  }
}
