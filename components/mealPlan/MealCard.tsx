import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';
import { Meal } from '../../types/mealPlan';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MealCardProps {
  meal: Meal;
  index: number;
  onSwap?: () => void;
  isSwapping?: boolean;
  onAddToTodaysMeals?: (meal: Meal) => void;
  onAddIngredientsToInstacart?: (meal: Meal) => void;
}

export function MealCard({ meal, index, onSwap, isSwapping, onAddToTodaysMeals, onAddIngredientsToInstacart }: MealCardProps) {
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [isAddingToMeals, setIsAddingToMeals] = useState(false);
  const [isAddingToInstacart, setIsAddingToInstacart] = useState(false);
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

  const handleViewRecipe = () => {
    console.log('[MealCard] View Recipe pressed for:', meal.name);
    isFlipping.value = true;
    // Flip card to 90 degrees (edge-on), then show modal
    flipRotateY.value = withTiming(90, { duration: 300, easing: Easing.inOut(Easing.cubic) });
    // Show modal when flip reaches halfway
    setTimeout(() => {
      setShowRecipeModal(true);
      // Continue flip to 180 for full rotation effect
      flipRotateY.value = withTiming(180, { duration: 300, easing: Easing.out(Easing.cubic) });
    }, 300);
  };

  const handleCloseModal = () => {
    console.log('[MealCard] Closing modal');
    setShowRecipeModal(false);
    // Flip back
    flipRotateY.value = withTiming(0, { duration: 400, easing: Easing.inOut(Easing.cubic) });
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
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.recipeButton, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }]}>View Recipe</Text>
              </TouchableOpacity>
            </View>

            {/* Meal name */}
            <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>

            {/* Description */}
            <Text style={[styles.mealDescription, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]} numberOfLines={2}>
              {meal.description}
            </Text>

            {/* Time info */}
            <View style={styles.timeRow}>
              <View style={[
                styles.timeBadge,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)',
                }
              ]}>
                <Text style={[styles.timeBadgeText, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>Prep: {meal.prepTime}m</Text>
              </View>
              <View style={[
                styles.timeBadge,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)',
                }
              ]}>
                <Text style={[styles.timeBadgeText, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>Cook: {meal.cookTime}m</Text>
              </View>
              <View style={[
                styles.timeBadge,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)',
                }
              ]}>
                <Text style={[styles.timeBadgeText, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>{meal.servings} serving{meal.servings > 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* Macros row */}
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.calories }]} />
                <Text style={[styles.macroValue, { color: colors.text }]}>{meal.calories}</Text>
                <Text style={[styles.macroLabel, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>cal</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.protein }]} />
                <Text style={[styles.macroValue, { color: colors.text }]}>{meal.protein}g</Text>
                <Text style={[styles.macroLabel, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>protein</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.carbs }]} />
                <Text style={[styles.macroValue, { color: colors.text }]}>{meal.carbs}g</Text>
                <Text style={[styles.macroLabel, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: colors.fat }]} />
                <Text style={[styles.macroValue, { color: colors.text }]}>{meal.fat}g</Text>
                <Text style={[styles.macroLabel, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>fat</Text>
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
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)' }]}>
          <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Modal Background */}
            <BlurView
              intensity={isDark ? 80 : 90}
              tint={isDark ? "dark" : "light"}
              style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(8, 8, 8, 0.95)' : 'rgba(250, 250, 250, 0.95)' }]}
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
                style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' }]}
                hitSlop={12}
              >
                <Ionicons name="close" size={24} color={isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)'} />
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
              <Text style={[styles.modalDescription, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }]}>{meal.description}</Text>

              {/* Quick Info Row */}
              <View style={styles.quickInfoRow}>
                <View style={styles.quickInfoItem}>
                  <Ionicons name="time-outline" size={18} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
                  <Text style={[styles.quickInfoText, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>{meal.prepTime + meal.cookTime} min total</Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <Ionicons name="restaurant-outline" size={18} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
                  <Text style={[styles.quickInfoText, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>{meal.servings} serving{meal.servings > 1 ? 's' : ''}</Text>
                </View>
              </View>

              {/* Nutrition Card */}
              <GlassCard
                style={styles.nutritionCard}
                intensity={80}
                tintColor={isDark ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.9)'}
                interactive
              >
                <Text style={[styles.nutritionTitle, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>Nutrition per serving</Text>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <View style={[styles.nutritionDot, { backgroundColor: colors.calories }]} />
                      <Text style={[styles.nutritionValue, { color: colors.text }]}>{meal.calories}</Text>
                      <Text style={[styles.nutritionLabel, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <View style={[styles.nutritionDot, { backgroundColor: colors.protein }]} />
                      <Text style={[styles.nutritionValue, { color: colors.text }]}>{meal.protein}g</Text>
                      <Text style={[styles.nutritionLabel, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <View style={[styles.nutritionDot, { backgroundColor: colors.carbs }]} />
                      <Text style={[styles.nutritionValue, { color: colors.text }]}>{meal.carbs}g</Text>
                      <Text style={[styles.nutritionLabel, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <View style={[styles.nutritionDot, { backgroundColor: colors.fat }]} />
                      <Text style={[styles.nutritionValue, { color: colors.text }]}>{meal.fat}g</Text>
                      <Text style={[styles.nutritionLabel, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>fat</Text>
                    </View>
                  </View>
              </GlassCard>

              {/* Ingredients Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>Ingredients</Text>
                {meal.ingredients && meal.ingredients.length > 0 ? (
                  <View style={styles.ingredientsList}>
                    {meal.ingredients.map((ingredient, idx) => (
                      <View key={idx} style={styles.ingredientRow}>
                        <View style={[styles.ingredientCheck, { borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' }]}>
                          <View style={styles.ingredientCheckInner} />
                        </View>
                        <Text style={[styles.ingredientText, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }]}>
                          <Text style={[styles.ingredientAmount, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>{ingredient.amount} {ingredient.unit}</Text>
                          {'  '}{ingredient.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.emptyRecipeText, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>
                    Recipe details not available for AI-generated meals. Search online for "{meal.name}" recipe.
                  </Text>
                )}
              </View>

              {/* Instructions Section */}
              {meal.instructions && meal.instructions.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>Instructions</Text>
                  <View style={styles.instructionsList}>
                    {meal.instructions.map((instruction, idx) => (
                      <View key={idx} style={styles.instructionRow}>
                        <View style={[styles.instructionNumberBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' }]}>
                          <Text style={[styles.instructionNumber, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }]}>{idx + 1}</Text>
                        </View>
                        <Text style={[styles.instructionText, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }]}>{instruction}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.modalFooter}>
              <BlurView
                intensity={isDark ? 60 : 80}
                tint={isDark ? "dark" : "light"}
                style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(8, 8, 8, 0.9)' : 'rgba(250, 250, 250, 0.9)' }]}
              />

              {/* Add to Today's Meals Button */}
              <TouchableOpacity
                style={[
                  styles.primaryActionButton,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.95)' : colors.primary }
                ]}
                onPress={handleAddToTodaysMeals}
                disabled={isAddingToMeals}
                activeOpacity={0.7}
              >
                <View style={[styles.actionButtonIcon, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.2)' }]}>
                  <Ionicons name="add-circle-outline" size={18} color={isDark ? 'rgba(0,0,0,0.8)' : colors.primaryText} />
                </View>
                <Text style={[styles.primaryActionText, { color: isDark ? 'rgba(0, 0, 0, 0.85)' : colors.primaryText }]}>
                  {isAddingToMeals ? 'Adding...' : "Add to Today's Meals"}
                </Text>
              </TouchableOpacity>

              {/* Secondary Actions Row */}
              <View style={styles.secondaryActionsRow}>
                {/* Add to Instacart Button */}
                <TouchableOpacity
                  style={[
                    styles.secondaryActionButton,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                    }
                  ]}
                  onPress={handleAddToInstacart}
                  disabled={isAddingToInstacart}
                  activeOpacity={0.7}
                >
                  <Ionicons name="cart-outline" size={18} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} />
                  <Text style={[styles.secondaryActionText, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
                    {isAddingToInstacart ? 'Adding...' : 'Ingredients to Instacart'}
                  </Text>
                </TouchableOpacity>

                {/* Swap Meal Button */}
                {onSwap && (
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionButton,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                      }
                    ]}
                    onPress={handleSwap}
                    disabled={isSwapping}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="swap-horizontal" size={18} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} />
                    <Text style={[styles.secondaryActionText, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
