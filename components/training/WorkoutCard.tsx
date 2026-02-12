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
      >
        <Ionicons name="play-circle-outline" size={24} color={isDark ? '#fff' : '#333'} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.gifThumbnail} onPress={onPress}>
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
  colors: any;
  isDark: boolean;
}) {
  const exerciseBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';
  const hasGif = !!exercise.exercise.gifUrl;

  return (
    <View style={[styles.exerciseRow, { backgroundColor: exerciseBg, borderColor, borderWidth: 1 }]}>
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
  onViewForm,
}: WorkoutCardProps) {
  const { settings } = useSettings();
  const [showDetails, setShowDetails] = useState(false);
  const [lastWeights, setLastWeights] = useState<Record<string, { weight: number; unit: string } | null>>({});
  const scale = useSharedValue(1);

  // Load last logged weights for all exercises - parallelized for performance
  useEffect(() => {
    const loadLastWeights = async () => {
      // Use Promise.all for parallel loading instead of sequential loop
      const results = await Promise.all(
        workout.exercises.map(async (exercise) => {
          try {
            const lastLog = await weightTrackingStorage.getLastLogForExercise(exercise.exerciseId);
            return {
              exerciseId: exercise.exerciseId,
              data: lastLog && lastLog.maxWeight > 0
                ? { weight: lastLog.maxWeight, unit: lastLog.sets[0]?.unit || 'lb' }
                : null,
            };
          } catch (error) {
            return { exerciseId: exercise.exerciseId, data: null };
          }
        })
      );

      // Build weights object from parallel results
      const weights: Record<string, { weight: number; unit: string } | null> = {};
      for (const result of results) {
        weights[result.exerciseId] = result.data;
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
                <NumberText weight="regular">{completedExercises}</NumberText>/<NumberText weight="regular">{totalExercises}</NumberText> exercises
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
                  +<NumberText weight="regular">{workout.exercises.length - 3}</NumberText> more
                </Text>
              )}
            </View>
          </GlassCard>
        </TouchableOpacity>
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
                  <NumberText weight="light" style={[styles.statValue, { color: colors.text }]}>{workout.duration}</NumberText>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Minutes</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                <View style={styles.statItem}>
                  <NumberText weight="light" style={[styles.statValue, { color: colors.text }]}>{workout.estimatedCaloriesBurned}</NumberText>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Calories</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                <View style={styles.statItem}>
                  <NumberText weight="light" style={[styles.statValue, { color: colors.text }]}>{totalExercises}</NumberText>
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
                  onViewForm={onViewForm ? () => onViewForm(exercise) : undefined}
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
  checkboxButton: {
    padding: 4,
    marginRight: 4,
  },
  gifThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  gifImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  gifLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  gifPlayOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
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
