import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { X, ShoppingCart, Clock, ChefHat } from 'lucide-react-native';
import { Colors, Fonts } from '../../constants/Theme';
import { NumberText } from '../NumberText';
import { useSettings } from '../../contexts/SettingsContext';

export interface Ingredient {
  ingredient: string;
  quantity: number;
  unit: string;
  instacart_query?: string;
  optional?: boolean;
}

export interface Meal {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dishName: string;
  name?: string; // Fallback for older data
  description?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
    calories?: number;
  };
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  ingredients?: Ingredient[];
  instructions?: string;
}

interface RecipeModalProps {
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
}

export function RecipeModal({ visible, meal, onClose }: RecipeModalProps) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';

  if (!meal) return null;

  const mealName = meal.dishName || meal.name || 'Meal';
  const calories = meal.calories || meal.macros?.calories || 0;
  const protein = meal.protein || meal.macros?.protein || 0;
  const carbs = meal.carbs || meal.macros?.carbs || 0;
  const fat = meal.fat || meal.macros?.fat || 0;
  const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);

  const handleShopInstacart = async () => {
    if (!meal.ingredients || meal.ingredients.length === 0) {
      Alert.alert('No Ingredients', 'This recipe does not have ingredients available for shopping.');
      return;
    }

    try {
      // Send ingredients to Instacart via backend
      const response = await fetch(
        'https://heirclarkinstacartbackend-production.up.railway.app/proxy/build-list',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: meal.ingredients.map(ing => ({
              name: ing.ingredient,
              query: ing.instacart_query || ing.ingredient,
              quantity: ing.quantity,
              unit: ing.unit,
              category: 'recipe',
              pantry: ing.optional || false,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create Instacart list');
      }

      const result = await response.json();

      if (result.products_link_url) {
        // Open Instacart in browser/app
        const canOpen = await Linking.canOpenURL(result.products_link_url);
        if (canOpen) {
          await Linking.openURL(result.products_link_url);
        } else {
          Alert.alert('Error', 'Could not open Instacart link');
        }
      } else {
        Alert.alert('Error', 'No Instacart link received');
      }
    } catch (error) {
      console.error('[RecipeModal] Instacart error:', error);
      Alert.alert('Error', 'Could not connect to Instacart. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        {/* Header with close button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Meal Type Badge */}
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: isDark ? 'Colors.cardBackground' : '#f0f0f0' }]}>
              <ChefHat size={14} color={isDark ? '#888' : '#666'} />
              <Text style={[styles.badgeText, { color: isDark ? '#888' : '#666', fontFamily: Fonts.medium }]}>
                {meal.mealType?.toUpperCase() || 'MEAL'}
              </Text>
            </View>
          </View>

          {/* Meal Name */}
          <Text style={[styles.title, { color: isDark ? '#fff' : '#000', fontFamily: Fonts.bold }]}>
            {mealName}
          </Text>

          {/* Description */}
          {meal.description && (
            <Text style={[styles.description, { color: isDark ? '#aaa' : '#666', fontFamily: Fonts.light }]}>
              {meal.description}
            </Text>
          )}

          {/* Macros Card */}
          <View style={[styles.macrosCard, { backgroundColor: isDark ? 'Colors.cardBackground' : '#f5f5f5' }]}>
            <View style={styles.macroItem}>
              <NumberText weight="bold" style={[styles.macroValue, { color: isDark ? '#fff' : '#000' }]}>
                {calories}
              </NumberText>
              <Text style={[styles.macroLabel, { color: isDark ? '#888' : '#666', fontFamily: Fonts.light }]}>
                Calories
              </Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <NumberText weight="bold" style={[styles.macroValue, { color: isDark ? '#fff' : '#000' }]}>
                {protein}
              </NumberText>
              <Text style={[styles.macroLabel, { color: isDark ? '#888' : '#666', fontFamily: Fonts.light }]}>
                Protein (g)
              </Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <NumberText weight="bold" style={[styles.macroValue, { color: isDark ? '#fff' : '#000' }]}>
                {carbs}
              </NumberText>
              <Text style={[styles.macroLabel, { color: isDark ? '#888' : '#666', fontFamily: Fonts.light }]}>
                Carbs (g)
              </Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <NumberText weight="bold" style={[styles.macroValue, { color: isDark ? '#fff' : '#000' }]}>
                {fat}
              </NumberText>
              <Text style={[styles.macroLabel, { color: isDark ? '#888' : '#666', fontFamily: Fonts.light }]}>
                Fat (g)
              </Text>
            </View>
          </View>

          {/* Time & Servings */}
          {(totalTime > 0 || meal.servings) && (
            <View style={styles.metaRow}>
              {totalTime > 0 && (
                <View style={styles.metaItem}>
                  <Clock size={16} color={isDark ? '#888' : '#666'} />
                  <NumberText weight="medium" style={[styles.metaText, { color: isDark ? '#888' : '#666' }]}>
                    {totalTime}
                  </NumberText>
                  <Text style={[styles.metaText, { color: isDark ? '#888' : '#666', fontFamily: Fonts.light }]}>
                    {' '}min
                  </Text>
                </View>
              )}
              {meal.servings && (
                <View style={styles.metaItem}>
                  <Text style={[styles.metaText, { color: isDark ? '#888' : '#666', fontFamily: Fonts.medium }]}>
                    Servings:{' '}
                  </Text>
                  <NumberText weight="medium" style={[styles.metaText, { color: isDark ? '#888' : '#666' }]}>
                    {meal.servings}
                  </NumberText>
                </View>
              )}
            </View>
          )}

          {/* Ingredients */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000', fontFamily: Fonts.semiBold }]}>
                Ingredients
              </Text>
              <View style={[styles.ingredientsList, { backgroundColor: isDark ? 'Colors.cardBackground' : '#f5f5f5' }]}>
                {meal.ingredients.map((ing, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={[styles.bullet, { backgroundColor: isDark ? '#333' : '#ddd' }]} />
                    <Text style={[styles.ingredientText, { color: isDark ? '#ccc' : '#333', fontFamily: Fonts.light }]}>
                      <NumberText weight="medium" style={{ color: isDark ? '#ccc' : '#333' }}>
                        {ing.quantity}
                      </NumberText>{' '}
                      {ing.unit} {ing.ingredient}
                      {ing.optional && (
                        <Text style={[styles.optionalText, { color: isDark ? '#666' : '#999' }]}>
                          {' '}(optional)
                        </Text>
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Instructions */}
          {meal.instructions && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000', fontFamily: Fonts.semiBold }]}>
                Instructions
              </Text>
              <View style={[styles.instructionsCard, { backgroundColor: isDark ? 'Colors.cardBackground' : '#f5f5f5' }]}>
                <Text style={[styles.instructionsText, { color: isDark ? '#ccc' : '#333', fontFamily: Fonts.light }]}>
                  {meal.instructions}
                </Text>
              </View>
            </View>
          )}

          {/* Shop on Instacart Button */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <TouchableOpacity style={styles.instacartButton} onPress={handleShopInstacart}>
              <ShoppingCart size={20} color="#fff" />
              <Text style={[styles.instacartButtonText, { fontFamily: Fonts.semiBold }]}>
                Shop on Instacart
              </Text>
            </TouchableOpacity>
          )}

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  badgeContainer: {
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    marginBottom: 12,
    lineHeight: 34,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  macrosCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 24,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  macroDivider: {
    width: 1,
    backgroundColor: 'rgba(128,128,128,0.2)',
    marginHorizontal: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  ingredientsList: {
    borderRadius: 12,
    padding: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  optionalText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  instructionsCard: {
    borderRadius: 12,
    padding: 16,
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 24,
  },
  instacartButton: {
    backgroundColor: 'Colors.successStrong',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  instacartButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
