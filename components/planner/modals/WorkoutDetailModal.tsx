/**
 * WorkoutDetailModal - Shows detailed workout information when user taps a workout block
 *
 * Features:
 * - Exercise list with sets/reps/weight
 * - Estimated duration and calories
 * - Mark complete / Skip options
 * - Reschedule button
 * - Liquid glass design
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { X, CheckCircle2, Calendar, Dumbbell, Clock } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { NumberText } from '../../NumberText';
import { TimeBlock } from '../../../types/planner';
import { useSettings } from '../../../contexts/SettingsContext';
import { useTraining } from '../../../contexts/TrainingContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  visible: boolean;
  block: TimeBlock | null;
  onClose: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onReschedule: () => void;
}

export function WorkoutDetailModal({
  visible,
  block,
  onClose,
  onComplete,
  onSkip,
  onReschedule,
}: Props) {
  const { settings } = useSettings();
  const { state: trainingState } = useTraining();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  if (!block || !visible) return null;

  // Find workout details from training context
  const getWorkoutDetails = () => {
    // Extract workout ID from block's relatedId
    // For now, show placeholder data - you'll wire to real workout data
    return {
      exercises: [
        { name: 'Barbell Squat', sets: 4, reps: 8, weight: '185 lbs' },
        { name: 'Romanian Deadlift', sets: 3, reps: 10, weight: '135 lbs' },
        { name: 'Leg Press', sets: 3, reps: 12, weight: '270 lbs' },
        { name: 'Walking Lunges', sets: 3, reps: '12 each leg', weight: 'Bodyweight' },
      ],
      estimatedCalories: 320,
      totalDuration: block.duration,
    };
  };

  const workout = getWorkoutDetails();
  const isCompleted = block.status === 'completed';
  const isSkipped = block.status === 'skipped';

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onSkip();
    onClose();
  };

  const handleReschedule = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReschedule();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={isDark ? 80 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          <GlassCard style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Dumbbell size={24} color={block.color || Colors.protein} />
                <Text style={[styles.title, { color: themeColors.text }]}>
                  {block.title}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Time & Duration */}
            <View style={styles.timeRow}>
              <Clock size={16} color={themeColors.textSecondary} />
              <Text style={[styles.timeText, { color: themeColors.textSecondary }]}>
                {block.startTime} – {block.endTime}  ·  <NumberText style={styles.timeText}>{block.duration}</NumberText>m
              </Text>
            </View>

            {/* Estimated Calories */}
            <View style={styles.statsRow}>
              <Text style={[styles.statsLabel, { color: themeColors.textSecondary }]}>
                Estimated Burn:
              </Text>
              <NumberText style={[styles.statsValue, { color: Colors.protein }]}>
                {workout.estimatedCalories}
              </NumberText>
              <Text style={[styles.statsUnit, { color: themeColors.textSecondary }]}>
                kcal
              </Text>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

            {/* Exercise List */}
            <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Exercises
              </Text>
              {workout.exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseRow}>
                  <Text style={[styles.exerciseName, { color: themeColors.text }]}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.exerciseDetails, { color: themeColors.textSecondary }]}>
                    {exercise.sets} × {exercise.reps}  ·  {exercise.weight}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Reschedule */}
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]}
                onPress={handleReschedule}
              >
                <Calendar size={20} color={themeColors.text} />
                <Text style={[styles.secondaryButtonText, { color: themeColors.text }]}>
                  Reschedule
                </Text>
              </TouchableOpacity>

              {/* Skip */}
              {!isCompleted && !isSkipped && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]}
                  onPress={handleSkip}
                >
                  <X size={20} color={themeColors.textSecondary} />
                  <Text style={[styles.secondaryButtonText, { color: themeColors.textSecondary }]}>
                    Skip
                  </Text>
                </TouchableOpacity>
              )}

              {/* Complete */}
              {!isCompleted && !isSkipped && (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: Colors.protein }]}
                  onPress={handleComplete}
                >
                  <CheckCircle2 size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    Mark Complete
                  </Text>
                </TouchableOpacity>
              )}

              {/* Status Badge */}
              {isCompleted && (
                <View style={[styles.statusBadge, { backgroundColor: Colors.protein + '20' }]}>
                  <CheckCircle2 size={18} color={Colors.protein} />
                  <Text style={[styles.statusBadgeText, { color: Colors.protein }]}>
                    Completed
                  </Text>
                </View>
              )}
              {isSkipped && (
                <View style={[styles.statusBadge, { backgroundColor: themeColors.textSecondary + '20' }]}>
                  <X size={18} color={themeColors.textSecondary} />
                  <Text style={[styles.statusBadgeText, { color: themeColors.textSecondary }]}>
                    Skipped
                  </Text>
                </View>
              )}
            </View>
          </GlassCard>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  card: {
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    fontFamily: Fonts.numericRegular,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  statsLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  statsValue: {
    fontSize: 18,
    fontFamily: Fonts.numericSemiBold,
    fontWeight: '600',
  },
  statsUnit: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  exerciseList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    marginBottom: 12,
  },
  exerciseRow: {
    paddingVertical: 12,
    gap: 4,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: Fonts.regular,
  },
  exerciseDetails: {
    fontSize: 13,
    fontFamily: Fonts.numericRegular,
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
});
