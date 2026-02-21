/**
 * Planner Tab - AI-Powered Day Planner
 * Main screen with daily/monthly view toggle and calendar strip
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, Calendar } from 'lucide-react-native';
import { useDayPlanner } from '../../contexts/DayPlannerContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DayPlannerOnboardingModal } from '../../components/planner/onboarding/DayPlannerOnboardingModal';
import { DailyTimelineView } from '../../components/planner/timeline/DailyTimelineView';
import { MonthlyCalendarView } from '../../components/planner/monthly/MonthlyCalendarView';
import { PlannerCalendarStrip } from '../../components/planner/shared/PlannerCalendarStrip';
import { SegmentedControl } from '../../components/SegmentedControl';
import { DarkColors, LightColors, Fonts } from '../../constants/Theme';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function PlannerScreen() {
  const { state, actions } = useDayPlanner();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  // Dynamic theme colors
  const themeColors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  // Determine if we're viewing the current week
  const currentWeekSunday = useMemo(() => {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    return formatDateStr(sunday);
  }, []);
  const isCurrentWeek = state.viewedWeekStartDate === currentWeekSunday;

  // Derive selected date from viewed weekly plan + selectedDayIndex
  const selectedDate = useMemo(() => {
    if (state.viewedWeeklyPlan?.days?.[state.selectedDayIndex]) {
      return state.viewedWeeklyPlan.days[state.selectedDayIndex].date;
    }
    // Fallback: compute date from viewedWeekStartDate + selectedDayIndex
    const [y, m, d] = state.viewedWeekStartDate.split('-').map(Number);
    const sunday = new Date(y, m - 1, d);
    sunday.setDate(sunday.getDate() + state.selectedDayIndex);
    return formatDateStr(sunday);
  }, [state.viewedWeeklyPlan, state.selectedDayIndex, state.viewedWeekStartDate]);

  const weekStartDate = state.viewedWeekStartDate;

  // Compute colored dots for calendar strip (up to 3 per day from all-day events)
  const allDayEventDots = useMemo(() => {
    const dots: Record<string, string[]> = {};
    if (!state.viewedWeeklyPlan?.days) return dots;
    for (const day of state.viewedWeeklyPlan.days) {
      const allDayColors = day.blocks
        .filter((b) => b.isAllDay)
        .slice(0, 3)
        .map((b) => b.color);
      if (allDayColors.length > 0) {
        dots[day.date] = allDayColors;
      }
    }
    return dots;
  }, [state.viewedWeeklyPlan]);

  const handleDateChange = (dateStr: string) => {
    actions.setSelectedDate(dateStr);
  };

  // Show onboarding if not completed
  if (!state.hasCompletedOnboarding) {
    return (
      <DayPlannerOnboardingModal
        visible={true}
        onComplete={actions.completeOnboarding}
        onClose={() => router.push('/(tabs)/')}
      />
    );
  }

  return (
    <BottomSheetModalProvider>
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top', 'bottom']}>
      {/* Header with view toggle + preferences button */}
      <View style={[styles.header, { backgroundColor: 'transparent', paddingTop: 28 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Calendar size={32} color={themeColors.text} style={{ marginTop: 2 }} />
          <Text style={[styles.title, { color: themeColors.text }]}>Plan Meals & Workouts</Text>
        </View>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <SegmentedControl
              values={['Daily', 'Monthly']}
              selectedIndex={viewMode === 'daily' ? 0 : 1}
              onChange={(index) => {
                setViewMode(index === 0 ? 'daily' : 'monthly');
              }}
            />
          </View>
          <TouchableOpacity
            style={[styles.prefsButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
            onPress={actions.reopenOnboarding}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Settings size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Strip (shown for Daily view) */}
      {viewMode === 'daily' && (
        <PlannerCalendarStrip
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          weekStartDate={weekStartDate}
          onSyncCalendar={isCurrentWeek ? actions.syncCalendar : undefined}
          isSyncingCalendar={state.isSyncingCalendar}
          onResyncMeals={isCurrentWeek ? actions.resyncMeals : undefined}
          isSyncingMeals={state.isSyncingMeals}
          onResyncWorkouts={isCurrentWeek ? actions.resyncWorkouts : undefined}
          isSyncingWorkouts={state.isSyncingWorkouts}
          onRefresh={isCurrentWeek ? () => actions.generateWeeklyPlan() : undefined}
          isRefreshing={state.isGeneratingPlan}
          onClear={isCurrentWeek ? actions.clearCalendar : undefined}
          allDayEventDots={allDayEventDots}
          onPrevWeek={() => actions.navigateWeek('prev')}
          onNextWeek={() => actions.navigateWeek('next')}
          isCurrentWeek={isCurrentWeek}
          isLoadingWeek={state.isLoadingWeek}
          onJumpToToday={actions.jumpToCurrentWeek}
        />
      )}

      {/* Content */}
      {viewMode === 'daily' ? (
        <DailyTimelineView />
      ) : (
        <MonthlyCalendarView
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
      )}
    </SafeAreaView>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prefsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
