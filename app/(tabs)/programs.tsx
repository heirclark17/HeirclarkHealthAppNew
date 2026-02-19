import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Platform, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
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
import { getAvailableEquipmentForDay, EQUIPMENT_LABELS } from '../../services/equipmentSwapper';
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
    batchSwapDayEquipment,
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
    isSwappingEquipment,
  } = trainingState;

  // Goal wizard context - use safe wrapper hook
  const { state: goalWizardState, goToStep } = useSafeGoalWizard();

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

      // Track screen view
      capture('screen_viewed', {
        screen_name: 'Programs',
        screen_type: 'tab',
      });
    }, [loadCachedPlan, isGenerating])
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

  // Navigate to goals page at PrimaryGoalStep (step 1)
  const handleSetGoals = useCallback(() => {
    lightImpact();
    router.push({ pathname: '/goals', params: { step: '1' } });
  }, [router]);

  // Navigate to goals page at ProgramSelectionStep (step 5)
  const handleEditProgram = useCallback(() => {
    lightImpact();
    router.push({ pathname: '/goals', params: { step: '5' } });
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

  // Handle switch equipment - AI generates new exercises for target equipment
  const handleSwitchEquipment = useCallback(async (equipmentKey: string) => {
    if (!currentDay || isSwappingEquipment) return;
    // Track user's explicit selection so the chip stays highlighted
    setSelectedEquipmentKey(equipmentKey);
    mediumImpact();
    // AI-powered equipment swap in TrainingContext (generates new exercises, persists to DB)
    await batchSwapDayEquipment(selectedDayIndex, equipmentKey);
  }, [currentDay, selectedDayIndex, batchSwapDayEquipment, isSwappingEquipment]);

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
          <Dumbbell size={30} color={colors.text} strokeWidth={1.5} />
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
                <View style={styles.weekProgressDots}>
                  {Array.from({ length: multiWeekPlan.totalWeeks }, (_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.weekDot,
                        {
                          backgroundColor: i < currentWeek
                            ? colors.primary
                            : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                        },
                      ]}
                    />
                  ))}
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
                  isSwappingEquipment={isSwappingEquipment}
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

        {/* Bottom spacing for sticky buttons */}
        <View style={{ height: weeklyPlan ? 180 : 100 }} />
      </ScrollView>

      {/* Sticky Action Buttons - positioned outside ScrollView */}
      {weeklyPlan && (
        <View style={styles.stickyBottomContainer}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleEditProgram}
              activeOpacity={0.7}
              style={{ flex: 1 }}
              accessibilityLabel="Edit program"
              accessibilityRole="button"
              accessibilityHint="Opens program selection to change your training program"
            >
              <GlassCard style={styles.actionButtonGlass} interactive>
                <Edit3 size={16} color={colors.text} strokeWidth={1.5} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>PROGRAM</Text>
              </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSetGoals}
              activeOpacity={0.7}
              style={{ flex: 1 }}
              accessibilityLabel="Edit goals"
              accessibilityRole="button"
              accessibilityHint="Opens the goals wizard to update your fitness goals"
            >
              <GlassCard
                style={[styles.actionButtonGlass, { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)' }]}
                interactive
              >
                <Edit3 size={16} color={colors.primary} strokeWidth={1.5} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>GOALS</Text>
              </GlassCard>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Floating AI Coach FAB */}
      {weeklyPlan && <AnimatedCoachFab isDark={isDark} colors={colors} onPress={() => { mediumImpact(); handleOpenCoachModal(); }} />}

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

// Single sparkle particle
function SparkleParticle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  const opacity = useSharedValue(0);
  const particleScale = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      opacity.value = withDelay(delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
            withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }),
            withTiming(0, { duration: 800 }),
          ),
          -1,
        ),
      );
      particleScale.value = withDelay(delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.out(Easing.back(2)) }),
            withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }),
            withTiming(0, { duration: 800 }),
          ),
          -1,
        ),
      );
    };
    startAnimation();
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: '#c084fc',
    opacity: opacity.value,
    transform: [{ scale: particleScale.value }],
  }));

  return <Animated.View style={style} />;
}

// Animated AI Coach FAB with sparkle effect
function AnimatedCoachFab({ isDark, colors, onPress }: { isDark: boolean; colors: any; onPress: () => void }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedIcon = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sparkles = [
    { delay: 0, x: 4, y: 6, size: 4 },
    { delay: 600, x: 38, y: 4, size: 3 },
    { delay: 300, x: 40, y: 36, size: 4 },
    { delay: 900, x: 6, y: 38, size: 3 },
    { delay: 450, x: 22, y: 2, size: 3 },
    { delay: 750, x: 2, y: 22, size: 3 },
    { delay: 1050, x: 42, y: 20, size: 3 },
    { delay: 150, x: 20, y: 42, size: 3 },
  ];

  return (
    <View style={styles.coachFab}>
      <GlassCard
        style={[styles.coachFabGlass, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)' }]}
        interactive
      >
        <TouchableOpacity
          style={styles.coachFabInner}
          onPress={onPress}
          activeOpacity={0.8}
          accessibilityLabel="AI coach"
          accessibilityRole="button"
          accessibilityHint="Opens AI coaching to get personalized training guidance and workout advice"
        >
          {sparkles.map((s, i) => (
            <SparkleParticle key={i} delay={s.delay} x={s.x} y={s.y} size={s.size} />
          ))}
          <Animated.View style={animatedIcon}>
            <Sparkles size={22} color="#a855f7" />
          </Animated.View>
        </TouchableOpacity>
      </GlassCard>
    </View>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 10,
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
    marginTop: -8,
    marginBottom: 0,
  },
  weekHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  weekHeaderTitle: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  weekHeaderProgram: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  weekProgressDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 0,
    marginBottom: 0,
  },
  weekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
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
    gap: 8,
    borderRadius: 50,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
  },
  coachFab: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -26,
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
