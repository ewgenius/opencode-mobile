import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MainContent } from '@/components/layout';

export default function Preferences() {
  const colorScheme = useColorScheme();
  const [darkMode, setDarkMode] = React.useState(colorScheme === 'dark');
  const [notifications, setNotifications] = React.useState(true);
  const [autoConnect, setAutoConnect] = React.useState(true);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const cardBackground = useThemeColor({}, 'background');

  const handleBack = () => {
    router.back();
  };

  const handleThemeChange = (value: boolean) => {
    setDarkMode(value);
    // TODO: Implement theme switching
    console.log('Theme changed:', value ? 'dark' : 'light');
  };

  const handleAbout = () => {
    // TODO: Navigate to about screen
    console.log('About pressed');
  };

  const handlePrivacy = () => {
    // TODO: Navigate to privacy screen
    console.log('Privacy pressed');
  };

  return (
    <MainContent>
      <ScrollView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={28} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor, fontFamily: Fonts.sans }]}>
            Preferences
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: Fonts.sans }]}>
            Appearance
          </Text>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <IconSymbol name="moon" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: Fonts.sans }]}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={handleThemeChange}
                trackColor={{ false: '#767577', true: tintColor }}
              />
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: Fonts.sans }]}>
            Notifications
          </Text>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <IconSymbol name="bell" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: Fonts.sans }]}>
                  Push Notifications
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#767577', true: tintColor }}
              />
            </View>
          </View>
        </View>

        {/* Connection Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: Fonts.sans }]}>
            Connection
          </Text>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <IconSymbol name="bolt" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: Fonts.sans }]}>
                  Auto-connect on Launch
                </Text>
              </View>
              <Switch
                value={autoConnect}
                onValueChange={setAutoConnect}
                trackColor={{ false: '#767577', true: tintColor }}
              />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: Fonts.sans }]}>
            About
          </Text>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <TouchableOpacity style={styles.settingRow} onPress={handleAbout}>
              <View style={styles.settingInfo}>
                <IconSymbol name="info.circle" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: Fonts.sans }]}>
                  About OpenCode
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={iconColor} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />

            <TouchableOpacity style={styles.settingRow} onPress={handlePrivacy}>
              <View style={styles.settingInfo}>
                <IconSymbol name="lock.shield" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: Fonts.sans }]}>
                  Privacy Policy
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Info */}
        <Text style={[styles.version, { color: iconColor, fontFamily: Fonts.sans }]}>
          Version 1.0.0 (Build 1)
        </Text>
      </ScrollView>
    </MainContent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
    opacity: 0.7,
  },
  card: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  version: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
    opacity: 0.6,
  },
});
