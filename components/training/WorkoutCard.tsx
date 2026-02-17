import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Image, ActivityIndicator } from 'react-native';
import Animated, {
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
import { NumberText } from '../NumberText';
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
  onViewForm?: (exercise: WorkoutExercise) => void;
}

function ExerciseGifThumbnail({
  gifUrl,
  onPress,
  isDark
}: {
  gifUrl: string;
  onPress: () => void;
  isDark: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <TouchableOpacity
        style={[styles.gifThumbnail, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}
        onPress={onPress}
        accessibilityLabel="Play exercise form demonstration"
        accessibilityRole="button"
        accessibilityHint="Opens a video showing proper exercise form and technique"
      >
        <Ionicons name="play-circle-outline" size={24} color={isDark ? '#fff' : '#333'} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.gifThumbnail}
      onPress={onPress}
      accessibilityLabel="Play exercise form demonstration"
      accessibilityRole="button"
      accessibilityHint="Opens a video showing proper exercise form and technique"
    >
      {loading && (
        <View style={[styles.gifLoading, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
          <ActivityIndicator size="small" color={isDark ? '#fff' : '#333'} />
        </View>
      )}
      <Image
        source={{ uri: gifUrl }}
        style={styles.gifImage}
        resizeMode="cover"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      <View style={styles.gifPlayOverlay}>
        <Ionicons name="play-circle" size={20} color="rgba(255, 255, 255, 0.9)" />
      </View>
    </TouchableOpacity>
  );
}

function ExerciseRow({
  exercise,
  onToggle,
  onSwap,
  onShowAlternatives,
  onLogWeight,
  onViewForm,
  lastWeight,
  overloadTrend,
  colors,
  isDark,
}: {
  exercise: WorkoutExercise;
  onToggle: () => void;
  onSwap: () => void;
  onShowAlternatives?: () => void;
  onLogWeight?: () => void;
  onViewForm?: () => void;
  lastWeight?: { weight: number; unit: string } | null;
  overloadTrend?: 'increasing' | 'stable' | 'decreasing' | null;
  colors: any;
  isDark: boolean;
}) {
  const exerciseBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';
  const hasGif = !!exercise.exercise.gifUrl;

  return (
    <View style={[styles.exerciseRow, { backgroundColor: exerciseBg }]}>
      {/* GIF Thumbnail - shows animated form demo */}
      {hasGif && onViewForm ? (
        <ExerciseGifThumbnail
          gifUrl={exercise.exercise.gifUrl!}
          onPress={() => {
            lightImpact();
            onViewForm();
          }}
          isDark={isDark}
        />
      ) : (
        <TouchableOpacity
          style={styles.exerciseCheckbox}
          onPress={() => {
            lightImpact();
            onToggle();
          }}
          accessibilityLabel={`${exercise.exercise.name}${exercise.completed ? ', completed' : ', not completed'}`}
          accessibilityRole="button"
          accessibilityState={{ checked: exercise.completed }}
          accessibilityHint={exercise.completed ? 'Marks exercise as incomplete' : 'Marks exercise as complete'}
        >
          <Ionicons
            name={exercise.completed ? 'checkbox' : 'square-outline'}
            size={22}
            color={exercise.completed ? Colors.protein : colors.textMuted}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.exerciseInfo}
        onPress={() => {
          if (onShowAlternatives) {
            lightImpact();
            onShowAlternatives();
          }
        }}
        disabled={!onShowAlternatives}
        accessibilityLabel={`${exercise.exercise.name}, ${exercise.sets} sets of ${exercise.reps}, ${exercise.restSeconds} seconds rest${hasGif ? ', tap GIF for form guide' : onShowAlternatives ? ', tap to see alternatives' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !onShowAlternatives }}
        accessibilityHint={onShowAlternatives ? 'Shows alternative exercises for this movement pattern' : undefined}
      >
        <Text style={[styles.exerciseName, { color: colors.text }, exercise.completed && { color: colors.textMuted, textDecorationLine: 'line-through' }]}>
          {exercise.exercise.name}
        </Text>
        <View style={styles.exerciseDetailsRow}>
          <Text style={[styles.exerciseDetails, { color: colors.textMuted }]}>
            <NumberText weight="regular">{exercise.sets}</NumberText> sets × <NumberText weight="regular">{exercise.reps}</NumberText> • <NumberText weight="regular">{exercise.restSeconds}</NumberText>s rest
          </Text>
          {lastWeight && lastWeight.weight > 0 && (
            <View style={[styles.lastWeightBadge, { backgroundColor: isDark ? 'rgba(76, 217, 100, 0.2)' : 'rgba(76, 217, 100, 0.15)' }]}>
              <Text style={styles.lastWeightText}>
                <NumberText weight="regular">{lastWeight.weight}</NumberText>{lastWeight.unit}
              </Text>
            </View>
          )}
          {overloadTrend && (
            <View style={[
              styles.trendBadge,
              {
                backgroundColor: overloadTrend === 'increasing'
                  ? (isDark ? 'rgba(76, 217, 100, 0.25)' : 'rgba(76, 217, 100, 0.2)')
                  : overloadTrend === 'decreasing'
                    ? (isDark ? 'rgba(255, 69, 58, 0.25)' : 'rgba(255, 69, 58, 0.2)')
                    : (isDark ? 'rgba(255, 204, 0, 0.25)' : 'rgba(255, 204, 0, 0.2)'),
              },
            ]}>
              <Ionicons
                name={overloadTrend === 'increasing' ? 'trending-up' : overloadTrend === 'decreasing' ? 'trending-down' : 'remove'}
                size={12}
                color={overloadTrend === 'increasing' ? '#4CD964' : overloadTrend === 'decreasing' ? '#FF453A' : '#FFCC00'}
              />
            </View>
          )}
          {!overloadTrend && lastWeight === null && (
            <Text style={[styles.newExerciseText, { color: colors.textMuted }]}>NEW</Text>
          )}
        </View>
        {hasGif ? (
          <Text style={[styles.alternativesHint, { color: colors.primary }]}>Tap GIF for form guide</Text>
        ) : onShowAlternatives ? (
          <Text style={[styles.alternativesHint, { color: colors.primary }]}>Tap to see alternatives</Text>
        ) : null}
      </TouchableOpacity>
      {/* Checkbox when GIF is present */}
      {hasGif && (
        <TouchableOpacity
          style={styles.checkboxButton}
          onPress={() => {
            lightImpact();
            onToggle();
          }}
          accessibilityLabel={`${exercise.exercise.name}${exercise.completed ? ', completed' : ', not completed'}`}
          accessibilityRole="button"
          accessibilityState={{ checked: exercise.completed }}
          accessibilityHint={exercise.completed ? 'Marks exercise as incomplete' : 'Marks exercise as complete'}
        >
          <Ionicons
            name={exercise.completed ? 'checkbox' : 'square-outline'}
            size={20}
            color={exercise.completed ? Colors.protein : colors.textMuted}
          />
        </TouchableOpacity>
      )}
      {/* Weight Log Button */}
      {onLogWeight && (
        <TouchableOpacity
          style={[styles.weightButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
          onPress={() => {
            lightImpact();
            onLogWeight();
          }}
          accessibilityLabel={`Log weight for ${exercise.exercise.name}`}
          accessibilityRole="button"
          accessibilityHint="Opens weight logging interface to track weight lifted for this exercise"
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
        accessibilityLabel={`Swap ${exercise.exercise.name} with alternative exercise`}
        accessibilityRole="button"
        accessibilityHint="Replaces this exercise with a different one targeting the same muscle groups"
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
  onViewForm,
}: WorkoutCardProps) {
  const { settings } = useSettings();
  const [lastWeights, setLastWeights] = useState<Record<string, { weight: number; unit: string } | null>>({});
  const [exerciseTrends, setExerciseTrends] = useState<Record<string, 'increasing' | 'stable' | 'decreasing' | null>>({});
  const scale = useSharedValue(1);

  // Load last logged weights and overload trends for all exercises - parallelized
  useEffect(() => {
    const loadExerciseData = async () => {
      const results = await Promise.all(
        workout.exercises.map(async (exercise) => {
          try {
            const [lastLog, progress] = await Promise.all([
              weightTrackingStorage.getLastLogForExercise(exercise.exerciseId),
              weightTrackingStorage.getExerciseProgress(exercise.exerciseId, exercise.exercise.name),
            ]);
            return {
              exerciseId: exercise.exerciseId,
              lastWeight: lastLog && lastLog.maxWeight > 0
                ? { weight: lastLog.maxWeight, unit: lastLog.sets[0]?.unit || 'lb' }
                : null,
              trend: progress?.trend || null,
            };
          } catch (error) {
            return { exerciseId: exercise.exerciseId, lastWeight: null, trend: null };
          }
        })
      );

      const weights: Record<string, { weight: number; unit: string } | null> = {};
      const trends: Record<string, 'increasing' | 'stable' | 'decreasing' | null> = {};
      for (const result of results) {
        weights[result.exerciseId] = result.lastWeight;
        trends[result.exerciseId] = result.trend;
      }
      setLastWeights(weights);
      setExerciseTrends(trends);
    };

    loadExerciseData();
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
        return Colors.accentCyan;
      default:
        return Colors.text;
    }
  };

  const typeColor = getWorkoutTypeColor(workout.type);

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.cardWrapper, workout.completed && styles.cardCompleted]}>
        <GlassCard style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${typeColor}20` }]}>
              <Ionicons name={getWorkoutTypeIcon(workout.type)} size={24} color={typeColor} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.workoutName, { color: colors.text }]}>{workout.name}</Text>
              <Text style={[styles.workoutMeta, { color: colors.textMuted }]}>
                <NumberText weight="regular">{workout.duration}</NumberText> min • <NumberText weight="regular">{workout.estimatedCaloriesBurned}</NumberText> cal
              </Text>
            </View>
            {workout.completed && (
              <View style={[styles.completedBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={16} color={colors.primaryText} />
              </View>
            )}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: secondaryBg }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: typeColor }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.textMuted }]}>
              <NumberText weight="regular">{completedExercises}</NumberText>/<NumberText weight="regular">{totalExercises}</NumberText> exercises
            </Text>
          </View>

          {/* Workout Stats */}
          <View style={styles.statsRowInline}>
            <GlassCard style={styles.statCard}>
              <NumberText weight="light" style={[styles.statValue, { color: colors.text }]}>{workout.duration}</NumberText>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Minutes</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <NumberText weight="light" style={[styles.statValue, { color: colors.text }]}>{workout.estimatedCaloriesBurned}</NumberText>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Calories</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <NumberText weight="light" style={[styles.statValue, { color: colors.text }]}>{totalExercises}</NumberText>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Exercises</Text>
            </GlassCard>
          </View>

          {/* Exercise List */}
          <View style={styles.exerciseListInline}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>EXERCISES</Text>
            {workout.exercises.map((exercise, index) => (
              <ExerciseRow
                key={exercise.id || `exercise-${index}`}
                exercise={exercise}
                onToggle={() => onExerciseToggle(exercise.id)}
                onSwap={() => onSwapExercise(exercise.id)}
                onShowAlternatives={onShowAlternatives ? () => onShowAlternatives(exercise) : undefined}
                onLogWeight={onLogWeight ? () => onLogWeight(exercise) : undefined}
                onViewForm={onViewForm ? () => onViewForm(exercise) : undefined}
                lastWeight={lastWeights[exercise.exerciseId]}
                overloadTrend={exerciseTrends[exercise.exerciseId]}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </View>

          {/* Complete Workout Button */}
          <TouchableOpacity
            style={[styles.completeButtonInline, { backgroundColor: colors.primary }, workout.completed && [styles.completeButtonDone, { backgroundColor: cardBg }]]}
            onPress={() => {
              mediumImpact();
              onMarkComplete();
            }}
            disabled={workout.completed}
            accessibilityLabel={workout.completed ? `${workout.name} completed` : `Mark ${workout.name} as complete`}
            accessibilityRole="button"
            accessibilityState={{ disabled: workout.completed }}
            accessibilityHint={workout.completed ? 'Workout has been completed' : `Marks all ${totalExercises} exercises as complete and logs ${workout.estimatedCaloriesBurned} calories burned`}
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
        </GlassCard>
      </View>
    </Animated.View>
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
    borderRadius: 24,
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
    borderRadius: 12,
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

  // Inline expanded styles (always visible)
  statsRowInline: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
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
  exerciseListInline: {
    marginBottom: 16,
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
  checkboxButton: {
    padding: 4,
    marginRight: 4,
  },
  gifThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  gifImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  gifLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  gifPlayOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 2,
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
    borderRadius: 8,
  },
  lastWeightText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: Colors.success,
  },
  trendBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  newExerciseText: {
    fontSize: 9,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
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
  completeButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Spacing.borderRadius,
    gap: 8,
    marginTop: 8,
  },
  completeButtonDone: {
    backgroundColor: 'transparent',
  },
  completeButtonText: {
    fontSize: 16,
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
  },
});
