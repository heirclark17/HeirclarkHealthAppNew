import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing } from '../constants/Theme';

interface MealItem {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  tags: string[];
}

export function MealLibraryModal({
  visible,
  onClose,
  onSelectMeal,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectMeal?: (meal: MealItem) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks'];

  const filterTags = [
    'High Protein',
    'Low Carb',
    'Vegetarian',
    'Vegan',
    'Gluten Free',
    'Dairy Free',
    'Quick',
    'Healthy',
  ];

  // Sample meal library data (would come from API/database)
  const [meals] = useState<MealItem[]>([
    {
      id: '1',
      name: 'Grilled Chicken Breast',
      category: 'Lunch',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      serving: '100g',
      tags: ['High Protein', 'Low Carb', 'Gluten Free'],
    },
    {
      id: '2',
      name: 'Greek Yogurt Bowl',
      category: 'Breakfast',
      calories: 220,
      protein: 20,
      carbs: 15,
      fat: 9,
      serving: '1 cup',
      tags: ['High Protein', 'Vegetarian', 'Quick'],
    },
    {
      id: '3',
      name: 'Quinoa Salad',
      category: 'Lunch',
      calories: 320,
      protein: 12,
      carbs: 42,
      fat: 12,
      serving: '1 bowl',
      tags: ['Vegetarian', 'Vegan', 'Gluten Free', 'Healthy'],
    },
    {
      id: '4',
      name: 'Protein Smoothie',
      category: 'Snacks',
      calories: 280,
      protein: 30,
      carbs: 28,
      fat: 5,
      serving: '16oz',
      tags: ['High Protein', 'Vegetarian', 'Quick'],
    },
    {
      id: '5',
      name: 'Salmon Fillet',
      category: 'Dinner',
      calories: 206,
      protein: 22,
      carbs: 0,
      fat: 12,
      serving: '100g',
      tags: ['High Protein', 'Low Carb', 'Gluten Free', 'Healthy'],
    },
    {
      id: '6',
      name: 'Oatmeal with Berries',
      category: 'Breakfast',
      calories: 180,
      protein: 6,
      carbs: 32,
      fat: 3,
      serving: '1 cup',
      tags: ['Vegetarian', 'Vegan', 'Healthy', 'Quick'],
    },
    {
      id: '7',
      name: 'Avocado Toast',
      category: 'Breakfast',
      calories: 250,
      protein: 8,
      carbs: 24,
      fat: 15,
      serving: '2 slices',
      tags: ['Vegetarian', 'Vegan', 'Healthy', 'Quick'],
    },
    {
      id: '8',
      name: 'Egg White Omelet',
      category: 'Breakfast',
      calories: 120,
      protein: 18,
      carbs: 4,
      fat: 2,
      serving: '3 eggs',
      tags: ['High Protein', 'Low Carb', 'Gluten Free', 'Quick'],
    },
  ]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const filteredMeals = meals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || meal.category === selectedCategory;
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => meal.tags.includes(tag));
    return matchesSearch && matchesCategory && matchesTags;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.background, Colors.card, Colors.background]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>MEAL LIBRARY</Text>
            <Text style={styles.headerSubtitle}>{filteredMeals.length} meals</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search meals..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Filter */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>CATEGORIES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Tag Filter */}
          <View style={styles.tagSection}>
            <Text style={styles.sectionTitle}>FILTERS</Text>
            <View style={styles.tagsContainer}>
              {filterTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      selectedTags.includes(tag) && styles.tagChipTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meal List */}
          <View style={styles.mealsSection}>
            <Text style={styles.sectionTitle}>MEALS</Text>
            {filteredMeals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No meals found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
              </View>
            ) : (
              filteredMeals.map(meal => (
                <TouchableOpacity key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealServing}>{meal.serving}</Text>
                  </View>

                  <View style={styles.macrosRow}>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{meal.calories}</Text>
                      <Text style={styles.macroLabel}>cal</Text>
                    </View>
                    <View style={styles.macroDivider} />
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{meal.protein}g</Text>
                      <Text style={styles.macroLabel}>protein</Text>
                    </View>
                    <View style={styles.macroDivider} />
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{meal.carbs}g</Text>
                      <Text style={styles.macroLabel}>carbs</Text>
                    </View>
                    <View style={styles.macroDivider} />
                    <View style={styles.macroItem}>
                      <Text style={styles.macroValue}>{meal.fat}g</Text>
                      <Text style={styles.macroLabel}>fat</Text>
                    </View>
                  </View>

                  <View style={styles.tagsRow}>
                    {meal.tags.slice(0, 3).map((tag, idx) => (
                      <View key={idx} style={styles.mealTag}>
                        <Text style={styles.mealTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      if (onSelectMeal) {
                        onSelectMeal(meal);
                      }
                    }}
                  >
                    <Text style={styles.addButtonText}>+ Add to Meal</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.text,
    letterSpacing: 2,
    fontFamily: Fonts.bold,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    fontFamily: Fonts.regular,
  },
  closeButton: {
    fontSize: 28,
    color: Colors.text,
    fontFamily: Fonts.regular,
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: Fonts.regular,
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
    fontFamily: Fonts.semiBold,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  categoryChip: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  categoryChipTextActive: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  tagSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipActive: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  tagChipText: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  tagChipTextActive: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  mealsSection: {
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
    fontFamily: Fonts.medium,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  mealCard: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealName: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    flex: 1,
  },
  mealServing: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  macrosRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius - 4,
    padding: 12,
    marginBottom: 12,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  macroDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  mealTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mealTagText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: Spacing.borderRadius - 4,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.primaryText,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
});
