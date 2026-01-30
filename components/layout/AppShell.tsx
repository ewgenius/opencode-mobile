import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from './Header';
import { Drawer } from './Drawer';
import { Sidebar } from './Sidebar';
import { useThemeColor } from '@/hooks/use-theme-color';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title = 'OpenCode' }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const insets = useSafeAreaInsets();

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <View style={[styles.container, { backgroundColor, paddingBottom: insets.bottom }]}>
      {/* Header - always visible */}
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
