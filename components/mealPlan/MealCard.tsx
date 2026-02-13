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
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { X, Clock, UtensilsCrossed, PlusCircle, Bookmark, ShoppingCart, ArrowLeftRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import { Meal } from '../../types/mealPlan';
import { aiService } from '../../services/aiService';
import { pexelsService } from '../../services/pexelsService';

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
  const [mealImageUrl, setMealImageUrl] = useState<string>('');
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageReady, setImageReady] = useState(false);
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

  // Merge fetched recipe details into meal so action handlers pass complete data
  const completeMeal = useMemo(() => ({
    ...meal,
    ingredients: displayIngredients,
    instructions: displayInstructions,
  }), [meal, displayIngredients, displayInstructions]);

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

  // Use persisted imageUrl if available, otherwise fetch from backend
  useEffect(() => {
    setImageReady(false);
    setImageError(false);

    if (meal.imageUrl) {
      setMealImageUrl(meal.imageUrl);
      setIsLoadingImage(false);
      return;
    }

    setIsLoadingImage(true);
    const fetchMealImage = async () => {
      try {
        const imageUrl = await pexelsService.searchFoodPhoto(meal.name, 'card');
        setMealImageUrl(imageUrl);
        if (!imageUrl) {
          setImageError(true);
          setImageReady(true); // No image to wait for, show card with placeholder
        }
      } catch (error) {
        console.error('[MealCard] Error loading meal image:', error);
        setImageError(true);
        setImageReady(true); // Show card with placeholder on error
      } finally {
        setIsLoadingImage(false);
      }
    };

    fetchMealImage();
  }, [meal.name, meal.imageUrl]);

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
        await onAddToTodaysMeals(completeMeal);
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
        await onAddIngredientsToInstacart(completeMeal);
      } finally {
        setIsAddingToInstacart(false);
      }
    }
  };

  const handleSaveToSavedMeals = async () => {
    if (onSaveToSavedMeals) {
      setIsSavingMeal(true);
      try {
        await onSaveToSavedMeals(completeMeal);
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

  // Card is ready to show when image has loaded (or errored/no image)
  const cardVisible = imageReady || imageError;

  return (
    <>
      <View style={styles.cardContainer}>
        {/* Preload image offscreen so onLoad fires before we render the card */}
        {!imageReady && !imageError && mealImageUrl && !isLoadingImage ? (
          <Image
            source={{ uri: mealImageUrl }}
            style={{ width: 0, height: 0, position: 'absolute', opacity: 0 }}
            onLoad={() => setImageReady(true)}
            onError={() => { setImageError(true); setImageReady(true); }}
          />
        ) : null}

        {!cardVisible ? (
          // Skeleton placeholder while image loads
          <GlassCard
            style={styles.card}
            intensity={80}
            tintColor={isDark ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
          >
            <View style={[styles.mealImage, { backgroundColor: colors.cardBackground, justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
            <View style={[styles.cardContent, { alignItems: 'center', paddingVertical: 24 }]}>
              <Text style={[styles.mealTypeLabel, { color: colors.textMuted }]}>Preparing {getMealTypeLabel(meal.mealType)}...</Text>
            </View>
          </GlassCard>
        ) : (
        <Animated.View style={[styles.animatedWrapper, cardAnimatedStyle]}>
          <GlassCard
            style={styles.card}
            intensity={80}
            tintColor={isDark ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
            interactive
          >
            {/* Meal Photo */}
            {imageError || !mealImageUrl ? (
              <View style={[styles.mealImage, styles.imagePlaceholder, { backgroundColor: isDark ? 'rgba(40, 40, 50, 0.9)' : 'rgba(230, 230, 240, 0.9)' }]}>
                <UtensilsCrossed size={32} color={colors.textMuted} strokeWidth={1} />
                <Text style={[styles.placeholderText, { color: colors.textMuted }]}>{getMealTypeLabel(meal.mealType)}</Text>
              </View>
            ) : (
              <Image
                source={{ uri: mealImageUrl }}
                style={styles.mealImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            )}

            {/* Card Content Container */}
            <View style={styles.cardContent}>
              {/* Meal type header */}
              <View style={styles.mealTypeRow}>
                <Text style={[styles.mealTypeLabel, { color: colors.textMuted }]}>{getMealTypeLabel(meal.mealType)}</Text>
                <TouchableOpacity
                  onPress={handleViewRecipe}
                  activeOpacity={0.6}
                  accessibilityLabel={`View recipe for ${meal.name}`}
                  accessibilityRole="button"
                  accessibilityHint="Opens detailed recipe with ingredients and instructions"
                  style={[
                    styles.recipeButtonContainer,
                    {
                      backgroundColor: `${colors.accentCyan}25`,
                    }
                  ]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.recipeButton, { color: colors.accentCyan }]}>View Recipe</Text>
                </TouchableOpacity>
              </View>

              {/* Meal name */}
              <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>

              {/* Description */}
              <Text style={[styles.mealDescription, { color: colors.textMuted }]}>
                {displayDescription}
              </Text>

              {/* Time info */}
              <View style={styles.timeRow}>
                <View style={[
                  styles.timeBadge,
                  { backgroundColor: `${colors.successMuted}25` }
                ]}>
                  <Text style={[styles.timeBadgeText, { color: colors.successMuted }]}>Prep: {meal.prepTime}m</Text>
                </View>
                <View style={[
                  styles.timeBadge,
                  { backgroundColor: `${colors.warningOrange}25` }
                ]}>
                  <Text style={[styles.timeBadgeText, { color: colors.warningOrange }]}>Cook: {meal.cookTime}m</Text>
                </View>
                <View style={[
                  styles.timeBadge,
                  { backgroundColor: `${colors.accentPurple}25` }
                ]}>
                  <Text style={[styles.timeBadgeText, { color: colors.accentPurple }]}>{meal.servings} serving{meal.servings > 1 ? 's' : ''}</Text>
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
            </View>
        </GlassCard>
        </Animated.View>
        )}
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
                <X size={24} color={colors.text} strokeWidth={1.5} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Meal Photo - Large */}
              {imageError || !mealImageUrl ? (
                <View style={[styles.modalMealImage, styles.imagePlaceholder, { backgroundColor: isDark ? 'rgba(40, 40, 50, 0.9)' : 'rgba(230, 230, 240, 0.9)' }]}>
                  <UtensilsCrossed size={48} color={colors.textMuted} strokeWidth={1} />
                  <Text style={[styles.placeholderText, { color: colors.textMuted, fontSize: 16 }]}>{meal.name}</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: mealImageUrl }}
                  style={styles.modalMealImage}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              )}

              {/* Meal Title */}
              <Text style={[styles.modalTitle, { color: colors.text }]}>{meal.name}</Text>
              <Text style={[styles.modalDescription, { color: colors.textMuted }]}>{displayDescription}</Text>

              {/* Quick Info Row */}
              <View style={styles.quickInfoRow}>
                <View style={[styles.modalPill, { backgroundColor: `${colors.successMuted}25` }]}>
                  <Clock size={14} color={colors.successMuted} strokeWidth={1.5} />
                  <Text style={[styles.modalPillText, { color: colors.successMuted }]}>Prep: {meal.prepTime}m</Text>
                </View>
                <View style={[styles.modalPill, { backgroundColor: `${colors.warningOrange}25` }]}>
                  <Clock size={14} color={colors.warningOrange} strokeWidth={1.5} />
                  <Text style={[styles.modalPillText, { color: colors.warningOrange }]}>Cook: {meal.cookTime}m</Text>
                </View>
                <View style={[styles.modalPill, { backgroundColor: `${colors.accentPurple}25` }]}>
                  <UtensilsCrossed size={14} color={colors.accentPurple} strokeWidth={1.5} />
                  <Text style={[styles.modalPillText, { color: colors.accentPurple }]}>{meal.servings} serving{meal.servings > 1 ? 's' : ''}</Text>
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
                  <View>
                    <Text style={[styles.emptyRecipeText, { color: colors.textSecondary }]}>
                      Recipe details not available yet.
                    </Text>
                    <TouchableOpacity
                      style={[styles.generateRecipeButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                      onPress={handleGenerateAIRecipe}
                      disabled={isGeneratingAIRecipe}
                    >
                      <Text style={[styles.generateRecipeText, { color: colors.primary }]}>
                        {isGeneratingAIRecipe ? 'Generating Recipe...' : 'Generate Recipe with AI'}
                      </Text>
                    </TouchableOpacity>
                  </View>
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

              <View style={styles.actionPillRow}>
                {/* Add to Today's Meals */}
                <TouchableOpacity
                  style={[styles.actionPill, { backgroundColor: `${colors.accentCyan}25` }]}
                  onPress={handleAddToTodaysMeals}
                  disabled={isAddingToMeals}
                  activeOpacity={0.7}
                  accessibilityLabel={`Add ${meal.name} to today's meals`}
                  accessibilityRole="button"
                >
                  <PlusCircle size={14} color={colors.accentCyan} strokeWidth={1.5} />
                  <Text style={[styles.actionPillText, { color: colors.accentCyan }]}>
                    {isAddingToMeals ? 'Adding...' : "Today's Meals"}
                  </Text>
                </TouchableOpacity>

                {/* Save Meal */}
                {onSaveToSavedMeals && (
                  <TouchableOpacity
                    style={[styles.actionPill, { backgroundColor: `${colors.successMuted}25` }]}
                    onPress={handleSaveToSavedMeals}
                    disabled={isSavingMeal}
                    activeOpacity={0.7}
                    accessibilityLabel={`Save ${meal.name} to favorites`}
                    accessibilityRole="button"
                  >
                    <Bookmark size={14} color={colors.successMuted} strokeWidth={1.5} />
                    <Text style={[styles.actionPillText, { color: colors.successMuted }]}>
                      {isSavingMeal ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Add to Instacart */}
                <TouchableOpacity
                  style={[styles.actionPill, { backgroundColor: `${colors.warningOrange}25` }]}
                  onPress={handleAddToInstacart}
                  disabled={isAddingToInstacart}
                  activeOpacity={0.7}
                  accessibilityLabel={`Add ${meal.name} ingredients to Instacart`}
                  accessibilityRole="button"
                >
                  <ShoppingCart size={14} color={colors.warningOrange} strokeWidth={1.5} />
                  <Text style={[styles.actionPillText, { color: colors.warningOrange }]}>
                    {isAddingToInstacart ? 'Adding...' : 'Instacart'}
                  </Text>
                </TouchableOpacity>

                {/* Swap Meal */}
                {onSwap && (
                  <TouchableOpacity
                    style={[styles.actionPill, { backgroundColor: `${colors.accentPurple}25` }]}
                    onPress={handleSwap}
                    disabled={isSwapping}
                    activeOpacity={0.7}
                    accessibilityLabel={`Swap ${meal.name} for different meal`}
                    accessibilityRole="button"
                  >
                    <ArrowLeftRight size={14} color={colors.accentPurple} strokeWidth={1.5} />
                    <Text style={[styles.actionPillText, { color: colors.accentPurple }]}>
                      {isSwapping ? 'Swapping...' : 'Swap'}
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
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 13,
    fontFamily: Fonts.thin,
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recipeButton: {
    fontSize: 12,
    fontFamily: Fonts.light,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.light,
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
    borderRadius: 4,
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
    borderRadius: 16,
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
  modalMealImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  modalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalPillText: {
    fontSize: 13,
    fontFamily: Fonts.light,
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
    borderRadius: 12,
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
    marginBottom: 16,
  },
  generateRecipeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateRecipeText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    letterSpacing: 0.3,
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
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    paddingTop: 12,
    paddingBottom: 16,
  },
  actionPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionPillText: {
    fontSize: 13,
    fontFamily: Fonts.light,
  },
});

export default MealCard;
