import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { GoalWorkoutAlignment, TrainingPreferences } from '../../types/training';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';

interface GoalAlignmentCardProps {
  alignment: GoalWorkoutAlignment;
  preferences: TrainingPreferences;
}

function AlignmentBar({
  label,
  value,
  color,
  colors,
  isDark,
}: {
  label: string;
  value: number;
  color: string;
  colors: any;
  isDark: boolean;
}) {
  const secondaryBg = isDark ? Colors.backgroundSecondary : 'rgba(0, 0, 0, 0.05)';
  return (
    <View style={styles.alignmentRow}>
      <Text style={[styles.alignmentLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.alignmentBarContainer, { backgroundColor: secondaryBg }]}>
        <View style={[styles.alignmentBar, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.alignmentValue, { color: colors.textMuted }]}>{value}%</Text>
    </View>
  );
}

export function GoalAlignmentCard({ alignment, preferences }: GoalAlignmentCardProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware backgrounds for inner elements
  const secondaryBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case 'lose_weight':
        return 'Weight Loss';
      case 'build_muscle':
        return 'Build Muscle';
      case 'maintain':
        return 'Maintenance';
      case 'improve_health':
        return 'Health Improvement';
      default:
        return 'General Fitness';
    }
  };

  const getAlignmentIcon = (score: number) => {
    if (score >= 80) return 'checkmark-circle';
    if (score >= 60) return 'alert-circle';
    return 'close-circle';
  };

  const getAlignmentColor = (score: number) => {
    if (score >= 80) return '#2ECC71';
    if (score >= 60) return Colors.protein;
    return Colors.calories;
  };

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()}>
      <GlassCard style={styles.container} interactive>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: `${getAlignmentColor(alignment.overallAlignment)}20` }]}>
              <Ionicons
                name={getAlignmentIcon(alignment.overallAlignment)}
                size={20}
                color={getAlignmentColor(alignment.overallAlignment)}
              />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Goal Alignment</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Optimized for {getGoalLabel(preferences.primaryGoal)}
              </Text>
            </View>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreValue, { color: getAlignmentColor(alignment.overallAlignment) }]}>
              {alignment.overallAlignment}%
            </Text>
            <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>Match</Text>
          </View>
        </View>

        {/* Alignment Bars */}
        <View style={styles.alignmentBars}>
          {preferences.primaryGoal === 'lose_weight' && (
            <>
              <AlignmentBar
                label="Calorie Burn"
                value={alignment.calorieDeficitSupport}
                color={Colors.calories}
                colors={colors}
                isDark={isDark}
              />
              <AlignmentBar
                label="Muscle Preservation"
                value={alignment.musclePreservation}
                color={Colors.protein}
                colors={colors}
                isDark={isDark}
              />
            </>
          )}
          {preferences.primaryGoal === 'build_muscle' && (
            <>
              <AlignmentBar
                label="Muscle Growth"
                value={alignment.muscleGrowthPotential}
                color={Colors.protein}
                colors={colors}
                isDark={isDark}
              />
              <AlignmentBar
                label="Recovery Support"
                value={alignment.musclePreservation}
                color={Colors.carbs}
                colors={colors}
                isDark={isDark}
              />
            </>
          )}
          {(preferences.primaryGoal === 'maintain' || preferences.primaryGoal === 'improve_health') && (
            <>
              <AlignmentBar
                label="Cardio Health"
                value={alignment.cardiovascularHealth}
                color={Colors.calories}
                colors={colors}
                isDark={isDark}
              />
              <AlignmentBar
                label="Strength"
                value={alignment.musclePreservation}
                color={Colors.protein}
                colors={colors}
                isDark={isDark}
              />
            </>
          )}
        </View>

        {/* Recommendation */}
        {alignment.recommendations.length > 0 && (
          <View style={[styles.recommendationContainer, { backgroundColor: secondaryBg }]}>
            <Ionicons name="bulb-outline" size={16} color={Colors.protein} />
            <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
              {alignment.recommendations[0]}
            </Text>
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontFamily: Fonts.thin,
  },
  scoreLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
  },
  alignmentBars: {
    gap: 12,
    marginBottom: 12,
  },
  alignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alignmentLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    width: 100,
  },
  alignmentBarContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  alignmentBar: {
    height: '100%',
    borderRadius: 3,
  },
  alignmentValue: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
    width: 40,
    textAlign: 'right',
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
});
