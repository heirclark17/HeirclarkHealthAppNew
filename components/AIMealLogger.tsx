import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../constants/Theme';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useSettings } from '../contexts/SettingsContext';
import { useAdaptiveTDEE } from '../contexts/AdaptiveTDEEContext';
import { useSmartMealLogger } from '../contexts/SmartMealLoggerContext';

// Voice module types
type SpeechResultsEvent = { value?: string[] };
type SpeechErrorEvent = { error?: any };

// Voice module will be loaded dynamically only when needed
let Voice: any = null;
let isVoiceModuleAvailable = false;
import { GlassCard } from './GlassCard';
import { aiService, NutritionAnalysis } from '../services/aiService';
import { api, MealData } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Colorful gradient colors for animations
const GRADIENT_COLORS = {
  primary: [Colors.error, '#FF8E53', '#FFC857', Colors.success, '#45B7D1', '#96E6A1'] as const,
  scanner: ['#00F5A0', Colors.accentCyan, Colors.accentPurple, '#FF61DC'] as const,
  voice: [Colors.error, '#FF8E53', '#FFC857', '#45B7D1'] as const,
  camera: [Colors.accentPurple, Colors.accentCyan, '#00F5A0', '#FFC857'] as const,
};

// Animated Barcode Scanner Line Component
const AnimatedScanLine = () => {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Scanning line animation
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Glow pulse animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    scanLoop.start();
    glowLoop.start();

    return () => {
      scanLoop.stop();
      glowLoop.stop();
    };
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 80],
  });

  return (
    <Animated.View
      style={[
        animStyles.scanLineContainer,
        { transform: [{ translateY }], opacity: glowAnim },
      ]}
    >
      <LinearGradient
        colors={GRADIENT_COLORS.scanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={animStyles.scanLine}
      />
      <View style={animStyles.scanLineGlow} />
    </Animated.View>
  );
};

// Animated Corner Brackets for Scanner
const AnimatedCorners = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  return (
    <Animated.View style={[animStyles.cornersContainer, { transform: [{ scale: pulseAnim }] }]}>
      {/* Top Left */}
      <LinearGradient
        colors={['#00F5A0', Colors.accentCyan]}
        style={[animStyles.corner, animStyles.cornerTopLeft]}
      />
      {/* Top Right */}
      <LinearGradient
        colors={[Colors.accentCyan, Colors.accentPurple]}
        style={[animStyles.corner, animStyles.cornerTopRight]}
      />
      {/* Bottom Left */}
      <LinearGradient
        colors={['#FF61DC', Colors.error]}
        style={[animStyles.corner, animStyles.cornerBottomLeft]}
      />
      {/* Bottom Right */}
      <LinearGradient
        colors={[Colors.accentPurple, '#FF61DC']}
        style={[animStyles.corner, animStyles.cornerBottomRight]}
      />
    </Animated.View>
  );
};

// Animated Voice Recording Rings
const AnimatedVoiceRings = ({ isRecording }: { isRecording: boolean }) => {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const ring4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording) {
      const createRingAnimation = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(anim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anim1 = createRingAnimation(ring1, 0);
      const anim2 = createRingAnimation(ring2, 500);
      const anim3 = createRingAnimation(ring3, 1000);
      const anim4 = createRingAnimation(ring4, 1500);

      anim1.start();
      anim2.start();
      anim3.start();
      anim4.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
        anim4.stop();
      };
    } else {
      ring1.setValue(0);
      ring2.setValue(0);
      ring3.setValue(0);
      ring4.setValue(0);
    }
  }, [isRecording]);

  const createRingStyle = (anim: Animated.Value, color: string, baseSize: number) => ({
    position: 'absolute' as const,
    width: baseSize,
    height: baseSize,
    borderRadius: baseSize / 2,
    borderWidth: 3,
    borderColor: color,
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 0],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.5],
        }),
      },
    ],
  });

  if (!isRecording) return null;

  return (
    <View style={animStyles.voiceRingsContainer}>
      <Animated.View style={createRingStyle(ring1, Colors.error, 80)} />
      <Animated.View style={createRingStyle(ring2, '#FF8E53', 80)} />
      <Animated.View style={createRingStyle(ring3, '#FFC857', 80)} />
      <Animated.View style={createRingStyle(ring4, '#45B7D1', 80)} />
    </View>
  );
};

