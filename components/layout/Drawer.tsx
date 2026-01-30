import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 300);

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Drawer({ visible, onClose, children }: DrawerProps) {
  const sidebarBackground = useThemeColor({}, 'background');

  if (!visible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} pointerEvents="auto">
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </View>

      {/* Drawer Content */}
      <View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: sidebarBackground,
          },
        ]}
        pointerEvents="auto"
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
