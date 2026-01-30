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
  const { uiFont } = useFonts();
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
    padding: 16,
    minHeight: 150,
  };

  const emptyTitleStyle: TextStyle = {
    fontFamily: uiFont,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  };

  const emptySubtitleStyle: TextStyle = {
    fontFamily: uiFont,
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  };

  const loadingContainerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  };

  const loadingTextStyle: TextStyle = {
    fontFamily: uiFont,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
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
    paddingVertical: 8,
    paddingBottom: 16,
  },
});
