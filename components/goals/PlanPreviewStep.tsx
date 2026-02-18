import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Flame,
  Zap,
  User,
  Calendar,
  Apple,
  Dumbbell,
  Heart,
  Clock,
  CheckCircle2,
  Leaf,
  AlertTriangle,
  UtensilsCrossed,
  Fish,
  Pizza,
  IceCream,
  XCircle,
  Settings,
  Link,
} from 'lucide-react-native';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useGoalWizard } from '../../contexts/GoalWizardContext';
import { NumberText } from '../NumberText';
import { useSettings } from '../../contexts/SettingsContext';
import { useFoodPreferencesSafe } from '../../contexts/FoodPreferencesContext';
import { useTraining } from '../../contexts/TrainingContext';
import { lightImpact, successNotification } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';
import { WizardHeader } from './WizardHeader';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  style?: any;
}

function AnimatedNumber({ value, duration = 1200, delay = 0, suffix = '', style }: AnimatedNumberProps) {
  return (
    <NumberText weight="light" style={style}>
      {value.toLocaleString()}{suffix}
    </NumberText>
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
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroHeader}>
        <Text style={[styles.macroLabel, { color: colors.text }]}>{label}</Text>
        <NumberText weight="medium" style={[styles.macroValue, { color: colors.text }]}>
          {value}g
        </NumberText>
      </View>
      <View style={[styles.macroBarBg, { backgroundColor: colors.background }]}>
        <View style={[styles.macroBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <NumberText weight="regular" style={[styles.macroPercent, { color: colors.textMuted }]}>
        {Math.round(percentage)}%
      </NumberText>
    </View>
  );
}

interface PlanPreviewStepProps {
  onBack: () => void;
  onConfirm: () => void;
}

export function PlanPreviewStep({ onBack, onConfirm }: PlanPreviewStepProps) {
  const { state, calculateResults, saveGoals } = useGoalWizard();
  const { settings } = useSettings();
  const foodPrefs = useFoodPreferencesSafe();
  const { getEnhancedPrograms } = useTraining();
  const [isConfirming, setIsConfirming] = useState(false);

  // Get selected program details if a program was selected
  const selectedProgram = useMemo(() => {
    if (!state.selectedProgramId) return null;
    const programs = getEnhancedPrograms();
    return programs.find(p => p.id === state.selectedProgramId) || null;
  }, [state.selectedProgramId, getEnhancedPrograms]);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Helper function for difficulty badge colors
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return Colors.success;
      case 'intermediate':
        return isDark ? Colors.warning : Colors.warningOrange;
      case 'advanced':
        return Colors.error;
      default:
        return colors.textMuted;
    }
  };

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
  }, [calculationKey, calculateResults]);

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

    const success = await saveGoals();
    if (success) {
      await successNotification();
      onConfirm();
    } else {
      setIsConfirming(false);
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
    <View style={styles.container}>
      {/* Modern Liquid Glass Sticky Header */}
      <WizardHeader
        currentStep={6}
        totalSteps={6}
        title="Review Your Plan"
        onBack={onBack}
        isDark={isDark}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Spacer for sticky header */}
        <View style={{ height: Platform.OS === 'ios' ? 260 : 210 }} />

        <View style={styles.subtitle}>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
            Based on your inputs, here's your daily nutrition target to reach your goal.
          </Text>
        </View>

      {/* Main Calorie Card */}
      <View>
        <GlassCard borderColor="rgba(78, 205, 196, 0.25)" style={styles.mainCard}>
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
            {state.primaryGoal === 'lose_weight' ? (
              <TrendingDown size={14} color={Colors.success} />
            ) : state.primaryGoal === 'build_muscle' ? (
              <TrendingUp size={14} color={Colors.success} />
            ) : (
              <Minus size={14} color={Colors.success} />
            )}
            <Text style={styles.goalBadgeText}>
              {state.primaryGoal === 'lose_weight' ? (
                <>
                  <NumberText weight="light" style={styles.goalBadgeText}>{Math.abs(results.dailyDelta).toFixed(0)}</NumberText> cal deficit/day
                </>
              ) : state.primaryGoal === 'build_muscle' ? (
                <>
                  <NumberText weight="light" style={styles.goalBadgeText}>{Math.abs(results.dailyDelta).toFixed(0)}</NumberText> cal surplus/day
                </>
              ) : (
                'Maintaining energy balance'
              )}
            </Text>
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
      </View>

      {/* User Profile Section */}
      <View>
        <GlassCard style={styles.profileCard} interactive>
          <View style={styles.profileHeader}>
            <View style={styles.profileIconContainer}>
              <User size={24} color={Colors.primary} />
            </View>
            <View style={styles.profileHeaderText}>
              <Text style={styles.profileTitle}>YOUR PROFILE</Text>
              <Text style={[styles.profileSubtitle, { color: colors.text }]}>
                Complete biometric assessment
              </Text>
            </View>
          </View>

          {/* Biometric Data */}
          <View style={styles.profileSection}>
            <Text style={[styles.profileSectionTitle, { color: colors.textMuted }]}>BIOMETRIC DATA</Text>
            <View style={styles.profileDataGrid}>
              <GlassCard style={styles.profileDataItemCard} borderColor="transparent">
                <Text style={[styles.profileDataLabel, { color: colors.textMuted }]}>Age</Text>
                <NumberText weight="medium" style={[styles.profileDataValue, { color: colors.text }]}>
                  {state.age}
                </NumberText>
                <Text style={[styles.profileDataUnit, { color: colors.textMuted }]}>years</Text>
              </GlassCard>
              <GlassCard style={styles.profileDataItemCard} borderColor="transparent">
                <Text style={[styles.profileDataLabel, { color: colors.textMuted }]}>Sex</Text>
                <Text style={[styles.profileDataValueText, { color: colors.text }]}>
                  {state.sex === 'male' ? 'Male' : 'Female'}
                </Text>
              </GlassCard>
              <GlassCard style={styles.profileDataItemCard} borderColor="transparent">
                <Text style={[styles.profileDataLabel, { color: colors.textMuted }]}>Height</Text>
                <Text style={[styles.profileDataValue, { color: colors.text }]}>
                  {state.heightFt ? (
                    <>
                      <NumberText weight="medium" style={[styles.profileDataValue, { color: colors.text }]}>
                        {state.heightFt}
                      </NumberText>
                      <Text style={[styles.profileDataUnit, { color: colors.textMuted }]}>'</Text>
                      <NumberText weight="medium" style={[styles.profileDataValue, { color: colors.text }]}>
                        {state.heightIn}
                      </NumberText>
                      <Text style={[styles.profileDataUnit, { color: colors.textMuted }]}>"</Text>
                    </>
                  ) : (
                    <>
                      <NumberText weight="medium" style={[styles.profileDataValue, { color: colors.text }]}>
                        {state.heightCm}
                      </NumberText>
                      <Text style={[styles.profileDataUnit, { color: colors.textMuted }]}> cm</Text>
                    </>
                  )}
                </Text>
              </GlassCard>
              <GlassCard style={styles.profileDataItemCard} borderColor="transparent">
                <Text style={[styles.profileDataLabel, { color: colors.textMuted }]}>Current Weight</Text>
                <NumberText weight="medium" style={[styles.profileDataValue, { color: colors.text }]}>
                  {state.currentWeight}
                </NumberText>
                <Text style={[styles.profileDataUnit, { color: colors.textMuted }]}>lbs</Text>
              </GlassCard>
              <GlassCard style={styles.profileDataItemCard} borderColor="transparent">
                <Text style={[styles.profileDataLabel, { color: colors.textMuted }]}>Target Weight</Text>
                <NumberText weight="medium" style={[styles.profileDataValue, { color: colors.text }]}>
                  {state.targetWeight}
                </NumberText>
                <Text style={[styles.profileDataUnit, { color: colors.textMuted }]}>lbs</Text>
              </GlassCard>
              <GlassCard style={styles.profileDataItemCard} borderColor="transparent">
                <Text style={[styles.profileDataLabel, { color: colors.textMuted }]}>Activity Level</Text>
                <Text numberOfLines={2} style={[styles.profileDataValueSmall, { color: colors.text }]}>
                  {state.activityLevel === 'sedentary' ? 'Sedentary' :
                   state.activityLevel === 'light' ? 'Lightly Active' :
                   state.activityLevel === 'moderate' ? 'Moderately Active' :
                   state.activityLevel === 'very' ? 'Very Active' : 'Extra Active'}
                </Text>
              </GlassCard>
            </View>
          </View>

          {/* Metabolic Stats */}
          <View style={styles.profileSection}>
            <Text style={[styles.profileSectionTitle, { color: colors.textMuted }]}>METABOLIC STATS</Text>
            <View style={styles.profileStatsRow}>
              <View style={styles.profileStatBox}>
                <Flame size={18} color={Colors.error} />
                <NumberText weight="semiBold" style={[styles.profileStatValue, { color: colors.text }]}>
                  {results.bmr.toLocaleString()}
                </NumberText>
                <Text style={[styles.profileStatLabel, { color: colors.textMuted }]}>BMR (cal/day)</Text>
                <Text style={[styles.profileStatDesc, { color: colors.textSecondary }]}>
                  Calories burned at rest
                </Text>
              </View>
              <View style={styles.profileStatBox}>
                <Zap size={18} color={Colors.warning} />
                <NumberText weight="semiBold" style={[styles.profileStatValue, { color: colors.text }]}>
                  {results.tdee.toLocaleString()}
                </NumberText>
                <Text style={[styles.profileStatLabel, { color: colors.textMuted }]}>TDEE (cal/day)</Text>
                <Text style={[styles.profileStatDesc, { color: colors.textSecondary }]}>
                  Total daily energy expenditure
                </Text>
              </View>
            </View>
            <View style={styles.profileStatsRow}>
              <View style={styles.profileStatBox}>
                <User size={18} color={results.bmiCategory.color} />
                <NumberText weight="semiBold" style={[styles.profileStatValue, { color: colors.text }]}>
                  {results.bmi.toFixed(1)}
                </NumberText>
                <Text style={[styles.profileStatLabel, { color: colors.textMuted }]}>BMI</Text>
                <Text style={[styles.profileStatDesc, { color: results.bmiCategory.color }]}>
                  {results.bmiCategory.name}
                </Text>
              </View>
              <View style={styles.profileStatBox}>
                {state.primaryGoal === 'lose_weight' ? (
                  <TrendingDown size={18} color={Colors.error} />
                ) : state.primaryGoal === 'build_muscle' ? (
                  <TrendingUp size={18} color={Colors.success} />
                ) : (
                  <Minus size={18} color={Colors.primary} />
                )}
                <Text style={[styles.profileStatValue, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                  {state.primaryGoal === 'lose_weight' ? 'Fat Loss' :
                   state.primaryGoal === 'build_muscle' ? 'Muscle Gain' :
                   state.primaryGoal === 'maintain' ? 'Maintain' : 'Health'}
                </Text>
                <Text style={[styles.profileStatLabel, { color: colors.textMuted }]}>Primary Goal</Text>
                <Text style={[styles.profileStatDesc, { color: colors.textSecondary }]}>
                  {state.primaryGoal === 'lose_weight' ? (
                    <><NumberText weight="medium" style={[styles.profileStatDesc, { color: colors.textSecondary }]}>{Math.abs(state.currentWeight - state.targetWeight).toFixed(0)}</NumberText> lbs to lose</>
                  ) : state.primaryGoal === 'build_muscle' ? (
                    <><NumberText weight="medium" style={[styles.profileStatDesc, { color: colors.textSecondary }]}>{Math.abs(state.currentWeight - state.targetWeight).toFixed(0)}</NumberText> lbs to gain</>
                  ) : (
                    'Maintain current weight'
                  )}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Weekly Rate Card - Key metric for users */}
      {(state.primaryGoal === 'lose_weight' || state.primaryGoal === 'build_muscle') && results.weeklyChange !== 0 && (
        <View>
        <GlassCard style={styles.weeklyRateCard} interactive>
          <View style={styles.weeklyRateIcon}>
            {state.primaryGoal === 'lose_weight' ? (
              <TrendingDown size={28} color={Colors.error} />
            ) : (
              <TrendingUp size={28} color={Colors.success} />
            )}
          </View>
          <View style={styles.weeklyRateContent}>
            <Text style={[styles.weeklyRateLabel, { color: colors.textMuted }]}>
              {state.primaryGoal === 'lose_weight' ? 'WEEKLY FAT LOSS TARGET' : 'WEEKLY MUSCLE GAIN TARGET'}
            </Text>
            <View style={styles.weeklyRateRow}>
              <NumberText weight="semiBold" style={[
                styles.weeklyRateValue,
                { color: state.primaryGoal === 'lose_weight' ? Colors.error : Colors.success }
              ]}>
                {Math.abs(results.weeklyChange).toFixed(1)}
              </NumberText>
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
        </View>
      )}

      {/* Timeline Card */}
      <View>
        <GlassCard style={styles.timelineCard} interactive>
          <View style={styles.timelineIcon}>
            <Calendar size={24} color={Colors.successMuted} />
          </View>
          <View style={styles.timelineContent}>
            <Text style={[styles.timelineTitle, { color: colors.textMuted }]}>Estimated Timeline</Text>
            <Text style={styles.timelineValue}>
              {state.primaryGoal === 'maintain' || state.primaryGoal === 'improve_health' ? (
                'Ongoing healthy lifestyle'
              ) : results.totalWeeks > 0 ? (
                <>
                  <NumberText weight="light" style={styles.timelineValue}>{Math.round(results.totalWeeks)}</NumberText> weeks to reach goal
                </>
              ) : (
                <>
                  <NumberText weight="light" style={styles.timelineValue}>12</NumberText> weeks initial plan
                </>
              )}
            </Text>
          </View>
        </GlassCard>
      </View>

      {/* Workout Plan Preview Card - DETAILED */}
      <View>
        <GlassCard style={styles.workoutPlanCard} interactive>
        <View style={styles.workoutPlanHeader}>
          <View style={styles.workoutPlanIconContainer}>
            {state.primaryGoal === 'lose_weight' ? (
              <Flame size={24} color={Colors.error} />
            ) : state.primaryGoal === 'build_muscle' ? (
              <Dumbbell size={24} color={colors.protein} />
            ) : (
              <Heart size={24} color={Colors.success} />
            )}
          </View>
          <View style={styles.workoutPlanHeaderText}>
            <Text style={styles.workoutPlanTitle}>YOUR TRAINING PLAN</Text>
            <Text style={[styles.workoutPlanSubtitle, { color: colors.text }]}>
              {selectedProgram ? selectedProgram.name : (
                <>
                  {state.primaryGoal === 'lose_weight' && (
                    state.cardioPreference === 'walking' ? 'Fat Loss Walking Program' :
                    state.cardioPreference === 'running' ? 'Fat Loss Running Program' :
                    state.cardioPreference === 'hiit' ? 'Fat Burning HIIT Program' :
                    'Fat Loss & Conditioning'
                  )}
                  {state.primaryGoal === 'build_muscle' && 'Progressive Overload Muscle Building'}
                  {state.primaryGoal === 'maintain' && 'Fitness Maintenance Program'}
                  {state.primaryGoal === 'improve_health' && 'Health & Wellness Program'}
                  {!state.primaryGoal && 'General Fitness Program'}
                </>
              )}
            </Text>
          </View>
        </View>

        {/* Selected Program Details */}
        {selectedProgram && (
          <GlassCard style={styles.trainingSectionCard} borderColor="transparent">
            <Text style={[styles.trainingSectionTitle, { color: colors.textMuted }]}>PROGRAM DETAILS</Text>
            <Text style={[styles.programDescription, { color: colors.textSecondary }]}>
              {selectedProgram.description}
            </Text>
            <View style={styles.programMetaRow}>
              <View style={[styles.programMetaBadge, { backgroundColor: `${getDifficultyColor(selectedProgram.difficulty)}20` }]}>
                <Text style={[styles.programMetaText, { color: getDifficultyColor(selectedProgram.difficulty) }]}>
                  {selectedProgram.difficulty.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.programMetaBadge, { backgroundColor: colors.backgroundSecondary }]}>
                <Calendar size={12} color={colors.primary} />
                <NumberText weight="regular" style={[styles.programMetaText, { color: colors.text }]}>
                  {selectedProgram.duration}
                </NumberText>
                <Text style={[styles.programMetaText, { color: colors.text }]}>weeks</Text>
              </View>
              <View style={[styles.programMetaBadge, { backgroundColor: colors.backgroundSecondary }]}>
                <Dumbbell size={12} color={colors.protein} />
                <NumberText weight="regular" style={[styles.programMetaText, { color: colors.text }]}>
                  {selectedProgram.daysPerWeek}
                </NumberText>
                <Text style={[styles.programMetaText, { color: colors.text }]}>days/week</Text>
              </View>
            </View>
            {selectedProgram.focus && selectedProgram.focus.length > 0 && (
              <View style={styles.programFocusRow}>
                {selectedProgram.focus.slice(0, 4).map((tag, i) => (
                  <View key={i} style={[styles.programFocusTag, { backgroundColor: `${colors.primary}20` }]}>
                    <Text style={[styles.programFocusText, { color: colors.primary }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        )}

        {/* Training Schedule Overview */}
        <GlassCard style={styles.trainingSectionCard} borderColor="transparent">
          <Text style={[styles.trainingSectionTitle, { color: colors.textMuted }]}>TRAINING SCHEDULE</Text>
          <View style={styles.scheduleGrid}>
            <GlassCard style={styles.scheduleItemCard} borderColor="transparent">
              <Calendar size={16} color={colors.primary} />
              <NumberText weight="semiBold" style={[styles.scheduleValue, { color: colors.text }]}>
                {state.workoutsPerWeek || 3}
              </NumberText>
              <Text numberOfLines={1} style={[styles.scheduleLabel, { color: colors.textMuted }]}>Training Days/Week</Text>
            </GlassCard>
            <GlassCard style={styles.scheduleItemCard} borderColor="transparent">
              <Clock size={16} color={colors.primary} />
              <NumberText weight="semiBold" style={[styles.scheduleValue, { color: colors.text }]}>
                {state.workoutDuration || 45}
              </NumberText>
              <Text numberOfLines={1} style={[styles.scheduleLabel, { color: colors.textMuted }]}>Minutes/Session</Text>
            </GlassCard>
            <GlassCard style={styles.scheduleItemCard} borderColor="transparent">
              <Zap size={16} color={colors.primary} />
              <Text numberOfLines={1} style={[styles.scheduleValue, { color: colors.text, fontSize: 17, marginTop: 3, fontFamily: Fonts.numericSemiBold }]}>
                {state.activityLevel === 'sedentary' || state.activityLevel === 'light' ? 'Beginner' :
                 state.activityLevel === 'moderate' ? 'Interm.' : 'Advanced'}
              </Text>
              <Text numberOfLines={1} style={[styles.scheduleLabel, { color: colors.textMuted }]}>Intensity</Text>
            </GlassCard>
            <GlassCard style={styles.scheduleItemCard} borderColor="transparent">
              <Heart size={16} color={colors.primary} />
              <NumberText weight="semiBold" style={[styles.scheduleValue, { color: colors.text }]}>
                {7 - (state.workoutsPerWeek || 3)}
              </NumberText>
              <Text numberOfLines={1} style={[styles.scheduleLabel, { color: colors.textMuted }]}>Rest Days/Week</Text>
            </GlassCard>
          </View>
        </GlassCard>

        {/* Workout Split */}
        <GlassCard style={styles.trainingSectionCard} borderColor="transparent">
          <Text style={[styles.trainingSectionTitle, { color: colors.textMuted }]}>WEEKLY WORKOUT SPLIT</Text>
          {state.primaryGoal === 'build_muscle' && (
            <View style={styles.splitDetails}>
              {(state.workoutsPerWeek || 3) >= 5 ? (
                <>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 1:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Push (Chest, Shoulders, Triceps)</Text>
                    </View>
                  </GlassCard>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 2:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Pull (Back, Biceps, Rear Delts)</Text>
                    </View>
                  </GlassCard>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 3:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Legs (Quads, Hamstrings, Glutes, Calves)</Text>
                    </View>
                  </GlassCard>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 4:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Upper Body Hypertrophy</Text>
                    </View>
                  </GlassCard>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 5:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Lower Body Strength</Text>
                    </View>
                  </GlassCard>
                </>
              ) : (state.workoutsPerWeek || 3) >= 4 ? (
                <>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 1:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Upper Body (Chest, Back, Shoulders, Arms)</Text>
                    </View>
                  </GlassCard>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 2:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Lower Body (Legs, Glutes, Calves)</Text>
                    </View>
                  </GlassCard>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 3:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Push Focus (Chest, Shoulders, Triceps)</Text>
                    </View>
                  </GlassCard>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 4:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Pull Focus (Back, Biceps, Hamstrings)</Text>
                    </View>
                  </GlassCard>
                </>
              ) : (
                <>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 1:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Full Body - Compound Focus</Text>
                    </View>
                  </GlassCard>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 2:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Full Body - Hypertrophy Focus</Text>
                    </View>
                  </GlassCard>
                  <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={[styles.splitDayLabel, { color: colors.text }]}>Day 3:</Text>
                      <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>Full Body - Strength Focus</Text>
                    </View>
                  </GlassCard>
                </>
              )}
            </View>
          )}
          {state.primaryGoal === 'lose_weight' && (
            <View style={styles.splitDetails}>
              <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Text style={[styles.splitDayLabel, { color: colors.text }]}>Days 1-{state.workoutsPerWeek || 3}:</Text>
                  <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>
                    {state.cardioPreference === 'walking' ? 'Brisk Walking + Light Resistance Training' :
                     state.cardioPreference === 'running' ? 'Running Intervals + Core Work' :
                     state.cardioPreference === 'hiit' ? 'HIIT Circuits + Strength Training' :
                     'Mixed Cardio + Resistance Training'}
                  </Text>
                </View>
              </GlassCard>
              <GlassCard style={{ padding: 12, marginBottom: 8 }} borderColor="transparent">
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Text style={[styles.splitDayLabel, { color: colors.text }]}>Rest Days:</Text>
                  <Text style={[styles.splitDayWorkout, { color: colors.textSecondary }]}>
                    Active recovery (walking, stretching, mobility work)
                  </Text>
                </View>
              </GlassCard>
            </View>
          )}
        </GlassCard>

        {/* Exercise Examples */}
        <GlassCard style={styles.trainingSectionCard} borderColor="transparent">
          <Text style={[styles.trainingSectionTitle, { color: colors.textMuted }]}>EXAMPLE EXERCISES</Text>
          {state.primaryGoal === 'build_muscle' && (
            <View style={styles.exerciseList}>
              <GlassCard style={styles.exerciseItemCard} borderColor="transparent">
                <Dumbbell size={14} color={colors.protein} />
                <Text style={[styles.exerciseText, { color: colors.textSecondary }]}>
                  Bench Press, Squats, Deadlifts, Overhead Press (Compound Movements)
                </Text>
              </GlassCard>
              <GlassCard style={styles.exerciseItemCard} borderColor="transparent">
                <Dumbbell size={14} color={colors.protein} />
                <Text style={[styles.exerciseText, { color: colors.textSecondary }]}>
                  Dumbbell Rows, Lat Pulldowns, Romanian Deadlifts (Back & Posterior Chain)
                </Text>
              </GlassCard>
              <GlassCard style={styles.exerciseItemCard} borderColor="transparent">
                <Dumbbell size={14} color={colors.protein} />
                <Text style={[styles.exerciseText, { color: colors.textSecondary }]}>
                  Leg Press, Lunges, Leg Curls, Calf Raises (Lower Body Isolation)
                </Text>
              </GlassCard>
              <GlassCard style={styles.exerciseItemCard} borderColor="transparent">
                <Dumbbell size={14} color={colors.protein} />
                <Text style={[styles.exerciseText, { color: colors.textSecondary }]}>
                  Bicep Curls, Tricep Extensions, Lateral Raises (Arm & Shoulder Isolation)
                </Text>
              </GlassCard>
            </View>
          )}
          {state.primaryGoal === 'lose_weight' && (
            <View style={styles.exerciseList}>
              <GlassCard style={styles.exerciseItemCard} borderColor="transparent">
                <Flame size={14} color={Colors.error} />
                <Text style={[styles.exerciseText, { color: colors.textSecondary }]}>
                  {state.cardioPreference === 'walking' ? '30-45 min brisk walking at moderate pace (3.5-4 mph)' :
                   state.cardioPreference === 'running' ? '20-30 min interval running (sprint 1 min, jog 2 min)' :
                   state.cardioPreference === 'hiit' ? '20-30 min HIIT (burpees, mountain climbers, jump squats)' :
                   '30-40 min mixed cardio (bike, elliptical, rowing)'}
                </Text>
              </GlassCard>
              <GlassCard style={styles.exerciseItemCard} borderColor="transparent">
                <Dumbbell size={14} color={Colors.error} />
                <Text style={[styles.exerciseText, { color: colors.textSecondary }]}>
                  Circuit training: Goblet Squats, Push-ups, Dumbbell Rows (3 rounds, 12-15 reps)
                </Text>
              </GlassCard>
              <GlassCard style={styles.exerciseItemCard} borderColor="transparent">
                <Heart size={14} color={Colors.error} />
                <Text style={[styles.exerciseText, { color: colors.textSecondary }]}>
                  Core work: Planks, Russian Twists, Leg Raises (3 sets to fatigue)
                </Text>
              </GlassCard>
            </View>
          )}
        </GlassCard>

        {/* Equipment & Modifications */}
        {state.availableEquipment && state.availableEquipment.length > 0 && (
          <GlassCard style={styles.trainingSectionCard} borderColor="transparent">
            <Text style={[styles.trainingSectionTitle, { color: colors.textMuted }]}>AVAILABLE EQUIPMENT</Text>
            <View style={styles.equipmentTags}>
              {state.availableEquipment.map((equipment, index) => (
                <View key={index} style={[styles.equipmentTag, { backgroundColor: 'rgba(150, 206, 180, 0.15)' }]}>
                  <CheckCircle2 size={12} color={Colors.success} />
                  <Text style={[styles.equipmentTagText, { color: Colors.success }]}>
                    {equipment.charAt(0).toUpperCase() + equipment.slice(1).replace('_', ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        {/* Injury Considerations */}
        {state.injuries && state.injuries.length > 0 && (
          <GlassCard style={styles.trainingSectionCard} borderColor="transparent">
            <View style={styles.injuryHeader}>
              <AlertTriangle size={16} color={Colors.warning} />
              <Text style={[styles.trainingSectionTitle, { color: Colors.warning }]}>INJURY MODIFICATIONS</Text>
            </View>
            <View style={styles.injuryList}>
              {state.injuries.map((injury, index) => (
                <View key={index} style={styles.injuryItem}>
                  <Text style={[styles.injuryText, { color: colors.textSecondary }]}>
                    <Text style={{ fontFamily: Fonts.medium, color: Colors.warning }}>
                      {injury.charAt(0).toUpperCase() + injury.slice(1).replace('_', ' ')}:
                    </Text>
                    {' '}Modified exercises and reduced range of motion for affected area. Focus on pain-free movements and gradual progression.
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        {/* Progressive Overload Plan */}
        <GlassCard style={styles.trainingSectionCard} borderColor="transparent">
          <Text style={[styles.trainingSectionTitle, { color: colors.textMuted }]}>PROGRESSION PLAN</Text>
          <View style={styles.progressionTimeline}>
            <GlassCard style={styles.progressionPhaseCard} borderColor="transparent">
              <Text style={[styles.progressionWeek, { color: colors.primary }]}>Weeks 1-2</Text>
              <Text style={[styles.progressionDesc, { color: colors.textSecondary }]}>
                Adaptation Phase - Focus on form, build base conditioning
              </Text>
            </GlassCard>
            <GlassCard style={styles.progressionPhaseCard} borderColor="transparent">
              <Text style={[styles.progressionWeek, { color: colors.primary }]}>Weeks 3-6</Text>
              <Text style={[styles.progressionDesc, { color: colors.textSecondary }]}>
                {state.primaryGoal === 'build_muscle' ? 'Hypertrophy Phase - Increase volume, 8-12 reps per set' :
                 'Conditioning Phase - Increase intensity, reduce rest periods'}
              </Text>
            </GlassCard>
            <GlassCard style={styles.progressionPhaseCard} borderColor="transparent">
              <Text style={[styles.progressionWeek, { color: colors.primary }]}>Weeks 7+</Text>
              <Text style={[styles.progressionDesc, { color: colors.textSecondary }]}>
                {state.primaryGoal === 'build_muscle' ? 'Strength Phase - Progressive overload, track PR milestones' :
                 'Peak Performance - Maximize calorie burn, optimize fat loss'}
              </Text>
            </GlassCard>
          </View>
        </GlassCard>

        {/* Nutrition Synergy Note */}
        <View style={styles.nutritionSynergyNote}>
          <Apple size={14} color={colors.protein} />
          <Text style={[styles.nutritionSynergyText, { color: colors.textSecondary }]}>
            {state.primaryGoal === 'lose_weight'
              ? `Your ${results.protein}g protein target preserves muscle while training in a ${Math.abs(results.dailyDelta).toFixed(0)} cal deficit maximizes fat loss without strength loss`
              : state.primaryGoal === 'build_muscle'
              ? `${results.calories.toLocaleString()} cal surplus + ${results.protein}g protein + progressive training = optimal muscle growth of ~${Math.round(Math.abs(results.weeklyChange))}lb/week`
              : `Balanced ${results.calories.toLocaleString()} cal intake with ${results.protein}g protein supports your training and recovery needs`}
          </Text>
        </View>
        </GlassCard>
      </View>

      {/* Food Preferences Section */}
      {(state.dietStyle || state.allergies?.length > 0 || foodPrefs) && (
        <View>
          <GlassCard style={styles.foodPreferencesCard} interactive>
            <View style={styles.foodPrefsHeader}>
              <View style={styles.foodPrefsIconContainer}>
                <Apple size={28} color={Colors.success} />
              </View>
              <View style={styles.foodPrefsHeaderText}>
                <Text style={styles.foodPrefsTitle}>YOUR NUTRITION PREFERENCES</Text>
                <Text style={[styles.foodPrefsSubtitle, { color: colors.text }]}>
                  Personalized meal planning based on your choices
                </Text>
              </View>
            </View>

            {/* Dietary Style */}
            {state.dietStyle && state.dietStyle !== 'standard' && (
              <GlassCard style={styles.prefSectionCard} borderColor="transparent">
                <View style={styles.prefRow}>
                  <Leaf size={20} color={Colors.success} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Dietary Style</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  <View style={[styles.prefTag, { backgroundColor: 'rgba(78, 205, 196, 0.15)' }]}>
                    <Text style={[styles.prefTagText, { color: Colors.success }]}>
                      {state.dietStyle.charAt(0).toUpperCase() + state.dietStyle.slice(1).replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Allergens */}
            {state.allergies && state.allergies.length > 0 && (
              <GlassCard style={styles.prefSectionCard} borderColor="transparent">
                <View style={styles.prefRow}>
                  <AlertTriangle size={16} color={Colors.error} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Allergens to Avoid</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {state.allergies.map((allergen, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                      <Text style={[styles.prefTagText, { color: Colors.error }]}>
                        {allergen.charAt(0).toUpperCase() + allergen.slice(1).toLowerCase()}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Meals Per Day */}
            {state.mealsPerDay && (
              <GlassCard style={styles.prefSectionCard} borderColor="transparent">
                <View style={styles.prefRow}>
                  <UtensilsCrossed size={16} color={Colors.success} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Meals Per Day</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  <View style={[styles.mealsCircle, { backgroundColor: 'rgba(78, 205, 196, 0.15)' }]}>
                    <NumberText weight="semiBold" style={[styles.mealsCircleNumber, { color: Colors.success }]}>
                      {state.mealsPerDay}
                    </NumberText>
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Intermittent Fasting */}
            {state.intermittentFasting && state.fastingStart && state.fastingEnd && (
              <GlassCard style={styles.prefSectionCard} borderColor="transparent">
                <View style={styles.prefRow}>
                  <Clock size={16} color={Colors.warning} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Fasting Window</Text>
                </View>
                <View style={[styles.prefTagsRow, { marginTop: 8 }]}>
                  <View style={[styles.prefTag, { backgroundColor: 'rgba(255, 179, 71, 0.15)' }]}>
                    <Text style={[styles.prefTagText, { color: Colors.warning }]}>
                      {state.fastingStart} - {state.fastingEnd}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Favorite Cuisines */}
            {foodPrefs?.preferences?.favoriteCuisines && foodPrefs.preferences.favoriteCuisines.length > 0 && (
              <GlassCard style={styles.prefSectionCard} borderColor="transparent">
                <View style={styles.prefRow}>
                  <UtensilsCrossed size={16} color={colors.protein} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Favorite Cuisines</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.preferences.favoriteCuisines.map((cuisine, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.prefTagText, { color: colors.text }]}>
                        {cuisine.charAt(0).toUpperCase() + cuisine.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Favorite Proteins */}
            {foodPrefs?.preferences?.favoriteProteins && foodPrefs.preferences.favoriteProteins.length > 0 && (
              <GlassCard style={styles.prefSectionCard} borderColor="transparent">
                <View style={styles.prefRow}>
                  <Fish size={16} color={colors.protein} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Favorite Proteins</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.preferences.favoriteProteins.map((protein, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(255, 179, 71, 0.15)' }]}>
                      <Text style={[styles.prefTagText, { color: colors.protein }]}>
                        {protein.charAt(0).toUpperCase() + protein.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Favorite Vegetables */}
            {foodPrefs?.preferences?.favoriteVegetables && foodPrefs.preferences.favoriteVegetables.length > 0 && (
              <GlassCard style={styles.prefSectionCard} borderColor="transparent">
                <View style={styles.prefRow}>
                  <Leaf size={16} color={Colors.success} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Favorite Vegetables</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.preferences.favoriteVegetables.map((veggie, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(78, 205, 196, 0.15)' }]}>
                      <Text style={[styles.prefTagText, { color: Colors.success }]}>
                        {veggie.charAt(0).toUpperCase() + veggie.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Favorite Starches */}
            {foodPrefs?.preferences?.favoriteStarches && foodPrefs.preferences.favoriteStarches.length > 0 && (
              <GlassCard style={styles.prefSectionCard} borderColor="transparent">
                <View style={styles.prefRow}>
                  <Pizza size={16} color={colors.carbs} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Favorite Starches</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.preferences.favoriteStarches.map((starch, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(99, 177, 255, 0.15)' }]}>
                      <Text style={[styles.prefTagText, { color: colors.carbs }]}>
                        {starch.charAt(0).toUpperCase() + starch.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Favorite Snacks */}
            {foodPrefs?.preferences?.favoriteSnacks && foodPrefs.preferences.favoriteSnacks.length > 0 && (
              <GlassCard style={styles.prefSectionCard} borderColor="transparent">
                <View style={styles.prefRow}>
                  <IceCream size={16} color={colors.carbs} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Favorite Snacks</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.preferences.favoriteSnacks.map((snack, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.prefTagText, { color: colors.text }]}>
                        {snack.charAt(0).toUpperCase() + snack.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Hated Foods */}
            {foodPrefs?.preferences?.hatedFoods && (
              <GlassCard style={styles.prefSectionCard} borderColor="transparent">
                <View style={styles.prefRow}>
                  <XCircle size={16} color={Colors.error} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Foods to Avoid</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.preferences.hatedFoods.split(',').map(s => s.trim()).filter(Boolean).map((food, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                      <Text style={[styles.prefTagText, { color: Colors.error }]}>
                        {food.charAt(0).toUpperCase() + food.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Meal Planning Preferences */}
            {foodPrefs?.preferences && (
              <GlassCard style={styles.prefSectionCard} borderColor="transparent">
                {/* Meal Diversity */}
                {foodPrefs.preferences.mealDiversity && (
                  <View style={{ marginBottom: 12 }}>
                    <View style={styles.prefRow}>
                      <Settings size={16} color={colors.primary} />
                      <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Meal Variety</Text>
                    </View>
                    <View style={[styles.prefTagsRow, { marginTop: 8, marginLeft: 24 }]}>
                      <View style={[styles.prefTag, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.prefTagText, { color: colors.text }]}>
                          {foodPrefs.preferences.mealDiversity === 'sameDaily' ? 'Same Meals Daily' : 'Diverse Meals'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Meal Style */}
                {foodPrefs.preferences.mealStyle && (
                  <View style={{ marginBottom: 12 }}>
                    <View style={styles.prefRow}>
                      <Clock size={16} color={colors.carbs} />
                      <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Meal Style</Text>
                    </View>
                    <View style={[styles.prefTagsRow, { marginTop: 8, marginLeft: 24 }]}>
                      <View style={[styles.prefTag, { backgroundColor: 'rgba(99, 177, 255, 0.15)' }]}>
                        <Text style={[styles.prefTagText, { color: colors.carbs }]}>
                          {foodPrefs.preferences.mealStyle === 'threePlusSnacks' ? '3 Meals + Snacks' : 'Fewer Larger Meals'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Cheat Days */}
                {foodPrefs.preferences.cheatDays && foodPrefs.preferences.cheatDays.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <View style={styles.prefRow}>
                      <Calendar size={16} color={colors.primary} />
                      <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Cheat Days</Text>
                    </View>
                    <View style={[styles.prefTagsRow, { marginTop: 8, marginLeft: 24 }]}>
                      <View style={[styles.prefTag, { backgroundColor: colors.backgroundSecondary }]}>
                        <NumberText weight="semiBold" style={[styles.prefTagText, { color: colors.text }]}>
                          {foodPrefs.preferences.cheatDays.length}
                        </NumberText>
                        <Text style={[styles.prefTagText, { color: colors.text }]}> per week</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Cooking Skill */}
                {foodPrefs.preferences.cookingSkill && (
                  <View>
                    <View style={styles.prefRow}>
                      <Flame size={16} color={Colors.error} />
                      <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Cooking Skill</Text>
                    </View>
                    <View style={[styles.prefTagsRow, { marginTop: 8, marginLeft: 24 }]}>
                      <View style={[styles.prefTag, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                        <Text style={[styles.prefTagText, { color: Colors.error }]}>
                          {foodPrefs.preferences.cookingSkill === 'beginner' ? 'Beginner' :
                           foodPrefs.preferences.cookingSkill === 'intermediate' ? 'Intermediate' : 'Advanced'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </GlassCard>
            )}

            {/* Preference Connection Note */}
            <View style={styles.prefConnectionNote}>
              <Link size={14} color={Colors.success} />
              <Text style={[styles.prefConnectionText, { color: colors.textSecondary }]}>
                Your 7-day meal plan will incorporate all these preferences to create personalized, enjoyable meals
              </Text>
            </View>
          </GlassCard>
        </View>
      )}

      {/* Bottom Spacing - extra space to prevent blending with buttons */}
      <View style={{ height: 180 }} />
    </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={onBack}
          disabled={isConfirming}
          style={{ flex: 1 }}
          accessibilityLabel="Adjust plan settings"
          accessibilityRole="button"
          accessibilityState={{ disabled: isConfirming }}
          accessibilityHint="Returns to previous step to modify your plan"
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
          accessibilityLabel="Confirm my plan"
          accessibilityRole="button"
          accessibilityState={{ disabled: isConfirming, busy: isConfirming }}
          accessibilityHint="Saves your personalized health plan and starts your journey"
        >
          <GlassCard style={[styles.confirmButton, { backgroundColor: primaryGlassBg }]} interactive>
            <View style={styles.confirmButtonContent}>
              {isConfirming ? (
                <Text style={[styles.confirmButtonText, { color: colors.primary }]}>SAVING...</Text>
              ) : (
                <>
                  <CheckCircle2 size={20} color={colors.primary} />
                  <Text style={[styles.confirmButtonText, { color: colors.primary }]}>CONFIRM MY PLAN</Text>
                </>
              )}
            </View>
          </GlassCard>
        </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
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
  subtitle: {
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  subtitleText: {
    fontSize: 11,
    fontFamily: Fonts.light,
    lineHeight: 16,
    textAlign: 'center',
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
    fontFamily: Fonts.numericSemiBold,
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
    gap: 8,
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
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  macroItem: {
    gap: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
  },
  macroValue: {
    fontSize: 14,
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
    padding: 16,
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
    color: Colors.textMuted,
  },
  weeklyRateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    marginBottom: 16,
  },
  weeklyRateIcon: {
    width: 56,
    height: 56,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyRateContent: {
    flex: 1,
  },
  weeklyRateLabel: {
    fontSize: 10,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  weeklyRateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  weeklyRateValue: {
    fontSize: 32,
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
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    marginBottom: 16,
  },
  timelineIcon: {
    width: 44,
    height: 44,
    borderRadius: 24,
    backgroundColor: 'rgba(150, 206, 180, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 12,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 15,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.successMuted,
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
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1.5,
    color: Colors.success,
    marginBottom: 2,
  },
  workoutPlanSubtitle: {
    fontSize: 16,
    fontFamily: Fonts.numericSemiBold,
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
    color: Colors.text,
  },
  workoutStatLabel: {
    fontSize: 10,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutCommentary: {
    gap: 8,
    marginBottom: 16,
  },
  workoutCommentaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  workoutCommentaryText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  nutritionSynergyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 179, 71, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  nutritionSynergyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
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
    fontFamily: Fonts.numericSemiBold,
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
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
    color: Colors.primaryText,
  },
  foodPreferencesCard: {
    padding: 16,
    marginBottom: 16,
  },
  foodPrefsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  foodPrefsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodPrefsHeaderText: {
    flex: 1,
  },
  foodPrefsTitle: {
    fontSize: 12,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1.5,
    color: Colors.success,
    marginBottom: 4,
  },
  foodPrefsSubtitle: {
    fontSize: 18,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
  },
  prefSection: {
    marginBottom: 16,
  },
  prefSectionCard: {
    marginBottom: 20,
    padding: 14,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  prefLabel: {
    fontSize: 12,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.textMuted,
  },
  prefValue: {
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.text,
  },
  prefTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prefTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
  },
  prefTagText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  mealsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealsCircleNumber: {
    fontSize: 18,
  },
  mealPlanningSection: {
    gap: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  prefConnectionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  prefConnectionText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  // User Profile Section Styles
  profileCard: {
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  profileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(150, 206, 180, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderText: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 10,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1.5,
    color: Colors.success,
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 16,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
  },
  profileSection: {
    marginBottom: 20,
  },
  profileSectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  profileDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  profileDataItem: {
    width: '30%',
    minWidth: 90,
  },
  profileDataItemCard: {
    width: '30%',
    minWidth: 90,
    padding: 12,
    gap: 6,
  },
  profileDataLabel: {
    fontSize: 10,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  profileDataValue: {
    fontSize: 16,
    color: Colors.text,
  },
  profileDataValueText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  profileDataValueSmall: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    lineHeight: 18,
  },
  profileDataUnit: {
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
  },
  profileStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  profileStatBox: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(150, 206, 180, 0.08)',
    borderRadius: 12,
    gap: 6,
  },
  profileStatValue: {
    fontSize: 18,
    color: Colors.text,
  },
  profileStatLabel: {
    fontSize: 9,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  profileStatDesc: {
    fontSize: 10,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Training Plan Detailed Styles
  trainingSectionCard: {
    marginBottom: 12,
    padding: 12,
  },
  trainingScheduleSection: {
    marginBottom: 20,
  },
  trainingSectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  programDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 20,
    marginBottom: 12,
  },
  programMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  programMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  programMetaText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  programFocusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  programFocusTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  programFocusText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scheduleItem: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    gap: 8,
  },
  scheduleItemCard: {
    flexBasis: '45%',
    maxWidth: '45%',
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 16,
  },
  scheduleValue: {
    fontSize: 20,
    color: Colors.text,
  },
  scheduleLabel: {
    fontSize: 8,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  workoutSplitSection: {
    marginBottom: 20,
  },
  splitDetails: {
    gap: 8,
  },
  splitDay: {
    flexDirection: 'row',
    gap: 8,
  },
  splitDayCard: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    marginBottom: 8,
  },
  splitDayLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.text,
    minWidth: 60,
    flexShrink: 0,
  },
  splitDayWorkout: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 19,
    flexWrap: 'wrap',
  },
  exerciseSection: {
    marginBottom: 20,
  },
  exerciseList: {
    gap: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  exerciseItemCard: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    padding: 8,
    marginBottom: 8,
  },
  exerciseText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  equipmentSection: {
    marginBottom: 20,
  },
  equipmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  equipmentTagText: {
    fontSize: 11,
    fontFamily: Fonts.light,
    color: Colors.success,
  },
  injurySection: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 179, 71, 0.08)',
    borderRadius: 12,
    padding: 12,
  },
  injuryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  injuryList: {
    gap: 8,
  },
  injuryItem: {
    paddingLeft: 24,
  },
  injuryText: {
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  progressionSection: {
    marginBottom: 16,
  },
  progressionTimeline: {
    gap: 12,
  },
  progressionPhase: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  progressionPhaseCard: {
    padding: 12,
    marginBottom: 8,
  },
  progressionWeek: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.primary,
    marginBottom: 4,
  },
  progressionDesc: {
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
