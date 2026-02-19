import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Platform } from 'react-native';
import {
  Apple,
  Egg,
  Dumbbell,
  Leaf,
  Flower2,
  Edit,
  CheckCircle2,
  Clock,
  XCircle,
  Shuffle,
  Repeat,
  Coffee,
  UtensilsCrossed,
  Pizza,
  Droplet,
  MinusCircle,
  PlusCircle,
  Moon,
  Footprints,
  Flame,
  Salad
} from 'lucide-react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import { useGoalWizard, DietStyle } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useFoodPreferencesSafe } from '../../contexts/FoodPreferencesContext';
import { lightImpact, selectionFeedback } from '../../utils/haptics';
import { WizardHeader } from './WizardHeader';

// iOS 26 Liquid Glass Section wrapper
function GlassSection({ children, isDark, style }: { children: React.ReactNode; isDark: boolean; style?: any }) {
  return (
    <GlassCard style={[styles.glassSection, style]} interactive>
      {children}
    </GlassCard>
  );
}

interface DietOption {
  id: DietStyle;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const DIET_OPTIONS: DietOption[] = [
  { id: 'standard', title: 'Standard', description: 'Balanced macros', icon: Apple },
  { id: 'keto', title: 'Keto', description: 'Low carb, high fat', icon: Egg },
  { id: 'high_protein', title: 'High Protein', description: 'Muscle focused', icon: Dumbbell },
  { id: 'vegetarian', title: 'Vegetarian', description: 'No meat', icon: Leaf },
  { id: 'vegan', title: 'Vegan', description: 'Plant-based only', icon: Flower2 },
  { id: 'custom', title: 'Custom', description: 'Set your own', icon: Edit },
];

const ALLERGIES = [
  'Dairy', 'Gluten', 'Nuts', 'Soy', 'Eggs', 'Shellfish', 'Fish', 'Wheat'
];

const FASTING_PRESETS = [
  { label: '16:8', start: '12:00', end: '20:00', description: 'Most popular' },
  { label: '18:6', start: '14:00', end: '20:00', description: 'Intermediate' },
  { label: '20:4', start: '16:00', end: '20:00', description: 'Advanced' },
];

// Food preference options
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

interface DietCardProps {
  option: DietOption;
  isSelected: boolean;
  onSelect: () => void;
  colors: typeof DarkColors;
  isDark: boolean;
}

function DietCard({ option, isSelected, onSelect, colors, isDark }: DietCardProps) {
  // iOS 26 Liquid Glass styling - enhanced visibility
  const selectedBg = isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)';
  const IconComponent = option.icon;

