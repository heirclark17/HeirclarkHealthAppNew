import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useGoalWizard } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { lightImpact, successNotification } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  style?: any;
}

function AnimatedNumber({ value, duration = 1200, delay = 0, suffix = '', style }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = 0;
    animatedValue.value = withDelay(
      delay,
      withTiming(value, {
        duration,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Update display value
    const updateValue = (v: number) => {
      setDisplayValue(Math.round(v));
    };

    const interval = setInterval(() => {
      const current = animatedValue.value;
      updateValue(current);
      if (Math.round(current) === value) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [value, duration, delay, animatedValue]);

  return (
    <Text style={style}>
      {displayValue.toLocaleString()}{suffix}
    </Text>
  );
}

interface MacroBarProps {
  label: string;
  value: number;
  percentage: number;
  color: string;
  delay: number;
  colors: typeof DarkColors;
}

function MacroBar({ label, value, percentage, color, delay, colors }: MacroBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withSpring(percentage, { damping: 15, stiffness: 90 })
    );
  }, [percentage, delay, width]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    backgroundColor: color,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.macroItem}>
      <View style={styles.macroHeader}>
        <Text style={[styles.macroLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.macroValue, { color: colors.text }]}>{value}g</Text>
      </View>
      <View style={[styles.macroBarBg, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.macroBarFill, barStyle]} />
      </View>
      <Text style={[styles.macroPercent, { color: colors.textMuted }]}>{Math.round(percentage)}%</Text>
    </Animated.View>
  );
}

interface PlanPreviewStepProps {
  onBack: () => void;
  onConfirm: () => void;
}

