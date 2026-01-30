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

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    width: '100%',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginVertical: 4,
  };

  const bubbleStyle: ViewStyle = {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 18,
    backgroundColor: isUser ? colors.surfaceBrand : colors.surface,
    borderBottomRightRadius: isUser ? 4 : 18,
    borderBottomLeftRadius: isUser ? 18 : 4,
    borderWidth: isUser ? 0 : 1,
    borderColor: colors.border,
  };

  const timestampStyle: TextStyle = {
    fontFamily: uiFont,
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    alignSelf: isUser ? 'flex-end' : 'flex-start',
  };

  const markdownStyles = useMemo(
    () => ({
      body: {
        fontFamily: uiFont,
        fontSize: 16,
        lineHeight: 22,
        color: isUser ? colors.textOnBrand : colors.text,
      } as TextStyle,
      paragraph: {
        fontFamily: uiFont,
        fontSize: 16,
        lineHeight: 22,
        color: isUser ? colors.textOnBrand : colors.text,
        marginVertical: 4,
      } as TextStyle,
      code_inline: {
        fontFamily: codeFont,
        fontSize: 14,
        backgroundColor: isUser ? 'rgba(0,0,0,0.1)' : colors.backgroundTertiary,
        color: isUser ? colors.textOnBrand : colors.syntaxPrimitive,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
      } as TextStyle,
      code_block: {
        fontFamily: codeFont,
        fontSize: 14,
        lineHeight: 20,
        backgroundColor: isUser ? 'rgba(0,0,0,0.15)' : colors.backgroundTertiary,
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
      } as ViewStyle,
      fence: {
        fontFamily: codeFont,
        fontSize: 14,
        lineHeight: 20,
        backgroundColor: isUser ? 'rgba(0,0,0,0.15)' : colors.backgroundTertiary,
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
      } as ViewStyle,
      pre: {
        backgroundColor: isUser ? 'rgba(0,0,0,0.15)' : colors.backgroundTertiary,
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
      } as ViewStyle,
      em: {
        fontFamily: uiFont,
        fontStyle: 'italic',
        color: isUser ? colors.textOnBrand : colors.text,
      } as TextStyle,
      strong: {
        fontFamily: uiFont,
        fontWeight: '700',
        color: isUser ? colors.textOnBrand : colors.textStrong,
      } as TextStyle,
      link: {
        fontFamily: uiFont,
        color: isUser ? colors.textOnBrand : colors.textInteractive,
        textDecorationLine: 'underline',
      } as TextStyle,
      blockquote: {
        fontFamily: uiFont,
        borderLeftWidth: 4,
        borderLeftColor: isUser ? 'rgba(255,255,255,0.4)' : colors.borderActive,
        paddingLeft: 12,
        marginVertical: 8,
        color: isUser ? colors.textOnBrand : colors.textSecondary,
      } as ViewStyle,
      bullet_list: {
        marginVertical: 4,
      } as ViewStyle,
      ordered_list: {
        marginVertical: 4,
      } as ViewStyle,
      list_item: {
        fontFamily: uiFont,
        fontSize: 16,
        lineHeight: 22,
        color: isUser ? colors.textOnBrand : colors.text,
        marginVertical: 2,
      } as TextStyle,
      heading1: {
        fontFamily: uiFont,
        fontSize: 24,
        fontWeight: '700',
        color: isUser ? colors.textOnBrand : colors.textStrong,
        marginVertical: 8,
      } as TextStyle,
      heading2: {
        fontFamily: uiFont,
        fontSize: 20,
        fontWeight: '600',
        color: isUser ? colors.textOnBrand : colors.textStrong,
        marginVertical: 6,
      } as TextStyle,
      heading3: {
        fontFamily: uiFont,
        fontSize: 18,
        fontWeight: '600',
        color: isUser ? colors.textOnBrand : colors.textStrong,
        marginVertical: 4,
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
      <View style={bubbleStyle}>
        <Markdown style={markdownStyles} rules={renderers}>
          {message.content}
        </Markdown>
        <Text style={timestampStyle}>{formatTimestamp(message.timestamp)}</Text>
      </View>
    </View>
  );
}
