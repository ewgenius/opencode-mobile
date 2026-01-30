import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { useServers, useActiveServerId } from '@/stores/serverStore';

export default function Index() {
  const servers = useServers();
  const activeServerId = useActiveServerId();
  const { colors } = useTheme();
  const { uiFont } = useFonts();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Defer navigation to ensure navigator is mounted
    const timeout = setTimeout(() => {
      // Check if we have servers configured
      if (servers.length === 0) {
        // No servers - show connect server screen for first launch
        router.replace('/connect-server');
      } else if (activeServerId) {
        // Have servers and active server - could redirect to server selection or project
        // For now, redirect to a placeholder project or server screen
        router.replace('/project/1');
      } else {
        // Have servers but no active server - let user select one
        router.replace('/select-server');
      }
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timeout);
  }, [servers, activeServerId]);

  // Show loading state while checking and redirecting
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.surfaceBrand} />
      <Text style={[styles.text, { color: colors.text, fontFamily: uiFont }]}>
        {isChecking ? 'Loading...' : 'Redirecting...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});
