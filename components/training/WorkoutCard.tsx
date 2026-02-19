import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeftRight, BicepsFlexed, Dumbbell } from 'lucide-react-native';
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
  onViewProgress?: () => void;
  onSwitchEquipment?: (equipmentKey: string) => void;
  currentEquipmentLabel?: string | null;
  availableEquipment?: { key: string; label: string }[];
  isSwappingEquipment?: boolean;
}

// Helper: check if weight string contains a numeric value (not just "bodyweight")
function isNumericWeight(w?: string): boolean {
  if (!w) return false;
  return /\d/.test(w) && !w.toLowerCase().includes('bodyweight');
}

// Helper: extract numeric value from weight string like "135 lbs"
function parseWeightValue(w: string): string {
  const m = w.match(/(\d+(?:\.\d+)?)/);
  return m ? m[1] : w;
}

// Helper: extract unit from weight string
function parseWeightUnit(w: string): string {
  const m = w.match(/\d+(?:\.\d+)?\s*(lbs?|kg)/i);
  return m ? m[1] : 'lb';
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
  suggestedNext,
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
  suggestedNext?: number | null;
  colors: any;
  isDark: boolean;
}) {
  const exerciseBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';
  return (
    <View style={[styles.exerciseRow, { backgroundColor: exerciseBg }]}>
      {/* Checkbox */}
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
        <View style={[
          styles.circleCheckbox,
          { backgroundColor: exercise.completed ? Colors.protein : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
        ]}>
          {exercise.completed && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>
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
        accessibilityLabel={`${exercise.exercise.name}, ${exercise.sets} sets of ${exercise.reps}, ${exercise.restSeconds} seconds rest${onShowAlternatives ? ', tap to see alternatives' : ''}`}
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
          {/* Priority 1: User has logged weight history */}
          {lastWeight && lastWeight.weight > 0 && (
            <View style={[styles.lastWeightBadge, { backgroundColor: isDark ? 'rgba(76, 217, 100, 0.2)' : 'rgba(76, 217, 100, 0.15)' }]}>
              <Text style={styles.lastWeightText}>
                <NumberText weight="regular">{lastWeight.weight}</NumberText>{lastWeight.unit}
              </Text>
            </View>
          )}
          {/* Priority 1b: Next weight suggestion when history exists */}
          {lastWeight && lastWeight.weight > 0 && suggestedNext && suggestedNext > lastWeight.weight && (
            <Text style={styles.nextWeightHint}>
              Next: <NumberText weight="regular">{suggestedNext}</NumberText>{lastWeight.unit}
            </Text>
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
          {/* Priority 2: AI-generated target weight (no user history) */}
          {!(lastWeight && lastWeight.weight > 0) && isNumericWeight(exercise.weight) && (
            <View style={[styles.targetWeightBadge, { backgroundColor: isDark ? 'rgba(94, 169, 221, 0.2)' : 'rgba(94, 169, 221, 0.15)' }]}>
              <Ionicons name="fitness-outline" size={10} color="#5EA9DD" style={{ marginRight: 3 }} />
              <Text style={styles.targetWeightText}>
                Target <NumberText weight="regular">{parseWeightValue(exercise.weight!)}</NumberText>{parseWeightUnit(exercise.weight!)}
              </Text>
            </View>
          )}
          {/* Priority 3: No data at all */}
          {!overloadTrend && !(lastWeight && lastWeight.weight > 0) && !isNumericWeight(exercise.weight) && (
            <Text style={[styles.newExerciseText, { color: colors.textMuted }]}>NEW</Text>
          )}
        </View>
        {onShowAlternatives ? (
          <Text style={[styles.alternativesHint, { color: colors.primary }]}>Tap to see alternatives</Text>
        ) : null}
      </TouchableOpacity>
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
        <Text style={[styles.swapText, { color: colors.textMuted }]}>Swap</Text>
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
  onViewProgress,
  onSwitchEquipment,
  currentEquipmentLabel,
  availableEquipment,
  isSwappingEquipment,
}: WorkoutCardProps) {
  const { settings } = useSettings();
  const [lastWeights, setLastWeights] = useState<Record<string, { weight: number; unit: string } | null>>({});
  const [exerciseTrends, setExerciseTrends] = useState<Record<string, 'increasing' | 'stable' | 'decreasing' | null>>({});
  const [suggestedWeights, setSuggestedWeights] = useState<Record<string, number | null>>({});
  const scale = useSharedValue(1);

  // Load last logged weights, overload trends, and suggested next weights - parallelized
  useEffect(() => {
    const loadExerciseData = async () => {
      // Include warmup and cooldown in data loading
      const allExercises = [
        ...(workout.warmup || []),
        ...workout.exercises,
        ...(workout.cooldown || []),
      ];

      const results = await Promise.all(
        allExercises.map(async (exercise) => {
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
              suggestedNext: progress?.suggestedNextWeight || null,
            };
          } catch (error) {
            return { exerciseId: exercise.exerciseId, lastWeight: null, trend: null, suggestedNext: null };
          }
        })
      );

      const weights: Record<string, { weight: number; unit: string } | null> = {};
      const trends: Record<string, 'increasing' | 'stable' | 'decreasing' | null> = {};
      const suggested: Record<string, number | null> = {};
      for (const result of results) {
        weights[result.exerciseId] = result.lastWeight;
        trends[result.exerciseId] = result.trend;
        suggested[result.exerciseId] = result.suggestedNext;
      }
      setLastWeights(weights);
      setExerciseTrends(trends);
      setSuggestedWeights(suggested);
    };

    loadExerciseData();
  }, [workout.exercises, workout.warmup, workout.cooldown]);

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

  // Calculate total including warmup and cooldown
  const allExercises = [
    ...(workout.warmup || []),
    ...workout.exercises,
    ...(workout.cooldown || []),
  ];
  const completedExercises = allExercises.filter(e => e.completed).length;
  const totalExercises = allExercises.length;
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

  // Group exercises by muscle group
  const groupedExercises = useMemo(() => {
    const groups = new Map<string, WorkoutExercise[]>();

    for (const exercise of workout.exercises) {
      const muscleGroup = exercise.exercise.primaryMuscle || 'other';
      if (!groups.has(muscleGroup)) {
        groups.set(muscleGroup, []);
      }
      groups.get(muscleGroup)!.push(exercise);
    }

    // Sort groups by typical workout order (chest → back → shoulders → biceps → triceps → quads → hamstrings → calves)
    const muscleOrder = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'calves', 'glutes', 'core', 'forearms'];
    const sorted = Array.from(groups.entries()).sort(([a], [b]) => {
      const aIdx = muscleOrder.indexOf(a);
      const bIdx = muscleOrder.indexOf(b);
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });

    return sorted;
  }, [workout.exercises]);

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.cardWrapper, workout.completed && styles.cardCompleted]}>
        <GlassCard style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${typeColor}20` }]}>
              <BicepsFlexed size={24} color={colors.text} />
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
              <NumberText weight="semiBold" style={[styles.statValue, { color: colors.text }]}>{workout.duration}</NumberText>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Minutes</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <NumberText weight="semiBold" style={[styles.statValue, { color: colors.text }]}>{workout.estimatedCaloriesBurned}</NumberText>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Calories</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <NumberText weight="semiBold" style={[styles.statValue, { color: colors.text }]}>{totalExercises}</NumberText>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Exercises</Text>
            </GlassCard>
          </View>

          {/* Switch Equipment Card */}
          {onSwitchEquipment && availableEquipment && availableEquipment.length > 0 && (
            <GlassCard style={styles.equipmentCard}>
              <View style={styles.equipmentCardHeader}>
                <Dumbbell size={14} color={colors.text} />
                <Text style={[styles.equipmentCardText, { color: colors.text }]}>Choose Your Preferred Equipment</Text>
                {isSwappingEquipment && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
                )}
              </View>
              <View style={styles.equipmentChipRow}>
                {availableEquipment.map((eq) => {
                  const isActive = currentEquipmentLabel === eq.label;
                  return (
                    <TouchableOpacity
                      key={eq.key}
                      activeOpacity={0.7}
                      disabled={isSwappingEquipment}
                      onPress={() => {
                        if (!isActive) {
                          lightImpact();
                          onSwitchEquipment(eq.key);
                        }
                      }}
                      style={[
                        styles.equipmentChip,
                        {
                          backgroundColor: isActive
                            ? (isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)')
                            : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                          opacity: isSwappingEquipment && !isActive ? 0.5 : 1,
                        },
                      ]}
                    >
                      <Text style={[
                        styles.equipmentChipText,
                        { color: isActive ? colors.primary : colors.textMuted },
                      ]}>
                        {eq.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassCard>
          )}

          {/* Warmup Section */}
          {workout.warmup && workout.warmup.length > 0 && (
            <View style={styles.exerciseListInline}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>WARMUP</Text>
              {workout.warmup.map((exercise, index) => (
                <ExerciseRow
                  key={exercise.id || `warmup-${index}`}
                  exercise={exercise}
                  onToggle={() => onExerciseToggle(exercise.id)}
                  onSwap={() => onSwapExercise(exercise.id)}
                  onShowAlternatives={onShowAlternatives ? () => onShowAlternatives(exercise) : undefined}
                  onLogWeight={onLogWeight ? () => onLogWeight(exercise) : undefined}
                  onViewForm={onViewForm ? () => onViewForm(exercise) : undefined}
                  lastWeight={lastWeights[exercise.exerciseId]}
                  overloadTrend={exerciseTrends[exercise.exerciseId]}
                  suggestedNext={suggestedWeights[exercise.exerciseId]}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
            </View>
          )}

          {/* Main Exercises - Grouped by Muscle */}
          <View style={styles.exerciseListInline}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>EXERCISES</Text>
            {groupedExercises.map(([muscleGroup, exercises]) => (
              <View key={muscleGroup} style={styles.muscleGroupSection}>
                <Text style={[styles.muscleGroupTitle, { color: colors.textMuted }]}>
                  {muscleGroup.toUpperCase().replace('_', ' ')}
                </Text>
                {exercises.map((exercise, index) => (
                  <ExerciseRow
                    key={exercise.id || `${muscleGroup}-${index}`}
                    exercise={exercise}
                    onToggle={() => onExerciseToggle(exercise.id)}
                    onSwap={() => onSwapExercise(exercise.id)}
                    onShowAlternatives={onShowAlternatives ? () => onShowAlternatives(exercise) : undefined}
                    onLogWeight={onLogWeight ? () => onLogWeight(exercise) : undefined}
                    onViewForm={onViewForm ? () => onViewForm(exercise) : undefined}
                    lastWeight={lastWeights[exercise.exerciseId]}
                    overloadTrend={exerciseTrends[exercise.exerciseId]}
                    suggestedNext={suggestedWeights[exercise.exerciseId]}
                    colors={colors}
                    isDark={isDark}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* Cooldown Section */}
          {workout.cooldown && workout.cooldown.length > 0 && (
            <View style={styles.exerciseListInline}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>COOLDOWN</Text>
              {workout.cooldown.map((exercise, index) => (
                <ExerciseRow
                  key={exercise.id || `cooldown-${index}`}
                  exercise={exercise}
                  onToggle={() => onExerciseToggle(exercise.id)}
                  onSwap={() => onSwapExercise(exercise.id)}
                  onShowAlternatives={onShowAlternatives ? () => onShowAlternatives(exercise) : undefined}
                  onLogWeight={onLogWeight ? () => onLogWeight(exercise) : undefined}
                  onViewForm={onViewForm ? () => onViewForm(exercise) : undefined}
                  lastWeight={lastWeights[exercise.exerciseId]}
                  overloadTrend={exerciseTrends[exercise.exerciseId]}
                  suggestedNext={suggestedWeights[exercise.exerciseId]}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
            </View>
          )}

          {/* View Progress Button */}
          {onViewProgress && (
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                onViewProgress();
              }}
              activeOpacity={0.7}
              style={styles.viewProgressWrapper}
            >
              <GlassCard style={styles.viewProgressButton} interactive>
                <Ionicons name="analytics-outline" size={18} color={colors.textSecondary} />
                <NumberText weight="semiBold" style={[styles.viewProgressText, { color: colors.textSecondary }]}>
                  VIEW PROGRESS
                </NumberText>
              </GlassCard>
            </TouchableOpacity>
          )}

          {/* Complete Workout Button - Frosted Glass */}
          <TouchableOpacity
            onPress={() => {
              mediumImpact();
              onMarkComplete();
            }}
            disabled={workout.completed}
            activeOpacity={0.7}
            style={styles.completeButtonWrapper}
            accessibilityLabel={workout.completed ? `${workout.name} completed` : `Mark ${workout.name} as complete`}
            accessibilityRole="button"
            accessibilityState={{ disabled: workout.completed }}
            accessibilityHint={workout.completed ? 'Workout has been completed' : `Marks all ${totalExercises} exercises as complete and logs ${workout.estimatedCaloriesBurned} calories burned`}
          >
            <GlassCard
              style={[
                styles.completeButtonInline,
                !workout.completed && {
                  backgroundColor: isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)',
                },
              ]}
              interactive
            >
              <Ionicons
                name={workout.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={22}
                color={workout.completed ? colors.textMuted : colors.primary}
              />
              <NumberText weight="semiBold" style={[styles.completeButtonText, { color: workout.completed ? colors.textMuted : colors.primary }]}>
                {workout.completed ? 'WORKOUT COMPLETED' : 'MARK AS COMPLETE'}
              </NumberText>
            </GlassCard>
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
    fontSize: 22,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
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
  muscleGroupSection: {
    marginBottom: 12,
  },
  muscleGroupTitle: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
    opacity: 0.7,
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
  circleCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  targetWeightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  targetWeightText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: '#5EA9DD',
  },
  nextWeightHint: {
    fontSize: 9,
    fontFamily: Fonts.regular,
    color: '#4CD964',
    marginLeft: 4,
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
  swapText: {
    fontSize: 12,
    fontFamily: Fonts.numericMedium,
  },
  equipmentCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  equipmentCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 10,
  },
  equipmentCardText: {
    fontSize: 13,
    fontFamily: Fonts.numericRegular,
    letterSpacing: 0.5,
  },
  equipmentChipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  equipmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  equipmentChipText: {
    fontSize: 13,
    fontFamily: Fonts.numericRegular,
  },
  viewProgressWrapper: {
    marginTop: 4,
  },
  viewProgressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  viewProgressText: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200' as any,
    letterSpacing: 1,
  },
  completeButtonWrapper: {
    marginTop: 8,
  },
  completeButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as any,
    letterSpacing: 1,
  },
});
