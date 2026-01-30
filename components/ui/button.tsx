import React from 'react';
import { Pressable, Text, type PressableProps, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, { padding: number; fontSize: number; height: number }> = {
  sm: { padding: 8, fontSize: 14, height: 32 },
  md: { padding: 12, fontSize: 16, height: 40 },
  lg: { padding: 16, fontSize: 18, height: 48 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  style,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const { ui } = useFonts();
  const sizeConfig = sizeStyles[size];

  const getBackgroundColor = (pressed: boolean): string => {
    if (disabled || loading) {
      switch (variant) {
        case 'primary':
          return colors.surfaceBrand;
        case 'secondary':
          return colors.buttonSecondary;
        case 'ghost':
        default:
          return 'transparent';
      }
    }

    if (pressed) {
      switch (variant) {
        case 'primary':
          return colors.surfaceBrandHover;
        case 'secondary':
          return colors.buttonSecondaryHover;
        case 'ghost':
        default:
          return colors.buttonGhostHover;
      }
    }

    switch (variant) {
      case 'primary':
        return colors.surfaceBrand;
      case 'secondary':
        return colors.buttonSecondary;
      case 'ghost':
      default:
        return 'transparent';
    }
  };

  const getTextColor = (): string => {
    if (disabled || loading) {
      switch (variant) {
        case 'primary':
          return colors.textOnBrand;
        case 'secondary':
        case 'ghost':
        default:
          return colors.textTertiary;
      }
    }

    switch (variant) {
      case 'primary':
        return colors.textOnBrand;
      case 'secondary':
      case 'ghost':
      default:
        return colors.text;
    }
  };

  const containerStyle = (pressed: boolean): ViewStyle => ({
    backgroundColor: getBackgroundColor(pressed),
    paddingHorizontal: sizeConfig.padding,
    height: sizeConfig.height,
    borderRadius: 8,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: disabled || loading ? 0.6 : 1,
  });

  const textStyle: TextStyle = {
    ...ui,
    color: getTextColor(),
    fontSize: sizeConfig.fontSize,
    fontWeight: '600',
  };

  const renderChildren = () => {
    if (typeof children === 'string') {
      return (
        <Text style={textStyle} selectable={false}>
          {children}
        </Text>
      );
    }
    return children;
  };

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [containerStyle(pressed), style as ViewStyle]}
      {...rest}
    >
      {renderChildren()}
    </Pressable>
  );
}
