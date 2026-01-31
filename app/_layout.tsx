import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts as useExpoFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AppShell } from '@/components/layout';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initializeNetworkMonitoring } from '@/stores';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

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

function RootLayoutInner() {
  const { isReady } = useTheme();

  // Initialize network monitoring when theme is ready
  useEffect(() => {
    if (isReady) {
      const cleanup = initializeNetworkMonitoring();
      return cleanup;
    }
  }, [isReady]);

  return (
    <ErrorBoundary>
      <RootLayoutContent />
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useExpoFonts({
    'GeistMono-Regular': require('../assets/fonts/GeistMono-Regular.ttf'),
    'GeistMono-Italic': require('../assets/fonts/GeistMono-Italic.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null to keep splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RootLayoutInner />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
