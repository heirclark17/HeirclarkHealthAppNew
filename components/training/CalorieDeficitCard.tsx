import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Apple, Flame, Droplet, TrendingDown } from 'lucide-react-native';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { NutritionGuidance } from '../../types/training';

interface CalorieDeficitCardProps {
  nutrition: NutritionGuidance;
  isDark: boolean;
}

/**
 * Extremely detailed nutrition guidance card
 * Shows: calories, deficit, macros, meal timing, hydration, meal examples, tips
 */
export function CalorieDeficitCard({ nutrition, isDark }: CalorieDeficitCardProps) {
  const colors = isDark ? DarkColors : LightColors;

  // Defensive: Provide default values if data is missing
  const safeNutrition = {
    dailyCalories: nutrition?.dailyCalories || 2000,
    deficit: nutrition?.deficit || 500,
    proteinGrams: nutrition?.proteinGrams || 150,
    carbsGrams: nutrition?.carbsGrams || 200,
    fatGrams: nutrition?.fatGrams || 65,
    mealTiming: nutrition?.mealTiming || '3-4 meals per day',
    hydration: nutrition?.hydration || 'Drink 8-10 glasses of water daily',
    preworkoutNutrition: nutrition?.preworkoutNutrition,
    postworkoutNutrition: nutrition?.postworkoutNutrition,
    supplementRecommendations: nutrition?.supplementRecommendations,
    mealExamples: nutrition?.mealExamples || {
      breakfast: 'Balanced breakfast',
      lunch: 'Lean protein with vegetables',
      dinner: 'Healthy dinner option',
      snacks: ['Fruits', 'Nuts'],
    },
    tips: nutrition?.tips || [],
    deficitStrategy: nutrition?.deficitStrategy,
    progressMonitoring: nutrition?.progressMonitoring,
  };

  return (
    <GlassCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Apple size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Nutrition Guidance
        </Text>
      </View>

      {/* Calorie Deficit Banner */}
      <View style={[styles.deficitBanner, { backgroundColor: `${colors.primary}15` }]}>
        <TrendingDown size={20} color={colors.primary} />
        <View style={styles.deficitInfo}>
          <Text style={[styles.deficitLabel, { color: colors.textMuted }]}>
            Daily Calorie Deficit
          </Text>
          <View style={styles.deficitRow}>
            <NumberText style={[styles.deficitValue, { color: colors.primary }]}>
              -{safeNutrition.deficit}
            </NumberText>
            <Text style={[styles.deficitUnit, { color: colors.primary }]}>cal</Text>
            <Text style={[styles.deficitResult, { color: colors.textMuted }]}>
              = ~{Math.round(safeNutrition.deficit * 7 / 3500)} lb/week
            </Text>
          </View>
        </View>
      </View>

      {/* Daily Calories */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          DAILY CALORIE TARGET
        </Text>
        <View style={styles.calorieRow}>
          <Flame size={20} color={colors.primary} />
          <NumberText style={[styles.calorieValue, { color: colors.text }]}>
            {safeNutrition.dailyCalories}
          </NumberText>
          <Text style={[styles.calorieUnit, { color: colors.text }]}>calories/day</Text>
        </View>
      </View>

      {/* Macros */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          MACRO BREAKDOWN
        </Text>
        <View style={styles.macroGrid}>
          {/* Protein */}
          <View style={styles.macroItem}>
            <Text style={[styles.macroName, { color: colors.textMuted }]}>Protein</Text>
            <View style={styles.macroValueRow}>
              <NumberText style={[styles.macroValue, { color: colors.text }]}>
                {safeNutrition.proteinGrams}
              </NumberText>
              <Text style={[styles.macroUnit, { color: colors.textMuted }]}>g</Text>
            </View>
            <Text style={[styles.macroCalories, { color: colors.textMuted }]}>
              <NumberText>{safeNutrition.proteinGrams * 4}</NumberText> cal
            </Text>
          </View>

          {/* Carbs */}
          <View style={styles.macroItem}>
            <Text style={[styles.macroName, { color: colors.textMuted }]}>Carbs</Text>
            <View style={styles.macroValueRow}>
              <NumberText style={[styles.macroValue, { color: colors.text }]}>
                {safeNutrition.carbsGrams}
              </NumberText>
              <Text style={[styles.macroUnit, { color: colors.textMuted }]}>g</Text>
            </View>
            <Text style={[styles.macroCalories, { color: colors.textMuted }]}>
              <NumberText>{safeNutrition.carbsGrams * 4}</NumberText> cal
            </Text>
          </View>

          {/* Fat */}
          <View style={styles.macroItem}>
            <Text style={[styles.macroName, { color: colors.textMuted }]}>Fat</Text>
            <View style={styles.macroValueRow}>
              <NumberText style={[styles.macroValue, { color: colors.text }]}>
                {safeNutrition.fatGrams}
              </NumberText>
              <Text style={[styles.macroUnit, { color: colors.textMuted }]}>g</Text>
            </View>
            <Text style={[styles.macroCalories, { color: colors.textMuted }]}>
              <NumberText>{safeNutrition.fatGrams * 9}</NumberText> cal
            </Text>
          </View>
        </View>
      </View>

      {/* Meal Timing */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          MEAL TIMING
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {safeNutrition.mealTiming}
        </Text>
      </View>

      {/* Hydration */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          HYDRATION
        </Text>
        <View style={styles.hydrationRow}>
          <Droplet size={18} color={colors.primary} />
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {safeNutrition.hydration}
          </Text>
        </View>
      </View>

      {/* Workout Nutrition */}
      {safeNutrition.preworkoutNutrition && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            PRE-WORKOUT NUTRITION
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {safeNutrition.preworkoutNutrition}
          </Text>
        </View>
      )}

      {safeNutrition.postworkoutNutrition && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            POST-WORKOUT NUTRITION
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {safeNutrition.postworkoutNutrition}
          </Text>
        </View>
      )}

      {/* Meal Examples */}
      {safeNutrition.mealExamples && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            MEAL EXAMPLES
          </Text>

          <View style={styles.mealExample}>
            <Text style={[styles.mealName, { color: colors.text }]}>Breakfast:</Text>
            <Text style={[styles.mealDescription, { color: colors.textSecondary }]}>
              {safeNutrition.mealExamples.breakfast}
            </Text>
          </View>

          <View style={styles.mealExample}>
            <Text style={[styles.mealName, { color: colors.text }]}>Lunch:</Text>
            <Text style={[styles.mealDescription, { color: colors.textSecondary }]}>
              {safeNutrition.mealExamples.lunch}
            </Text>
          </View>

          <View style={styles.mealExample}>
            <Text style={[styles.mealName, { color: colors.text }]}>Dinner:</Text>
            <Text style={[styles.mealDescription, { color: colors.textSecondary }]}>
              {safeNutrition.mealExamples.dinner}
            </Text>
          </View>

          {safeNutrition.mealExamples.snacks && safeNutrition.mealExamples.snacks.length > 0 && (
            <View style={styles.mealExample}>
              <Text style={[styles.mealName, { color: colors.text }]}>Snacks:</Text>
              {safeNutrition.mealExamples.snacks.map((snack, index) => (
                <Text key={index} style={[styles.mealDescription, { color: colors.textSecondary }]}>
                  • {snack}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Tips */}
      {safeNutrition.tips && safeNutrition.tips.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            NUTRITION TIPS
          </Text>
          {safeNutrition.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Deficit Strategy */}
      {safeNutrition.deficitStrategy && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            SUSTAINABLE DEFICIT STRATEGY
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {safeNutrition.deficitStrategy}
          </Text>
        </View>
      )}

      {/* Progress Monitoring */}
      {safeNutrition.progressMonitoring && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            TRACKING YOUR PROGRESS
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {safeNutrition.progressMonitoring}
          </Text>
        </View>
      )}

      {/* Supplements (if provided) */}
      {safeNutrition.supplementRecommendations && safeNutrition.supplementRecommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            SUPPLEMENT RECOMMENDATIONS (OPTIONAL)
          </Text>
          {safeNutrition.supplementRecommendations.map((supplement, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {supplement}
              </Text>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
  },
  deficitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  deficitInfo: {
    flex: 1,
  },
  deficitLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  deficitRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  deficitValue: {
    fontSize: 28,
    fontFamily: Fonts.numericBold,
  },
  deficitUnit: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  deficitResult: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginLeft: 6,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  calorieValue: {
    fontSize: 32,
    fontFamily: Fonts.numericBold,
  },
  calorieUnit: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.md,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroName: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  macroValue: {
    fontSize: 24,
    fontFamily: Fonts.numericBold,
  },
  macroUnit: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  macroCalories: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  hydrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  mealExample: {
    marginBottom: Spacing.sm,
  },
  mealName: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  mealDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  bulletPoint: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
});
