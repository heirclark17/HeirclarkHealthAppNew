import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { avatarService, StreamingSession } from '../../services/avatarService';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { DayPlan } from '../../types/mealPlan';

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
    card: 'rgba(255, 255, 255, 0.75)',
    cardBorder: 'rgba(255, 255, 255, 0.5)',
    header: 'rgba(255, 255, 255, 0.85)',
    text: Colors.text,
    textMuted: 'rgba(60, 60, 67, 0.6)',
    textSecondary: 'rgba(60, 60, 67, 0.4)',
    border: 'rgba(0, 0, 0, 0.08)',
    accent: 'rgba(78, 205, 196, 0.9)',
    accentBg: 'rgba(78, 205, 196, 0.15)',
    buttonBg: 'rgba(255, 255, 255, 0.6)',
    buttonBorder: 'rgba(255, 255, 255, 0.8)',
  },
  dark: {
    background: Colors.background,
    card: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    header: 'rgba(44, 44, 46, 0.85)',
    text: Colors.text,
    textMuted: 'rgba(235, 235, 245, 0.6)',
    textSecondary: 'rgba(235, 235, 245, 0.4)',
    border: 'rgba(255, 255, 255, 0.1)',
    accent: 'rgba(78, 205, 196, 0.9)',
    accentBg: 'rgba(78, 205, 196, 0.1)',
    buttonBg: 'rgba(255, 255, 255, 0.1)',
    buttonBorder: 'rgba(255, 255, 255, 0.15)',
  },
};

interface MealPlanCoachingModalProps {
  visible: boolean;
  onClose: () => void;
  weeklyPlan: DayPlan[];
  selectedDayIndex: number;
  userGoals: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
  };
  preferences?: {
    dietStyle?: string;
    allergies?: string[];
  };
  userId?: string;
}

type ModalState = 'loading' | 'ready' | 'speaking' | 'finished' | 'error';

// HTML template for LiveAvatar streaming in WebView
const getLiveAvatarHTML = (session: StreamingSession, script: string, token: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: Colors.cardBackground;
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
    .status {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.7);
      color: #4ECDC4;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div id="avatar-container">
    <div class="loading" id="loading">
      <div class="loading-spinner"></div>
      <p>Connecting to your nutrition coach...</p>
    </div>
    <video id="avatar-video" autoplay playsinline style="display:none;"></video>
    <div class="status" id="status" style="display:none;">Connecting...</div>
  </div>

  <script type="module">
    const sessionToken = ${JSON.stringify(token)};
    const roomUrl = ${JSON.stringify(session.url)};
    const roomToken = ${JSON.stringify(session.accessToken)};
    const script = ${JSON.stringify(script)};

    const loadingEl = document.getElementById('loading');
    const videoEl = document.getElementById('avatar-video');
    const statusEl = document.getElementById('status');

    let room = null;

    function updateStatus(text) {
      statusEl.textContent = text;
      statusEl.style.display = 'block';
    }

    function sendToRN(type, data = {}) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
    }

    function showError(message) {
      loadingEl.innerHTML = '<div class="error">' + message + '</div>';
      sendToRN('error', { message });
    }

    async function initLiveKit() {
      try {
        updateStatus('Loading LiveKit...');
        const { Room, RoomEvent, Track } = await import('https://cdn.jsdelivr.net/npm/livekit-client@2/+esm');

        updateStatus('Connecting to room...');

        room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === Track.Kind.Video) {
            loadingEl.style.display = 'none';
            videoEl.style.display = 'block';
            track.attach(videoEl);
            updateStatus('Connected');
            sendToRN('ready');
          }
          if (track.kind === Track.Kind.Audio) {
            const audioEl = track.attach();
            document.body.appendChild(audioEl);
          }
        });

        room.on(RoomEvent.Connected, () => {
          updateStatus('Connected - waiting for avatar...');
          sendToRN('connected');
        });

        room.on(RoomEvent.Disconnected, () => {
          updateStatus('Disconnected');
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
          } catch (e) {}
        });

        await room.connect(roomUrl, roomToken);
      } catch (error) {
        showError('Failed to connect: ' + error.message);
      }
    }

    window.speakText = async function(text) {
      if (!room || room.state !== 'connected') return;
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({
          event_type: 'avatar.speak_text',
          text: text
        }));
        await room.localParticipant.publishData(data, { topic: 'agent-control' });
        sendToRN('speaking', { speaking: true });
      } catch (e) {}
    };

    window.stopAvatar = async function() {
      if (room) {
        try { await room.disconnect(); } catch (e) {}
      }
    };

    initLiveKit();
  </script>
