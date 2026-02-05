/**
 * Coach Chat Modal Component
 * Full-screen chat interface for AI coach conversations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Colors } from '../../../constants/Theme';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { aiService } from '../../../services/aiService';
import { CoachMode, CoachMessage, CoachContext, CoachResponse } from '../../../types/ai';
import { mediumImpact, lightImpact } from '../../../utils/haptics';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

// iOS 26 Liquid Glass colors
const GLASS_COLORS = {
  light: {
    background: '#F8F8F8',
    headerBg: 'rgba(255, 255, 255, 0.85)',
    inputBg: 'rgba(255, 255, 255, 0.85)',
    userBubble: 'rgba(0, 122, 255, 0.9)',
    assistantBubble: 'rgba(255, 255, 255, 0.75)',
    text: '#1D1D1F',
    textSecondary: 'rgba(60, 60, 67, 0.6)',
    border: 'rgba(0, 0, 0, 0.08)',
    inputBorder: 'rgba(0, 0, 0, 0.12)',
  },
  dark: {
    background: '#0A0A0A',
    headerBg: 'rgba(44, 44, 46, 0.85)',
    inputBg: 'rgba(44, 44, 46, 0.85)',
    userBubble: 'rgba(10, 132, 255, 0.9)',
    assistantBubble: 'rgba(255, 255, 255, 0.08)',
    text: Colors.text,
    textSecondary: 'rgba(235, 235, 245, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
  },
};

interface CoachChatModalProps {
  visible: boolean;
  onClose: () => void;
  mode: CoachMode;
  initialMessage?: string;
  context?: {
    userGoals?: {
      dailyCalories?: number;
      dailyProtein?: number;
      fitnessGoal?: string;
      activityLevel?: string;
    };
    recentMeals?: Array<{
      name: string;
      calories: number;
      mealType: string;
    }>;
    recentWorkouts?: Array<{
      type: string;
      duration: number;
      date: string;
    }>;
  };
}

// Suggestion chips for each mode
const MODE_SUGGESTIONS: Record<CoachMode, string[]> = {
  meal: [
    'What should I eat for dinner?',
    'High protein meal ideas',
    'Quick healthy snacks',
    'How to hit my protein goal?',
  ],
  training: [
    'Good warm-up routine?',
    'Improve my squat form',
    'How to build muscle faster?',
    'Best exercises for core',
  ],
  general: [
    'How do I lose weight safely?',
    'Tips for better sleep',
    'How to stay motivated?',
    'Balance cardio and weights',
  ],
};

const MODE_CONFIG: Record<CoachMode, {
  title: string;
  icon: string;
  accentColor: string;
  placeholder: string;
}> = {
  meal: {
    title: 'Meal Coach',
    icon: 'nutrition',
    accentColor: Colors.successStrong,
    placeholder: 'Ask about meals, nutrition, recipes...',
  },
  training: {
    title: 'Training Coach',
    icon: 'barbell',
    accentColor: '#3b82f6',
    placeholder: 'Ask about workouts, form, exercises...',
  },
  general: {
    title: 'AI Coach',
    icon: 'fitness',
    accentColor: '#a855f7',
    placeholder: 'Ask anything about health & fitness...',
  },
};

export function CoachChatModal({
  visible,
  onClose,
  mode: initialMode,
  initialMessage,
  context,
}: CoachChatModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;
  const flatListRef = useRef<FlatList>(null);

  const [currentMode, setCurrentMode] = useState<CoachMode>(initialMode);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [showModeSwitcher, setShowModeSwitcher] = useState(false);

  // Update current mode when initialMode changes
  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  const config = MODE_CONFIG[currentMode];
  const suggestions = MODE_SUGGESTIONS[currentMode];

  // Spring animation for send button
  const sendButtonScale = useSharedValue(1);

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  // Load conversation history on mount
  useEffect(() => {
    if (visible && !hasLoadedHistory) {
      loadHistory();
    }
  }, [visible, hasLoadedHistory]);

  // Handle initial message
  useEffect(() => {
    if (visible && initialMessage && hasLoadedHistory) {
      setInputText(initialMessage);
      // Auto-send initial message after a short delay
      setTimeout(() => {
        handleSendMessage(initialMessage);
        setInputText('');
      }, 300);
    }
  }, [visible, initialMessage, hasLoadedHistory]);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setHasLoadedHistory(false);
    }
  }, [visible]);

  const loadHistory = async () => {
    try {
      const history = await aiService.getCoachHistory(currentMode);
      setMessages(history);
      setHasLoadedHistory(true);

      // Scroll to bottom after loading
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error loading coach history:', error);
      setHasLoadedHistory(true);
    }
  };

  // Handle mode switching
  const handleModeSwitch = async (newMode: CoachMode) => {
    if (newMode === currentMode) {
      setShowModeSwitcher(false);
      return;
    }

    lightImpact();
    setCurrentMode(newMode);
    setShowModeSwitcher(false);
    setHasLoadedHistory(false);

    // Load history for new mode
    try {
      const history = await aiService.getCoachHistory(newMode);
      setMessages(history);
      setHasLoadedHistory(true);
    } catch (error) {
      console.error('Error loading coach history for mode:', newMode, error);
      setMessages([]);
      setHasLoadedHistory(true);
    }
  };

  // Handle suggestion chip tap
  const handleSuggestionTap = (suggestion: string) => {
    lightImpact();
    setInputText(suggestion);
  };

  const handleSendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    lightImpact();
    setInputText('');
    Keyboard.dismiss();

    // Add user message
    const userMessage: CoachMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      mode: currentMode,
    };

    setMessages(prev => [...prev, userMessage]);
    await aiService.saveCoachMessage(userMessage, currentMode);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Get AI response
    setIsLoading(true);
    try {
      const coachContext: CoachContext = {
        mode: currentMode,
        conversationHistory: messages.slice(-10), // Last 10 messages for context
        // Add user context for more personalized responses
        userGoals: context?.userGoals,
        recentActivity: currentMode === 'meal' ? context?.recentMeals : context?.recentWorkouts,
      };

      const response = await aiService.sendCoachMessage(messageText, coachContext);

      if (response) {
        const assistantMessage: CoachMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString(),
          mode: currentMode,
        };

        setMessages(prev => [...prev, assistantMessage]);
        await aiService.saveCoachMessage(assistantMessage, currentMode);
        mediumImpact();
      } else {
        // Fallback response if API fails
        const errorMessage: CoachMessage = {
          id: `msg_${Date.now()}_error`,
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          mode: currentMode,
        };
        setMessages(prev => [...prev, errorMessage]);
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending coach message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, messages, currentMode, context]);

  const handleClearHistory = useCallback(async () => {
    await aiService.clearCoachHistory(currentMode);
    setMessages([]);
    mediumImpact();
  }, [currentMode]);

  const renderMessage = ({ item }: { item: CoachMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && (
          <View style={[styles.avatarBadge, { backgroundColor: `${config.accentColor}20` }]}>
            <Ionicons name={config.icon as any} size={14} color={config.accentColor} />
          </View>
        )}
        <View style={[
          styles.messageContent,
          isUser
            ? [styles.userMessageContent, { backgroundColor: glassColors.userBubble }]
            : [styles.assistantMessageContent, { backgroundColor: glassColors.assistantBubble }],
        ]}>
          <Text style={[
            styles.messageText,
            { color: isUser ? Colors.text : glassColors.text }
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: `${config.accentColor}20` }]}>
        <Ionicons name={config.icon as any} size={32} color={config.accentColor} />
      </View>
      <Text style={[styles.emptyTitle, { color: glassColors.text }]}>Start a Conversation</Text>
      <Text style={[styles.emptySubtitle, { color: glassColors.textSecondary }]}>
        Ask me anything about {currentMode === 'meal' ? 'nutrition and meal planning' : currentMode === 'training' ? 'workouts and exercise form' : 'your health and fitness goals'}
      </Text>

      {/* Suggestion Chips */}
      <View style={styles.suggestionsContainer}>
        <Text style={[styles.suggestionsLabel, { color: glassColors.textSecondary }]}>Quick suggestions:</Text>
        <View style={styles.suggestionsGrid}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionChip,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  borderColor: glassColors.border,
                }
              ]}
              onPress={() => handleSuggestionTap(suggestion)}
              activeOpacity={0.7}
            >
              <Text style={[styles.suggestionText, { color: glassColors.text }]}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Background */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: glassColors.background }]} />

        {/* Header with Liquid Glass */}
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.header, { paddingTop: insets.top, borderBottomColor: glassColors.border }]}
        >
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="chevron-down" size={24} color={glassColors.text} />
          </TouchableOpacity>
          {/* Mode Switcher Button */}
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              setShowModeSwitcher(!showModeSwitcher);
            }}
            style={styles.headerCenter}
          >
            <Ionicons name={config.icon as any} size={18} color={config.accentColor} />
            <Text style={[styles.headerTitle, { color: glassColors.text }]}>{config.title}</Text>
            <Ionicons name="chevron-down" size={14} color={glassColors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearHistory} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={20} color={glassColors.textSecondary} />
          </TouchableOpacity>
        </BlurView>

        {/* Mode Switcher Dropdown */}
        {showModeSwitcher && (
          <BlurView
            intensity={isDark ? 70 : 90}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.modeSwitcher, { borderColor: glassColors.border }]}
          >
            {(['meal', 'training', 'general'] as CoachMode[]).map((modeOption) => {
              const modeConfig = MODE_CONFIG[modeOption];
              const isSelected = modeOption === currentMode;
              return (
                <TouchableOpacity
                  key={modeOption}
                  style={[
                    styles.modeOption,
                    isSelected && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]}
                  onPress={() => handleModeSwitch(modeOption)}
                >
                  <Ionicons name={modeConfig.icon as any} size={20} color={modeConfig.accentColor} />
                  <Text style={[styles.modeOptionText, { color: glassColors.text }]}>{modeConfig.title}</Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color={modeConfig.accentColor} />}
                </TouchableOpacity>
              );
            })}
          </BlurView>
        )}

        {/* Messages */}
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={renderEmptyState}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />

          {/* Typing indicator */}
          {isLoading && (
            <View style={styles.typingIndicator}>
              <View style={[styles.avatarBadge, { backgroundColor: `${config.accentColor}20` }]}>
                <Ionicons name={config.icon as any} size={14} color={config.accentColor} />
              </View>
              <View style={[styles.typingDots, { backgroundColor: glassColors.assistantBubble }]}>
                <ActivityIndicator size="small" color={config.accentColor} />
                <Text style={[styles.typingText, { color: glassColors.textSecondary }]}>Thinking...</Text>
              </View>
            </View>
          )}

          {/* Input Area with Liquid Glass */}
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.inputContainer, { paddingBottom: insets.bottom + 8, borderTopColor: glassColors.border }]}
          >
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: glassColors.text,
                  borderColor: glassColors.inputBorder,
                }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={config.placeholder}
                placeholderTextColor={glassColors.textSecondary}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={() => handleSendMessage()}
              />
              <Animated.View style={sendButtonAnimatedStyle}>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor: inputText.trim() ? config.accentColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                      shadowColor: inputText.trim() ? config.accentColor : 'transparent',
                      shadowOpacity: inputText.trim() ? 0.3 : 0,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 4 },
                    },
                  ]}
                  onPress={() => {
                    sendButtonScale.value = withSpring(0.9, GLASS_SPRING);
                    setTimeout(() => {
                      sendButtonScale.value = withSpring(1, GLASS_SPRING);
                    }, 100);
                    handleSendMessage();
                  }}
                  disabled={!inputText.trim() || isLoading}
                >
                  <Ionicons
                    name="arrow-up"
                    size={20}
                    color={inputText.trim() ? Colors.text : glassColors.textSecondary}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyList: {
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
  },
  avatarBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userMessageContent: {
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  assistantMessageContent: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 13,
  },
  inputContainer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Mode Switcher styles
  modeSwitcher: {
    position: 'absolute',
    top: 100, // Adjust based on header height
    left: '50%',
    marginLeft: -100,
    width: 200,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  modeOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  // Suggestion Chips styles
  suggestionsContainer: {
    marginTop: 24,
    width: '100%',
  },
  suggestionsLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default CoachChatModal;
