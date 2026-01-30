import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface SidebarProps {
  onItemPress?: () => void;
}

// Placeholder data - will be replaced with actual store data
const PLACEHOLDER_PROJECTS = [
  { id: '1', name: 'Project Alpha' },
  { id: '2', name: 'Project Beta' },
  { id: '3', name: 'Project Gamma' },
];

export function Sidebar({ onItemPress }: SidebarProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const handleProjectPress = (projectId: string) => {
    onItemPress?.();
    router.push(`/project/${projectId}`);
  };

  const handlePreferencesPress = () => {
    onItemPress?.();
    router.push('/preferences');
  };

  const handleNewProjectPress = () => {
    onItemPress?.();
    // TODO: Implement new project creation
    console.log('New project pressed');
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Server Selector */}
      <View style={styles.serverSection}>
        <TouchableOpacity style={styles.serverSelector}>
          <Text style={[styles.serverName, { color: textColor, fontFamily: Fonts.sans }]}>
            OpenCode Server
          </Text>
          <IconSymbol name="chevron.down" size={16} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Project List */}
      <ScrollView style={styles.projectList} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: Fonts.sans }]}>
          Projects
        </Text>

        {PLACEHOLDER_PROJECTS.map(project => (
          <TouchableOpacity
            key={project.id}
            style={styles.projectItem}
            onPress={() => handleProjectPress(project.id)}
          >
            <IconSymbol name="folder" size={20} color={iconColor} />
            <Text style={[styles.projectName, { color: textColor, fontFamily: Fonts.sans }]}>
              {project.name}
            </Text>
          </TouchableOpacity>
        ))}

        {/* New Project Button */}
        <TouchableOpacity style={styles.newProjectButton} onPress={handleNewProjectPress}>
          <IconSymbol name="plus" size={20} color={tintColor} />
          <Text style={[styles.newProjectText, { color: tintColor, fontFamily: Fonts.sans }]}>
            New Project
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.preferencesButton} onPress={handlePreferencesPress}>
          <IconSymbol name="gear" size={20} color={iconColor} />
          <Text style={[styles.preferencesText, { color: textColor, fontFamily: Fonts.sans }]}>
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
  },
  serverSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  serverSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  serverName: {
    fontSize: 16,
    fontWeight: '600',
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
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  projectName: {
    fontSize: 15,
    marginLeft: 12,
  },
  newProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  newProjectText: {
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '500',
  },
  bottomSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  preferencesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  preferencesText: {
    fontSize: 15,
    marginLeft: 12,
  },
});
