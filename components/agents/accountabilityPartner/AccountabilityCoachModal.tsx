/**
 * Accountability Coach Modal
 * Full-screen chat interface with AI daily review + optional HeyGen avatar.
 * Modeled on CoachChatModal pattern.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';
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
  FadeInLeft,
  FadeInRight,
  Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { avatarService, StreamingSession } from '../../../services/avatarService';
import { sendAccountabilityChat } from '../../../services/openaiService';
import {
  DailySnapshot,
  ChatMessage,
  getDailySummaryCache,
  saveDailySummaryCache,
} from '../../../services/accountabilityCoachService';
import { mediumImpact, lightImpact } from '../../../utils/haptics';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAuth } from '../../../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SENT_SPRING = { mass: 1, stiffness: 300, damping: 24 };
const RECEIVED_SPRING = { mass: 1, stiffness: 200, damping: 18 };
const GLASS_SPRING = { damping: 15, stiffness: 300, mass: 0.8 };

const GLASS_COLORS = {
  light: {
    background: LightColors.background,
    headerBg: 'rgba(255, 255, 255, 0.92)',
    inputBg: 'rgba(255, 255, 255, 0.92)',
    userBubble: 'rgba(0, 122, 255, 0.9)',
    assistantBubble: 'rgba(0, 0, 0, 0.05)',
    text: LightColors.text,
    textSecondary: LightColors.textSecondary,
    border: 'rgba(0, 0, 0, 0.08)',
    accent: 'rgba(99, 102, 241, 0.9)',
    card: 'rgba(255, 255, 255, 0.75)',
  },
  dark: {
    background: DarkColors.background,
    headerBg: 'rgba(44, 44, 46, 0.85)',
    inputBg: 'rgba(44, 44, 46, 0.85)',
    userBubble: 'rgba(10, 132, 255, 0.9)',
    assistantBubble: 'rgba(255, 255, 255, 0.08)',
    text: DarkColors.text,
    textSecondary: DarkColors.textSecondary,
    border: 'rgba(255, 255, 255, 0.1)',
    accent: 'rgba(99, 102, 241, 0.9)',
    card: 'rgba(255, 255, 255, 0.08)',
  },
};

// LiveAvatar HTML (same as CoachChatModal)
const getLiveAvatarHTML = (session: StreamingSession, token: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
    #avatar-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; }
    #avatar-video { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
    .loading { color: #6366F1; text-align: center; }
    .loading-spinner { width: 40px; height: 40px; border: 3px solid rgba(99,102,241,0.3); border-top-color: #6366F1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="avatar-container">
    <div class="loading" id="loading"><div class="loading-spinner"></div><p>Connecting to Coach...</p></div>
    <video id="avatar-video" autoplay playsinline style="display:none;"></video>
  </div>
  <script type="module">
    const roomUrl = ${JSON.stringify(session.url)};
    const roomToken = ${JSON.stringify(session.accessToken)};
    const loadingEl = document.getElementById('loading');
    const videoEl = document.getElementById('avatar-video');
    let room = null;
    function sendToRN(type, data = {}) { window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data })); }
    async function initLiveKit() {
      try {
        const { Room, RoomEvent, Track } = await import('https://cdn.jsdelivr.net/npm/livekit-client@2/+esm');
        room = new Room({ adaptiveStream: true, dynacast: true });
        room.on(RoomEvent.TrackSubscribed, (track, pub, part) => {
          if (track.kind === Track.Kind.Video) { loadingEl.style.display = 'none'; videoEl.style.display = 'block'; track.attach(videoEl); sendToRN('ready'); }
          if (track.kind === Track.Kind.Audio) { const a = track.attach(); document.body.appendChild(a); }
        });
        room.on(RoomEvent.Connected, () => sendToRN('connected'));
        room.on(RoomEvent.Disconnected, () => sendToRN('disconnected'));
        room.on(RoomEvent.DataReceived, (payload) => {
          try {
            const data = JSON.parse(new TextDecoder().decode(payload));
            if (data.event_type === 'avatar.talking_start' || data.type === 'talking_start') sendToRN('speaking', { speaking: true });
            else if (data.event_type === 'avatar.talking_end' || data.type === 'talking_end') sendToRN('speaking', { speaking: false });
          } catch(e) {}
        });
        await room.connect(roomUrl, roomToken);
      } catch (error) { sendToRN('error', { message: error.message }); }
    }
    window.speakText = async function(text) {
      if (!room || room.state !== 'connected') return;
      try {
        const data = new TextEncoder().encode(JSON.stringify({ event_type: 'avatar.speak_text', text }));
        await room.localParticipant.publishData(data, { topic: 'agent-control' });
        sendToRN('speaking', { speaking: true });
      } catch(e) {}
    };
    window.stopAvatar = async function() { if (room) { try { await room.disconnect(); } catch(e) {} } };
    initLiveKit();
  </script>
</body>
</html>`;

function MixedFontText({ text, style }: { text: string; style?: any }) {
  const segments = text.split(/(\d[\d,.*%+-]*)/g).filter(Boolean);
  return (
    <Text style={style}>
      {segments.map((segment, i) => {
        const isNumeric = /^\d/.test(segment);
        return (
          <Text key={i} style={{ fontFamily: isNumeric ? Fonts.numericRegular : Fonts.regular }}>
            {segment}
          </Text>
        );
      })}
    </Text>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  snapshot: DailySnapshot;
  initialSummary: string;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
}

export default function AccountabilityCoachModal({
  visible,
  onClose,
  snapshot,
  initialSummary,
  messages,
  onMessagesChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const { user, isAuthenticated } = useAuth();
  const isDark = settings.themeMode === 'dark';
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;
  const flatListRef = useRef<FlatList>(null);
  const webViewRef = useRef<WebView>(null);

  const userId = isAuthenticated && user?.id ? user.id : 'guest';

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Avatar state
  const [avatarSession, setAvatarSession] = useState<StreamingSession | null>(null);
  const [avatarToken, setAvatarToken] = useState('');
  const [avatarReady, setAvatarReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const showAvatar = settings.liveAvatar && avatarSession && !avatarError;

  const sendButtonScale = useSharedValue(1);
  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  // Track whether the avatar has spoken the initial summary
  const hasSpokenSummaryRef = useRef(false);

  // Reset spoken flag when modal closes
  useEffect(() => {
    if (!visible) {
      hasSpokenSummaryRef.current = false;
    }
  }, [visible]);

  // Inject initial summary as first message if messages are empty
  useEffect(() => {
    if (visible && initialSummary && messages.length === 0) {
      const summaryMessage: ChatMessage = {
        id: `msg_${Date.now()}_summary`,
        role: 'assistant',
        content: initialSummary,
        timestamp: new Date().toISOString(),
      };
      const updated = [summaryMessage];
      onMessagesChange(updated);
      saveDailySummaryCache(initialSummary, updated);
    }
  }, [visible, initialSummary]);

  // When avatar becomes ready, speak the initial summary
  useEffect(() => {
    if (avatarReady && visible && initialSummary && !hasSpokenSummaryRef.current) {
      hasSpokenSummaryRef.current = true;
      // Small delay to let avatar fully stabilize after 'ready' event
      setTimeout(() => {
        speakText(initialSummary);
      }, 500);
    }
  }, [avatarReady, visible, initialSummary]);

  // Avatar initialization
  useEffect(() => {
    if (visible && settings.liveAvatar) {
      initAvatarSession();
    }
    return () => {
      if (visible) cleanupAvatar();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) cleanupAvatar();
  }, [visible]);

  // Scroll to end when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages.length]);

  const initAvatarSession = async () => {
    try {
      const response = await avatarService.createChatSession(userId, 'general');
      if (response.ok && response.streamingAvailable && response.session && response.token) {
        setAvatarSession(response.session);
        setAvatarToken(response.token);
        setAvatarError(false);
      } else {
        setAvatarSession(null);
      }
    } catch {
      setAvatarError(true);
    }
  };

  const cleanupAvatar = () => {
    if (webViewRef.current && avatarSession) {
      webViewRef.current.injectJavaScript('window.stopAvatar && window.stopAvatar(); true;');
    }
    if (avatarToken) {
      avatarService.stopChatSession(avatarToken).catch(() => {});
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
      switch (data.type) {
        case 'ready': setAvatarReady(true); break;
        case 'speaking': setIsSpeaking(data.speaking); break;
        case 'disconnected': setAvatarReady(false); break;
        case 'error': setAvatarError(true); break;
      }
    } catch {}
  };

  const speakText = (text: string) => {
    if (!webViewRef.current || !avatarSession || !avatarReady) return;
    const escaped = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, ' ');
    webViewRef.current.injectJavaScript(`window.speakText && window.speakText("${escaped}"); true;`);
  };

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    lightImpact();
    setInputText('');
    Keyboard.dismiss();

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    const updated = [...messages, userMsg];
    onMessagesChange(updated);

    setIsLoading(true);
    try {
      const response = await sendAccountabilityChat(text, snapshot, updated, user?.firstName || undefined);
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      const withResponse = [...updated, assistantMsg];
      onMessagesChange(withResponse);
      saveDailySummaryCache(initialSummary, withResponse);
      mediumImpact();

      if (showAvatar && avatarReady) {
        speakText(response);
      }
    } catch (error) {
      console.error('[AccountabilityCoach] Chat error:', error);
      const errMsg: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date().toISOString(),
      };
      onMessagesChange([...updated, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, messages, snapshot, initialSummary, showAvatar, avatarReady]);

  const handleClose = () => {
    cleanupAvatar();
    onClose();
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const entering = isUser
      ? FadeInRight.springify().mass(SENT_SPRING.mass).stiffness(SENT_SPRING.stiffness).damping(SENT_SPRING.damping)
      : FadeInLeft.springify().mass(RECEIVED_SPRING.mass).stiffness(RECEIVED_SPRING.stiffness).damping(RECEIVED_SPRING.damping);

    return (
      <Animated.View
        entering={entering}
        layout={Layout.springify().damping(20).stiffness(200)}
        style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}
      >
        {!isUser && (
          <View style={[styles.avatarBadge, { backgroundColor: 'rgba(99,102,241,0.2)' }]}>
            <Ionicons name="sparkles" size={14} color="#6366F1" />
          </View>
        )}
        <View style={[
          styles.messageContent,
          isUser
            ? [styles.userMessageContent, { backgroundColor: glassColors.userBubble }]
            : [styles.assistantMessageContent, { backgroundColor: glassColors.assistantBubble }],
        ]}>
          <MixedFontText
            text={item.content}
            style={[styles.messageText, { color: isUser ? '#ffffff' : glassColors.text }]}
          />
        </View>
      </Animated.View>
    );
  };

  const QUICK_QUESTIONS = [
    'What should I focus on tomorrow?',
    'How can I improve my consistency?',
    'Am I eating enough protein?',
    'What are my biggest wins this week?',
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: glassColors.background }]} />

        {/* Header */}
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="chevron-down" size={24} color={glassColors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="sparkles" size={18} color="#6366F1" />
            <Text style={[styles.headerTitle, { color: glassColors.text }]}>AI Coach</Text>
          </View>
          <View style={styles.headerButton} />
        </BlurView>

        {/* Avatar */}
        {showAvatar && (
          <View style={styles.avatarSection}>
            <View style={styles.webViewContainer}>
              <WebView
                ref={webViewRef}
                source={{ html: getLiveAvatarHTML(avatarSession!, avatarToken) }}
                style={styles.webView}
                onMessage={handleWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback
                scrollEnabled={false}
                originWhitelist={['*']}
                mixedContentMode="always"
              />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: glassColors.card }]}>
              <View style={[
                styles.statusDot,
                { backgroundColor: glassColors.textSecondary },
                isSpeaking && { backgroundColor: '#6366F1' },
                avatarReady && !isSpeaking && { backgroundColor: Colors.success },
              ]} />
              <Text style={[styles.statusText, { color: glassColors.text }]}>
                {!avatarReady ? 'Connecting...' : isSpeaking ? 'Speaking...' : 'Ready'}
              </Text>
            </View>
          </View>
        )}

        {/* Chat Messages */}
        <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.messagesList, messages.length === 0 && styles.emptyList]}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={[styles.emptyText, { color: glassColors.textSecondary }]}>
                  Generating your daily review...
                </Text>
              </View>
            }
            ListFooterComponent={
              messages.length > 0 && messages.length === 1 ? (
                <View style={styles.quickQuestions}>
                  <Text style={[styles.quickLabel, { color: glassColors.textSecondary }]}>Ask a follow-up:</Text>
                  <View style={styles.quickGrid}>
                    {QUICK_QUESTIONS.map((q, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.quickChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
                        onPress={() => { lightImpact(); setInputText(q); }}
                      >
                        <Text style={[styles.quickText, { color: glassColors.text }]}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null
            }
            onContentSizeChange={() => {
              if (messages.length > 0) flatListRef.current?.scrollToEnd({ animated: false });
            }}
          />

          {/* Typing indicator */}
          {isLoading && (
            <Animated.View
              entering={FadeInLeft.springify().mass(RECEIVED_SPRING.mass).stiffness(RECEIVED_SPRING.stiffness).damping(RECEIVED_SPRING.damping)}
              style={styles.typingIndicator}
            >
              <View style={[styles.avatarBadge, { backgroundColor: 'rgba(99,102,241,0.2)' }]}>
                <Ionicons name="sparkles" size={14} color="#6366F1" />
              </View>
              <View style={[styles.typingDots, { backgroundColor: glassColors.assistantBubble }]}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={[styles.typingText, { color: glassColors.textSecondary }]}>Thinking...</Text>
              </View>
            </Animated.View>
          )}

          {/* Input */}
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}
          >
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: glassColors.text,
                }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask your coach anything..."
                placeholderTextColor={glassColors.textSecondary}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <Animated.View style={sendButtonAnimatedStyle}>
                <TouchableOpacity
                  style={[styles.sendButton, {
                    backgroundColor: inputText.trim() ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                  }]}
                  onPress={() => {
                    sendButtonScale.value = withSpring(0.9, GLASS_SPRING);
                    setTimeout(() => { sendButtonScale.value = withSpring(1, GLASS_SPRING); }, 100);
                    handleSend();
                  }}
                  disabled={!inputText.trim() || isLoading}
                >
                  <Ionicons name="arrow-up" size={20} color={inputText.trim() ? '#ffffff' : glassColors.textSecondary} />
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 24 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold },
  content: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  webViewContainer: {
    width: SCREEN_WIDTH - 32,
    height: 200,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  webView: { flex: 1, backgroundColor: 'transparent' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontFamily: Fonts.medium },
  messagesList: { padding: 16, flexGrow: 1 },
  emptyList: { justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 16, fontSize: 14, fontFamily: Fonts.medium },
  messageBubble: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  userBubble: { justifyContent: 'flex-end' },
  assistantBubble: { justifyContent: 'flex-start' },
  avatarBadge: { width: 28, height: 28, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  messageContent: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
  userMessageContent: { borderBottomRightRadius: 4, marginLeft: 'auto' },
  assistantMessageContent: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, fontFamily: Fonts.regular, lineHeight: 21 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
  typingText: { fontSize: 13, fontFamily: Fonts.regular },
  inputContainer: { paddingTop: 12, paddingHorizontal: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontFamily: Fonts.regular,
    maxHeight: 100,
  },
  sendButton: { width: 36, height: 36, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  quickQuestions: { paddingTop: 16, paddingHorizontal: 8 },
  quickLabel: { fontSize: 13, fontFamily: Fonts.medium, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  quickText: { fontSize: 13, fontFamily: Fonts.medium },
});
