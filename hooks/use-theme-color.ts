/**
 * @deprecated Use `useTheme()` from `@/components/ThemeProvider` instead.
 * This hook is maintained for backwards compatibility but will be removed in a future version.
 *
 * Example migration:
 * ```tsx
 * // Before:
 * const backgroundColor = useThemeColor({}, 'background');
 *
 * // After:
 * const { colors } = useTheme();
 * const backgroundColor = colors.background;
 * ```
 */

import { useTheme } from '@/components/ThemeProvider';
import type { ThemeColors } from '@/themes/types';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemeColors
): string {
  const { colors, mode } = useTheme();
  const colorFromProps = props[mode];

  if (colorFromProps) {
    return colorFromProps;
  }

  return colors[colorName];
}