// Animated Camera Scanning Effect
const AnimatedCameraScan = () => {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    scanLoop.start();
    rotateLoop.start();

    return () => {
      scanLoop.stop();
      rotateLoop.stop();
    };
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const translateY = scanAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-150, 150, -150],
  });

  return (
    <View style={animStyles.cameraScanContainer}>
      {/* Rotating gradient border */}
      <Animated.View style={[animStyles.cameraRotatingBorder, { transform: [{ rotate }] }]}>
        <LinearGradient
          colors={GRADIENT_COLORS.camera}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={animStyles.cameraGradientBorder}
        />
      </Animated.View>

      {/* Scanning line */}
      <Animated.View style={[animStyles.cameraScanLine, { transform: [{ translateY }] }]}>
        <LinearGradient
          colors={['transparent', Colors.accentPurple, Colors.accentCyan, Colors.accentPurple, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={animStyles.cameraScanLineGradient}
        />
      </Animated.View>

      {/* Corner accents */}
      <View style={animStyles.cameraCorners}>
        <View style={[animStyles.cameraCorner, animStyles.cameraCornerTL]} />
        <View style={[animStyles.cameraCorner, animStyles.cameraCornerTR]} />
        <View style={[animStyles.cameraCorner, animStyles.cameraCornerBL]} />
        <View style={[animStyles.cameraCorner, animStyles.cameraCornerBR]} />
      </View>
    </View>
  );
};

// Animated listening dots for voice transcription
const AnimatedListeningDots = () => {
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createDotAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ])
      );
    };

    const anim1 = createDotAnimation(dot1Anim, 0);
    const anim2 = createDotAnimation(dot2Anim, 200);
    const anim3 = createDotAnimation(dot3Anim, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={animStyles.listeningDotsContainer}>
      <Animated.View style={[animStyles.listeningDotAnimated, { opacity: dot1Anim, backgroundColor: Colors.error }]} />
      <Animated.View style={[animStyles.listeningDotAnimated, { opacity: dot2Anim, backgroundColor: '#FFC857' }]} />
      <Animated.View style={[animStyles.listeningDotAnimated, { opacity: dot3Anim, backgroundColor: '#45B7D1' }]} />
    </View>
  );
};

