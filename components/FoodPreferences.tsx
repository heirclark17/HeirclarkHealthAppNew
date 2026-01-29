import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../constants/Theme';
import { useFoodPreferences, useFoodPreferencesSafe } from '../contexts/FoodPreferencesContext';

interface Preference {
  id: string;
  name: string;
  selected: boolean;
}

// Available options for each category
const DIETARY_OPTIONS = [
  'Vegan', 'Vegetarian', 'Pescatarian', 'Keto', 'Paleo',
  'Low Carb', 'Gluten Free', 'Dairy Free', 'Halal', 'Kosher'
];

const ALLERGEN_OPTIONS = [
  'Dairy', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts',
  'Peanuts', 'Wheat', 'Soy', 'Gluten', 'Sesame'
];

const CUISINE_OPTIONS = [
  'American', 'Italian', 'Mexican', 'Chinese', 'Japanese',
  'Indian', 'Thai', 'Mediterranean', 'Greek', 'Korean', 'Vietnamese'
];

const PROTEIN_OPTIONS = [
  'Chicken', 'Beef', 'Pork', 'Fish', 'Shrimp',
  'Tofu', 'Eggs', 'Turkey', 'Salmon', 'Lamb'
];

const VEGETABLE_OPTIONS = [
  'Broccoli', 'Spinach', 'Carrots', 'Bell Peppers', 'Zucchini',
  'Asparagus', 'Green Beans', 'Kale', 'Mushrooms', 'Cauliflower'
];

const STARCH_OPTIONS = [
  'Rice', 'Potatoes', 'Pasta', 'Quinoa', 'Sweet Potatoes',
  'Bread', 'Oats', 'Couscous', 'Beans', 'Lentils'
];

const SNACK_OPTIONS = [
  'Nuts', 'Yogurt', 'Fruit', 'Protein Bars', 'Cheese',
  'Vegetables & Hummus', 'Trail Mix', 'Smoothies', 'Hard Boiled Eggs', 'Cottage Cheese'
];

const DISLIKED_OPTIONS = [
  'Mushrooms', 'Cilantro', 'Olives', 'Onions', 'Tomatoes',
  'Avocado', 'Broccoli', 'Seafood', 'Spicy Food', 'Red Meat'
];

