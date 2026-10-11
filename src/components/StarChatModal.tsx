import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SkyObject, ObserverLocation } from '../types/astronomy';
import { AIChatService, ChatMessage } from '../ai/AIChatService';
import { HapticsService } from '../sensors/HapticsService';

interface StarChatModalProps {
  visible: boolean;
  onClose: () => void;
  targetObject: SkyObject | null;
  location?: ObserverLocation | null;
}

export const StarChatModal: React.FC<StarChatModalProps> = ({
  visible,
  onClose,
  targetObject,
  location,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Dynamic curated questions based on star
  const quickQuestions = targetObject
    ? [
        `How far is ${targetObject.name}?`,
        `Mythology & lore?`,
        `How do I see it with naked eyes?`,
        `What makes ${targetObject.name} unique?`,
      ]
    : [
        'How do stars differ from planets?',
        'How to let eyes adapt to the dark?',
        'What constellation is easiest to find tonight?',
      ];

  // Initialize welcome message when modal opens or selected star changes
  useEffect(() => {
    if (visible) {
      const welcomeText = targetObject
        ? `Greetings Stargazer! ✨\n\nI am your **AI Celestial Navigator**. We are currently locked onto **${targetObject.name}** (${targetObject.type === 'planet' ? 'Planet' : 'Star'}, ${targetObject.constellationName || 'Celestial Sphere'}).\n\nWhat would you like to discover about ${targetObject.name} tonight?`
        : `Greetings Stargazer! ✨\n\nI am your **AI Astronomer**. Ask me anything about constellations, celestial mechanics, or tap any star in your sky view to analyze it!`;

      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: 'assistant',
          text: welcomeText,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [visible, targetObject?.id]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    HapticsService.triggerClick();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const apiMessages = newMessages
        .filter((m) => m.sender !== 'system')
        .map((m) => ({
          role: m.sender as 'user' | 'assistant',
          content: m.text,
        }));

      const reply = await AIChatService.askAstronomer(apiMessages, {
        targetObject,
        location,
      });

      const aiMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      HapticsService.triggerSuccess();
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I couldn't reach the celestial neural model right now. Please try asking again!",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Formats inline markdown like **bold**, *italic*, and `code` into nested styled <Text> spans
  const renderFormattedText = (text: string, isUser: boolean) => {
    // Regex splits by **bold**, *italic*, or `code`
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <Text
            key={index}
            style={[
              isUser ? styles.userBubbleText : styles.assistantBubbleText,
              styles.boldText,
            ]}
          >
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <Text
            key={index}
            style={[
              isUser ? styles.userBubbleText : styles.assistantBubbleText,
              styles.italicText,
            ]}
          >
            {part.slice(1, -1)}
          </Text>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <Text
            key={index}
            style={[
              isUser ? styles.userBubbleText : styles.assistantBubbleText,
              styles.codeSpan,
            ]}
          >
            {part.slice(1, -1)}
          </Text>
        );
      }
      return (
        <Text
          key={index}
          style={isUser ? styles.userBubbleText : styles.assistantBubbleText}
        >
          {part}
        </Text>
      );
    });
  };

  const renderMessageItem = (item: ChatMessage) => {
    const isUser = item.sender === 'user';
    return (
      <View
        style={[
          styles.bubbleContainer,
          isUser ? styles.userBubbleContainer : styles.assistantBubbleContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Text style={{ fontSize: 14 }}>🔭</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={styles.bubbleText}>
            {renderFormattedText(item.text, isUser)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Glow Effects in Background */}
        <View style={styles.glowTopRight} pointerEvents="none" />
        <View style={styles.glowBottomLeft} pointerEvents="none" />

        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.targetIconBadge}>
              <Text style={{ fontSize: 20 }}>
                {targetObject?.type === 'planet' ? '🪐' : '⭐'}
              </Text>
            </View>
            <View style={styles.headerTextGroup}>
              <View style={styles.nameRow}>
                <Text style={styles.headerTitle}>
                  {targetObject ? targetObject.name : 'AI Astronomer'}
                </Text>
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>AI ONLINE</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>
                {targetObject
                  ? `${targetObject.constellationName || 'Deep Sky'} • Elevation ${Math.round(targetObject.altitude)}°`
                  : 'Interactive Celestial Intelligence'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Real-time Astronomical Telemetry Bar */}
        {targetObject && (
          <View style={styles.telemetryBar}>
            {targetObject.distanceLightYears && (
              <View style={styles.telemetryCard}>
                <Text style={styles.telemetryLabel}>LIGHT TRAVEL</Text>
                <Text style={styles.telemetryValue}>{targetObject.distanceLightYears} ly</Text>
              </View>
            )}
            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryLabel}>BRIGHTNESS</Text>
              <Text style={styles.telemetryValue}>Mag {targetObject.magnitude}</Text>
            </View>
            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryLabel}>HEADING</Text>
              <Text style={styles.telemetryValue}>{Math.round(targetObject.azimuth)}° Az</Text>
            </View>
            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryLabel}>STATUS</Text>
              <Text style={[styles.telemetryValue, { color: targetObject.isVisible ? '#34D399' : '#F87171' }]}>
                {targetObject.isVisible ? 'Above Horizon' : 'Sub-Horizon'}
              </Text>
            </View>
          </View>
        )}

        {/* Conversation Stream */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((item) => (
            <View key={item.id}>{renderMessageItem(item)}</View>
          ))}
          {isLoading && (
            <View style={[styles.bubbleContainer, styles.assistantBubbleContainer]}>
              <View style={styles.assistantAvatar}>
                <Text style={{ fontSize: 14 }}>🔭</Text>
              </View>
              <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
                <ActivityIndicator color="#38BDF8" size="small" />
                <Text style={styles.thinkingText}>Consulting astronomical model...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        <View style={styles.quickChipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickChipsList}
          >
            {quickQuestions.map((item, idx) => (
              <TouchableOpacity
                key={`quick-${idx}`}
                style={styles.chipBtn}
                activeOpacity={0.7}
                onPress={() => handleSendMessage(item)}
                disabled={isLoading}
              >
                <Text style={styles.chipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Message Input Bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                targetObject
                  ? `Ask AI about ${targetObject.name}...`
                  : 'Ask about stars, planets or lore...'
              }
              placeholderTextColor="#64748B"
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={() => handleSendMessage()}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#040714',
  },
  glowTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 38,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(10, 15, 32, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.15)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  targetIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(14, 165, 233, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 4,
  },
  onlineText: {
    color: '#6EE7B7',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeBtnText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
  },
  telemetryBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.12)',
  },
  telemetryLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  telemetryValue: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  messageList: {
    paddingHorizontal: 16,
    flex: 1,
  },
  messageContent: {
    paddingVertical: 18,
    flexGrow: 1,
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
  },
  userBubbleContainer: {
    justifyContent: 'flex-end',
  },
  assistantBubbleContainer: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(14, 165, 233, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#0284C7',
    borderBottomRightRadius: 4,
    shadowColor: '#0284C7',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(18, 28, 54, 0.92)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  thinkingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '800',
    color: '#38BDF8',
  },
  italicText: {
    fontStyle: 'italic',
  },
  codeSpan: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    color: '#F472B6',
  },
  userBubbleText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  assistantBubbleText: {
    color: '#F1F5F9',
  },
  quickChipsWrapper: {
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 16, 32, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickChipsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  chipText: {
    color: '#BAE6FD',
    fontSize: 12,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: 'rgba(10, 16, 32, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.15)',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 55, 0.85)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: 10,
  },
  textInput: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    shadowOpacity: 0,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