  return (
    <TouchableOpacity
      onPress={async () => {
        await selectionFeedback();
        onSelect();
      }}
      activeOpacity={0.7}
      accessibilityLabel={`${option.title} diet: ${option.description}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityHint={`Select ${option.title} diet style`}
    >
      <GlassCard style={[styles.dietCard, isSelected && { backgroundColor: selectedBg }]} interactive>
        <View style={styles.dietCardInner}>
          <View style={[styles.dietIcon, isSelected && styles.dietIconSelected]}>
            <IconComponent
              size={22}
              color={isSelected ? Colors.successMuted : colors.textMuted}
            />
          </View>
          <View style={styles.dietContent}>
            <Text style={[styles.dietTitle, { color: colors.text }, isSelected && styles.dietTitleSelected]}>
              {option.title}
            </Text>
            <Text style={[styles.dietDescription, { color: colors.textMuted }]}>{option.description}</Text>
          </View>
          {isSelected && (
            <CheckCircle2 size={20} color={Colors.successMuted} />
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

interface NutritionPreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function NutritionPreferencesStep({ onNext, onBack }: NutritionPreferencesStepProps) {
  const {
    state,
    setDietStyle,
    setMealsPerDay,
    setIntermittentFasting,
    setFastingWindow,
    toggleAllergy,
    setWaterGoalOz,
    setSleepGoalHours,
    setStepGoal,
  } = useGoalWizard();
  const { settings } = useSettings();
  const foodPrefsContext = useFoodPreferencesSafe();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const [showFastingOptions, setShowFastingOptions] = useState(state.intermittentFasting);

  // Food preference state (inline editing - no modal)
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [proteins, setProteins] = useState<string[]>([]);
  const [vegetables, setVegetables] = useState<string[]>([]);
  const [starches, setStarches] = useState<string[]>([]);
  const [snacks, setSnacks] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [hatedFoodsText, setHatedFoodsText] = useState('');
  const [mealDiversity, setMealDiversity] = useState<'diverse' | 'sameDaily' | ''>('');
  const [cookingSkill, setCookingSkill] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('');
  const [mealStyle, setMealStyle] = useState<'threePlusSnacks' | 'fewerLarger' | ''>('');
  const [cheatDays, setCheatDays] = useState<string[]>([]);

  // Load food preferences on mount
  useEffect(() => {
    if (foodPrefsContext?.preferences) {
      const prefs = foodPrefsContext.preferences;
      setCuisines(prefs.favoriteCuisines || []);
      setProteins(prefs.favoriteProteins || []);
      setVegetables(prefs.favoriteVegetables || []);
      setStarches(prefs.favoriteStarches || []);
      setSnacks(prefs.favoriteSnacks || []);
      const hatedArray = prefs.hatedFoods ? prefs.hatedFoods.split(',').map(s => s.trim()).filter(Boolean) : [];
      setDisliked(hatedArray.filter(h => DISLIKED_OPTIONS.includes(h)));
      setHatedFoodsText(prefs.hatedFoods || '');
      setMealDiversity(prefs.mealDiversity || '');
      setMealStyle(prefs.mealStyle || '');
      setCheatDays(prefs.cheatDays || []);
      setCookingSkill(prefs.cookingSkill || '');
    }
  }, [foodPrefsContext?.preferences]);

  // Toggle helper for food preference arrays
  const toggleFoodItem = async (array: string[], setArray: (arr: string[]) => void, item: string) => {
    await selectionFeedback();
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleFastingToggle = async (enabled: boolean) => {
    await selectionFeedback();
    setIntermittentFasting(enabled);
    setShowFastingOptions(enabled);
  };

  const selectFastingPreset = async (start: string, end: string) => {
    await selectionFeedback();
    setFastingWindow(start, end);
  };

  const handleContinue = async () => {
    await lightImpact();

    // Save food preferences before continuing
    if (foodPrefsContext) {
      try {
        const allHatedFoods = [...new Set([...disliked, ...hatedFoodsText.split(',').map(s => s.trim()).filter(Boolean)])];

        console.log('[NutritionPreferences] 🔍 About to save mealDiversity:', mealDiversity);
        console.log('[NutritionPreferences] 🔍 State values - mealStyle:', mealStyle, 'cheatDays:', cheatDays, 'cookingSkill:', cookingSkill);

        await foodPrefsContext.updatePreferences({
          favoriteCuisines: cuisines,
          favoriteProteins: proteins,
          favoriteVegetables: vegetables,
          favoriteStarches: starches,
          favoriteSnacks: snacks,
          hatedFoods: allHatedFoods.join(', '),
          mealDiversity: mealDiversity,
          mealStyle: mealStyle,
          cheatDays: cheatDays,
          cookingSkill: cookingSkill,
        });
        console.log('[NutritionPreferences] ✅ Food preferences saved successfully');
      } catch (error) {
        console.error('[NutritionPreferences] Error saving food preferences:', error);
      }
    }

    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Modern Liquid Glass Sticky Header */}
      <WizardHeader
        currentStep={4}
        totalSteps={6}
        title="Nutrition Preferences"
        icon={<Salad size={36} color={isDark ? '#FFFFFF' : '#000000'} />}
        onBack={onBack}
        isDark={isDark}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Spacer for sticky header */}
        <View style={{ height: Platform.OS === 'ios' ? 260 : 210 }} />

        <View style={styles.subtitle}>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
            Customize your meal plan to match your lifestyle and dietary needs.
          </Text>
        </View>

      {/* Diet Style Selection */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>DIET STYLE</Text>
        <View style={styles.dietGrid}>
          {DIET_OPTIONS.map((option) => (
            <DietCard
              key={option.id}
              option={option}
              isSelected={state.dietStyle === option.id}
              onSelect={() => setDietStyle(option.id)}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>
      </GlassSection>

      {/* Meals Per Day */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>MEALS PER DAY</Text>
        <View style={styles.mealsRow}>
          {[2, 3, 4, 5, 6].map((num) => {
            const isSelected = state.mealsPerDay === num;
            const selectedBg = isSelected
              ? (isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)')
              : undefined;

            return (
              <TouchableOpacity
                key={num}
                onPress={async () => {
                  await selectionFeedback();
                  setMealsPerDay(num);
                }}
                accessibilityLabel={`${num} meals per day`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint="Sets how many meals you'll eat daily"
              >
                <GlassCard
                  style={[
                    styles.mealChip,
                    isSelected && { backgroundColor: selectedBg }
                  ]}
                  interactive
                >
                  <NumberText
                    weight="light"
                    style={[
                      styles.mealChipText,
                      { color: colors.text },
                    ]}
                  >
                    {num}
                  </NumberText>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.mealsHint, { color: colors.textMuted }]}>
          {state.mealsPerDay <= 3 ? 'Larger, more filling meals' :
           state.mealsPerDay <= 4 ? 'Balanced meal frequency' :
           'Smaller, more frequent meals'}
        </Text>
      </GlassSection>

      {/* Intermittent Fasting */}
      <GlassSection isDark={isDark}>
        <View style={styles.fastingHeader}>
          <View style={styles.fastingInfo}>
            <Clock size={20} color={colors.textSecondary} />
            <View style={styles.fastingTextContainer}>
              <Text style={[styles.fastingTitle, { color: colors.text }]}>Intermittent Fasting</Text>
              <Text style={[styles.fastingSubtitle, { color: colors.textMuted }]}>Restrict eating to a time window</Text>
            </View>
          </View>
          <Switch
            value={state.intermittentFasting}
            onValueChange={handleFastingToggle}
            trackColor={{ false: colors.border, true: Colors.successMuted }}
            thumbColor={colors.primary}
          />
        </View>

        {showFastingOptions && (
          <View
            style={styles.fastingOptions}
          >
            <Text style={[styles.presetsLabel, { color: colors.textMuted }]}>Quick Presets</Text>
            <View style={styles.fastingPresets}>
              {FASTING_PRESETS.map((preset) => {
                const isSelected =
                  state.fastingStart === preset.start && state.fastingEnd === preset.end;
                const selectedBg = isSelected
                  ? (isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)')
                  : undefined;

                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={styles.presetChipWrapper}
                    onPress={() => selectFastingPreset(preset.start, preset.end)}
                    activeOpacity={0.7}
                    accessibilityLabel={`${preset.label} fasting: ${preset.start} to ${preset.end}, ${preset.description}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityHint="Sets your intermittent fasting window"
                  >
                    <GlassCard
                      style={[
                        styles.presetChip,
                        isSelected && { backgroundColor: selectedBg }
                      ]}
                      interactive
                    >
                      <NumberText weight="light" style={[styles.presetLabel, { color: colors.text }, isSelected && styles.presetLabelSelected]}>
                        {preset.label}
                      </NumberText>
                      <Text style={[styles.presetDesc, { color: colors.textMuted }]}>
                        {preset.description}
                      </Text>
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </View>
            <GlassCard style={styles.windowDisplay} interactive>
              <View style={styles.windowTime}>
                <Text style={[styles.windowLabel, { color: colors.textMuted }]}>Eating Window</Text>
                <NumberText weight="light" style={[styles.windowValue, { color: colors.primary }]}>
                  {state.fastingStart} - {state.fastingEnd}
                </NumberText>
              </View>
            </GlassCard>
          </View>
        )}
      </GlassSection>

