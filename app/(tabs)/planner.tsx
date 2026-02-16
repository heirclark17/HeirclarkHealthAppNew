/**
 * Planner Tab - AI-Powered Day Planner
 * Main screen with daily/monthly view toggle and calendar strip
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings } from 'lucide-react-native';
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
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const insets = useSafeAreaInsets();

  // Derive selected date from weekly plan + selectedDayIndex
  const selectedDate = useMemo(() => {
    if (state.weeklyPlan?.days?.[state.selectedDayIndex]) {
      return state.weeklyPlan.days[state.selectedDayIndex].date;
    }
    return formatDateStr(new Date());
  }, [state.weeklyPlan, state.selectedDayIndex]);

  const weekStartDate = state.weeklyPlan?.weekStartDate;

  // Compute colored dots for calendar strip (up to 3 per day from all-day events)
  const allDayEventDots = useMemo(() => {
    const dots: Record<string, string[]> = {};
    if (!state.weeklyPlan?.days) return dots;
    for (const day of state.weeklyPlan.days) {
      const allDayColors = day.blocks
        .filter((b) => b.isAllDay)
        .slice(0, 3)
        .map((b) => b.color);
      if (allDayColors.length > 0) {
        dots[day.date] = allDayColors;
      }
    }
    return dots;
  }, [state.weeklyPlan]);

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
    <BottomSheetModalProvider>
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header with view toggle + preferences button */}
      <View style={[styles.header, { backgroundColor: themeColors.background, paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: themeColors.text }]}>Planner</Text>
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
          onSyncCalendar={actions.syncCalendar}
          isSyncingCalendar={state.isSyncingCalendar}
          onRefresh={actions.generateWeeklyPlan}
          isRefreshing={state.isGeneratingPlan}
          allDayEventDots={allDayEventDots}
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
    </View>
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
