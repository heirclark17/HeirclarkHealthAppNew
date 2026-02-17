import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../constants/Theme';
import { RoundedNumeral } from './RoundedNumeral';
import { useSettings } from '../contexts/SettingsContext';

interface WeeklyProgressCardProps {
  weeklySteps: number;
  weeklyCalories: number;
  weeklyProtein: number;
  weeklyCarbs: number;
  weeklyFat: number;
  weeklyFatLoss: number;
  stepsGoal?: number;
  caloriesGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  fatLossGoal?: number;
}

export const WeeklyProgressCard: React.FC<WeeklyProgressCardProps> = ({
  weeklySteps,
  weeklyCalories,
  weeklyProtein,
  weeklyCarbs,
  weeklyFat,
  weeklyFatLoss,
  stepsGoal = 10000,
  caloriesGoal = 2200,
  proteinGoal = 150,
  carbsGoal = 250,
  fatGoal = 65,
  fatLossGoal = 2,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Calculate days in current month
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Calculate weekly goals (daily goal × 7)
  const weeklyStepsGoal = stepsGoal * 7;
  const weeklyCaloriesGoal = caloriesGoal * 7;
  const weeklyProteinGoal = proteinGoal * 7;
  const weeklyCarbsGoal = carbsGoal * 7;
  const weeklyFatGoal = fatGoal * 7;
  const weeklyFatLossGoal = fatLossGoal * 7;

  // Calculate monthly goals (daily goal × days in month)
  const monthlyStepsGoal = stepsGoal * daysInMonth;
  const monthlyCaloriesGoal = caloriesGoal * daysInMonth;
  const monthlyProteinGoal = proteinGoal * daysInMonth;
  const monthlyCarbsGoal = carbsGoal * daysInMonth;
  const monthlyFatGoal = fatGoal * daysInMonth;
  const monthlyFatLossGoal = fatLossGoal * daysInMonth;

  // Use appropriate goals based on view mode
  const displayStepsGoal = viewMode === 'weekly' ? weeklyStepsGoal : monthlyStepsGoal;
  const displayCaloriesGoal = viewMode === 'weekly' ? weeklyCaloriesGoal : monthlyCaloriesGoal;
  const displayProteinGoal = viewMode === 'weekly' ? weeklyProteinGoal : monthlyProteinGoal;
  const displayCarbsGoal = viewMode === 'weekly' ? weeklyCarbsGoal : monthlyCarbsGoal;
  const displayFatGoal = viewMode === 'weekly' ? weeklyFatGoal : monthlyFatGoal;
  const displayFatLossGoal = viewMode === 'weekly' ? weeklyFatLossGoal : monthlyFatLossGoal;

  // Vertical bar graph component (exactly like nutrition cards)
  const MacroCard = ({
    label,
    value,
    color,
    maxValue,
    unit = 'g'
  }: {
    label: string;
    value: number;
    color: string;
    maxValue: number;
    unit?: string;
  }) => {
    const progress = Math.min(value / maxValue, 1);
    const percentage = Math.round(progress * 100);

    return (
      <View style={styles.macroCardNew}>
        {/* Vertical colored progress bar */}
        <View style={styles.verticalBarContainer}>
          <View style={[styles.verticalBarBg, { backgroundColor: isDark ? Colors.gaugeBg : 'rgba(0,0,0,0.08)' }]}>
            <View
              style={[
                styles.verticalBarFill,
                {
                  backgroundColor: color,
                  height: `${progress * 100}%`,
                }
              ]}
            />
          </View>
        </View>

        {/* Label */}
        <Text style={[styles.macroLabelNew, { color: colors.textMuted }]}>{label}</Text>
        <RoundedNumeral
          value={value}
          unit={unit}
          size="small"
          style={{ ...styles.macroValueNew, color: colors.text }}
          showCommas={true}
          decimals={0}
        />
        <Text style={[styles.percentageText, { color: colors.text }]}>{percentage}%</Text>
        <Text style={[styles.goalText, { color: colors.textMuted }]}>
          of {maxValue.toLocaleString()}{unit}
        </Text>
      </View>
    );
  };

  return (
    <GlassCard style={styles.card} interactive>
      {/* Collapsible Header */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.header}
        accessible={true}
        accessibilityLabel={`${viewMode === 'weekly' ? 'Weekly' : 'Monthly'} Progress card, ${isExpanded ? 'expanded' : 'collapsed'}`}
        accessibilityHint="Tap to expand or collapse"
        accessibilityRole="button"
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {viewMode === 'weekly' ? 'WEEKLY BUCKET' : 'MONTHLY BUCKET'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Click to expand • {viewMode === 'weekly' ? `Week of ${getWeekRange()}` : getMonthRange()}
          </Text>
        </View>
        {isExpanded ? (
          <ChevronUp size={20} color={colors.textMuted} />
        ) : (
          <ChevronDown size={20} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      {/* Weekly/Monthly Toggle - Only show when expanded */}
      {isExpanded && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
              viewMode === 'weekly' && [styles.toggleButtonActive, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)' }]
            ]}
            onPress={() => setViewMode('weekly')}
            accessible={true}
            accessibilityLabel="Weekly view"
            accessibilityRole="button"
          >
            <Text style={[styles.toggleText, { color: colors.textMuted }, viewMode === 'weekly' && { color: colors.text }]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
              viewMode === 'monthly' && [styles.toggleButtonActive, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)' }]
            ]}
            onPress={() => setViewMode('monthly')}
            accessible={true}
            accessibilityLabel="Monthly view"
            accessibilityRole="button"
          >
            <Text style={[styles.toggleText, { color: colors.textMuted }, viewMode === 'monthly' && { color: colors.text }]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expandable Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Macro Cards with Vertical Colored Progress Bars - Scrollable */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <MacroCard
              label="CALORIES"
              value={weeklyCalories}
              color={Colors.calories}
              maxValue={displayCaloriesGoal}
              unit=""
            />
            <MacroCard
              label="PROTEIN"
              value={weeklyProtein}
              color={Colors.protein}
              maxValue={displayProteinGoal}
              unit="g"
            />
            <MacroCard
              label="CARBS"
              value={weeklyCarbs}
              color={Colors.carbs}
              maxValue={displayCarbsGoal}
              unit="g"
            />
            <MacroCard
              label="FAT"
              value={weeklyFat}
              color={Colors.fat}
              maxValue={displayFatGoal}
              unit="g"
            />
            <MacroCard
              label="STEPS"
              value={weeklySteps}
              color={Colors.gaugeFill}
              maxValue={displayStepsGoal}
              unit=""
            />
            <MacroCard
              label="FAT LOSS"
              value={weeklyFatLoss}
              color={Colors.fatLoss}
              maxValue={displayFatLossGoal}
              unit="lbs"
            />
          </ScrollView>
        </View>
      )}
    </GlassCard>
  );
};

// Helper function to get current week range (Sunday-Saturday)
function getWeekRange(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const formatDate = (date: Date) => {
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  return `${formatDate(sunday)} - ${formatDate(saturday)}`;
}

// Helper function to get current month range
function getMonthRange(): string {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
  return `${month} ${year} (${daysInMonth} days)`;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.sectionMargin,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  content: {
    marginTop: 20,
    paddingBottom: 20,
  },
  // Horizontal ScrollView for macro cards
  scrollView: {
    marginHorizontal: -Spacing.cardPadding, // Extend to edges
  },
  scrollContent: {
    paddingHorizontal: Spacing.cardPadding,
    gap: 8,
  },
  macroCardNew: {
    width: 80, // Fixed width for each card
    padding: 8,
    alignItems: 'center',
  },
  verticalBarContainer: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  verticalBarBg: {
    width: 24,
    height: 200,
    backgroundColor: Colors.gaugeBg,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalBarFill: {
    width: '100%',
    borderRadius: 20,
  },
  macroLabelNew: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: '#888',
    marginBottom: 6,
    fontWeight: '300',
  },
  macroValueNew: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#fff',
    marginBottom: 6,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 6,
  },
  goalText: {
    fontSize: 9,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
    justifyContent: 'center',
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 100,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: Colors.gaugeFill,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
});
