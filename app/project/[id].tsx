import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useLocalSearchParams } from 'expo-router';
import { MainContent } from '@/components/layout';

// Placeholder data - will be replaced with actual store data
const PLACEHOLDER_SESSIONS = [
  {
    id: '1',
    name: 'Session 1',
    lastMessage: 'Hello, how can I help you today?',
    timestamp: '2 min ago',
  },
  {
    id: '2',
    name: 'Session 2',
    lastMessage: 'Let me analyze that for you...',
    timestamp: '1 hour ago',
  },
  { id: '3', name: 'Session 3', lastMessage: 'The code has been updated.', timestamp: 'Yesterday' },
];

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = React.useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const cardBackground = useThemeColor({}, 'background');

  // TODO: Load project data from store based on id
  const projectName = `Project ${id}`;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch fresh data from server
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSessionPress = (sessionId: string) => {
    router.push(`/session/${sessionId}`);
  };

  const handleNewSession = () => {
    // TODO: Create new session and navigate to it
    console.log('Create new session');
  };

  const handleNewWorkspace = () => {
    // TODO: Create new workspace
    console.log('Create new workspace');
  };

  return (
    <MainContent>
      <ScrollView
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Project Header */}
        <View style={styles.projectHeader}>
          <Text style={[styles.projectName, { color: textColor, fontFamily: Fonts.sans }]}>
            {projectName}
          </Text>
          <Text style={[styles.projectSubtitle, { color: iconColor, fontFamily: Fonts.sans }]}>
            {PLACEHOLDER_SESSIONS.length} sessions
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: tintColor }]}
            onPress={handleNewSession}
          >
            <IconSymbol name="plus.bubble" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: '#fff', fontFamily: Fonts.sans }]}>
              New Session
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButtonSecondary, { borderColor: tintColor }]}
            onPress={handleNewWorkspace}
          >
            <IconSymbol name="folder.badge.plus" size={20} color={tintColor} />
            <Text
              style={[
                styles.actionButtonSecondaryText,
                { color: tintColor, fontFamily: Fonts.sans },
              ]}
            >
              New Workspace
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sessions List */}
        <View style={styles.sessionsSection}>
          <Text style={[styles.sectionTitle, { color: iconColor, fontFamily: Fonts.sans }]}>
            Recent Sessions
          </Text>

          {PLACEHOLDER_SESSIONS.map(session => (
            <TouchableOpacity
              key={session.id}
              style={[styles.sessionCard, { backgroundColor: cardBackground }]}
              onPress={() => handleSessionPress(session.id)}
            >
              <View style={styles.sessionIcon}>
                <IconSymbol name="bubble.left" size={24} color={tintColor} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionName, { color: textColor, fontFamily: Fonts.sans }]}>
                  {session.name}
                </Text>
                <Text
                  style={[styles.sessionPreview, { color: iconColor, fontFamily: Fonts.sans }]}
                  numberOfLines={1}
                >
                  {session.lastMessage}
                </Text>
              </View>
              <Text style={[styles.sessionTime, { color: iconColor, fontFamily: Fonts.sans }]}>
                {session.timestamp}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </MainContent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  projectHeader: {
    marginBottom: 24,
  },
  projectName: {
    fontSize: 28,
    fontWeight: '700',
  },
  projectSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sessionsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    opacity: 0.7,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionIcon: {
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionPreview: {
    fontSize: 14,
    opacity: 0.8,
  },
  sessionTime: {
    fontSize: 12,
    opacity: 0.6,
  },
});
