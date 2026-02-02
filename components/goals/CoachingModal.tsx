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
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { avatarService, GoalData, UserInputs, StreamingSession } from '../../services/avatarService';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

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
    background: '#F8F8F8',
    card: 'rgba(255, 255, 255, 0.75)',
    cardBorder: 'rgba(255, 255, 255, 0.5)',
    header: 'rgba(255, 255, 255, 0.85)',
    text: '#1D1D1F',
    textMuted: 'rgba(60, 60, 67, 0.6)',
    textSecondary: 'rgba(60, 60, 67, 0.4)',
    border: 'rgba(0, 0, 0, 0.08)',
    accent: 'rgba(78, 205, 196, 0.9)',
    accentBg: 'rgba(78, 205, 196, 0.15)',
    buttonBg: 'rgba(255, 255, 255, 0.6)',
    buttonBorder: 'rgba(255, 255, 255, 0.8)',
  },
  dark: {
    background: '#0A0A0A',
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
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

  // Button animations

