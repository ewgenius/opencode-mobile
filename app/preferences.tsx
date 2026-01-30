import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { MainContent } from '@/components/layout';
import { useTheme } from '@/components/ThemeProvider';
import { usePreferencesStore, useThemeMode, useColorSchemeId } from '@/stores/preferencesStore';
import { getAvailableThemes, type ThemeMetadata } from '@/themes';
import type { ThemeMode } from '@/themes/types';

export default function Preferences() {
  const { colors } = useTheme();
  const themeMode = useThemeMode();
  const colorSchemeId = useColorSchemeId();
  const { setThemeMode, setColorScheme } = usePreferencesStore();
  const [notifications, setNotifications] = React.useState(true);
  const [autoConnect, setAutoConnect] = React.useState(true);
  const [availableThemes, setAvailableThemes] = useState<ThemeMetadata[]>([]);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    const themes = await getAvailableThemes();
    setAvailableThemes(themes);
  };

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const cardBackground = useThemeColor({}, 'background');

  const handleBack = () => {
    router.back();
  };

  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    setShowModePicker(false);
  };

  const handleColorSchemeChange = (schemeId: string) => {
    setColorScheme(schemeId);
    setShowThemePicker(false);
  };

  const getThemeModeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'dark':
        return 'Dark';
      case 'light':
        return 'Light';
      case 'system':
        return 'System';
    }
  };

  const getCurrentThemeName = () => {
    const theme = availableThemes.find(t => t.id === colorSchemeId);
    return theme?.name || 'OC-1';
  };

  const handleAbout = () => {
    console.log('About pressed');
  };

  const handlePrivacy = () => {
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
            {/* Theme Mode Selector */}
            <TouchableOpacity style={styles.settingRow} onPress={() => setShowModePicker(true)}>
              <View style={styles.settingInfo}>
                <IconSymbol name="moon" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: Fonts.sans }]}>
                  Theme Mode
                </Text>
              </View>
              <View style={styles.valueContainer}>
                <Text style={[styles.valueLabel, { color: iconColor, fontFamily: Fonts.sans }]}>
                  {getThemeModeLabel(themeMode)}
                </Text>
                <IconSymbol name="chevron.right" size={20} color={iconColor} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Color Scheme Selector */}
            <TouchableOpacity style={styles.settingRow} onPress={() => setShowThemePicker(true)}>
              <View style={styles.settingInfo}>
                <IconSymbol name="paintpalette" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: Fonts.sans }]}>
                  Color Scheme
                </Text>
              </View>
              <View style={styles.valueContainer}>
                <Text style={[styles.valueLabel, { color: iconColor, fontFamily: Fonts.sans }]}>
                  {getCurrentThemeName()}
                </Text>
                <IconSymbol name="chevron.right" size={20} color={iconColor} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Mode Picker Modal */}
        <Modal
          visible={showModePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModePicker(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
              <Text style={[styles.modalTitle, { color: textColor, fontFamily: Fonts.sans }]}>
                Select Theme Mode
              </Text>
              {(['light', 'dark', 'system'] as ThemeMode[]).map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modalOption,
                    themeMode === mode && { backgroundColor: colors.surfaceInteractive },
                  ]}
                  onPress={() => handleThemeModeChange(mode)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: textColor, fontFamily: Fonts.sans },
                      themeMode === mode && { color: colors.textInteractive },
                    ]}
                  >
                    {getThemeModeLabel(mode)}
                  </Text>
                  {themeMode === mode && (
                    <IconSymbol name="checkmark" size={20} color={colors.textInteractive} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.modalCancel, { borderTopColor: colors.border }]}
                onPress={() => setShowModePicker(false)}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: colors.textInteractive, fontFamily: Fonts.sans },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Color Scheme Picker Modal */}
        <Modal
          visible={showThemePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowThemePicker(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
              <Text style={[styles.modalTitle, { color: textColor, fontFamily: Fonts.sans }]}>
                Select Color Scheme
              </Text>
              <ScrollView style={styles.themeList}>
                {availableThemes.map(theme => (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.modalOption,
                      colorSchemeId === theme.id && { backgroundColor: colors.surfaceInteractive },
                    ]}
                    onPress={() => handleColorSchemeChange(theme.id)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        { color: textColor, fontFamily: Fonts.sans },
                        colorSchemeId === theme.id && { color: colors.textInteractive },
                      ]}
                    >
                      {theme.name}
                    </Text>
                    {colorSchemeId === theme.id && (
                      <IconSymbol name="checkmark" size={20} color={colors.textInteractive} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[styles.modalCancel, { borderTopColor: colors.border }]}
                onPress={() => setShowThemePicker(false)}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: colors.textInteractive, fontFamily: Fonts.sans },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueLabel: {
    fontSize: 16,
    opacity: 0.7,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  themeList: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 24,
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalCancel: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});
