import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, type ViewStyle, type TextStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { CodeBlock } from './CodeBlock';
import type { Part, TextPart, ReasoningPart, ToolPart } from '@/types/messageParts';

interface PartRendererProps {
  part: Part;
  isUser: boolean;
}

function PartRendererComponent({ part, isUser }: PartRendererProps) {
  const { colors } = useTheme();
  const { uiFont, codeFont } = useFonts();

  const baseContainerStyle: ViewStyle = useMemo(
    () => ({
      paddingVertical: 4,
      paddingHorizontal: isUser ? 0 : 10,
    }),
    [isUser]
  );

  switch (part.type) {
    case 'text':
      return (
        <TextPartRenderer
          part={part as TextPart}
          isUser={isUser}
          colors={colors}
          uiFont={uiFont}
          codeFont={codeFont}
        />
      );

    case 'reasoning':
      return (
        <ReasoningPartRenderer
          part={part as ReasoningPart}
          isUser={isUser}
          colors={colors}
          uiFont={uiFont}
          baseStyle={baseContainerStyle}
        />
      );

    case 'tool':
      return (
        <ToolPartRenderer
          part={part as ToolPart}
          isUser={isUser}
          colors={colors}
          uiFont={uiFont}
          baseStyle={baseContainerStyle}
        />
      );

    case 'patch':
      return (
        <View
          style={[
            baseContainerStyle,
            { borderLeftWidth: 2, borderLeftColor: '#10b981', paddingLeft: 10 },
          ]}
        >
          <Text style={{ fontFamily: uiFont, fontSize: 13, color: colors.textSecondary }}>
            Files changed
          </Text>
        </View>
      );

    case 'agent':
      return (
        <View
          style={[
            baseContainerStyle,
            { borderLeftWidth: 2, borderLeftColor: '#8b5cf6', paddingLeft: 10 },
          ]}
        >
          <Text style={{ fontFamily: uiFont, fontSize: 13, color: colors.textSecondary }}>
            Agent: {(part as any).name}
          </Text>
        </View>
      );

    default:
      return null;
  }
}

// Memo comparison for PartRenderer - only re-render if part changes
function partRendererAreEqual(prevProps: PartRendererProps, nextProps: PartRendererProps): boolean {
  if (prevProps.isUser !== nextProps.isUser) return false;
  if (prevProps.part.id !== nextProps.part.id) return false;
  if (prevProps.part.type !== nextProps.part.type) return false;
  // For text parts, check if content changed
  if (prevProps.part.type === 'text' && nextProps.part.type === 'text') {
    const prevText = prevProps.part as TextPart;
    const nextText = nextProps.part as TextPart;
    if (prevText.text !== nextText.text) return false;
  }
  return true;
}

export const PartRenderer = memo(PartRendererComponent, partRendererAreEqual);

// Text Part Renderer
interface TextPartRendererProps {
  part: TextPart;
  isUser: boolean;
  colors: any;
  uiFont: string;
  codeFont: string;
}

