import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  size?: InputSize;
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

const sizeStyles: Record<InputSize, { height: number; fontSize: number; padding: number }> = {
  sm: { height: 32, fontSize: 14, padding: 8 },
  md: { height: 40, fontSize: 16, padding: 12 },
  lg: { height: 48, fontSize: 18, padding: 16 },
};

export function Input({
  size = 'md',
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  containerStyle,
  editable = true,
  placeholderTextColor,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const { uiFont } = useFonts();
  const [isFocused, setIsFocused] = useState(false);
  const sizeConfig = sizeStyles[size];

  const getBackgroundColor = (): string => {
    if (!editable) return colors.inputBackgroundDisabled;
    if (isFocused) return colors.inputBackgroundActive;
    return colors.inputBackground;
  };

  const getBorderColor = (): string => {
    if (error) return colors.borderError;
    if (isFocused) return colors.borderInteractive;
    return colors.border;
  };

  const wrapperStyle: ViewStyle = {
    gap: 4,
  };

  const labelStyle: TextStyle = {
    fontFamily: uiFont,
    fontSize: sizeConfig.fontSize - 2,
    color: colors.textSecondary,
    fontWeight: '500',
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getBackgroundColor(),
    borderWidth: 1,
    borderColor: getBorderColor(),
    borderRadius: 8,
    borderCurve: 'continuous',
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.padding,
    gap: 8,
  };

  const inputStyle: TextStyle = {
    fontFamily: uiFont,
    flex: 1,
    fontSize: sizeConfig.fontSize,
    color: colors.text,
    height: sizeConfig.height,
    padding: 0,
  };

  const helperStyle: TextStyle = {
    fontFamily: uiFont,
    fontSize: sizeConfig.fontSize - 2,
    color: error ? colors.textOnError : colors.textTertiary,
  };

  return (
    <View style={[wrapperStyle, containerStyle]}>
      {label && (
        <Text style={labelStyle} selectable={false}>
          {label}
        </Text>
      )}
      <View style={inputContainerStyle}>
        {leftIcon}
        <TextInput
          style={inputStyle}
          editable={editable}
          placeholderTextColor={placeholderTextColor || colors.textTertiary}
          onFocus={e => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {rightIcon}
      </View>
      {(helper || error) && (
        <Text style={helperStyle} selectable={false}>
          {error || helper}
        </Text>
      )}
    </View>
  );
}
