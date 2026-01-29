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
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { avatarService, GoalData, UserInputs, StreamingSession } from '../../services/avatarService';
import { lightImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CoachingModalProps {
  visible: boolean;
  onClose: () => void;
  goalData: GoalData | null;
  userInputs: UserInputs;
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
      <p>Connecting to your AI coach...</p>
    </div>
    <video id="avatar-video" autoplay playsinline style="display:none;"></video>
    <div class="status" id="status" style="display:none;">Connecting...</div>
  </div>

  <script type="module">
    // Session data from React Native
    const sessionToken = ${JSON.stringify(token)};
    const roomUrl = ${JSON.stringify(session.url)};
    const roomToken = ${JSON.stringify(session.accessToken)};
    const script = ${JSON.stringify(script)};

    const loadingEl = document.getElementById('loading');
    const videoEl = document.getElementById('avatar-video');
    const statusEl = document.getElementById('status');

    let room = null;
    let dataChannel = null;

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

        // Dynamically import LiveKit client
        const { Room, RoomEvent, Track } = await import('https://cdn.jsdelivr.net/npm/livekit-client@2/+esm');

        updateStatus('Connecting to room...');

        room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        // Handle track subscribed (video from avatar)
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          console.log('Track subscribed:', track.kind);
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
          console.log('Connected to room');
          updateStatus('Connected - waiting for avatar...');
          sendToRN('connected');
        });

        room.on(RoomEvent.Disconnected, () => {
          console.log('Disconnected from room');
          updateStatus('Disconnected');
          sendToRN('disconnected');
        });

        room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
          try {
            const data = JSON.parse(new TextDecoder().decode(payload));
            console.log('Data received:', topic, data);

            if (data.event_type === 'avatar.talking_start' || data.type === 'talking_start') {
              sendToRN('speaking', { speaking: true });
            } else if (data.event_type === 'avatar.talking_end' || data.type === 'talking_end') {
              sendToRN('speaking', { speaking: false });
            }
          } catch (e) {
            console.log('Data parse error:', e);
          }
        });

        // Connect to the room
        await room.connect(roomUrl, roomToken);
        console.log('Room connected successfully');

      } catch (error) {
        console.error('LiveKit init error:', error);
        showError('Failed to connect: ' + error.message);
      }
    }

    // Send speak command via LiveKit data channel
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

        // Send to agent-control topic
        await room.localParticipant.publishData(data, { topic: 'agent-control' });
        console.log('Speak command sent:', text.substring(0, 50));
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

    // Start initialization
    initLiveKit();
  </script>
