/**
 * DailyTimelineView - Main daily timeline with hourly grid and time blocks
 * Header date/actions moved to PlannerCalendarStrip in planner.tsx
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, RefreshCw, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { TimeSlotGrid } from './TimeSlotGrid';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { TimeBlockCard } from './TimeBlockCard';
import { GlassCard } from '../../GlassCard';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

// Must match _layout.tsx tab bar constants
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM_MARGIN = 12;

export function DailyTimelineView() {
  const { state, actions } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const scrollRef = useRef<ScrollView>(null);
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

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
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

          {timeline.blocks.filter((block) => block.type !== 'buffer').map((block) => (
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

      {/* Floating AI Optimize Button */}
      <TouchableOpacity
        style={[
          styles.aiOptimizeButton,
          {
            bottom: bottomPadding + 56,
            backgroundColor: themeColors.primary,
          },
        ]}
        onPress={actions.generateWeeklyPlan}
        disabled={state.isGeneratingPlan}
        activeOpacity={0.7}
      >
        {state.isGeneratingPlan ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Sparkles size={20} color="#fff" />
        )}
      </TouchableOpacity>

      {/* Floating Stats */}
      <View style={[styles.floatingFooter, { bottom: bottomPadding }]}>
        <GlassCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: themeColors.primary }]}>{timeline.completionRate}%</Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Completed</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: themeColors.primary }]}>
            {Math.round(timeline.totalScheduledMinutes / 60)}h
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Scheduled</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: themeColors.primary }]}>
            {Math.round(timeline.totalFreeMinutes / 60)}h
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Free Time</Text>
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  aiOptimizeButton: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  floatingFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
});
