/**
 * Font Hooks
 *
 * React hooks for accessing and applying font preferences.
 * Provides immediate font style objects for UI and code components.
 */

import { useMemo } from 'react';
import { usePreferencesStore, useUIFont, useCodeFont } from '@/stores/preferencesStore';
import { getFontFamily, type FontConfig } from '@/fonts/config';

export interface FontStyles {
  ui: { fontFamily: string };
  code: { fontFamily: string };
}

/**
 * Hook to get both UI and code font styles
 * @returns Object with ui and code font style objects
 */
export function useFonts(): FontStyles {
  const uiFont = useUIFont();
  const codeFont = useCodeFont();

  return useMemo(
    () => ({
      ui: { fontFamily: getFontFamily(uiFont, 'ui') },
      code: { fontFamily: getFontFamily(codeFont, 'code') },
    }),
    [uiFont, codeFont]
  );
}

/**
 * Hook to get UI font style only
 * @returns UI font style object
 */
export function useUIFontStyle(): { fontFamily: string } {
  const uiFont = useUIFont();

  return useMemo(() => ({ fontFamily: getFontFamily(uiFont, 'ui') }), [uiFont]);
}

/**
 * Hook to get code font style only
 * @returns Code font style object
 */
export function useCodeFontStyle(): { fontFamily: string } {
  const codeFont = useCodeFont();

  return useMemo(() => ({ fontFamily: getFontFamily(codeFont, 'code') }), [codeFont]);
}

/**
 * Hook to get raw font configuration values
 * @returns FontConfig with raw font values
 */
export function useFontConfig(): FontConfig {
  const uiFont = useUIFont();
  const codeFont = useCodeFont();

  return useMemo(
    () => ({
      ui: uiFont,
      code: codeFont,
    }),
    [uiFont, codeFont]
  );
}

/**
 * Hook to get font actions
 * @returns Object with font setter functions
 */
export function useFontActions() {
  const { setUIFont, setCodeFont } = usePreferencesStore();

  return useMemo(
    () => ({
      setUIFont,
      setCodeFont,
      setFonts: (ui: string, code: string) => {
        setUIFont(ui);
        setCodeFont(code);
      },
    }),
    [setUIFont, setCodeFont]
  );
}