export function PlanPreviewStep({ onBack, onConfirm }: PlanPreviewStepProps) {
  const { state, calculateResults, saveGoals } = useGoalWizard();
  const { settings } = useSettings();
  const [isConfirming, setIsConfirming] = useState(false);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const buttonProgress = useSharedValue(0);

  // Create a dependency key from state values that affect calculation
  // This ensures we recalculate when user edits goals and returns
  const calculationKey = `${state.primaryGoal}-${state.currentWeight}-${state.targetWeight}-${state.activityLevel}-${state.dietStyle}-${state.workoutsPerWeek}-${state.age}-${state.sex}-${state.heightFt}-${state.heightIn}-${state.heightCm}`;

  useEffect(() => {
    console.log('[PlanPreviewStep] Recalculating results due to state change:', {
      primaryGoal: state.primaryGoal,
      currentWeight: state.currentWeight,
      targetWeight: state.targetWeight,
      activityLevel: state.activityLevel,
    });

    // Calculate results when entering this step or when inputs change
    calculateResults();

    // Reset and replay card entrance animation
    cardOpacity.value = 0;
    cardScale.value = 0.9;
    cardOpacity.value = withSpring(1, GLASS_SPRING);
    cardScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, [calculationKey, calculateResults, cardOpacity, cardScale]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonFillStyle = useAnimatedStyle(() => ({
    width: `${buttonProgress.value * 100}%`,
  }));

  if (!state.results) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Calculating your plan...</Text>
      </View>
    );
  }

  const { results } = state;

  // Theme-aware card backgrounds
  const mainCardBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.95)';
  const statCardBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.9)';
  const workoutCardBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.95)';
  const primaryGlassBg = isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)';

  // Calculate macro percentages
  const totalMacroCals = (results.protein * 4) + (results.carbs * 4) + (results.fat * 9);
  const proteinPercent = ((results.protein * 4) / totalMacroCals) * 100;
  const carbsPercent = ((results.carbs * 4) / totalMacroCals) * 100;
  const fatPercent = ((results.fat * 9) / totalMacroCals) * 100;

  // Calculate timeline
  const getTimelineText = () => {
    if (state.primaryGoal === 'maintain' || state.primaryGoal === 'improve_health') {
      return 'Ongoing healthy lifestyle';
    }
    if (results.totalWeeks > 0) {
      return `~${Math.round(results.totalWeeks)} weeks to reach goal`;
    }
    return '12 weeks initial plan';
  };

  // Get goal-specific message
  const getGoalMessage = () => {
    switch (state.primaryGoal) {
      case 'lose_weight':
        return `${Math.abs(results.dailyDelta).toFixed(0)} cal deficit/day`;
      case 'build_muscle':
        return `${Math.abs(results.dailyDelta).toFixed(0)} cal surplus/day`;
      default:
        return 'Maintaining energy balance';
    }
  };

  const handleConfirm = async () => {
    if (isConfirming) return;
    setIsConfirming(true);

    await lightImpact();

    // Animate button press
    buttonScale.value = withSequence(
      withSpring(0.95, GLASS_SPRING),
      withSpring(1, { damping: 10 })
    );

    // Progress fill animation
    buttonProgress.value = withSpring(1, GLASS_SPRING, () => {
      runOnJS(handleSaveComplete)();
    });
  };

  const handleSaveComplete = async () => {
    const success = await saveGoals();
    if (success) {
      await successNotification();
      onConfirm();
    } else {
      setIsConfirming(false);
      buttonProgress.value = 0;
      console.log('[PlanPreview] API save failed, but local storage succeeded');
      // Show error message to user
      Alert.alert(
        'Goals Saved Locally',
        'Your goals have been saved on your device but could not sync to the server. You can still use the app normally.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Still proceed to success screen since local storage worked
              onConfirm();
            }
          }
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Your Personalized Plan</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Based on your inputs, here's your daily nutrition target to reach your goal.
        </Text>
      </View>

      {/* Main Calorie Card */}
      <Animated.View style={cardAnimatedStyle}>
        <GlassCard isDark={isDark} borderColor="rgba(78, 205, 196, 0.25)" style={styles.mainCard}>
        <View style={styles.calorieSection}>
          <Text style={[styles.calorieLabel, { color: colors.textMuted }]}>DAILY CALORIES</Text>
          <View style={styles.calorieRow}>
            <AnimatedNumber
              value={results.calories}
              duration={1500}
              delay={200}
              style={[styles.calorieValue, { color: colors.text }]}
            />
            <Text style={[styles.calorieUnit, { color: colors.textMuted }]}>kcal</Text>
          </View>
          <View style={styles.goalBadge}>
            <Ionicons
              name={state.primaryGoal === 'lose_weight' ? 'trending-down' :
                    state.primaryGoal === 'build_muscle' ? 'trending-up' : 'remove'}
              size={14}
              color={Colors.success}
            />
            <Text style={styles.goalBadgeText}>{getGoalMessage()}</Text>
          </View>
        </View>

        {/* Macro Breakdown */}
        <View style={styles.macroSection}>
          <Text style={[styles.macroSectionTitle, { color: colors.textMuted }]}>MACRO BREAKDOWN</Text>
          <MacroBar
            label="Protein"
            value={results.protein}
            percentage={proteinPercent}
            color={colors.protein}
            delay={400}
            colors={colors}
          />
          <MacroBar
            label="Carbs"
            value={results.carbs}
            percentage={carbsPercent}
            color={colors.carbs}
            delay={600}
            colors={colors}
          />
          <MacroBar
            label="Fat"
            value={results.fat}
            percentage={fatPercent}
            color={colors.fat}
            delay={800}
            colors={colors}
          />
        </View>
        </GlassCard>
      </Animated.View>

      {/* Stats Cards */}
      <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.statsRow}>
        <GlassCard style={styles.statCard} interactive>
          <Ionicons name="flame-outline" size={20} color={Colors.error} />
          <Text style={[styles.statValue, { color: colors.text }]}>{results.bmr.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>BMR</Text>
        </GlassCard>
        <GlassCard style={styles.statCard} interactive>
          <Ionicons name="flash-outline" size={20} color={Colors.warning} />
          <Text style={[styles.statValue, { color: colors.text }]}>{results.tdee.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>TDEE</Text>
        </GlassCard>
        <GlassCard style={styles.statCard} interactive>
          <Ionicons name="body-outline" size={20} color={Colors.success} />
          <Text style={[styles.statValue, { color: colors.text }]}>{results.bmi.toFixed(1)}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>BMI</Text>
        </GlassCard>
      </Animated.View>

      {/* Weekly Rate Card - Key metric for users */}
      {(state.primaryGoal === 'lose_weight' || state.primaryGoal === 'build_muscle') && results.weeklyChange !== 0 && (
        <Animated.View entering={FadeInDown.delay(700).duration(400)}>
        <GlassCard style={styles.weeklyRateCard} interactive>
          <View style={styles.weeklyRateIcon}>
            <Ionicons
              name={state.primaryGoal === 'lose_weight' ? 'trending-down' : 'trending-up'}
              size={28}
              color={state.primaryGoal === 'lose_weight' ? Colors.error : Colors.success}
            />
          </View>
          <View style={styles.weeklyRateContent}>
            <Text style={[styles.weeklyRateLabel, { color: colors.textMuted }]}>
              {state.primaryGoal === 'lose_weight' ? 'WEEKLY FAT LOSS TARGET' : 'WEEKLY MUSCLE GAIN TARGET'}
            </Text>
            <View style={styles.weeklyRateRow}>
              <Text style={[
                styles.weeklyRateValue,
                { color: state.primaryGoal === 'lose_weight' ? Colors.error : Colors.success }
              ]}>
                {Math.abs(results.weeklyChange).toFixed(1)}
              </Text>
              <Text style={[styles.weeklyRateUnit, { color: colors.textMuted }]}>lbs/week</Text>
            </View>
            <Text style={[styles.weeklyRateHint, { color: colors.textSecondary }]}>
              {state.primaryGoal === 'lose_weight'
                ? Math.abs(results.weeklyChange) <= 1.0
                  ? 'Healthy sustainable rate'
                  : Math.abs(results.weeklyChange) <= 1.5
                    ? 'Moderately aggressive - stay consistent'
                    : 'Very aggressive - monitor energy levels'
                : Math.abs(results.weeklyChange) <= 0.25
                  ? 'Lean gains - minimal fat'
                  : Math.abs(results.weeklyChange) <= 0.5
                    ? 'Standard bulking pace'
                    : 'Aggressive - some fat gain likely'}
            </Text>
          </View>
        </GlassCard>
        </Animated.View>
      )}

      {/* Timeline Card */}
      <Animated.View entering={FadeInDown.delay(800).duration(400)}>
        <GlassCard style={styles.timelineCard} interactive>
          <View style={styles.timelineIcon}>
            <Ionicons name="calendar-outline" size={24} color={Colors.successMuted} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={[styles.timelineTitle, { color: colors.textMuted }]}>Estimated Timeline</Text>
            <Text style={styles.timelineValue}>{getTimelineText()}</Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Diet Summary */}
      {state.dietStyle !== 'standard' && (
        <Animated.View entering={FadeInDown.delay(900).duration(400)}>
          <GlassCard style={styles.dietCard} interactive>
            <Ionicons name="nutrition-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.dietText, { color: colors.textSecondary }]}>
              {state.dietStyle === 'keto' && 'Keto-optimized macros (70% fat, 25% protein, 5% carbs)'}
              {state.dietStyle === 'high_protein' && 'High protein for muscle support (40% protein)'}
              {state.dietStyle === 'vegetarian' && 'Vegetarian-friendly plan'}
              {state.dietStyle === 'vegan' && 'Plant-based nutrition plan'}
              {state.dietStyle === 'custom' && 'Custom macro distribution'}
            </Text>
          </GlassCard>
        </Animated.View>
      )}

      {/* Workout Plan Preview Card */}
      <Animated.View entering={FadeInDown.delay(1000).duration(400)}>
        <GlassCard style={styles.workoutPlanCard} interactive>
        <View style={styles.workoutPlanHeader}>
          <View style={styles.workoutPlanIconContainer}>
            <Ionicons
              name={state.primaryGoal === 'lose_weight' ? 'flame' :
                    state.primaryGoal === 'build_muscle' ? 'barbell' : 'heart'}
              size={24}
              color={state.primaryGoal === 'lose_weight' ? Colors.error :
                     state.primaryGoal === 'build_muscle' ? colors.protein : Colors.success}
            />
          </View>
          <View style={styles.workoutPlanHeaderText}>
            <Text style={styles.workoutPlanTitle}>YOUR TRAINING PLAN</Text>
            <Text style={[styles.workoutPlanSubtitle, { color: colors.text }]}>
              {state.primaryGoal === 'lose_weight' && (
                state.cardioPreference === 'walking' ? 'Fat Loss Walking Program' :
                state.cardioPreference === 'running' ? 'Fat Loss Running Program' :
                state.cardioPreference === 'hiit' ? 'Fat Burning HIIT Program' :
                'Fat Loss & Conditioning'
              )}
              {state.primaryGoal === 'build_muscle' && 'Muscle Building Program'}
              {state.primaryGoal === 'maintain' && 'Fitness Maintenance'}
              {state.primaryGoal === 'improve_health' && 'Health & Wellness'}
              {!state.primaryGoal && 'General Fitness'}
            </Text>
          </View>
        </View>

        {/* Workout Stats */}
        <View style={styles.workoutStatsRow}>
          <View style={styles.workoutStatItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.workoutStatValue, { color: colors.text }]}>{state.workoutsPerWeek || 3}</Text>
            <Text style={[styles.workoutStatLabel, { color: colors.textMuted }]}>days/week</Text>
          </View>
          <View style={styles.workoutStatItem}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.workoutStatValue, { color: colors.text }]}>{state.workoutDuration || 45}</Text>
            <Text style={[styles.workoutStatLabel, { color: colors.textMuted }]}>min/session</Text>
          </View>
          <View style={styles.workoutStatItem}>
            <Ionicons name="flash-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.workoutStatValue, { color: colors.text }]}>
              {state.activityLevel === 'sedentary' || state.activityLevel === 'light' ? 'Low' :
               state.activityLevel === 'moderate' ? 'Med' : 'High'}
            </Text>
            <Text style={[styles.workoutStatLabel, { color: colors.textMuted }]}>intensity</Text>
          </View>
        </View>

        {/* Workout Commentary */}
        <View style={styles.workoutCommentary}>
          <View style={styles.workoutCommentaryItem}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={[styles.workoutCommentaryText, { color: colors.textSecondary }]}>
              {state.primaryGoal === 'lose_weight' && (
                state.cardioPreference === 'walking'
                  ? `Walking sessions to maximize fat burn while being easy on joints (${Math.round((state.workoutDuration || 45) * 6)} cal/session est.)`
                  : state.cardioPreference === 'running'
                  ? `Running sessions to maximize calorie burn and cardiovascular fitness (${Math.round((state.workoutDuration || 45) * 12)} cal/session est.)`
                  : `HIIT and circuit training to maximize calorie burn (${Math.round((state.workoutDuration || 45) * 10)} cal/session est.)`
              )}
              {state.primaryGoal === 'build_muscle' &&
                `Progressive overload training targeting all major muscle groups`}
              {state.primaryGoal === 'maintain' &&
                `Balanced mix of strength and cardio to maintain fitness`}
              {state.primaryGoal === 'improve_health' &&
                `Low-impact exercises focused on mobility and cardiovascular health`}
              {!state.primaryGoal &&
                `Balanced program with strength and cardio components`}
            </Text>
          </View>
          <View style={styles.workoutCommentaryItem}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={[styles.workoutCommentaryText, { color: colors.textSecondary }]}>
              {state.primaryGoal === 'lose_weight' &&
                `Combined with your ${results.dailyDelta ? Math.abs(results.dailyDelta).toFixed(0) : '500'} cal deficit for optimal fat loss`}
              {state.primaryGoal === 'build_muscle' &&
                `Paired with ${results.protein}g protein to support muscle synthesis`}
              {state.primaryGoal === 'maintain' &&
                `Designed to preserve lean mass while maintaining energy balance`}
              {state.primaryGoal === 'improve_health' &&
                `Focus on heart health, flexibility, and functional strength`}
              {!state.primaryGoal &&
                `Customized based on your fitness level and schedule`}
            </Text>
          </View>
          <View style={styles.workoutCommentaryItem}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={[styles.workoutCommentaryText, { color: colors.textSecondary }]}>
              {state.primaryGoal === 'lose_weight' &&
                `Rest days strategically placed to prevent overtraining and muscle loss`}
              {state.primaryGoal === 'build_muscle' &&
                `48hr recovery between muscle groups for maximum growth`}
              {(state.primaryGoal === 'maintain' || state.primaryGoal === 'improve_health') &&
                `Flexible schedule with active recovery options`}
              {!state.primaryGoal &&
                `Progressive difficulty as your fitness improves`}
            </Text>
          </View>
        </View>

        {/* Nutrition Synergy Note */}
        <View style={styles.nutritionSynergyNote}>
          <Ionicons name="nutrition" size={14} color={colors.protein} />
          <Text style={[styles.nutritionSynergyText, { color: colors.textSecondary }]}>
            {state.primaryGoal === 'lose_weight'
              ? `Your ${results.protein}g protein target preserves muscle while the training burns fat`
              : state.primaryGoal === 'build_muscle'
              ? `${results.calories.toLocaleString()} cal surplus + training = muscle growth of ~0.5lb/week`
              : `Balanced macros support your training and recovery needs`}
          </Text>
        </View>
        </GlassCard>
      </Animated.View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={onBack}
          disabled={isConfirming}
          style={{ flex: 1 }}
        >
          <GlassCard style={styles.backButton} interactive>
            <Text style={[styles.backButtonText, { color: colors.text }]}>ADJUST</Text>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleConfirm}
          disabled={isConfirming}
          style={{ flex: 2 }}
        >
          <GlassCard style={[styles.confirmButton, { backgroundColor: primaryGlassBg }]} interactive>
            <View style={styles.confirmButtonContent}>
              {isConfirming ? (
                <Text style={[styles.confirmButtonText, { color: colors.primary }]}>SAVING...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={[styles.confirmButtonText, { color: colors.primary }]}>CONFIRM MY PLAN</Text>
                </>
              )}
            </View>
          </GlassCard>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.textSecondary,
  },
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  mainCard: {
    marginBottom: 16,
  },
  calorieSection: {
    alignItems: 'center',
    paddingBottom: 20,
    marginBottom: 20,
  },
  calorieLabel: {
    fontSize: 11,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 2,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  calorieValue: {
    fontSize: 56,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
  },
  calorieUnit: {
    fontSize: 18,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.textMuted,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
  },
  goalBadgeText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.success,
  },
  macroSection: {
    gap: 12,
  },
  macroSectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 2,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  macroItem: {
    gap: 6,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
  },
  macroValue: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
  },
  macroBarBg: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroPercent: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
    color: Colors.textMuted,
  },
  weeklyRateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    marginBottom: 16,
  },
  weeklyRateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyRateContent: {
    flex: 1,
  },
  weeklyRateLabel: {
    fontSize: 10,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  weeklyRateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  weeklyRateValue: {
    fontSize: 32,
    fontFamily: Fonts.light,
    fontWeight: '100',
  },
  weeklyRateUnit: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.textMuted,
  },
  weeklyRateHint: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    marginBottom: 16,
  },
  timelineIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(150, 206, 180, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 15,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.successMuted,
  },
  dietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginBottom: 16,
  },
  dietText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  workoutPlanCard: {
    padding: 16,
    marginBottom: 16,
  },
  workoutPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  workoutPlanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutPlanHeaderText: {
    flex: 1,
  },
  workoutPlanTitle: {
    fontSize: 10,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: Colors.success,
    marginBottom: 2,
  },
  workoutPlanSubtitle: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
  },
  workoutStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 16,
  },
  workoutStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  workoutStatValue: {
    fontSize: 18,
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
  },
  workoutStatLabel: {
    fontSize: 10,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutCommentary: {
    gap: 10,
    marginBottom: 16,
  },
  workoutCommentaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  workoutCommentaryText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  nutritionSynergyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 179, 71, 0.1)',
    borderRadius: 10,
    padding: 12,
  },
  nutritionSynergyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
  },
  confirmButton: {
    paddingVertical: 16,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
    color: Colors.primaryText,
  },
});
