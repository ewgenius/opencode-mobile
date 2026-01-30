import React, { useMemo } from 'react';
import { View, Text, type ViewStyle, type TextStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { CodeBlock } from './CodeBlock';

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  model?: string;
  timestamp: number;
}

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const { colors } = useTheme();
  const { uiFont, codeFont } = useFonts();
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

  const markdownStyles = useMemo(
    () => ({
      body: {
        fontFamily: uiFont,
        fontSize: 15,
        lineHeight: 20,
        color: isUser ? colors.text : colors.text,
      } as TextStyle,
      paragraph: {
        fontFamily: uiFont,
        fontSize: 15,
        lineHeight: 20,
        color: isUser ? colors.text : colors.text,
        marginVertical: 2,
      } as TextStyle,
      code_inline: {
        fontFamily: codeFont,
        fontSize: 13,
        backgroundColor: colors.backgroundTertiary,
        color: colors.syntaxPrimitive,
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 0,
      } as TextStyle,
      code_block: {
        fontFamily: codeFont,
        fontSize: 13,
        lineHeight: 18,
        backgroundColor: colors.backgroundTertiary,
        padding: 8,
        borderRadius: 0,
        marginVertical: 4,
      } as ViewStyle,
      fence: {
        fontFamily: codeFont,
        fontSize: 13,
        lineHeight: 18,
        backgroundColor: colors.backgroundTertiary,
        padding: 8,
        borderRadius: 0,
        marginVertical: 4,
      } as ViewStyle,
      pre: {
        backgroundColor: colors.backgroundTertiary,
        padding: 8,
        borderRadius: 0,
        marginVertical: 4,
      } as ViewStyle,
      em: {
        fontFamily: uiFont,
        fontStyle: 'italic',
        color: colors.text,
      } as TextStyle,
      strong: {
        fontFamily: uiFont,
        fontWeight: '600',
        color: colors.textStrong,
      } as TextStyle,
      link: {
        fontFamily: uiFont,
        color: colors.textInteractive,
        textDecorationLine: 'underline',
      } as TextStyle,
      blockquote: {
        fontFamily: uiFont,
        borderLeftWidth: 2,
        borderLeftColor: colors.borderActive,
        paddingLeft: 8,
        marginVertical: 4,
        color: colors.textSecondary,
      } as ViewStyle,
      bullet_list: {
        marginVertical: 2,
      } as ViewStyle,
      ordered_list: {
        marginVertical: 2,
      } as ViewStyle,
      list_item: {
        fontFamily: uiFont,
        fontSize: 15,
        lineHeight: 20,
        color: colors.text,
        marginVertical: 1,
      } as TextStyle,
      heading1: {
        fontFamily: uiFont,
        fontSize: 20,
        fontWeight: '600',
        color: colors.textStrong,
        marginVertical: 6,
      } as TextStyle,
      heading2: {
        fontFamily: uiFont,
        fontSize: 18,
        fontWeight: '600',
        color: colors.textStrong,
        marginVertical: 4,
      } as TextStyle,
      heading3: {
        fontFamily: uiFont,
        fontSize: 16,
        fontWeight: '600',
        color: colors.textStrong,
        marginVertical: 2,
      } as TextStyle,
    }),
    [colors, uiFont, codeFont, isUser]
  );

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderers = useMemo(
    () => ({
      fence: (node: any) => {
        const { content, info } = node.sourceInfo || {};
        return (
          <CodeBlock
            code={node.content || content || ''}
            language={info || node.language || ''}
            isUser={isUser}
          />
        );
      },
      code_block: (node: any) => {
        return <CodeBlock code={node.content || ''} language="" isUser={isUser} />;
      },
    }),
    [isUser]
  );

  return (
    <View style={containerStyle}>
      <View style={contentStyle}>
        <Markdown style={markdownStyles} rules={renderers}>
          {message.content}
        </Markdown>
        <Text style={timestampStyle}>{formatTimestamp(message.timestamp)}</Text>
      </View>
    </View>
  );
}
