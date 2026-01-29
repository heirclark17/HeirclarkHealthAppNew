// TodaysWorkoutCard - Compact display for today's scheduled workout
// Matches the size of health metric cards (Steps, Active Energy, etc.)

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';
import { lightImpact, selectionFeedback } from '../utils/haptics';

// Workout type icons and colors
const WORKOUT_TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  'Leg Day': { icon: 'fitness', color: '#FF6B6B' },
  'Upper Body': { icon: 'barbell', color: '#4ECDC4' },
  'Lower Body': { icon: 'fitness', color: '#FF6B6B' },
  'Push Day': { icon: 'arrow-up-circle', color: '#F39C12' },
  'Pull Day': { icon: 'arrow-down-circle', color: '#9B59B6' },
  'Full Body': { icon: 'body', color: '#3498DB' },
  'Core': { icon: 'radio-button-on', color: '#E74C3C' },
  'Walking Session': { icon: 'walk', color: '#4ECDC4' },
  'Running Session': { icon: 'footsteps', color: '#FF6B6B' },
  'HIIT': { icon: 'flash', color: '#F39C12' },
  'Cardio': { icon: 'heart', color: '#E74C3C' },
  'Recovery': { icon: 'leaf', color: '#96CEB4' },
  'Yoga': { icon: 'leaf', color: '#9B59B6' },
  'Rest Day': { icon: 'bed', color: '#888888' },
  'Workout': { icon: 'fitness', color: '#4ECDC4' },
};

const getWorkoutConfig = (workoutType: string) => {
  if (WORKOUT_TYPE_CONFIG[workoutType]) {
    return WORKOUT_TYPE_CONFIG[workoutType];
  }
  const lowerType = workoutType.toLowerCase();
  if (lowerType.includes('leg')) return WORKOUT_TYPE_CONFIG['Leg Day'];
  if (lowerType.includes('upper')) return WORKOUT_TYPE_CONFIG['Upper Body'];
  if (lowerType.includes('push')) return WORKOUT_TYPE_CONFIG['Push Day'];
  if (lowerType.includes('pull')) return WORKOUT_TYPE_CONFIG['Pull Day'];
  if (lowerType.includes('full')) return WORKOUT_TYPE_CONFIG['Full Body'];
  if (lowerType.includes('walk')) return WORKOUT_TYPE_CONFIG['Walking Session'];
  if (lowerType.includes('run')) return WORKOUT_TYPE_CONFIG['Running Session'];
  if (lowerType.includes('hiit')) return WORKOUT_TYPE_CONFIG['HIIT'];
  if (lowerType.includes('cardio')) return WORKOUT_TYPE_CONFIG['Cardio'];
  if (lowerType.includes('yoga')) return WORKOUT_TYPE_CONFIG['Yoga'];
  if (lowerType.includes('rest')) return WORKOUT_TYPE_CONFIG['Rest Day'];
  return WORKOUT_TYPE_CONFIG['Workout'];
};

interface TodaysWorkoutCardProps {
  onPress?: () => void;
  workoutType?: string;
  workoutName?: string;
  isRestDay?: boolean;
  isCompleted?: boolean;
  weeklyCount?: number;
}

export function TodaysWorkoutCard({
  onPress,
  workoutType: propWorkoutType,
  workoutName: propWorkoutName,
  isRestDay: propIsRestDay = false,
  isCompleted: propIsCompleted = false,
  weeklyCount = 0,
}: TodaysWorkoutCardProps) {
  const { settings } = useSettings();
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const workoutType = propWorkoutType || 'No Workout';
  const isRestDay = propIsRestDay;
  const isCompleted = propIsCompleted;

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handlePress = async () => {
    await lightImpact();
    if (onPress) {
      onPress();
    } else {
      setShowDetailsModal(true);
    }
  };

  const displayType = isRestDay ? 'Rest Day' : workoutType;
  const config = getWorkoutConfig(isRestDay ? 'Rest Day' : workoutType);
  const displayColor = isCompleted ? '#4ECDC4' : config.color;

  // Truncate long workout names
  const truncatedType = displayType.length > 12 ? displayType.substring(0, 10) + '...' : displayType;

  return (
    <>
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={{ flex: 1 }}>
        <GlassCard style={styles.card} interactive>
          <View style={styles.innerContainer}>
            {/* Label */}
            <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
              WORKOUT
            </Text>

            {/* Workout Name - stylish display */}
            <View style={styles.valueContainer}>
              <Text
                style={[styles.value, { color: isRestDay ? colors.textMuted : displayColor }]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {isRestDay ? 'Rest Day' : (propWorkoutName || workoutType)}
              </Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={() => setShowDetailsModal(false)}
        >
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}
          >
            <View style={[styles.modalIconContainer, { backgroundColor: `${displayColor}20` }]}>
              <Ionicons name={config.icon} size={48} color={displayColor} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{displayType}</Text>
            {propWorkoutName && propWorkoutName !== workoutType && (
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>{propWorkoutName}</Text>
            )}
            <View style={[styles.statusBadge, { backgroundColor: isCompleted ? 'rgba(78, 205, 196, 0.15)' : isRestDay ? 'rgba(136, 136, 136, 0.15)' : 'rgba(255, 107, 107, 0.15)' }]}>
              <Ionicons
                name={isCompleted ? 'checkmark-circle' : isRestDay ? 'bed' : 'time'}
                size={16}
                color={isCompleted ? '#4ECDC4' : isRestDay ? '#888888' : '#FF6B6B'}
              />
              <Text style={[styles.statusBadgeText, { color: isCompleted ? '#4ECDC4' : isRestDay ? '#888888' : '#FF6B6B' }]}>
                {isCompleted ? 'Completed' : isRestDay ? 'Rest Day' : 'Scheduled'}
              </Text>
            </View>
            <Text style={[styles.modalStat, { color: colors.textMuted }]}>
              {weeklyCount} workouts this week
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={() => setShowDetailsModal(false)}
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
    width: '100%',
  },
  label: {
    fontSize: 9,
    fontFamily: Fonts.regular,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 12,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  value: {
    fontSize: 30,
    fontFamily: Fonts.light,
    textAlign: 'center',
    lineHeight: 34,
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
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: Fonts.light,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    marginBottom: 16,
  },
  statusBadgeText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  modalStat: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginBottom: 20,
  },
  closeButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
  },
});

export default TodaysWorkoutCard;
