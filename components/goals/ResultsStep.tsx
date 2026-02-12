import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle2, Check } from 'lucide-react-native';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { CalculatedResults, GoalType } from '../../constants/goals';
import { RoundedNumeral } from '../RoundedNumeral';
import { NumberText } from '../NumberText';
import { useSettings } from '../../contexts/SettingsContext';

interface ResultsStepProps {
  results: CalculatedResults;
  goalType: GoalType;
  currentWeight: number;
  targetWeight: number;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function ResultsStep({
  results,
  goalType,
  currentWeight,
  targetWeight,
  onBack,
  onSave,
  isSaving,
}: ResultsStepProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware backgrounds
  const cardBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.95)';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Main Calorie Target Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Your Daily Targets</Text>

        <View style={styles.resultMain}>
          <RoundedNumeral
            value={results.calories}
            size="large"
            style={[styles.calorieValue, { color: colors.text }]}
            showCommas={true}
            decimals={0}
          />
          <Text style={[styles.calorieLabel, { color: colors.textMuted }]}>Calories per Day</Text>
        </View>

        <View style={[styles.macrosContainer, { borderColor: colors.border }]}>
          <View style={styles.macro}>
            <RoundedNumeral
              value={results.protein}
              size="medium"
              style={[styles.macroValue, { color: colors.text }]}
              showCommas={false}
              decimals={0}
            />
            <Text style={[styles.macroUnit, { color: colors.textMuted }]}>g</Text>
            <Text style={[styles.macroLabel, { color: colors.textMuted }]}>Protein</Text>
          </View>
          <View style={styles.macro}>
            <RoundedNumeral
              value={results.carbs}
              size="medium"
              style={[styles.macroValue, { color: colors.text }]}
              showCommas={false}
              decimals={0}
            />
            <Text style={[styles.macroUnit, { color: colors.textMuted }]}>g</Text>
            <Text style={[styles.macroLabel, { color: colors.textMuted }]}>Carbs</Text>
          </View>
          <View style={styles.macro}>
            <RoundedNumeral
              value={results.fat}
              size="medium"
              style={[styles.macroValue, { color: colors.text }]}
              showCommas={false}
              decimals={0}
            />
            <Text style={[styles.macroUnit, { color: colors.textMuted }]}>g</Text>
            <Text style={[styles.macroLabel, { color: colors.textMuted }]}>Fat</Text>
          </View>
        </View>
      </View>

      {/* BMI Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Starting Point</Text>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>BMI</Text>
          <NumberText weight="medium" style={[styles.statValue, { color: colors.text }]}>
            {results.bmi.toFixed(1)}
          </NumberText>
        </View>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>BMI Category</Text>
          <Text style={[styles.statValue, { color: results.bmiCategory.color }]}>
            {results.bmiCategory.name}
          </Text>
        </View>
      </View>

      {/* Metabolism Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Metabolism</Text>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>BMR</Text>
          <NumberText weight="medium" style={[styles.statValue, { color: colors.text }]}>
            {results.bmr.toLocaleString()} cal
          </NumberText>
        </View>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>TDEE</Text>
          <NumberText weight="medium" style={[styles.statValue, { color: colors.text }]}>
            {results.tdee.toLocaleString()} cal
          </NumberText>
        </View>
      </View>

      {/* Weekly Target (for lose/gain) */}
      {goalType !== 'maintain' && (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Target</Text>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Weekly Change</Text>
            <NumberText weight="medium" style={[styles.statValue, { color: colors.text }]}>
              {results.weeklyChange > 0 ? '+' : ''}
              {Math.abs(results.weeklyChange).toFixed(2)} lb/week
            </NumberText>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Daily Adjustment</Text>
            <NumberText weight="medium" style={[styles.statValue, { color: colors.text }]}>
              {results.dailyDelta > 0 ? '+' : ''}
              {Math.round(results.dailyDelta)} cal
            </NumberText>
          </View>
        </View>
      )}

      {/* Quick Tips */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Key Tips</Text>
        <View style={styles.tipItem}>
          <CheckCircle2 size={20} color={Colors.successStrong} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Hit your protein target of <NumberText weight="medium">{results.protein}</NumberText>g daily to preserve muscle.
          </Text>
        </View>
        <View style={styles.tipItem}>
          <CheckCircle2 size={20} color={Colors.successStrong} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Track your food for at least 2 weeks to build awareness.
          </Text>
        </View>
        <View style={styles.tipItem}>
          <CheckCircle2 size={20} color={Colors.successStrong} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            {goalType === 'lose'
              ? 'Strength train 2-3x weekly to maintain muscle while losing fat.'
              : goalType === 'gain'
              ? 'Progressive overload in the gym is essential for muscle growth.'
              : 'Focus on food quality and body composition over the scale.'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.buttonSecondary, { borderColor: colors.border }]} onPress={onBack}>
          <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>ADJUST GOALS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonPrimary, { backgroundColor: colors.primary }, isSaving && styles.buttonDisabled]}
          onPress={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <>
              <Text style={[styles.buttonPrimaryText, { color: colors.primaryText }]}>SAVE MY PLAN</Text>
              <Check size={18} color={colors.primaryText} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius + 8,
    marginBottom: 12,
    overflow: 'hidden',
    padding: Spacing.cardPadding + 4,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: Colors.text,
    marginBottom: 16,
  },
  resultMain: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  calorieValue: {
    fontSize: 64,
    fontFamily: Fonts.medium,
    color: Colors.text,
    lineHeight: 64,
  },
  calorieLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
  },
  macro: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 32,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  macroUnit: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  macroLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.text,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
  },
  statValue: {
    fontSize: 15,
    fontFamily: Fonts.light,
    color: Colors.text,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 100,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    letterSpacing: 1,
    color: Colors.text,
  },
  buttonPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  buttonPrimaryText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    letterSpacing: 1,
    color: Colors.primaryText,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
