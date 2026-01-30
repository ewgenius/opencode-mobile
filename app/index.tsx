import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

// Placeholder: Check if servers exist
// In the future, this will check the server store
const hasServers = false;
const lastProjectId = null;

export default function Index() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    // Check if we have servers configured
    if (!hasServers) {
      // No servers - show connect server screen
      router.replace('/connect-server');
    } else if (lastProjectId) {
      // Have servers and last project - redirect to it
      router.replace(`/project/${lastProjectId}`);
    } else {
      // Have servers but no last project - redirect to first project
      router.replace('/project/1');
    }
  }, []);

  // Show loading state while redirecting
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ActivityIndicator size="large" color={tintColor} />
      <Text style={[styles.text, { color: textColor, fontFamily: Fonts.sans }]}>Loading...</Text>
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
