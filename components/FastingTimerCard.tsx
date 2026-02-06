// FastingTimerCard - Compact Intermittent Fasting Timer
// Matches the size of health metric cards (Steps, Active Energy, etc.)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';
import { useFastingTimer, FASTING_PRESETS, FastingPresetId } from '../contexts/FastingTimerContext';
import { lightImpact, selectionFeedback } from '../utils/haptics';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

interface FastingTimerCardProps {
  onPress?: () => void;
}

export function FastingTimerCard({ onPress }: FastingTimerCardProps) {
  const { settings } = useSettings();
  const {
    state,
    startFast,
    pauseFast,
    resumeFast,
    stopFast,
    resetTimer,
    setPreset,
    getTimeRemaining,
    getProgress,
    getFastingDuration,
    syncWithGoalWizard,
  } = useFastingTimer();

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());
  const [progress, setProgress] = useState(getProgress());
  const [showControlsModal, setShowControlsModal] = useState(false);

  // Sync with goal wizard on mount
  useEffect(() => {
    syncWithGoalWizard();
  }, []);

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
      setProgress(getProgress());
    }, 1000);
    return () => clearInterval(interval);
  }, [getTimeRemaining, getProgress]);

  const formatTime = (hours: number, minutes: number) => {
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const handlePress = async () => {
    await lightImpact();
    if (onPress) {
      onPress();
    } else {
      setShowControlsModal(true);
    }
  };

  const handleStartPause = async () => {
    await lightImpact();
    if (!state.isActive) {
      startFast();
    } else if (state.isPaused) {
      resumeFast();
    } else {
      pauseFast();
    }
  };

  const handleReset = async () => {
    await selectionFeedback();
    resetTimer();
  };

  const handlePresetSelect = async (presetId: FastingPresetId) => {
    await selectionFeedback();
    setPreset(presetId);
  };

  const selectedPreset = FASTING_PRESETS.find(p => p.id === state.selectedPreset);
  const isFasting = state.isActive && state.currentState === 'fasting';
  const displayColor = isFasting ? Colors.error : state.isActive ? Colors.success : colors.textMuted;

  // Pulse animation for active fasting
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = withSpring(1, GLASS_SPRING);
    }
  }, [state.isActive, state.isPaused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // State label
  const getStateLabel = () => {
    if (!state.isActive) return 'Ready';
    if (state.isPaused) return 'Paused';
    if (state.currentState === 'fasting') return 'Fasting';
    return 'Eating';
  };

  return (
    <>
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={{ flex: 1 }}>
        <GlassCard style={styles.card} interactive>
          <View style={styles.innerContainer}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <Ionicons name="alarm-outline" size={24} color={colors.text} />
            </View>

            {/* Label */}
            <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
              FASTING
            </Text>

            {/* Timer Display */}
            <Animated.Text style={[styles.value, { color: colors.text }, animatedStyle]}>
              {state.isActive
                ? formatTime(timeRemaining.hours, timeRemaining.minutes)
                : selectedPreset?.label || '16:8'
              }
            </Animated.Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {getStateLabel()}
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>

      {/* Controls Modal */}
      <Modal
        visible={showControlsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowControlsModal(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={() => setShowControlsModal(false)}
        >
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.modalContent, { backgroundColor: isDark ? Colors.card : Colors.text }]}
          >
            {/* Timer Circle */}
            <View style={[styles.timerCircle, { borderColor: displayColor }]}>
              <Text style={[styles.timerText, { color: colors.text }]}>
                {state.isActive
                  ? `${timeRemaining.hours.toString().padStart(2, '0')}:${timeRemaining.minutes.toString().padStart(2, '0')}:${timeRemaining.seconds.toString().padStart(2, '0')}`
                  : selectedPreset?.label || '16:8'
                }
              </Text>
              <Text style={[styles.timerStateText, { color: displayColor }]}>
                {getStateLabel()}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                onPress={handleReset}
                disabled={!state.isActive}
              >
                <Ionicons name="refresh" size={22} color={state.isActive ? colors.textMuted : 'rgba(128,128,128,0.3)'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: state.isActive && !state.isPaused ? Colors.error : Colors.success }]}
                onPress={handleStartPause}
              >
                <Ionicons
                  name={!state.isActive ? 'play' : (state.isPaused ? 'play' : 'pause')}
                  size={28}
                  color={Colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => {
                  stopFast();
                  setShowControlsModal(false);
                }}
                disabled={!state.isActive}
              >
                <Ionicons name="stop" size={22} color={state.isActive ? colors.textMuted : 'rgba(128,128,128,0.3)'} />
              </TouchableOpacity>
            </View>

            {/* Preset Selection */}
            <Text style={[styles.presetsTitle, { color: colors.textMuted }]}>FASTING PLANS</Text>
            <View style={styles.presetsGrid}>
              {FASTING_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetChip,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                    state.selectedPreset === preset.id && {
                      backgroundColor: '#96CEB420',
                      borderColor: Colors.successMuted,
                      borderWidth: 1,
                    }
                  ]}
                  onPress={() => handlePresetSelect(preset.id)}
                >
                  <Text style={[
                    styles.presetChipText,
                    { color: colors.text },
                    state.selectedPreset === preset.id && { color: Colors.successMuted }
                  ]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats */}
            <View style={[styles.statsRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{state.completedFastsThisWeek}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>This Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{state.currentStreak}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Streak</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={() => setShowControlsModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 9,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontFamily: Fonts.light,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  timerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 28,
    fontFamily: Fonts.bold,
  },
  timerStateText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsTitle: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  presetChipText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: Fonts.bold,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  closeButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
});

export default FastingTimerCard;
