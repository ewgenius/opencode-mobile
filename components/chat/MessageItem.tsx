import React from 'react';
import { View, Text, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { PartRenderer } from './PartRenderer';
import type { MessageWithParts } from '@/types/messageParts';

interface MessageItemProps {
  message: MessageWithParts;
  isStreaming?: boolean;
}

export function MessageItem({ message, isStreaming = false }: MessageItemProps) {
  const { colors } = useTheme();
  const { uiFont } = useFonts();
  const isUser = message.role === 'user';

  // Compact flat design - no bubbles, minimal padding
  const containerStyle: ViewStyle = {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: isUser ? 0 : 2,
    borderLeftColor: isUser ? 'transparent' : colors.border,
    backgroundColor: isUser ? colors.background : 'transparent',
  };

  const contentStyle: ViewStyle = {
    paddingLeft: isUser ? 0 : 10,
  };

  const timestampStyle: TextStyle = {
    fontFamily: uiFont,
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 4,
  };

  const streamingIndicatorStyle: TextStyle = {
    fontFamily: uiFont,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 2,
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={containerStyle}>
      <View style={contentStyle}>
        {/* Render message parts */}
        {message.parts.map(part => (
          <PartRenderer key={part.id} part={part} isUser={isUser} />
        ))}

        {/* Streaming indicator - blinking cursor */}
        {isStreaming && !isUser && <Text style={streamingIndicatorStyle}>▊</Text>}

        <Text style={timestampStyle}>{formatTimestamp(message.timestamp)}</Text>
      </View>
    </View>
  );
}
