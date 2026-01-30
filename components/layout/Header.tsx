import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';

interface HeaderProps {
  onMenuPress: () => void;
  title?: string;
}

export function Header({ onMenuPress, title = 'OpenCode' }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { ui } = useFonts();
  const backgroundColor = colors.background;
  const textColor = colors.text;
  const iconColor = colors.icon;

  const handleAddServer = () => {
    router.push('/connect-server');
  };

  const handleSettings = () => {
    router.push('/preferences');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: insets.top,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Hamburger Menu */}
        <TouchableOpacity
          onPress={onMenuPress}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="line.3.horizontal" size={24} color={textColor} />
        </TouchableOpacity>

        {/* Title */}
        <Text
          style={[styles.title, { color: textColor, fontFamily: ui.fontFamily }]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Right Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={handleAddServer}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="plus" size={24} color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSettings}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="gear" size={22} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