// Animated analyzing indicator
const AnimatedAnalyzing = ({ text }: { text: string }) => {
  const dotAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dotLoop = Animated.loop(
      Animated.timing(dotAnim, {
        toValue: 3,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    const colorLoop = Animated.loop(
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    dotLoop.start();
    colorLoop.start();

    return () => {
      dotLoop.stop();
      colorLoop.stop();
    };
  }, []);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [Colors.error, '#FFC857', Colors.success, '#45B7D1', Colors.error],
  });

  return (
    <View style={animStyles.analyzingContainer}>
      <View style={animStyles.analyzingSpinner}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const rotation = `${i * 60}deg`;
          const delay = i * 100;
          return (
            <Animated.View
              key={i}
              style={[
                animStyles.spinnerDot,
                {
                  transform: [{ rotate: rotation }, { translateY: -20 }],
                  backgroundColor,
                  opacity: ((i + 1) / 6),
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={animStyles.analyzingText}>{text}</Text>
    </View>
  );
};

type LogMode = 'select' | 'manual' | 'voice' | 'photo' | 'barcode' | 'diningOut';

interface AIMealLoggerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate: string;
}

// Helper to get default meal type based on current time
const getDefaultMealType = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 21) return 'dinner';
  return 'snack';
};

export function AIMealLogger({ visible, onClose, onSuccess, selectedDate }: AIMealLoggerProps) {
  const router = useRouter();
  const { settings } = useSettings();
  const { logCalories } = useAdaptiveTDEE();
  const { logNewMeal } = useSmartMealLogger();
  const isDark = settings.themeMode === 'dark';
  const colors = useMemo(() => isDark ? DarkColors : LightColors, [isDark]);

  const [mode, setMode] = useState<LogMode>('select');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(getDefaultMealType());

  // Manual + AI
  const [manualText, setManualText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Voice
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);

  // Photo
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');

  // Barcode
  const [barcode, setBarcode] = useState('');
  const [scannerActive, setScannerActive] = useState(false);

  // Analysis results
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const [saving, setSaving] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const resetState = () => {
    setMode('select');
    setMealType(getDefaultMealType());
    setManualText('');
    setAnalyzing(false);
    setRecording(null);
    setIsRecording(false);
    setLiveTranscript('');
    setPhotoUri(null);
    setCameraActive(false);
    setBarcode('');
    setScannerActive(false);
    setAnalysis(null);
    setSaving(false);
    setFlashMode('off');
  };

  // Voice recognition - disabled for now (requires native rebuild)
  // Live transcription will be enabled after rebuilding with @react-native-voice/voice
  useEffect(() => {
    console.log('[AIMealLogger] Voice module disabled - using AI transcription after recording');
    setIsVoiceAvailable(false);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Manual AI Analysis
  const handleManualAnalyze = async () => {
    if (!manualText.trim()) {
      Alert.alert('Error', 'Please describe your meal');
      return;
    }

    setAnalyzing(true);
    const result = await aiService.analyzeMealText(manualText);
    setAnalyzing(false);

    if (result) {
      setAnalysis(result);
    } else {
      Alert.alert(
        'AI Unavailable',
        'AI analysis is currently unavailable. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  // Voice Recording with Live Transcription
  const startRecording = async () => {
    try {
      // Request permission first
      const permissionResponse = await Audio.requestPermissionsAsync();

      if (permissionResponse.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required to record audio. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Clear previous transcript
      setLiveTranscript('');

      // Start audio recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);

      // Note: Live transcription disabled - will use AI transcription after recording stops
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);

    // Note: Live transcription disabled

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    if (uri) {
      setAnalyzing(true);

      // Use live transcript if available, otherwise fall back to AI transcription
      let transcribedText = liveTranscript.trim();

      if (!transcribedText) {
        // Fall back to AI-based transcription if live transcription failed
        transcribedText = await aiService.transcribeVoice(uri) || '';
      }

      if (transcribedText) {
        const result = await aiService.analyzeMealText(transcribedText);
        setAnalyzing(false);

        if (result) {
          setAnalysis(result);
        } else {
          Alert.alert('Error', 'Failed to analyze meal. Please try again.');
        }
      } else {
        setAnalyzing(false);
        Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
      }
    }

    setRecording(null);
  };

  // Photo Analysis
  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }
    setCameraActive(true);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync();
    if (photo?.uri) {
      setCameraActive(false);
      setPhotoUri(photo.uri);
      await analyzePhoto(photo.uri);
    }
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      await analyzePhoto(result.assets[0].uri);
    }
  };

  const analyzePhoto = async (uri: string) => {
    setAnalyzing(true);

    try {
      // Send file URI directly - better for React Native FormData
      console.log('[AIMealLogger] Analyzing photo URI:', uri);
      const result = await aiService.analyzeMealPhoto(uri);
      setAnalyzing(false);

      if (result) {
        setAnalysis(result);
      } else {
        Alert.alert('Error', 'Failed to analyze photo. Please try again.');
      }
    } catch (error) {
      console.error('Photo analysis error:', error);
      setAnalyzing(false);
      Alert.alert('Error', 'Failed to analyze photo');
    }
  };

  // Barcode Scanner
  const handleBarcodeScan = (result: BarcodeScanningResult) => {
    if (result.data) {
      setScannerActive(false);
      setBarcode(result.data);
      lookupBarcode(result.data);
    }
  };

  const lookupBarcode = async (code: string) => {
    if (!code) return;

    setAnalyzing(true);
    const result = await aiService.lookupBarcode(code);
    setAnalyzing(false);

    if (result) {
      setAnalysis(result);
    } else {
      Alert.alert('Not Found', 'Product not found in database. Try manual entry.');
    }
  };

  // Save meal
  const handleSaveMeal = async () => {
    if (!analysis) return;

    setSaving(true);

    const mealData: MealData = {
      date: selectedDate,
      mealType,
      name: analysis.mealName,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
    };

    console.log('[AIMealLogger] Saving meal:', JSON.stringify(mealData, null, 2));

    const success = await api.logMeal(mealData);

    // Also log to Adaptive TDEE agent for metabolism tracking
    try {
      await logCalories(analysis.calories, 0, 1);
      console.log('[AIMealLogger] Logged calories to Adaptive TDEE:', analysis.calories);
    } catch (tdeeError) {
      console.warn('[AIMealLogger] Failed to log to Adaptive TDEE:', tdeeError);
    }

    // Log to Smart Meal Logger for pattern learning
    try {
      await logNewMeal({
        name: analysis.mealName,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fat: analysis.fat,
        mealType,
        imageUrl: analysis.imageUrl,
        source: mode === 'manual' ? 'manual' : mode === 'photo' ? 'photo' : mode === 'barcode' ? 'barcode' : 'ai',
      });
      console.log('[AIMealLogger] Logged meal to Smart Meal Logger for learning:', analysis.mealName);
    } catch (smartError) {
      console.warn('[AIMealLogger] Failed to log to Smart Meal Logger:', smartError);
    }

    setSaving(false);

    if (success) {
      Alert.alert('Success', 'Meal logged successfully!', [
        {
          text: 'OK',
          onPress: () => {
            resetState();
            onSuccess();
          },
        },
      ]);
    } else {
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    }
  };

  // Mode card component with liquid glass design
  const ModeCard = ({
    icon,
    title,
    description,
    onPress
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    onPress: () => void;
  }) => {
    const iconColor = isDark ? Colors.text : colors.text;
    const textColor = isDark ? Colors.text : colors.text;
    const subtextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
    const chevronColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)';
    const iconBgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <GlassCard style={styles.modeCard}>
          <View style={[styles.modeIcon, { backgroundColor: iconBgColor }]}>
            <Ionicons name={icon} size={32} color={iconColor} />
          </View>
          <View style={styles.modeInfo}>
            <Text style={[styles.modeTitle, { color: textColor }]}>{title}</Text>
            <Text style={[styles.modeDescription, { color: subtextColor }]}>{description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={chevronColor} />
        </GlassCard>
      </TouchableOpacity>
    );
  };

  // Render Mode Selection
  const renderModeSelect = () => {
    const titleColor = isDark ? Colors.text : colors.text;

    return (
      <View style={styles.content}>
        <Text style={[styles.title, { color: titleColor }]}>How would you like to log your meal?</Text>

        <ModeCard
          icon="text"
          title="Text Description"
          description="Describe your meal in words"
          onPress={() => setMode('manual')}
        />

        <ModeCard
          icon="search"
          title="Food Search"
          description="Search nutrition database"
          onPress={() => {
            handleClose();
            router.push('/food-search');
          }}
        />

        <ModeCard
          icon="mic"
          title="Voice Recording"
          description="Say what you ate"
          onPress={() => setMode('voice')}
        />

        <ModeCard
          icon="camera"
          title="AI Camera"
          description="Snap a photo of your food"
          onPress={() => setMode('photo')}
        />

        <ModeCard
          icon="barcode"
          title="Barcode Scanner"
          description="Scan packaged food"
          onPress={() => setMode('barcode')}
        />

        <ModeCard
          icon="restaurant"
          title="Dining Out"
          description="Log restaurant meals"
          onPress={() => setMode('diningOut')}
        />
      </View>
    );
  };

  // Render Full-Screen Camera (Photo Mode)
  const renderFullScreenCamera = () => (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar hidden />
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        enableTorch={flashMode === 'on'}
      >
        {/* AI Camera Scanning Animation Overlay */}
        <View style={styles.cameraScanOverlay}>
          <AnimatedCameraScan />
        </View>

        {/* Top Bar */}
        <View style={styles.cameraTopBar}>
          <TouchableOpacity
            style={styles.cameraTopButton}
            onPress={() => setCameraActive(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <LinearGradient
            colors={[Colors.accentPurple, Colors.accentCyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cameraTitleBadge}
          >
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={styles.cameraTitle}>AI Camera</Text>
          </LinearGradient>
          <TouchableOpacity style={styles.cameraTopButton} onPress={() => {}}>
            <Ionicons name="ellipsis-horizontal" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.cameraBottomBar}>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraIconButton}
              onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')}
            >
              <Ionicons
                name={flashMode === 'off' ? 'flash-off' : 'flash'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
              <LinearGradient
                colors={[Colors.accentPurple, Colors.accentCyan, '#00F5A0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.captureButtonGradient}
              >
                <View style={styles.captureButtonInner} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cameraIconButton} onPress={handlePickPhoto}>
              <Ionicons name="images" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.cameraLabels}>
            <Text style={styles.cameraLabel}>AI Camera</Text>
            <Text style={styles.cameraLabel}>Gallery</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );

  // Render Full-Screen Barcode Scanner
  const renderFullScreenScanner = () => (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar hidden />
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
        onBarcodeScanned={handleBarcodeScan}
      >
        {/* Top Bar */}
        <View style={styles.cameraTopBar}>
          <TouchableOpacity
            style={styles.cameraTopButton}
            onPress={() => setScannerActive(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>AI Scanner</Text>
          <TouchableOpacity style={styles.cameraTopButton} onPress={() => {}}>
            <Ionicons name="ellipsis-horizontal" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Scanning Frame with Animations */}
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame}>
            <AnimatedCorners />
            <AnimatedScanLine />
          </View>
          <Text style={styles.scannerHint}>Align barcode within frame</Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.cameraBottomBar}>
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.cameraIconButton} onPress={() => {}}>
              <Ionicons name="flashlight-outline" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.scannerCaptureButton}>
              <View style={styles.scannerCircle} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cameraIconButton} onPress={() => {}}>
              <Ionicons name="grid-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );

  // Render Nutrition Details Modal (Redesigned with Liquid Glass)
  const renderNutritionDetails = () => {
    if (!analysis) return null;

    // Calculate weight as sum of macros
    const totalWeight = Math.round(analysis.carbs + analysis.protein + analysis.fat);

    // Macro card component with vertical progress bar (no card wrapper)
    const MacroCard = ({
      label,
      value,
      color,
      maxValue = 100,
      unit = 'g'
    }: {
      label: string;
      value: number;
      color: string;
      maxValue?: number;
      unit?: string;
    }) => {
      const progress = Math.min(value / maxValue, 1);

      return (
        <View style={styles.macroCardNew}>
          {/* Vertical colored progress bar */}
          <View style={styles.verticalBarContainer}>
            <View style={styles.verticalBarBg}>
              <View
                style={[
                  styles.verticalBarFill,
                  {
                    backgroundColor: color,
                    height: `${progress * 100}%`,
                  }
                ]}
              />
            </View>
          </View>

          {/* Label */}
          <Text style={styles.macroLabelNew}>{label}</Text>
          <Text style={styles.macroValueNew}>{value}{unit}</Text>
        </View>
      );
    };

    return (
      <Modal
        visible={!!analysis}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setAnalysis(null)}
      >
        <View style={styles.nutritionModal}>
          {/* Full-Screen Food Photo Background - only show if there's an image */}
          {(photoUri || analysis.imageUrl) && (
            <View style={styles.nutritionPhotoContainer}>
              <Image
                source={{ uri: photoUri || analysis.imageUrl }}
                style={styles.nutritionPhotoImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Top Navigation with Glass Buttons */}
          <View style={styles.nutritionTopBar}>
            <TouchableOpacity
              style={styles.nutritionBackButton}
              onPress={() => setAnalysis(null)}
            >
              <BlurView intensity={40} tint="dark" style={styles.nutritionNavButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nutritionRefreshButton} onPress={handleManualAnalyze}>
              <BlurView intensity={40} tint="dark" style={styles.nutritionNavButton}>
                <Ionicons name="sync" size={24} color="#fff" />
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Bottom Card with Nutrition Details - Liquid Glass */}
          <BlurView
            intensity={80}
            tint="dark"
            style={styles.nutritionCardGlass}
          >
            <View style={styles.nutritionCardContent}>
              <View style={styles.nutritionCardHeader}>
                <Text style={styles.nutritionTitle}>Nutrition Details</Text>
                <Text style={styles.mealName}>{analysis.mealName}</Text>
              </View>

              {/* Meal Type Selector */}
              <View style={styles.mealTypeSelector}>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mealTypeButton,
                      mealType === type && styles.mealTypeButtonActive,
                    ]}
                    onPress={() => setMealType(type)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.mealTypeButtonText,
                        mealType === type && styles.mealTypeButtonTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Macro Cards with Vertical Colored Progress Bars */}
              <View style={styles.macroCardsRow}>
                <MacroCard
                  label="Calories"
                  value={analysis.calories}
                  color="#E74C3C"
                  maxValue={800}
                  unit=""
                />
                <MacroCard
                  label="Protein"
                  value={analysis.protein}
                  color={colors.protein}
                  maxValue={100}
                />
                <MacroCard
                  label="Carbs"
                  value={analysis.carbs}
                  color="#3498DB"
                  maxValue={150}
                />
                <MacroCard
                  label="Fat"
                  value={analysis.fat}
                  color="#9B59B6"
                  maxValue={80}
                />
              </View>

              {/* Add to Meal Button */}
              <TouchableOpacity
                style={styles.addMealButtonGlass}
                onPress={handleSaveMeal}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.addMealButtonTextWhite}>Add to Meal</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    );
  };

  // Render Manual Text Entry
  const renderManual = () => {
    const labelColor = isDark ? Colors.text : colors.text;
    const textColor = isDark ? Colors.text : colors.text;
    const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
    const inputBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
    const inputBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';

    return (
      <View style={styles.content}>
        <Text style={[styles.label, { color: labelColor }]}>Describe your meal</Text>
        <GlassCard style={styles.textAreaContainer}>
          <TextInput
            style={[styles.textAreaInput, { color: textColor }]}
            placeholder="E.g., 2 scrambled eggs, toast with butter, and orange juice"
            placeholderTextColor={placeholderColor}
            value={manualText}
            onChangeText={setManualText}
            multiline
            numberOfLines={4}
          />
        </GlassCard>

        {analyzing ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <TouchableOpacity activeOpacity={0.7} onPress={handleManualAnalyze}>
            <GlassCard style={styles.aiButtonGlass}>
              <Ionicons name="sparkles" size={20} color={isDark ? Colors.text : colors.text} />
              <Text style={[styles.aiButtonText, { color: isDark ? Colors.text : colors.text }]}>Analyze with AI</Text>
            </GlassCard>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render Voice
  const renderVoice = () => {
    const labelColor = isDark ? Colors.text : colors.text;
    const textColor = isDark ? Colors.text : colors.text;
    const iconColor = isDark ? Colors.text : colors.text;
    const transcriptBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
    const transcriptBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';
    const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';

    return (
      <View style={styles.content}>
        <Text style={[styles.label, { color: labelColor }]}>Tap to speak</Text>

        <View style={styles.voiceButtonWrapper}>
          <AnimatedVoiceRings isRecording={isRecording} />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <GlassCard style={[styles.voiceButtonGlass, isRecording && styles.voiceButtonActive]}>
              <Ionicons
                name={isRecording ? 'stop-circle' : 'mic'}
                size={64}
                color={isRecording ? Colors.error : iconColor}
              />
              <Text style={[styles.voiceText, { color: textColor }]}>
                {isRecording ? 'Tap to stop' : 'Tap to record'}
              </Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {isRecording && (
          <View style={styles.waveform}>
            <LinearGradient
              colors={[Colors.error, '#FF8E53', '#FFC857', '#45B7D1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.recordingBadge}
            >
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording</Text>
            </LinearGradient>
          </View>
        )}

        {/* Live Transcription Display */}
        {(isRecording || liveTranscript) && !analyzing && (
          <GlassCard style={styles.liveTranscriptContainer}>
            <View style={styles.liveTranscriptHeader}>
              <Ionicons name="text" size={16} color={textColor} />
              <Text style={[styles.liveTranscriptLabel, { color: textColor }]}>
                {isRecording ? 'Listening...' : 'Transcription'}
              </Text>
              {isRecording && <AnimatedListeningDots />}
            </View>
            <Text style={[styles.liveTranscriptText, { color: textColor }]}>
              {liveTranscript || (isRecording ? 'Start speaking to see your words appear here...' : '')}
            </Text>
          </GlassCard>
        )}

        {analyzing && (
          <AnimatedAnalyzing text="Analyzing your meal..." />
        )}
      </View>
    );
  };

  // Render Photo Mode
  const renderPhoto = () => {
    const labelColor = isDark ? Colors.text : colors.text;
    const textColor = isDark ? Colors.text : colors.text;
    const iconColor = isDark ? Colors.text : colors.text;

    return (
      <View style={styles.content}>
        <Text style={[styles.label, { color: labelColor }]}>Capture your meal</Text>

        <View style={styles.photoButtons}>
          <TouchableOpacity activeOpacity={0.7} onPress={handleTakePhoto}>
            <GlassCard style={styles.largeButtonGlass}>
              <LinearGradient
                colors={[Colors.accentPurple, Colors.accentCyan]}
                style={styles.iconGradientBg}
              >
                <Ionicons name="camera" size={24} color="#fff" />
              </LinearGradient>
              <Text style={[styles.largeButtonText, { color: textColor }]}>Open Camera</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={handlePickPhoto}>
            <GlassCard style={styles.largeButtonGlass}>
              <LinearGradient
                colors={[Colors.error, '#FFC857']}
                style={styles.iconGradientBg}
              >
                <Ionicons name="images" size={24} color="#fff" />
              </LinearGradient>
              <Text style={[styles.largeButtonText, { color: textColor }]}>Choose from Gallery</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {analyzing && (
          <AnimatedAnalyzing text="Analyzing your meal..." />
        )}
      </View>
    );
  };

  // Render Barcode Mode
  const renderBarcode = () => {
    const labelColor = isDark ? Colors.text : colors.text;
    const textColor = isDark ? Colors.text : colors.text;
    const iconColor = isDark ? Colors.text : colors.text;

    return (
      <View style={styles.content}>
        <Text style={[styles.label, { color: labelColor }]}>Scan product barcode</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setScannerActive(true)}
        >
          <GlassCard style={styles.largeButtonGlass}>
            <LinearGradient
              colors={['#00F5A0', Colors.accentCyan, Colors.accentPurple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradientBg}
            >
              <Ionicons name="barcode" size={24} color="#fff" />
            </LinearGradient>
            <Text style={[styles.largeButtonText, { color: textColor }]}>Open Scanner</Text>
          </GlassCard>
        </TouchableOpacity>

        {analyzing && (
          <AnimatedAnalyzing text="Looking up product..." />
        )}
      </View>
    );
  };

  // Render Dining Out
  const renderDiningOut = () => {
    const labelColor = isDark ? Colors.text : colors.text;
    const textColor = isDark ? Colors.text : colors.text;
    const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';

    return (
      <View style={styles.content}>
        <Text style={[styles.label, { color: labelColor }]}>Describe your restaurant meal</Text>
        <GlassCard style={styles.textAreaContainer}>
          <TextInput
            style={[styles.textAreaInput, { color: textColor }]}
            placeholder="E.g., Grilled salmon with roasted vegetables and quinoa from Ocean's Plate"
            placeholderTextColor={placeholderColor}
            value={manualText}
            onChangeText={setManualText}
            multiline
            numberOfLines={4}
          />
        </GlassCard>

        {analyzing ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <TouchableOpacity activeOpacity={0.7} onPress={handleManualAnalyze}>
            <GlassCard style={styles.aiButtonGlass}>
              <Ionicons name="sparkles" size={20} color={isDark ? Colors.text : colors.text} />
              <Text style={[styles.aiButtonText, { color: isDark ? Colors.text : colors.text }]}>Analyze with AI</Text>
            </GlassCard>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Main Render

  // Full-screen camera modal (separate from main modal)
  if (cameraActive) {
    return (
      <Modal
        visible={true}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setCameraActive(false)}
      >
        {renderFullScreenCamera()}
      </Modal>
    );
  }

  // Full-screen scanner modal (separate from main modal)
  if (scannerActive) {
    return (
      <Modal
        visible={true}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setScannerActive(false)}
      >
        {renderFullScreenScanner()}
      </Modal>
    );
  }

  // Nutrition details modal
  if (analysis) {
    return renderNutritionDetails();
  }

  const headerTextColor = isDark ? Colors.text : colors.text;
  const headerIconColor = isDark ? Colors.text : colors.text;
  const containerBgColor = isDark ? 'rgba(20, 20, 20, 0.4)' : 'rgba(255, 255, 255, 0.4)';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <BlurView
        intensity={isDark ? 80 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.container, { backgroundColor: containerBgColor }]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color={headerIconColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: headerTextColor }]}>Log Meal</Text>
            <View style={{ width: 28 }} />
          </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {mode === 'select' && renderModeSelect()}
          {mode === 'manual' && renderManual()}
          {mode === 'voice' && renderVoice()}
          {mode === 'photo' && renderPhoto()}
          {mode === 'barcode' && renderBarcode()}
          {mode === 'diningOut' && renderDiningOut()}

          {mode !== 'select' && !analysis && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setMode('select')}>
              <GlassCard style={styles.backButtonGlass}>
                <Ionicons name="arrow-back" size={20} color={isDark ? Colors.text : colors.text} />
                <Text style={[styles.backButtonText, { color: isDark ? Colors.text : colors.text }]}>Back</Text>
              </GlassCard>
            </TouchableOpacity>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 20, 0.4)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.regular,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.lg,
    fontWeight: '400',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.sm,
    fontWeight: '400',
  },

  // Mode Selection Cards - liquid glass design
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    // GlassCard provides background, border, and blur effect
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: 24,
    // backgroundColor set dynamically based on theme
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginBottom: 4,
    fontWeight: '500',
  },
  modeDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    fontWeight: '300',
  },

  // Text Entry - liquid glass design
  textAreaContainer: {
    marginBottom: Spacing.md,
  },
  textAreaInput: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  aiButtonGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.md,
    gap: 8,
  },
  aiButtonText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    fontWeight: '500',
  },

  // Voice Recording - liquid glass design
  voiceButtonGlass: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginVertical: Spacing.xl,
    borderRadius: 80,
  },
  voiceButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginVertical: Spacing.xl,
  },
  voiceButtonActive: {
    backgroundColor: 'rgba(255, 100, 100, 0.2)',
  },
  voiceText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: Spacing.sm,
    fontWeight: '400',
  },
  waveform: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  recordingText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.error,
  },

  // Photo Buttons - liquid glass design
  photoButtons: {
    gap: Spacing.md,
  },
  largeButtonGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  largeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: Spacing.lg,
    gap: 12,
  },
  largeButtonText: {
    fontSize: 18,
    fontFamily: Fonts.regular,
    fontWeight: '400',
  },

  // Full-Screen Camera
  fullScreenCamera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
  },
  fullScreenCameraView: {
    flex: 1,
  },
  cameraTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cameraTopButton: {
    width: 44,
    height: 44,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: '#fff',
  },
  cameraBottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraIconButton: {
    width: 60,
    height: 60,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent', // Liquid glass
  },
  cameraLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cameraLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#fff',
    textAlign: 'center',
  },

  // Scanner Overlay
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: SCREEN_WIDTH * 0.7,
    height: 200,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerHint: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#fff',
    marginTop: 24,
    textAlign: 'center',
  },
  scannerCaptureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#fff',
  },

  // Nutrition Details Modal
  nutritionModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  nutritionPhotoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.45,
  },
  nutritionPhotoImage: {
    width: '100%',
    height: '100%',
  },
  nutritionPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionBackButton: {
    overflow: 'hidden',
    borderRadius: 24,
  },
  nutritionRefreshButton: {
    overflow: 'hidden',
    borderRadius: 24,
  },
  nutritionNavButton: {
    width: 44,
    height: 44,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  nutritionCard: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    top: SCREEN_HEIGHT * 0.35,
    backgroundColor: 'rgba(20, 20, 20, 0.4)',
    borderRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nutritionCardGlass: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    top: SCREEN_HEIGHT * 0.35,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  nutritionCardContent: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  nutritionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
    marginBottom: 12,
  },
  nutritionBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#fff',
    fontWeight: '500',
  },
  nutritionCardHeader: {
    marginBottom: 24,
  },
  nutritionTitle: {
    fontSize: 18,
    fontFamily: Fonts.numericSemiBold,
    color: '#fff',
    marginBottom: 6,
  },
  nutritionSubtitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    fontSize: 14,
    fontFamily: Fonts.numericRegular,
    color: '#fff',
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  caloriesText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#FF6B00',
  },

  // Macro Cards Row with Vertical Progress Bars
  macroCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  macroCardNew: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  macroCardGlass: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  verticalBarContainer: {
    width: '100%',
    height: 220,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  verticalBarBg: {
    width: 40,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalBarFill: {
    width: '100%',
    borderRadius: 20,
  },
  macroLabelNew: {
    fontSize: 10,
    fontFamily: Fonts.numericRegular,
    color: '#888',
    marginBottom: 2,
    fontWeight: '300',
  },
  macroValueNew: {
    fontSize: 12,
    fontFamily: Fonts.numericRegular,
    color: '#fff',
    fontWeight: '300',
  },

  // Meal Type Selector
  mealTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  mealTypeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  mealTypeButtonText: {
    fontSize: 12,
    fontFamily: Fonts.numericRegular,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  mealTypeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Add to Meal Button
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 32,
    paddingVertical: 16,
    gap: 8,
  },
  addMealButtonGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 32,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addMealButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    paddingVertical: 16,
    gap: 8,
  },
  addMealButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.background,
  },
  addMealButtonTextWhite: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#fff',
  },

  // Loading States
  analyzing: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  analyzingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  loader: {
    marginVertical: Spacing.lg,
  },

  // Back Button - liquid glass design
  backButtonGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    fontWeight: '400',
  },

  // Voice button wrapper for animations
  voiceButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
  },

  // Recording badge
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  // Live Transcription Display
  liveTranscriptContainer: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.sm,
  },
  liveTranscriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  liveTranscriptLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    flex: 1,
  },
  liveTranscriptText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    lineHeight: 24,
    minHeight: 48,
  },

  // Icon gradient background
  iconGradientBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Camera scan overlay
  cameraScanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },

  // Camera title badge
  cameraTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },

  // Capture button gradient
  captureButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
});

