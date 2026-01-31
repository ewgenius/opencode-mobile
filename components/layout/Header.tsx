import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { HeaderButton } from '@/components/ui/HeaderButton';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useApi } from '@/hooks/useApi';
import { useIsDeviceOffline } from '@/stores';
import { router } from 'expo-router';

interface HeaderProps {
  onMenuPress: () => void;
  title?: string;
}

export function Header({ onMenuPress, title = 'OpenCode' }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { uiFont } = useFonts();
  const { isConnected: isServerConnected } = useApi();
  const isDeviceOffline = useIsDeviceOffline();
  const backgroundColor = colors.background;
  const textColor = colors.text;
  const iconColor = colors.icon;

  // Show offline banner when device is offline OR server is not connected
  const showOfflineBanner = isDeviceOffline || !isServerConnected;

  const handleAddServer = () => {
    router.push('/connect-server');
  };

  const handleSettings = () => {
    router.push('/preferences');
  };

  // Determine offline message based on state
  const getOfflineSubtitle = (): string | undefined => {
    if (isDeviceOffline) {
      return 'Device offline - Check your internet connection';
    }
    if (!isServerConnected) {
      return 'Server unreachable - Check server connection';
    }
    return undefined;
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
        <HeaderButton
          icon="line.3.horizontal"
          size={24}
          color={textColor}
          onPress={onMenuPress}
          accessibilityLabel="Open menu"
        />

        {/* Title */}
        <Text style={[styles.title, { color: textColor, fontFamily: uiFont }]} numberOfLines={1}>
          {title}
        </Text>

        {/* Right Actions */}
        <View style={styles.rightActions}>
          <HeaderButton
            icon="plus"
            size={24}
            color={iconColor}
            onPress={handleAddServer}
            accessibilityLabel="Add server"
          />

          <HeaderButton
            icon="gear"
            size={22}
            color={iconColor}
            onPress={handleSettings}
            accessibilityLabel="Settings"
          />
        </View>
      </View>

      {/* Global Offline Banner */}
      {showOfflineBanner && <OfflineBanner subtitle={getOfflineSubtitle()} />}
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
    borderRadius: 0,
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
    gap: 0,
  },
});
