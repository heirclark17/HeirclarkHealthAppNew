import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useGoalWizard } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useFoodPreferencesSafe } from '../../contexts/FoodPreferencesContext';
import { successNotification, lightImpact } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';

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
  const foodPrefs = useFoodPreferencesSafe();
  const hasPlayedHaptic = useRef(false);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Translucent primary color for active button
  const primaryGlassBg = isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)';

  useEffect(() => {
    // Play haptic once
    if (!hasPlayedHaptic.current) {
      hasPlayedHaptic.current = true;
      successNotification();
    }
  }, []);

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
      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.checkContainer}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color={Colors.background} />
          </View>
        </View>
      </View>

      {/* Success Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>You're All Set!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your personalized nutrition plan is ready. Use this as your daily guide to reach your goals.
        </Text>
      </View>

      {/* Daily Targets - Separate Cards */}
      {state.results && (
        <View style={styles.targetsSection}>
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
        </View>
      )}

      {/* Workout Plan Commentary */}
      <View>
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
      </View>

      {/* Detailed Profile Summary */}
      <View>
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
      </View>

      {/* Guidance Card */}
      <View>
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
      </View>

      {/* Food Preferences Section */}
      {foodPrefs && (
        <View>
          <GlassCard style={styles.foodPreferencesCard} interactive>
            <View style={styles.foodPrefsHeader}>
              <View style={styles.foodPrefsIconContainer}>
                <Ionicons name="nutrition" size={24} color={Colors.success} />
              </View>
              <View style={styles.foodPrefsHeaderText}>
                <Text style={styles.foodPrefsTitle}>YOUR NUTRITION PREFERENCES</Text>
                <Text style={[styles.foodPrefsSubtitle, { color: colors.text }]}>
                  Your personalized meal preferences
                </Text>
              </View>
            </View>

            {/* Dietary Preferences */}
            {foodPrefs.dietaryPreferences && foodPrefs.dietaryPreferences.length > 0 && (
              <View style={styles.prefSection}>
                <View style={styles.prefRow}>
                  <Ionicons name="leaf-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Dietary Style</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.dietaryPreferences.map((pref, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(78, 205, 196, 0.15)' }]}>
                      <Text style={[styles.prefTagText, { color: Colors.success }]}>
                        {pref.charAt(0).toUpperCase() + pref.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Allergens */}
            {foodPrefs.allergens && foodPrefs.allergens.length > 0 && (
              <View style={styles.prefSection}>
                <View style={styles.prefRow}>
                  <Ionicons name="warning-outline" size={16} color={Colors.error} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Allergens to Avoid</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.allergens.map((allergen, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                      <Text style={[styles.prefTagText, { color: Colors.error }]}>
                        {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Favorite Cuisines */}
            {foodPrefs.favoriteCuisines && foodPrefs.favoriteCuisines.length > 0 && (
              <View style={styles.prefSection}>
                <View style={styles.prefRow}>
                  <Ionicons name="restaurant-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Favorite Cuisines</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.favoriteCuisines.map((cuisine, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.prefTagText, { color: colors.text }]}>
                        {cuisine.charAt(0).toUpperCase() + cuisine.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Favorite Proteins */}
            {foodPrefs.favoriteProteins && foodPrefs.favoriteProteins.length > 0 && (
              <View style={styles.prefSection}>
                <View style={styles.prefRow}>
                  <Ionicons name="fish-outline" size={16} color={colors.protein} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Favorite Proteins</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.favoriteProteins.map((protein, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(255, 179, 71, 0.15)' }]}>
                      <Text style={[styles.prefTagText, { color: colors.protein }]}>
                        {protein.charAt(0).toUpperCase() + protein.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Favorite Vegetables */}
            {foodPrefs.favoriteVegetables && foodPrefs.favoriteVegetables.length > 0 && (
              <View style={styles.prefSection}>
                <View style={styles.prefRow}>
                  <Ionicons name="leaf" size={16} color={Colors.success} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Favorite Vegetables</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.favoriteVegetables.map((veggie, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(78, 205, 196, 0.15)' }]}>
                      <Text style={[styles.prefTagText, { color: Colors.success }]}>
                        {veggie.charAt(0).toUpperCase() + veggie.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Favorite Starches */}
            {foodPrefs.favoriteStarches && foodPrefs.favoriteStarches.length > 0 && (
              <View style={styles.prefSection}>
                <View style={styles.prefRow}>
                  <Ionicons name="pizza-outline" size={16} color={colors.carbs} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Favorite Starches</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.favoriteStarches.map((starch, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(99, 177, 255, 0.15)' }]}>
                      <Text style={[styles.prefTagText, { color: colors.carbs }]}>
                        {starch.charAt(0).toUpperCase() + starch.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Favorite Snacks */}
            {foodPrefs.favoriteSnacks && foodPrefs.favoriteSnacks.length > 0 && (
              <View style={styles.prefSection}>
                <View style={styles.prefRow}>
                  <Ionicons name="ice-cream-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Favorite Snacks</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.favoriteSnacks.map((snack, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.prefTagText, { color: colors.text }]}>
                        {snack.charAt(0).toUpperCase() + snack.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Hated Foods */}
            {foodPrefs.hatedFoods && foodPrefs.hatedFoods.length > 0 && (
              <View style={styles.prefSection}>
                <View style={styles.prefRow}>
                  <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Foods to Avoid</Text>
                </View>
                <View style={styles.prefTagsRow}>
                  {foodPrefs.hatedFoods.map((food, index) => (
                    <View key={index} style={[styles.prefTag, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                      <Text style={[styles.prefTagText, { color: Colors.error }]}>
                        {food.charAt(0).toUpperCase() + food.slice(1).replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Meal Planning Preferences */}
            <View style={styles.mealPlanningSection}>
              {/* Meal Diversity */}
              {foodPrefs.mealDiversity && (
                <View style={styles.prefRow}>
                  <Ionicons name="options-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Meal Variety: </Text>
                  <Text style={[styles.prefValue, { color: colors.text }]}>
                    {foodPrefs.mealDiversity === 'same_meals' ? 'Same Meals Daily' : 'Diverse Meals'}
                  </Text>
                </View>
              )}

              {/* Meal Style */}
              {foodPrefs.mealStyle && (
                <View style={styles.prefRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Meal Style: </Text>
                  <Text style={[styles.prefValue, { color: colors.text }]}>
                    {foodPrefs.mealStyle === 'quick_simple' ? 'Quick & Simple' : 'Gourmet & Complex'}
                  </Text>
                </View>
              )}

              {/* Cheat Days */}
              {foodPrefs.cheatDays !== undefined && (
                <View style={styles.prefRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Cheat Days: </Text>
                  <Text style={[styles.prefValue, { color: colors.text }]}>
                    {foodPrefs.cheatDays} per week
                  </Text>
                </View>
              )}

              {/* Cooking Skill */}
              {foodPrefs.cookingSkill && (
                <View style={styles.prefRow}>
                  <Ionicons name="flame-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.prefLabel, { color: colors.textMuted }]}>Cooking Skill: </Text>
                  <Text style={[styles.prefValue, { color: colors.text }]}>
                    {foodPrefs.cookingSkill === 'beginner' ? 'Beginner' :
                     foodPrefs.cookingSkill === 'intermediate' ? 'Intermediate' : 'Advanced'}
                  </Text>
                </View>
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
  prefSection: {
    marginBottom: 16,
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
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  mealPlanningSection: {
    gap: 12,
    marginTop: 4,
  },
});
