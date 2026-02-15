/**
 * DailyTimelineView - Main daily timeline with hourly grid and time blocks
 * iOS 26 Liquid Glass design
 *
 * Fixed:
 * - Bottom padding accounts for floating tab bar (TAB_BAR_HEIGHT + margin + safe area)
 * - Timezone-safe date parsing (parseLocalDate instead of new Date(string))
 * - Generate button properly wired with loading state and error handling
 * - Empty state has sufficient bottom padding to not be hidden behind tab bar
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
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

// Must match _layout.tsx tab bar constants
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM_MARGIN = 12;

/**
 * Parse a "YYYY-MM-DD" string as a local-timezone date (not UTC).
 * new Date("2026-02-16") creates a UTC midnight date which can shift the day
 * when displayed in local timezone (e.g. CST is -6h so it shows Feb 15).
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function DailyTimelineView() {
  const { state, actions } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const scrollRef = useRef<ScrollView>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const insets = useSafeAreaInsets();

  // Bottom padding: account for tab bar floating above safe area bottom
  const bottomPadding = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + (insets.bottom || 0) + 20;

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
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.emptyContainer, { paddingBottom: bottomPadding }]}>
          <GlassCard style={styles.emptyCard}>
            <Calendar size={48} color={themeColors.primary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              No Schedule Yet
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Generate your personalized daily timeline based on your workouts, meals, and preferences.
            </Text>
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: themeColors.primary }]}
              onPress={actions.generateWeeklyPlan}
              disabled={state.isGeneratingPlan}
              activeOpacity={0.7}
            >
              {state.isGeneratingPlan ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.generateButtonText, { color: '#fff' }]}>Generating...</Text>
                </>
              ) : (
                <>
                  <RefreshCw size={20} color="#fff" />
                  <Text style={[styles.generateButtonText, { color: '#fff' }]}>Generate Schedule</Text>
                </>
              )}
            </TouchableOpacity>
            {state.error && (
              <Text style={[styles.errorText, { color: Colors.protein }]}>
                {state.error}
              </Text>
            )}
          </GlassCard>
        </View>
      </View>
    );
  }

  // Parse date safely in local timezone
  const timelineDate = parseLocalDate(timeline.date);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <GlassCard style={styles.header}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.dateText, { color: themeColors.text }]}>
            {format(timelineDate, 'EEEE, MMM d')}
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
            {state.isGeneratingPlan ? (
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <RefreshCw
                size={20}
                color={themeColors.primary}
              />
            )}
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Timeline */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 80 }]}
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
      <GlassCard style={[styles.footer, { marginBottom: bottomPadding }]}>
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
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
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
    // paddingBottom is set dynamically via style prop
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
  emptyTitle: {
    fontSize: 22,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    textAlign: 'center',
    marginTop: 4,
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
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
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
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
});
