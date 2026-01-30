import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { MainContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { WorkspaceGroup, Session } from '@/components/project';
import { useSessions } from '@/hooks/useQueries';
import { useCreateSession } from '@/hooks/useMutations';
import { useProjectStore } from '@/stores/projectStore';

export default function ProjectDetail() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { uiFont } = useFonts();

  // Fetch sessions data
  const {
    data: sessions,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useSessions(projectId);

  // Create session mutation
  const createSession = useCreateSession();

  // Get project name from store
  const project = useProjectStore(state => state.getProjectById(projectId || ''));
  const projectName = project?.name || `Project ${projectId}`;

  // Group sessions by workspace
  const groupedSessions = useMemo(() => {
    if (!sessions) return {};

    return sessions.reduce(
      (acc, session) => {
        const key = session.workspaceId || 'default';
        if (!acc[key]) acc[key] = [];
        acc[key].push(session);
        return acc;
      },
      {} as Record<string, Session[]>
    );
  }, [sessions]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle session press
  const handleSessionPress = useCallback((sessionId: string) => {
    router.push(`/session/${sessionId}`);
  }, []);

  // Handle new session
  const handleNewSession = useCallback(() => {
    if (!projectId) return;

    createSession.mutate(
      { projectId },
      {
        onSuccess: data => {
          router.push(`/session/${data.id}`);
        },
      }
    );
  }, [projectId, createSession]);

  // Handle new workspace
  const handleNewWorkspace = useCallback(() => {
    // TODO: Implement workspace creation when API supports it
    console.log('Create new workspace - not yet implemented');
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <MainContent>
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.surfaceBrand} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily: uiFont }]}>
            Loading sessions...
          </Text>
        </View>
      </MainContent>
    );
  }

  // Render error state
  if (isError) {
    return (
      <MainContent>
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorTitle, { color: colors.text, fontFamily: uiFont }]}>
            Failed to load sessions
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary, fontFamily: uiFont }]}>
            {error?.message || 'An error occurred while fetching sessions'}
          </Text>
          <Button onPress={() => refetch()} variant="secondary">
            Try Again
          </Button>
        </View>
      </MainContent>
    );
  }

  const workspaceIds = Object.keys(groupedSessions);
  const totalSessions = sessions?.length || 0;

  return (
    <MainContent>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.surfaceBrand}
          />
        }
      >
        {/* Project Header */}
        <View style={styles.projectHeader}>
          <Text style={[styles.projectName, { color: colors.text, fontFamily: uiFont }]}>
            {projectName}
          </Text>
          <Text
            style={[styles.projectSubtitle, { color: colors.textSecondary, fontFamily: uiFont }]}
          >
            {totalSessions} session{totalSessions !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button variant="primary" onPress={handleNewSession} disabled={createSession.isPending}>
            {createSession.isPending ? 'Creating...' : 'New Session'}
          </Button>
          <Button variant="secondary" onPress={handleNewWorkspace}>
            New Workspace
          </Button>
        </View>

        {/* Sessions List */}
        <View style={styles.sessionsSection}>
          {workspaceIds.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: uiFont }]}>
                No sessions yet
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: uiFont }]}
              >
                Create your first session to get started
              </Text>
            </View>
          ) : (
            workspaceIds.map(workspaceId => (
              <WorkspaceGroup
                key={workspaceId}
                workspaceId={workspaceId}
                sessions={groupedSessions[workspaceId]}
                onSessionPress={handleSessionPress}
                defaultOpen={true}
              />
            ))
          )}
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
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
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
    marginBottom: 24,
  },
  sessionsSection: {
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
  },
});
