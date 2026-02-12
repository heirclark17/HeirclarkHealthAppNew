import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../constants/Theme';
import { useFoodPreferencesSafe } from '../contexts/FoodPreferencesContext';
import { useSettings } from '../contexts/SettingsContext';
import { GlassCard } from './GlassCard';
import { selectionFeedback, lightImpact } from '../utils/haptics';

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

// iOS 26 Liquid Glass Section wrapper
function GlassSection({ children, isDark, style }: { children: React.ReactNode; isDark: boolean; style?: any }) {
  return (
    <GlassCard style={[styles.glassSection, style]} interactive>
      {children}
    </GlassCard>
  );
}

export function FoodPreferencesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const foodPrefsContext = useFoodPreferencesSafe();
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

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
      const hatedArray = prefs.hatedFoods ? prefs.hatedFoods.split(',').map(s => s.trim()).filter(Boolean) : [];
      setDisliked(hatedArray.filter(h => DISLIKED_OPTIONS.includes(h)));
      setHatedFoodsText(prefs.hatedFoods || '');
      setMealStyle(prefs.mealStyle || '');
      setMealDiversity(prefs.mealDiversity || '');
    }
  }, [visible, foodPrefsContext?.preferences]);

  const toggleItem = async (array: string[], setArray: (arr: string[]) => void, item: string) => {
    await selectionFeedback();
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

    await lightImpact();
    setIsSaving(true);
    try {
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

  // iOS 26 Liquid Glass Chip
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
  }) => {
    const selectedBg = variant === 'allergen'
      ? (isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.15)')
      : variant === 'disliked'
        ? (isDark ? 'rgba(249, 115, 22, 0.18)' : 'rgba(249, 115, 22, 0.15)')
        : (isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)');

    const selectedColor = variant === 'allergen' ? Colors.error
      : variant === 'disliked' ? Colors.warningOrange
        : Colors.successMuted;

    return (
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <GlassCard
          style={[
            styles.chip,
            isSelected && { backgroundColor: selectedBg }
          ]}
          interactive
        >
          <Text
            style={[
              styles.chipText,
              { color: colors.text },
              isSelected && { color: selectedColor }
            ]}
          >
            {item}
          </Text>
          {isSelected && (
            <Ionicons
              name={variant === 'allergen' || variant === 'disliked' ? 'close-circle' : 'checkmark-circle'}
              size={16}
              color={selectedColor}
              style={{ marginLeft: 4 }}
            />
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  // iOS 26 Liquid Glass Option Button
  const OptionButton = ({
    label,
    isSelected,
    onPress,
  }: {
    label: string;
    isSelected: boolean;
    onPress: () => void;
  }) => {
    const selectedBg = isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)';

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1 }}>
        <GlassCard
          style={[
            styles.optionButton,
            isSelected && { backgroundColor: selectedBg }
          ]}
          interactive
        >
          <Text style={[
            styles.optionButtonText,
            { color: colors.text },
            isSelected && { color: Colors.successMuted }
          ]}>
            {label}
          </Text>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Food Preferences</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Customize your AI meal plans</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
            <GlassCard style={styles.closeButton} interactive>
              <Ionicons name="close" size={24} color={colors.text} />
            </GlassCard>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Meal Variety */}
          <GlassSection isDark={isDark}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MEAL VARIETY</Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Different meals daily or meal prep friendly?</Text>
            <View style={styles.optionsRow}>
              <OptionButton
                label="Diverse daily"
                isSelected={mealDiversity === 'diverse'}
                onPress={async () => { await selectionFeedback(); setMealDiversity('diverse'); }}
              />
              <OptionButton
                label="Same meals (prep)"
                isSelected={mealDiversity === 'sameDaily'}
                onPress={async () => { await selectionFeedback(); setMealDiversity('sameDaily'); }}
              />
            </View>
          </GlassSection>

          {/* Favorite Proteins */}
          <GlassSection isDark={isDark}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FAVORITE PROTEINS</Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Select proteins you enjoy</Text>
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
          </GlassSection>

          {/* Favorite Vegetables */}
          <GlassSection isDark={isDark}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FAVORITE VEGETABLES</Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Select vegetables you enjoy</Text>
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
          </GlassSection>

          {/* Favorite Starches */}
          <GlassSection isDark={isDark}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FAVORITE CARBS & STARCHES</Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Select starches you enjoy</Text>
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
          </GlassSection>

          {/* Favorite Snacks */}
          <GlassSection isDark={isDark}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FAVORITE SNACKS</Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Select snacks you enjoy</Text>
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
          </GlassSection>

          {/* Favorite Cuisines */}
          <GlassSection isDark={isDark}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FAVORITE CUISINES</Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Cuisines you enjoy most</Text>
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
          </GlassSection>

          {/* Disliked Foods */}
          <GlassSection isDark={isDark}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DISLIKED FOODS</Text>
            <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Foods to avoid in your meal plans</Text>
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
            <GlassCard style={styles.textInputContainer} interactive>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="Add other foods (comma separated)"
                placeholderTextColor={colors.textMuted}
                value={hatedFoodsText}
                onChangeText={setHatedFoodsText}
                multiline
              />
            </GlassCard>
          </GlassSection>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.7}
            style={{ width: '100%' }}
          >
            <GlassCard
              style={[
                styles.saveButton,
                { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)' },
                isSaving && { opacity: 0.6 }
              ]}
              interactive
            >
              <Text style={[styles.saveButtonText, { color: Colors.successMuted }]}>
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Text>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.light,
    fontWeight: '200',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  closeButtonContainer: {
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  glassSection: {
    marginBottom: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  optionButtonText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200',
    textAlign: 'center',
  },
  textInputContainer: {
    marginTop: 12,
    padding: 0,
  },
  textInput: {
    padding: 12,
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
    paddingBottom: 40,
    overflow: 'hidden',
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
  },
});