      {/* Allergies & Restrictions */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>ALLERGIES & RESTRICTIONS</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Select any foods you need to avoid (optional)
        </Text>
        <View style={styles.allergyGrid}>
          {ALLERGIES.map((allergy) => {
            const isSelected = state.allergies.includes(allergy);
            const selectedBg = isSelected
              ? (isDark ? 'rgba(255, 107, 107, 0.18)' : 'rgba(255, 107, 107, 0.15)')
              : undefined;

            return (
              <TouchableOpacity
                key={allergy}
                onPress={() => toggleAllergy(allergy)}
                activeOpacity={0.7}
                accessibilityLabel={`${allergy}${isSelected ? ', selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={`Toggle ${allergy} allergy or restriction`}
              >
                <GlassCard
                  style={[
                    styles.allergyChip,
                    isSelected && { backgroundColor: selectedBg }
                  ]}
                  interactive
                >
                  <Text style={[styles.allergyText, { color: colors.text }, isSelected && styles.allergyTextSelected]}>
                    {allergy}
                  </Text>
                  {isSelected && (
                    <XCircle size={16} color={Colors.error} />
                  )}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassSection>

      {/* Meal Variety */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>MEAL VARIETY</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Different meals daily or meal prep friendly?
        </Text>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={async () => { await selectionFeedback(); setMealDiversity('diverse'); }}
            activeOpacity={0.7}
            accessibilityLabel="Diverse daily meals"
            accessibilityRole="button"
            accessibilityState={{ selected: mealDiversity === 'diverse' }}
            accessibilityHint="Different meals each day for variety"
          >
            <GlassCard
              style={[
                styles.optionButton,
                mealDiversity === 'diverse' && { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)' }
              ]}
              interactive
            >
              <Shuffle size={20} color={mealDiversity === 'diverse' ? Colors.successMuted : colors.textMuted} style={{ marginBottom: 4 }} />
              <Text style={[styles.optionButtonText, { color: colors.text }, mealDiversity === 'diverse' && { color: Colors.successMuted }]}>Diverse daily</Text>
            </GlassCard>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={async () => { await selectionFeedback(); setMealDiversity('sameDaily'); }}
            activeOpacity={0.7}
            accessibilityLabel="Same meals for meal prep"
            accessibilityRole="button"
            accessibilityState={{ selected: mealDiversity === 'sameDaily' }}
            accessibilityHint="Repeat the same meals daily for easier meal preparation"
          >
            <GlassCard
              style={[
                styles.optionButton,
                mealDiversity === 'sameDaily' && { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)' }
              ]}
              interactive
            >
              <Repeat size={20} color={mealDiversity === 'sameDaily' ? Colors.successMuted : colors.textMuted} style={{ marginBottom: 4 }} />
              <Text style={[styles.optionButtonText, { color: colors.text }, mealDiversity === 'sameDaily' && { color: Colors.successMuted }]}>Same meals (prep)</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </GlassSection>

      {/* Snack Preferences */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>SNACK PREFERENCES</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Include snacks or stick to main meals?
        </Text>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={async () => { await selectionFeedback(); setMealStyle('threePlusSnacks'); }}
            activeOpacity={0.7}
            accessibilityLabel="3 meals plus snacks"
            accessibilityRole="button"
            accessibilityState={{ selected: mealStyle === 'threePlusSnacks' }}
            accessibilityHint="Include snacks between main meals"
          >
            <GlassCard
              style={[
                styles.optionButton,
                mealStyle === 'threePlusSnacks' && { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)' }
              ]}
              interactive
            >
              <Coffee size={20} color={mealStyle === 'threePlusSnacks' ? Colors.successMuted : colors.textMuted} style={{ marginBottom: 4 }} />
              <Text style={[styles.optionButtonText, { color: colors.text }, mealStyle === 'threePlusSnacks' && { color: Colors.successMuted }]}>3 meals + snacks</Text>
            </GlassCard>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={async () => { await selectionFeedback(); setMealStyle('fewerLarger'); }}
            activeOpacity={0.7}
            accessibilityLabel="Fewer larger meals"
            accessibilityRole="button"
            accessibilityState={{ selected: mealStyle === 'fewerLarger' }}
            accessibilityHint="Eat fewer but more filling meals without snacks"
          >
            <GlassCard
              style={[
                styles.optionButton,
                mealStyle === 'fewerLarger' && { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)' }
              ]}
              interactive
            >
              <UtensilsCrossed size={20} color={mealStyle === 'fewerLarger' ? Colors.successMuted : colors.textMuted} style={{ marginBottom: 4 }} />
              <Text style={[styles.optionButtonText, { color: colors.text }, mealStyle === 'fewerLarger' && { color: Colors.successMuted }]}>Fewer, larger meals</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </GlassSection>

      {/* Cheat Days */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>CHEAT DAYS</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Select days when you want flexibility (no meal plan generated)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cheatDaysContainer}
        >
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
            const isSelected = cheatDays.includes(day);
            const shortDay = day.slice(0, 3); // Sun, Mon, Tue, etc.
            return (
              <TouchableOpacity
                key={day}
                onPress={() => toggleFoodItem(cheatDays, setCheatDays, day)}
                activeOpacity={0.7}
                accessibilityLabel={`${day}${isSelected ? ', cheat day selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={`Toggle ${day} as a cheat day with no meal plan`}
              >
                <GlassCard
                  style={[
                    styles.cheatDayChip,
                    isSelected && { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.20)' : 'rgba(251, 191, 36, 0.18)' }
                  ]}
                  interactive
                >
                  {isSelected && <Pizza size={14} color={Colors.warning} />}
                  <Text style={[styles.cheatDayText, { color: colors.text }, isSelected && { color: Colors.warning }]}>
                    {shortDay}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {cheatDays.length > 0 && (
          <Text style={[styles.cheatDaysHint, { color: colors.textMuted }]}>
            <NumberText weight="light" style={[styles.cheatDaysHint, { color: colors.textMuted }]}>
              {cheatDays.length}
            </NumberText>
            {' cheat day'}{cheatDays.length > 1 ? 's' : ''} selected - enjoy mindfully!
          </Text>
        )}
      </GlassSection>

      {/* Favorite Proteins */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>FAVORITE PROTEINS</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Select proteins you enjoy</Text>
        <View style={styles.foodChipsContainer}>
          {PROTEIN_OPTIONS.map((protein) => {
            const isSelected = proteins.includes(protein);
            return (
              <TouchableOpacity
                key={protein}
                onPress={() => toggleFoodItem(proteins, setProteins, protein)}
                activeOpacity={0.7}
                accessibilityLabel={`${protein}${isSelected ? ', selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={`Toggle ${protein} as a favorite protein`}
              >
                <GlassCard
                  style={[styles.foodChip, isSelected && { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)' }]}
                  interactive
                >
                  <Text style={[styles.foodChipText, { color: colors.text }, isSelected && { color: Colors.successMuted }]}>{protein}</Text>
                  {isSelected && <CheckCircle2 size={16} color={Colors.successMuted} style={{ marginLeft: 4 }} />}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassSection>

      {/* Favorite Vegetables */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>FAVORITE VEGETABLES</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Select vegetables you enjoy</Text>
        <View style={styles.foodChipsContainer}>
          {VEGETABLE_OPTIONS.map((veg) => {
            const isSelected = vegetables.includes(veg);
            return (
              <TouchableOpacity
                key={veg}
                onPress={() => toggleFoodItem(vegetables, setVegetables, veg)}
                activeOpacity={0.7}
                accessibilityLabel={`${veg}${isSelected ? ', selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={`Toggle ${veg} as a favorite vegetable`}
              >
                <GlassCard
                  style={[styles.foodChip, isSelected && { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)' }]}
                  interactive
                >
                  <Text style={[styles.foodChipText, { color: colors.text }, isSelected && { color: Colors.successMuted }]}>{veg}</Text>
                  {isSelected && <CheckCircle2 size={16} color={Colors.successMuted} style={{ marginLeft: 4 }} />}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassSection>

      {/* Favorite Starches */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>FAVORITE CARBS & STARCHES</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Select starches you enjoy</Text>
        <View style={styles.foodChipsContainer}>
          {STARCH_OPTIONS.map((starch) => {
            const isSelected = starches.includes(starch);
            return (
              <TouchableOpacity
                key={starch}
                onPress={() => toggleFoodItem(starches, setStarches, starch)}
                activeOpacity={0.7}
                accessibilityLabel={`${starch}${isSelected ? ', selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={`Toggle ${starch} as a favorite starch`}
              >
                <GlassCard
                  style={[styles.foodChip, isSelected && { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)' }]}
                  interactive
                >
                  <Text style={[styles.foodChipText, { color: colors.text }, isSelected && { color: Colors.successMuted }]}>{starch}</Text>
                  {isSelected && <CheckCircle2 size={16} color={Colors.successMuted} style={{ marginLeft: 4 }} />}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassSection>

      {/* Favorite Snacks */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>FAVORITE SNACKS</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Select snacks you enjoy</Text>
        <View style={styles.foodChipsContainer}>
          {SNACK_OPTIONS.map((snack) => {
            const isSelected = snacks.includes(snack);
            return (
              <TouchableOpacity
                key={snack}
                onPress={() => toggleFoodItem(snacks, setSnacks, snack)}
                activeOpacity={0.7}
                accessibilityLabel={`${snack}${isSelected ? ', selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={`Toggle ${snack} as a favorite snack`}
              >
                <GlassCard
                  style={[styles.foodChip, isSelected && { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)' }]}
                  interactive
                >
                  <Text style={[styles.foodChipText, { color: colors.text }, isSelected && { color: Colors.successMuted }]}>{snack}</Text>
                  {isSelected && <CheckCircle2 size={16} color={Colors.successMuted} style={{ marginLeft: 4 }} />}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassSection>

      {/* Favorite Cuisines */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>FAVORITE CUISINES</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Cuisines you enjoy most</Text>
        <View style={styles.foodChipsContainer}>
          {CUISINE_OPTIONS.map((cuisine) => {
            const isSelected = cuisines.includes(cuisine);
            return (
              <TouchableOpacity
                key={cuisine}
                onPress={() => toggleFoodItem(cuisines, setCuisines, cuisine)}
                activeOpacity={0.7}
                accessibilityLabel={`${cuisine}${isSelected ? ', selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={`Toggle ${cuisine} as a favorite cuisine`}
              >
                <GlassCard
                  style={[styles.foodChip, isSelected && { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)' }]}
                  interactive
                >
                  <Text style={[styles.foodChipText, { color: colors.text }, isSelected && { color: Colors.successMuted }]}>{cuisine}</Text>
                  {isSelected && <CheckCircle2 size={16} color={Colors.successMuted} style={{ marginLeft: 4 }} />}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassSection>

      {/* Disliked Foods */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>DISLIKED FOODS</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Foods to avoid in your meal plans</Text>
        <View style={styles.foodChipsContainer}>
          {DISLIKED_OPTIONS.map((food) => {
            const isSelected = disliked.includes(food);
            return (
              <TouchableOpacity
                key={food}
                onPress={() => toggleFoodItem(disliked, setDisliked, food)}
                activeOpacity={0.7}
                accessibilityLabel={`${food}${isSelected ? ', disliked' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={`Toggle ${food} as a disliked food to avoid`}
              >
                <GlassCard
                  style={[styles.foodChip, isSelected && { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.18)' : 'rgba(249, 115, 22, 0.15)' }]}
                  interactive
                >
                  <Text style={[styles.foodChipText, { color: colors.text }, isSelected && { color: '#f97316' }]}>{food}</Text>
                  {isSelected && <XCircle size={16} color="#f97316" style={{ marginLeft: 4 }} />}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
        <GlassCard style={styles.textInputContainer} interactive>
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Add other foods to avoid (comma separated)"
            placeholderTextColor={colors.textMuted}
            value={hatedFoodsText}
            onChangeText={setHatedFoodsText}
            multiline
          />
        </GlassCard>
      </GlassSection>

      {/* Cooking Skill */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>COOKING SKILL LEVEL</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Help us tailor recipe complexity to your experience
        </Text>
        <View style={styles.skillButtonsContainer}>
          {[
            { value: 'beginner', label: 'Beginner', icon: Egg, description: 'Simple recipes' },
            { value: 'intermediate', label: 'Intermediate', icon: UtensilsCrossed, description: 'Moderate recipes' },
            { value: 'advanced', label: 'Advanced', icon: Flame, description: 'Complex recipes' },
          ].map((option) => {
            const isSelected = cookingSkill === option.value;
            const IconComponent = option.icon;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={async () => {
                  await selectionFeedback();
                  setCookingSkill(option.value as any);
                }}
                activeOpacity={0.7}
                style={{ flex: 1 }}
                accessibilityLabel={`${option.label}: ${option.description}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={`Select ${option.label} cooking skill level`}
              >
                <GlassCard
                  style={[
                    styles.skillButton,
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(150, 206, 180, 0.18)' : 'rgba(150, 206, 180, 0.15)',
                    },
                  ]}
                  interactive
                >
                  <IconComponent
                    size={24}
                    color={isSelected ? Colors.successMuted : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.skillButtonLabel,
                      { color: colors.text },
                      isSelected && { color: Colors.successMuted },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[styles.skillButtonDescription, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {option.description}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassSection>

      {/* Daily Goals */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>DAILY GOALS</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Customize your daily health targets
        </Text>

        {/* Water Goal */}
        <View style={styles.dailyGoalRow}>
          <View style={styles.dailyGoalInfo}>
            <Droplet size={24} color={colors.primary} />
            <View style={styles.dailyGoalTextContainer}>
              <Text style={[styles.dailyGoalLabel, { color: colors.text }]}>Water Intake</Text>
              <Text style={[styles.dailyGoalHint, { color: colors.textMuted }]}>Daily hydration goal</Text>
            </View>
          </View>
          <View style={styles.dailyGoalControls}>
            <TouchableOpacity
              onPress={async () => {
                await selectionFeedback();
                setWaterGoalOz(Math.max(32, state.waterGoalOz - 8));
              }}
              style={styles.dailyGoalButton}
              accessibilityLabel="Decrease water goal"
              accessibilityRole="button"
              accessibilityHint="Decreases daily water intake goal by 8 ounces"
            >
              <MinusCircle size={28} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={[styles.dailyGoalValue, { color: colors.primary }]}>
              <NumberText weight="light" style={[styles.dailyGoalValue, { color: colors.primary }]}>
                {state.waterGoalOz}
              </NumberText>
              {' oz'}
            </Text>
            <TouchableOpacity
              onPress={async () => {
                await selectionFeedback();
                setWaterGoalOz(Math.min(160, state.waterGoalOz + 8));
              }}
              style={styles.dailyGoalButton}
              accessibilityLabel="Increase water goal"
              accessibilityRole="button"
              accessibilityHint="Increases daily water intake goal by 8 ounces"
            >
              <PlusCircle size={28} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sleep Goal */}
        <View style={styles.dailyGoalRow}>
          <View style={styles.dailyGoalInfo}>
            <Moon size={24} color={colors.primary} />
            <View style={styles.dailyGoalTextContainer}>
              <Text style={[styles.dailyGoalLabel, { color: colors.text }]}>Sleep Duration</Text>
              <Text style={[styles.dailyGoalHint, { color: colors.textMuted }]}>Nightly sleep target</Text>
            </View>
          </View>
          <View style={styles.dailyGoalControls}>
            <TouchableOpacity
              onPress={async () => {
                await selectionFeedback();
                setSleepGoalHours(Math.max(5, state.sleepGoalHours - 0.5));
              }}
              style={styles.dailyGoalButton}
              accessibilityLabel="Decrease sleep goal"
              accessibilityRole="button"
              accessibilityHint="Decreases nightly sleep target by 30 minutes"
            >
              <MinusCircle size={28} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={[styles.dailyGoalValue, { color: colors.primary }]}>
              <NumberText weight="light" style={[styles.dailyGoalValue, { color: colors.primary }]}>
                {state.sleepGoalHours}
              </NumberText>
              {' hrs'}
            </Text>
            <TouchableOpacity
              onPress={async () => {
                await selectionFeedback();
                setSleepGoalHours(Math.min(12, state.sleepGoalHours + 0.5));
              }}
              style={styles.dailyGoalButton}
              accessibilityLabel="Increase sleep goal"
              accessibilityRole="button"
              accessibilityHint="Increases nightly sleep target by 30 minutes"
            >
              <PlusCircle size={28} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Step Goal */}
        <View style={styles.dailyGoalRow}>
          <View style={styles.dailyGoalInfo}>
            <Footprints size={24} color={colors.primary} />
            <View style={styles.dailyGoalTextContainer}>
              <Text style={[styles.dailyGoalLabel, { color: colors.text }]}>Daily Steps</Text>
              <Text style={[styles.dailyGoalHint, { color: colors.textMuted }]}>Activity target</Text>
            </View>
          </View>
          <View style={styles.dailyGoalControls}>
            <TouchableOpacity
              onPress={async () => {
                await selectionFeedback();
                setStepGoal(Math.max(2000, state.stepGoal - 1000));
              }}
              style={styles.dailyGoalButton}
              accessibilityLabel="Decrease step goal"
              accessibilityRole="button"
              accessibilityHint="Decreases daily step target by 1000 steps"
            >
              <MinusCircle size={28} color={colors.textMuted} />
            </TouchableOpacity>
            <NumberText weight="light" style={[styles.dailyGoalValue, { color: colors.primary }]}>
              {(state.stepGoal / 1000).toFixed(0)}k
            </NumberText>
            <TouchableOpacity
              onPress={async () => {
                await selectionFeedback();
                setStepGoal(Math.min(30000, state.stepGoal + 1000));
              }}
              style={styles.dailyGoalButton}
              accessibilityLabel="Increase step goal"
              accessibilityRole="button"
              accessibilityHint="Increases daily step target by 1000 steps"
            >
              <PlusCircle size={28} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassSection>

      {/* Bottom Spacing - extra space to prevent blending with buttons */}
      <View style={{ height: 180 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
            accessibilityRole="button"
            accessibilityHint="Returns to previous step"
          >
            <GlassCard style={styles.backButton} interactive>
              <Icon name="hand-point-left" size={24} color={colors.text} solid />
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.7}
            accessibilityLabel="Continue"
            accessibilityRole="button"
            accessibilityHint="Saves nutrition preferences and proceeds to next step"
          >
            <GlassCard style={[styles.continueButton, { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)' }]} interactive>
              <Icon name="hand-point-right" size={24} color={colors.primary} solid />
            </GlassCard>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  subtitle: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  subtitleText: {
    fontSize: 11,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 16,
    textAlign: 'center',
  },
  glassSection: {
    marginBottom: 24,
    marginHorizontal: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1.5,
    color: Colors.text,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
    marginBottom: 12,
    marginTop: -4,
  },
  dietGrid: {
    gap: 8,
  },
  dietCard: {
    width: '100%',
  },
  dietCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0, // GlassCard provides padding
  },
  dietIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dietIconSelected: {
    backgroundColor: 'rgba(150, 206, 180, 0.2)',
  },
  dietContent: {
    flex: 1,
  },
  dietTitle: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 2,
  },
  dietTitleSelected: {
    color: Colors.successMuted,
  },
  dietDescription: {
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
  },
  mealsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  mealChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0, // Critical: override GlassCard's default padding
  },
  mealChipText: {
    fontSize: 20,
    fontWeight: '100',
    color: Colors.text,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 20,
  },
  mealChipTextSelected: {
    // Removed solid white - now stays normal text color with translucent bg
  },
  mealsHint: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fastingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fastingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fastingTextContainer: {
    gap: 2,
  },
  fastingTitle: {
    fontSize: 15,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
  },
  fastingSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
  },
  fastingOptions: {
    marginTop: 16,
    paddingTop: 16,
  },
  presetsLabel: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.textMuted,
    marginBottom: 10,
  },
  fastingPresets: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChipWrapper: {
    flex: 1,
  },
  presetChip: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '100',
    color: Colors.text,
  },
  presetLabelSelected: {
    color: Colors.successMuted,
  },
  presetDesc: {
    fontSize: 10,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
    marginTop: 2,
  },
  windowDisplay: {
    marginTop: 16,
    alignItems: 'center',
  },
  windowTime: {
    alignItems: 'center',
  },
  windowLabel: {
    fontSize: 11,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  windowValue: {
    fontSize: 20,
    fontWeight: '100',
    marginTop: 4,
  },
  allergyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  allergyText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
  },
  allergyTextSelected: {
    color: Colors.error,
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
  foodChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  foodChipText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200',
  },
  cheatDaysContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  cheatDayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 56,
  },
  cheatDayText: {
    fontSize: 11,
    fontFamily: Fonts.light,
    fontWeight: '200',
  },
  cheatDaysHint: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: Fonts.light,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  textInputContainer: {
    marginTop: 12,
    padding: 0,
  },
  textInput: {
    padding: 12,
    fontSize: 14,
    fontFamily: Fonts.light,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  skillButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  skillButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    height: 110, // Fixed height for consistency
  },
  skillButtonLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginTop: 8,
    textAlign: 'center',
    width: '100%', // Ensure label takes full width
  },
  skillButtonDescription: {
    fontSize: 11,
    fontFamily: Fonts.light,
    marginTop: 4,
    textAlign: 'center',
    width: '100%', // Ensure description takes full width
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
    color: Colors.text,
  },
  continueButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
    color: Colors.primaryText,
  },
  // Daily Goals styles
  dailyGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dailyGoalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dailyGoalTextContainer: {
    gap: 2,
  },
  dailyGoalLabel: {
    fontSize: 15,
    fontFamily: Fonts.light,
    fontWeight: '200',
  },
  dailyGoalHint: {
    fontSize: 12,
    fontFamily: Fonts.light,
  },
  dailyGoalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyGoalButton: {
    padding: 4,
  },
  dailyGoalValue: {
    fontSize: 18,
    fontFamily: Fonts.light,
    fontWeight: '100',
    minWidth: 60,
    textAlign: 'center',
  },
});
