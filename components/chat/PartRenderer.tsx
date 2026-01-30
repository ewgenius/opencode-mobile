import React from 'react';
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

export function PartRenderer({ part, isUser }: PartRendererProps) {
  const { colors } = useTheme();
  const { uiFont, codeFont } = useFonts();

  const baseContainerStyle: ViewStyle = {
    paddingVertical: 4,
    paddingHorizontal: isUser ? 0 : 10,
  };

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

// Text Part Renderer
interface TextPartRendererProps {
  part: TextPart;
  isUser: boolean;
  colors: any;
  uiFont: string;
  codeFont: string;
}

function TextPartRenderer({ part, isUser, colors, uiFont, codeFont }: TextPartRendererProps) {
  const markdownStyles = {
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
  };

  const renderers = {
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
  };

  return (
    <Markdown style={markdownStyles} rules={renderers}>
      {part.text}
    </Markdown>
  );
}

// Reasoning Part Renderer
interface ReasoningPartRendererProps {
  part: ReasoningPart;
  isUser: boolean;
  colors: any;
  uiFont: string;
  baseStyle: ViewStyle;
}

function ReasoningPartRenderer({
  part,
  isUser,
  colors,
  uiFont,
  baseStyle,
}: ReasoningPartRendererProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (isUser) {
    return null; // Don't show reasoning for user messages
  }

  const duration =
    part.time?.end && part.time?.start
      ? ((part.time.end - part.time.start) / 1000).toFixed(1)
      : null;

  return (
    <View
      style={[baseStyle, { borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 10 }]}
    >
      <Text
        style={{
          fontFamily: uiFont,
          fontSize: 12,
          color: colors.textTertiary,
          marginBottom: 4,
        }}
        onPress={() => setExpanded(!expanded)}
      >
        {expanded ? '▼' : '▶'} Thinking{duration ? ` (${duration}s)` : ''}
      </Text>
      {expanded && (
        <Text
          style={{ fontFamily: uiFont, fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}
        >
          {part.text}
        </Text>
      )}
    </View>
  );
}

// Tool Part Renderer
interface ToolPartRendererProps {
  part: ToolPart;
  isUser: boolean;
  colors: any;
  uiFont: string;
  baseStyle: ViewStyle;
}

function ToolPartRenderer({ part, isUser, colors, uiFont, baseStyle }: ToolPartRendererProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#10b981'; // green
      case 'error':
        return '#ef4444'; // red
      case 'running':
        return '#3b82f6'; // blue
      default:
        return colors.border;
    }
  };

  return (
    <View
      style={[
        baseStyle,
        { borderLeftWidth: 2, borderLeftColor: getStatusColor(part.state.status), paddingLeft: 10 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontFamily: uiFont, fontSize: 13, color: colors.textSecondary }}>
          {part.tool}
        </Text>
        <Text
          style={{
            fontFamily: uiFont,
            fontSize: 11,
            color: colors.textTertiary,
            textTransform: 'uppercase',
          }}
        >
          {part.state.status}
        </Text>
      </View>
    </View>
  );
}
