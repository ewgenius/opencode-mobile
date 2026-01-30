import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';

export default function ConnectServer() {
  const [serverUrl, setServerUrl] = useState('');
  const [password, setPassword] = useState('');
  const [serverName, setServerName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const handleTestConnection = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    setIsConnecting(true);

    // TODO: Implement actual connection test with SDK
    // For now, simulate a delay
    setTimeout(() => {
      setIsConnecting(false);
      Alert.alert(
        'Connection Test',
        'This is a placeholder. Actual connection testing will be implemented in a future update.',
        [{ text: 'OK' }]
      );
    }, 1000);
  };

  const handleSave = () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    // TODO: Save to server store
    console.log('Saving server:', { serverUrl, password, serverName });

    // Navigate back or to project
    router.replace('/');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor, fontFamily: Fonts.sans }]}>
            Connect Server
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: iconColor, fontFamily: Fonts.sans }]}>
              Server URL
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  color: textColor,
                  fontFamily: Fonts.sans,
                },
              ]}
              placeholder="https://your-server.com"
              placeholderTextColor={iconColor}
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: iconColor, fontFamily: Fonts.sans }]}>
              Password (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  color: textColor,
                  fontFamily: Fonts.sans,
                },
              ]}
              placeholder="Enter password if required"
              placeholderTextColor={iconColor}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: iconColor, fontFamily: Fonts.sans }]}>
              Server Name (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  color: textColor,
                  fontFamily: Fonts.sans,
                },
              ]}
              placeholder="My Server"
              placeholderTextColor={iconColor}
              value={serverName}
              onChangeText={setServerName}
            />
          </View>

          {/* Test Connection Button */}
          <TouchableOpacity
            style={[styles.testButton, { borderColor: tintColor }]}
            onPress={handleTestConnection}
            disabled={isConnecting}
          >
            <Text style={[styles.testButtonText, { color: tintColor, fontFamily: Fonts.sans }]}>
              {isConnecting ? 'Testing...' : 'Test Connection'}
            </Text>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: tintColor }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: '#fff', fontFamily: Fonts.sans }]}>
              Save Server
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <Text style={[styles.helpText, { color: iconColor, fontFamily: Fonts.sans }]}>
          Enter your OpenCode server URL to connect. If your server requires authentication, enter
          the password.
        </Text>
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
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  testButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 20,
  },
});
