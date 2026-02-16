/**
 * Accountability Page
 * iOS 26 Liquid Glass Design
 *
 * Consolidates all accountability, tracking, and wellness features:
 * - Daily Tracking: Adaptive TDEE, Hydration, Habits
 * - Progress & Predictions: Progress Prediction, Weight Summary
 * - Wellness: Sleep & Recovery, Eating Out Guide
 * - Social: Accountability Partner
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Theme and styling
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { useGoalWizard } from '../../contexts/GoalWizardContext';

// Agent Cards
import { AdaptiveTDEECard, WeightLoggingCard } from '../../components/agents/tdee';
import { AccountabilityPartnerCard } from '../../components/agents/accountabilityPartner';
import { ProgressPredictionCard } from '../../components/agents/progressPrediction';
import { HabitFormationCard } from '../../components/agents/habitFormation';
import { RestaurantMenuCard } from '../../components/agents/restaurantMenu';
import { SleepRecoveryCard } from '../../components/agents/sleepRecovery';
import { HydrationCard } from '../../components/agents/hydration';
import WorkoutFormCoachCard from '../../components/agents/workoutFormCoach/WorkoutFormCoachCard';

export default function AccountabilityScreen() {
  const { settings } = useSettings();
  const { state: goalState } = useGoalWizard();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  // Theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Extract goal wizard data for cards
  const {
    primaryGoal,
    currentWeight,
    targetWeight,
    weightUnit,
    results,
    waterGoalOz,
    sleepGoalHours,
    stepGoal,
    dietStyle,
    allergies,
  } = goalState;

  // Refresh handler
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Allow child components to refresh their data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Accountability</Text>
          </View>

          {/* Weight Log Summary - First card */}
          <View style={styles.cardWrapper}>
            <WeightLoggingCard />
          </View>

          {/* Section: Social */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SOCIAL</Text>

            {/* Accountability Partner */}
            <View style={styles.cardWrapper}>
              <AccountabilityPartnerCard />
            </View>
          </View>

          {/* Section: Daily Tracking */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DAILY TRACKING</Text>

            {/* Adaptive TDEE Card */}
            <View style={styles.cardWrapper}>
              <AdaptiveTDEECard />
            </View>

            {/* Hydration Card */}
            <View style={styles.cardWrapper}>
              <HydrationCard />
            </View>

            {/* Habits Tracker */}
            <View style={styles.cardWrapper}>
              <HabitFormationCard />
            </View>
          </View>

          {/* Section: Progress & Predictions */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PROGRESS & PREDICTIONS</Text>

            {/* Progress Prediction */}
            <View style={styles.cardWrapper}>
              <ProgressPredictionCard />
            </View>
          </View>

          {/* Section: Training */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TRAINING</Text>

            {/* Form Coach */}
            <View style={styles.cardWrapper}>
              <WorkoutFormCoachCard />
            </View>
          </View>

          {/* Section: Wellness */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>WELLNESS</Text>

            {/* Sleep & Recovery */}
            <View style={styles.cardWrapper}>
              <SleepRecoveryCard />
            </View>

            {/* Eating Out Guide */}
            <View style={styles.cardWrapper}>
              <RestaurantMenuCard />
            </View>
          </View>

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 0.5,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    letterSpacing: 1,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
});