</body>
</html>
`;

export function MealPlanCoachingModal({
  visible,
  onClose,
  weeklyPlan,
  selectedDayIndex,
  userGoals,
  preferences,
  userId = 'guest',
}: MealPlanCoachingModalProps) {
  const { settings } = useSettings();
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<ModalState>('loading');
  const [script, setScript] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [session, setSession] = useState<StreamingSession | null>(null);
  const [token, setToken] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(0);

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);

  // Extract user's first name for personalized coaching
  const userName = isAuthenticated && user?.firstName ? user.firstName : null;
  const isDark = settings.themeMode === 'dark';
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

  // Button animation
  const playButtonScale = useSharedValue(1);
  const controlButtonScale = useSharedValue(1);

  const playButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playButtonScale.value }],
  }));

  const controlButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: controlButtonScale.value }],
  }));

  const webViewRef = useRef<WebView>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const paragraphs = script.split('\n\n').filter(p => p.trim());
  const speakingRef = useRef(false);

  const pulseScale = useSharedValue(1);

  // Get current day info for header
  const currentDay = weeklyPlan?.[selectedDayIndex];
  const dayName = currentDay?.dayName || 'Today';

  useEffect(() => {
    if (visible && weeklyPlan && weeklyPlan.length > 0) {
      initializeCoaching();
    }
    return () => cleanup();
  }, [visible, weeklyPlan, selectedDayIndex]);

  useEffect(() => {
    if (isSpeaking) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [isSpeaking]);

  const cleanup = () => {
    speakingRef.current = false;
    setIsSpeaking(false);

    if (webViewRef.current && session) {
      webViewRef.current.injectJavaScript('window.stopAvatar && window.stopAvatar(); true;');
    }

    if (token) {
      avatarService.stopSession(token).catch(console.error);
    }

    setSession(null);
    setToken('');
  };

  const initializeCoaching = async () => {
    setState('loading');
    setError('');
    setScript('');
    setCurrentParagraph(0);
    setSession(null);
    setToken('');

    if (!weeklyPlan || weeklyPlan.length === 0) {
      setError('No meal plan data available');
      setState('error');
      return;
    }

    try {
      console.log('[MealPlanCoachingModal] Fetching coaching data...');
      const response = await avatarService.getMealPlanCoaching({
        userId,
        userName,
        weeklyPlan,
        selectedDayIndex,
        userGoals,
        preferences,
      });

      if (!response.ok || !response.script) {
        setError(response.error || 'Failed to load coaching');
        setState('error');
        return;
      }

      setScript(response.script);

      if (response.streamingAvailable && response.session && response.token) {
        console.log('[MealPlanCoachingModal] Streaming available');
        setSession(response.session);
        setToken(response.token);
        setState('ready');
      } else {
        console.log('[MealPlanCoachingModal] Script only mode');
        setState('finished');
      }
    } catch (err) {
      console.error('[MealPlanCoachingModal] Init error:', err);
      setError('Unable to load coaching. Please try again.');
      setState('error');
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'ready':
          setState('ready');
          if (settings.autoplayCoach) {
            setTimeout(() => startSpeaking(), 3000);
          }
          break;
        case 'speaking':
          setIsSpeaking(data.speaking);
          break;
        case 'disconnected':
          setState('finished');
          break;
        case 'error':
          setError(data.message || 'Avatar connection failed');
          setState('error');
          break;
      }
    } catch (e) {}
  };

  const startSpeaking = async () => {
    if (!script) return;

    speakingRef.current = true;
    setState('speaking');
    setIsSpeaking(true);
    setCurrentParagraph(0);

    const fullScript = script.replace(/\n\n/g, ' ').replace(/\n/g, ' ').trim();

    if (webViewRef.current && session) {
      const escapedText = fullScript.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
      webViewRef.current.injectJavaScript(`window.speakText && window.speakText("${escapedText}"); true;`);
    }

    const estimatedDuration = Math.max(10000, fullScript.length * 65);
    await new Promise(resolve => setTimeout(resolve, estimatedDuration));

    setIsSpeaking(false);
    speakingRef.current = false;
    setState('finished');
  };

  const handlePlayPause = async () => {
    await mediumImpact();
    playButtonScale.value = withSpring(0.9, GLASS_SPRING);
    setTimeout(() => {
      playButtonScale.value = withSpring(1, GLASS_SPRING);
    }, 100);

    if (isSpeaking) {
      speakingRef.current = false;
      setIsSpeaking(false);
    } else {
      startSpeaking();
    }
  };

  const handleReplay = async () => {
    await lightImpact();
    controlButtonScale.value = withSpring(0.9, GLASS_SPRING);
    setTimeout(() => {
      controlButtonScale.value = withSpring(1, GLASS_SPRING);
    }, 100);

    speakingRef.current = false;
    setCurrentParagraph(0);
    await new Promise(resolve => setTimeout(resolve, 300));
    startSpeaking();
  };

  const handleClose = async () => {
    await lightImpact();
    controlButtonScale.value = withSpring(0.9, GLASS_SPRING);
    setTimeout(() => {
      controlButtonScale.value = withSpring(1, GLASS_SPRING);
    }, 100);
    cleanup();
    onClose();
  };

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const renderContent = () => {
    if (state === 'loading') {
      return (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingIndicator, { backgroundColor: glassColors.accentBg }]}>
            <ActivityIndicator size="large" color={glassColors.accent} />
          </View>
          <Text style={[styles.loadingText, { color: glassColors.text }]}>Analyzing your meal plan...</Text>
          <Text style={[styles.loadingSubtext, { color: glassColors.textMuted }]}>Your AI coach is reviewing {dayName}'s meals</Text>
        </View>
      );
    }

    if (state === 'error') {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={[styles.errorText, { color: glassColors.textSecondary }]}>{error}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: glassColors.accent }]} onPress={initializeCoaching}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {/* Avatar Section */}
        {settings.liveAvatar && (
          <Animated.View style={[styles.avatarSection, pulseAnimatedStyle]}>
            {session && token ? (
              <View style={[styles.webViewContainer, { borderColor: glassColors.cardBorder }]}>
                <WebView
                  ref={webViewRef}
                  source={{ html: getLiveAvatarHTML(session, script, token) }}
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
            ) : (
              <View style={[styles.avatarFallback, { borderColor: glassColors.cardBorder }]}>
                <View style={[styles.avatarCircle, { backgroundColor: glassColors.accentBg, borderColor: glassColors.accent }]}>
                  <Ionicons name="nutrition" size={48} color={glassColors.accent} />
                </View>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: glassColors.card, borderColor: glassColors.cardBorder }]}>
              <View style={[styles.statusDot, { backgroundColor: glassColors.textMuted }, isSpeaking && { backgroundColor: glassColors.accent }]} />
              <Text style={[styles.statusText, { color: glassColors.text }]}>
                {state === 'loading' ? 'Loading...' :
                 state === 'ready' ? 'Ready' :
                 isSpeaking ? 'Speaking' : 'Completed'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Text-only header when avatar is disabled */}
        {!settings.liveAvatar && (
          <View style={styles.textOnlyHeader}>
            <View style={[styles.coachIconSmall, { backgroundColor: glassColors.accentBg }]}>
              <Ionicons name="nutrition" size={24} color={glassColors.accent} />
            </View>
            <Text style={[styles.textOnlyTitle, { color: glassColors.text }]}>{dayName}'s Meal Coaching</Text>
            <View style={[styles.statusBadge, { backgroundColor: glassColors.card, borderColor: glassColors.cardBorder }]}>
              <View style={[styles.statusDot, { backgroundColor: glassColors.textMuted }, isSpeaking && { backgroundColor: glassColors.accent }]} />
              <Text style={[styles.statusText, { color: glassColors.text }]}>
                {state === 'ready' ? 'Ready' : isSpeaking ? 'Reading...' : 'Complete'}
              </Text>
            </View>
          </View>
        )}

        {/* Script Display */}
        <View style={styles.scriptSection}>
          <ScrollView ref={scrollViewRef} style={styles.scriptScroll} showsVerticalScrollIndicator={false}>
            {paragraphs.map((paragraph, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.delay(index * 100)}
                style={[
                  styles.paragraphContainer,
                  { backgroundColor: glassColors.card, borderColor: glassColors.cardBorder },
                  index === currentParagraph && isSpeaking && [styles.paragraphActive, { backgroundColor: glassColors.accentBg, borderLeftColor: glassColors.accent }],
                ]}
              >
                <Text
                  style={[
                    styles.paragraphText,
                    { color: glassColors.textSecondary },
                    index === currentParagraph && isSpeaking && { color: glassColors.text },
                    index < currentParagraph && { color: glassColors.textMuted },
                  ]}
                >
                  {paragraph}
                </Text>
              </Animated.View>
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>
        </View>

        {/* Controls with Glass Effect */}
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.controlsSection, { borderTopColor: glassColors.border }]}
        >
          <Animated.View style={controlButtonAnimatedStyle}>
            <Pressable
              style={[
                styles.controlButton,
                { backgroundColor: glassColors.buttonBg, borderColor: glassColors.buttonBorder },
              ]}
              onPress={handleReplay}
            >
              <Ionicons name="refresh" size={24} color={glassColors.text} />
            </Pressable>
          </Animated.View>

          <Animated.View style={playButtonAnimatedStyle}>
            <Pressable
              style={[styles.playButton, { backgroundColor: glassColors.accent, shadowColor: glassColors.accent }]}
              onPress={handlePlayPause}
            >
              <Ionicons name={isSpeaking ? 'pause' : 'play'} size={32} color={Colors.background} />
            </Pressable>
          </Animated.View>

          <Animated.View style={controlButtonAnimatedStyle}>
            <Pressable
              style={[
                styles.controlButton,
                { backgroundColor: glassColors.buttonBg, borderColor: glassColors.buttonBorder },
              ]}
              onPress={handleClose}
            >
              <Ionicons name="checkmark" size={24} color={glassColors.text} />
            </Pressable>
          </Animated.View>
        </BlurView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: glassColors.background }]}>
        {/* Header with Glass Effect */}
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.header, { borderBottomColor: glassColors.border }]}
        >
          <Pressable
            style={[styles.closeButton, { backgroundColor: glassColors.buttonBg, borderColor: glassColors.buttonBorder }]}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={glassColors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: glassColors.text }]}>MEAL PLAN COACHING</Text>
          <View style={styles.headerSpacer} />
        </BlurView>

        {renderContent()}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    marginTop: 24,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
    color: Colors.text,
  },
  contentContainer: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  webViewContainer: {
    width: SCREEN_WIDTH - 48,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    borderWidth: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH - 48,
    height: 220,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  scriptSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scriptScroll: {
    flex: 1,
  },
  paragraphContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  paragraphActive: {
    borderLeftWidth: 3,
  },
  paragraphText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 24,
  },
  controlsSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    // Glow shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  textOnlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  coachIconSmall: {
    width: 44,
    height: 44,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOnlyTitle: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    flex: 1,
  },
});

export default MealPlanCoachingModal;
