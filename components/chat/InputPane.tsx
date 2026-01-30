import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/components/ThemeProvider';
import { useFonts } from '@/hooks/useFonts';
import { Select, type SelectOption } from '@/components/ui/select';

interface InputPaneProps {
  onSend: (
    content: string,
    agent?: string,
    model?: { providerID: string; modelID: string }
  ) => void;
  isConnected: boolean;
  agents?: SelectOption[];
  models?: SelectOption[];
  disabled?: boolean;
}

export function InputPane({
  onSend,
  isConnected,
  agents = [],
  models = [],
  disabled = false,
}: InputPaneProps) {
  const { colors } = useTheme();
  const { uiFont } = useFonts();
  const [content, setContent] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  const canSend = content.trim().length > 0 && isConnected && !disabled;

  const handleSend = useCallback(() => {
    if (!canSend) return;

    const model = selectedModel ? { providerID: 'default', modelID: selectedModel } : undefined;

    onSend(content.trim(), selectedAgent || undefined, model);
    setContent('');
  }, [content, selectedAgent, selectedModel, canSend, onSend]);

  const containerStyle: ViewStyle = {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  };

  const inputStyle: TextStyle = {
    fontFamily: uiFont,
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: colors.inputBackground,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  };

  const sendButtonStyle = (isEnabled: boolean): ViewStyle => ({
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isEnabled ? colors.surfaceBrand : colors.inputBackgroundDisabled,
    opacity: isEnabled ? 1 : 0.5,
  });

  const selectorsContainerStyle: ViewStyle = {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  };

  const selectorStyle: ViewStyle = {
    flex: 1,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={containerStyle}>
        {(agents.length > 0 || models.length > 0) && (
          <View style={selectorsContainerStyle}>
            {agents.length > 0 && (
              <View style={selectorStyle}>
                <Select
                  value={selectedAgent}
                  options={[{ value: '', label: 'Default Agent' }, ...agents]}
                  onChange={setSelectedAgent}
                  size="sm"
                  placeholder="Agent..."
                  disabled={!isConnected || disabled}
                />
              </View>
            )}
            {models.length > 0 && (
              <View style={selectorStyle}>
                <Select
                  value={selectedModel}
                  options={[{ value: '', label: 'Default Model' }, ...models]}
                  onChange={setSelectedModel}
                  size="sm"
                  placeholder="Model..."
                  disabled={!isConnected || disabled}
                />
              </View>
            )}
          </View>
        )}

        <View style={inputContainerStyle}>
          <TextInput
            style={inputStyle}
            value={content}
            onChangeText={setContent}
            placeholder={isConnected ? 'Type a message...' : 'Connect to send messages'}
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={4000}
            editable={isConnected && !disabled}
            onSubmitEditing={() => {
              if (Platform.OS === 'web') {
                handleSend();
              }
            }}
          />
          <Pressable onPress={handleSend} disabled={!canSend}>
            <View style={sendButtonStyle(canSend)}>
              <SymbolView
                name="arrow.up"
                size={20}
                tintColor={canSend ? colors.textOnBrand : colors.iconDisabled}
                weight="semibold"
              />
            </View>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
