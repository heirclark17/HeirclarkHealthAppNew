/**
 * Coach Chat Modal Component
 * Full-screen chat interface for AI coach conversations
 * With optional HeyGen LiveAvatar streaming at the top
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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { aiService } from '../../../services/aiService';
import { avatarService, StreamingSession } from '../../../services/avatarService';
import { CoachMode, CoachMessage, CoachContext, CoachResponse } from '../../../types/ai';
import { mediumImpact, lightImpact } from '../../../utils/haptics';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAuth } from '../../../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

// iOS 26 Liquid Glass colors
const GLASS_COLORS = {
  light: {
    background: Colors.backgroundSecondary,
    headerBg: 'rgba(255, 255, 255, 0.85)',
    inputBg: 'rgba(255, 255, 255, 0.85)',
    userBubble: 'rgba(0, 122, 255, 0.9)',
    assistantBubble: 'rgba(255, 255, 255, 0.75)',
    text: Colors.text,
    textSecondary: 'rgba(60, 60, 67, 0.6)',
    border: 'rgba(0, 0, 0, 0.08)',
    inputBorder: 'rgba(0, 0, 0, 0.12)',
    accent: 'rgba(78, 205, 196, 0.9)',
    card: 'rgba(255, 255, 255, 0.75)',
    cardBorder: 'rgba(255, 255, 255, 0.5)',
  },
  dark: {
    background: Colors.background,
    headerBg: 'rgba(44, 44, 46, 0.85)',
    inputBg: 'rgba(44, 44, 46, 0.85)',
    userBubble: 'rgba(10, 132, 255, 0.9)',
    assistantBubble: 'rgba(255, 255, 255, 0.08)',
    text: Colors.text,
    textSecondary: 'rgba(235, 235, 245, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    accent: 'rgba(78, 205, 196, 0.9)',
    card: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
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
    accentColor: '#6366F1',
    placeholder: 'Ask about workouts, form, exercises...',
  },
  general: {
    title: 'AI Coach',
    icon: 'fitness',
    accentColor: '#6366F1',
    placeholder: 'Ask anything about health & fitness...',
  },
};

// HTML template for LiveAvatar streaming in WebView (same as CoachingModal)
const getLiveAvatarHTML = (session: StreamingSession, token: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    #avatar-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    #avatar-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px;
    }
    .loading {
      color: #4ECDC4;
      text-align: center;
    }
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(78, 205, 196, 0.3);
      border-top-color: #4ECDC4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .error {
      color: #FF6B6B;
      text-align: center;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="avatar-container">
    <div class="loading" id="loading">
      <div class="loading-spinner"></div>
      <p>Connecting to your AI coach...</p>
    </div>
    <video id="avatar-video" autoplay playsinline style="display:none;"></video>
  </div>

  <script type="module">
    const roomUrl = ${JSON.stringify(session.url)};
    const roomToken = ${JSON.stringify(session.accessToken)};

    const loadingEl = document.getElementById('loading');
    const videoEl = document.getElementById('avatar-video');

    let room = null;

    function sendToRN(type, data = {}) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
    }

    function showError(message) {
      loadingEl.innerHTML = '<div class="error">' + message + '</div>';
      sendToRN('error', { message });
    }

    async function initLiveKit() {
      try {
        const { Room, RoomEvent, Track } = await import('https://cdn.jsdelivr.net/npm/livekit-client@2/+esm');

        room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === Track.Kind.Video) {
            loadingEl.style.display = 'none';
            videoEl.style.display = 'block';
            track.attach(videoEl);
            sendToRN('ready');
          }
          if (track.kind === Track.Kind.Audio) {
            const audioEl = track.attach();
            document.body.appendChild(audioEl);
          }
        });

        room.on(RoomEvent.Connected, () => {
          sendToRN('connected');
        });

        room.on(RoomEvent.Disconnected, () => {
          sendToRN('disconnected');
        });

        room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
          try {
            const data = JSON.parse(new TextDecoder().decode(payload));
            if (data.event_type === 'avatar.talking_start' || data.type === 'talking_start') {
              sendToRN('speaking', { speaking: true });
            } else if (data.event_type === 'avatar.talking_end' || data.type === 'talking_end') {
              sendToRN('speaking', { speaking: false });
            }
          } catch (e) {
            console.log('Data parse error:', e);
          }
        });

        await room.connect(roomUrl, roomToken);
      } catch (error) {
        console.error('LiveKit init error:', error);
        showError('Failed to connect: ' + error.message);
      }
    }

    window.speakText = async function(text) {
      if (!room || room.state !== 'connected') {
        console.log('Room not connected, cannot speak');
        return;
      }
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({
          event_type: 'avatar.speak_text',
          text: text
        }));
        await room.localParticipant.publishData(data, { topic: 'agent-control' });
        sendToRN('speaking', { speaking: true });
      } catch (e) {
        console.error('Speak error:', e);
      }
    };

    window.stopAvatar = async function() {
      if (room) {
        try {
          await room.disconnect();
        } catch (e) {
          console.log('Disconnect error:', e);
        }
      }
    };

    initLiveKit();
  </script>
</body>
</html>
`;

export function CoachChatModal({
  visible,
  onClose,
  mode: initialMode,
  initialMessage,
  context,
}: CoachChatModalProps) {
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const { user, isAuthenticated } = useAuth();
  const isDark = settings.themeMode === 'dark';
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;
  const flatListRef = useRef<FlatList>(null);
  const webViewRef = useRef<WebView>(null);

  const userId = isAuthenticated && user?.id ? user.id : 'guest';

  const [currentMode, setCurrentMode] = useState<CoachMode>(initialMode);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [showModeSwitcher, setShowModeSwitcher] = useState(false);

  // Avatar state
  const [avatarSession, setAvatarSession] = useState<StreamingSession | null>(null);
  const [avatarToken, setAvatarToken] = useState<string>('');
  const [avatarReady, setAvatarReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

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

  // Whether to show the avatar section
  const showAvatar = settings.liveAvatar && avatarSession && !avatarError;

  // Initialize avatar session when modal opens
  useEffect(() => {
    if (visible && settings.liveAvatar) {
      initAvatarSession();
    }

    return () => {
      if (visible) {
        cleanupAvatar();
      }
    };
  }, [visible]);

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
      cleanupAvatar();
    }
  }, [visible]);

  const initAvatarSession = async () => {
    try {
      console.log('[CoachChatModal] Initializing avatar session...');
      const response = await avatarService.createChatSession(userId, currentMode);

      if (response.ok && response.streamingAvailable && response.session && response.token) {
        console.log('[CoachChatModal] Avatar session created:', response.session.sessionId);
        setAvatarSession(response.session);
        setAvatarToken(response.token);
        setAvatarError(false);
      } else {
        console.log('[CoachChatModal] Avatar not available, text-only mode');
        setAvatarSession(null);
        setAvatarToken('');
      }
    } catch (err) {
      console.error('[CoachChatModal] Avatar session error:', err);
      setAvatarError(true);
    }
  };

  const cleanupAvatar = () => {
    if (webViewRef.current && avatarSession) {
      webViewRef.current.injectJavaScript('window.stopAvatar && window.stopAvatar(); true;');
    }
    if (avatarToken) {
      avatarService.stopChatSession(avatarToken).catch(console.error);
    }
    setAvatarSession(null);
    setAvatarToken('');
    setAvatarReady(false);
    setIsSpeaking(false);
    setAvatarError(false);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[CoachChatModal] WebView message:', data.type);

      switch (data.type) {
        case 'connected':
          break;
        case 'ready':
          setAvatarReady(true);
          break;
        case 'speaking':
          setIsSpeaking(data.speaking);
          break;
        case 'disconnected':
          setAvatarReady(false);
          break;
        case 'error':
          console.error('[CoachChatModal] WebView error:', data.message);
          setAvatarError(true);
          break;
      }
    } catch (e) {
      console.error('[CoachChatModal] WebView message parse error:', e);
    }
  };

  const speakText = (text: string) => {
    if (!webViewRef.current || !avatarSession || !avatarReady) return;
    const escapedText = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, ' ');
    webViewRef.current.injectJavaScript(`window.speakText && window.speakText("${escapedText}"); true;`);
  };

  const loadHistory = async () => {
    try {
      const history = await aiService.getCoachHistory(currentMode);
      setMessages(history);
      setHasLoadedHistory(true);

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

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Get AI response
    setIsLoading(true);
    try {
      const coachContext: CoachContext = {
        mode: currentMode,
        conversationHistory: messages.slice(-10),
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

        // Have avatar speak the response
        if (showAvatar && avatarReady) {
          speakText(response.message);
        }
      } else {
        const errorMessage: CoachMessage = {
          id: `msg_${Date.now()}_error`,
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          mode: currentMode,
        };
        setMessages(prev => [...prev, errorMessage]);
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending coach message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, messages, currentMode, context, showAvatar, avatarReady]);

  const handleClearHistory = useCallback(async () => {
    await aiService.clearCoachHistory(currentMode);
    setMessages([]);
    mediumImpact();
  }, [currentMode]);

  const handleClose = () => {
    cleanupAvatar();
    onClose();
  };

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
      onRequestClose={handleClose}
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
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
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

        {/* Avatar Video Section */}
        {showAvatar && (
          <View style={styles.avatarSection}>
            <View style={[styles.webViewContainer, { borderColor: glassColors.cardBorder }]}>
              <WebView
                ref={webViewRef}
                source={{ html: getLiveAvatarHTML(avatarSession!, avatarToken) }}
                style={styles.webView}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                scrollEnabled={false}
                originWhitelist={['*']}
                mixedContentMode="always"
              />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: glassColors.card, borderColor: glassColors.cardBorder }]}>
              <View style={[styles.statusDot, { backgroundColor: glassColors.textSecondary }, isSpeaking && { backgroundColor: glassColors.accent }, avatarReady && !isSpeaking && { backgroundColor: Colors.success }]} />
              <Text style={[styles.statusText, { color: glassColors.text }]}>
                {!avatarReady ? 'Connecting...' : isSpeaking ? 'Speaking...' : 'Ready'}
              </Text>
            </View>
          </View>
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
  // Avatar section styles
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  webViewContainer: {
    width: SCREEN_WIDTH - 32,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Message styles
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
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
    top: 100,
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
    paddingHorizontal: 16,
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
