import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { useApi } from '@/hooks/useApi';
import { useMessages, useStreamingMessage } from '@/hooks';
import { MainContent, SessionHeader } from '@/components/layout';
import { MessageList, InputPane } from '@/components/chat';
import { SelectOption } from '@/components/ui/select';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useIsDeviceOffline, useCacheStore } from '@/stores';

// Placeholder agent and model options - these would come from API in production
const AGENT_OPTIONS: SelectOption[] = [
  { value: 'opencode', label: 'OpenCode' },
  { value: 'coder', label: 'Coder' },
  { value: 'assistant', label: 'Assistant' },
];

const MODEL_OPTIONS: SelectOption[] = [
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5' },
];

// Format relative time (e.g., "5 min ago")
function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Never';

  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function SessionChat() {
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { uiFont } = useFonts();
  const { isConnected } = useApi();
  const isDeviceOffline = useIsDeviceOffline();
  const getLastSyncAt = useCacheStore(state => state.getLastSyncAt);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch messages
  const { data: messages = [], isLoading, refetch } = useMessages(sessionId || null);

  // Streaming message hook
  const {
    sendMessage: sendStreamingMessage,
    cancelStream,
    isStreaming,
    isLoading: isStreamLoading,
    streamingMessage,
    error: streamError,
  } = useStreamingMessage();

  // Get last synced time for this session
  const lastSyncedAt = useMemo(() => {
    return getLastSyncAt('messages', sessionId || '');
  }, [getLastSyncAt, sessionId]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // Handle send message with streaming
  const handleSend = useCallback(
    async (content: string, agent?: string, model?: { providerID: string; modelID: string }) => {
      if (!sessionId || !isConnected) return;

      await sendStreamingMessage(sessionId, content, { agent, model });
    },
    [sessionId, isConnected, sendStreamingMessage]
  );

  // Handle cancel streaming
  const handleCancel = useCallback(() => {
    cancelStream();
  }, [cancelStream]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  // Determine offline banner subtitle
  const offlineSubtitle = useMemo(() => {
    if (isDeviceOffline) {
      return 'Device offline - Check your internet connection';
    }
    if (!isConnected) {
      return 'Server unreachable - Check server connection';
    }
    return undefined;
  }, [isDeviceOffline, isConnected]);

  // Add last synced info when offline
  const extendedOfflineSubtitle = useMemo(() => {
    if (!isConnected || isDeviceOffline) {
      const syncText = `Last synced: ${formatRelativeTime(lastSyncedAt)}`;
      return offlineSubtitle ? `${offlineSubtitle}\n${syncText}` : syncText;
    }
    return undefined;
  }, [isConnected, isDeviceOffline, offlineSubtitle, lastSyncedAt]);

  // Error banner styles
  const errorBannerStyle = {
    backgroundColor: colors.surfaceError,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  };

  const errorTextStyle = {
    fontFamily: uiFont,
    fontSize: 14,
    color: colors.textOnError,
    fontWeight: '500' as const,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <SessionHeader title="Session" onBackPress={handleBack} />

      {/* Offline Banner - show when either device offline or server not connected */}
      {(!isConnected || isDeviceOffline) && <OfflineBanner subtitle={extendedOfflineSubtitle} />}

      {/* Error Banner */}
      {streamError && (
        <View style={errorBannerStyle}>
          <IconSymbol name="exclamationmark.triangle" size={16} color={colors.textOnError} />
          <Text style={errorTextStyle}>{streamError.message}</Text>
        </View>
      )}

      {/* Main Content */}
      <MainContent>
        <View style={styles.content}>
          {/* Messages List */}
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            streamingMessage={streamingMessage}
            isStreaming={isStreaming}
          />

          {/* Input Area */}
          <InputPane
            onSend={handleSend}
            isConnected={isConnected && !isDeviceOffline}
            agents={AGENT_OPTIONS}
            models={MODEL_OPTIONS}
            disabled={isStreamLoading}
            isStreaming={isStreaming}
            onCancel={handleCancel}
          />
        </View>
      </MainContent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
