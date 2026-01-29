import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';
import { useSettings } from '../../contexts/SettingsContext';
import { useTraining } from '../../contexts/TrainingContext';
import { useGoalWizard } from '../../contexts/GoalWizardContext';
import {
  LoadingState,
  WorkoutCard,
  WorkoutCalendarCard,
  GoalAlignmentCard,
  ProgramCard,
  ExerciseAlternativesModal,
  WeightInputModal,
} from '../../components/training';
import { PlanSummaryCard } from '../../components/goals';
import { GlassButton } from '../../components/liquidGlass/GlassButton';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { ExerciseAlternative, WorkoutExercise, WeightLog } from '../../types/training';
import { WorkoutFormCoachCard } from '../../components/agents/workoutFormCoach';
import { CoachChatModal } from '../../components/agents/aiCoach';

export default function ProgramsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [selectedExerciseForWeight, setSelectedExerciseForWeight] = useState<WorkoutExercise | null>(null);
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
  } = trainingState;

  // Goal wizard context
  let goalWizardState: any = null;
  try {
    const { state } = useGoalWizard();
    goalWizardState = state;
  } catch (e) {
    // Context not available
  }

  // Get current day's workout
  const currentDay = weeklyPlan?.days[selectedDayIndex];
  const currentWorkout = currentDay?.workout;

  // Available programs - use enhanced program templates
  const allPrograms = getEnhancedPrograms();

  // Handle selecting an exercise alternative
  const handleSelectAlternative = (alternative: ExerciseAlternative) => {
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
  };

  // Handle opening weight log modal
  const handleLogWeight = (exercise: WorkoutExercise) => {
    setSelectedExerciseForWeight(exercise);
    setShowWeightModal(true);
  };

  // Handle saving weight log
  const handleSaveWeight = (log: WeightLog) => {
    console.log('[Programs] Weight log saved:', log.exerciseName, log.maxWeight, log.sets[0]?.unit);
    // Could trigger a refresh of the weight display here if needed
  };

  // Navigate to training from plan summary
  const handleStartTraining = () => {
    // Scroll to workout section or navigate accordingly
    lightImpact();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCachedPlan();
    setRefreshing(false);
  }, [loadCachedPlan]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCachedPlan();
    }, [loadCachedPlan])
  );

  // Handle generate button press
  const handleGenerate = async () => {
    console.log('[Programs] Generate button clicked');
    console.log('[Programs] Goal wizard state:', goalWizardState?.primaryGoal);
    mediumImpact();
    console.log('[Programs] Calling generateWeeklyPlan()...');
    const success = await generateWeeklyPlan();
    console.log('[Programs] generateWeeklyPlan returned:', success);
    if (!success && error) {
      console.error('[Programs] Failed to generate training plan:', error);
    }
  };

  // Handle program selection - generates a new plan with the selected program
  const handleSelectProgram = async (program: any) => {
    console.log('[Programs] User selected program:', program.name);
    mediumImpact();
    setShowProgramModal(false);
    // Generate a new training plan using the selected program
    const success = await selectProgramAndGenerate(program);
    console.log('[Programs] Plan generated with selected program:', success);
    if (!success) {
      console.error('[Programs] Failed to generate plan with selected program');
    }
  };

  // Navigate to goals page
  const handleSetGoals = () => {
    lightImpact();
    router.push('/goals');
  };

  // Get goal summary
  const getGoalSummary = () => {
    if (!goalWizardState?.primaryGoal) return 'Set your goals to get personalized workouts';

    const goalLabels: Record<string, string> = {
      lose_weight: 'Weight Loss',
      build_muscle: 'Build Muscle',
      maintain: 'Maintenance',
      improve_health: 'Health Improvement',
    };

    return `Training for: ${goalLabels[goalWizardState.primaryGoal] || 'General Fitness'}`;
  };

  // Weekly stats
  const weeklyStats = weeklyPlan
    ? {
        completedWorkouts: weeklyPlan.completedWorkouts,
        totalWorkouts: weeklyPlan.totalWorkouts,
        caloriesBurned: weeklyPlan.totalCaloriesBurned,
      }
    : null;

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
          {weeklyPlan && (
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                setShowProgramModal(true);
              }}
              activeOpacity={0.7}
            >
              <GlassCard style={styles.programButton} interactive>
                <Ionicons name="list-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.programButtonText, { color: colors.textMuted }]}>Programs</Text>
              </GlassCard>
            </TouchableOpacity>
          )}
        </View>

        {/* Weekly Stats Cards - Frosted Liquid Glass */}
        {weeklyStats && (
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard} interactive>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {weeklyStats.completedWorkouts}/{weeklyStats.totalWorkouts}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Workouts</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} interactive>
              <Text style={[styles.statValue, { color: colors.text }]}>Week {currentWeek}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Current</Text>
            </GlassCard>
          </View>
        )}

        {/* Workout Calendar Card - Frosted Liquid Glass */}
        {weeklyPlan && (
          <WorkoutCalendarCard
            weeklyPlan={weeklyPlan}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={setSelectedDay}
          />
        )}

        {/* Generate Plan Section - show when no plan exists */}
        {!weeklyPlan && !isGenerating && (
          <Animated.View entering={FadeIn}>
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
                  <Ionicons name="barbell-outline" size={32} color={colors.text} />
                </BlurView>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Personalized Training Plan</Text>
              <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
                AI will generate a customized workout plan based on your fitness goals, activity level, and preferences
              </Text>

              {/* Goal Summary */}
              <View style={[styles.goalSummary, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name="flag-outline" size={18} color={colors.protein} />
                <Text style={[styles.goalSummaryText, { color: colors.textSecondary }]}>{getGoalSummary()}</Text>
              </View>

              {!goalWizardState?.primaryGoal && (
                <TouchableOpacity style={styles.linkButton} onPress={handleSetGoals}>
                  <Text style={[styles.linkButtonText, { color: colors.accent }]}>Set Your Goals First</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.accent} />
                </TouchableOpacity>
              )}

              {/* Frosted Glass Generate Button */}
              <GlassButton
                title="Generate My Training Plan"
                icon="sparkles-outline"
                variant="secondary"
                size="large"
                fullWidth
                disabled={isGenerating || !goalWizardState?.primaryGoal}
                onPress={handleGenerate}
              />
            </GlassCard>
          </Animated.View>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <View style={styles.loadingHeader}>
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Creating your personalized training plan...</Text>
            </View>
            <LoadingState count={4} />
          </Animated.View>
        )}

        {/* Error State */}
        {error && !isGenerating && (
          <Animated.View entering={FadeIn}>
            <GlassCard style={styles.errorCard} interactive>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>
              <Text style={[styles.errorText, { color: colors.textMuted }]}>{error}</Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={handleGenerate}>
                <Text style={[styles.retryButtonText, { color: colors.primaryText }]}>Try Again</Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        )}

        {/* Training Plan Content - show when plan exists */}
        {weeklyPlan && !isGenerating && (
          <Animated.View entering={FadeInDown.delay(100)}>
            {/* Plan Summary Card */}
            {planSummary && (
              <PlanSummaryCard
                summary={planSummary}
                onStartTraining={handleStartTraining}
                showStartButton={false}
              />
            )}

            {/* Goal Alignment Card */}
            {goalAlignment && preferences && (
              <GoalAlignmentCard alignment={goalAlignment} preferences={preferences} />
            )}

            {/* Today's Workout */}
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
                  dayName={currentDay.dayOfWeek}
                  index={0}
                  weekNumber={currentWeek}
                  onMarkComplete={() => markWorkoutComplete(selectedDayIndex)}
                  onExerciseToggle={(exerciseId) => markExerciseComplete(selectedDayIndex, exerciseId)}
                  onSwapExercise={(exerciseId) => swapExercise(selectedDayIndex, exerciseId)}
                  onShowAlternatives={(workoutExercise) => showExerciseAlternatives(workoutExercise.exercise)}
                  onLogWeight={handleLogWeight}
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
                      <Ionicons name="bed-outline" size={32} color={colors.textMuted} />
                    </BlurView>
                  </View>
                  <Text style={[styles.restDayTitle, { color: colors.text }]}>Rest & Recovery</Text>
                  <Text style={[styles.restDayText, { color: colors.textMuted }]}>
                    Take today to recover. Light stretching or a walk is encouraged.
                  </Text>
                </GlassCard>
              ) : null}
            </View>

            {/* Week Navigation */}
            <View style={styles.weekNavigation}>
              <TouchableOpacity
                style={styles.weekButton}
                onPress={() => {
                  lightImpact();
                  goToPreviousWeek();
                  generateWeeklyPlan();
                }}
                disabled={currentWeek === 1}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={currentWeek === 1 ? colors.border : colors.text}
                />
                <Text style={[styles.weekButtonText, { color: colors.text }, currentWeek === 1 && { color: colors.border }]}>
                  Previous Week
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.weekButton}
                onPress={() => {
                  lightImpact();
                  goToNextWeek();
                  generateWeeklyPlan();
                }}
              >
                <Text style={[styles.weekButtonText, { color: colors.text }]}>Next Week</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Regenerate Button - Frosted Liquid Glass */}
            <View style={styles.regenerateSection}>
              <TouchableOpacity onPress={handleGenerate} disabled={isGenerating} activeOpacity={0.7}>
                <GlassCard style={styles.regenerateButton} interactive>
                  <View style={styles.regenerateButtonInner}>
                    <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
                    <Text style={[styles.regenerateButtonText, { color: colors.textMuted }]}>Regenerate Plan</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Action Buttons - Frosted Liquid Glass */}
        {weeklyPlan && (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handleSetGoals} activeOpacity={0.7} style={styles.actionButtonWrapper}>
              <GlassCard style={styles.actionButton} interactive>
                <View style={styles.actionButtonInner}>
                  <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                    <Ionicons name="settings-outline" size={20} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>Adjust Goals</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCoachModal(true)} activeOpacity={0.7} style={styles.actionButtonWrapper}>
              <GlassCard style={styles.actionButton} interactive>
                <View style={styles.actionButtonInner}>
                  <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                    <Ionicons name="sparkles-outline" size={20} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>AI Coach</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        )}

        {/* Form Coach Card - Workout Form Analysis */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <WorkoutFormCoachCard />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Program Library Modal - Frosted Liquid Glass */}
      <Modal
        visible={showProgramModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProgramModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <BlurView intensity={isDark ? 20 : 35} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowProgramModal(false)}
              >
                <GlassCard style={styles.modalCloseButtonGlass} interactive>
                  <Ionicons name="close" size={24} color={colors.text} />
                </GlassCard>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Training Programs</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Choose a program that matches your goals
            </Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {allPrograms.map((program, index) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  isSelected={selectedProgram?.id === program.id}
                  onSelect={() => handleSelectProgram(program)}
                  index={index}
                />
              ))}
              <View style={{ height: 50 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

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
        onClose={() => {
          setShowWeightModal(false);
          setSelectedExerciseForWeight(null);
        }}
        onSave={handleSaveWeight}
      />

      {/* AI Coach Chat Modal - Training Mode */}
      <CoachChatModal
        visible={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        mode="training"
        context={{
          userGoals: {
            fitnessGoal: trainingState.program?.goal || 'general_fitness',
            activityLevel: 'active',
          },
          recentWorkouts: trainingState.completedExercises?.slice(-5).map(ex => ({
            type: ex.exerciseName || 'Unknown',
            duration: 45,
            date: new Date().toISOString(),
          })),
        }}
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.thin,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    fontFamily: Fonts.thin,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
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
  regenerateSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  regenerateButton: {
    // GlassCard handles styling
  },
  regenerateButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
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
  modalCloseButton: {
    width: 40,
    height: 40,
  },
  modalCloseButtonGlass: {
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
});
