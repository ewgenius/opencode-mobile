import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { SymbolView } from 'expo-symbols';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps {
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  size?: SelectSize;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
}

const sizeStyles: Record<SelectSize, { height: number; fontSize: number; padding: number }> = {
  sm: { height: 32, fontSize: 14, padding: 8 },
  md: { height: 40, fontSize: 16, padding: 12 },
  lg: { height: 48, fontSize: 18, padding: 16 },
};

export function Select({
  value,
  options,
  onChange,
  size = 'md',
  label,
  placeholder = 'Select an option...',
  disabled = false,
  error,
  helper,
  containerStyle,
}: SelectProps) {
  const { colors, isDark } = useTheme();
  const { uiFont } = useFonts();
  const [isOpen, setIsOpen] = useState(false);
  const sizeConfig = sizeStyles[size];

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    },
    [onChange]
  );

  const wrapperStyle: ViewStyle = {
    gap: 4,
  };

  const labelStyle: TextStyle = {
    fontFamily: uiFont,
    fontSize: sizeConfig.fontSize - 2,
    color: colors.textSecondary,
    fontWeight: '500',
  };

  const triggerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: disabled ? colors.inputBackgroundDisabled : colors.inputBackground,
    borderWidth: 1,
    borderColor: error ? colors.borderError : colors.border,
    borderRadius: 8,
    borderCurve: 'continuous',
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.padding,
    opacity: disabled ? 0.6 : 1,
  };

  const triggerTextStyle: TextStyle = {
    fontFamily: uiFont,
    fontSize: sizeConfig.fontSize,
    color: selectedOption ? colors.text : colors.textTertiary,
  };

  const helperStyle: TextStyle = {
    fontFamily: uiFont,
    fontSize: sizeConfig.fontSize - 2,
    color: error ? colors.textOnError : colors.textTertiary,
  };

  const modalOverlayStyle: ViewStyle = {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  };

  const modalContentStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderCurve: 'continuous',
    width: '100%',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  };

  const optionStyle = (isSelected: boolean, isDisabled?: boolean): ViewStyle => ({
    paddingHorizontal: sizeConfig.padding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: isSelected ? colors.surfaceInteractive : 'transparent',
    opacity: isDisabled ? 0.4 : 1,
  });

  const optionTextStyle = (isSelected: boolean): TextStyle => ({
    fontFamily: uiFont,
    fontSize: sizeConfig.fontSize,
    color: isSelected ? colors.textOnInteractive : colors.text,
    fontWeight: isSelected ? '600' : '400',
  });

  return (
    <View style={[wrapperStyle, containerStyle]}>
      {label && (
        <Text style={labelStyle} selectable={false}>
          {label}
        </Text>
      )}
      <Pressable onPress={() => !disabled && setIsOpen(true)} disabled={disabled}>
        <View style={triggerStyle}>
          <Text style={triggerTextStyle} selectable={false}>
            {displayValue}
          </Text>
          <SymbolView
            name="chevron.down"
            size={sizeConfig.fontSize}
            tintColor={disabled ? colors.iconDisabled : colors.icon}
          />
        </View>
      </Pressable>
      {(helper || error) && (
        <Text style={helperStyle} selectable={false}>
          {error || helper}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={modalOverlayStyle} onPress={() => setIsOpen(false)}>
          <View style={modalContentStyle}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option, index) => (
                <Pressable
                  key={option.value}
                  onPress={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                  style={({ pressed }) => [
                    optionStyle(option.value === value, option.disabled),
                    pressed && !option.disabled && { backgroundColor: colors.surfaceHover },
                    index === options.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={optionTextStyle(option.value === value)} selectable={false}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
