import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useGoalWizard } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { successNotification, lightImpact } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';

const { width, height } = Dimensions.get('window');

// Confetti particle component
interface ConfettiProps {
  index: number;
  color: string;
}

function Confetti({ index, color }: ConfettiProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const startX = Math.random() * width;
  const endX = startX + (Math.random() - 0.5) * 200;

  useEffect(() => {
    const delay = Math.random() * 500;

    translateY.value = withDelay(
      delay,
      withTiming(height + 100, {
        duration: 2500 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      })
    );

    translateX.value = withDelay(
      delay,
      withTiming(endX - startX, {
        duration: 2500 + Math.random() * 1000,
        easing: Easing.inOut(Easing.sin),
      })
    );

    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: 1000 + Math.random() * 500 }),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay + 1500,
      withSpring(0, GLASS_SPRING)
    );
  }, [translateY, translateX, rotate, opacity, endX, startX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotate: `${rotate.value}deg` },
      ] as const,
      opacity: opacity.value,
      left: startX,
    };
  });

  const size = 8 + Math.random() * 8;
  const isCircle = Math.random() > 0.5;

  return (
    <Animated.View
      style={[
        styles.confetti,
        animatedStyle,
        {
          width: size,
          height: isCircle ? size : size * 2,
          borderRadius: isCircle ? size / 2 : 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}

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
  const { state, resetWizard } = useGoalWizard();
  const { settings } = useSettings();
  const hasPlayedHaptic = useRef(false);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Translucent primary color for active button
  const primaryGlassBg = isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)';

  // Animation values
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  // Confetti colors
  const confettiColors = [Colors.success, Colors.error, Colors.warning, Colors.successMuted, '#DDA0DD', '#45B7D1'];

  useEffect(() => {
    // Play haptic once
    if (!hasPlayedHaptic.current) {
      hasPlayedHaptic.current = true;
      successNotification();
    }

    // Ring burst animation
    ringScale.value = withSequence(
      withTiming(1.5, { duration: 400, easing: Easing.out(Easing.ease) }),
      withSpring(2, GLASS_SPRING)
    );
    ringOpacity.value = withSequence(
      withSpring(0.5, GLASS_SPRING),
      withDelay(200, withSpring(0, GLASS_SPRING))
    );

    // Checkmark animation
    checkScale.value = withDelay(
      200,
      withSpring(1, { damping: 8, stiffness: 150 })
    );
    checkOpacity.value = withDelay(200, withSpring(1, GLASS_SPRING));

    // Text animation
    textOpacity.value = withDelay(500, withSpring(1, GLASS_SPRING));
    textTranslateY.value = withDelay(500, withSpring(0, { damping: 12 }));

    // Card animation
    cardOpacity.value = withDelay(700, withSpring(1, GLASS_SPRING));
    cardScale.value = withDelay(700, withSpring(1, { damping: 12 }));

    // Button animation
    buttonOpacity.value = withDelay(1000, withSpring(1, GLASS_SPRING));
    buttonTranslateY.value = withDelay(1000, withSpring(0, { damping: 12 }));
  }, [
    ringScale, ringOpacity, checkScale, checkOpacity,
    textOpacity, textTranslateY, cardOpacity, cardScale,
    buttonOpacity, buttonTranslateY
  ]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

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
    if (onStartTrainingPlan) {
      onStartTrainingPlan();
    }
  };

  // Helper functions for displaying user profile data
  const getGoalLabel = () => {
    switch (state.primaryGoal) {
      case 'lose_weight': return 'Lose Weight';
      case 'build_muscle': return 'Build Muscle';
      case 'maintain': return 'Maintain Weight';
      case 'improve_health': return 'Improve Health';
      case 'custom': return 'Custom Goal';
      default: return 'Not Set';
    }
  };

  const getActivityLabel = () => {
    switch (state.activityLevel) {
      case 'sedentary': return 'Sedentary';
      case 'light': return 'Lightly Active';
      case 'moderate': return 'Moderately Active';
      case 'very': return 'Very Active';
      case 'extra': return 'Extremely Active';
      default: return 'Not Set';
    }
  };

  const getDietLabel = () => {
    switch (state.dietStyle) {
      case 'standard': return 'Standard';
      case 'keto': return 'Keto';
      case 'high_protein': return 'High Protein';
      case 'vegetarian': return 'Vegetarian';
      case 'vegan': return 'Vegan';
      case 'custom': return 'Custom';
      default: return 'Standard';
    }
  };

  const formatWeight = (weight: number | null) => {
    if (!weight) return '--';
    return state.weightUnit === 'kg' ? `${weight} kg` : `${weight} lbs`;
  };

  const formatHeight = () => {
    if (!state.heightFt) return '--';
    if (state.heightUnit === 'cm') {
      const totalInches = (state.heightFt * 12) + (state.heightIn || 0);
      const cm = Math.round(totalInches * 2.54);
      return `${cm} cm`;
    }
    return `${state.heightFt}'${state.heightIn || 0}"`;
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Confetti */}
      {Array.from({ length: 40 }).map((_, index) => (
        <Confetti
          key={index}
          index={index}
          color={confettiColors[index % confettiColors.length]}
        />
      ))}

      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.checkContainer, checkStyle]}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color={Colors.background} />
          </View>
        </Animated.View>
      </View>

      {/* Success Text */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={[styles.title, { color: colors.text }]}>You're All Set!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your personalized nutrition plan is ready. Use this as your daily guide to reach your goals.
        </Text>
      </Animated.View>

      {/* Daily Targets - Separate Cards */}
      {state.results && (
        <Animated.View style={[styles.targetsSection, cardStyle]}>
          <Text style={[styles.targetsSectionHeader, { color: colors.textMuted }]}>YOUR DAILY TARGETS</Text>
          <View style={styles.targetsGrid}>
            <GlassCard style={styles.targetCard} interactive>
              <Ionicons name="flame" size={20} color={Colors.error} />
              <Text style={[styles.targetValue, { color: colors.text }]}>{state.results.calories.toLocaleString()}</Text>
              <Text style={[styles.targetLabel, { color: colors.textMuted }]}>Calories</Text>
            </GlassCard>
            <GlassCard style={styles.targetCard} interactive>
              <Ionicons name="fish" size={20} color={colors.protein} />
              <Text style={[styles.targetValue, { color: colors.text }]}>{state.results.protein}g</Text>
              <Text style={[styles.targetLabel, { color: colors.textMuted }]}>Protein</Text>
            </GlassCard>
            <GlassCard style={styles.targetCard} interactive>
              <Ionicons name="leaf" size={20} color={colors.carbs} />
              <Text style={[styles.targetValue, { color: colors.text }]}>{state.results.carbs}g</Text>
              <Text style={[styles.targetLabel, { color: colors.textMuted }]}>Carbs</Text>
            </GlassCard>
            <GlassCard style={styles.targetCard} interactive>
              <Ionicons name="water" size={20} color={colors.fat} />
              <Text style={[styles.targetValue, { color: colors.text }]}>{state.results.fat}g</Text>
              <Text style={[styles.targetLabel, { color: colors.textMuted }]}>Fat</Text>
            </GlassCard>
          </View>
        </Animated.View>
      )}

      {/* Workout Plan Commentary */}
      <Animated.View entering={FadeInDown.delay(750).duration(400)}>
        <GlassCard style={styles.workoutPlanCard} interactive>
          <View style={styles.workoutPlanHeader}>
            <Ionicons name="barbell" size={20} color={Colors.error} />
            <Text style={styles.workoutPlanTitle}>YOUR WORKOUT PLAN</Text>
          </View>

          <Text style={[styles.workoutPlanDescription, { color: colors.text }]}>
            {state.primaryGoal === 'lose_weight' && (
              <>Based on your goal to lose weight, we recommend a <Text style={[styles.workoutPlanBold, { color: colors.protein }]}>Fat Burning HIIT program</Text> combining high-intensity cardio with strength training to maximize calorie burn while preserving muscle mass. This approach creates an optimal environment for fat loss while maintaining metabolic rate.</>
            )}
            {state.primaryGoal === 'build_muscle' && (
              <>Based on your goal to build muscle, we recommend a <Text style={[styles.workoutPlanBold, { color: colors.protein }]}>Progressive Overload Strength program</Text> focusing on compound movements and progressive resistance. This program emphasizes muscle hypertrophy through strategic volume and intensity manipulation.</>
            )}
            {state.primaryGoal === 'maintain' && (
              <>Based on your goal to maintain fitness, we recommend a <Text style={[styles.workoutPlanBold, { color: colors.protein }]}>Balanced Fitness program</Text> combining strength training, cardio, and mobility work to sustain your current fitness level and prevent regression.</>
            )}
            {state.primaryGoal === 'improve_health' && (
              <>Based on your goal to improve overall health, we recommend a <Text style={[styles.workoutPlanBold, { color: colors.protein }]}>Health & Wellness program</Text> emphasizing cardiovascular health, functional strength, and movement quality for long-term vitality.</>
            )}
          </Text>

          <View style={styles.workoutPlanFeatures}>
            <View style={styles.workoutFeatureItem}>
              <Ionicons name="calendar" size={16} color={colors.protein} />
              <Text style={[styles.workoutFeatureText, { color: colors.textSecondary }]}>
                {state.workoutsPerWeek || 3} workouts per week
              </Text>
            </View>
            <View style={styles.workoutFeatureItem}>
              <Ionicons name="time" size={16} color={colors.protein} />
              <Text style={[styles.workoutFeatureText, { color: colors.textSecondary }]}>
                {state.workoutDuration || 30} minutes per session
              </Text>
            </View>
            <View style={styles.workoutFeatureItem}>
              <Ionicons
                name={state.cardioPreference === 'walking' ? 'walk' : state.cardioPreference === 'running' ? 'fitness' : 'flash'}
                size={16}
                color={Colors.error}
              />
              <Text style={[styles.workoutFeatureText, { color: colors.textSecondary }]}>
                {state.cardioPreference === 'walking' && 'Walking-based cardio'}
                {state.cardioPreference === 'running' && 'Running-based cardio'}
                {state.cardioPreference === 'hiit' && 'HIIT training sessions'}
                {!state.cardioPreference && 'Customized cardio'}
              </Text>
            </View>
            <View style={styles.workoutFeatureItem}>
              <Ionicons name="trending-up" size={16} color={colors.protein} />
              <Text style={[styles.workoutFeatureText, { color: colors.textSecondary }]}>
                Progressive difficulty levels
              </Text>
            </View>
            <View style={styles.workoutFeatureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.protein} />
              <Text style={[styles.workoutFeatureText, { color: colors.textSecondary }]}>
                {state.primaryGoal === 'lose_weight' && 'Optimized for fat burning'}
                {state.primaryGoal === 'build_muscle' && 'Maximizes muscle growth'}
                {state.primaryGoal === 'maintain' && 'Sustains current fitness'}
                {state.primaryGoal === 'improve_health' && 'Enhances overall wellness'}
              </Text>
            </View>
          </View>

          <GlassCard style={styles.workoutPlanNote} interactive>
            <View style={styles.workoutPlanNoteInner}>
              <Ionicons name="information-circle" size={16} color={colors.textMuted} />
              <Text style={[styles.workoutPlanNoteText, { color: colors.textMuted }]}>
                Your plan adapts based on your progress and includes rest days for optimal recovery.
              </Text>
            </View>
          </GlassCard>
        </GlassCard>
      </Animated.View>

      {/* Detailed Profile Summary */}
      <Animated.View entering={FadeInDown.delay(850).duration(400)}>
        <GlassCard style={styles.profileCard} interactive>
          <View style={styles.profileHeader}>
            <Ionicons name="person-outline" size={20} color={Colors.success} />
            <Text style={styles.profileTitle}>YOUR PROFILE SUMMARY</Text>
          </View>

          <View style={styles.profileGrid}>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted }]}>Goal</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{getGoalLabel()}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted }]}>Activity</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{getActivityLabel()}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted }]}>Current Weight</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{formatWeight(state.currentWeight)}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted }]}>Target Weight</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{formatWeight(state.targetWeight)}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted }]}>Height</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{formatHeight()}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted }]}>Age</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{state.age || '--'} years</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted }]}>Diet Style</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{getDietLabel()}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted }]}>Workouts/Week</Text>
              <Text style={[styles.profileValue, { color: colors.text }]}>{state.workoutsPerWeek || 0}</Text>
            </GlassCard>
          </View>

          {/* Stats Row */}
          {state.results && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="flame-outline" size={16} color={Colors.error} />
                <Text style={[styles.statValue, { color: colors.text }]}>{state.results.bmr.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>BMR</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flash-outline" size={16} color={Colors.warning} />
                <Text style={[styles.statValue, { color: colors.text }]}>{state.results.tdee.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>TDEE</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="body-outline" size={16} color={Colors.success} />
                <Text style={[styles.statValue, { color: colors.text }]}>{state.results.bmi.toFixed(1)}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>BMI</Text>
              </View>
            </View>
          )}
        </GlassCard>
      </Animated.View>

      {/* Guidance Card */}
      <Animated.View entering={FadeInDown.delay(900).duration(400)}>
        <GlassCard style={styles.guidanceCard} interactive>
          <View style={styles.guidanceHeader}>
            <Ionicons name="bulb-outline" size={20} color={Colors.warning} />
            <Text style={styles.guidanceTitle}>DAILY GUIDANCE</Text>
          </View>
          <Text style={[styles.guidanceText, { color: colors.textSecondary }]}>
            {state.primaryGoal === 'lose_weight'
              ? `Stay consistent with your ${state.results?.calories.toLocaleString() || '--'} calorie target. Focus on protein to preserve muscle while losing fat. Track your meals to stay accountable.`
              : state.primaryGoal === 'build_muscle'
              ? `Prioritize your ${state.results?.protein || '--'}g protein goal daily. Spread protein across 4-5 meals for optimal muscle synthesis. Don't skip your post-workout nutrition.`
              : `Maintain balance with your macro targets. Focus on whole foods and consistent meal timing. Listen to your body's hunger cues.`
            }
          </Text>
        </GlassCard>
      </Animated.View>

      {/* Action Cards Container */}
      <View style={styles.actionCardsContainer}>
        {/* Coaching Video Button */}
        {onViewAvatar && (
          <Animated.View entering={FadeInDown.delay(1000).duration(400)}>
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
                      <Ionicons name="play" size={20} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.coachingTextContainer}>
                    <Text style={[styles.coachingButtonTitle, { color: colors.text }]}>Watch Your Customized Coaching</Text>
                    <Text style={[styles.coachingButtonSubtitle, { color: colors.textMuted }]}>Your AI coach explains your personalized plan</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
              </GlassCard>
          </Pressable>
        </Animated.View>
      )}

      {/* Start 7-Day Meal Plan Button */}
      {onStartMealPlan && (
        <Animated.View entering={FadeInDown.delay(1100).duration(400)}>
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
                      <Ionicons name="restaurant" size={20} color="#fff" />
                    )}
                  </View>
                </View>
                <View style={styles.coachingTextContainer}>
                  <Text style={[styles.mealPlanButtonTitle, { color: colors.text }]}>
                    {isGeneratingMealPlan ? 'Generating AI Meal Plan...' : 'Start Your 7-Day Meal Plan'}
                  </Text>
                  <Text style={[styles.mealPlanButtonSubtitle, { color: colors.textMuted }]}>
                    {isGeneratingMealPlan ? 'Please wait while AI creates your plan' : 'AI-generated meals tailored to your goals'}
                  </Text>
                </View>
                {!isGeneratingMealPlan && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      )}

      {/* Start Training Plan Button */}
      {onStartTrainingPlan && (
        <Animated.View entering={FadeInDown.delay(1200).duration(400)}>
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
                      <Ionicons name="barbell" size={20} color="#fff" />
                    )}
                  </View>
                </View>
                <View style={styles.coachingTextContainer}>
                  <Text style={[styles.trainingPlanButtonTitle, { color: colors.text }]}>
                    {isGeneratingTrainingPlan ? 'Generating AI Training Plan...' : 'Start Your Training Plan'}
                  </Text>
                  <Text style={[styles.trainingPlanButtonSubtitle, { color: colors.textMuted }]}>
                    {isGeneratingTrainingPlan
                      ? 'Please wait while AI creates your plan'
                      : `${state.workoutsPerWeek || 3} days/week • ${state.primaryGoal === 'lose_weight' ? 'Fat burning' : state.primaryGoal === 'build_muscle' ? 'Muscle building' : 'Fitness'} focused`
                    }
                  </Text>
                </View>
                {!isGeneratingTrainingPlan && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      )}
      </View>

      {/* Action Buttons */}
      <Animated.View style={[styles.buttonContainer, buttonStyle]}>
        <Pressable
          onPress={handleLogMeal}
          testID="log-meal-button"
          accessibilityRole="button"
          accessibilityLabel="Log your first meal"
        >
          <GlassCard style={[styles.primaryButtonCard, { backgroundColor: primaryGlassBg }]} interactive>
            <View style={styles.primaryButton}>
              <Ionicons name="add-circle" size={22} color={colors.primary} />
              <Text style={[styles.primaryButtonText, { color: colors.primary }]}>LOG YOUR FIRST MEAL</Text>
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
                <Ionicons name="home-outline" size={20} color={colors.text} />
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>DASHBOARD</Text>
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
                  <Ionicons name="settings-outline" size={20} color={colors.text} />
                  <Text style={[styles.adjustButtonText, { color: colors.text }]}>ADJUST</Text>
                </View>
              </GlassCard>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 100,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    top: -50,
    pointerEvents: 'none',
  },
  iconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.success,
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
    fontSize: 28,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
    gap: 10,
  },
  targetCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 24,
    fontFamily: Fonts.light,
    fontWeight: '100',
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
    gap: 10,
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
  profileCard: {
    width: '100%',
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  profileTitle: {
    fontSize: 10,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: Colors.success,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  profileItem: {
    width: '47%',
    padding: 12,
  },
  profileLabel: {
    fontSize: 10,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.textMuted,
    letterSpacing: 0.5,
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
    fontFamily: Fonts.regular,
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
    borderRadius: 18,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealPlanButtonTitle: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 4,
  },
  mealPlanButtonSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
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
    borderRadius: 18,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainingPlanButtonTitle: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 4,
  },
  trainingPlanButtonSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
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
    borderRadius: 18,
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
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 4,
  },
  coachingButtonSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
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
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: Fonts.light,
    fontWeight: '200',
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
    fontFamily: Fonts.light,
    fontWeight: '200',
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
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
  },
});
