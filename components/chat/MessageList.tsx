import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { FlashList, type ListRenderItem, type FlashListRef } from '@shopify/flash-list';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { MessageItem, type Message } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function MessageList({
  messages,
  isLoading,
  onRefresh,
  isRefreshing = false,
}: MessageListProps) {
  const { colors } = useTheme();
  const { ui } = useFonts();
  const listRef = useRef<FlashListRef<Message> | null>(null);

  const renderItem: ListRenderItem<Message> = useCallback(
    ({ item }) => <MessageItem message={item} />,
    []
  );

  const keyExtractor = (item: Message) => item.id;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  const emptyContainerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 200,
  };

  const emptyTitleStyle: TextStyle = {
    ...ui,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  };

  const emptySubtitleStyle: TextStyle = {
    ...ui,
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  };

  const loadingContainerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  };

  const loadingTextStyle: TextStyle = {
    ...ui,
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  };

  if (isLoading) {
    return (
      <View style={loadingContainerStyle}>
        <Text style={loadingTextStyle}>Loading messages...</Text>
      </View>
    );
  }

  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <View style={containerStyle}>
      <FlashList
        ref={listRef}
        data={sortedMessages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.icon}
              colors={[colors.icon]}
            />
          ) : undefined
        }
        ListEmptyComponent={
          <View style={emptyContainerStyle}>
            <Text style={emptyTitleStyle}>No messages yet</Text>
            <Text style={emptySubtitleStyle}>
              Start the conversation by sending a message below
            </Text>
          </View>
        }
        maintainVisibleContentPosition={{
          autoscrollToTopThreshold: 10,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});
