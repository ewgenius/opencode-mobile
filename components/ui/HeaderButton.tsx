import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface HeaderButtonProps {
  icon: string;
  size?: number;
  color?: string;
  onPress?: () => void;
  accessibilityLabel: string;
  testID?: string;
}

export function HeaderButton({
  icon,
  size = 24,
  color,
  onPress,
  accessibilityLabel,
  testID,
}: HeaderButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <View style={styles.content}>
        <IconSymbol name={icon as any} size={size} color={color || '#000'} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