// Animation styles
const animStyles = StyleSheet.create({
  // Barcode scanner animations
  scanLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    width: '90%',
    height: 3,
    borderRadius: 2,
  },
  scanLineGlow: {
    position: 'absolute',
    width: '90%',
    height: 20,
    backgroundColor: 'rgba(0, 245, 160, 0.3)',
    borderRadius: 12,
  },

  // Corner animations
  cornersContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopLeftRadius: 12,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: 'transparent',
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopRightRadius: 12,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: 'transparent',
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomLeftRadius: 12,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: 'transparent',
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomRightRadius: 12,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: 'transparent',
  },

  // Voice recording rings
  voiceRingsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Camera scan animations
  cameraScanContainer: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraRotatingBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraGradientBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    opacity: 0.3,
  },
  cameraScanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
  },
  cameraScanLineGradient: {
    width: '100%',
    height: 2,
  },
  cameraCorners: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.accentPurple,
  },
  cameraCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  cameraCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
    borderColor: Colors.accentCyan,
  },
  cameraCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
    borderColor: '#00F5A0',
  },
  cameraCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
    borderColor: '#FFC857',
  },

  // Analyzing animation
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  analyzingSpinner: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 4,
  },
  analyzingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: Spacing.md,
  },

  // Listening dots animation
  listeningDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listeningDotAnimated: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
