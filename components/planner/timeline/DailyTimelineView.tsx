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
import { TimeSlotGrid } from './TimeSlotGrid';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { TimeBlockCard } from './TimeBlockCard';
import { CalendarSyncButton } from '../shared/CalendarSyncButton';
import { GlassCard } from '../../GlassCard';
import { Colors } from '../../../constants/Theme';

export function DailyTimelineView() {
  const { state, actions } = useDayPlanner();
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
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.emptyContainer}>
          <GlassCard style={styles.emptyCard}>
            <RefreshCw size={48} color={Colors.primary} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>No timeline available</Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={actions.generateWeeklyPlan}
              disabled={state.isGeneratingPlan}
            >
              {state.isGeneratingPlan ? (
                <Text style={styles.generateButtonText}>Generating...</Text>
              ) : (
                <>
                  <RefreshCw size={20} color={Colors.background} />
                  <Text style={styles.generateButtonText}>Generate Schedule</Text>
                </>
              )}
            </TouchableOpacity>
          </GlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <GlassCard style={styles.header}>
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
            disabled={state.isGeneratingPlan}
          >
            <RefreshCw
              size={20}
              color={state.isGeneratingPlan ? Colors.textSecondary : Colors.primary}
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
          <Text style={styles.statValue}>{timeline.completionRate}%</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(timeline.totalScheduledMinutes / 60)}h
          </Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(timeline.totalFreeMinutes / 60)}h
          </Text>
          <Text style={styles.statLabel}>Free Time</Text>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    fontFamily: 'Urbanist_700Bold',
    color: Colors.text,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.glassTint,
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
    fontFamily: 'Urbanist_600SemiBold',
    color: Colors.text,
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontFamily: 'Urbanist_700Bold',
    color: Colors.background,
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
    backgroundColor: Colors.glassTint,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'SFProRounded-Bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Urbanist_600SemiBold',
    color: Colors.textSecondary,
  },
});
