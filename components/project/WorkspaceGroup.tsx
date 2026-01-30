import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

export function WorkspaceGroup({
  workspaceId,
  sessions,
  onSessionPress,
  defaultOpen = true,
}: WorkspaceGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { colors } = useTheme();
  const { uiFont } = useFonts();

  const isDefaultWorkspace = workspaceId === 'default';
  const title = isDefaultWorkspace ? 'General' : `Workspace ${workspaceId.slice(0, 8)}`;
  const sessionCount = sessions.length;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <IconSymbol
            name="folder.fill"
            size={18}
            color={isDefaultWorkspace ? colors.icon : colors.surfaceBrand}
          />
          <Text style={[styles.title, { color: colors.text, fontFamily: uiFont }]}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: colors.backgroundTertiary }]}>
            <Text style={[styles.badgeText, { color: colors.textSecondary, fontFamily: uiFont }]}>
              {sessionCount}
            </Text>
          </View>
        </View>
        <IconSymbol
          name="chevron.right"
          size={16}
          color={colors.icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.sessionsContainer}>
          {sessions.map(session => (
            <SessionItem key={session.id} session={session} onPress={onSessionPress} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
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
    borderRadius: 10,
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
