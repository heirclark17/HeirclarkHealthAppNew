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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Theme and styling
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../../components/GlassCard';

// Agent Cards
import { AdaptiveTDEECard, WeightLoggingCard } from '../../components/agents/tdee';
import { AccountabilityPartnerCard } from '../../components/agents/accountabilityPartner';
import { ProgressPredictionCard } from '../../components/agents/progressPrediction';
import { HabitFormationCard } from '../../components/agents/habitFormation';
import { RestaurantMenuCard } from '../../components/agents/restaurantMenu';
import { SleepRecoveryCard } from '../../components/agents/sleepRecovery';
import { HydrationCard } from '../../components/agents/hydration';

export default function AccountabilityScreen() {
  const { settings } = useSettings();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  // Theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

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
          <GlassCard style={styles.headerCard} interactive>
            <View style={styles.headerContent}>
              <View style={[styles.headerIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="pulse" size={24} color={colors.primary} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>ACCOUNTABILITY</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Track your progress and stay consistent
                </Text>
              </View>
            </View>
          </GlassCard>

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

            {/* Weight Log Summary - Links to Settings for full management */}
            <View style={styles.cardWrapper}>
              <WeightLoggingCard />
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

          {/* Section: Social */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SOCIAL</Text>

            {/* Accountability Partner */}
            <View style={styles.cardWrapper}>
              <AccountabilityPartnerCard />
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
  headerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Fonts.regular,
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    letterSpacing: 0.2,
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
