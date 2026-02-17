import { useState, useCallback, useMemo, useEffect } from 'react';
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
} from '../../components/training';
import { CardioRecommendationCard } from '../../components/programs/CardioRecommendationCard';
import { GlassButton } from '../../components/liquidGlass/GlassButton';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { ExerciseAlternative, WorkoutExercise, WeightLog, Equipment } from '../../types/training';
import { swapDayEquipment, getAvailableEquipmentForDay, EQUIPMENT_LABELS } from '../../services/equipmentSwapper';
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
  const [selectedEquipmentKey, setSelectedEquipmentKey] = useState<string | null>(null);
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
    multiWeekPlan,
  } = trainingState;

  // Goal wizard context - use safe wrapper hook
  const { state: goalWizardState } = useSafeGoalWizard();

  // Get all days from weekly plan
  const allDays = useMemo(() => {
    if (!weeklyPlan) return [];
    return weeklyPlan.days || [];
  }, [weeklyPlan]);

  // Reset equipment selection when switching days
  useEffect(() => {
    setSelectedEquipmentKey(null);
  }, [selectedDayIndex]);

  // Derive current equipment: use explicit user selection, or fall back to majority equipment type
  const currentEquipment = useMemo(() => {
    if (selectedEquipmentKey) return selectedEquipmentKey;
    const day = allDays.length > 0 ? allDays[Math.min(selectedDayIndex % 7, allDays.length - 1)] : undefined;
    if (!day?.workout?.exercises?.length) return null;
    const counts: Record<string, number> = {};
    day.workout.exercises.forEach(ex => {
      const eq = ex.exercise.equipment || 'bodyweight';
      counts[eq] = (counts[eq] || 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : null;
  }, [allDays, selectedDayIndex, selectedEquipmentKey]);

  // Get current day's workout (clamp to valid range)
  const dayIndexInWeek = allDays.length > 0 ? Math.min(selectedDayIndex % 7, allDays.length - 1) : 0;
  const currentDay = allDays.length > 0 ? allDays[dayIndexInWeek] : undefined;
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
    // Use selectProgramAndGenerate to generate a detailed multi-week plan
    // based on the selected program template (instead of generic AI plan)
    console.log('[Programs] Generating plan with program:', selectedProgram.name);
    const success = await selectProgramAndGenerate(selectedProgram);
    console.log('[Programs] selectProgramAndGenerate returned:', success);
    if (!success && error) {
      console.error('[Programs] Failed to generate AI training plan:', error);
    }
  }, [selectProgramAndGenerate, error, goalWizardState?.primaryGoal, selectedProgram]);

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

  // Handle switch equipment - accepts specific equipment key
  const handleSwitchEquipment = useCallback((equipmentKey: string) => {
    if (!currentDay) return;
    // Track user's explicit selection so the chip stays highlighted
    setSelectedEquipmentKey(equipmentKey);
    const result = swapDayEquipment(currentDay, equipmentKey);
    if (result.swaps.length > 0) {
      const updatedExercises = result.updatedDay.workout?.exercises;
      if (updatedExercises) {
        updatedExercises.forEach((ex, i) => {
          const original = currentDay.workout?.exercises[i];
          if (original && ex.exercise.name !== original.exercise.name) {
            const alt = original.exercise.alternatives?.find(a => a.name === ex.exercise.name);
            if (alt) {
              swapExerciseWithAlternative(selectedDayIndex, original.id, alt);
            }
          }
        });
      }
    }
  }, [currentDay, selectedDayIndex, swapExerciseWithAlternative]);

  // Available equipment options for current day
  const availableEquipmentOptions = useMemo(() => {
    if (!currentDay?.workout) return [];
    const available = getAvailableEquipmentForDay(currentDay);
    return available.map(eq => ({ key: eq, label: EQUIPMENT_LABELS[eq] || eq }));
  }, [currentDay]);

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
  }, [goToPreviousWeek]);

  const handleNextWeek = useCallback(() => {
    lightImpact();
    goToNextWeek();
  }, [goToNextWeek]);

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

        {/* Training Plan Content - show when plan exists */}
        {weeklyPlan && !isGenerating && (
          <View>
            {/* Week X of Y Header */}
            {multiWeekPlan && multiWeekPlan.totalWeeks > 1 && (
              <View style={styles.weekHeaderSection}>
                <View style={styles.weekHeaderTop}>
                  <Text style={[styles.weekHeaderTitle, { color: colors.text }]}>
                    Week <NumberText weight="semiBold">{currentWeek}</NumberText> of <NumberText weight="semiBold">{multiWeekPlan.totalWeeks}</NumberText>
                  </Text>
                  {selectedProgram && (
                    <Text style={[styles.weekHeaderProgram, { color: colors.textMuted }]}>
                      {selectedProgram.name}
                    </Text>
                  )}
                </View>
                <View style={[styles.weekProgressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                  <View
                    style={[
                      styles.weekProgressFill,
                      {
                        width: `${(currentWeek / multiWeekPlan.totalWeeks) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

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
                disabled={currentWeek >= (multiWeekPlan?.totalWeeks || currentWeek)}
                accessibilityLabel={`Next week, currently on week ${currentWeek}${multiWeekPlan ? ` of ${multiWeekPlan.totalWeeks}` : ''}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: currentWeek >= (multiWeekPlan?.totalWeeks || currentWeek) }}
                accessibilityHint="Navigates to the next week's training plan"
              >
                <Text style={[
                  styles.weekButtonText,
                  { color: colors.text },
                  currentWeek >= (multiWeekPlan?.totalWeeks || currentWeek) && { color: colors.border },
                ]}>Next Week</Text>
                <ChevronRight
                  size={20}
                  color={currentWeek >= (multiWeekPlan?.totalWeeks || currentWeek) ? colors.border : colors.text}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            </View>

            {/* Current Day Workout */}
            {currentWorkout && (
              <View style={styles.workoutsContainer}>
                <WorkoutCard
                  workout={currentWorkout}
                  dayName={currentDay?.dayOfWeek || ''}
                  index={dayIndexInWeek}
                  weekNumber={currentWeek}
                  onMarkComplete={handleMarkComplete}
                  onExerciseToggle={handleExerciseToggle}
                  onSwapExercise={handleSwapExercise}
                  onShowAlternatives={handleShowAlternatives}
                  onLogWeight={handleLogWeight}
                  onViewForm={handleViewForm}
                  onViewProgress={() => router.push('/(tabs)/progressive-overload')}
                  onSwitchEquipment={currentDay && !currentDay.isRestDay ? handleSwitchEquipment : undefined}
                  currentEquipmentLabel={currentEquipment ? (EQUIPMENT_LABELS[currentEquipment] || currentEquipment) : null}
                  availableEquipment={availableEquipmentOptions}
                />
              </View>
            )}

            {/* Rest Day Card */}
            {currentDay?.isRestDay && !currentWorkout && (
              <GlassCard style={styles.restDayCard}>
                <Bed size={32} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={[styles.restDayTitle, { color: colors.text }]}>Rest Day</Text>
                <Text style={[styles.restDayText, { color: colors.textMuted }]}>
                  Recovery is essential for progress. Take it easy today.
                </Text>
              </GlassCard>
            )}
          </View>
        )}

        {/* Custom Workouts Section */}
        {customWorkoutState.customWorkouts.length > 0 && (
          <View style={styles.customWorkoutsSection}>
            <Text style={[styles.customSectionTitle, { color: colors.text }]}>My Custom Workouts</Text>
            {customWorkoutState.customWorkouts.map((workout) => (
              <GlassCard key={workout.id} style={styles.customWorkoutCard}>
                <View style={styles.customWorkoutHeader}>
                  <View style={styles.customWorkoutInfo}>
                    <Text style={[styles.customWorkoutName, { color: colors.text }]}>
                      {workout.name}
                      {workout.is_active && (
                        <Text style={[styles.activeLabel, { color: colors.accentCyan }]}> (Active)</Text>
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
                      style={[styles.customWorkoutButton, { backgroundColor: colors.accentCyan + '20', borderColor: colors.accentCyan + '40' }]}
                      activeOpacity={0.7}
                    >
                      <Check size={16} color={colors.accentCyan} />
                      <Text style={[styles.customWorkoutButtonText, { color: colors.accentCyan }]}>Activate</Text>
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

        {/* Bottom spacing for sticky buttons */}
        <View style={{ height: weeklyPlan ? 180 : 100 }} />
      </ScrollView>

      {/* Sticky Action Buttons - positioned outside ScrollView */}
      {weeklyPlan && (
        <View style={styles.stickyBottomContainer}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleOpenProgramModal}
              activeOpacity={0.7}
              style={{ flex: 1 }}
              accessibilityLabel="Change program"
              accessibilityRole="button"
              accessibilityHint="Opens the program library to select a different training program"
            >
              <GlassCard style={styles.actionButtonGlass} interactive>
                <Text style={[styles.actionButtonText, { color: colors.text }]}>PROGRAMS</Text>
              </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSetGoals}
              activeOpacity={0.7}
              style={{ flex: 2 }}
              accessibilityLabel="Adjust goals"
              accessibilityRole="button"
              accessibilityHint="Opens the goals wizard to update your fitness goals and preferences"
            >
              <GlassCard
                style={[styles.actionButtonGlass, { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)' }]}
                interactive
              >
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>GOALS</Text>
              </GlassCard>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Floating AI Coach FAB */}
      {weeklyPlan && (
        <View style={styles.coachFab}>
          <GlassCard
            style={[styles.coachFabGlass, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)' }]}
            interactive
          >
            <TouchableOpacity
              style={styles.coachFabInner}
              onPress={() => {
                mediumImpact();
                handleOpenCoachModal();
              }}
              activeOpacity={0.8}
              accessibilityLabel="AI coach"
              accessibilityRole="button"
              accessibilityHint="Opens AI coaching to get personalized training guidance and workout advice"
            >
              <Sparkles size={22} color="#a855f7" />
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}

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
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    color: Colors.text,
    fontFamily: Fonts.numericSemiBold,
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
    fontFamily: Fonts.regular,
  },
  restDayCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  restDayTitle: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  restDayText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  weekHeaderSection: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  weekHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  weekHeaderTitle: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  weekHeaderProgram: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  weekProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  weekProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
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
  stickyBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as any,
    letterSpacing: 1,
  },
  coachFab: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    zIndex: 10,
  },
  coachFabGlass: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachFabInner: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
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
  customSectionTitle: {
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
  selectProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 16,
    width: '100%',
  },
  selectProgramButtonText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  selectedProgramBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    width: '100%',
  },
  selectedProgramText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    flex: 1,
  },
  changeProgramText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
});
