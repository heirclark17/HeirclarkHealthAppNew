import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { Workout, WorkoutExercise, WeightLog } from '../../types/training';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';
import { weightTrackingStorage } from '../../services/weightTrackingStorage';

interface WorkoutCardProps {
  workout: Workout;
  dayName: string;
  index: number;
  weekNumber?: number;
  onMarkComplete: () => void;
  onExerciseToggle: (exerciseId: string) => void;
  onSwapExercise: (exerciseId: string) => void;
  onShowAlternatives?: (exercise: WorkoutExercise) => void;
  onLogWeight?: (exercise: WorkoutExercise) => void;
}

function ExerciseRow({
  exercise,
  onToggle,
  onSwap,
  onShowAlternatives,
  onLogWeight,
  lastWeight,
  colors,
  isDark,
}: {
  exercise: WorkoutExercise;
  onToggle: () => void;
  onSwap: () => void;
  onShowAlternatives?: () => void;
  onLogWeight?: () => void;
  lastWeight?: { weight: number; unit: string } | null;
  colors: any;
  isDark: boolean;
}) {
  const exerciseBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';
  return (
    <View style={[styles.exerciseRow, { backgroundColor: exerciseBg, borderColor, borderWidth: 1 }]}>
      <TouchableOpacity
        style={styles.exerciseCheckbox}
        onPress={() => {
          lightImpact();
          onToggle();
        }}
      >
        <Ionicons
          name={exercise.completed ? 'checkbox' : 'square-outline'}
          size={22}
          color={exercise.completed ? Colors.protein : colors.textMuted}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.exerciseInfo}
        onPress={() => {
          if (onShowAlternatives) {
            lightImpact();
            onShowAlternatives();
          }
        }}
        disabled={!onShowAlternatives}
      >
        <Text style={[styles.exerciseName, { color: colors.text }, exercise.completed && { color: colors.textMuted, textDecorationLine: 'line-through' }]}>
          {exercise.exercise.name}
        </Text>
        <View style={styles.exerciseDetailsRow}>
          <Text style={[styles.exerciseDetails, { color: colors.textMuted }]}>
            {exercise.sets} sets × {exercise.reps} • {exercise.restSeconds}s rest
          </Text>
          {lastWeight && lastWeight.weight > 0 && (
            <View style={[styles.lastWeightBadge, { backgroundColor: isDark ? 'rgba(76, 217, 100, 0.2)' : 'rgba(76, 217, 100, 0.15)' }]}>
              <Text style={styles.lastWeightText}>
                {lastWeight.weight}{lastWeight.unit}
              </Text>
            </View>
          )}
        </View>
        {onShowAlternatives && (
          <Text style={[styles.alternativesHint, { color: colors.primary }]}>Tap to see alternatives</Text>
        )}
      </TouchableOpacity>
      {/* Weight Log Button */}
      {onLogWeight && (
        <TouchableOpacity
          style={[styles.weightButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
          onPress={() => {
            lightImpact();
            onLogWeight();
          }}
        >
          <Ionicons name="barbell-outline" size={16} color={Colors.protein} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.swapButton}
        onPress={() => {
          lightImpact();
          onSwap();
        }}
      >
        <Ionicons name="swap-horizontal" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

export function WorkoutCard({
  workout,
  dayName,
  index,
  weekNumber = 1,
  onMarkComplete,
  onExerciseToggle,
  onSwapExercise,
  onShowAlternatives,
  onLogWeight,
}: WorkoutCardProps) {
  const { settings } = useSettings();
  const [showDetails, setShowDetails] = useState(false);
  const [lastWeights, setLastWeights] = useState<Record<string, { weight: number; unit: string } | null>>({});
  const scale = useSharedValue(1);

  // Load last logged weights for all exercises
  useEffect(() => {
    const loadLastWeights = async () => {
      const weights: Record<string, { weight: number; unit: string } | null> = {};
      for (const exercise of workout.exercises) {
        try {
          const lastLog = await weightTrackingStorage.getLastLogForExercise(exercise.exerciseId);
          if (lastLog && lastLog.maxWeight > 0) {
            weights[exercise.exerciseId] = {
              weight: lastLog.maxWeight,
              unit: lastLog.sets[0]?.unit || 'lb',
            };
          } else {
            weights[exercise.exerciseId] = null;
          }
        } catch (error) {
          weights[exercise.exerciseId] = null;
        }
      }
      setLastWeights(weights);
    };

    loadLastWeights();
  }, [workout.exercises]);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware backgrounds for inner elements
  const cardBg = isDark ? Colors.card : 'rgba(255, 255, 255, 0.9)';
  const borderColor = isDark ? Colors.border : 'rgba(0, 0, 0, 0.1)';
  const secondaryBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const completedExercises = workout.exercises.filter(e => e.completed).length;
  const totalExercises = workout.exercises.length;
  const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  const getWorkoutTypeIcon = (type: string) => {
    switch (type) {
      case 'strength':
      case 'hypertrophy':
        return 'barbell-outline';
      case 'cardio':
        return 'heart-outline';
      case 'hiit':
        return 'flash-outline';
      case 'flexibility':
        return 'body-outline';
      default:
        return 'fitness-outline';
    }
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'strength':
        return Colors.protein;
      case 'hypertrophy':
        return Colors.carbs;
      case 'cardio':
        return Colors.calories;
      case 'hiit':
        return Colors.fat;
      case 'flexibility':
        return '#3498DB';
      default:
        return Colors.text;
    }
  };

  const typeColor = getWorkoutTypeColor(workout.type);

  return (
    <>
      <Animated.View entering={FadeInUp.delay(index * 100).springify().damping(15)}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            style={[styles.cardWrapper, workout.completed && styles.cardCompleted]}
            onPress={() => {
              lightImpact();
              setShowDetails(true);
            }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
          >
          <GlassCard style={styles.card} interactive>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: `${typeColor}20` }]}>
                <Ionicons name={getWorkoutTypeIcon(workout.type)} size={24} color={typeColor} />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.workoutName, { color: colors.text }]}>{workout.name}</Text>
                <Text style={[styles.workoutMeta, { color: colors.textMuted }]}>
                  {workout.duration} min • {workout.estimatedCaloriesBurned} cal
                </Text>
              </View>
              {workout.completed ? (
                <View style={[styles.completedBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={16} color={colors.primaryText} />
                </View>
              ) : (
                <View style={styles.viewButton}>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
              )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: secondaryBg }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: typeColor }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.textMuted }]}>
                {completedExercises}/{totalExercises} exercises
              </Text>
            </View>

            {/* Exercise Preview */}
            <View style={styles.exercisePreview}>
              {workout.exercises.slice(0, 3).map((ex, i) => (
                <Text key={ex.id || `preview-${i}`} style={[styles.exercisePreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
                  • {ex.exercise.name}
                </Text>
              ))}
              {workout.exercises.length > 3 && (
                <Text style={[styles.moreExercises, { color: colors.textMuted }]}>
                  +{workout.exercises.length - 3} more
                </Text>
              )}
            </View>
          </GlassCard>
        </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Workout Details Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: cardBg }]}
                onPress={() => setShowDetails(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{workout.name}</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>

            {/* Workout Stats - Frosted Liquid Glass */}
            <GlassCard style={styles.statsRow} interactive>
              <View style={styles.statsRowInner}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{workout.duration}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Minutes</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{workout.estimatedCaloriesBurned}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Calories</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{totalExercises}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Exercises</Text>
                </View>
              </View>
            </GlassCard>

            {/* Exercise List */}
            <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>EXERCISES</Text>
              {workout.exercises.map((exercise, index) => (
                <ExerciseRow
                  key={exercise.id || `exercise-${index}`}
                  exercise={exercise}
                  onToggle={() => onExerciseToggle(exercise.id)}
                  onSwap={() => onSwapExercise(exercise.id)}
                  onShowAlternatives={onShowAlternatives ? () => onShowAlternatives(exercise) : undefined}
                  onLogWeight={onLogWeight ? () => onLogWeight(exercise) : undefined}
                  lastWeight={lastWeights[exercise.exerciseId]}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Complete Workout Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.completeButton, { backgroundColor: colors.primary }, workout.completed && [styles.completeButtonDone, { backgroundColor: cardBg, borderColor }]]}
                onPress={() => {
                  mediumImpact();
                  onMarkComplete();
                  setShowDetails(false);
                }}
                disabled={workout.completed}
              >
                <Ionicons
                  name={workout.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={22}
                  color={workout.completed ? colors.text : colors.primaryText}
                />
                <Text style={[styles.completeButtonText, { color: colors.primaryText }, workout.completed && { color: colors.text }]}>
                  {workout.completed ? 'Workout Completed' : 'Mark as Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    // GlassCard handles styling
  },
  cardCompleted: {
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  workoutName: {
    fontSize: 17,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  workoutMeta: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.thin,
    marginTop: 2,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  exercisePreview: {
    paddingTop: 8,
  },
  exercisePreviewText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.light,
    marginBottom: 4,
  },
  moreExercises: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  statsRow: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsRowInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    color: Colors.text,
    fontFamily: Fonts.thin,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
    marginBottom: 12,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  exerciseCheckbox: {
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  exerciseCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  exerciseDetails: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  alternativesHint: {
    fontSize: 10,
    color: Colors.primary,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  exerciseDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  lastWeightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lastWeightText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: '#4CD964',
  },
  weightButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  swapButton: {
    padding: 8,
  },
  modalFooter: {
    padding: 16,
    paddingBottom: 32,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Spacing.borderRadius,
    gap: 8,
  },
  completeButtonDone: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completeButtonText: {
    fontSize: 16,
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
  },
  completeButtonTextDone: {
    color: Colors.text,
  },
});
