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
import { Dumbbell, CircleArrowUp, CircleArrowDown, User, Circle, Footprints, Zap, Heart, Leaf, Bed, Activity, BicepsFlexed } from 'lucide-react-native';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { NumberText } from './NumberText';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';
import { lightImpact, selectionFeedback } from '../utils/haptics';

// Workout type icons and colors
const WORKOUT_TYPE_CONFIG: Record<string, { Icon: React.ComponentType<{ size: number; color: string }>; color: string }> = {
  'Leg Day': { Icon: Dumbbell, color: Colors.error },
  'Upper Body': { Icon: Dumbbell, color: Colors.success },
  'Lower Body': { Icon: Dumbbell, color: Colors.error },
  'Push Day': { Icon: CircleArrowUp, color: '#F39C12' },
  'Pull Day': { Icon: CircleArrowDown, color: '#9B59B6' },
  'Full Body': { Icon: User, color: '#3498DB' },
  'Core': { Icon: Circle, color: '#E74C3C' },
  'Walking Session': { Icon: Footprints, color: Colors.success },
  'Running Session': { Icon: Footprints, color: Colors.error },
  'HIIT': { Icon: Zap, color: '#F39C12' },
  'Cardio': { Icon: Heart, color: '#E74C3C' },
  'Recovery': { Icon: Leaf, color: Colors.successMuted },
  'Yoga': { Icon: Leaf, color: '#9B59B6' },
  'Rest Day': { Icon: Bed, color: Colors.textMuted },
  'Workout': { Icon: BicepsFlexed, color: Colors.success },
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
  const displayColor = isCompleted ? Colors.success : config.color;

  // Truncate long workout names
  const truncatedType = displayType.length > 12 ? displayType.substring(0, 10) + '...' : displayType;

  return (
    <>
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={{ flex: 1 }}>
        <GlassCard style={styles.card} interactive>
          <View style={styles.innerContainer}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <config.Icon size={24} color={colors.text} />
            </View>

            {/* Label */}
            <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
              WORKOUT
            </Text>

            {/* Workout Name */}
            <Text
              style={[styles.value, { color: colors.text }]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {isRestDay ? 'Rest Day' : (propWorkoutName || workoutType)}
            </Text>

            {/* Subtitle */}
            {!isRestDay && workoutType && (
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                today
              </Text>
            )}
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
            style={[styles.modalContent, { backgroundColor: isDark ? Colors.card : Colors.text }]}
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
                color={isCompleted ? Colors.success : isRestDay ? Colors.textMuted : Colors.error}
              />
              <Text style={[styles.statusBadgeText, { color: isCompleted ? Colors.success : isRestDay ? Colors.textMuted : Colors.error }]}>
                {isCompleted ? 'Completed' : isRestDay ? 'Rest Day' : 'Scheduled'}
              </Text>
            </View>
            <Text style={[styles.modalStat, { color: colors.textMuted }]}>
              <NumberText weight="regular">{weeklyCount}</NumberText> workouts this week
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
    fontSize: 18,
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