</body>
</html>
`;

export function CoachingModal({
  visible,
  onClose,
  goalData,
  userInputs,
  userId: propUserId,
}: CoachingModalProps) {
  const { settings } = useSettings();
  const { user, isAuthenticated } = useAuth();

  // Use authenticated user's ID and name, fallback to prop or 'guest'
  const userId = isAuthenticated && user?.id ? user.id : (propUserId || 'guest');
  const userName = isAuthenticated && user?.firstName ? user.firstName : null;

  const [state, setState] = useState<ModalState>('loading');
  const [script, setScript] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [session, setSession] = useState<StreamingSession | null>(null);
  const [token, setToken] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [showCaptions, setShowCaptions] = useState(settings.captions);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware background colors
  const containerBg = isDark ? colors.background : '#f5f5f7';
  const cardBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.95)';
  const paragraphActiveBg = isDark ? 'rgba(78, 205, 196, 0.1)' : 'rgba(78, 205, 196, 0.15)';

  const webViewRef = useRef<WebView>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const paragraphs = script.split('\n\n').filter(p => p.trim());
  const speakingRef = useRef(false);

  // Use settings for captions
  useEffect(() => {
    setShowCaptions(settings.captions);
  }, [settings.captions]);

  // Animation values
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible && goalData) {
      initializeCoaching();
    }

    return () => {
      cleanup();
    };
  }, [visible, goalData]);

  // Pulse animation when speaking
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

    // Tell WebView to stop avatar
    if (webViewRef.current && session) {
      webViewRef.current.injectJavaScript('window.stopAvatar && window.stopAvatar(); true;');
    }

    // Also call backend to stop session
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

    if (!goalData) {
      setError('No goal data available');
      setState('error');
      return;
    }

    try {
      console.log('[CoachingModal] Fetching coaching data...');
      const response = await avatarService.getGoalCoaching(userId, goalData, userInputs);

      if (!response.ok || !response.script) {
        setError(response.error || 'Failed to load coaching');
        setState('error');
        return;
      }

      setScript(response.script);

      // Check if streaming is available
      if (response.streamingAvailable && response.session && response.token) {
        console.log('[CoachingModal] Streaming available, session:', response.session.sessionId);
        setSession(response.session);
        setToken(response.token);
        setState('ready');
      } else {
        console.log('[CoachingModal] Streaming not available, script only mode');
        setState('finished');
      }
    } catch (err) {
      console.error('[CoachingModal] Init error:', err);
      setError('Unable to load coaching. Please try again.');
      setState('error');
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[CoachingModal] WebView message:', data.type);

      switch (data.type) {
        case 'connected':
          console.log('[CoachingModal] LiveKit connected');
          break;
        case 'ready':
          setState('ready');
          // Auto-start speaking when avatar video is ready (if autoplay is enabled)
          // Wait 3 seconds so user doesn't miss the beginning
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
    } catch (e) {
      console.error('[CoachingModal] WebView message parse error:', e);
    }
  };

  const startSpeaking = async () => {
    if (!script) return;

    speakingRef.current = true;
    setState('speaking');
    setIsSpeaking(true);
    setCurrentParagraph(0);

    // Send the FULL script at once for fluid, uninterrupted speech
    // Clean up the script - remove paragraph breaks for smooth delivery
    const fullScript = script.replace(/\n\n/g, ' ').replace(/\n/g, ' ').trim();

    // Send text to avatar via WebView
    if (webViewRef.current && session) {
      const escapedText = fullScript.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
      console.log('[CoachingModal] Sending full script to avatar, length:', escapedText.length);
      webViewRef.current.injectJavaScript(`window.speakText && window.speakText("${escapedText}"); true;`);
    }

    // Estimate total speaking duration (approximately 150 words per minute = 2.5 words per second)
    // Average word length ~5 chars, so ~12.5 chars per second, or 80ms per char
    const estimatedDuration = Math.max(10000, fullScript.length * 65);
    console.log('[CoachingModal] Estimated speaking duration:', estimatedDuration, 'ms');

    // Wait for the full speech to complete
    await new Promise(resolve => setTimeout(resolve, estimatedDuration));

    setIsSpeaking(false);
    speakingRef.current = false;
    setState('finished');
  };

  const handlePlayPause = async () => {
    await lightImpact();

    if (isSpeaking) {
      speakingRef.current = false;
      setIsSpeaking(false);
    } else {
      startSpeaking();
    }
  };

  const handleReplay = async () => {
    await lightImpact();
    speakingRef.current = false;
    setCurrentParagraph(0);

    // Small delay then restart
    await new Promise(resolve => setTimeout(resolve, 300));
    startSpeaking();
  };

  const handleClose = async () => {
    await lightImpact();
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
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Preparing your personalized coaching...</Text>
          <Text style={[styles.loadingSubtext, { color: colors.textMuted }]}>Your AI coach is reviewing your plan</Text>
        </View>
      );
    }

    if (state === 'error') {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={initializeCoaching}>
            <Text style={[styles.retryButtonText, { color: colors.primaryText }]}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    // Main content with avatar and script
    return (
      <View style={styles.contentContainer}>
        {/* Avatar Video Section - Only show if liveAvatar is enabled */}
        {settings.liveAvatar && (
          <Animated.View style={[styles.avatarSection, pulseAnimatedStyle]}>
            {session && token ? (
              <View style={styles.webViewContainer}>
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
              <View style={styles.avatarFallback}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={48} color="#4ECDC4" />
                </View>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: cardBg }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.textMuted }, isSpeaking && styles.statusDotActive]} />
              <Text style={[styles.statusText, { color: colors.text }]}>
                {state === 'loading' ? 'Loading...' :
                 state === 'ready' ? 'Ready' :
                 isSpeaking ? 'Speaking' :
                 'Completed'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Text-only header when avatar is disabled */}
        {!settings.liveAvatar && (
          <View style={styles.textOnlyHeader}>
            <View style={styles.coachIconSmall}>
              <Ionicons name="sparkles" size={24} color="#4ECDC4" />
            </View>
            <Text style={[styles.textOnlyTitle, { color: colors.text }]}>AI Coach Advice</Text>
            <View style={[styles.statusBadge, { backgroundColor: cardBg }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.textMuted }, isSpeaking && styles.statusDotActive]} />
              <Text style={[styles.statusText, { color: colors.text }]}>
                {state === 'ready' ? 'Ready' : isSpeaking ? 'Reading...' : 'Complete'}
              </Text>
            </View>
          </View>
        )}

        {/* Script Display */}
        <View style={styles.scriptSection}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scriptScroll}
            showsVerticalScrollIndicator={false}
          >
            {paragraphs.map((paragraph, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.delay(index * 100)}
                style={[
                  styles.paragraphContainer,
                  index === currentParagraph && isSpeaking && [styles.paragraphActive, { backgroundColor: paragraphActiveBg }],
                ]}
              >
                <Text
                  style={[
                    styles.paragraphText,
                    { color: colors.textSecondary },
                    index === currentParagraph && isSpeaking && { color: colors.text },
                    index < currentParagraph && { color: colors.textMuted },
                  ]}
                >
                  {paragraph}
                </Text>
              </Animated.View>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              { backgroundColor: cardBg, borderColor: colors.border },
              pressed && styles.controlButtonPressed,
            ]}
            onPress={handleReplay}
          >
            <Ionicons name="refresh" size={24} color={colors.text} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.playButton,
              pressed && styles.playButtonPressed,
            ]}
            onPress={handlePlayPause}
          >
            <Ionicons
              name={isSpeaking ? 'pause' : 'play'}
              size={32}
              color="#000"
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              { backgroundColor: cardBg, borderColor: colors.border },
              pressed && styles.controlButtonPressed,
            ]}
            onPress={handleClose}
          >
            <Ionicons name="checkmark" size={24} color={colors.text} />
          </Pressable>
        </View>
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
      <View style={[styles.container, { backgroundColor: containerBg }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={[styles.closeButton, { backgroundColor: cardBg }]}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>YOUR PERSONALIZED COACHING</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderContent()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  headerTitle: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 2,
    color: Colors.text,
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
  loadingText: {
    fontSize: 18,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
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
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
    color: Colors.primaryText,
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
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
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
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderWidth: 3,
    borderColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#4ECDC4',
  },
  statusText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  scriptSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scriptScroll: {
    flex: 1,
  },
  paragraphContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  paragraphActive: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
  },
  paragraphText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  paragraphTextActive: {
    color: Colors.text,
  },
  paragraphTextCompleted: {
    color: Colors.textMuted,
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
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
    borderRadius: 22,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOnlyTitle: {
    fontSize: 18,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    flex: 1,
  },
});
