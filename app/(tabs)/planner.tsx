/**
 * Planner Tab - AI-Powered Day & Week Planner
 * Main screen with daily/weekly view toggle
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useDayPlanner } from '../../contexts/DayPlannerContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DayPlannerOnboardingModal } from '../../components/planner/onboarding/DayPlannerOnboardingModal';
import { DailyTimelineView } from '../../components/planner/timeline/DailyTimelineView';
import { WeeklyOverviewView } from '../../components/planner/weekly/WeeklyOverviewView';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Colors, DarkColors, LightColors, Fonts } from '../../constants/Theme';

export default function PlannerScreen() {
  const { state, actions } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  // Show onboarding if not completed
  if (!state.hasCompletedOnboarding) {
    return (
      <DayPlannerOnboardingModal
        visible={true}
        onComplete={actions.completeOnboarding}
        onClose={() => router.back()}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header with view toggle */}
      <View style={[styles.header, { backgroundColor: themeColors.background }]}>
        <SegmentedControl
          values={['Daily', 'Weekly']}
          selectedIndex={viewMode === 'daily' ? 0 : 1}
          onChange={(index) => setViewMode(index === 0 ? 'daily' : 'weekly')}
        />
      </View>

      {/* Content */}
      {viewMode === 'daily' ? (
        <DailyTimelineView />
      ) : (
        <WeeklyOverviewView />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
