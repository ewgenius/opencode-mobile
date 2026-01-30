/**
 * Font Hooks
 *
 * React hooks for accessing and applying font preferences.
 * Returns font family strings for direct use in style objects.
 */

import { useMemo } from 'react';
import {
  usePreferencesStore,
  useUIFont as useUIFontConfig,
  useCodeFont as useCodeFontConfig,
} from '@/stores/preferencesStore';
import { getFontFamily, type FontConfig } from '@/fonts/config';

export interface FontFamilies {
  uiFont: string;
  codeFont: string;
}

/**
 * Hook to get both UI and code font family strings
 * @returns Object with uiFont and codeFont strings
 * @example
 * const { uiFont, codeFont } = useFonts();
 * <Text style={{ fontFamily: uiFont }}>Hello</Text>
 */
export function useFonts(): FontFamilies {
  const uiFont = useUIFontConfig();
  const codeFont = useCodeFontConfig();

  return useMemo(
    () => ({
      uiFont: getFontFamily(uiFont, 'ui'),
      codeFont: getFontFamily(codeFont, 'code'),
    }),
    [uiFont, codeFont]
  );
}

/**
 * Hook to get UI font family string only
 * @returns UI font family string
 * @example
 * const uiFont = useUIFont();
 * <Text style={{ fontFamily: uiFont }}>Hello</Text>
 */
export function useUIFont(): string {
  const uiFont = useUIFontConfig();

  return useMemo(() => getFontFamily(uiFont, 'ui'), [uiFont]);
}

/**
 * Hook to get code font family string only
 * @returns Code font family string
 * @example
 * const codeFont = useCodeFont();
 * <Text style={{ fontFamily: codeFont }}>code</Text>
 */
export function useCodeFont(): string {
  const codeFont = useCodeFontConfig();

  return useMemo(() => getFontFamily(codeFont, 'code'), [codeFont]);
}

/**
 * Hook to get raw font configuration values
 * @returns FontConfig with raw font values
 */
export function useFontConfig(): FontConfig {
  const uiFont = useUIFontConfig();
  const codeFont = useCodeFontConfig();

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
