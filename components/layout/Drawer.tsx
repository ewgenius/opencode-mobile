import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 300);

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Drawer({ visible, onClose, children }: DrawerProps) {
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);
  const sidebarBackground = useThemeColor({}, 'background');

  useEffect(() => {
    if (visible) {
      translateX.value = withSpring(0, {
        damping: 25,
        stiffness: 200,
      });
      backdropOpacity.value = withSpring(1, {
        damping: 25,
        stiffness: 200,
      });
    } else {
      translateX.value = withSpring(-DRAWER_WIDTH, {
        damping: 25,
        stiffness: 200,
      });
      backdropOpacity.value = withSpring(0, {
        damping: 25,
        stiffness: 200,
      });
    }
  }, [visible, translateX, backdropOpacity]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFill,
          styles.backdrop,
          backdropStyle
        ]}
        pointerEvents="auto"
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>
      
      {/* Drawer Content */}
      <Animated.View 
        style={[
          styles.drawer,
          { 
            width: DRAWER_WIDTH,
            backgroundColor: sidebarBackground,
          },
          drawerStyle
        ]}
        pointerEvents="auto"
      >
        {children}
      </Animated.View>
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
