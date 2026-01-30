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
  Alert
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function ServerSettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // TODO: Load server data from store based on id
  const [serverUrl, setServerUrl] = useState('https://example.com');
  const [password, setPassword] = useState('');
  const [serverName, setServerName] = useState('My Server');
  const [isSaving, setIsSaving] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const dangerColor = '#ff3b30';

  const handleSave = () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    setIsSaving(true);
    
    // TODO: Update server in store
    console.log('Updating server:', { id, serverUrl, password, serverName });
    
    setTimeout(() => {
      setIsSaving(false);
      router.back();
    }, 500);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Server',
      'Are you sure you want to delete this server? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // TODO: Delete server from store
            console.log('Deleting server:', id);
            router.replace('/');
          }
        },
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
    >
      <StatusBar style="auto" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor, fontFamily: Fonts.sans }]}>
            Server Settings
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
              style={[styles.input, { 
                backgroundColor: 'rgba(0,0,0,0.05)', 
                color: textColor,
                fontFamily: Fonts.sans 
              }]}
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
              style={[styles.input, { 
                backgroundColor: 'rgba(0,0,0,0.05)', 
                color: textColor,
                fontFamily: Fonts.sans 
              }]}
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
              style={[styles.input, { 
                backgroundColor: 'rgba(0,0,0,0.05)', 
                color: textColor,
                fontFamily: Fonts.sans 
              }]}
              placeholder="My Server"
              placeholderTextColor={iconColor}
              value={serverName}
              onChangeText={setServerName}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: tintColor }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={[styles.saveButtonText, { color: '#fff', fontFamily: Fonts.sans }]}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={[styles.dangerTitle, { color: dangerColor, fontFamily: Fonts.sans }]}>
            Danger Zone
          </Text>
          
          <TouchableOpacity 
            style={[styles.deleteButton, { borderColor: dangerColor }]}
            onPress={handleDelete}
          >
            <IconSymbol name="trash" size={20} color={dangerColor} />
            <Text style={[styles.deleteButtonText, { color: dangerColor, fontFamily: Fonts.sans }]}>
              Delete Server
            </Text>
          </TouchableOpacity>
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
  dangerZone: {
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  deleteButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
