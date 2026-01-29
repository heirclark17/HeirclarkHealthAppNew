import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { GlassCard } from '../GlassCard';
import { useGoalWizard, DietStyle } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { lightImpact, selectionFeedback } from '../../utils/haptics';

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
  icon: keyof typeof Ionicons.glyphMap;
}

const DIET_OPTIONS: DietOption[] = [
  { id: 'standard', title: 'Standard', description: 'Balanced macros', icon: 'nutrition-outline' },
  { id: 'keto', title: 'Keto', description: 'Low carb, high fat', icon: 'egg-outline' },
  { id: 'high_protein', title: 'High Protein', description: 'Muscle focused', icon: 'barbell-outline' },
  { id: 'vegetarian', title: 'Vegetarian', description: 'No meat', icon: 'leaf-outline' },
  { id: 'vegan', title: 'Vegan', description: 'Plant-based only', icon: 'flower-outline' },
  { id: 'custom', title: 'Custom', description: 'Set your own', icon: 'create-outline' },
];

const ALLERGIES = [
  'Dairy', 'Gluten', 'Nuts', 'Soy', 'Eggs', 'Shellfish', 'Fish', 'Wheat'
];

const FASTING_PRESETS = [
  { label: '16:8', start: '12:00', end: '20:00', description: 'Most popular' },
  { label: '18:6', start: '14:00', end: '20:00', description: 'Intermediate' },
  { label: '20:4', start: '16:00', end: '20:00', description: 'Advanced' },
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

  return (
    <TouchableOpacity
      onPress={async () => {
        await selectionFeedback();
        onSelect();
      }}
      activeOpacity={0.7}
    >
      <GlassCard style={[styles.dietCard, isSelected && { backgroundColor: selectedBg }]} interactive>
        <View style={styles.dietCardInner}>
          <View style={[styles.dietIcon, isSelected && styles.dietIconSelected]}>
            <Ionicons
              name={option.icon}
              size={22}
              color={isSelected ? '#96CEB4' : colors.textMuted}
            />
          </View>
          <View style={styles.dietContent}>
            <Text style={[styles.dietTitle, { color: colors.text }, isSelected && styles.dietTitleSelected]}>
              {option.title}
            </Text>
            <Text style={[styles.dietDescription, { color: colors.textMuted }]}>{option.description}</Text>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={20} color="#96CEB4" />
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
  } = useGoalWizard();
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const [showFastingOptions, setShowFastingOptions] = useState(state.intermittentFasting);

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
    onNext();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Nutrition Preferences</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Customize your meal plan to match your lifestyle and dietary needs.
        </Text>
      </View>

      {/* Diet Style Selection */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DIET STYLE</Text>
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
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MEALS PER DAY</Text>
        <View style={styles.mealsRow}>
          {[2, 3, 4, 5, 6].map((num) => {
            const isSelected = state.mealsPerDay === num;
            const selectedBg = isSelected ? '#96CEB4' : undefined;

            return (
              <TouchableOpacity
                key={num}
                onPress={async () => {
                  await selectionFeedback();
                  setMealsPerDay(num);
                }}
              >
                <GlassCard
                  style={[
                    styles.mealChip,
                    isSelected && { backgroundColor: selectedBg }
                  ]}
                  interactive
                >
                  <Text
                    style={[
                      styles.mealChipText,
                      { color: colors.text },
                      isSelected && styles.mealChipTextSelected,
                    ]}
                  >
                    {num}
                  </Text>
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
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <View style={styles.fastingTextContainer}>
              <Text style={[styles.fastingTitle, { color: colors.text }]}>Intermittent Fasting</Text>
              <Text style={[styles.fastingSubtitle, { color: colors.textMuted }]}>Restrict eating to a time window</Text>
            </View>
          </View>
          <Switch
            value={state.intermittentFasting}
            onValueChange={handleFastingToggle}
            trackColor={{ false: colors.border, true: '#96CEB4' }}
            thumbColor={colors.primary}
          />
        </View>

        {showFastingOptions && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            layout={Layout.springify()}
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
                  >
                    <GlassCard
                      style={[
                        styles.presetChip,
                        isSelected && { backgroundColor: selectedBg }
                      ]}
                      interactive
                    >
                      <Text style={[styles.presetLabel, { color: colors.text }, isSelected && styles.presetLabelSelected]}>
                        {preset.label}
                      </Text>
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
                <Text style={[styles.windowValue, { color: colors.primary }]}>
                  {state.fastingStart} - {state.fastingEnd}
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}
      </GlassSection>

      {/* Allergies & Restrictions */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ALLERGIES & RESTRICTIONS</Text>
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
                    <Ionicons name="close-circle" size={16} color="#FF6B6B" />
                  )}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassSection>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={{ flex: 1 }}>
          <GlassCard style={styles.backButton} interactive>
            <Text style={[styles.backButtonText, { color: colors.text }]}>BACK</Text>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleContinue} activeOpacity={0.7} style={{ flex: 2 }}>
          <GlassCard style={[styles.continueButton, { backgroundColor: isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)' }]} interactive>
            <Text style={[styles.continueButtonText, { color: colors.primary }]}>CONTINUE</Text>
          </GlassCard>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  glassSection: {
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1.5,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginBottom: 12,
    marginTop: -4,
  },
  dietGrid: {
    gap: 10,
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
    color: '#96CEB4',
  },
  dietDescription: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  mealsRow: {
    flexDirection: 'row',
    gap: 10,
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
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 20,
  },
  mealChipTextSelected: {
    color: '#000',
  },
  mealsHint: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
  },
  fastingSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
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
    gap: 10,
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
    fontFamily: Fonts.light,
    fontWeight: '100',
    color: Colors.text,
  },
  presetLabelSelected: {
    color: '#96CEB4',
  },
  presetDesc: {
    fontSize: 10,
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.light,
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
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  allergyText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
  },
  allergyTextSelected: {
    color: '#FF6B6B',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
    color: Colors.text,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    letterSpacing: 1,
    color: Colors.primaryText,
  },
});
