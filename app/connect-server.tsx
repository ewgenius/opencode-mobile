import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { router } from 'expo-router';
import { useServers, useServerStore } from '@/stores/serverStore';
import { OpencodeApi } from '@/services/opencodeApi';

// URL validation regex
const URL_REGEX = /^(https?:\/\/)?(localhost|127\.0\.0\.1|[\w-]+(\.[\w-]+)+)(:\d+)?(\/.*)?$/;

// Simple URL validation helper
function isValidUrl(url: string): boolean {
  if (!url || url.trim().length === 0) return false;
  const trimmedUrl = url.trim();
  // Basic URL check
  return (
    URL_REGEX.test(trimmedUrl) ||
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://')
  );
}

export default function ConnectServer() {
  const servers = useServers();
  const { addServer } = useServerStore();

  // Determine if this is first launch (no existing servers)
  const isFirstLaunch = servers.length === 0;

  const [serverUrl, setServerUrl] = useState('');
  const [password, setPassword] = useState('');
  const [serverName, setServerName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [urlError, setUrlError] = useState<string>('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { colors } = useTheme();
  const { uiFont } = useFonts();

  // Validate URL on change
  useEffect(() => {
    if (serverUrl.trim() && !isValidUrl(serverUrl)) {
      setUrlError('Please enter a valid URL (e.g., https://your-server.com)');
    } else {
      setUrlError('');
    }
  }, [serverUrl]);

  // Clear test result when form changes
  useEffect(() => {
    setTestResult(null);
  }, [serverUrl, password]);

  const handleTestConnection = useCallback(async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    if (!isValidUrl(serverUrl)) {
      Alert.alert('Error', 'Please enter a valid URL format');
      return;
    }

    setIsConnecting(true);
    setTestResult(null);

    try {
      // Normalize URL - add protocol if missing
      let normalizedUrl = serverUrl.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      // Create a temporary server object for testing
      const tempServer = {
        id: 'test',
        name: serverName || 'Test Server',
        url: normalizedUrl,
        password: password || undefined,
        createdAt: Date.now(),
      };

      const api = new OpencodeApi(tempServer);
      const health = await api.health();

      if (health.healthy) {
        setTestResult({
          success: true,
          message: `Connection successful! Server version: ${health.version}`,
        });
      } else {
        setTestResult({
          success: false,
          message: 'Server responded but is not healthy',
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect to server',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [serverUrl, serverName, password]);

  const handleSave = useCallback(async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    if (!isValidUrl(serverUrl)) {
      Alert.alert('Error', 'Please enter a valid URL format');
      return;
    }

    setIsSaving(true);

    try {
      // Normalize URL - add protocol if missing
      let normalizedUrl = serverUrl.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      // Add server to store
      addServer({
        name: serverName.trim() || normalizedUrl,
        url: normalizedUrl,
        password: password || undefined,
      });

      // Navigate appropriately
      if (isFirstLaunch) {
        // First server - go to home
        router.replace('/');
      } else {
        // Adding another server - go back
        router.back();
      }
    } catch (error) {
      console.error('Failed to save server:', error);
      Alert.alert('Error', 'Failed to save server. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [serverUrl, serverName, password, isFirstLaunch, addServer]);

  const handleCancel = useCallback(() => {
    if (isFirstLaunch) {
      // Can't cancel on first launch, show alert
      Alert.alert('Exit Setup?', 'You need to connect to a server to use the app.', [
        { text: 'Continue Setup', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            // Could close the app here, but just stay on page
          },
        },
      ]);
    } else {
      router.back();
    }
  }, [isFirstLaunch]);

  // Dynamic header content based on mode
  const getHeaderContent = () => {
    if (isFirstLaunch) {
      return {
        title: 'Welcome!',
        subtitle: 'Connect to your OpenCode server to get started.',
        showBackButton: false,
      };
    }
    return {
      title: 'Connect Server',
      subtitle: null,
      showBackButton: true,
    };
  };

  const headerContent = getHeaderContent();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          {headerContent.showBackButton ? (
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={28} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          <Text style={[styles.title, { color: colors.text, fontFamily: uiFont }] as any}>
            {headerContent.title}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Subtitle for first launch */}
        {headerContent.subtitle && (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary, fontFamily: uiFont }] as any}
          >
            {headerContent.subtitle}
          </Text>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Server URL"
            placeholder="https://your-server.com"
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            error={urlError}
            size="lg"
          />

          <Input
            label="Password (optional)"
            placeholder="Enter password if required"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            size="lg"
          />

          <Input
            label="Server Name (optional)"
            placeholder="My Server"
            value={serverName}
            onChangeText={setServerName}
            size="lg"
          />

          {/* Test Connection Button */}
          <Button
            variant="secondary"
            size="lg"
            onPress={handleTestConnection}
            loading={isConnecting}
            disabled={!serverUrl.trim() || !!urlError}
          >
            {isConnecting ? 'Testing...' : 'Test Connection'}
          </Button>

          {/* Test Result Display */}
          {testResult && (
            <View
              style={[
                styles.testResult,
                {
                  backgroundColor: testResult.success ? colors.surfaceSuccess : colors.surfaceError,
                  borderColor: testResult.success ? colors.borderSuccess : colors.borderError,
                },
              ]}
            >
              <IconSymbol
                name={testResult.success ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                size={20}
                color={testResult.success ? colors.iconSuccess : colors.iconError}
              />
              <Text
                style={
                  [
                    styles.testResultText,
                    {
                      color: testResult.success ? colors.textOnSuccess : colors.textOnError,
                      fontFamily: uiFont,
                    },
                  ] as any
                }
              >
                {testResult.message}
              </Text>
            </View>
          )}

          {/* Save Button */}
          <Button
            variant="primary"
            size="lg"
            onPress={handleSave}
            loading={isSaving}
            disabled={!serverUrl.trim() || !!urlError}
          >
            {isFirstLaunch ? 'Get Started' : 'Save Server'}
          </Button>
        </View>

        {/* Help Text */}
        <Text style={[styles.helpText, { color: colors.textTertiary, fontFamily: uiFont }] as any}>
          {isFirstLaunch
            ? 'Enter your OpenCode server URL to connect. If your server requires authentication, enter the password. Need help? Contact your server administrator.'
            : 'Enter your OpenCode server URL to connect. If your server requires authentication, enter the password.'}
        </Text>

        {/* Instructions for first launch */}
        {isFirstLaunch && (
          <View
            style={[
              styles.instructionsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <IconSymbol name="info.circle.fill" size={20} color={colors.iconInfo} />
            <Text
              style={
                [
                  styles.instructionsText,
                  { color: colors.textSecondary, fontFamily: uiFont },
                ] as any
              }
            >
              To get started, you&apos;ll need an OpenCode server running. Visit our documentation
              to learn how to set one up.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  placeholder: {
    width: 44,
  },
  form: {
    gap: 20,
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 0,
    borderWidth: 1,
  },
  testResultText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 20,
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 0,
    borderWidth: 1,
    marginTop: 16,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
