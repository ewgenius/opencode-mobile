import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { Header } from './Header';
import { Drawer } from './Drawer';
import { Sidebar } from './Sidebar';
import { useThemeColor } from '@/hooks/use-theme-color';

interface AppShellProps {
  children: React.ReactNode;
}

// Route to title mapping
function getTitleFromPathname(pathname: string): string {
  // Root or connect server page
  if (pathname === '/' || pathname === '/connect-server') {
    return 'Connect Server';
  }

  // Project pages
  if (pathname.startsWith('/project/')) {
    return 'Projects';
  }

  // Session/chat pages
  if (pathname.startsWith('/session/')) {
    return 'Chat';
  }

  // Preferences/settings page
  if (pathname === '/preferences') {
    return 'Settings';
  }

  // Server settings page
  if (pathname === '/server-settings') {
    return 'Server Settings';
  }

  // Default fallback
  return 'OpenCode';
}

export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const title = useMemo(() => getTitleFromPathname(pathname), [pathname]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <View style={[styles.container, { backgroundColor, paddingBottom: insets.bottom }]}>
      {/* Header - always visible with dynamic title */}
      <Header onMenuPress={openDrawer} title={title} />

      {/* Main Content */}
      <View style={styles.content}>{children}</View>

      {/* Drawer - slides in from left */}
      <Drawer visible={drawerOpen} onClose={closeDrawer}>
        <Sidebar onItemPress={closeDrawer} />
      </Drawer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
