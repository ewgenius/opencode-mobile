import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { HeaderButton } from '@/components/ui/HeaderButton';

interface SessionHeaderProps {
  title?: string;
  onBackPress: () => void;
  onMorePress?: () => void;
}

export function SessionHeader({ title = 'Session', onBackPress, onMorePress }: SessionHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { uiFont } = useFonts();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <HeaderButton
          icon="chevron.left"
          size={28}
          color={colors.text}
          onPress={onBackPress}
          accessibilityLabel="Go back"
        />

        <Text style={[styles.title, { color: colors.text, fontFamily: uiFont }]} numberOfLines={1}>
          {title}
        </Text>

        <HeaderButton
          icon="ellipsis"
          size={24}
          color={colors.icon}
          onPress={onMorePress}
          accessibilityLabel="More options"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});
