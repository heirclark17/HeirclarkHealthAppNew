import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
// Animations removed for performance
import { Bed, Dumbbell, Flag, ArrowRight, ChevronLeft, ChevronRight, Zap, Sparkles, Settings, X, Plus, Edit3, Trash2, Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { NumberText } from '../../components/NumberText';
import { GlassCard } from '../../components/GlassCard';
import { useSettings } from '../../contexts/SettingsContext';
import { usePostHog } from '../../contexts/PostHogContext';
import { useTraining } from '../../contexts/TrainingContext';
import { useCustomWorkout } from '../../contexts/CustomWorkoutContext';
import { useSafeGoalWizard } from '../../hooks/useSafeGoalWizard';
import {
  LoadingState,
  WorkoutCard,
  WorkoutCalendarCard,
  ProgramCard,
  ProgramPreviewModal,
  ExerciseAlternativesModal,
  WeightInputModal,
  CardioRecommendationCard,
  CalorieDeficitCard,
} from '../../components/training';
import { GlassButton } from '../../components/liquidGlass/GlassButton';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { ExerciseAlternative, WorkoutExercise, WeightLog } from '../../types/training';
import { CoachChatModal } from '../../components/agents/aiCoach';
import { FormCoachModal } from '../../components/agents/workoutFormCoach';
import { api } from '../../services/api';

export default function ProgramsScreen() {
  const router = useRouter();
  const { capture } = usePostHog();
  const [refreshing, setRefreshing] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showProgramPreview, setShowProgramPreview] = useState(false);
  const [previewProgram, setPreviewProgram] = useState<any>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedExerciseForWeight, setSelectedExerciseForWeight] = useState<WorkoutExercise | null>(null);
  const [selectedExerciseForForm, setSelectedExerciseForForm] = useState<WorkoutExercise | null>(null);
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Training context
  const {
    state: trainingState,
    generateWeeklyPlan,
    generateAIWorkoutPlan,
    setSelectedDay,
    markExerciseComplete,
    markWorkoutComplete,
    swapExercise,
    swapExerciseWithAlternative,
    selectProgram,
    selectProgramAndGenerate,
    getAllPrograms,
    getEnhancedPrograms,
    loadCachedPlan,
    goToNextWeek,
    goToPreviousWeek,
    showExerciseAlternatives,
    hideExerciseAlternatives,
    getPlanSummary,
  } = useTraining();

  // Custom workout context
  const {
    state: customWorkoutState,
    startNewWorkout,
    editWorkout,
    deleteWorkout,
    activateWorkout,
    loadCustomWorkouts,
  } = useCustomWorkout();

  const {
    weeklyPlan,
    isGenerating,
    error,
    selectedDayIndex,
    selectedProgram,
    currentWeek,
    goalAlignment,
    preferences,
    planSummary,
    selectedExercise,
    showAlternativesModal,
    cardioRecommendations,
    nutritionGuidance,
  } = trainingState;

  // Goal wizard context - use safe wrapper hook
  const { state: goalWizardState } = useSafeGoalWizard();

  // Get all days from weekly plan
  const allDays = useMemo(() => {
    if (!weeklyPlan) return [];
    return weeklyPlan.days || [];
  }, [weeklyPlan]);

  // Get current day's workout
  const dayIndexInWeek = selectedDayIndex % 7;
  const currentDay = allDays[dayIndexInWeek];
  const currentWorkout = currentDay?.workout;

  // Available programs - use enhanced program templates
  const allPrograms = getEnhancedPrograms();

  // Handle selecting an exercise alternative - memoized to prevent child re-renders
  const handleSelectAlternative = useCallback((alternative: ExerciseAlternative) => {
    if (selectedExercise && currentDay?.workout) {
      // Find the exercise ID in the current workout
      const workoutExercise = currentDay.workout.exercises.find(
        ex => ex.exercise.id === selectedExercise.id || ex.exerciseId === selectedExercise.id
      );
      if (workoutExercise) {
        swapExerciseWithAlternative(selectedDayIndex, workoutExercise.id, alternative);
      }
    }
    hideExerciseAlternatives();
  }, [selectedExercise, currentDay, selectedDayIndex, swapExerciseWithAlternative, hideExerciseAlternatives]);

  // Handle opening weight log modal - memoized
  const handleLogWeight = useCallback((exercise: WorkoutExercise) => {
    setSelectedExerciseForWeight(exercise);
    setShowWeightModal(true);
  }, []);

  // Handle saving weight log - sync ALL weight logs to backend (not just PRs) - memoized
  const handleSaveWeight = useCallback(async (log: WeightLog) => {
    console.log('[Programs] Weight log saved:', log.exerciseName, log.maxWeight, log.sets[0]?.unit);

    try {
      // *** Sync ALL weight logs to backend ***
      console.log('[Programs] 💪 Syncing weight log to backend...');
      const weightLogSuccess = await api.saveWeightLog({
        exerciseName: log.exerciseName,
        date: new Date().toISOString().split('T')[0],
        sets: log.sets.map((set, idx) => ({
          setNumber: idx + 1,
          weight: set.weight,
          reps: set.reps,
          unit: set.unit || 'lb',
        })),
        notes: log.notes,
        personalRecord: log.personalRecord,
      });

      if (weightLogSuccess) {
        console.log('[Programs] ✅ Weight log synced to backend');
      } else {
        console.warn('[Programs] ⚠️ Weight log sync failed - saved locally');
      }

      // Also save PR separately if it's a personal record
      if (log.personalRecord && log.maxWeight > 0) {
        console.log('[Programs] 🏆 New PR detected! Syncing PR to backend...');
        const prSuccess = await api.savePersonalRecord(
          log.exerciseName,
          log.maxWeight,
          log.sets[0]?.reps || 1,
          log.notes
        );
        if (prSuccess) {
          console.log('[Programs] ✅ PR synced to backend');
        } else {
          console.warn('[Programs] ⚠️ PR sync failed - saved locally');
        }
      }
    } catch (error) {
      console.error('[Programs] ❌ Weight log sync error:', error);
    }
  }, []);

  // Navigate to training from plan summary - memoized
  const handleStartTraining = useCallback(() => {
    // Scroll to workout section or navigate accordingly
    lightImpact();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCachedPlan();
    setRefreshing(false);
  }, [loadCachedPlan]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Don't reload cache if AI generation is in progress (prevents race condition)
      if (!isGenerating) {
        loadCachedPlan();
      }
      loadCustomWorkouts();

      // Track screen view
      capture('screen_viewed', {
        screen_name: 'Programs',
        screen_type: 'tab',
      });
    }, [loadCachedPlan, loadCustomWorkouts, isGenerating])
  );

  // Handle quick generate (template-based) - memoized
  const handleGenerate = useCallback(async () => {
    console.log('[Programs] Quick generate button clicked');
    console.log('[Programs] Goal wizard state:', goalWizardState?.primaryGoal);

    // Track training plan generation
    capture('training_plan_generated', {
      screen_name: 'Programs',
      generation_type: 'quick',
      program: selectedProgram?.name || 'none',
    });

    // Check if user has selected a training program
    if (!selectedProgram) {
      Alert.alert(
        'Program Required',
        'Please select a training program before generating your workout plan.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }

    mediumImpact();
    console.log('[Programs] Calling generateWeeklyPlan()...');
    const success = await generateWeeklyPlan();
    console.log('[Programs] generateWeeklyPlan returned:', success);
    if (!success && error) {
      console.error('[Programs] Failed to generate training plan:', error);
    }
  }, [generateWeeklyPlan, error, goalWizardState?.primaryGoal, selectedProgram]);

  // Handle AI-powered generate - memoized
  const handleAIGenerate = useCallback(async () => {
    console.log('[Programs] AI generate button clicked');
    console.log('[Programs] Goal wizard state:', goalWizardState?.primaryGoal);

    // Track AI training plan generation
    capture('training_plan_generated', {
      screen_name: 'Programs',
      generation_type: 'ai_powered',
      program: selectedProgram?.name || 'none',
    });

    // Check if user has selected a training program
    if (!selectedProgram) {
      Alert.alert(
        'Program Required',
        'Please select a training program before generating your workout plan.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }

    mediumImpact();
    console.log('[Programs] Calling generateAIWorkoutPlan()...');
    const success = await generateAIWorkoutPlan();
    console.log('[Programs] generateAIWorkoutPlan returned:', success);
    if (!success && error) {
      console.error('[Programs] Failed to generate AI training plan:', error);
    }
  }, [generateAIWorkoutPlan, error, goalWizardState?.primaryGoal, selectedProgram]);

  // Handle program tap - shows preview modal - memoized
  const handleProgramTap = useCallback((program: any) => {
    console.log('[Programs] User tapped program:', program.name);
    lightImpact();
    setPreviewProgram(program);
    setShowProgramPreview(true);
  }, []);

  // Handle confirming program selection - generates the plan - memoized
  const handleConfirmProgram = useCallback(async () => {
    if (!previewProgram) return;

    console.log('[Programs] User confirmed program:', previewProgram.name);
    mediumImpact();
    setShowProgramPreview(false);
    setShowProgramModal(false);

    // Generate a new training plan using the selected program
    const success = await selectProgramAndGenerate(previewProgram);
    console.log('[Programs] Plan generated with selected program:', success);

    if (!success) {
      console.error('[Programs] Failed to generate plan with selected program');
    }

    setPreviewProgram(null);
  }, [previewProgram, selectProgramAndGenerate]);

  // Handle closing preview modal - memoized
  const handleClosePreview = useCallback(() => {
    setShowProgramPreview(false);
    // Don't clear previewProgram so selection state persists in the list
  }, []);

  // Navigate to goals page - memoized
  const handleSetGoals = useCallback(() => {
    lightImpact();
    router.push('/goals');
  }, [router]);

  // Get goal summary - memoized
  const getGoalSummary = useCallback(() => {
    if (!goalWizardState?.primaryGoal) return 'Set your goals to get personalized workouts';

    const goalLabels: Record<string, string> = {
      lose_weight: 'Weight Loss',
      build_muscle: 'Build Muscle',
      maintain: 'Maintenance',
      improve_health: 'Health Improvement',
    };

    return `Training for: ${goalLabels[goalWizardState.primaryGoal] || 'General Fitness'}`;
  }, [goalWizardState?.primaryGoal]);

  // Memoized handlers for WorkoutCard to prevent unnecessary re-renders
  const handleMarkComplete = useCallback(() => {
    markWorkoutComplete(selectedDayIndex);
  }, [markWorkoutComplete, selectedDayIndex]);

  const handleExerciseToggle = useCallback((exerciseId: string) => {
    markExerciseComplete(selectedDayIndex, exerciseId);
  }, [markExerciseComplete, selectedDayIndex]);

  const handleSwapExercise = useCallback((exerciseId: string) => {
    swapExercise(selectedDayIndex, exerciseId);
  }, [swapExercise, selectedDayIndex]);

  const handleShowAlternatives = useCallback((workoutExercise: WorkoutExercise) => {
    showExerciseAlternatives(workoutExercise.exercise);
  }, [showExerciseAlternatives]);

  // Handle viewing exercise form with GIF demonstration - memoized
  const handleViewForm = useCallback((exercise: WorkoutExercise) => {
    setSelectedExerciseForForm(exercise);
    setShowFormModal(true);
  }, []);

  // Memoized handlers for modal controls
  const handleOpenProgramModal = useCallback(() => {
    lightImpact();
    setShowProgramModal(true);
  }, []);

  // Custom workout handlers
  const handleCreateCustomWorkout = useCallback(() => {
    lightImpact();
    startNewWorkout();
    router.push('/custom-workout-builder');
  }, [router, startNewWorkout]);

  const handleEditCustomWorkout = useCallback((workout: any) => {
    lightImpact();
    editWorkout(workout);
    router.push('/custom-workout-builder');
  }, [router, editWorkout]);

  const handleActivateCustomWorkout = useCallback(async (workoutId: string) => {
    mediumImpact();
    const success = await activateWorkout(workoutId);
    if (success) {
      Alert.alert('Workout Activated', 'This custom workout is now your active training plan.');
      await loadCustomWorkouts(); // Refresh list
    } else {
      Alert.alert('Activation Failed', customWorkoutState.error || 'Failed to activate workout.');
    }
  }, [activateWorkout, loadCustomWorkouts, customWorkoutState.error]);

  const handleDeleteCustomWorkout = useCallback(async (workoutId: string, workoutName: string) => {
    Alert.alert(
      'Delete Workout?',
      `Are you sure you want to delete "${workoutName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            mediumImpact();
            const success = await deleteWorkout(workoutId);
            if (success) {
              await loadCustomWorkouts(); // Refresh list
            } else {
              Alert.alert('Delete Failed', customWorkoutState.error || 'Failed to delete workout.');
            }
          },
        },
      ]
    );
  }, [deleteWorkout, loadCustomWorkouts, customWorkoutState.error]);

  const handleCloseProgramModal = useCallback(() => {
    setShowProgramModal(false);
  }, []);

  const handleCloseWeightModal = useCallback(() => {
    setShowWeightModal(false);
    setSelectedExerciseForWeight(null);
  }, []);

  const handleOpenCoachModal = useCallback(() => {
    setShowCoachModal(true);
  }, []);

  const handleCloseCoachModal = useCallback(() => {
    setShowCoachModal(false);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setShowFormModal(false);
    setSelectedExerciseForForm(null);
  }, []);

  // Memoized week navigation handlers
  const handlePreviousWeek = useCallback(() => {
    lightImpact();
    goToPreviousWeek();
    generateWeeklyPlan();
  }, [goToPreviousWeek, generateWeeklyPlan]);

  const handleNextWeek = useCallback(() => {
    lightImpact();
    goToNextWeek();
    generateWeeklyPlan();
  }, [goToNextWeek, generateWeeklyPlan]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Training</Text>
        </View>

        {/* Workout Calendar Card - Frosted Liquid Glass */}
        {weeklyPlan && (
          <WorkoutCalendarCard
            weeklyPlan={weeklyPlan}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={setSelectedDay}
          />
        )}


        {/* Today's Workout - Below Calendar */}
        {weeklyPlan && !isGenerating && (
          <View style={styles.workoutsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>
                {currentDay?.dayOfWeek}'s Workout
              </Text>
              {currentDay?.isRestDay && (
                <View style={[styles.restBadge, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.restBadgeText, { color: colors.textMuted }]}>Rest Day</Text>
                </View>
              )}
            </View>

            {currentWorkout ? (
              <WorkoutCard
                workout={currentWorkout}
                dayName={currentDay?.dayOfWeek || 'Today'}
                index={0}
                weekNumber={currentWeek}
                onMarkComplete={handleMarkComplete}
                onExerciseToggle={handleExerciseToggle}
                onSwapExercise={handleSwapExercise}
                onShowAlternatives={handleShowAlternatives}
                onLogWeight={handleLogWeight}
                onViewForm={handleViewForm}
              />
            ) : currentDay?.isRestDay ? (
              <GlassCard style={styles.restDayCard} interactive>
                <View style={styles.cardIconContainer}>
                  <BlurView
                    intensity={isDark ? 40 : 60}
                    tint={isDark ? 'dark' : 'light'}
                    style={[
                      styles.cardIconBlur,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <Bed size={32} color={colors.textMuted} strokeWidth={1.5} />
                  </BlurView>
                </View>
                <Text style={[styles.restDayTitle, { color: colors.text }]}>Rest & Recovery</Text>
                <Text style={[styles.restDayText, { color: colors.textMuted }]}>
                  Take today to recover. Light stretching or a walk is encouraged.
                </Text>
              </GlassCard>
            ) : null}
          </View>
        )}

        {/* Today's Cardio Recommendation - Separate from strength training */}
        {weeklyPlan && cardioRecommendations && currentDay && (() => {
          const dayKey = currentDay.dayOfWeek.toLowerCase() as keyof typeof cardioRecommendations;
          const todaysCardio = cardioRecommendations[dayKey];
          // Only render if we have cardio data for this day
          return todaysCardio ? (
            <CardioRecommendationCard
              recommendation={todaysCardio}
              dayName={currentDay.dayOfWeek}
              isDark={isDark}
            />
          ) : null;
        })()}

        {/* Nutrition Guidance - Calorie Deficit Card */}
        {weeklyPlan && nutritionGuidance && (
          <CalorieDeficitCard
            nutrition={nutritionGuidance}
            isDark={isDark}
          />
        )}

        {/* Generate Plan Section - show when no plan exists */}
        {!weeklyPlan && !isGenerating && (
          <View>
            <GlassCard style={styles.card} interactive>
              {/* Frosted Glass Icon Container */}
              <View style={styles.cardIconContainer}>
                <BlurView
                  intensity={isDark ? 40 : 60}
                  tint={isDark ? 'dark' : 'light'}
                  style={[
                    styles.cardIconBlur,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <Dumbbell size={32} color={colors.text} strokeWidth={1.5} />
                </BlurView>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Personalized Training Plan</Text>
              <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
                AI will generate a customized workout plan based on your fitness goals, activity level, and preferences
              </Text>

              {/* Goal Summary */}
              <View style={[styles.goalSummary, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <Flag size={18} color={colors.protein} strokeWidth={1.5} />
                <Text style={[styles.goalSummaryText, { color: colors.textSecondary }]}>{getGoalSummary()}</Text>
              </View>

              {!goalWizardState?.primaryGoal && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={handleSetGoals}
                  accessibilityLabel="Set your goals first"
                  accessibilityRole="button"
                  accessibilityHint="Opens the goals wizard to set your fitness goals before generating a training plan"
                >
                  <Text style={[styles.linkButtonText, { color: colors.accent }]}>Set Your Goals First</Text>
                  <ArrowRight size={16} color={colors.accent} strokeWidth={1.5} />
                </TouchableOpacity>
              )}

              {/* Generate Buttons Row */}
              <View style={styles.generateButtonsRow}>
                <GlassButton
                  title="Quick Generate"
                  icon="flash-outline"
                  variant="secondary"
                  size="large"
                  disabled={isGenerating || !goalWizardState?.primaryGoal}
                  onPress={handleGenerate}
                  style={{ flex: 1 }}
                />
                <GlassButton
                  title="AI-Powered"
                  icon="sparkles"
                  variant="primary"
                  size="large"
                  disabled={isGenerating || !goalWizardState?.primaryGoal}
                  onPress={handleAIGenerate}
                  style={{ flex: 1 }}
                />
              </View>
            </GlassCard>
          </View>
        )}

        {/* Loading State */}
        {isGenerating && (
          <View>
            <View style={styles.loadingHeader}>
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Creating your personalized training plan...</Text>
            </View>
            <LoadingState count={4} />
          </View>
        )}

        {/* Error State */}
        {error && !isGenerating && (
          <View>
            <GlassCard style={styles.errorCard} interactive>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>
              <Text style={[styles.errorText, { color: colors.textMuted }]}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={handleGenerate}
                accessibilityLabel="Try again"
                accessibilityRole="button"
                accessibilityHint="Retries training plan generation after the previous attempt failed"
              >
                <Text style={[styles.retryButtonText, { color: colors.primaryText }]}>Try Again</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        {/* Training Plan Content - show when plan exists */}
        {weeklyPlan && !isGenerating && (
          <View>
            {/* Week Navigation */}
            <View style={styles.weekNavigation}>
              <TouchableOpacity
                style={styles.weekButton}
                onPress={handlePreviousWeek}
                disabled={currentWeek === 1}
                accessibilityLabel={`Previous week, currently on week ${currentWeek}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: currentWeek === 1 }}
                accessibilityHint="Navigates to the previous week's training plan"
              >
                <ChevronLeft
                  size={20}
                  color={currentWeek === 1 ? colors.border : colors.text}
                  strokeWidth={1.5}
                />
                <Text style={[styles.weekButtonText, { color: colors.text }, currentWeek === 1 && { color: colors.border }]}>
                  Previous Week
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.weekButton}
                onPress={handleNextWeek}
                accessibilityLabel={`Next week, currently on week ${currentWeek}`}
                accessibilityRole="button"
                accessibilityHint="Navigates to the next week's training plan"
              >
                <Text style={[styles.weekButtonText, { color: colors.text }]}>Next Week</Text>
                <ChevronRight size={20} color={colors.text} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Custom Workouts Section */}
        {customWorkoutState.customWorkouts.length > 0 && (
          <View style={styles.customWorkoutsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Custom Workouts</Text>
            {customWorkoutState.customWorkouts.map((workout) => (
              <GlassCard key={workout.id} style={styles.customWorkoutCard}>
                <View style={styles.customWorkoutHeader}>
                  <View style={styles.customWorkoutInfo}>
                    <Text style={[styles.customWorkoutName, { color: colors.text }]}>
                      {workout.name}
                      {workout.is_active && (
                        <Text style={[styles.activeLabel, { color: colors.accentBlue }]}> (Active)</Text>
                      )}
                    </Text>
                    {workout.description && (
                      <Text style={[styles.customWorkoutDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {workout.description}
                      </Text>
                    )}
                    <Text style={[styles.customWorkoutMeta, { color: colors.textMuted }]}>
                      {workout.workout_structure.days.length} {workout.workout_structure.days.length === 1 ? 'day' : 'days'} • Created {new Date(workout.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.customWorkoutActions}>
                  {!workout.is_active && (
                    <TouchableOpacity
                      onPress={() => handleActivateCustomWorkout(workout.id)}
                      style={[styles.customWorkoutButton, { backgroundColor: colors.accentBlue + '20', borderColor: colors.accentBlue + '40' }]}
                      activeOpacity={0.7}
                    >
                      <Check size={16} color={colors.accentBlue} />
                      <Text style={[styles.customWorkoutButtonText, { color: colors.accentBlue }]}>Activate</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleEditCustomWorkout(workout)}
                    style={[styles.customWorkoutButton, { backgroundColor: colors.textSecondary + '20', borderColor: colors.textSecondary + '40' }]}
                    activeOpacity={0.7}
                  >
                    <Edit3 size={16} color={colors.textSecondary} />
                    <Text style={[styles.customWorkoutButtonText, { color: colors.textSecondary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteCustomWorkout(workout.id, workout.name)}
                    style={[styles.customWorkoutButton, { backgroundColor: colors.errorStrong + '20', borderColor: colors.errorStrong + '40' }]}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={colors.errorStrong} />
                    <Text style={[styles.customWorkoutButtonText, { color: colors.errorStrong }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Create Custom Workout Button */}
        <TouchableOpacity
          onPress={handleCreateCustomWorkout}
          activeOpacity={0.7}
          style={styles.createCustomButtonWrapper}
        >
          <GlassCard style={styles.createCustomButton} interactive>
            <View style={styles.createCustomButtonInner}>
              <View style={[styles.createCustomIcon, { backgroundColor: colors.accentCyan + '20' }]}>
                <Plus size={24} color={colors.accentCyan} strokeWidth={2} />
              </View>
              <View style={styles.createCustomTextContainer}>
                <Text style={[styles.createCustomButtonTitle, { color: colors.text }]}>Create Custom Workout</Text>
                <Text style={[styles.createCustomButtonSubtitle, { color: colors.textSecondary }]}>
                  Build your own plan from exercise library
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Action Buttons - Frosted Liquid Glass */}
        {weeklyPlan && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleSetGoals}
              activeOpacity={0.7}
              style={styles.actionButtonWrapper}
              accessibilityLabel="Adjust goals"
              accessibilityRole="button"
              accessibilityHint="Opens the goals wizard to update your fitness goals and preferences"
            >
              <GlassCard style={styles.actionButton} interactive>
                <View style={styles.actionButtonInner}>
                  <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                    <Settings size={20} color={colors.textMuted} strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>Adjust Goals</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenCoachModal}
              activeOpacity={0.7}
              style={styles.actionButtonWrapper}
              accessibilityLabel="AI coach"
              accessibilityRole="button"
              accessibilityHint="Opens AI coaching to get personalized training guidance and workout advice"
            >
              <GlassCard style={styles.actionButton} interactive>
                <View style={styles.actionButtonInner}>
                  <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                    <Sparkles size={20} color={colors.textMuted} strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>AI Coach</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Program Library Modal - Frosted Liquid Glass */}
      <Modal
        visible={showProgramModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseProgramModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <BlurView intensity={isDark ? 25 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={handleCloseProgramModal}
                style={styles.closeButtonWrapper}
                accessibilityLabel="Close program library"
                accessibilityRole="button"
                accessibilityHint="Closes the training programs modal and returns to the training screen"
              >
                <GlassCard style={styles.modalCloseButtonGlass} interactive>
                  <X size={22} color={colors.text} strokeWidth={1.5} />
                </GlassCard>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Training Programs</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Tap a program to preview details
            </Text>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {allPrograms.map((program, index) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  isSelected={selectedProgram?.id === program.id || previewProgram?.id === program.id}
                  onSelect={() => handleProgramTap(program)}
                  index={index}
                />
              ))}
              <View style={{ height: 50 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Program Preview Modal */}
      <ProgramPreviewModal
        visible={showProgramPreview}
        program={previewProgram}
        onClose={handleClosePreview}
        onConfirm={handleConfirmProgram}
        isGenerating={isGenerating}
      />

      {/* Exercise Alternatives Modal */}
      <ExerciseAlternativesModal
        visible={showAlternativesModal}
        exercise={selectedExercise}
        onClose={hideExerciseAlternatives}
        onSelectAlternative={handleSelectAlternative}
      />

      {/* Weight Input Modal for Progressive Overload Tracking */}
      <WeightInputModal
        visible={showWeightModal}
        exercise={selectedExerciseForWeight}
        weekNumber={currentWeek}
        onClose={handleCloseWeightModal}
        onSave={handleSaveWeight}
      />

      {/* AI Coach Chat Modal - Training Mode */}
      <CoachChatModal
        visible={showCoachModal}
        onClose={handleCloseCoachModal}
        mode="training"
        context={{
          userGoals: {
            fitnessGoal: selectedProgram?.focus?.[0] || 'general_fitness',
            activityLevel: 'active',
          },
          recentWorkouts: [],
        }}
      />

      {/* Form Coach Modal - Exercise GIF Demonstration */}
      <FormCoachModal
        visible={showFormModal}
        onClose={handleCloseFormModal}
        exerciseName={selectedExerciseForForm?.exercise?.name || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  generateButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    color: Colors.text,
    fontFamily: Fonts.thin,
    letterSpacing: 0.5,
  },
  programButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  programButtonText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  cardIconContainer: {
    marginBottom: 16,
  },
  cardIconBlur: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      default: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 8,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  goalSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  goalSummaryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  linkButtonText: {
    fontSize: 14,
    color: Colors.accent,
    fontFamily: Fonts.medium,
  },
  loadingHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: Spacing.borderRadius,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: Spacing.borderRadius,
  },
  retryButtonText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  workoutsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  restBadge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  restBadgeText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  restDayCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  restDayTitle: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  restDayText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  weekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  weekButtonText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.regular,
  },
  weekButtonDisabled: {
    color: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 8,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  actionButton: {
    // GlassCard handles styling
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontFamily: Fonts.thin,
    letterSpacing: 0.3,
  },

  // Modal styles - Frosted Liquid Glass
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
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
  closeButtonWrapper: {
    width: 40,
    height: 40,
  },
  modalCloseButtonGlass: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 20,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
  },
  // Custom Workouts Styles
  customWorkoutsSection: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.md,
  },
  customWorkoutCard: {
    marginBottom: Spacing.md,
  },
  customWorkoutHeader: {
    marginBottom: Spacing.md,
  },
  customWorkoutInfo: {
    gap: Spacing.xs,
  },
  customWorkoutName: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  activeLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  customWorkoutDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  customWorkoutMeta: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  customWorkoutActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  customWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  customWorkoutButtonText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  createCustomButtonWrapper: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  createCustomButton: {
    // No additional styles needed - GlassCard handles padding
  },
  createCustomButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  createCustomIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCustomTextContainer: {
    flex: 1,
    gap: 2,
  },
  createCustomButtonTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  createCustomButtonSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
});
