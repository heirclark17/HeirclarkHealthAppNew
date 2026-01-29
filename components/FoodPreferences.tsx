import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing } from '../constants/Theme';

interface Preference {
  id: string;
  name: string;
  selected: boolean;
}

export function FoodPreferencesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  // Dietary Preferences
  const [diets, setDiets] = useState<Preference[]>([
    { id: 'vegan', name: 'Vegan', selected: false },
    { id: 'vegetarian', name: 'Vegetarian', selected: false },
    { id: 'pescatarian', name: 'Pescatarian', selected: false },
    { id: 'keto', name: 'Keto', selected: false },
    { id: 'paleo', name: 'Paleo', selected: false },
    { id: 'low-carb', name: 'Low Carb', selected: false },
    { id: 'gluten-free', name: 'Gluten Free', selected: false },
    { id: 'dairy-free', name: 'Dairy Free', selected: false },
    { id: 'halal', name: 'Halal', selected: false },
    { id: 'kosher', name: 'Kosher', selected: false },
  ]);

  // Allergens
  const [allergens, setAllergens] = useState<Preference[]>([
    { id: 'dairy', name: 'Dairy', selected: false },
    { id: 'eggs', name: 'Eggs', selected: false },
    { id: 'fish', name: 'Fish', selected: false },
    { id: 'shellfish', name: 'Shellfish', selected: false },
    { id: 'tree-nuts', name: 'Tree Nuts', selected: false },
    { id: 'peanuts', name: 'Peanuts', selected: false },
    { id: 'wheat', name: 'Wheat', selected: false },
    { id: 'soy', name: 'Soy', selected: false },
    { id: 'gluten', name: 'Gluten', selected: false },
    { id: 'sesame', name: 'Sesame', selected: false },
  ]);

  // Favorite Cuisines
  const [cuisines, setCuisines] = useState<Preference[]>([
    { id: 'american', name: 'American', selected: false },
    { id: 'italian', name: 'Italian', selected: false },
    { id: 'mexican', name: 'Mexican', selected: false },
    { id: 'chinese', name: 'Chinese', selected: false },
    { id: 'japanese', name: 'Japanese', selected: false },
    { id: 'indian', name: 'Indian', selected: false },
    { id: 'thai', name: 'Thai', selected: false },
    { id: 'mediterranean', name: 'Mediterranean', selected: false },
    { id: 'french', name: 'French', selected: false },
    { id: 'greek', name: 'Greek', selected: false },
    { id: 'korean', name: 'Korean', selected: false },
    { id: 'vietnamese', name: 'Vietnamese', selected: false },
  ]);

  // Disliked Foods
  const [disliked, setDisliked] = useState<Preference[]>([
    { id: 'mushrooms', name: 'Mushrooms', selected: false },
    { id: 'cilantro', name: 'Cilantro', selected: false },
    { id: 'olives', name: 'Olives', selected: false },
    { id: 'onions', name: 'Onions', selected: false },
    { id: 'tomatoes', name: 'Tomatoes', selected: false },
    { id: 'avocado', name: 'Avocado', selected: false },
    { id: 'broccoli', name: 'Broccoli', selected: false },
    { id: 'seafood', name: 'Seafood', selected: false },
    { id: 'spicy-food', name: 'Spicy Food', selected: false },
    { id: 'red-meat', name: 'Red Meat', selected: false },
  ]);

  const togglePreference = (category: string, id: string) => {
    const setters = {
      diets: setDiets,
      allergens: setAllergens,
      cuisines: setCuisines,
      disliked: setDisliked,
    };

    const states = {
      diets,
      allergens,
      cuisines,
      disliked,
    };

    const setter = setters[category as keyof typeof setters];
    const state = states[category as keyof typeof states];

    setter(
      state.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSave = () => {
    // Save preferences to API or AsyncStorage
    onClose();
  };

  const PreferenceChip = ({
    item,
    category,
    variant = 'default',
  }: {
    item: Preference;
    category: string;
    variant?: 'default' | 'allergen';
  }) => (
    <TouchableOpacity
      style={[
        styles.chip,
        item.selected && styles.chipSelected,
        variant === 'allergen' && item.selected && styles.chipAllergen,
      ]}
      onPress={() => togglePreference(category, item.id)}
    >
      <Text
        style={[
          styles.chipText,
          item.selected && styles.chipTextSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#1a1a1a', '#000000']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>FOOD PREFERENCES</Text>
            <Text style={styles.headerSubtitle}>Customize your meal recommendations</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Dietary Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DIETARY PREFERENCES</Text>
            <Text style={styles.sectionDesc}>Select your dietary lifestyle</Text>
            <View style={styles.chipsContainer}>
              {diets.map((diet) => (
                <PreferenceChip key={diet.id} item={diet} category="diets" />
              ))}
            </View>
          </View>

          {/* Allergens */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ALLERGENS & RESTRICTIONS</Text>
            <Text style={styles.sectionDesc}>Foods you must avoid</Text>
            <View style={styles.chipsContainer}>
              {allergens.map((allergen) => (
                <PreferenceChip
                  key={allergen.id}
                  item={allergen}
                  category="allergens"
                  variant="allergen"
                />
              ))}
            </View>
          </View>

          {/* Favorite Cuisines */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FAVORITE CUISINES</Text>
            <Text style={styles.sectionDesc}>Cuisines you enjoy most</Text>
            <View style={styles.chipsContainer}>
              {cuisines.map((cuisine) => (
                <PreferenceChip key={cuisine.id} item={cuisine} category="cuisines" />
              ))}
            </View>
          </View>

          {/* Disliked Foods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DISLIKED FOODS</Text>
            <Text style={styles.sectionDesc}>Foods you prefer to avoid</Text>
            <View style={styles.chipsContainer}>
              {disliked.map((food) => (
                <PreferenceChip key={food.id} item={food} category="disliked" />
              ))}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </TouchableOpacity>
        </View>
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: Fonts.semiBold,
  },
  sectionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontFamily: Fonts.regular,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  chipAllergen: {
    backgroundColor: Colors.warning + '30',
    borderColor: Colors.warning,
  },
  chipText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  chipTextSelected: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
