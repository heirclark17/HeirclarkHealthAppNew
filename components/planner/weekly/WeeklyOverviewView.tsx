/**
 * WeeklyOverviewView - 7-day week overview with stats
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { WeeklyStatsCard } from './WeeklyStatsCard';
import { DayCard } from './DayCard';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

// Must match _layout.tsx tab bar constants
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM_MARGIN = 12;

export function WeeklyOverviewView() {
  const { state, actions } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const insets = useSafeAreaInsets();

  // Bottom padding: account for tab bar floating above safe area bottom
  const bottomPadding = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + (insets.bottom || 0) + 20;

  if (!state.weeklyPlan) {
    return (
      <View style={[styles.emptyContainer, { paddingBottom: bottomPadding }]}>
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No weekly plan available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      {/* Weekly Stats */}
      <WeeklyStatsCard stats={state.weeklyPlan.weeklyStats} />

      {/* Days */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScrollContent}
        style={styles.daysScroll}
      >
        {state.weeklyPlan.days.map((day, index) => (
          <DayCard
            key={day.date}
            day={day}
            isSelected={index === state.selectedDayIndex}
            onPress={() => {
              actions.setSelectedDay(index);
            }}
          />
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  daysScroll: {
    flex: 1,
  },
  daysScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
});
