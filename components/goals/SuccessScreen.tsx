import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, Dimensions, Modal } from 'react-native';
import Animated, {
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import {
  Flame,
  Dumbbell,
  TrendingUp,
  Activity,
  Calendar,
  Utensils,
  Heart,
  Target,
  Beef,
  Wheat,
  Nut,
  Lightbulb,
  Settings as SettingsIcon,
  Timer,
  Play,
  ChevronRight,
  Apple,
  Pizza,
  Coffee,
  Cookie,
  Salad,
  CheckCircle2,
  PartyPopper
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useGoalWizard } from '../../contexts/GoalWizardContext';
import { NumberText } from '../NumberText';
import { useSettings } from '../../contexts/SettingsContext';
import { useTraining } from '../../contexts/TrainingContext';
import { successNotification, lightImpact } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';
import {
  generateWorkoutGuidance,
  generateDailyGuidance,
} from '../../services/openaiService';
import { GoalAlignmentCard } from '../training/GoalAlignmentCard';
import { PlanSummaryCard } from './PlanSummaryCard';
import { useAuth } from '../../contexts/AuthContext';

interface SuccessScreenProps {
  onLogMeal: () => void;
  onViewDashboard: () => void;
  onAdjust?: () => void;
  onViewAvatar?: () => void;
  onStartMealPlan?: () => void;
  onStartTrainingPlan?: () => void;
  isGeneratingMealPlan?: boolean;
  isGeneratingTrainingPlan?: boolean;
}

export function SuccessScreen({ onLogMeal, onViewDashboard, onAdjust, onViewAvatar, onStartMealPlan, onStartTrainingPlan, isGeneratingMealPlan, isGeneratingTrainingPlan }: SuccessScreenProps) {
  const { state, resetWizard, calculateResults } = useGoalWizard();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { state: trainingState, getEnhancedPrograms } = useTraining();
  const { goalAlignment, preferences, planSummary } = trainingState;
  const hasPlayedHaptic = useRef(false);
  const hasCalculatedResults = useRef(false);
  const confettiRef = useRef<any>(null);

  // AI-generated content state
  const [workoutGuidance, setWorkoutGuidance] = useState<string>('');
  const [dailyGuidance, setDailyGuidance] = useState<string>('');
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Translucent primary color for active button
  const primaryGlassBg = isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)';

  // Ensure results are calculated if missing (e.g., after app reload)
  useEffect(() => {
    if (!state.results && !hasCalculatedResults.current) {
      console.log('[SuccessScreen] Results missing, recalculating...');
      hasCalculatedResults.current = true;
      calculateResults();
    }
  }, [state.results, calculateResults]);

  useEffect(() => {
    // Play haptic and confetti once
    if (!hasPlayedHaptic.current) {
      hasPlayedHaptic.current = true;
      successNotification();
      // Trigger confetti after a tiny delay
      setTimeout(() => {
        confettiRef.current?.start();
      }, 100);
    }
  }, []);

  // Generate AI workout guidance
  useEffect(() => {
    async function generateWorkout() {
      if (!state.primaryGoal || workoutGuidance || isLoadingWorkout) return;

      setIsLoadingWorkout(true);
      try {
        // Get selected program details if a program was selected
        let selectedProgramInfo = undefined;
        if (state.selectedProgramId) {
          const programs = getEnhancedPrograms();
          const selectedProgram = programs.find(p => p.id === state.selectedProgramId);
          if (selectedProgram) {
            selectedProgramInfo = {
              name: selectedProgram.name,
              description: selectedProgram.description,
              difficulty: selectedProgram.difficulty,
              duration: selectedProgram.duration,
              daysPerWeek: selectedProgram.daysPerWeek,
              focus: selectedProgram.focus,
            };
          }
        }

        const guidance = await generateWorkoutGuidance({
          primaryGoal: state.primaryGoal,
          workoutsPerWeek: state.workoutsPerWeek || 3,
          workoutDuration: state.workoutDuration || 30,
          activityLevel: state.activityLevel || 'moderate',
          equipmentAccess: state.availableEquipment || [],
          injuries: state.injuries?.join(', ') || undefined,
          userName: user?.firstName || undefined,
          selectedProgram: selectedProgramInfo,
        });
        setWorkoutGuidance(guidance);
      } catch (error) {
        console.error('[SuccessScreen] Error generating workout guidance:', error);
        setWorkoutGuidance('Your personalized workout plan is being prepared. Please check back soon.');
      } finally {
        setIsLoadingWorkout(false);
      }
    }

    generateWorkout();
  }, [state.primaryGoal, state.workoutsPerWeek, state.workoutDuration, state.activityLevel, state.selectedProgramId, getEnhancedPrograms]);

  // Generate AI daily guidance
  useEffect(() => {
    async function generateDaily() {
      if (!state.results || dailyGuidance || isLoadingDaily) return;

      setIsLoadingDaily(true);
      try {
        const guidance = await generateDailyGuidance({
          primaryGoal: state.primaryGoal,
          currentWeight: state.currentWeight,
          targetWeight: state.targetWeight,
          activityLevel: state.activityLevel || 'moderate',
          dailyCalories: state.results.calories,
          protein: state.results.protein,
          carbs: state.results.carbs,
          fat: state.results.fat,
          userName: user?.firstName || undefined,
        });
        setDailyGuidance(guidance);
      } catch (error) {
        console.error('[SuccessScreen] Error generating daily guidance:', error);
        setDailyGuidance('Your personalized daily guidance is being prepared. Focus on consistency and tracking your meals.');
      } finally {
        setIsLoadingDaily(false);
      }
    }

    generateDaily();
  }, [state.results, state.primaryGoal, state.currentWeight, state.targetWeight]);

  const handleLogMeal = () => {
    lightImpact();
    onLogMeal();
  };

  const handleViewDashboard = () => {
    lightImpact();
    onViewDashboard();
  };

  const handleAdjust = () => {
    lightImpact();
    if (onAdjust) {
      onAdjust();
    }
  };

  const handleViewAvatar = () => {
    lightImpact();
    if (onViewAvatar) {
      onViewAvatar();
    }
  };

  const handleStartMealPlan = () => {
    lightImpact();
    if (onStartMealPlan) {
      onStartMealPlan();
    }
  };

  const handleStartTrainingPlan = () => {
    lightImpact();

    // Check if user has selected a training program from goal wizard
    if (!state.selectedProgramId) {
      Alert.alert(
        'Program Required',
        'Please select a training program before generating your workout plan.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Select Program',
            onPress: () => {
              // Navigate to programs tab to select a program
              if (onViewDashboard) {
                onViewDashboard();
              }
            }
          }
        ]
      );
      return;
    }

    // Program selected - proceed with generation
    if (onStartTrainingPlan) {
      onStartTrainingPlan();
    }
  };

  // Pulsating Food Circle Component
  const PulsatingFoodCircle = ({ delay, backgroundColor, icon }: { delay: number; backgroundColor: string; icon: React.ReactNode }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Animated.View
        entering={SlideInRight.duration(600).delay(delay)}
        style={[styles.foodColorCircle, { backgroundColor }, animatedStyle]}
      >
        {icon}
      </Animated.View>
    );
  };

  // Rotating Main Icon Component
  const RotatingMainIcon = () => {
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    }));

    return (
      <Animated.View
        entering={SlideInRight.duration(600).delay(500)}
        style={styles.mealLoadingIconContainer}
      >
        <Animated.View style={[styles.mealLoadingCircle, { backgroundColor: Colors.error }, animatedStyle]}>
          <Utensils size={56} color={Colors.background} />
        </Animated.View>
      </Animated.View>
    );
  };

  // Pulsating Text Component
  const PulsatingText = ({ delay, style, children }: { delay: number; style: any; children: React.ReactNode }) => {
    const opacity = useSharedValue(0.6);

    useEffect(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    return (
      <Animated.Text
        entering={SlideInRight.duration(600).delay(delay)}
        style={[style, animatedStyle]}
      >
        {children}
      </Animated.Text>
    );
  };

  // Show loading while calculating results
  if (!state.results) {
    return (
      <View style={[styles.scrollContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Calculating your personalized plan...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Meal Plan Loading Modal */}
      <Modal
        visible={isGeneratingMealPlan || false}
        animationType="fade"
        transparent={false}
      >
        <View style={[styles.mealLoadingContainer, { backgroundColor: isDark ? '#000' : '#fff' }]}>
          <View style={styles.mealLoadingContent}>
            {/* Colorful food circles with pulsating animation */}
            <View style={styles.foodCirclesContainer}>
              <PulsatingFoodCircle
                delay={0}
                backgroundColor="#FF6B6B"
                icon={<Apple size={24} color="#fff" />}
              />
              <PulsatingFoodCircle
                delay={100}
                backgroundColor="#FFB800"
                icon={<Pizza size={24} color="#fff" />}
              />
              <PulsatingFoodCircle
                delay={200}
                backgroundColor="#8B4513"
                icon={<Coffee size={24} color="#fff" />}
              />
              <PulsatingFoodCircle
                delay={300}
                backgroundColor="#F9CA24"
                icon={<Cookie size={24} color="#fff" />}
              />
              <PulsatingFoodCircle
                delay={400}
                backgroundColor="#6AB04C"
                icon={<Salad size={24} color="#fff" />}
              />
            </View>

            {/* Main icon with rotating and pulsing animation */}
            <RotatingMainIcon />

            {/* Text content with pulsating animation */}
            <PulsatingText
              delay={700}
              style={[styles.mealLoadingTitle, { color: colors.text }]}
            >
              🍽️ Creating Your Meal Plan...
            </PulsatingText>
            <PulsatingText
              delay={900}
              style={[styles.mealLoadingSubtitle, { color: colors.textSecondary }]}
            >
              AI is crafting personalized meals
            </PulsatingText>
            <PulsatingText
              delay={1100}
              style={[styles.mealLoadingDetail, { color: colors.textMuted }]}
            >
              Balancing macros and matching your preferences
            </PulsatingText>
          </View>
        </View>
      </Modal>

      {/* Confetti Celebration */}
      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
        autoStart={false}
        fadeOut
        fallSpeed={3000}
        colors={['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6ab04c', '#badc58', '#f0932b', '#eb4d4b', '#686de0', '#be2edd']}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
        <View style={styles.checkContainer}>
          <View style={styles.checkCircle}>
            <Target size={48} color={Colors.background} />
          </View>
        </View>
      </View>

      {/* Success Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.numericSemiBold }]}>
          {user?.firstName ? `${user.firstName}, ` : ''}You're All Set!
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.numericRegular }]}>
          Your personalized nutrition plan is ready. Use this as your daily guide to reach your goals.
        </Text>
      </View>

      {/* Daily Targets - Separate Cards */}
      {state.results && (
        <View style={styles.targetsSection}>
          <Text style={[styles.targetsSectionHeader, { color: colors.textMuted, fontFamily: Fonts.numericSemiBold }]}>YOUR DAILY TARGETS</Text>
          <View style={styles.targetsGrid}>
            <GlassCard style={styles.targetCard} interactive>
              <Flame size={20} color={Colors.error} />
              <NumberText weight="regular" style={[styles.targetValue, { color: colors.text }]}>
                {Math.round(state.results.calories).toLocaleString()}
              </NumberText>
              <Text style={[styles.targetLabel, { color: colors.textMuted, fontFamily: Fonts.numericRegular }]}>Calories</Text>
            </GlassCard>
            <GlassCard style={styles.targetCard} interactive>
              <Beef size={20} color={colors.protein} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <NumberText weight="regular" style={[styles.targetValue, { color: colors.text }]}>
                  {state.results.protein}
                </NumberText>
                <Text style={[styles.targetUnit, { color: colors.text, fontFamily: Fonts.numericRegular }]}>g</Text>
              </View>
              <Text style={[styles.targetLabel, { color: colors.textMuted, fontFamily: Fonts.numericRegular }]}>Protein</Text>
            </GlassCard>
            <GlassCard style={styles.targetCard} interactive>
              <Wheat size={20} color={colors.carbs} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <NumberText weight="regular" style={[styles.targetValue, { color: colors.text }]}>
                  {state.results.carbs}
                </NumberText>
                <Text style={[styles.targetUnit, { color: colors.text, fontFamily: Fonts.numericRegular }]}>g</Text>
              </View>
              <Text style={[styles.targetLabel, { color: colors.textMuted, fontFamily: Fonts.numericRegular }]}>Carbs</Text>
            </GlassCard>
            <GlassCard style={styles.targetCard} interactive>
              <Nut size={20} color={colors.fat} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <NumberText weight="regular" style={[styles.targetValue, { color: colors.text }]}>
                  {state.results.fat}
                </NumberText>
                <Text style={[styles.targetUnit, { color: colors.text, fontFamily: Fonts.numericRegular }]}>g</Text>
              </View>
              <Text style={[styles.targetLabel, { color: colors.textMuted, fontFamily: Fonts.numericRegular }]}>Fat</Text>
            </GlassCard>
          </View>
        </View>
      )}

      {/* Your Training Plan Card */}
      {planSummary && (
        <PlanSummaryCard
          summary={planSummary}
          onStartTraining={handleStartTrainingPlan}
          showStartButton={false}
          containerStyle={{ marginHorizontal: 0, width: '100%' }}
        />
      )}

      {/* Goal Alignment Card */}
      {goalAlignment && preferences && (
        <GoalAlignmentCard
          alignment={goalAlignment}
          preferences={preferences}
          containerStyle={{ marginHorizontal: 0, width: '100%' }}
        />
      )}

      {/* Action Cards Container */}
      <View style={styles.actionCardsContainer}>
        {/* Coaching Video Button */}
        {onViewAvatar && (
          <View>
            <Pressable
              onPress={handleViewAvatar}
              testID="watch-coaching-button"
              accessibilityRole="button"
              accessibilityLabel="Watch your customized coaching explained"
            >
              <GlassCard style={styles.coachingButtonCard} interactive>
                <View style={styles.coachingButtonInner}>
                  <View style={styles.coachingIconContainer}>
                    <View style={styles.playIconCircle}>
                      <Play size={20} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.coachingTextContainer}>
                    <Text style={[styles.coachingButtonTitle, { color: colors.text, fontFamily: Fonts.numericSemiBold }]}>WATCH YOUR CUSTOMIZED COACHING</Text>
                    <Text style={[styles.coachingButtonSubtitle, { color: colors.textMuted, fontFamily: Fonts.numericRegular }]}>Your AI coach explains your personalized plan</Text>
                  </View>
                  <ChevronRight size={20} color={colors.textMuted} />
                </View>
              </GlassCard>
          </Pressable>
        </View>
      )}

      {/* Start 7-Day Meal Plan Button */}
      {onStartMealPlan && (
        <View>
          <Pressable
            onPress={handleStartMealPlan}
            testID="start-meal-plan-button"
            accessibilityRole="button"
            accessibilityLabel="Start your 7-day meal plan"
            disabled={isGeneratingMealPlan || isGeneratingTrainingPlan}
          >
            <GlassCard style={[styles.mealPlanButtonCard, (isGeneratingMealPlan || isGeneratingTrainingPlan) && { opacity: 0.7 }]} interactive>
              <View style={styles.mealPlanButtonInner}>
                <View style={styles.mealPlanIconContainer}>
                  <View style={styles.mealPlanIconCircle}>
                    {isGeneratingMealPlan ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Utensils size={20} color="#fff" />
                    )}
                  </View>
                </View>
                <View style={styles.coachingTextContainer}>
                  <Text style={[styles.mealPlanButtonTitle, { color: colors.text, fontFamily: Fonts.numericSemiBold }]}>
                    {isGeneratingMealPlan ? 'GENERATING AI MEAL PLAN...' : 'START YOUR '}
                    {!isGeneratingMealPlan && (
                      <NumberText weight="semiBold" style={[styles.mealPlanButtonTitle, { color: colors.text }]}>7</NumberText>
                    )}
                    {isGeneratingMealPlan ? '' : '-DAY MEAL PLAN'}
                  </Text>
                  <Text style={[styles.mealPlanButtonSubtitle, { color: colors.textMuted, fontFamily: Fonts.numericRegular }]}>
                    {isGeneratingMealPlan ? 'Please wait while AI creates your plan' : 'AI-generated meals tailored to your goals'}
                  </Text>
                </View>
                {!isGeneratingMealPlan && <ChevronRight size={20} color={colors.textMuted} />}
              </View>
            </GlassCard>
          </Pressable>
        </View>
      )}

      {/* Start Training Plan Button */}
      {onStartTrainingPlan && (
        <View>
          <Pressable
            onPress={handleStartTrainingPlan}
            testID="start-training-plan-button"
            accessibilityRole="button"
            accessibilityLabel="Start your training plan"
            disabled={isGeneratingMealPlan || isGeneratingTrainingPlan}
          >
            <GlassCard style={[styles.trainingPlanButtonCard, (isGeneratingMealPlan || isGeneratingTrainingPlan) && { opacity: 0.7 }]} interactive>
              <View style={styles.trainingPlanButtonInner}>
                <View style={styles.trainingPlanIconContainer}>
                  <View style={styles.trainingPlanIconCircle}>
                    {isGeneratingTrainingPlan ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Dumbbell size={20} color="#fff" />
                    )}
                  </View>
                </View>
                <View style={styles.coachingTextContainer}>
                  <Text style={[styles.trainingPlanButtonTitle, { color: colors.text, fontFamily: Fonts.numericSemiBold }]}>
                    {isGeneratingTrainingPlan ? 'GENERATING AI TRAINING PLAN...' : 'START YOUR TRAINING PLAN'}
                  </Text>
                  <Text style={[styles.trainingPlanButtonSubtitle, { color: colors.textMuted, fontFamily: Fonts.numericRegular }]}>
                    {isGeneratingTrainingPlan
                      ? 'Please wait while AI creates your plan'
                      : (
                        <>
                          <NumberText weight="light" style={[styles.trainingPlanButtonSubtitle, { color: colors.textMuted }]}>
                            {state.workoutsPerWeek || 3}
                          </NumberText>
                          {` days/week • ${state.primaryGoal === 'lose_weight' ? 'Fat burning' : state.primaryGoal === 'build_muscle' ? 'Muscle building' : 'Fitness'} focused`}
                        </>
                      )
                    }
                  </Text>
                </View>
                {!isGeneratingTrainingPlan && <ChevronRight size={20} color={colors.textMuted} />}
              </View>
            </GlassCard>
          </Pressable>
        </View>
      )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handleLogMeal}
          testID="log-meal-button"
          accessibilityRole="button"
          accessibilityLabel="Log your first meal"
        >
          <GlassCard style={[styles.primaryButtonCard, { backgroundColor: primaryGlassBg }]} interactive>
            <View style={styles.primaryButton}>
              <Target size={22} color={colors.primary} />
              <Text style={[styles.primaryButtonText, { color: colors.primary, fontFamily: Fonts.numericSemiBold }]}>LOG YOUR FIRST MEAL</Text>
            </View>
          </GlassCard>
        </Pressable>

        <View style={styles.secondaryButtonRow}>
          <Pressable
            onPress={handleViewDashboard}
            testID="view-dashboard-button"
            accessibilityRole="button"
            accessibilityLabel="View dashboard"
            style={{ flex: 1 }}
          >
            <GlassCard style={styles.secondaryButtonCard} interactive>
              <View style={styles.secondaryButton}>
                <Heart size={20} color={colors.text} />
                <Text style={[styles.secondaryButtonText, { color: colors.text, fontFamily: Fonts.numericSemiBold }]}>DASHBOARD</Text>
              </View>
            </GlassCard>
          </Pressable>

          {onAdjust && (
            <Pressable
              onPress={handleAdjust}
              testID="adjust-goals-button"
              accessibilityRole="button"
              accessibilityLabel="Adjust your goals"
              style={{ flex: 1 }}
            >
              <GlassCard style={styles.adjustButtonCard} interactive>
                <View style={styles.adjustButton}>
                  <SettingsIcon size={20} color={colors.text} />
                  <Text style={[styles.adjustButtonText, { color: colors.text, fontFamily: Fonts.numericSemiBold }]}>ADJUST</Text>
                </View>
              </GlassCard>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    paddingBottom: 100,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  targetsSection: {
    width: '100%',
    marginBottom: 16,
  },
  targetsSectionHeader: {
    fontSize: 10,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 24,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  targetLabel: {
    fontSize: 11,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetUnit: {
    fontSize: 18,
    fontFamily: Fonts.light,
    marginLeft: 2,
  },
  workoutPlanCard: {
    width: '100%',
    padding: 16,
    marginBottom: 16,
  },
  workoutPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  workoutPlanTitle: {
    fontSize: 10,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: Colors.error,
  },
  workoutPlanDescription: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  workoutPlanBold: {
    fontFamily: Fonts.medium,
    fontWeight: '500',
    color: Colors.protein,
  },
  workoutPlanFeatures: {
    gap: 12,
    marginBottom: 12,
  },
  workoutFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutFeatureText: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.textSecondary,
  },
  workoutPlanNote: {
    marginTop: 4,
  },
  workoutPlanNoteInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  workoutPlanNoteText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.textMuted,
    lineHeight: 16,
  },
  guidanceCard: {
    width: '100%',
    padding: 16,
    marginBottom: 16,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  guidanceTitle: {
    fontSize: 10,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: Colors.warning,
  },
  guidanceText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionCardsContainer: {
    width: '100%',
  },
  coachingButtonCard: {
    marginBottom: 16,
  },
  coachingButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealPlanButtonCard: {
    marginBottom: 16,
  },
  mealPlanButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealPlanIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealPlanIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealPlanButtonTitle: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  mealPlanButtonSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  trainingPlanButtonCard: {
    marginBottom: 16,
  },
  trainingPlanButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trainingPlanIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainingPlanIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainingPlanButtonTitle: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  trainingPlanButtonSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  coachingIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  coachingTextContainer: {
    flex: 1,
  },
  coachingButtonTitle: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  coachingButtonSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    zIndex: 10,
  },
  primaryButtonCard: {
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
  },
  secondaryButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButtonCard: {
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
  },
  adjustButtonCard: {
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adjustButtonText: {
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
  },
  // Meal plan loading modal styles
  mealLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mealLoadingContent: {
    alignItems: 'center',
    gap: 20,
  },
  foodCirclesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  foodColorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealLoadingIconContainer: {
    marginBottom: 24,
  },
  mealLoadingCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  mealLoadingTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  mealLoadingSubtitle: {
    fontSize: 17,
    textAlign: 'center',
    opacity: 0.8,
    fontWeight: '500',
  },
  mealLoadingDetail: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 8,
  },
});
