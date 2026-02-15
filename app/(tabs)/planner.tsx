/**
 * Planner Tab - AI-Powered Day & Week Planner
 * Main screen with daily/weekly/monthly view toggle and calendar strip
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDayPlanner } from '../../contexts/DayPlannerContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DayPlannerOnboardingModal } from '../../components/planner/onboarding/DayPlannerOnboardingModal';
import { DailyTimelineView } from '../../components/planner/timeline/DailyTimelineView';
import { WeeklyOverviewView } from '../../components/planner/weekly/WeeklyOverviewView';
import { MonthlyCalendarView } from '../../components/planner/monthly/MonthlyCalendarView';
import { PlannerCalendarStrip } from '../../components/planner/shared/PlannerCalendarStrip';
import { SegmentedControl } from '../../components/SegmentedControl';
import { DarkColors, LightColors } from '../../constants/Theme';

function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function PlannerScreen() {
  const { state, actions } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const insets = useSafeAreaInsets();

  // Derive selected date from weekly plan + selectedDayIndex
  const selectedDate = useMemo(() => {
    if (state.weeklyPlan?.days?.[state.selectedDayIndex]) {
      return state.weeklyPlan.days[state.selectedDayIndex].date;
    }
    return formatDateStr(new Date());
  }, [state.weeklyPlan, state.selectedDayIndex]);

  const weekStartDate = state.weeklyPlan?.weekStartDate;

  const handleDateChange = (dateStr: string) => {
    actions.setSelectedDate(dateStr);
  };

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
      <View style={[styles.header, { backgroundColor: themeColors.background, paddingTop: insets.top + 8 }]}>
        <SegmentedControl
          values={['Daily', 'Weekly', 'Monthly']}
          selectedIndex={viewMode === 'daily' ? 0 : viewMode === 'weekly' ? 1 : 2}
          onChange={(index) => {
            const modes: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];
            setViewMode(modes[index]);
          }}
        />
      </View>

      {/* Calendar Strip (shown for Daily and Weekly views) */}
      {viewMode !== 'monthly' && (
        <PlannerCalendarStrip
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          weekStartDate={weekStartDate}
        />
      )}

      {/* Content */}
      {viewMode === 'daily' ? (
        <DailyTimelineView />
      ) : viewMode === 'weekly' ? (
        <WeeklyOverviewView />
      ) : (
        <MonthlyCalendarView
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
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
