import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, type ViewStyle, type TextStyle } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';

interface CodeBlockProps {
  code: string;
  language?: string;
  isUser?: boolean;
}

interface Token {
  type: string;
  value: string;
}

const LANGUAGE_PATTERNS: Record<string, Record<string, RegExp>> = {
  javascript: {
    comment: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g,
    keyword:
      /\b(const|let|var|function|if|else|return|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|for|while|do|break|continue|switch|case|default|in|of|yield|static|get|set|extends|super|true|false|null|undefined)\b/g,
    number: /\b\d+\.?\d*\b/g,
    function: /\b([a-zA-Z_]\w*)\s*(?=\()/g,
  },
  typescript: {
    comment: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g,
    keyword:
      /\b(const|let|var|function|if|else|return|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|for|while|do|break|continue|switch|case|default|in|of|yield|static|get|set|extends|super|true|false|null|undefined|interface|type|enum|namespace|module|declare|abstract|readonly|public|private|protected|implements|as|satisfies)\b/g,
    number: /\b\d+\.?\d*\b/g,
    type: /\b(string|number|boolean|any|void|unknown|never|object|symbol|bigint)\b/g,
    function: /\b([a-zA-Z_]\w*)\s*(?=\()/g,
  },
  python: {
    comment: /#.*$/gm,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?"""|'''[\s\S]*?'''/g,
    keyword:
      /\b(def|class|if|else|elif|return|import|from|as|try|except|finally|raise|for|while|break|continue|pass|lambda|with|yield|async|await|and|or|not|in|is|None|True|False|global|nonlocal|assert|del|print)\b/g,
    number: /\b\d+\.?\d*\b/g,
    function: /\b([a-zA-Z_]\w*)\s*(?=\()/g,
  },
  json: {
    string: /"(?:[^"\\]|\\.)*"/g,
    number: /\b\d+\.?\d*\b/g,
    keyword: /\b(true|false|null)\b/g,
  },
  bash: {
    comment: /#.*$/gm,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    keyword:
      /\b(if|then|else|elif|fi|for|while|do|done|case|esac|in|function|return|exit|echo|cd|ls|pwd|cat|grep|sed|awk|chmod|chown|mkdir|rmdir|rm|cp|mv|touch|source|export|unset|local|readonly)\b/g,
    number: /\b\d+\b/g,
  },
  shell: {
    comment: /#.*$/gm,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    keyword:
      /\b(if|then|else|elif|fi|for|while|do|done|case|esac|in|function|return|exit|echo|cd|ls|pwd|cat|grep|sed|awk|chmod|chown|mkdir|rmdir|rm|cp|mv|touch|source|export|unset|local|readonly)\b/g,
    number: /\b\d+\b/g,
  },
  css: {
    comment: /\/\*[\s\S]*?\*\//gm,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    property: /\b[a-z-]+(?=\s*:)/g,
    value: /:\s*([^;]+)/g,
    selector: /[.#]?[a-zA-Z_-][\w-]*(?=\s*\{)/g,
    number:
      /\b\d+\.?\d*(?:px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax|deg|rad|grad|turn|s|ms|hz|khz|dpi|dpcm|dppx)?\b/gi,
  },
  html: {
    comment: /<!--[\s\S]*?-->/g,
    tag: /<\/?[a-zA-Z][\w-]*(?:\s[^>]*)?>/g,
    attribute: /\s[a-zA-Z-]+(?=\s*=)/g,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
  },
  yaml: {
    comment: /#.*$/gm,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    key: /^[a-zA-Z_-][\w-]*(?=\s*:)/gm,
    number: /\b\d+\.?\d*\b/g,
    keyword: /\b(true|false|null|yes|no|on|off)\b/g,
  },
  markdown: {
    heading: /^#{1,6}\s+.+$/gm,
    bold: /\*\*[\s\S]*?\*\*|__[\s\S]*?__/g,
    italic: /\*[\s\S]*?\*|_[\s\S]*?_/g,
    code: /`[^`]+`/g,
    link: /\[([^\]]+)\]\(([^)]+)\)/g,
  },
  generic: {
    comment: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    keyword:
      /\b(if|else|for|while|return|function|class|const|let|var|import|export|try|catch|throw|new|this|true|false|null)\b/g,
    number: /\b\d+\.?\d*\b/g,
  },
};

function normalizeLanguage(language: string | undefined): string {
  if (!language) return 'generic';
  const lang = language.toLowerCase().trim();
  const aliases: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
    py: 'python',
    sh: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    md: 'markdown',
    css: 'css',
    scss: 'css',
    sass: 'css',
    less: 'css',
  };
  return aliases[lang] || lang;
}

function tokenize(code: string, language: string): Token[] {
  const patterns = LANGUAGE_PATTERNS[language] || LANGUAGE_PATTERNS.generic;
  const tokens: Token[] = [];
  let position = 0;

  while (position < code.length) {
    let earliestMatch: { type: string; index: number; match: RegExpMatchArray } | null = null;

    for (const [type, regex] of Object.entries(patterns)) {
      regex.lastIndex = position;
      const match = regex.exec(code);
      if (match && match.index >= position) {
        if (!earliestMatch || match.index < earliestMatch.index) {
          earliestMatch = { type, index: match.index, match };
        }
      }
    }

    if (earliestMatch) {
      if (earliestMatch.index > position) {
        tokens.push({
          type: 'default',
          value: code.slice(position, earliestMatch.index),
        });
      }
      tokens.push({
        type: earliestMatch.type,
        value: earliestMatch.match[0],
      });
      position = earliestMatch.index + earliestMatch.match[0].length;
    } else {
      tokens.push({ type: 'default', value: code.slice(position) });
      break;
    }
  }

  return tokens;
}

export function CodeBlock({ code, language, isUser = false }: CodeBlockProps) {
  const { colors } = useTheme();
  const { codeFont } = useFonts();
  const [copied, setCopied] = useState(false);

  const normalizedLang = normalizeLanguage(language);
  const tokens = tokenize(code, normalizedLang);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const getTokenColor = (tokenType: string): string => {
    const colorMap: Record<string, string> = {
      comment: colors.syntaxComment,
      string: colors.syntaxString,
      keyword: colors.syntaxKeyword,
      number: colors.syntaxConstant,
      function: colors.syntaxProperty,
      type: colors.syntaxType,
      property: colors.syntaxProperty,
      attribute: colors.syntaxProperty,
      selector: colors.syntaxType,
      tag: colors.syntaxKeyword,
      key: colors.syntaxProperty,
      heading: colors.syntaxType,
      bold: colors.syntaxString,
      italic: colors.syntaxString,
      link: colors.syntaxInfo,
      code: colors.syntaxPrimitive,
      default: isUser ? colors.textOnBrand : colors.text,
    };
    return colorMap[tokenType] || colorMap.default;
  };

  const containerStyle: ViewStyle = {
    backgroundColor: isUser ? 'rgba(0,0,0,0.15)' : colors.backgroundTertiary,
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: isUser ? 'rgba(0,0,0,0.1)' : colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: isUser ? 'rgba(0,0,0,0.05)' : colors.border,
  };

  const languageTextStyle: TextStyle = {
    fontFamily: codeFont,
    fontSize: 12,
    color: isUser ? colors.textOnBrand : colors.textSecondary,
    textTransform: 'uppercase',
  };

  const copyButtonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: copied
      ? isUser
        ? 'rgba(0,0,0,0.2)'
        : colors.surfaceSuccess
      : isUser
        ? 'rgba(0,0,0,0.1)'
        : colors.surface,
  };

  const copyTextStyle: TextStyle = {
    fontFamily: codeFont,
    fontSize: 12,
    color: copied
      ? isUser
        ? colors.textOnBrand
        : colors.textOnSuccess
      : isUser
        ? colors.textOnBrand
        : colors.textSecondary,
    marginLeft: 4,
  };

  const codeContainerStyle: ViewStyle = {
    padding: 12,
  };

  const lineStyle: ViewStyle = {
    flexDirection: 'row',
  };

  const lineNumberStyle: TextStyle = {
    fontFamily: codeFont,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
    width: 40,
    textAlign: 'right',
    paddingRight: 12,
    userSelect: 'none',
  };

  const codeTextStyle: TextStyle = {
    fontFamily: codeFont,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  };

  const lines = code.split('\n');
  let tokenIndex = 0;
  let currentToken = tokens[tokenIndex];
  let currentTokenPos = 0;

  const renderLine = (line: string, lineNum: number) => {
    const lineTokens: React.ReactElement[] = [];
    let linePos = 0;

    while (linePos < line.length) {
      if (!currentToken || tokenIndex >= tokens.length) {
        lineTokens.push(
          <Text
            key={`${lineNum}-${linePos}`}
            style={[codeTextStyle, { color: getTokenColor('default') }]}
          >
            {line.slice(linePos)}
          </Text>
        );
        break;
      }

      const tokenRemaining = currentToken.value.slice(currentTokenPos);
      const newlineIndex = tokenRemaining.indexOf('\n');

      if (newlineIndex !== -1) {
        const beforeNewline = tokenRemaining.slice(0, newlineIndex);
        if (beforeNewline.length > 0) {
          if (linePos + beforeNewline.length > line.length) {
            const partial = beforeNewline.slice(0, line.length - linePos);
            lineTokens.push(
              <Text
                key={`${lineNum}-${linePos}`}
                style={[codeTextStyle, { color: getTokenColor(currentToken.type) }]}
              >
                {partial}
              </Text>
            );
            currentTokenPos += partial.length;
          } else {
            lineTokens.push(
              <Text
                key={`${lineNum}-${linePos}`}
                style={[codeTextStyle, { color: getTokenColor(currentToken.type) }]}
              >
                {beforeNewline}
              </Text>
            );
            currentTokenPos += beforeNewline.length + 1;
            linePos += beforeNewline.length;
          }
        } else {
          currentTokenPos++;
        }
        tokenIndex++;
        currentToken = tokens[tokenIndex];
        currentTokenPos = 0;
        break;
      }

      if (tokenRemaining.length > line.length - linePos) {
        const partial = tokenRemaining.slice(0, line.length - linePos);
        lineTokens.push(
          <Text
            key={`${lineNum}-${linePos}`}
            style={[codeTextStyle, { color: getTokenColor(currentToken.type) }]}
          >
            {partial}
          </Text>
        );
        currentTokenPos += partial.length;
        linePos += partial.length;
      } else {
        lineTokens.push(
          <Text
            key={`${lineNum}-${linePos}`}
            style={[codeTextStyle, { color: getTokenColor(currentToken.type) }]}
          >
            {tokenRemaining}
          </Text>
        );
        currentTokenPos += tokenRemaining.length;
        linePos += tokenRemaining.length;
        tokenIndex++;
        currentToken = tokens[tokenIndex];
        currentTokenPos = 0;
      }
    }

    if (line.length === 0) {
      tokenIndex++;
      currentToken = tokens[tokenIndex];
      currentTokenPos = 0;
    }

    return (
      <View key={lineNum} style={lineStyle}>
        <Text style={lineNumberStyle}>{lineNum + 1}</Text>
        <Text style={codeTextStyle}>{lineTokens}</Text>
      </View>
    );
  };

  return (
    <View style={containerStyle}>
      <View style={headerStyle}>
        <Text style={languageTextStyle}>{normalizedLang}</Text>
        <TouchableOpacity onPress={handleCopy} style={copyButtonStyle} activeOpacity={0.7}>
          <Text style={{ fontSize: 14 }}>{copied ? '✓' : '📋'}</Text>
          <Text style={copyTextStyle}>{copied ? 'Copied' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>
      <View style={codeContainerStyle}>{lines.map((line, index) => renderLine(line, index))}</View>
    </View>
  );
}
