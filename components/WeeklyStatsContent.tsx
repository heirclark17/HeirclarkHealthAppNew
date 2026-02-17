import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../contexts/SettingsContext';
import { useGoalWizard } from '../contexts/GoalWizardContext';
import { api } from '../services/api';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../constants/Theme';
import { GlassCard } from './GlassCard';
import { RoundedNumeral } from './RoundedNumeral';

export function WeeklyStatsContent() {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  // Weekly data
  const [weeklyCalories, setWeeklyCalories] = useState(0);
  const [weeklyProtein, setWeeklyProtein] = useState(0);
  const [weeklyCarbs, setWeeklyCarbs] = useState(0);
  const [weeklyFat, setWeeklyFat] = useState(0);
  const [weeklySteps, setWeeklySteps] = useState(0);
  const [weeklyFatLoss, setWeeklyFatLoss] = useState(0);

  // Goals
  const [caloriesGoal, setCaloriesGoal] = useState(2200);
  const [proteinGoal, setProteinGoal] = useState(150);
  const [carbsGoal, setCarbsGoal] = useState(250);
  const [fatGoal, setFatGoal] = useState(65);
  const [stepsGoal, setStepsGoal] = useState(10000);
  const [fatLossGoal, setFatLossGoal] = useState(1); // Default 1 lb/week

  // Get goal wizard context for weekly fat loss goal
  let goalWizardState: any = null;
  try {
    const goalWizard = useGoalWizard();
    goalWizardState = goalWizard?.state;
  } catch (e) {}

  // Get the weekly fat loss goal from goal wizard results
  const weeklyFatLossTarget = useMemo(() => {
    // weeklyChange from goal wizard is the target lbs/week (positive for loss, negative for gain)
    const weeklyChange = goalWizardState?.results?.weeklyChange;
    if (weeklyChange && weeklyChange > 0) {
      return weeklyChange; // Use the user's goal
    }
    return fatLossGoal; // Fallback to default
  }, [goalWizardState?.results?.weeklyChange, fatLossGoal]);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    setLoading(true);
    try {
      // Get user's goals
      const goals = await api.getGoals();
      if (goals) {
        setCaloriesGoal(goals.dailyCalories || goalWizardState?.results?.tdee || 2200);
        setProteinGoal(goals.dailyProtein || 150);
        setCarbsGoal(goals.dailyCarbs || 250);
        setFatGoal(goals.dailyFat || 65);
      }

      // Get last 7 days of meal data
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        try {
          const meals = await api.getMeals(dateStr);
          if (meals && meals.length > 0) {
            totalCalories += meals.reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0);
            totalProtein += meals.reduce((sum: number, meal: any) => sum + (meal.protein || 0), 0);
            totalCarbs += meals.reduce((sum: number, meal: any) => sum + (meal.carbs || 0), 0);
            totalFat += meals.reduce((sum: number, meal: any) => sum + (meal.fat || 0), 0);
          }
        } catch (e) {
          // No data for this day
        }
      }

      setWeeklyCalories(totalCalories);
      setWeeklyProtein(totalProtein);
      setWeeklyCarbs(totalCarbs);
      setWeeklyFat(totalFat);

      // Calculate projected fat loss based on calorie deficit
      const weeklyCalorieGoal = (goals?.dailyCalories || 2200) * 7;
      const deficit = weeklyCalorieGoal - totalCalories;
      const projectedFatLoss = Math.max(0, deficit / 3500); // 3500 cal = 1 lb
      setWeeklyFatLoss(projectedFatLoss);

    } catch (error) {
      console.error('[WeeklyStats] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate days in current month
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Calculate weekly goals (daily goal × 7)
  const weeklyStepsGoal = stepsGoal * 7;
  const weeklyCaloriesGoal = caloriesGoal * 7;
  const weeklyProteinGoal = proteinGoal * 7;
  const weeklyCarbsGoal = carbsGoal * 7;
  const weeklyFatGoal = fatGoal * 7;
  const weeklyFatLossGoal = weeklyFatLossTarget; // Use goal from goals page

  // Calculate monthly goals (daily goal × days in month)
  const monthlyStepsGoal = stepsGoal * daysInMonth;
  const monthlyCaloriesGoal = caloriesGoal * daysInMonth;
  const monthlyProteinGoal = proteinGoal * daysInMonth;
  const monthlyCarbsGoal = carbsGoal * daysInMonth;
  const monthlyFatGoal = fatGoal * daysInMonth;
  const monthlyFatLossGoal = weeklyFatLossTarget * 4; // ~4 weeks worth

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
    unit = 'g',
    delay = 0,
  }: {
    label: string;
    value: number;
    color: string;
    maxValue: number;
    unit?: string;
    delay?: number;
  }) => {
    const progress = Math.min(value / maxValue, 1);
    const percentage = Math.round(progress * 100);

    return (
      <Animated.View
        entering={SlideInDown.delay(delay).duration(400).springify()}
        style={styles.macroCardNew}
      >
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
          decimals={label === 'FAT LOSS' ? 1 : 0}
        />
        <Text style={[styles.percentageText, { color: colors.text }]}>{percentage}%</Text>
        <Text style={[styles.goalText, { color: colors.textMuted }]}>
          of {maxValue.toLocaleString()}{unit}
        </Text>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading weekly stats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with date range */}
      <Animated.View entering={FadeIn.delay(0).duration(300)}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {viewMode === 'weekly' ? 'WEEKLY BUCKET' : 'MONTHLY BUCKET'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {viewMode === 'weekly' ? `Week of ${getWeekRange()}` : getMonthRange()}
        </Text>
      </Animated.View>

      {/* Weekly/Monthly Toggle */}
      <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            viewMode === 'weekly' && [styles.toggleButtonActive, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)', borderColor: Colors.gaugeFill }]
          ]}
          onPress={() => setViewMode('weekly')}
        >
          <Text style={[styles.toggleText, { color: colors.textMuted }, viewMode === 'weekly' && { color: colors.text, fontFamily: Fonts.semiBold }]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            viewMode === 'monthly' && [styles.toggleButtonActive, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)', borderColor: Colors.gaugeFill }]
          ]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[styles.toggleText, { color: colors.textMuted }, viewMode === 'monthly' && { color: colors.text, fontFamily: Fonts.semiBold }]}>
            Monthly
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Macro Cards with Vertical Colored Progress Bars - Scrollable */}
      <Animated.View entering={FadeIn.delay(200).duration(300)}>
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
            delay={100}
          />
          <MacroCard
            label="PROTEIN"
            value={weeklyProtein}
            color={Colors.protein}
            maxValue={displayProteinGoal}
            unit="g"
            delay={150}
          />
          <MacroCard
            label="CARBS"
            value={weeklyCarbs}
            color={Colors.carbs}
            maxValue={displayCarbsGoal}
            unit="g"
            delay={200}
          />
          <MacroCard
            label="FAT"
            value={weeklyFat}
            color={Colors.fat}
            maxValue={displayFatGoal}
            unit="g"
            delay={250}
          />
          <MacroCard
            label="STEPS"
            value={weeklySteps}
            color={Colors.gaugeFill}
            maxValue={displayStepsGoal}
            unit=""
            delay={300}
          />
          <MacroCard
            label="FAT LOSS"
            value={weeklyFatLoss}
            color={Colors.fatLoss}
            maxValue={displayFatLossGoal}
            unit="lbs"
            delay={350}
          />
        </ScrollView>
      </Animated.View>

      {/* Note if insufficient data */}
      {weeklyCalories === 0 && (
        <Animated.View entering={FadeIn.delay(400).duration(300)}>
          <View style={[styles.noteContainer, { backgroundColor: isDark ? 'rgba(255,200,100,0.1)' : 'rgba(255,200,100,0.15)' }]}>
            <Ionicons name="information-circle" size={18} color="#FFC857" />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Log meals to see your weekly progress
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
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
  scrollView: {
    marginHorizontal: -20, // Extend to edges of bottom sheet
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  macroCardNew: {
    width: 80,
    padding: 8,
    alignItems: 'center',
  },
  verticalBarContainer: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  verticalBarBg: {
    width: 24,
    height: 160,
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
  },
  macroValueNew: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#fff',
    marginBottom: 6,
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
    textAlign: 'center',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  noteText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    flex: 1,
  },
});
