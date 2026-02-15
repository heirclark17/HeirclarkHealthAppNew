/**
 * WeeklyOverviewView - 7-day week overview with stats
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { WeeklyStatsCard } from './WeeklyStatsCard';
import { DayCard } from './DayCard';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

export function WeeklyOverviewView() {
  const { state, actions } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  if (!state.weeklyPlan) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No weekly plan available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    </View>
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
    fontFamily: Fonts.medium,
  },
  daysScroll: {
    flex: 1,
  },
  daysScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
});
