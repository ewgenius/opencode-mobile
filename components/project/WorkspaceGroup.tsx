import React, { useState, memo, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SessionItem, Session } from './SessionItem';

interface WorkspaceGroupProps {
  workspaceId: string;
  sessions: Session[];
  onSessionPress: (sessionId: string) => void;
  defaultOpen?: boolean;
}

function WorkspaceGroupComponent({
  workspaceId,
  sessions,
  onSessionPress,
  defaultOpen = true,
}: WorkspaceGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { colors } = useTheme();
  const { uiFont } = useFonts();

  // Memoize derived values
  const isDefaultWorkspace = workspaceId === 'default';
  const title = useMemo(
    () => (isDefaultWorkspace ? 'General' : `Workspace ${workspaceId.slice(0, 8)}`),
    [isDefaultWorkspace, workspaceId]
  );
  const sessionCount = sessions.length;

  // Memoize toggle handler
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Memoize styles
  const headerStyle = useMemo(
    () => [styles.header, { backgroundColor: colors.backgroundSecondary }],
    [colors.backgroundSecondary]
  );

  const titleStyle = useMemo(
    () => [styles.title, { color: colors.text, fontFamily: uiFont }],
    [colors.text, uiFont]
  );

  const badgeStyle = useMemo(
    () => [styles.badge, { backgroundColor: colors.backgroundTertiary }],
    [colors.backgroundTertiary]
  );

  const badgeTextStyle = useMemo(
    () => [styles.badgeText, { color: colors.textSecondary, fontFamily: uiFont }],
    [colors.textSecondary, uiFont]
  );

  const chevronStyle = useMemo(
    () => ({
      transform: [{ rotate: isOpen ? '90deg' : '0deg' }] as const,
    }),
    [isOpen]
  );

  // Render item for FlatList
  const renderItem: ListRenderItem<Session> = useCallback(
    ({ item }) => <SessionItem session={item} onPress={onSessionPress} />,
    [onSessionPress]
  );

  const keyExtractor = useCallback((item: Session) => item.id, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={headerStyle} onPress={toggleOpen} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <IconSymbol
            name="folder.fill"
            size={18}
            color={isDefaultWorkspace ? colors.icon : colors.surfaceBrand}
          />
          <Text style={titleStyle}>{title}</Text>
          <View style={badgeStyle}>
            <Text style={badgeTextStyle}>{sessionCount}</Text>
          </View>
        </View>
        <IconSymbol name="chevron.right" size={16} color={colors.icon} style={chevronStyle} />
      </TouchableOpacity>

      {isOpen && (
        <FlatList
          data={sessions}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.sessionsContainer}
          scrollEnabled={false} // Parent handles scrolling
          removeClippedSubviews={true} // Memory optimization
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </View>
  );
}

// Memo comparison for WorkspaceGroup
function workspaceGroupAreEqual(
  prevProps: WorkspaceGroupProps,
  nextProps: WorkspaceGroupProps
): boolean {
  if (prevProps.workspaceId !== nextProps.workspaceId) return false;
  if (prevProps.sessions.length !== nextProps.sessions.length) return false;
  if (prevProps.defaultOpen !== nextProps.defaultOpen) return false;
  // Check if any session changed
  for (let i = 0; i < prevProps.sessions.length; i++) {
    if (prevProps.sessions[i].id !== nextProps.sessions[i].id) return false;
    if (prevProps.sessions[i].updatedAt !== nextProps.sessions[i].updatedAt) return false;
  }
  // onSessionPress is expected to be stable from parent
  return true;
}

export const WorkspaceGroup = memo(WorkspaceGroupComponent, workspaceGroupAreEqual);

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 0,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 0,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sessionsContainer: {
    paddingLeft: 8,
  },
});
