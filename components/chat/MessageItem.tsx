import React, { memo, useMemo } from 'react';
import { View, Text, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { PartRenderer } from './PartRenderer';
import type { MessageWithParts } from '@/types/messageParts';

interface MessageItemProps {
  message: MessageWithParts;
  isStreaming?: boolean;
}

// Memoized timestamp formatter to avoid recreating on every render
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function MessageItemComponent({ message, isStreaming = false }: MessageItemProps) {
  const { colors } = useTheme();
  const { uiFont } = useFonts();
  const isUser = message.role === 'user';

  // Memoize expensive timestamp formatting
  const formattedTimestamp = useMemo(() => formatTimestamp(message.timestamp), [message.timestamp]);

  // Memoize styles to prevent recreation
  const containerStyle: ViewStyle = useMemo(
    () => ({
      width: '100%',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderLeftWidth: isUser ? 0 : 2,
      borderLeftColor: isUser ? 'transparent' : colors.border,
      backgroundColor: isUser ? colors.background : 'transparent',
    }),
    [colors.border, colors.background, isUser]
  );

  const contentStyle: ViewStyle = useMemo(
    () => ({
      paddingLeft: isUser ? 0 : 10,
    }),
    [isUser]
  );

  const timestampStyle: TextStyle = useMemo(
    () => ({
      fontFamily: uiFont,
      fontSize: 10,
      color: colors.textTertiary,
      marginTop: 4,
    }),
    [uiFont, colors.textTertiary]
  );

  const streamingIndicatorStyle: TextStyle = useMemo(
    () => ({
      fontFamily: uiFont,
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 2,
    }),
    [uiFont, colors.textSecondary]
  );

  // Memoize parts rendering to prevent unnecessary re-renders
  const partsList = useMemo(
    () => message.parts.map(part => <PartRenderer key={part.id} part={part} isUser={isUser} />),
    [message.parts, isUser]
  );

  return (
    <View style={containerStyle}>
      <View style={contentStyle}>
        {/* Render message parts */}
        {partsList}

        {/* Streaming indicator - blinking cursor */}
        {isStreaming && !isUser && <Text style={streamingIndicatorStyle}>▊</Text>}

        <Text style={timestampStyle}>{formattedTimestamp}</Text>
      </View>
    </View>
  );
}

// Custom comparison function for React.memo
function areEqual(prevProps: MessageItemProps, nextProps: MessageItemProps): boolean {
  // Don't re-render if message hasn't changed and streaming state is the same
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (prevProps.message.timestamp !== nextProps.message.timestamp) return false;
  if (prevProps.message.parts.length !== nextProps.message.parts.length) return false;
  // Compare parts content
  for (let i = 0; i < prevProps.message.parts.length; i++) {
    if (prevProps.message.parts[i].id !== nextProps.message.parts[i].id) return false;
  }
  return true;
}

export const MessageItem = memo(MessageItemComponent, areEqual);
