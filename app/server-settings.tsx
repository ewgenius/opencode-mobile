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
import { router, useLocalSearchParams } from 'expo-router';
import { useServerStore, useServers, type Server } from '@/stores/serverStore';

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

export default function ServerSettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const servers = useServers();
  const { getServerById, updateServer, removeServer } = useServerStore();

  const [server, setServer] = useState<Server | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [password, setPassword] = useState('');
  const [serverName, setServerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [urlError, setUrlError] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { colors } = useTheme();
  const { uiFont } = useFonts();

  // Load server data
  useEffect(() => {
    if (!id) {
      setError('No server ID provided');
      setIsLoading(false);
      return;
    }

    const serverData = getServerById(id);
    if (!serverData) {
      setError('Server not found');
      setIsLoading(false);
      return;
    }

    setServer(serverData);
    setServerUrl(serverData.url);
    setPassword(serverData.password || '');
    setServerName(serverData.name);
    setIsLoading(false);
  }, [id, getServerById]);

  // Validate URL on change
  useEffect(() => {
    if (serverUrl.trim() && !isValidUrl(serverUrl)) {
      setUrlError('Please enter a valid URL (e.g., https://your-server.com)');
    } else {
      setUrlError('');
    }
  }, [serverUrl]);

  const handleSave = useCallback(async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    if (!isValidUrl(serverUrl)) {
      Alert.alert('Error', 'Please enter a valid URL format');
      return;
    }

    if (!id) {
      Alert.alert('Error', 'Server ID is missing');
      return;
    }

    setIsSaving(true);

    try {
      // Normalize URL - add protocol if missing
      let normalizedUrl = serverUrl.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      // Update server in store
      updateServer(id, {
        name: serverName.trim() || normalizedUrl,
        url: normalizedUrl,
        password: password || undefined,
      });

      Alert.alert('Success', 'Server settings updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('Failed to update server:', err);
      Alert.alert('Error', 'Failed to update server. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [id, serverUrl, serverName, password, updateServer]);

  const handleDelete = useCallback(() => {
    if (!id) return;

    Alert.alert(
      'Delete Server',
      'Are you sure you want to delete this server? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              removeServer(id);
              Alert.alert('Success', 'Server deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate to home if there are other servers, otherwise to connect-server
                    if (servers.length > 1) {
                      router.replace('/');
                    } else {
                      router.replace('/connect-server');
                    }
                  },
                },
              ]);
            } catch (err) {
              console.error('Failed to delete server:', err);
              Alert.alert('Error', 'Failed to delete server. Please try again.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [id, servers.length, removeServer]);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconSymbol name="server.rack" size={48} color={colors.icon} />
          <Text style={[styles.loadingText, { color: colors.text, fontFamily: uiFont }] as any}>
            Loading server settings...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !server) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.iconError} />
          <Text style={[styles.errorTitle, { color: colors.text, fontFamily: uiFont }] as any}>
            {error || 'Server not found'}
          </Text>
          <Text
            style={[styles.errorText, { color: colors.textSecondary, fontFamily: uiFont }] as any}
          >
            The server you&apos;re looking for doesn&apos;t exist or has been deleted.
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={() => router.replace('/')}
            style={styles.errorButton}
          >
            Go to Home
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text, fontFamily: uiFont }] as any}>
            Server Settings
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Server Info */}
        <View
          style={[
            styles.serverInfoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.serverInfoRow}>
            <IconSymbol name="server.rack" size={20} color={colors.icon} />
            <Text
              style={
                [styles.serverInfoLabel, { color: colors.textSecondary, fontFamily: uiFont }] as any
              }
            >
              Server ID:
            </Text>
            <Text
              style={[styles.serverInfoValue, { color: colors.text, fontFamily: uiFont }] as any}
            >
              {server.id}
            </Text>
          </View>
          <View style={styles.serverInfoRow}>
            <IconSymbol name="clock" size={20} color={colors.icon} />
            <Text
              style={
                [styles.serverInfoLabel, { color: colors.textSecondary, fontFamily: uiFont }] as any
              }
            >
              Added:
            </Text>
            <Text
              style={[styles.serverInfoValue, { color: colors.text, fontFamily: uiFont }] as any}
            >
              {new Date(server.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

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

          {/* Save Button */}
          <Button
            variant="primary"
            size="lg"
            onPress={handleSave}
            loading={isSaving}
            disabled={!serverUrl.trim() || !!urlError}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </View>

        {/* Danger Zone */}
        <View style={[styles.dangerZone, { borderTopColor: colors.border }]}>
          <Text
            style={[styles.dangerTitle, { color: colors.textOnError, fontFamily: uiFont }] as any}
          >
            Danger Zone
          </Text>

          <Button
            variant="secondary"
            size="lg"
            onPress={handleDelete}
            disabled={isDeleting}
            style={{
              borderWidth: 1,
              borderColor: colors.borderError,
              backgroundColor: colors.surfaceError,
            }}
          >
            <View style={styles.deleteButtonContent}>
              <IconSymbol name="trash" size={20} color={colors.iconError} />
              <Text
                style={
                  [
                    styles.deleteButtonText,
                    { color: colors.textOnError, fontFamily: uiFont },
                  ] as any
                }
              >
                {isDeleting ? 'Deleting...' : 'Delete Server'}
              </Text>
            </View>
          </Button>
        </View>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    marginTop: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  serverInfoCard: {
    padding: 16,
    borderRadius: 0,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  serverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serverInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  serverInfoValue: {
    flex: 1,
    fontSize: 14,
  },
  form: {
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  errorButton: {
    marginTop: 24,
  },
  dangerZone: {
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
