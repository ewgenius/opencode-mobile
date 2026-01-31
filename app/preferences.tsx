import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { MainContent } from '@/components/layout';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { usePreferencesStore, useThemeMode, useColorSchemeId } from '@/stores/preferencesStore';
import { useCacheStore, type CacheStats } from '@/stores/cacheStore';
import { useQueryClient } from '@tanstack/react-query';
import { SYSTEM_FONTS, MONOSPACE_FONTS } from '@/fonts/config';
import { getAvailableThemes, type ThemeMetadata } from '@/themes';
import type { ThemeMode } from '@/themes/types';
import { Select } from '@/components/ui/select';

const THEME_MODE_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function Preferences() {
  const { colors } = useTheme();
  const { uiFont, codeFont } = useFonts();
  const themeMode = useThemeMode();
  const colorSchemeId = useColorSchemeId();
  const { setThemeMode, setColorScheme, setUIFont, setCodeFont } = usePreferencesStore();
  const [notifications, setNotifications] = React.useState(true);
  const [autoConnect, setAutoConnect] = React.useState(true);
  const [availableThemes, setAvailableThemes] = useState<ThemeMetadata[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const cacheStore = useCacheStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadThemes();
    updateCacheStats();
  }, []);

  const updateCacheStats = useCallback(() => {
    const stats = cacheStore.getCacheStats();
    setCacheStats(stats);
  }, [cacheStore]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear All Cache',
      'This will clear all cached data including projects, sessions, and messages. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: () => {
            cacheStore.resetCache();
            queryClient.clear();
            updateCacheStats();
          },
        },
      ]
    );
  }, [cacheStore, queryClient, updateCacheStats]);

  const handleRefreshProjects = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    updateCacheStats();
  }, [queryClient, updateCacheStats]);

  const handleRefreshSessions = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['sessions'] });
    updateCacheStats();
  }, [queryClient, updateCacheStats]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const loadThemes = async () => {
    const themes = await getAvailableThemes();
    setAvailableThemes(themes);
  };

  const backgroundColor = colors.background;
  const textColor = colors.text;
  const tintColor = colors.iconInteractive;
  const iconColor = colors.icon;

  const handleBack = () => {
    router.back();
  };

  const handleThemeModeChange = (mode: string) => {
    setThemeMode(mode as ThemeMode);
  };

  const handleColorSchemeChange = (schemeId: string) => {
    setColorScheme(schemeId);
  };

  const handleUIFontChange = (font: string) => {
    setUIFont(font);
  };

  const handleCodeFontChange = (font: string) => {
    setCodeFont(font);
  };

  const getCurrentThemeName = () => {
    const theme = availableThemes.find(t => t.id === colorSchemeId);
    return theme?.name || 'OC-1';
  };

  const themeOptions = availableThemes.map(theme => ({
    value: theme.id,
    label: theme.name,
  }));

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
          <Text style={[styles.title, { color: textColor, fontFamily: uiFont }]}>Preferences</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: uiFont }]}>
            Appearance
          </Text>

          <View
            style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}
          >
            {/* Theme Mode Selector */}
            <View style={styles.selectRow}>
              <View style={styles.settingInfo}>
                <IconSymbol name="moon" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: uiFont }]}>
                  Theme Mode
                </Text>
              </View>
              <View style={styles.selectContainer}>
                <Select
                  value={themeMode}
                  options={THEME_MODE_OPTIONS}
                  onChange={handleThemeModeChange}
                  size="sm"
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Color Scheme Selector */}
            <View style={styles.selectRow}>
              <View style={styles.settingInfo}>
                <IconSymbol name="paintpalette" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: uiFont }]}>
                  Color Scheme
                </Text>
              </View>
              <View style={styles.selectContainer}>
                <Select
                  value={colorSchemeId}
                  options={themeOptions}
                  onChange={handleColorSchemeChange}
                  size="sm"
                  placeholder="Select theme..."
                />
              </View>
            </View>
          </View>
        </View>

        {/* Typography Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: uiFont }]}>
            Typography
          </Text>

          <View
            style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}
          >
            {/* UI Font Selector */}
            <View style={styles.selectRow}>
              <View style={styles.settingInfo}>
                <IconSymbol name="textformat" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: uiFont }]}>
                  UI Font
                </Text>
              </View>
              <View style={styles.selectContainer}>
                <Select
                  value={uiFont}
                  options={SYSTEM_FONTS}
                  onChange={handleUIFontChange}
                  size="sm"
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Code Font Selector */}
            <View style={styles.selectRow}>
              <View style={styles.settingInfo}>
                <IconSymbol name="doc.text" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: uiFont }]}>
                  Code Font
                </Text>
              </View>
              <View style={styles.selectContainer}>
                <Select
                  value={codeFont}
                  options={MONOSPACE_FONTS}
                  onChange={handleCodeFontChange}
                  size="sm"
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Font Preview */}
            <View style={styles.previewContainer}>
              <Text style={[styles.previewLabel, { color: iconColor, fontFamily: uiFont }]}>
                Preview
              </Text>
              <View style={[styles.previewBox, { backgroundColor: colors.surface }]}>
                <Text style={[{ color: textColor, fontFamily: uiFont }]}>
                  UI Font: The quick brown fox jumps over the lazy dog
                </Text>
                <Text style={[{ color: textColor, marginTop: 8, fontFamily: codeFont }]}>
                  Code Font: function hello() {'{'} return 42; {'}'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: uiFont }]}>
            Notifications
          </Text>

          <View
            style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <IconSymbol name="bell" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: uiFont }]}>
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
          <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: uiFont }]}>
            Connection
          </Text>

          <View
            style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <IconSymbol name="bolt" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: uiFont }]}>
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

        {/* Cache Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: uiFont }]}>Cache</Text>

          <View
            style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}
          >
            {/* Cache Stats */}
            {cacheStats && (
              <>
                <View style={styles.cacheStatsContainer}>
                  <View style={styles.cacheStatRow}>
                    <Text style={[styles.cacheStatLabel, { color: iconColor, fontFamily: uiFont }]}>
                      Projects
                    </Text>
                    <Text style={[styles.cacheStatValue, { color: textColor, fontFamily: uiFont }]}>
                      {cacheStats.projects.count} items (
                      {formatBytes(cacheStats.projects.totalSize)})
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.cacheSyncTime,
                      { color: colors.textTertiary, fontFamily: uiFont },
                    ]}
                  >
                    Last sync: {formatTime(cacheStats.projects.lastSyncAt)}
                  </Text>

                  <View style={[styles.cacheStatRow, { marginTop: 12 }]}>
                    <Text style={[styles.cacheStatLabel, { color: iconColor, fontFamily: uiFont }]}>
                      Sessions
                    </Text>
                    <Text style={[styles.cacheStatValue, { color: textColor, fontFamily: uiFont }]}>
                      {cacheStats.sessions.count} items (
                      {formatBytes(cacheStats.sessions.totalSize)})
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.cacheSyncTime,
                      { color: colors.textTertiary, fontFamily: uiFont },
                    ]}
                  >
                    Last sync: {formatTime(cacheStats.sessions.lastSyncAt)}
                  </Text>

                  <View style={[styles.cacheStatRow, { marginTop: 12 }]}>
                    <Text style={[styles.cacheStatLabel, { color: iconColor, fontFamily: uiFont }]}>
                      Messages
                    </Text>
                    <Text style={[styles.cacheStatValue, { color: textColor, fontFamily: uiFont }]}>
                      {cacheStats.messages.count} items (
                      {formatBytes(cacheStats.messages.totalSize)})
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.cacheSyncTime,
                      { color: colors.textTertiary, fontFamily: uiFont },
                    ]}
                  >
                    Last sync: {formatTime(cacheStats.messages.lastSyncAt)}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </>
            )}

            {/* Refresh Projects */}
            <TouchableOpacity style={styles.settingRow} onPress={handleRefreshProjects}>
              <View style={styles.settingInfo}>
                <IconSymbol name="arrow.clockwise" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: uiFont }]}>
                  Refresh Projects
                </Text>
              </View>
              <IconSymbol name="arrow.clockwise" size={20} color={iconColor} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Refresh Sessions */}
            <TouchableOpacity style={styles.settingRow} onPress={handleRefreshSessions}>
              <View style={styles.settingInfo}>
                <IconSymbol name="arrow.clockwise.circle" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: uiFont }]}>
                  Refresh Sessions
                </Text>
              </View>
              <IconSymbol name="arrow.clockwise" size={20} color={iconColor} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Clear Cache */}
            <TouchableOpacity style={styles.settingRow} onPress={handleClearCache}>
              <View style={styles.settingInfo}>
                <IconSymbol name="trash" size={22} color="#ff3b30" />
                <Text style={[styles.settingLabel, { color: '#ff3b30', fontFamily: uiFont }]}>
                  Clear All Cache
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: uiFont }]}>About</Text>

          <View
            style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}
          >
            <TouchableOpacity style={styles.settingRow} onPress={handleAbout}>
              <View style={styles.settingInfo}>
                <IconSymbol name="info.circle" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: uiFont }]}>
                  About OpenCode
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={iconColor} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.settingRow} onPress={handlePrivacy}>
              <View style={styles.settingInfo}>
                <IconSymbol name="lock.shield" size={22} color={iconColor} />
                <Text style={[styles.settingLabel, { color: textColor, fontFamily: uiFont }]}>
                  Privacy Policy
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Info */}
        <Text style={[styles.version, { color: iconColor, fontFamily: uiFont }]}>
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
    borderRadius: 0,
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
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  selectContainer: {
    flex: 1,
    maxWidth: 140,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  previewContainer: {
    padding: 16,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    opacity: 0.7,
  },
  previewBox: {
    padding: 12,
    borderRadius: 0,
  },
  version: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
    opacity: 0.6,
  },
  cacheStatsContainer: {
    padding: 16,
  },
  cacheStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cacheStatLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  cacheStatValue: {
    fontSize: 14,
  },
  cacheSyncTime: {
    fontSize: 12,
    marginTop: 2,
  },
});
