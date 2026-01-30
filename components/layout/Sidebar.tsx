import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Pressable,
  Modal,
} from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  useServers,
  useActiveServerId,
  useActiveServer,
  useServerStore,
  useProjectsForServer,
  useProjectStore,
} from '@/stores';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  onItemPress?: () => void;
}

export function Sidebar({ onItemPress }: SidebarProps) {
  const { colors, isDark } = useTheme();
  const { uiFont } = useFonts();
  const servers = useServers();
  const activeServer = useActiveServer();
  const activeServerId = useActiveServerId();
  const projects = useProjectsForServer(activeServerId || '');
  const setActiveProject = useProjectStore(state => state.setActiveProject);
  const setActiveServer = useServerStore(state => state.setActiveServer);
  const [serverMenuOpen, setServerMenuOpen] = React.useState(false);

  const handleProjectPress = useCallback(
    (projectId: string) => {
      setActiveProject(projectId);
      onItemPress?.();
      router.push(`/project/${projectId}`);
    },
    [setActiveProject, onItemPress]
  );

  const handlePreferencesPress = useCallback(() => {
    onItemPress?.();
    router.push('/preferences');
  }, [onItemPress]);

  const handleNewProjectPress = useCallback(() => {
    onItemPress?.();
    router.push('/connect-server');
  }, [onItemPress]);

  const handleAddServerPress = useCallback(() => {
    setServerMenuOpen(false);
    onItemPress?.();
    router.push('/connect-server');
  }, [onItemPress]);

  const handleServerSelect = useCallback(
    (serverId: string) => {
      setActiveServer(serverId);
      setServerMenuOpen(false);
    },
    [setActiveServer]
  );

  const handleServerSettingsPress = useCallback(() => {
    setServerMenuOpen(false);
    onItemPress?.();
    router.push('/server-settings');
  }, [onItemPress]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Server Selector */}
      <View style={[styles.serverSection, { borderBottomColor: colors.border }]}>
        <View style={styles.serverSelector}>
          <Pressable
            style={[styles.serverButton, { backgroundColor: colors.surfaceHover }]}
            onPress={() => setServerMenuOpen(true)}
          >
            <Text
              style={[styles.serverName, { color: colors.text, fontFamily: uiFont }]}
              numberOfLines={1}
            >
              {activeServer?.name || activeServer?.url || 'Select Server'}
            </Text>
            <IconSymbol name="chevron.down" size={16} color={colors.textSecondary} />
          </Pressable>

          <TouchableOpacity
            style={[styles.addServerButton, { backgroundColor: colors.surfaceHover }]}
            onPress={handleAddServerPress}
          >
            <IconSymbol name="plus" size={20} color={colors.surfaceBrand} />
          </TouchableOpacity>
        </View>

        {/* Server Menu Modal */}
        <Modal
          visible={serverMenuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setServerMenuOpen(false)}
        >
          <Pressable
            style={[
              styles.modalOverlay,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)' },
            ]}
            onPress={() => setServerMenuOpen(false)}
          >
            <View
              style={[
                styles.serverMenu,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.menuTitle,
                  {
                    color: colors.text,
                    fontFamily: uiFont,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                Servers
              </Text>

              <ScrollView style={styles.serverList}>
                {servers.map(server => (
                  <Pressable
                    key={server.id}
                    style={({ pressed }) => [
                      styles.serverOption,
                      {
                        backgroundColor:
                          server.id === activeServerId
                            ? colors.surfaceInteractive
                            : pressed
                              ? colors.surfaceHover
                              : 'transparent',
                      },
                    ]}
                    onPress={() => handleServerSelect(server.id)}
                  >
                    <IconSymbol
                      name="server.rack"
                      size={18}
                      color={server.id === activeServerId ? colors.textOnInteractive : colors.text}
                    />
                    <Text
                      style={[
                        styles.serverOptionText,
                        {
                          color:
                            server.id === activeServerId ? colors.textOnInteractive : colors.text,
                          fontFamily: uiFont,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {server.name || server.url}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.menuActions}>
                <Button variant="ghost" size="sm" onPress={handleServerSettingsPress}>
                  Server Settings
                </Button>
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>

      {/* Project List */}
      <ScrollView style={styles.projectList} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: uiFont }]}>
          Projects
        </Text>

        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: uiFont }]}>
              No projects yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary, fontFamily: uiFont }]}>
              Add a server to get started
            </Text>
          </View>
        ) : (
          projects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={[
                styles.projectItem,
                {
                  backgroundColor: 'transparent',
                },
              ]}
              onPress={() => handleProjectPress(project.id)}
            >
              <IconSymbol name="folder" size={20} color={colors.textSecondary} />
              <Text
                style={[
                  styles.projectName,
                  {
                    color: colors.text,
                    fontFamily: uiFont,
                  },
                ]}
                numberOfLines={1}
              >
                {project.name}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {/* New Project Button */}
        <TouchableOpacity style={styles.newProjectButton} onPress={handleNewProjectPress}>
          <IconSymbol name="plus" size={20} color={colors.surfaceBrand} />
          <Text style={[styles.newProjectText, { color: colors.surfaceBrand, fontFamily: uiFont }]}>
            New Project
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomSection, { borderTopColor: colors.border || 'rgba(0,0,0,0.1)' }]}>
        <TouchableOpacity style={styles.preferencesButton} onPress={handlePreferencesPress}>
          <IconSymbol name="gear" size={20} color={colors.textSecondary} />
          <Text style={[styles.preferencesText, { color: colors.text, fontFamily: uiFont }]}>
            Preferences
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 280,
  },
  serverSection: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  serverSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serverButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  addServerButton: {
    padding: 12,
    borderRadius: 8,
  },
  serverName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  serverMenu: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 400,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  serverList: {
    maxHeight: 300,
  },
  serverOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  serverOptionText: {
    fontSize: 15,
    flex: 1,
  },
  menuActions: {
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  projectList: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    opacity: 0.7,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    opacity: 0.7,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  projectName: {
    fontSize: 15,
    flex: 1,
  },
  newProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 12,
  },
  newProjectText: {
    fontSize: 15,
    fontWeight: '500',
  },
  bottomSection: {
    padding: 16,
    borderTopWidth: 1,
  },
  preferencesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  preferencesText: {
    fontSize: 15,
  },
});
