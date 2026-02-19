import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Leaf, Settings, Zap, Sparkles, ShoppingCart } from 'lucide-react-native';
import { api, MealData } from '../../services/api';
import { useMealPlan } from '../../contexts/MealPlanContext';
import { useFoodPreferencesSafe } from '../../contexts/FoodPreferencesContext';
import { instacartService } from '../../services/instacartService';
import { mealPlanService } from '../../services/mealPlanService';
import { aiService } from '../../services/aiService';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { NumberText } from '../../components/NumberText';
import { useSettings } from '../../contexts/SettingsContext';
import { usePostHog } from '../../contexts/PostHogContext';
import { GlassCard } from '../../components/GlassCard';
import { Meal, PantryItem } from '../../types/mealPlan';
import {
  LoadingState,
  DaySelector,
  MealCard,
  GroceryListModal,
  CheatDayGuidanceCard,
  BudgetTierSelector,
  BudgetTierType,
} from '../../components/mealPlan';
import { CoachChatModal } from '../../components/agents/aiCoach';
import { FoodPreferencesModal } from '../../components/FoodPreferences';

export default function MealsScreen() {
  const { settings } = useSettings();
  const { capture } = usePostHog();
  const insets = useSafeAreaInsets();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [showFoodPrefsModal, setShowFoodPrefsModal] = useState(false);

  // Budget tier and pantry items for cost-optimized meal plans
  const [selectedBudgetTier, setSelectedBudgetTier] = useState<BudgetTierType>('moderate');
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [estimatedSavings, setEstimatedSavings] = useState<number | null>(null);

  // Daily targets from API
  const [dailyTargets, setDailyTargets] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  });

  // Meal Plan Context
  const {
    state: mealPlanState,
    generateMealPlan,
    generateAIMealPlan,
    swapMeal,
    setSelectedDay,
    toggleGroceryItem,
    deleteGroceryItem,
    openInstacart,
    loadCachedPlan,
    generateGroceryListOnDemand,
    orderWithInstacart,
  } = useMealPlan();

  const {
    weeklyPlan,
    groceryList,
    isGenerating,
    isSwapping,
    isGeneratingGroceryList,
    groceryListProgress,
    error,
    selectedDayIndex,
  } = mealPlanState;

  // Get current day's plan
  const currentDayPlan = weeklyPlan ? weeklyPlan[selectedDayIndex] : null;
  const currentDayMeals = currentDayPlan?.meals || [];
  const currentDayTotals = currentDayPlan?.dailyTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Food preferences for cheat day detection
  const foodPrefsContext = useFoodPreferencesSafe();
  const cheatDays = foodPrefsContext?.preferences?.cheatDays || [];

  // Determine if current selected day is a cheat day
  const isCheatDay = useMemo(() => {
    if (!currentDayPlan || cheatDays.length === 0) return false;

    // Get the day name from the plan (e.g., "Monday", "Tuesday")
    const dayName = currentDayPlan.dayName;
    if (!dayName) return false;

    // Normalize day name for comparison
    const normalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();

    return cheatDays.includes(normalizedDayName);
  }, [currentDayPlan, cheatDays]);

  // Get display day name for cheat day guidance
  const currentDayName = useMemo(() => {
    if (!currentDayPlan) return 'Today';
    return currentDayPlan.dayName || 'Today';
  }, [currentDayPlan]);

  // Fetch goals from API
  const fetchGoals = async () => {
    try {
      const goals = await api.getGoals();
      if (goals) {
        setDailyTargets({
          calories: goals.dailyCalories || 2000,
          protein: goals.dailyProtein || 150,
          carbs: goals.dailyCarbs || 200,
          fat: goals.dailyFat || 65,
        });
      }
      return goals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      return null;
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

      // Track screen view
      capture('screen_viewed', {
        screen_name: 'Meal Plan',
        screen_type: 'tab',
      });
    }, [])
  );

  // Handle quick generate (template-based)
  const handleGenerate = async () => {
    // Track meal plan generation
    capture('meal_plan_generated', {
      screen_name: 'Meal Plan',
      generation_type: 'quick',
    });

    // Refresh goals before generating to ensure we use latest values
    const goals = await fetchGoals();

    // Check if goals are set
    if (!goals || !goals.dailyCalories) {
      Alert.alert(
        'Goals Required',
        'Please complete the goal wizard before generating a meal plan. This helps us create a personalized plan that matches your nutrition needs.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set Goals',
            onPress: () => router.push('/goals'),
          },
        ]
      );
      return;
    }

    const success = await generateMealPlan();
    if (!success && error) {
      console.error('Failed to generate meal plan:', error);
    }
  };

  // Handle AI-powered generate
  const handleAIGenerate = async () => {
    // Track AI meal plan generation
    capture('meal_plan_generated', {
      screen_name: 'Meal Plan',
      generation_type: 'ai_powered',
    });

    // Refresh goals before generating to ensure we use latest values
    const goals = await fetchGoals();

    // Check if goals are set
    if (!goals || !goals.dailyCalories) {
      Alert.alert(
        'Goals Required',
        'Please complete the goal wizard before generating a meal plan. This helps us create a personalized plan that matches your nutrition needs.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set Goals',
            onPress: () => router.push('/goals'),
          },
        ]
      );
      return;
    }

    const success = await generateAIMealPlan();
    if (!success && error) {
      console.error('Failed to generate AI meal plan:', error);
    }
  };

  // Handle budget-optimized generate with Instacart cart
  const handleBudgetGenerate = async () => {
    try {
      // Refresh goals before generating
      await fetchGoals();

      // Get food preferences
      const prefs = foodPrefsContext?.preferences;

      const budgetPreferences = {
        daily_calories: dailyTargets.calories,
        daily_protein_g: dailyTargets.protein,
        daily_carbs_g: dailyTargets.carbs,
        daily_fat_g: dailyTargets.fat,
        dietary_restrictions: prefs?.dietaryPreferences || [],
        allergies: prefs?.allergens || [],
        cuisine_preferences: prefs?.favoriteCuisines || [],
        cooking_skill: (prefs?.cookingSkill || 'intermediate') as 'beginner' | 'intermediate' | 'advanced',
        max_prep_time_minutes: 60, // Default 60 minutes
        meals_per_day: 3, // Default 3 meals per day
        budget_tier: selectedBudgetTier,
        pantry_items: pantryItems,
      };

      const response = await api.generateMealPlanWithCart(budgetPreferences);

      if (response.ok && response.data) {
        // Set estimated savings from pantry items
        if (response.data.pantry_savings_cents) {
          setEstimatedSavings(response.data.pantry_savings_cents);
        }

        // Open Instacart cart if available
        if (response.data.cart?.cart_url) {
          Alert.alert(
            'Meal Plan Created!',
            `Your ${selectedBudgetTier} meal plan is ready.\n\nWeekly cost: $${(response.data.plan.weekly_cost_cents / 100).toFixed(2)}${response.data.pantry_savings_cents ? `\nPantry savings: $${(response.data.pantry_savings_cents / 100).toFixed(2)}` : ''}\n\nWould you like to open Instacart to order groceries?`,
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Open Instacart',
                onPress: () => instacartService.openInstacart(response.data!.cart.cart_url)
              },
            ]
          );
        }

        // Load the generated plan into the context
        await loadCachedPlan();
      } else {
        Alert.alert('Error', response.error || 'Failed to generate budget meal plan');
      }
    } catch (error) {
      console.error('Error generating budget meal plan:', error);
      Alert.alert('Error', 'Failed to generate budget meal plan. Please try again.');
    }
  };

  // Handle meal swap
  const handleSwapMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    // Track meal swap
    capture('meal_swapped', {
      screen_name: 'Meal Plan',
      meal_type: mealType,
      day_index: selectedDayIndex,
    });

    await swapMeal(selectedDayIndex, mealType, 'Want variety');
  };

  // Handle Instacart order with filters
  const handleOrderInstacart = async (filters?: { budgetTier?: 'low' | 'medium' | 'high'; dietary?: string[] }) => {
    try {
      await orderWithInstacart(filters);
      // Don't close modal automatically - let user confirm the order opened successfully
    } catch (error) {
      console.error('[MealsScreen] Instacart order error:', error);
      Alert.alert('Error', 'Could not open Instacart. Please try again.');
    }
  };

  // Handle adding meal to Today's Meals (calorie counter)
  const handleAddToTodaysMeals = async (meal: Meal) => {
    try {
      // Convert meal to the format expected by the calorie counter
      const mealData = {
        date: new Date().toISOString().split('T')[0],
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        mealType: meal.mealType,
        source: 'meal-plan',
      };

      // Log the meal for now - this would integrate with the calorie counter API
      await api.logMeal(mealData);
      Alert.alert('Added!', `${meal.name} has been added to Today's Meals.`);
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Error', 'Failed to add meal. Please try again.');
    }
  };

  // Handle saving meal to Saved Meals
  const handleSaveToSavedMeals = async (meal: Meal) => {
    try {
      console.log('[MealsScreen] Saving meal to Saved Meals:', meal.name);

      // Convert meal to AIMeal format expected by aiService
      const aiMeal = {
        id: `meal_${Date.now()}`,
        name: meal.name,
        mealType: meal.mealType,
        description: meal.description || '',
        nutrients: {
          calories: meal.calories,
          protein_g: meal.protein,
          carbs_g: meal.carbs,
          fat_g: meal.fat,
        },
        prepTimeMinutes: meal.prepTime || 15,
        cookTimeMinutes: meal.cookTime || 20,
        ingredients: meal.ingredients || [],
        instructions: meal.instructions || [],
        tags: [],
        servings: 1,
      };

      const savedMeal = await aiService.saveMeal(aiMeal, 'ai');

      if (savedMeal) {
        Alert.alert(
          'Meal Saved',
          `${meal.name} has been saved to your Saved Meals collection.`,
          [{ text: 'OK' }]
        );
        console.log('[MealsScreen] ✅ Meal saved successfully');
      } else {
        Alert.alert('Save Failed', 'Could not save meal. Please try again.');
        console.error('[MealsScreen] ❌ Failed to save meal');
      }
    } catch (error) {
      console.error('[MealsScreen] Error saving meal:', error);
      Alert.alert('Error', 'An error occurred while saving the meal.');
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>7-Day Meal Plan</Text>
        </View>

        {/* Day Selector (Calendar) - Moved to top when plan exists */}
        {weeklyPlan && !isGenerating && (
          <DaySelector
            weeklyPlan={weeklyPlan}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={setSelectedDay}
          />
        )}

        {/* Pantry Savings Banner - Show when there are savings */}
        {weeklyPlan && estimatedSavings && estimatedSavings > 0 && (
          <View style={[
            styles.savingsBanner,
            { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)' }
          ]}>
            <Leaf size={18} color={colors.successMuted} />
            <Text style={[styles.savingsText, { color: colors.successMuted, fontFamily: Fonts.light }]}>
              You're saving ~<NumberText weight="medium" style={{ color: colors.successMuted }}>${(estimatedSavings / 100).toFixed(2)}</NumberText> this week using pantry items!
            </Text>
          </View>
        )}

        {/* Generate Plan Section - show when no plan exists */}
        {!weeklyPlan && !isGenerating && (
          <View>
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

              <TouchableOpacity
                style={[styles.linkButton, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowFoodPrefsModal(true)}
                accessibilityLabel="Edit food preferences"
                accessibilityRole="button"
                accessibilityHint="Opens food preferences settings to customize dietary restrictions, allergies, and cuisine preferences"
              >
                <Settings size={16} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.linkButtonText, { color: colors.accent, fontFamily: Fonts.light }]}>Edit Food Preferences</Text>
              </TouchableOpacity>

              {/* Budget Tier Selection */}
              <BudgetTierSelector
                selectedTier={selectedBudgetTier}
                onSelectTier={setSelectedBudgetTier}
                pantryItems={pantryItems}
                onPantryItemsChange={setPantryItems}
                showPantryInput={true}
              />

              {/* Budget Generate Button - Full Width */}
              <GlassCard
                style={[styles.fullButtonGlass, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.15)', marginTop: 16 }]}
                intensity={isDark ? 50 : 70}
                interactive
              >
                <TouchableOpacity
                  onPress={handleBudgetGenerate}
                  disabled={isGenerating}
                  activeOpacity={0.7}
                  style={styles.halfButtonInner}
                  accessibilityLabel={`Budget meal plan generation, ${selectedBudgetTier} tier selected`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isGenerating, busy: isGenerating }}
                  accessibilityHint="Generates a cost-optimized 7-day meal plan with Instacart shopping cart based on your budget tier and pantry items"
                >
                  <ShoppingCart size={20} color={colors.successMuted} />
                  <Text style={[styles.halfButtonText, { color: isDark ? '#86efac' : '#22c55e', fontFamily: Fonts.light }]}>Budget</Text>
                </TouchableOpacity>
              </GlassCard>
            </GlassCard>
          </View>
        )}

        {/* Loading State */}
        {isGenerating && (
          <View>
            <View style={styles.loadingHeader}>
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Generating your personalized meal plan...</Text>
            </View>
            <LoadingState count={4} />
          </View>
        )}

        {/* Error State */}
        {error && !isGenerating && (
          <View>
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
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={handleGenerate}
                accessibilityLabel="Try again"
                accessibilityRole="button"
                accessibilityHint="Retries meal plan generation after the previous attempt failed"
              >
                <Text style={[styles.retryButtonText, { color: colors.primaryText }]}>Try Again</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        {/* Meal Plan Content - show when plan exists */}
        {weeklyPlan && !isGenerating && (
          <View>
            {/* Cheat Day Guidance - Show instead of meals on cheat days */}
            {isCheatDay ? (
              <CheatDayGuidanceCard
                dayName={currentDayName}
                userGoals={{
                  dailyCalories: dailyTargets.calories,
                }}
              />
            ) : (
              <>
                {/* Meals List - Only show on non-cheat days */}
                <View style={styles.mealsContainer}>
                  {currentDayMeals.length > 0 ? (
                    <>
                      {/* Breakfast */}
                      {mealsByType.breakfast.map((meal, index) => (
                        <MealCard
                          key={`breakfast-${index}`}
                          meal={meal}
                          index={index}
                          dayIndex={selectedDayIndex}
                          mealIndex={currentDayMeals.indexOf(meal)}
                          onSwap={() => handleSwapMeal('breakfast')}
                          isSwapping={isSwapping}
                          onAddToTodaysMeals={handleAddToTodaysMeals}
                          onAddIngredientsToInstacart={handleAddIngredientsToInstacart}
                          onSaveToSavedMeals={handleSaveToSavedMeals}
                        />
                      ))}

                      {/* Lunch */}
                      {mealsByType.lunch.map((meal, index) => (
                        <MealCard
                          key={`lunch-${index}`}
                          meal={meal}
                          index={mealsByType.breakfast.length + index}
                          dayIndex={selectedDayIndex}
                          mealIndex={currentDayMeals.indexOf(meal)}
                          onSwap={() => handleSwapMeal('lunch')}
                          isSwapping={isSwapping}
                          onAddToTodaysMeals={handleAddToTodaysMeals}
                          onAddIngredientsToInstacart={handleAddIngredientsToInstacart}
                          onSaveToSavedMeals={handleSaveToSavedMeals}
                        />
                      ))}

                      {/* Dinner */}
                      {mealsByType.dinner.map((meal, index) => (
                        <MealCard
                          key={`dinner-${index}`}
                          meal={meal}
                          index={mealsByType.breakfast.length + mealsByType.lunch.length + index}
                          dayIndex={selectedDayIndex}
                          mealIndex={currentDayMeals.indexOf(meal)}
                          onSwap={() => handleSwapMeal('dinner')}
                          isSwapping={isSwapping}
                          onAddToTodaysMeals={handleAddToTodaysMeals}
                          onAddIngredientsToInstacart={handleAddIngredientsToInstacart}
                          onSaveToSavedMeals={handleSaveToSavedMeals}
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
                          dayIndex={selectedDayIndex}
                          mealIndex={currentDayMeals.indexOf(meal)}
                          onSwap={() => handleSwapMeal('snack')}
                          isSwapping={isSwapping}
                          onAddToTodaysMeals={handleAddToTodaysMeals}
                          onAddIngredientsToInstacart={handleAddIngredientsToInstacart}
                          onSaveToSavedMeals={handleSaveToSavedMeals}
                        />
                      ))}
                    </>
                  ) : (
                    <View style={styles.emptyDayState}>
                      <Text style={[styles.emptyDayText, { color: colors.textMuted }]}>No meals planned for this day</Text>
                    </View>
                  )}
                </View>

                {/* Regenerate section removed - Quick button removed */}
              </>
            )}
          </View>
        )}

        {/* Action Buttons - Only show on non-cheat days */}
        {weeklyPlan && !isCheatDay && (
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
                accessibilityLabel="Order groceries"
                accessibilityRole="button"
                accessibilityHint="Opens grocery list to view all ingredients and order through Instacart"
              >
                <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                  <ShoppingCart size={18} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} />
                </View>
                <Text style={[styles.actionText, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)', fontFamily: Fonts.light }]}>Order Groceries</Text>
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
                accessibilityLabel="AI coach"
                accessibilityRole="button"
                accessibilityHint="Opens AI coaching to get personalized guidance on your meal plan and nutrition goals"
              >
                <View style={[styles.actionIconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                  <Sparkles size={20} color={colors.textMuted} strokeWidth={1.5} />
                </View>
                <Text style={[styles.actionText, { color: colors.textSecondary }]}>AI Coach</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* Grocery List Modal */}
      <GroceryListModal
        visible={showGroceryModal}
        onClose={() => setShowGroceryModal(false)}
        groceryList={groceryList}
        onToggleItem={toggleGroceryItem}
        onDeleteItem={deleteGroceryItem}
        onOrderInstacart={handleOrderInstacart}
        isLoading={isGeneratingGroceryList}
        onGenerateList={weeklyPlan ? generateGroceryListOnDemand : undefined}
        batchProgress={groceryListProgress}
      />

      {/* AI Coach Chat Modal with LiveAvatar */}
      <CoachChatModal
        visible={showCoachingModal}
        onClose={() => setShowCoachingModal(false)}
        mode="meal"
        context={{
          userGoals: {
            fitnessGoal: 'nutrition',
            activityLevel: 'active',
            dailyCalories: dailyTargets.calories,
            dailyProtein: dailyTargets.protein,
          },
          recentMeals: currentDayMeals.map(m => ({
            name: m.name,
            calories: m.calories,
            protein: m.protein,
            mealType: m.mealType,
          })),
        }}
      />

      {/* Food Preferences Modal */}
      <FoodPreferencesModal
        visible={showFoodPrefsModal}
        onClose={() => setShowFoodPrefsModal(false)}
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
  halfButtonGlass: {
    flex: 1,
    borderRadius: Spacing.borderRadius,
  },
  fullButtonGlass: {
    borderRadius: Spacing.borderRadius,
    marginHorizontal: 16,
  },
  halfButtonInner: {
    paddingVertical: 14,
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
    fontFamily: Fonts.medium,
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
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 8,
  },
  savingsText: {
    flex: 1,
    fontSize: 13,
  },
});
