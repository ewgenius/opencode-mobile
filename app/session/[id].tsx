import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { useApi } from '@/hooks/useApi';
import { useMessages, useSendMessage } from '@/hooks';
import { MainContent } from '@/components/layout';
import { MessageList, InputPane } from '@/components/chat';
import { SelectOption } from '@/components/ui/select';

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

export default function SessionChat() {
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { uiFont } = useFonts();
  const { isConnected } = useApi();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch messages
  const { data: messages = [], isLoading, refetch } = useMessages(sessionId || null);

  // Send message mutation
  const sendMessageMutation = useSendMessage();

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // Handle send message
  const handleSend = useCallback(
    async (content: string, agent?: string, model?: { providerID: string; modelID: string }) => {
      if (!sessionId || !isConnected) return;

      setIsSending(true);
      try {
        await sendMessageMutation.mutateAsync({
          sessionId,
          content,
          agent,
          model,
        });
      } finally {
        setIsSending(false);
      }
    },
    [sessionId, isConnected, sendMessageMutation]
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  // Header styles
  const headerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 12,
    paddingTop: insets.top,
    height: 56 + insets.top,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  const headerTitleStyle = {
    fontFamily: uiFont,
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
    textAlign: 'center' as const,
  };

  const backButtonStyle = {
    padding: 8,
    width: 44,
  };

  const moreButtonStyle = {
    padding: 8,
    width: 44,
    alignItems: 'flex-end' as const,
  };

  // Offline banner styles
  const offlineBannerStyle = {
    backgroundColor: colors.surfaceWarning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  };

  const offlineTextStyle = {
    fontFamily: uiFont,
    fontSize: 14,
    color: colors.textOnWarning,
    fontWeight: '500' as const,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={headerStyle}>
        <TouchableOpacity onPress={handleBack} style={backButtonStyle}>
          <SymbolView name="chevron.left" size={28} tintColor={colors.text} />
        </TouchableOpacity>
        <Text style={headerTitleStyle} numberOfLines={1}>
          Session
        </Text>
        <TouchableOpacity style={moreButtonStyle}>
          <SymbolView name="ellipsis" size={24} tintColor={colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Offline Banner */}
      {!isConnected && (
        <View style={offlineBannerStyle}>
          <SymbolView
            name="wifi.slash"
            size={16}
            tintColor={colors.textOnWarning}
            weight="medium"
          />
          <Text style={offlineTextStyle}>Offline - Connect to send messages</Text>
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
          />

          {/* Input Area */}
          <InputPane
            onSend={handleSend}
            isConnected={isConnected}
            agents={AGENT_OPTIONS}
            models={MODEL_OPTIONS}
            disabled={isSending}
          />
        </View>
      </MainContent>

      {/* Loading Overlay for Send */}
      {isSending && (
        <View style={styles.sendingOverlay}>
          <ActivityIndicator size="large" color={colors.icon} />
        </View>
      )}
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
  sendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
