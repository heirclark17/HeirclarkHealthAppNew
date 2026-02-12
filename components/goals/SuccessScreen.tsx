import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import {
  Flame,
  Dumbbell,
  TrendingUp,
  User,
  Activity,
  Weight,
  Ruler,
  Calendar,
  Utensils,
  Heart,
  Zap,
  Target,
  Coffee,
  Lightbulb,
  Sparkles,
  Leaf,
  AlertTriangle,
  UtensilsCrossed,
  Fish,
  Pizza,
  IceCream,
  XCircle,
  Settings as SettingsIcon,
  Timer,
  ChefHat,
  Play,
  BookOpen,
  ChevronRight
} from 'lucide-react-native';
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useGoalWizard } from '../../contexts/GoalWizardContext';
import { NumberText } from '../NumberText';
import { useSettings } from '../../contexts/SettingsContext';
import { useFoodPreferencesSafe } from '../../contexts/FoodPreferencesContext';
import { successNotification, lightImpact } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';
import {
  generateWorkoutGuidance,
  generateDailyGuidance,
  generateNutritionGuidance
} from '../../services/openaiService';

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
  const foodPrefs = useFoodPreferencesSafe();
  const hasPlayedHaptic = useRef(false);
  const hasCalculatedResults = useRef(false);

  // AI-generated content state
  const [workoutGuidance, setWorkoutGuidance] = useState<string>('');
  const [dailyGuidance, setDailyGuidance] = useState<string>('');
  const [nutritionGuidance, setNutritionGuidance] = useState<string>('');
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);

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
    // Play haptic once
    if (!hasPlayedHaptic.current) {
      hasPlayedHaptic.current = true;
      successNotification();
    }
  }, []);

  // Generate AI workout guidance
  useEffect(() => {
    async function generateWorkout() {
      if (!state.primaryGoal || workoutGuidance || isLoadingWorkout) return;

      setIsLoadingWorkout(true);
      try {
        const guidance = await generateWorkoutGuidance({
          primaryGoal: state.primaryGoal,
          workoutsPerWeek: state.workoutsPerWeek || 3,
          workoutDuration: state.workoutDuration || 30,
          activityLevel: state.activityLevel || 'moderate',
          equipmentAccess: state.equipmentAccess || [],
          injuries: state.injuries,
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
  }, [state.primaryGoal, state.workoutsPerWeek, state.workoutDuration, state.activityLevel]);

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

  // Generate AI nutrition guidance
  useEffect(() => {
    async function generateNutrition() {
      if (nutritionGuidance || isLoadingNutrition) return;

      setIsLoadingNutrition(true);
      try {
        const guidance = await generateNutritionGuidance({
          dietStyle: state.dietStyle,
          allergies: state.allergies,
          favoriteCuisines: foodPrefs?.preferences?.favoriteCuisines,
          cookingTime: foodPrefs?.preferences?.cookingTime,
          budgetLevel: foodPrefs?.preferences?.budgetLevel,
          mealsPerDay: state.mealsPerDay,
          intermittentFasting: state.intermittentFasting,
          fastingWindow: state.fastingWindow,
          dislikedIngredients: foodPrefs?.preferences?.hatedFoods?.split(',').map((f: string) => f.trim()),
        });
        setNutritionGuidance(guidance);
      } catch (error) {
        console.error('[SuccessScreen] Error generating nutrition guidance:', error);
        setNutritionGuidance('Your personalized nutrition guidance is being prepared. Focus on whole foods and consistent meal timing.');
      } finally {
        setIsLoadingNutrition(false);
      }
    }

    generateNutrition();
  }, [state.dietStyle, state.allergies, state.mealsPerDay, foodPrefs?.preferences]);

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
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.light }]}>You're All Set!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
          Your personalized nutrition plan is ready. Use this as your daily guide to reach your goals.
        </Text>
      </View>

      {/* Daily Targets - Separate Cards */}
      {state.results && (
        <View style={styles.targetsSection}>
          <Text style={[styles.targetsSectionHeader, { color: colors.textMuted, fontFamily: Fonts.light }]}>YOUR DAILY TARGETS</Text>
          <View style={styles.targetsGrid}>
            <GlassCard style={styles.targetCard} interactive>
              <Flame size={20} color={Colors.error} />
              <NumberText weight="semiBold" style={[styles.targetValue, { color: colors.text }]}>
                {Math.round(state.results.calories).toLocaleString()}
              </NumberText>
              <Text style={[styles.targetLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Calories</Text>
            </GlassCard>
            <GlassCard style={styles.targetCard} interactive>
              <Fish size={20} color={colors.protein} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <NumberText weight="semiBold" style={[styles.targetValue, { color: colors.text }]}>
                  {state.results.protein}
                </NumberText>
                <Text style={[styles.targetUnit, { color: colors.text, fontFamily: Fonts.light }]}>g</Text>
              </View>
              <Text style={[styles.targetLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Protein</Text>
            </GlassCard>
            <GlassCard style={styles.targetCard} interactive>
              <Leaf size={20} color={colors.carbs} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <NumberText weight="semiBold" style={[styles.targetValue, { color: colors.text }]}>
                  {state.results.carbs}
                </NumberText>
                <Text style={[styles.targetUnit, { color: colors.text, fontFamily: Fonts.light }]}>g</Text>
              </View>
              <Text style={[styles.targetLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Carbs</Text>
            </GlassCard>
            <GlassCard style={styles.targetCard} interactive>
              <Coffee size={20} color={colors.fat} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <NumberText weight="semiBold" style={[styles.targetValue, { color: colors.text }]}>
                  {state.results.fat}
                </NumberText>
                <Text style={[styles.targetUnit, { color: colors.text, fontFamily: Fonts.light }]}>g</Text>
              </View>
              <Text style={[styles.targetLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Fat</Text>
            </GlassCard>
          </View>
        </View>
      )}

      {/* Workout Plan Commentary */}
      <View>
        <GlassCard style={styles.workoutPlanCard} interactive>
          <View style={styles.workoutPlanHeader}>
            <Dumbbell size={20} color={Colors.error} />
            <Text style={[styles.workoutPlanTitle, { fontFamily: Fonts.light }]}>YOUR WORKOUT PLAN</Text>
          </View>

          {isLoadingWorkout ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.protein} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Generating your personalized workout plan...
              </Text>
            </View>
          ) : (
            <Text style={[styles.workoutPlanDescription, { color: colors.text, fontFamily: Fonts.light }]}>
              {workoutGuidance}
            </Text>
          )}

          <View style={styles.workoutPlanFeatures}>
            <View style={styles.workoutFeatureItem}>
              <Calendar size={16} color={colors.protein} />
              <Text style={[styles.workoutFeatureText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
                <NumberText weight="light" style={[styles.workoutFeatureText, { color: colors.textSecondary }]}>
                  {state.workoutsPerWeek || 3}
                </NumberText> workouts per week
              </Text>
            </View>
            <View style={styles.workoutFeatureItem}>
              <Timer size={16} color={colors.protein} />
              <Text style={[styles.workoutFeatureText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
                <NumberText weight="light" style={[styles.workoutFeatureText, { color: colors.textSecondary }]}>
                  {state.workoutDuration || 30}
                </NumberText> minutes per session
              </Text>
            </View>
            <View style={styles.workoutFeatureItem}>
              <Activity size={16} color={Colors.error} />
              <Text style={[styles.workoutFeatureText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
                {state.cardioPreference === 'walking' && 'Walking-based cardio'}
                {state.cardioPreference === 'running' && 'Running-based cardio'}
                {state.cardioPreference === 'hiit' && 'HIIT training sessions'}
                {!state.cardioPreference && 'Customized cardio'}
              </Text>
            </View>
            <View style={styles.workoutFeatureItem}>
              <TrendingUp size={16} color={colors.protein} />
              <Text style={[styles.workoutFeatureText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
                Progressive difficulty levels
              </Text>
            </View>
            <View style={styles.workoutFeatureItem}>
              <Target size={16} color={colors.protein} />
              <Text style={[styles.workoutFeatureText, { color: colors.textSecondary, fontFamily: Fonts.light }]}>
                {state.primaryGoal === 'lose_weight' && 'Optimized for fat burning'}
                {state.primaryGoal === 'build_muscle' && 'Maximizes muscle growth'}
                {state.primaryGoal === 'maintain' && 'Sustains current fitness'}
                {state.primaryGoal === 'improve_health' && 'Enhances overall wellness'}
              </Text>
            </View>
          </View>

          <GlassCard style={styles.workoutPlanNote} interactive>
            <View style={styles.workoutPlanNoteInner}>
              <Lightbulb size={16} color={colors.textMuted} />
              <Text style={[styles.workoutPlanNoteText, { color: colors.textMuted, fontFamily: Fonts.light }]}>
                Your plan adapts based on your progress and includes rest days for optimal recovery.
              </Text>
            </View>
          </GlassCard>
        </GlassCard>
      </View>

      {/* Detailed Profile Summary */}
      <View>
        <GlassCard style={styles.profileCard} interactive>
          <View style={styles.profileHeader}>
            <User size={20} color={Colors.success} />
            <Text style={[styles.profileTitle, { fontFamily: Fonts.light }]}>YOUR PROFILE SUMMARY</Text>
          </View>

          <View style={styles.profileGrid}>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Goal</Text>
              <Text style={[styles.profileValue, { color: colors.text, fontFamily: Fonts.light }]}>{getGoalLabel()}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Activity</Text>
              <Text style={[styles.profileValue, { color: colors.text, fontFamily: Fonts.light }]}>{getActivityLabel()}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Current Weight</Text>
              <Text style={[styles.profileValue, { color: colors.text, fontFamily: Fonts.light }]}>{formatWeight(state.currentWeight)}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Target Weight</Text>
              <Text style={[styles.profileValue, { color: colors.text, fontFamily: Fonts.light }]}>{formatWeight(state.targetWeight)}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Height</Text>
              <Text style={[styles.profileValue, { color: colors.text, fontFamily: Fonts.light }]}>{formatHeight()}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Age</Text>
              <Text style={[styles.profileValue, { color: colors.text, fontFamily: Fonts.light }]}>
                {state.age ? (
                  <>
                    <NumberText weight="medium" style={[styles.profileValue, { color: colors.text }]}>
                      {state.age}
                    </NumberText> years
                  </>
                ) : '--'}
              </Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Diet Style</Text>
              <Text style={[styles.profileValue, { color: colors.text, fontFamily: Fonts.light }]}>{getDietLabel()}</Text>
            </GlassCard>
            <GlassCard style={styles.profileItem} interactive>
              <Text style={[styles.profileLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Workouts/Week</Text>
              <NumberText weight="medium" style={[styles.profileValue, { color: colors.text }]}>
                {state.workoutsPerWeek || 0}
              </NumberText>
            </GlassCard>
          </View>

          {/* Stats Row */}
          {state.results && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Flame size={16} color={Colors.error} />
                <NumberText weight="semiBold" style={[styles.statValue, { color: colors.text }]}>
                  {state.results.bmr.toLocaleString()}
                </NumberText>
                <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>BMR</Text>
              </View>
              <View style={styles.statItem}>
                <Zap size={16} color={Colors.warning} />
                <NumberText weight="semiBold" style={[styles.statValue, { color: colors.text }]}>
                  {state.results.tdee.toLocaleString()}
                </NumberText>
                <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>TDEE</Text>
              </View>
              <View style={styles.statItem}>
                <Weight size={16} color={Colors.success} />
                <NumberText weight="semiBold" style={[styles.statValue, { color: colors.text }]}>
                  {state.results.bmi.toFixed(1)}
                </NumberText>
                <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>BMI</Text>
              </View>
            </View>
          )}
        </GlassCard>
      </View>

      {/* Guidance Card */}
      <View>
        <GlassCard style={styles.guidanceCard} interactive>
          <View style={styles.guidanceHeader}>
            <Lightbulb size={20} color={Colors.warning} />
            <Text style={[styles.guidanceTitle, { fontFamily: Fonts.light }]}>DAILY GUIDANCE</Text>
          </View>
          {isLoadingDaily ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.warning} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Generating your daily guidance...
              </Text>
            </View>
          ) : (
            <Text style={[styles.guidanceText, { color: colors.textSecondary }]}>
              {dailyGuidance}
            </Text>
          )}
        </GlassCard>
      </View>

      {/* Food Preferences Section */}
      {foodPrefs && (
        <View>
          <GlassCard style={styles.foodPreferencesCard} interactive>
            <View style={styles.foodPrefsHeader}>
              <View style={styles.foodPrefsIconContainer}>
                <Utensils size={24} color={Colors.success} />
              </View>
              <View style={styles.foodPrefsHeaderText}>
                <Text style={[styles.foodPrefsTitle, { fontFamily: Fonts.light }]}>YOUR NUTRITION PREFERENCES</Text>
                <Text style={[styles.foodPrefsSubtitle, { color: colors.text, fontFamily: Fonts.light }]}>
                  Your personalized meal preferences
                </Text>
              </View>
            </View>

            {/* Dietary Preferences */}
            {foodPrefs?.preferences?.dietaryPreferences && foodPrefs.preferences.dietaryPreferences.length > 0 && (
              <GlassCard style={styles.prefCard} interactive>
                <View style={styles.prefSection}>
                  <View style={styles.prefRow}>
                    <Leaf size={16} color={colors.textMuted} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Dietary Style</Text>
                  </View>
                  <View style={styles.prefTagsRow}>
                    {foodPrefs.preferences.dietaryPreferences.map((pref, index) => (
                      <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(78, 205, 196, 0.15)' }]}>
                        <Text style={[styles.prefTagText, { color: Colors.success, fontFamily: Fonts.light }]}>
                          {pref.charAt(0).toUpperCase() + pref.slice(1).replace('_', ' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Allergens */}
            {foodPrefs?.preferences?.allergens && foodPrefs.preferences.allergens.length > 0 && (
              <GlassCard style={styles.prefCard} interactive>
                <View style={styles.prefSection}>
                  <View style={styles.prefRow}>
                    <AlertTriangle size={16} color={Colors.error} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Allergens to Avoid</Text>
                  </View>
                  <View style={styles.prefTagsRow}>
                    {foodPrefs.preferences.allergens.map((allergen, index) => (
                      <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                        <Text style={[styles.prefTagText, { color: Colors.error, fontFamily: Fonts.light }]}>
                          {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Favorite Cuisines */}
            {foodPrefs?.preferences?.favoriteCuisines && foodPrefs.preferences.favoriteCuisines.length > 0 && (
              <GlassCard style={styles.prefCard} interactive>
                <View style={styles.prefSection}>
                  <View style={styles.prefRow}>
                    <UtensilsCrossed size={16} color={colors.textMuted} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Favorite Cuisines</Text>
                  </View>
                  <View style={styles.prefTagsRow}>
                    {foodPrefs.preferences.favoriteCuisines.map((cuisine, index) => (
                      <View key={index} style={[styles.prefTag, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.prefTagText, { color: colors.text, fontFamily: Fonts.light }]}>
                          {cuisine.charAt(0).toUpperCase() + cuisine.slice(1).replace('_', ' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Favorite Proteins */}
            {foodPrefs?.preferences?.favoriteProteins && foodPrefs.preferences.favoriteProteins.length > 0 && (
              <GlassCard style={styles.prefCard} interactive>
                <View style={styles.prefSection}>
                  <View style={styles.prefRow}>
                    <Fish size={16} color={colors.protein} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Favorite Proteins</Text>
                  </View>
                  <View style={styles.prefTagsRow}>
                    {foodPrefs.preferences.favoriteProteins.map((protein, index) => (
                      <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(255, 179, 71, 0.15)' }]}>
                        <Text style={[styles.prefTagText, { color: colors.protein, fontFamily: Fonts.light }]}>
                          {protein.charAt(0).toUpperCase() + protein.slice(1).replace('_', ' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Favorite Vegetables */}
            {foodPrefs?.preferences?.favoriteVegetables && foodPrefs.preferences.favoriteVegetables.length > 0 && (
              <GlassCard style={styles.prefCard} interactive>
                <View style={styles.prefSection}>
                  <View style={styles.prefRow}>
                    <Leaf size={16} color={Colors.success} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Favorite Vegetables</Text>
                  </View>
                  <View style={styles.prefTagsRow}>
                    {foodPrefs.preferences.favoriteVegetables.map((veggie, index) => (
                      <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(78, 205, 196, 0.15)' }]}>
                        <Text style={[styles.prefTagText, { color: Colors.success, fontFamily: Fonts.light }]}>
                          {veggie.charAt(0).toUpperCase() + veggie.slice(1).replace('_', ' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Favorite Starches */}
            {foodPrefs?.preferences?.favoriteStarches && foodPrefs.preferences.favoriteStarches.length > 0 && (
              <GlassCard style={styles.prefCard} interactive>
                <View style={styles.prefSection}>
                  <View style={styles.prefRow}>
                    <Pizza size={16} color={colors.carbs} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Favorite Starches</Text>
                  </View>
                  <View style={styles.prefTagsRow}>
                    {foodPrefs.preferences.favoriteStarches.map((starch, index) => (
                      <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(99, 177, 255, 0.15)' }]}>
                        <Text style={[styles.prefTagText, { color: colors.carbs, fontFamily: Fonts.light }]}>
                          {starch.charAt(0).toUpperCase() + starch.slice(1).replace('_', ' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Favorite Snacks */}
            {foodPrefs?.preferences?.favoriteSnacks && foodPrefs.preferences.favoriteSnacks.length > 0 && (
              <GlassCard style={styles.prefCard} interactive>
                <View style={styles.prefSection}>
                  <View style={styles.prefRow}>
                    <IceCream size={16} color={colors.textMuted} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Favorite Snacks</Text>
                  </View>
                  <View style={styles.prefTagsRow}>
                    {foodPrefs.preferences.favoriteSnacks.map((snack, index) => (
                      <View key={index} style={[styles.prefTag, { backgroundColor: colors.backgroundSecondary }]}>
                        <Text style={[styles.prefTagText, { color: colors.text, fontFamily: Fonts.light }]}>
                          {snack.charAt(0).toUpperCase() + snack.slice(1).replace('_', ' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Hated Foods */}
            {foodPrefs?.preferences?.hatedFoods && foodPrefs.preferences.hatedFoods.trim().length > 0 && (
              <GlassCard style={styles.prefCard} interactive>
                <View style={styles.prefSection}>
                  <View style={styles.prefRow}>
                    <XCircle size={16} color={Colors.error} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Foods to Avoid</Text>
                  </View>
                  <View style={styles.prefTagsRow}>
                    {foodPrefs.preferences.hatedFoods.split(',').map((food, index) => (
                      <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                        <Text style={[styles.prefTagText, { color: Colors.error, fontFamily: Fonts.light }]}>
                          {food.trim().charAt(0).toUpperCase() + food.trim().slice(1).replace('_', ' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Meal Planning Preferences */}
            <GlassCard style={styles.prefCard} interactive>
              <View style={styles.mealPlanningSection}>
                {/* Meal Diversity */}
                {foodPrefs?.preferences?.mealDiversity && (
                  <View style={styles.prefRow}>
                    <SettingsIcon size={16} color={colors.textMuted} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Meal Variety: </Text>
                    <Text style={[styles.prefValue, { color: colors.text, fontFamily: Fonts.light }]}>
                      {foodPrefs.preferences.mealDiversity === 'sameDaily' ? 'Same Meals Daily (Meal Prep)' : 'Diverse Meals'}
                    </Text>
                  </View>
                )}

                {/* Meal Style */}
                {foodPrefs?.preferences?.mealStyle && (
                  <View style={styles.prefRow}>
                    <Timer size={16} color={colors.textMuted} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Meal Style: </Text>
                    <Text style={[styles.prefValue, { color: colors.text, fontFamily: Fonts.light }]}>
                      {foodPrefs.preferences.mealStyle === 'threePlusSnacks' ? '3 Meals + Snacks' : 'Fewer, Larger Meals'}
                    </Text>
                  </View>
                )}

                {/* Cheat Days */}
                {foodPrefs?.preferences?.cheatDays !== undefined && (
                  <View style={styles.prefRow}>
                    <Calendar size={16} color={colors.textMuted} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Cheat Days: </Text>
                    <Text style={[styles.prefValue, { color: colors.text, fontFamily: Fonts.light }]}>
                      <NumberText weight="light" style={[styles.prefValue, { color: colors.text }]}>
                        {foodPrefs.preferences.cheatDays.length}
                      </NumberText> per week
                    </Text>
                  </View>
                )}

                {/* Cooking Skill */}
                {foodPrefs?.preferences?.cookingSkill && (
                  <View style={styles.prefRow}>
                    <ChefHat size={16} color={colors.textMuted} />
                    <Text style={[styles.prefLabel, { color: colors.textMuted, fontFamily: Fonts.light }]}>Cooking Skill: </Text>
                    <Text style={[styles.prefValue, { color: colors.text, fontFamily: Fonts.light }]}>
                      {foodPrefs.preferences.cookingSkill === 'beginner' ? 'Beginner' :
                       foodPrefs.preferences.cookingSkill === 'intermediate' ? 'Intermediate' : 'Advanced'}
                    </Text>
                  </View>
                )}
              </View>
            </GlassCard>

            {/* AI-Generated Nutrition Guidance */}
            <View style={styles.nutritionGuidanceSection}>
              <View style={styles.guidanceHeader}>
                <Sparkles size={18} color={Colors.success} />
                <Text style={[styles.guidanceSectionTitle, { color: colors.text }]}>PERSONALIZED NUTRITION GUIDANCE</Text>
              </View>
              {isLoadingNutrition ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.success} />
                  <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                    Generating your personalized nutrition guidance...
                  </Text>
                </View>
              ) : (
                <Text style={[styles.nutritionGuidanceText, { color: colors.textSecondary }]}>
                  {nutritionGuidance}
                </Text>
              )}
            </View>
          </GlassCard>
        </View>
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
                    <Text style={[styles.coachingButtonTitle, { color: colors.text, fontFamily: Fonts.light }]}>Watch Your Customized Coaching</Text>
                    <Text style={[styles.coachingButtonSubtitle, { color: colors.textMuted, fontFamily: Fonts.light }]}>Your AI coach explains your personalized plan</Text>
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
                  <Text style={[styles.mealPlanButtonTitle, { color: colors.text, fontFamily: Fonts.light }]}>
                    {isGeneratingMealPlan ? 'Generating AI Meal Plan...' : 'Start Your '}
                    {!isGeneratingMealPlan && (
                      <NumberText weight="light" style={[styles.mealPlanButtonTitle, { color: colors.text }]}>7</NumberText>
                    )}
                    {isGeneratingMealPlan ? '' : '-Day Meal Plan'}
                  </Text>
                  <Text style={[styles.mealPlanButtonSubtitle, { color: colors.textMuted, fontFamily: Fonts.light }]}>
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
                  <Text style={[styles.trainingPlanButtonTitle, { color: colors.text, fontFamily: Fonts.light }]}>
                    {isGeneratingTrainingPlan ? 'Generating AI Training Plan...' : 'Start Your Training Plan'}
                  </Text>
                  <Text style={[styles.trainingPlanButtonSubtitle, { color: colors.textMuted, fontFamily: Fonts.light }]}>
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
              <Text style={[styles.primaryButtonText, { color: colors.primary, fontFamily: Fonts.light }]}>LOG YOUR FIRST MEAL</Text>
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
                <Text style={[styles.secondaryButtonText, { color: colors.text, fontFamily: Fonts.light }]}>DASHBOARD</Text>
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
                  <Text style={[styles.adjustButtonText, { color: colors.text, fontFamily: Fonts.light }]}>ADJUST</Text>
                </View>
              </GlassCard>
            </Pressable>
          )}
        </View>
      </View>
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
    fontSize: 28,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
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
    fontFamily: Fonts.light,
    fontWeight: '200',
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
    fontFamily: Fonts.light,
    fontWeight: '200',
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
    fontFamily: Fonts.light,
    fontWeight: '200',
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
  foodPreferencesCard: {
    width: '100%',
    padding: 16,
    marginBottom: 16,
  },
  foodPrefsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  foodPrefsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodPrefsHeaderText: {
    flex: 1,
  },
  foodPrefsTitle: {
    fontSize: 10,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: Colors.success,
  },
  foodPrefsSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
  },
  prefCard: {
    width: '100%',
    padding: 12,
    marginBottom: 12,
  },
  prefSection: {
    marginBottom: 0,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  prefLabel: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.textMuted,
  },
  prefValue: {
    fontSize: 12,
    color: Colors.text,
  },
  prefTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prefTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
  },
  prefTagText: {
    fontSize: 12,
    color: Colors.text,
  },
  mealPlanningSection: {
    gap: 12,
    marginTop: 4,
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
  nutritionGuidanceSection: {
    marginTop: 20,
    paddingTop: 20,
  },
  guidanceSectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: Colors.text,
  },
  nutritionGuidanceText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
});
