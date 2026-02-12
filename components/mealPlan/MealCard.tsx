import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import { Meal } from '../../types/mealPlan';
import { aiService } from '../../services/aiService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MealCardProps {
  meal: Meal;
  index: number;
  onSwap?: () => void;
  isSwapping?: boolean;
  onAddToTodaysMeals?: (meal: Meal) => void;
  onAddIngredientsToInstacart?: (meal: Meal) => void;
  onSaveToSavedMeals?: (meal: Meal) => void;
}

export function MealCard({ meal, index, onSwap, isSwapping, onAddToTodaysMeals, onAddIngredientsToInstacart, onSaveToSavedMeals }: MealCardProps) {
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [isAddingToMeals, setIsAddingToMeals] = useState(false);
  const [isAddingToInstacart, setIsAddingToInstacart] = useState(false);
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [isGeneratingAIRecipe, setIsGeneratingAIRecipe] = useState(false);
  const [recipeDetails, setRecipeDetails] = useState<{
    ingredients: Array<{ name: string; quantity: number; unit: string }>;
    instructions: string[];
    prepMinutes?: number;
    cookMinutes?: number;
    tips?: string;
  } | null>(null);
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Flip animation for view recipe (entrance animations removed)
  const flipRotateY = useSharedValue(0);
  const isFlipping = useSharedValue(false);

  // Ref to track if we've already fetched recipe for this meal
  const hasFetchedRef = useRef(false);
  const fetchingRef = useRef(false);

  // Reset fetch tracking when meal changes
  useEffect(() => {
    hasFetchedRef.current = false;
    setRecipeDetails(null);
  }, [meal.name]);

  // Fetch recipe details when modal opens and no ingredients exist
  useEffect(() => {
    const hasIngredients = Array.isArray(meal.ingredients) && meal.ingredients.length > 0;
    const needsRecipe = !hasIngredients;
    const shouldFetch = showRecipeModal && needsRecipe && !hasFetchedRef.current && !fetchingRef.current;

    if (shouldFetch) {
      fetchingRef.current = true;
      setIsLoadingRecipe(true);

      const fetchRecipe = async () => {
        try {
          console.log('[MealCard] Fetching recipe details for:', meal.name);
          const details = await aiService.getRecipeDetails(
            meal.name,
            meal.mealType,
            meal.calories,
            { protein: meal.protein, carbs: meal.carbs, fat: meal.fat }
          );
          console.log('[MealCard] Recipe details response:', details);
          if (details) {
            console.log('[MealCard] Recipe details fetched:', details.ingredients?.length, 'ingredients');
            setRecipeDetails(details);
            hasFetchedRef.current = true;
          } else {
            console.log('[MealCard] No recipe details returned from API');
          }
        } catch (error) {
          console.error('[MealCard] Error fetching recipe details:', error);
        } finally {
          setIsLoadingRecipe(false);
          fetchingRef.current = false;
        }
      };
      fetchRecipe();
    }
  }, [showRecipeModal, meal.name, meal.mealType, meal.calories, meal.protein, meal.carbs, meal.fat, meal.ingredients]);

  // Use fetched recipe details if meal doesn't have them
  // Ensure we always have arrays to prevent .map() errors
  const displayIngredients = Array.isArray(meal.ingredients) && meal.ingredients.length > 0
    ? meal.ingredients
    : Array.isArray(recipeDetails?.ingredients) ? recipeDetails.ingredients : [];
  const displayInstructions = Array.isArray(meal.instructions) && meal.instructions.length > 0
    ? meal.instructions
    : Array.isArray(recipeDetails?.instructions) ? recipeDetails.instructions : [];

  // Generate an appetizing fallback description if none exists
  const displayDescription = useMemo(() => {
    if (meal.description && meal.description.trim().length > 0) {
      return meal.description;
    }

    // Create vivid, dynamic fallback based on meal data
    const mealName = meal.name.toLowerCase();
    const proteinAmount = meal.protein;
    const calorieAmount = Math.round(meal.calories);

    // Detect protein type for more specific descriptions
    let proteinDescriptor = 'protein-rich';
    if (mealName.includes('chicken')) proteinDescriptor = 'tender grilled chicken';
    else if (mealName.includes('salmon') || mealName.includes('fish')) proteinDescriptor = 'flaky, omega-rich fish';
    else if (mealName.includes('turkey')) proteinDescriptor = 'lean turkey';
    else if (mealName.includes('beef') || mealName.includes('steak')) proteinDescriptor = 'savory beef';
    else if (mealName.includes('egg')) proteinDescriptor = 'protein-packed eggs';
    else if (mealName.includes('tofu') || mealName.includes('tempeh')) proteinDescriptor = 'plant-based protein';
    else if (mealName.includes('shrimp')) proteinDescriptor = 'succulent shrimp';
    else if (mealName.includes('yogurt')) proteinDescriptor = 'creamy Greek yogurt';

    // Meal type specific descriptors
    if (meal.mealType === 'breakfast') {
      return `Energizing ${meal.mealType} featuring ${proteinDescriptor} with ${proteinAmount}g of protein to fuel your morning and keep you satisfied`;
    } else if (meal.mealType === 'lunch') {
      return `Wholesome ${meal.mealType} centered around ${proteinDescriptor}, delivering ${proteinAmount}g of protein and ${calorieAmount} perfectly balanced calories`;
    } else if (meal.mealType === 'dinner') {
      return `Satisfying ${meal.mealType} showcasing ${proteinDescriptor} with ${proteinAmount}g of muscle-building protein to support your fitness goals`;
    } else if (meal.mealType === 'snack') {
      return `Smart ${calorieAmount}-calorie snack with ${proteinAmount}g of protein to keep you fueled between meals`;
    }

    // Generic fallback
    return `Nutritious ${meal.mealType} with ${proteinAmount}g protein and ${calorieAmount} calories, perfectly balanced for your goals`;
  }, [meal.description, meal.name, meal.mealType, meal.protein, meal.calories]);

  const handleViewRecipe = () => {
    console.log('[MealCard] View Recipe pressed for:', meal.name);
    isFlipping.value = true;
    // Flip card to 90 degrees (edge-on) with spring physics
    flipRotateY.value = withSpring(90, { damping: 15, stiffness: 100 });
    // Show modal when flip reaches halfway
    setTimeout(() => {
      setShowRecipeModal(true);
      // Continue flip to 180 for full rotation effect
      flipRotateY.value = withSpring(180, { damping: 15, stiffness: 100 });
    }, 300);
  };

  const handleCloseModal = () => {
    console.log('[MealCard] Closing modal');
    setShowRecipeModal(false);
    // Flip back with spring physics
    flipRotateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    setTimeout(() => {
      isFlipping.value = false;
    }, 400);
  };

  // Animated style for flip animation only (no entrance animation)
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${flipRotateY.value}deg` },
      ],
    } as any;
  });

  const getMealTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleSwap = () => {
    if (onSwap) {
      onSwap();
      handleCloseModal();
    }
  };

  const handleAddToTodaysMeals = async () => {
    if (onAddToTodaysMeals) {
      setIsAddingToMeals(true);
      try {
        await onAddToTodaysMeals(meal);
        handleCloseModal();
      } finally {
        setIsAddingToMeals(false);
      }
    }
  };

  const handleAddToInstacart = async () => {
    if (onAddIngredientsToInstacart) {
      setIsAddingToInstacart(true);
      try {
        await onAddIngredientsToInstacart(meal);
      } finally {
        setIsAddingToInstacart(false);
      }
    }
  };

  const handleSaveToSavedMeals = async () => {
    if (onSaveToSavedMeals) {
      setIsSavingMeal(true);
      try {
        await onSaveToSavedMeals(meal);
        handleCloseModal();
      } finally {
        setIsSavingMeal(false);
      }
    }
  };

  const handleGenerateAIRecipe = async () => {
    setIsGeneratingAIRecipe(true);
    try {
      console.log('[MealCard] Generating AI recipe for:', meal.name);
      const details = await aiService.getRecipeDetails(
        meal.name,
        meal.mealType,
        meal.calories,
        { protein: meal.protein, carbs: meal.carbs, fat: meal.fat }
      );
      if (details) {
        console.log('[MealCard] AI recipe generated:', details.ingredients?.length, 'ingredients');
        setRecipeDetails(details);
        hasFetchedRef.current = true;
      } else {
        console.log('[MealCard] No recipe details returned from AI');
      }
    } catch (error) {
      console.error('[MealCard] Error generating AI recipe:', error);
    } finally {
      setIsGeneratingAIRecipe(false);
    }
  };

  return (
    <>
      <View style={styles.cardContainer}>
        <Animated.View style={[styles.animatedWrapper, cardAnimatedStyle]}>
          <GlassCard
            style={styles.card}
            intensity={80}
            tintColor={isDark ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
            interactive
          >
            {/* Meal type header */}
            <View style={styles.mealTypeRow}>
              <Text style={[styles.mealTypeLabel, { color: colors.textMuted }]}>{getMealTypeLabel(meal.mealType)}</Text>
              <TouchableOpacity
                onPress={handleViewRecipe}
                activeOpacity={0.6}
                style={[
                  styles.recipeButtonContainer,
                  { backgroundColor: colors.cardBackground }
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.recipeButton, { color: colors.textMuted }]}>View Recipe</Text>
              </TouchableOpacity>
            </View>

            {/* Meal name */}
            <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>

            {/* Description */}
            <Text style={[styles.mealDescription, { color: colors.textMuted }]} numberOfLines={2}>
              {displayDescription}
            </Text>

            {/* Time info */}
            <View style={styles.timeRow}>
              <View style={[
                styles.timeBadge,
                {
                  backgroundColor: colors.cardBackground,
                }
              ]}>
                <Text style={[styles.timeBadgeText, { color: colors.textMuted }]}>Prep: {meal.prepTime}m</Text>
              </View>
              <View style={[
                styles.timeBadge,
                {
                  backgroundColor: colors.cardBackground,
                }
              ]}>
                <Text style={[styles.timeBadgeText, { color: colors.textMuted }]}>Cook: {meal.cookTime}m</Text>
              </View>
              <View style={[
                styles.timeBadge,
                {
                  backgroundColor: colors.cardBackground,
                }
              ]}>
                <Text style={[styles.timeBadgeText, { color: colors.textMuted }]}>{meal.servings} serving{meal.servings > 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* Macros row */}
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.calories }]} />
                <NumberText weight="light" style={[styles.macroValue, { color: colors.text }]}>{Math.round(meal.calories)}</NumberText>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>cal</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.protein }]} />
                <NumberText weight="light" style={[styles.macroValue, { color: colors.text }]}>{meal.protein}g</NumberText>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>protein</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.carbs }]} />
                <NumberText weight="light" style={[styles.macroValue, { color: colors.text }]}>{meal.carbs}g</NumberText>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.fat }]} />
                <NumberText weight="light" style={[styles.macroValue, { color: colors.text }]}>{meal.fat}g</NumberText>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>fat</Text>
              </View>
            </View>
        </GlassCard>
        </Animated.View>
      </View>

      {/* Recipe Modal */}
      <Modal
        visible={showRecipeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Modal Background */}
            <BlurView
              intensity={isDark ? 80 : 90}
              tint={isDark ? "dark" : "light"}
              style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(8, 8, 8, 0.40)' : 'rgba(250, 250, 250, 0.40)' }]}
            />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={[styles.modalMealType, { color: colors.textMuted }]}>
                  {getMealTypeLabel(meal.mealType)}
                </Text>
              </View>
              <Pressable
                onPress={handleCloseModal}
                style={[styles.closeButton, { backgroundColor: colors.cardBackground }]}
                hitSlop={12}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Meal Title */}
              <Text style={[styles.modalTitle, { color: colors.text }]}>{meal.name}</Text>
              <Text style={[styles.modalDescription, { color: colors.textMuted }]}>{displayDescription}</Text>

              {/* Quick Info Row */}
              <View style={styles.quickInfoRow}>
                <View style={styles.quickInfoItem}>
                  <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                  <Text style={[styles.quickInfoText, { color: colors.textMuted }]}>{meal.prepTime + meal.cookTime} min total</Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <Ionicons name="restaurant-outline" size={18} color={colors.textMuted} />
                  <Text style={[styles.quickInfoText, { color: colors.textMuted }]}>{meal.servings} serving{meal.servings > 1 ? 's' : ''}</Text>
                </View>
              </View>

              {/* Ingredients Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Ingredients</Text>
                {isLoadingRecipe ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                      Loading recipe details...
                    </Text>
                  </View>
                ) : displayIngredients.length > 0 ? (
                  <View style={styles.ingredientsList}>
                    {displayIngredients.map((ingredient: any, idx: number) => (
                      <View key={idx} style={styles.ingredientRow}>
                        <View style={[styles.ingredientCheck, { borderColor: colors.border }]}>
                          <View style={styles.ingredientCheckInner} />
                        </View>
                        <Text style={[styles.ingredientText, { color: colors.text }]}>
                          <Text style={[styles.ingredientAmount, { color: colors.textMuted }]}>{ingredient.amount || ingredient.quantity} {ingredient.unit}</Text>
                          {'  '}{ingredient.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.emptyRecipeText, { color: colors.textSecondary }]}>
                    Recipe details not available. Search online for "{meal.name}" recipe.
                  </Text>
                )}
              </View>

              {/* Instructions Section */}
              {(displayInstructions.length > 0 || isLoadingRecipe) && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Instructions</Text>
                  {isLoadingRecipe ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : (
                    <View style={styles.instructionsList}>
                      {displayInstructions.map((instruction: string, idx: number) => (
                        <View key={idx} style={styles.instructionRow}>
                          <View style={[styles.instructionNumberBadge, { backgroundColor: colors.cardBackground }]}>
                            <NumberText weight="light" style={[styles.instructionNumber, { color: colors.textMuted }]}>{idx + 1}</NumberText>
                          </View>
                          <Text style={[styles.instructionText, { color: colors.text }]}>{instruction}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.modalFooter}>
              <BlurView
                intensity={isDark ? 60 : 80}
                tint={isDark ? "dark" : "light"}
                style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(8, 8, 8, 0.40)' : 'rgba(250, 250, 250, 0.40)' }]}
              />

              {/* Add to Today's Meals Button */}
              <TouchableOpacity
                style={[
                  styles.primaryActionButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleAddToTodaysMeals}
                disabled={isAddingToMeals}
                activeOpacity={0.7}
              >
                <View style={[styles.actionButtonIcon, { backgroundColor: colors.primaryAccent }]}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.primaryText} />
                </View>
                <Text style={[styles.primaryActionText, { color: colors.primaryText }]}>
                  {isAddingToMeals ? 'Adding...' : "Add to Today's Meals"}
                </Text>
              </TouchableOpacity>

              {/* Secondary Actions Row */}
              <View style={styles.secondaryActionsRow}>
                {/* Save to Saved Meals Button */}
                {onSaveToSavedMeals && (
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionButton,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      }
                    ]}
                    onPress={handleSaveToSavedMeals}
                    disabled={isSavingMeal}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="bookmark-outline" size={18} color={colors.text} />
                    <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                      {isSavingMeal ? 'Saving...' : 'Save to Saved Meals'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* AI Generate Recipe Button */}
                <TouchableOpacity
                  style={[
                    styles.secondaryActionButton,
                    {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                      borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                    }
                  ]}
                  onPress={handleGenerateAIRecipe}
                  disabled={isGeneratingAIRecipe || isLoadingRecipe}
                  activeOpacity={0.7}
                >
                  <Ionicons name="sparkles" size={18} color={isDark ? '#a5b4fc' : '#6366f1'} />
                  <Text style={[styles.secondaryActionText, { color: isDark ? '#a5b4fc' : '#6366f1' }]}>
                    {isGeneratingAIRecipe ? 'Generating...' : 'AI Generate Recipe'}
                  </Text>
                </TouchableOpacity>

                {/* Add to Instacart Button */}
                <TouchableOpacity
                  style={[
                    styles.secondaryActionButton,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={handleAddToInstacart}
                  disabled={isAddingToInstacart}
                  activeOpacity={0.7}
                >
                  <Ionicons name="cart-outline" size={18} color={colors.text} />
                  <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                    {isAddingToInstacart ? 'Adding...' : 'Ingredients to Instacart'}
                  </Text>
                </TouchableOpacity>

                {/* Swap Meal Button */}
                {onSwap && (
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionButton,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      }
                    ]}
                    onPress={handleSwap}
                    disabled={isSwapping}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="swap-horizontal" size={18} color={colors.text} />
                    <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                      {isSwapping ? 'Swapping...' : 'Swap Meal'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
  },
  animatedWrapper: {
    // No longer using absolute positioning - allows dynamic height
  },
  card: {
    borderRadius: 20,
  },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.thin,
    flex: 1,
    letterSpacing: 0.5,
  },
  recipeButtonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recipeButton: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Fonts.regular,
  },
  mealName: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.light, // Weight 300
    fontWeight: '300',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  mealDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: Fonts.thin,
    lineHeight: 18,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timeBadgeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: Fonts.thin,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroValue: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.thin,
    letterSpacing: 0.5,
  },
  macroLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: Fonts.thin,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalMealType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Fonts.thin,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  modalTitle: {
    fontSize: 32,
    color: Colors.text,
    fontFamily: Fonts.extraLight, // Weight 200
    fontWeight: '200',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modalDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Fonts.thin,
    lineHeight: 22,
    marginBottom: 20,
  },
  quickInfoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: Fonts.thin,
  },
  nutritionCard: {
    marginBottom: 32,
    borderRadius: 16,
  },
  nutritionTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: Fonts.thin,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    gap: 4,
  },
  nutritionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 22,
    color: Colors.text,
    fontFamily: Fonts.thin,
    letterSpacing: 0.5,
  },
  nutritionLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: Fonts.thin,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: Fonts.thin,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ingredientCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  ingredientCheckInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Fonts.thin,
    lineHeight: 22,
  },
  ingredientAmount: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: Fonts.thin,
  },
  emptyRecipeText: {
    fontSize: 14,
    fontFamily: Fonts.thin,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.thin,
  },
  instructionsList: {
    gap: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  instructionNumber: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Fonts.thin,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Fonts.thin,
    lineHeight: 22,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 10,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionButtonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.85)',
    fontFamily: Fonts.medium,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  secondaryActionText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Fonts.thin,
  },
});

export default MealCard;
