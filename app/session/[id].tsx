import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useLocalSearchParams } from 'expo-router';
import { MainContent } from '@/components/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Placeholder data - will be replaced with actual store data
const PLACEHOLDER_MESSAGES = [
  { id: '1', role: 'user', content: 'Hello! Can you help me with a coding task?' },
  { id: '2', role: 'assistant', content: 'Of course! I\'d be happy to help. What do you need assistance with?' },
  { id: '3', role: 'user', content: 'I need to refactor some React code to use hooks instead of class components.' },
];

export default function SessionChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(PLACEHOLDER_MESSAGES);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const userMessageBg = tintColor;
  const assistantMessageBg = useThemeColor({}, 'background');

  // TODO: Load session data from store based on id
  const sessionName = `Session ${id}`;

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // TODO: Send message to server and get response
    // For now, simulate a response
    setTimeout(() => {
      const assistantResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a placeholder response. The actual chat functionality will be implemented in a future update.',
      };
      setMessages(prev => [...prev, assistantResponse]);
    }, 1000);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={28} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor, fontFamily: Fonts.sans }]} numberOfLines={1}>
          {sessionName}
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <IconSymbol name="ellipsis" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      <MainContent>
        <View style={styles.content}>
          {/* Messages List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.role === 'user' ? styles.userMessageRow : styles.assistantMessageRow
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.role === 'user' 
                      ? [styles.userBubble, { backgroundColor: userMessageBg }]
                      : [styles.assistantBubble, { backgroundColor: assistantMessageBg, borderColor: 'rgba(0,0,0,0.1)' }]
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      { 
                        color: message.role === 'user' ? '#fff' : textColor,
                        fontFamily: Fonts.sans 
                      }
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input Area */}
          <View style={[styles.inputContainer, { backgroundColor, borderTopColor: 'rgba(0,0,0,0.1)' }]}>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: 'rgba(0,0,0,0.05)', 
                  color: textColor,
                  fontFamily: Fonts.sans 
                }
              ]}
              placeholder="Type a message..."
              placeholderTextColor={iconColor}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxHeight={100}
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: tintColor }]} 
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <IconSymbol 
                name="arrow.up" 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </MainContent>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    width: 44,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  moreButton: {
    padding: 8,
    width: 44,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
