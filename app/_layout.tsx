import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AppShell } from '@/components/layout';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

function RootLayoutContent() {
  const { isDark } = useTheme();

  return (
    <>
      <AppShell>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="connect-server" />
          <Stack.Screen name="server-settings" />
          <Stack.Screen name="project/[id]" />
          <Stack.Screen name="session/[id]" />
          <Stack.Screen name="preferences" />
        </Stack>
      </AppShell>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