export function FoodPreferencesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const foodPrefsContext = useFoodPreferencesSafe();

  // Local state for editing
  const [diets, setDiets] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [proteins, setProteins] = useState<string[]>([]);
  const [vegetables, setVegetables] = useState<string[]>([]);
  const [starches, setStarches] = useState<string[]>([]);
  const [snacks, setSnacks] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [hatedFoodsText, setHatedFoodsText] = useState('');
  const [mealStyle, setMealStyle] = useState<'threePlusSnacks' | 'fewerLarger' | ''>('');
  const [mealDiversity, setMealDiversity] = useState<'diverse' | 'sameDaily' | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  // Load saved preferences when modal opens
  useEffect(() => {
    if (visible && foodPrefsContext?.preferences) {
      const prefs = foodPrefsContext.preferences;
      setDiets(prefs.dietaryPreferences || []);
      setAllergens(prefs.allergens || []);
      setCuisines(prefs.favoriteCuisines || []);
      setProteins(prefs.favoriteProteins || []);
      setVegetables(prefs.favoriteVegetables || []);
      setStarches(prefs.favoriteStarches || []);
      setSnacks(prefs.favoriteSnacks || []);
      // Convert hatedFoods text to disliked array for display
      const hatedArray = prefs.hatedFoods ? prefs.hatedFoods.split(',').map(s => s.trim()).filter(Boolean) : [];
      setDisliked(hatedArray.filter(h => DISLIKED_OPTIONS.includes(h)));
      setHatedFoodsText(prefs.hatedFoods || '');
      setMealStyle(prefs.mealStyle || '');
      setMealDiversity(prefs.mealDiversity || '');
    }
  }, [visible, foodPrefsContext?.preferences]);

  const toggleItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleSave = async () => {
    if (!foodPrefsContext) {
      console.warn('[FoodPreferences] Context not available');
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      // Combine disliked selections with any custom hated foods text
      const allHatedFoods = [...new Set([...disliked, ...hatedFoodsText.split(',').map(s => s.trim()).filter(Boolean)])];

      await foodPrefsContext.updatePreferences({
        dietaryPreferences: diets,
        allergens: allergens,
        favoriteCuisines: cuisines,
        favoriteProteins: proteins,
        favoriteVegetables: vegetables,
        favoriteStarches: starches,
        favoriteSnacks: snacks,
        hatedFoods: allHatedFoods.join(', '),
        mealStyle: mealStyle,
        mealDiversity: mealDiversity,
      });

      console.log('[FoodPreferences] Saved successfully');
      onClose();
    } catch (error) {
      console.error('[FoodPreferences] Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const PreferenceChip = ({
    item,
    isSelected,
    onToggle,
    variant = 'default',
  }: {
    item: string;
    isSelected: boolean;
    onToggle: () => void;
    variant?: 'default' | 'allergen' | 'disliked';
  }) => (
    <TouchableOpacity
      style={[
        styles.chip,
        isSelected && styles.chipSelected,
        variant === 'allergen' && isSelected && styles.chipAllergen,
        variant === 'disliked' && isSelected && styles.chipDisliked,
      ]}
      onPress={onToggle}
    >
      <Text
        style={[
          styles.chipText,
          isSelected && styles.chipTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const OptionButton = ({
    label,
    isSelected,
    onPress,
  }: {
    label: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionButtonText, isSelected && styles.optionButtonTextSelected]}>
        {label}
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
            <Text style={styles.headerSubtitle}>Customize your AI meal plans</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Meal Style */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MEAL STYLE</Text>
            <Text style={styles.sectionDesc}>How many meals do you prefer per day?</Text>
            <View style={styles.optionsRow}>
              <OptionButton
                label="3 meals + snacks"
                isSelected={mealStyle === 'threePlusSnacks'}
                onPress={() => setMealStyle('threePlusSnacks')}
              />
              <OptionButton
                label="Fewer, larger meals"
                isSelected={mealStyle === 'fewerLarger'}
                onPress={() => setMealStyle('fewerLarger')}
              />
            </View>
          </View>

          {/* Meal Diversity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MEAL VARIETY</Text>
            <Text style={styles.sectionDesc}>Do you want different meals each day or meal prep friendly?</Text>
            <View style={styles.optionsRow}>
              <OptionButton
                label="Diverse daily"
                isSelected={mealDiversity === 'diverse'}
                onPress={() => setMealDiversity('diverse')}
              />
              <OptionButton
                label="Same meals (meal prep)"
                isSelected={mealDiversity === 'sameDaily'}
                onPress={() => setMealDiversity('sameDaily')}
              />
            </View>
          </View>

          {/* Dietary Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DIETARY PREFERENCES</Text>
            <Text style={styles.sectionDesc}>Select your dietary lifestyle</Text>
            <View style={styles.chipsContainer}>
              {DIETARY_OPTIONS.map((diet) => (
                <PreferenceChip
                  key={diet}
                  item={diet}
                  isSelected={diets.includes(diet)}
                  onToggle={() => toggleItem(diets, setDiets, diet)}
                />
              ))}
            </View>
          </View>

          {/* Allergens */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ALLERGENS & RESTRICTIONS</Text>
            <Text style={styles.sectionDesc}>Foods you must avoid (will be excluded)</Text>
            <View style={styles.chipsContainer}>
              {ALLERGEN_OPTIONS.map((allergen) => (
                <PreferenceChip
                  key={allergen}
                  item={allergen}
                  isSelected={allergens.includes(allergen)}
                  onToggle={() => toggleItem(allergens, setAllergens, allergen)}
                  variant="allergen"
                />
              ))}
            </View>
          </View>

          {/* Favorite Proteins */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FAVORITE PROTEINS</Text>
            <Text style={styles.sectionDesc}>Select proteins you enjoy</Text>
            <View style={styles.chipsContainer}>
              {PROTEIN_OPTIONS.map((protein) => (
                <PreferenceChip
                  key={protein}
                  item={protein}
                  isSelected={proteins.includes(protein)}
                  onToggle={() => toggleItem(proteins, setProteins, protein)}
                />
              ))}
            </View>
          </View>

          {/* Favorite Vegetables */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FAVORITE VEGETABLES</Text>
            <Text style={styles.sectionDesc}>Select vegetables you enjoy</Text>
            <View style={styles.chipsContainer}>
              {VEGETABLE_OPTIONS.map((veg) => (
                <PreferenceChip
                  key={veg}
                  item={veg}
                  isSelected={vegetables.includes(veg)}
                  onToggle={() => toggleItem(vegetables, setVegetables, veg)}
                />
              ))}
            </View>
          </View>

          {/* Favorite Starches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FAVORITE CARBS & STARCHES</Text>
            <Text style={styles.sectionDesc}>Select starches you enjoy</Text>
            <View style={styles.chipsContainer}>
              {STARCH_OPTIONS.map((starch) => (
                <PreferenceChip
                  key={starch}
                  item={starch}
                  isSelected={starches.includes(starch)}
                  onToggle={() => toggleItem(starches, setStarches, starch)}
                />
              ))}
            </View>
          </View>

          {/* Favorite Snacks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FAVORITE SNACKS</Text>
            <Text style={styles.sectionDesc}>Select snacks you enjoy</Text>
            <View style={styles.chipsContainer}>
              {SNACK_OPTIONS.map((snack) => (
                <PreferenceChip
                  key={snack}
                  item={snack}
                  isSelected={snacks.includes(snack)}
                  onToggle={() => toggleItem(snacks, setSnacks, snack)}
                />
              ))}
            </View>
          </View>

          {/* Favorite Cuisines */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FAVORITE CUISINES</Text>
            <Text style={styles.sectionDesc}>Cuisines you enjoy most</Text>
            <View style={styles.chipsContainer}>
              {CUISINE_OPTIONS.map((cuisine) => (
                <PreferenceChip
                  key={cuisine}
                  item={cuisine}
                  isSelected={cuisines.includes(cuisine)}
                  onToggle={() => toggleItem(cuisines, setCuisines, cuisine)}
                />
              ))}
            </View>
          </View>

          {/* Disliked Foods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DISLIKED FOODS</Text>
            <Text style={styles.sectionDesc}>Foods you prefer to avoid (AI will exclude these)</Text>
            <View style={styles.chipsContainer}>
              {DISLIKED_OPTIONS.map((food) => (
                <PreferenceChip
                  key={food}
                  item={food}
                  isSelected={disliked.includes(food)}
                  onToggle={() => toggleItem(disliked, setDisliked, food)}
                  variant="disliked"
                />
              ))}
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Add other foods you dislike (comma separated)"
              placeholderTextColor={Colors.textMuted}
              value={hatedFoodsText}
              onChangeText={setHatedFoodsText}
              multiline
            />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Text>
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
  closeButtonContainer: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 28,
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
    marginBottom: 12,
    fontFamily: Fonts.regular,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  chipAllergen: {
    backgroundColor: '#ef444430',
    borderColor: '#ef4444',
  },
  chipDisliked: {
    backgroundColor: '#f9731630',
    borderColor: '#f97316',
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
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
  optionButtonTextSelected: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  textInput: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
