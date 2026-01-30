import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface Session {
  id: string;
  projectId: string;
  title: string;
  workspaceId?: string;
  createdAt: number;
  updatedAt: number;
}

interface SessionItemProps {
  session: Session;
  onPress: (sessionId: string) => void;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

export function SessionItem({ session, onPress }: SessionItemProps) {
  const { colors } = useTheme();
  const { uiFont } = useFonts();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={() => onPress(session.id)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <IconSymbol name="bubble.left" size={20} color={colors.surfaceBrand} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text, fontFamily: uiFont }]} numberOfLines={1}>
          {session.title}
        </Text>
        <Text style={[styles.timestamp, { color: colors.textTertiary, fontFamily: uiFont }]}>
          {formatTimestamp(session.updatedAt)}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={colors.icon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 222, 141, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 13,
  },
});
