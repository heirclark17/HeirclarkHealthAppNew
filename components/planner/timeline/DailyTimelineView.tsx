/**
 * DailyTimelineView - Main daily timeline with hourly grid and time blocks
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { Calendar, RefreshCw } from 'lucide-react-native';
import { useDayPlanner } from '@/contexts/DayPlannerContext';
import { TimeSlotGrid } from './TimeSlotGrid';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { TimeBlockCard } from './TimeBlockCard';
import { CalendarSyncButton } from '../shared/CalendarSyncButton';
import { colors } from '@/constants/Theme';

export function DailyTimelineView() {
  const { state, actions } = useDayPlanner();
  const scrollRef = useRef<ScrollView>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No timeline available</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={actions.generateWeeklyPlan}
        >
          <RefreshCw size={20} color={colors.background} />
          <Text style={styles.generateButtonText}>Generate Schedule</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>
            {format(new Date(timeline.date), 'EEEE, MMM d')}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <CalendarSyncButton
            onPress={actions.syncCalendar}
            loading={state.isSyncingCalendar}
          />
          <TouchableOpacity
            style={styles.actionButton}
            onPress={actions.generateWeeklyPlan}
          >
            <RefreshCw
              size={20}
              color={state.isGeneratingPlan ? colors.textSecondary : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

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
      <View style={styles.footer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{timeline.completionRate}%</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(timeline.totalScheduledMinutes / 60)}h
          </Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(timeline.totalFreeMinutes / 60)}h
          </Text>
          <Text style={styles.statLabel}>Free Time</Text>
        </View>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.surface + '40',
  },
  dateText: {
    fontSize: 18,
    fontFamily: 'Urbanist_600SemiBold',
    color: colors.text,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  timeline: {
    position: 'relative',
    minHeight: 1440, // 24 hours * 60px per hour
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Urbanist_500Medium',
    color: colors.textSecondary,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  generateButtonText: {
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
    color: colors.background,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surface + '40',
    backgroundColor: colors.background,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'SFProRounded-Bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Urbanist_500Medium',
    color: colors.textSecondary,
  },
});
