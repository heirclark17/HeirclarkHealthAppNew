import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { api, MealData } from '../../services/api';
import { useMealPlan } from '../../contexts/MealPlanContext';
import { instacartService } from '../../services/instacartService';
import { mealPlanService } from '../../services/mealPlanService';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../../components/GlassCard';
import { Meal } from '../../types/mealPlan';
import {
  LoadingState,
  DaySelector,
  MealCard,
  GroceryListModal,
  MacroProgressBar,
  MealPlanCoachingModal,
} from '../../components/mealPlan';

export default function MealsScreen() {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);

  // Daily targets from API
  const [dailyTargets, setDailyTargets] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
  });

  // Meal Plan Context
  const {
    state: mealPlanState,
    generateMealPlan,
    generateAIMealPlan,
    swapMeal,
    setSelectedDay,
    toggleGroceryItem,
    openInstacart,
    loadCachedPlan,
  } = useMealPlan();

  const {
    weeklyPlan,
    groceryList,
    isGenerating,
    isSwapping,
    error,
    selectedDayIndex,
  } = mealPlanState;

  // Get current day's plan
  const currentDayPlan = weeklyPlan ? weeklyPlan[selectedDayIndex] : null;
  const currentDayMeals = currentDayPlan?.meals || [];
  const currentDayTotals = currentDayPlan?.dailyTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Fetch goals from API
  const fetchGoals = async () => {
    try {
      const goals = await api.getGoals();
      if (goals) {
        setDailyTargets({
          calories: goals.dailyCalories || 2000,
          protein: goals.dailyProtein || 150,
          carbs: goals.dailyCarbs || 200,
          fats: goals.dailyFat || 65,
        });
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGoals();
    await loadCachedPlan();
    setRefreshing(false);
  }, [loadCachedPlan]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [])
  );

  // Handle quick generate (template-based)
  const handleGenerate = async () => {
    const success = await generateMealPlan();
    if (!success && error) {
      console.error('Failed to generate meal plan:', error);
    }
  };

  // Handle AI-powered generate
  const handleAIGenerate = async () => {
    const success = await generateAIMealPlan();
    if (!success && error) {
      console.error('Failed to generate AI meal plan:', error);
    }
  };

  // Handle meal swap
  const handleSwapMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    await swapMeal(selectedDayIndex, mealType, 'Want variety');
  };

  // Handle Instacart order
  const handleOrderInstacart = async () => {
    setShowGroceryModal(false);
    await openInstacart();
  };

  // Handle adding meal to Today's Meals (calorie counter)
  const handleAddToTodaysMeals = async (meal: Meal) => {
    try {
      // Convert meal to the format expected by the calorie counter
      const mealData = {
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        mealType: meal.mealType,
        servings: meal.servings,
      };

      // Log the meal for now - this would integrate with the calorie counter API
      await api.logMeal(mealData);
      Alert.alert('Added!', `${meal.name} has been added to Today's Meals.`);
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Error', 'Failed to add meal. Please try again.');
    }
  };

  // Handle adding meal ingredients to Instacart
  const handleAddIngredientsToInstacart = async (meal: Meal) => {
    try {
      console.log('[MealsScreen] Adding ingredients to Instacart for:', meal.name);
      console.log('[MealsScreen] Meal ingredients count:', meal.ingredients?.length || 0);

      if (!meal.ingredients || meal.ingredients.length === 0) {
        Alert.alert('No Ingredients', 'This meal has no ingredients to add to Instacart');
        return;
      }

      // Use the mealPlanService to create an Instacart products link
      const response = await mealPlanService.createInstacartListForMeal(meal);

      console.log('[MealsScreen] Instacart response:', JSON.stringify(response, null, 2));

      if (response.success && response.instacartUrl) {
        console.log('[MealsScreen] Opening Instacart URL:', response.instacartUrl);
        // Open the Instacart link with the products
        await instacartService.openInstacart(response.instacartUrl);
      } else {
        console.log('[MealsScreen] Instacart link failed:', response.error);
        Alert.alert('Instacart Error', response.error || 'Failed to create shopping list. Opening Instacart...');
        // Fallback to opening Instacart app directly
        await instacartService.openInstacart();
      }
    } catch (error) {
      console.error('[MealsScreen] Error opening Instacart:', error);
      Alert.alert('Error', 'Network error. Opening Instacart...');
      // Try to open Instacart anyway
      await instacartService.openInstacart();
    }
  };

  // Group meals by type for display
  const mealsByType = {
    breakfast: currentDayMeals.filter(m => m.mealType === 'breakfast'),
    lunch: currentDayMeals.filter(m => m.mealType === 'lunch'),
    dinner: currentDayMeals.filter(m => m.mealType === 'dinner'),
    snack: currentDayMeals.filter(m => m.mealType === 'snack'),
  };

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
          <Text style={[styles.title, { color: colors.text }]}>7-Day Meal Plan</Text>
        </View>

        {/* Daily Targets - Combined Card with iOS Liquid Glass */}
        <GlassCard
          style={[
            styles.targetsContainer,
            { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)' }
          ]}
          interactive
        >
          <View style={styles.targetsRow}>
            <View style={styles.targetItem}>
              <Text style={[styles.targetValue, { color: colors.text }]}>{dailyTargets.calories}</Text>
              <Text style={[styles.targetLabel, { color: colors.textMuted }]}>Calories</Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={[styles.targetValue, { color: colors.text }]}>{dailyTargets.protein}g</Text>
              <Text style={[styles.targetLabel, { color: colors.textMuted }]}>Protein</Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={[styles.targetValue, { color: colors.text }]}>{dailyTargets.carbs}g</Text>
              <Text style={[styles.targetLabel, { color: colors.textMuted }]}>Carbs</Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={[styles.targetValue, { color: colors.text }]}>{dailyTargets.fats}g</Text>
              <Text style={[styles.targetLabel, { color: colors.textMuted }]}>Fats</Text>
            </View>
          </View>
        </GlassCard>

        {/* Generate Plan Section - show when no plan exists */}
        {!weeklyPlan && !isGenerating && (
          <Animated.View entering={FadeIn}>
            <GlassCard
              style={[
                styles.card,
                { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)' }
              ]}
              interactive
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Create Your Personalized Plan</Text>
              <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
                AI will generate a 7-day meal plan based on your saved food preferences and macro goals
              </Text>

              <TouchableOpacity style={styles.linkButton}>
                <Text style={[styles.linkButtonText, { color: colors.accent }]}>Edit Food Preferences</Text>
              </TouchableOpacity>

              <View style={styles.generateButtonsRow}>
                <TouchableOpacity
                  style={[styles.halfButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', borderColor: colors.primary, borderWidth: 1 }]}
                  onPress={handleGenerate}
                  disabled={isGenerating}
                >
                  <Ionicons name="flash-outline" size={20} color={colors.primary} />
                  <Text style={[styles.halfButtonText, { color: colors.primary }]}>Quick Generate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.halfButton, { backgroundColor: colors.primary }]}
                  onPress={handleAIGenerate}
                  disabled={isGenerating}
                >
                  <Ionicons name="sparkles" size={20} color={colors.primaryText} />
                  <Text style={[styles.halfButtonText, { color: colors.primaryText }]}>AI-Powered</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <View style={styles.loadingHeader}>
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Generating your personalized meal plan...</Text>
            </View>
            <LoadingState count={4} />
          </Animated.View>
        )}

        {/* Error State */}
        {error && !isGenerating && (
          <Animated.View entering={FadeIn}>
            <GlassCard
              style={[
                styles.errorCard,
                { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)' }
              ]}
              interactive
            >
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={[styles.errorTitle, { color: colors.text }]}>Something went wrong</Text>
              <Text style={[styles.errorText, { color: colors.textMuted }]}>{error}</Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={handleGenerate}>
                <Text style={[styles.retryButtonText, { color: colors.primaryText }]}>Try Again</Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        )}

        {/* Meal Plan Content - show when plan exists */}
        {weeklyPlan && !isGenerating && (
          <Animated.View entering={FadeInDown.delay(100)}>
            {/* Day Selector */}
            <DaySelector
              weeklyPlan={weeklyPlan}
              selectedDayIndex={selectedDayIndex}
              onSelectDay={setSelectedDay}
            />

            {/* Meals List */}
            <View style={styles.mealsContainer}>
              {currentDayMeals.length > 0 ? (
                <>
                  {/* Breakfast */}
                  {mealsByType.breakfast.map((meal, index) => (
                    <MealCard
                      key={`breakfast-${index}`}
                      meal={meal}
                      index={index}
                      onSwap={() => handleSwapMeal('breakfast')}
                      isSwapping={isSwapping}
                      onAddToTodaysMeals={handleAddToTodaysMeals}
                      onAddIngredientsToInstacart={handleAddIngredientsToInstacart}
                    />
                  ))}

                  {/* Lunch */}
                  {mealsByType.lunch.map((meal, index) => (
                    <MealCard
                      key={`lunch-${index}`}
                      meal={meal}
                      index={mealsByType.breakfast.length + index}
                      onSwap={() => handleSwapMeal('lunch')}
                      isSwapping={isSwapping}
                      onAddToTodaysMeals={handleAddToTodaysMeals}
                      onAddIngredientsToInstacart={handleAddIngredientsToInstacart}
                    />
                  ))}

                  {/* Dinner */}
                  {mealsByType.dinner.map((meal, index) => (
                    <MealCard
                      key={`dinner-${index}`}
                      meal={meal}
                      index={mealsByType.breakfast.length + mealsByType.lunch.length + index}
                      onSwap={() => handleSwapMeal('dinner')}
                      isSwapping={isSwapping}
                      onAddToTodaysMeals={handleAddToTodaysMeals}
                      onAddIngredientsToInstacart={handleAddIngredientsToInstacart}
                    />
                  ))}

                  {/* Snacks */}
                  {mealsByType.snack.map((meal, index) => (
                    <MealCard
                      key={`snack-${index}`}
                      meal={meal}
                      index={
                        mealsByType.breakfast.length +
                        mealsByType.lunch.length +
                        mealsByType.dinner.length +
                        index
                      }
                      onSwap={() => handleSwapMeal('snack')}
                      isSwapping={isSwapping}
                      onAddToTodaysMeals={handleAddToTodaysMeals}
                      onAddIngredientsToInstacart={handleAddIngredientsToInstacart}
                    />
                  ))}
                </>
              ) : (
                <View style={styles.emptyDayState}>
                  <Text style={[styles.emptyDayText, { color: colors.textMuted }]}>No meals planned for this day</Text>
                </View>
              )}
            </View>

            {/* Regenerate buttons */}
            <View style={styles.regenerateSection}>
              <Text style={[styles.regenerateLabel, { color: colors.textMuted }]}>Regenerate Plan</Text>
              <View style={styles.generateButtonsRow}>
                <TouchableOpacity
                  style={[styles.halfButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', borderColor: colors.primary, borderWidth: 1 }]}
                  onPress={handleGenerate}
                  disabled={isGenerating}
                >
                  <Ionicons name="flash-outline" size={18} color={colors.primary} />
                  <Text style={[styles.halfButtonText, { color: colors.primary }]}>Quick</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.halfButton, { backgroundColor: colors.primary }]}
                  onPress={handleAIGenerate}
                  disabled={isGenerating}
                >
                  <Ionicons name="sparkles" size={18} color={colors.primaryText} />
                  <Text style={[styles.halfButtonText, { color: colors.primaryText }]}>AI-Powered</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Action Buttons */}
        {weeklyPlan && (
          <View style={styles.actionRow}>
            <GlassCard
              style={styles.glassActionButton}
              intensity={isDark ? 40 : 60}
              interactive
            >
              <TouchableOpacity
                onPress={() => setShowGroceryModal(true)}
                activeOpacity={0.7}
                style={styles.actionButtonInner}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                  <Ionicons name="cart-outline" size={18} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} />
                </View>
                <Text style={[styles.actionText, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }]}>Order Groceries</Text>
              </TouchableOpacity>
            </GlassCard>
            <GlassCard
              style={styles.glassActionButton}
              intensity={isDark ? 40 : 60}
              interactive
            >
              <TouchableOpacity
                onPress={() => setShowCoachingModal(true)}
                activeOpacity={0.7}
                style={styles.actionButtonInner}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                  <Ionicons name="person-outline" size={18} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} />
                </View>
                <Text style={[styles.actionText, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }]}>AI Coach</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Grocery List Modal */}
      <GroceryListModal
        visible={showGroceryModal}
        onClose={() => setShowGroceryModal(false)}
        groceryList={groceryList}
        onToggleItem={toggleGroceryItem}
        onOrderInstacart={handleOrderInstacart}
      />

      {/* AI Coaching Modal */}
      {weeklyPlan && (
        <MealPlanCoachingModal
          visible={showCoachingModal}
          onClose={() => setShowCoachingModal(false)}
          weeklyPlan={weeklyPlan}
          selectedDayIndex={selectedDayIndex}
          userGoals={{
            dailyCalories: dailyTargets.calories,
            dailyProtein: dailyTargets.protein,
            dailyCarbs: dailyTargets.carbs,
            dailyFat: dailyTargets.fats,
          }}
        />
      )}
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
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    color: Colors.text,
    fontFamily: Fonts.thin,
    letterSpacing: 0.5,
  },
  targetsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  targetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetItem: {
    flex: 1,
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.thin,
    letterSpacing: 0.3,
  },
  targetLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: Fonts.thin,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: Spacing.borderRadius,
    padding: 20,
    borderWidth: 1,
    // Background handled by GlassCard component
  },
  sectionTitle: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 8,
    fontFamily: Fonts.semiBold,
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Fonts.regular,
  },
  linkButton: {
    marginBottom: 12,
  },
  linkButtonText: {
    fontSize: 14,
    color: Colors.accent,
    fontFamily: Fonts.regular,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  generateButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  halfButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
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
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: Spacing.borderRadius,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    // Background handled by GlassCard component
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
  mealsContainer: {
    paddingHorizontal: 16,
  },
  emptyDayState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyDayText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  regenerateSection: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  regenerateLabel: {
    fontSize: 13,
    fontFamily: Fonts.urbanist.medium,
    marginBottom: 10,
    textAlign: 'center',
  },
  glassButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  regenerateButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  regenerateButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
  },
  glassActionButton: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    letterSpacing: 0.3,
  },
});