const TextPartRenderer = memo(function TextPartRenderer({
  part,
  isUser,
  colors,
  uiFont,
  codeFont,
}: TextPartRendererProps) {
  // Memoize markdown styles to prevent recreation on every render
  const markdownStyles = useMemo(
    () => ({
      body: {
        fontFamily: uiFont,
        fontSize: 15,
        lineHeight: 20,
        color: colors.text,
      } as TextStyle,
      paragraph: {
        fontFamily: uiFont,
        fontSize: 15,
        lineHeight: 20,
        color: colors.text,
        marginVertical: 2,
      } as TextStyle,
      code_inline: {
        fontFamily: codeFont,
        fontSize: 13,
        backgroundColor: colors.backgroundTertiary,
        color: colors.syntaxPrimitive,
        paddingHorizontal: 3,
        paddingVertical: 1,
      } as TextStyle,
      code_block: {
        fontFamily: codeFont,
        fontSize: 13,
        lineHeight: 18,
        backgroundColor: colors.backgroundTertiary,
        padding: 8,
        marginVertical: 4,
      } as ViewStyle,
      fence: {
        fontFamily: codeFont,
        fontSize: 13,
        lineHeight: 18,
        backgroundColor: colors.backgroundTertiary,
        padding: 8,
        marginVertical: 4,
      } as ViewStyle,
      pre: {
        backgroundColor: colors.backgroundTertiary,
        padding: 8,
        marginVertical: 4,
      } as ViewStyle,
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
    [
      uiFont,
      codeFont,
      colors.text,
      colors.backgroundTertiary,
      colors.syntaxPrimitive,
      colors.textStrong,
      colors.textInteractive,
      colors.borderActive,
      colors.textSecondary,
    ]
  );

  // Memoize renderers to prevent recreation
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
    <Markdown style={markdownStyles} rules={renderers}>
      {part.text}
    </Markdown>
  );
});

// Reasoning Part Renderer
interface ReasoningPartRendererProps {
  part: ReasoningPart;
  isUser: boolean;
  colors: any;
  uiFont: string;
  baseStyle: ViewStyle;
}

const ReasoningPartRenderer = memo(function ReasoningPartRenderer({
  part,
  isUser,
  colors,
  uiFont,
  baseStyle,
}: ReasoningPartRendererProps) {
  const [expanded, setExpanded] = React.useState(false);

  // Memoize duration calculation
  const duration = useMemo(() => {
    if (part.time?.end && part.time?.start) {
      return ((part.time.end - part.time.start) / 1000).toFixed(1);
    }
    return null;
  }, [part.time?.end, part.time?.start]);

  // Memoize toggle handler
  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // Memoize container style
  const containerStyle = useMemo(
    () => [baseStyle, { borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 10 }],
    [baseStyle, colors.border]
  );

  // Memoize header style
  const headerStyle = useMemo(
    () => ({
      fontFamily: uiFont,
      fontSize: 12,
      color: colors.textTertiary,
      marginBottom: 4,
    }),
    [uiFont, colors.textTertiary]
  );

  // Memoize content style
  const contentStyle = useMemo(
    () => ({
      fontFamily: uiFont,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    }),
    [uiFont, colors.textSecondary]
  );

  // Don't show reasoning for user messages - moved after all hooks
  if (isUser) {
    return null;
  }

  return (
    <View style={containerStyle}>
      <Text style={headerStyle} onPress={toggleExpanded}>
        {expanded ? '▼' : '▶'} Thinking{duration ? ` (${duration}s)` : ''}
      </Text>
      {expanded && <Text style={contentStyle}>{part.text}</Text>}
    </View>
  );
});

// Tool Part Renderer
interface ToolPartRendererProps {
  part: ToolPart;
  isUser: boolean;
  colors: any;
  uiFont: string;
  baseStyle: ViewStyle;
}

const ToolPartRenderer = memo(function ToolPartRenderer({
  part,
  colors,
  uiFont,
  baseStyle,
}: ToolPartRendererProps) {
  // Memoize status color lookup
  const statusColor = useMemo(() => {
    switch (part.state.status) {
      case 'success':
        return '#10b981'; // green
      case 'error':
        return '#ef4444'; // red
      case 'running':
        return '#3b82f6'; // blue
      default:
        return colors.border;
    }
  }, [part.state.status, colors.border]);

  // Memoize container style
  const containerStyle = useMemo(
    () => [baseStyle, { borderLeftWidth: 2, borderLeftColor: statusColor, paddingLeft: 10 }],
    [baseStyle, statusColor]
  );

  // Memoize text styles
  const toolTextStyle = useMemo(
    () => ({
      fontFamily: uiFont,
      fontSize: 13,
      color: colors.textSecondary,
    }),
    [uiFont, colors.textSecondary]
  );

  const statusTextStyle = useMemo(
    () => ({
      fontFamily: uiFont,
      fontSize: 11,
      color: colors.textTertiary,
      textTransform: 'uppercase' as const,
    }),
    [uiFont, colors.textTertiary]
  );

  return (
    <View style={containerStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={toolTextStyle}>{part.tool}</Text>
        <Text style={statusTextStyle}>{part.state.status}</Text>
      </View>
    </View>
  );
});
