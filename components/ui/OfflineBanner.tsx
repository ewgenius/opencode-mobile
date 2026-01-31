/**
 * OfflineBanner Component
 *
 * A reusable banner component for displaying offline state with wifi.slash icon.
 * Supports theme colors and optional subtitle for additional context.
 */

import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface OfflineBannerProps {
  /** Additional subtitle text to display below the main "Offline" text */
  subtitle?: string;
  /** Custom style for the banner container */
  style?: ViewStyle;
  /** Whether to show the icon (default: true) */
  showIcon?: boolean;
  /** Custom text to display instead of "Offline" */
  text?: string;
}

export function OfflineBanner({
  subtitle,
  style,
  showIcon = true,
  text = 'Offline',
}: OfflineBannerProps) {
  const { colors } = useTheme();
  const { uiFont } = useFonts();

  const containerStyle: ViewStyle = {
    backgroundColor: colors.surfaceWarning,
    paddingHorizontal: 16,
    paddingVertical: subtitle ? 12 : 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  };

  const textStyle = {
    fontFamily: uiFont,
    fontSize: 14,
    color: colors.textOnWarning,
    fontWeight: '500' as const,
  };

  const subtitleStyle = {
    fontFamily: uiFont,
    fontSize: 12,
    color: colors.textOnWarning,
    opacity: 0.9,
    marginTop: 2,
  };

  return (
    <View style={containerStyle}>
      <View style={rowStyle}>
        {showIcon && <IconSymbol name="wifi.slash" size={16} color={colors.textOnWarning} />}
        <Text style={textStyle}>{text}</Text>
      </View>
      {subtitle && <Text style={subtitleStyle}>{subtitle}</Text>}
    </View>
  );
}

export default OfflineBanner;
