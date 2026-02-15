/**
 * DailyTimelineView - Main daily timeline with hourly grid and time blocks
 * iOS 26 Liquid Glass design
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { Calendar, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { TimeSlotGrid } from './TimeSlotGrid';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { TimeBlockCard } from './TimeBlockCard';
import { CalendarSyncButton } from '../shared/CalendarSyncButton';
import { GlassCard } from '../../GlassCard';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

export function DailyTimelineView() {
  const { state, actions } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const scrollRef = useRef<ScrollView>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const insets = useSafeAreaInsets();

  // Get current day's timeline
  const timeline = state.weeklyPlan?.days[state.selectedDayIndex];

  // Auto-scroll to current time on mount
  useEffect(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    // Scroll to current time minus 1 hour for context (60px per hour)
    const scrollY = ((currentMinutes - 6 * 60 - 60) / 60) * 60;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, scrollY), animated: true });
    }, 100);
  }, []);

  if (!timeline) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20, backgroundColor: themeColors.background }]}>
        <View style={styles.emptyContainer}>
          <GlassCard style={styles.emptyCard}>
            <RefreshCw size={48} color={themeColors.primary} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyText, { color: themeColors.text }]}>No timeline available</Text>
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: themeColors.primary }]}
              onPress={actions.generateWeeklyPlan}
              disabled={state.isGeneratingPlan}
            >
              {state.isGeneratingPlan ? (
                <Text style={[styles.generateButtonText, { color: themeColors.primaryText }]}>Generating...</Text>
              ) : (
                <>
                  <RefreshCw size={20} color={themeColors.primaryText} />
                  <Text style={[styles.generateButtonText, { color: themeColors.primaryText }]}>Generate Schedule</Text>
                </>
              )}
            </TouchableOpacity>
          </GlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: themeColors.background }]}>
      {/* Header */}
      <GlassCard style={styles.header}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.dateText, { color: themeColors.text }]}>
            {format(new Date(timeline.date), 'EEEE, MMM d')}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <CalendarSyncButton
            onPress={actions.syncCalendar}
            loading={state.isSyncingCalendar}
          />
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
            onPress={actions.generateWeeklyPlan}
            disabled={state.isGeneratingPlan}
          >
            <RefreshCw
              size={20}
              color={state.isGeneratingPlan ? themeColors.textSecondary : themeColors.primary}
            />
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Timeline */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timeline}>
          <TimeSlotGrid />
          <CurrentTimeIndicator />

          {timeline.blocks.map((block) => (
            <TimeBlockCard
              key={block.id}
              block={block}
              onPress={() => {
                // TODO: Open block detail modal
                console.log('[Timeline] Block pressed:', block.title);
              }}
              onSwipeRight={() => actions.markBlockComplete(block.id, timeline.date)}
              onSwipeLeft={() => actions.skipBlock(block.id, timeline.date)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Stats Footer */}
      <GlassCard style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.primary }]}>{timeline.completionRate}%</Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Completed</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.primary }]}>
            {Math.round(timeline.totalScheduledMinutes / 60)}h
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Scheduled</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.primary }]}>
            {Math.round(timeline.totalFreeMinutes / 60)}h
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Free Time</Text>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  timeline: {
    position: 'relative',
    minHeight: 1440, // 24 hours * 60px per hour
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
    maxWidth: 400,
    width: '100%',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statValue: {
    fontSize: 24,
    fontFamily: Fonts.numericBold,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
});
