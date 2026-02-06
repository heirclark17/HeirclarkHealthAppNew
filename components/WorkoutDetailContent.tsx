import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../contexts/SettingsContext';
import { useTraining } from '../contexts/TrainingContext';
import { Colors, Fonts, DarkColors, LightColors } from '../constants/Theme';
import { GlassCard } from './GlassCard';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  completed?: boolean;
}

interface WorkoutData {
  name: string;
  type: string;
  exercises: Exercise[];
  duration: number;
  estimatedCaloriesBurned: number;
}

export function WorkoutDetailContent() {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const [loading, setLoading] = useState(true);
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutData | null>(null);

  // Get training context
  let trainingState: any = null;
  try {
    const training = useTraining();
    trainingState = training?.state;
  } catch (e) {
    // Training context may not be available
  }

  useEffect(() => {
    loadWorkoutData();
  }, []);

  const loadWorkoutData = async () => {
    setLoading(true);
    try {
      // Get today's workout from training context
      const todayIndex = new Date().getDay();
      const dayIndex = todayIndex === 0 ? 6 : todayIndex - 1; // Monday = 0
      const todaysPlan = trainingState?.weeklyPlan?.days?.[dayIndex];

      if (todaysPlan?.workout) {
        setTodaysWorkout({
          name: todaysPlan.workout.name || 'Today\'s Workout',
          type: todaysPlan.workout.type || 'strength',
          exercises: todaysPlan.workout.exercises || [],
          duration: todaysPlan.workout.duration || 0,
          estimatedCaloriesBurned: todaysPlan.workout.estimatedCaloriesBurned || 0,
        });
      } else {
        setTodaysWorkout(null);
      }
    } catch (error) {
      console.error('[WorkoutDetail] Error loading workout:', error);
      setTodaysWorkout(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    if (!todaysWorkout?.exercises) return { exercises: 0, volume: 0, calories: 0 };

    const totalExercises = todaysWorkout.exercises.length;
    const totalVolume = todaysWorkout.exercises.reduce((sum, ex) => {
      const weight = ex.weight || 0;
      const sets = ex.sets || 0;
      const reps = parseInt(ex.reps) || 0;
      return sum + (sets * reps * weight);
    }, 0);

    return {
      exercises: totalExercises,
      volume: totalVolume,
      calories: todaysWorkout.estimatedCaloriesBurned || 0,
    };
  }, [todaysWorkout]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading workout...</Text>
      </View>
    );
  }

  if (!todaysWorkout) {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
          <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Workouts Today</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Take a rest day or add a workout from the training tab
        </Text>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date Header */}
      <Animated.View entering={FadeIn.delay(0).duration(300)}>
        <Text style={[styles.dateHeader, { color: colors.textMuted }]}>{today}</Text>
        <Text style={[styles.workoutName, { color: colors.text }]}>{todaysWorkout.name}</Text>
        <View style={[styles.typeBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[styles.typeText, { color: colors.textSecondary }]}>
            {todaysWorkout.type.charAt(0).toUpperCase() + todaysWorkout.type.slice(1)}
          </Text>
        </View>
      </Animated.View>

      {/* Exercise List */}
      <View style={styles.exerciseList}>
        <Animated.Text
          entering={FadeIn.delay(80).duration(300)}
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Exercises
        </Animated.Text>

        {todaysWorkout.exercises.map((exercise, index) => (
          <Animated.View
            key={exercise.id || index}
            entering={SlideInDown.delay(120 + index * 80).duration(300).springify()}
          >
            <GlassCard style={styles.exerciseCard}>
              <View style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.exerciseDetails, { color: colors.textMuted }]}>
                    {exercise.sets} sets × {exercise.reps} reps
                    {exercise.weight ? ` • ${exercise.weight} lbs` : ''}
                  </Text>
                </View>
                {exercise.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  </View>
                )}
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </View>

      {/* Summary Footer */}
      <Animated.View
        entering={FadeIn.delay(300 + todaysWorkout.exercises.length * 80).duration(300)}
        style={styles.summaryContainer}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="fitness-outline" size={20} color={colors.primary} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>{totals.exercises}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Exercises</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
            <View style={styles.summaryItem}>
              <Ionicons name="barbell-outline" size={20} color={colors.primary} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {totals.volume > 0 ? totals.volume.toLocaleString() : '--'}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Volume (lbs)</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
            <View style={styles.summaryItem}>
              <Ionicons name="flame-outline" size={20} color={Colors.error} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {totals.calories > 0 ? totals.calories : '--'}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Calories</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dateHeader: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 24,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 24,
  },
  typeText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  exerciseList: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 12,
  },
  exerciseCard: {
    marginBottom: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    marginBottom: 2,
  },
  exerciseDetails: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  completedBadge: {
    marginLeft: 12,
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryCard: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    marginTop: 8,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
});
