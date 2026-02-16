/**
 * DailyTimelineView - Main daily timeline with hourly grid and time blocks
 * Header date/actions moved to PlannerCalendarStrip in planner.tsx
 *
 * Enhancements:
 * - Contextual icons on all-day chips (birthday, holiday, OOO, etc.)
 * - Collapsible banner with "+N more" overflow pill
 * - OOO chips get dashed amber border
 * - Tap-to-detail bottom sheet with calendar info + "Open in Calendar"
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import { Calendar, RefreshCw, Cake, Star, TreePalm, CalendarDays, ExternalLink, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useSafeGoalWizard } from '../../../hooks/useSafeGoalWizard';
import { TimeBlock } from '../../../types/planner';
import { TimeSlotGrid } from './TimeSlotGrid';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { TimeBlockCard } from './TimeBlockCard';
import { GlassCard } from '../../GlassCard';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';
import { BehaviorInsightCard } from '../insights/BehaviorInsightCard';
import { WeeklyCoachCard } from '../coaching/WeeklyCoachCard';
import { PlannerChatSheet, PlannerChatSheetRef } from '../chat/PlannerChatSheet';
import { mediumImpact } from '../../../utils/haptics';

// Must match _layout.tsx tab bar constants
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM_MARGIN = 12;

const MAX_VISIBLE_CHIPS = 3;

// ============================================================================
// Helpers
// ============================================================================

/** Choose a contextual icon for an all-day event based on its title. */
const BIRTHDAY_RE = /\b(birthday|bday)\b/i;
const HOLIDAY_RE = /\b(holiday|christmas|thanksgiving|new year|memorial|independence|labor day|easter|hanukkah|diwali)\b/i;
const OOO_RE = /\b(ooo|out of office|pto|vacation|day off|time off|personal day|sick day|sick leave|leave)\b/i;

function getAllDayIcon(title: string) {
  if (BIRTHDAY_RE.test(title)) return Cake;
  if (HOLIDAY_RE.test(title)) return Star;
  if (OOO_RE.test(title)) return TreePalm;
  return CalendarDays;
}

/**
 * Format a date range for display.
 * All-day endDate from Apple/Google is midnight of the next day, so we
 * subtract 1 day from endDate for user-facing display.
 */
function formatAllDayRange(startISO?: string, endISO?: string): string {
  if (!startISO) return '';
  const start = new Date(startISO);
  const startStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (!endISO) return startStr;
  const end = new Date(endISO);
  // Subtract 1 day for midnight-next-day convention
  end.setDate(end.getDate() - 1);

  // If same day after adjustment, just show single date
  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  ) {
    return startStr;
  }

  const endStr = end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${startStr} \u2013 ${endStr}`;
}

function openNativeCalendar() {
  if (Platform.OS === 'ios') {
    Linking.openURL('calshow:');
  } else {
    Linking.openURL('content://com.android.calendar/time/');
  }
}

// ============================================================================
// Component
// ============================================================================

export function DailyTimelineView() {
  const { state, actions } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const scrollRef = useRef<ScrollView>(null);
  const chatSheetRef = useRef<PlannerChatSheetRef>(null);
  const insets = useSafeAreaInsets();

  // Fasting overlay zones
  const { state: goalWizardState } = useSafeGoalWizard();
  const fastingZones = useMemo(() => {
    if (!goalWizardState?.intermittentFasting) return null;
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h + (m || 0) / 60;
    };
    // fastingStart = eating window START, fastingEnd = eating window END
    const eatStart = parseTime(goalWizardState.fastingStart || '12:00');
    const eatEnd = parseTime(goalWizardState.fastingEnd || '20:00');
    const PX_PER_HOUR = 60;
    return {
      morning: { top: 0, height: eatStart * PX_PER_HOUR },
      evening: { top: eatEnd * PX_PER_HOUR, height: (24 - eatEnd) * PX_PER_HOUR },
    };
  }, [goalWizardState?.intermittentFasting, goalWizardState?.fastingStart, goalWizardState?.fastingEnd]);

  // Bottom padding: account for tab bar floating above safe area bottom
  const bottomPadding = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + (insets.bottom || 0) + 20;

  // Get current day's timeline
  const timeline = state.weeklyPlan?.days[state.selectedDayIndex];

  // Collapsible banner state — reset when day changes
  const [bannerExpanded, setBannerExpanded] = useState(false);
  useEffect(() => {
    setBannerExpanded(false);
  }, [state.selectedDayIndex]);

  // Chat modal state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Bottom sheet for all-day event detail
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedAllDayBlock, setSelectedAllDayBlock] = useState<TimeBlock | null>(null);
  const sheetSnapPoints = useMemo(() => ['30%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleChipPress = useCallback((block: TimeBlock) => {
    setSelectedAllDayBlock(block);
    bottomSheetRef.current?.present();
  }, []);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (!state.preferences?.wakeTime) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Calculate position relative to wake time
    const [wakeHour, wakeMin] = state.preferences.wakeTime.split(':').map(Number);
    const wakeMinutes = wakeHour * 60 + wakeMin;

    let relativeMinutes = currentMinutes - wakeMinutes;
    if (relativeMinutes < 0) relativeMinutes += 24 * 60; // Wrap around

    // Scroll to current time minus 1 hour for context (60px per hour)
    const scrollY = ((relativeMinutes - 60) / 60) * 60;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, scrollY), animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [state.preferences?.wakeTime]);

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

  // Split blocks into all-day (banner chips) vs timed (hourly grid)
  const allDayBlocks = timeline.blocks.filter((b) => b.isAllDay);
  const timedBlocks = timeline.blocks.filter((b) =>
    !b.isAllDay && !['buffer', 'meal_prep'].includes(b.type)
  );

  // Collapsible logic
  const hasOverflow = allDayBlocks.length > MAX_VISIBLE_CHIPS;
  const visibleChips = bannerExpanded ? allDayBlocks : allDayBlocks.slice(0, MAX_VISIBLE_CHIPS);
  const overflowCount = allDayBlocks.length - MAX_VISIBLE_CHIPS;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* All-day event banner (holidays, birthdays, OOO) */}
      {allDayBlocks.length > 0 && (
        <View
          style={[
            styles.allDayBanner,
            { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            bannerExpanded && styles.allDayBannerExpanded,
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.allDayBannerContent}
          >
            {visibleChips.map((block) => {
              const IconComponent = getAllDayIcon(block.title);
              const isOOO = block.isOOO;
              return (
                <TouchableOpacity
                  key={block.id}
                  style={[
                    styles.allDayChip,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                    isOOO && styles.allDayChipOOO,
                  ]}
                  onPress={() => handleChipPress(block)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.allDayChipAccent, { backgroundColor: block.color }]} />
                  <IconComponent
                    size={14}
                    color={isOOO ? '#D97706' : themeColors.textSecondary}
                    style={styles.allDayChipIcon}
                  />
                  <Text
                    style={[styles.allDayChipText, { color: themeColors.text }]}
                    numberOfLines={1}
                  >
                    {block.title}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Overflow pill */}
            {hasOverflow && !bannerExpanded && (
              <TouchableOpacity
                style={[
                  styles.overflowPill,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' },
                ]}
                onPress={() => setBannerExpanded(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.overflowPillText, { color: themeColors.textSecondary }]}>
                  +{overflowCount} more
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* AI Coaching & Behavior Insights — above the timeline */}
      <WeeklyCoachCard optimization={state.aiOptimization ?? null} />
      <BehaviorInsightCard completionPatterns={state.completionPatterns ?? {}} />

      {/* Timeline */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timeline}>
          <TimeSlotGrid wakeTime={state.preferences?.wakeTime} />

          {/* Fasting overlay zones */}
          {fastingZones && fastingZones.morning.height > 0 && (
            <View
              style={[
                styles.fastingZone,
                {
                  top: fastingZones.morning.top,
                  height: fastingZones.morning.height,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)',
                },
              ]}
              pointerEvents="none"
            >
              <Text style={[styles.fastingLabel, { color: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.45)' }]}>
                Fasting
              </Text>
            </View>
          )}
          {fastingZones && fastingZones.evening.height > 0 && (
            <View
              style={[
                styles.fastingZone,
                {
                  top: fastingZones.evening.top,
                  height: fastingZones.evening.height,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)',
                },
              ]}
              pointerEvents="none"
            >
              <Text style={[styles.fastingLabel, { color: isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.45)' }]}>
                Fasting
              </Text>
            </View>
          )}

          <CurrentTimeIndicator wakeTime={state.preferences?.wakeTime} />

          {timedBlocks.map((block) => (
            <TimeBlockCard
              key={block.id}
              block={block}
              wakeTime={state.preferences?.wakeTime}
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

      {/* Floating AI Chat Button */}
      {timeline && !isChatOpen && (
        <View style={[styles.chatFab, { bottom: bottomPadding + 60 }]}>
          <GlassCard
            style={[styles.chatFabGlass, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)' }]}
            interactive
          >
            <TouchableOpacity
              style={styles.chatFabInner}
              onPress={() => {
                mediumImpact();
                setIsChatOpen(true);
                chatSheetRef.current?.present();
              }}
              activeOpacity={0.8}
            >
              <Sparkles size={22} color="#a855f7" />
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}

      {/* Planner Chat Sheet */}
      <PlannerChatSheet ref={chatSheetRef} onDismiss={() => setIsChatOpen(false)} />

      {/* All-day event detail bottom sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={sheetSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}
        enableDynamicSizing={false}
      >
        {selectedAllDayBlock && (
          <View style={styles.sheetContent}>
            {/* Title row with color dot */}
            <View style={styles.sheetTitleRow}>
              <View style={[styles.sheetColorDot, { backgroundColor: selectedAllDayBlock.color }]} />
              <Text style={[styles.sheetTitle, { color: themeColors.text }]} numberOfLines={2}>
                {selectedAllDayBlock.title}
              </Text>
            </View>

            {/* Calendar source */}
            {selectedAllDayBlock.calendarName && (
              <Text style={[styles.sheetMeta, { color: themeColors.textSecondary }]}>
                {selectedAllDayBlock.calendarName}
              </Text>
            )}

            {/* Date range */}
            <Text style={[styles.sheetDateRange, { color: themeColors.textSecondary }]}>
              {formatAllDayRange(selectedAllDayBlock.originalStartDate, selectedAllDayBlock.originalEndDate)}
            </Text>

            {/* Open in Calendar button */}
            <TouchableOpacity
              style={[styles.openCalendarBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
              onPress={openNativeCalendar}
              activeOpacity={0.7}
            >
              <ExternalLink size={16} color={themeColors.primary} />
              <Text style={[styles.openCalendarBtnText, { color: themeColors.primary }]}>
                Open in Calendar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  allDayBanner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxHeight: 44,
  },
  allDayBannerExpanded: {
    maxHeight: undefined,
  },
  allDayBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexWrap: 'wrap',
  },
  allDayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingRight: 10,
    overflow: 'hidden',
  },
  allDayChipOOO: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D97706', // amber
  },
  allDayChipAccent: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  allDayChipIcon: {
    marginLeft: 6,
  },
  allDayChipText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    paddingHorizontal: 6,
    paddingVertical: 6,
    maxWidth: 160,
  },
  overflowPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowPillText: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
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
  // Bottom sheet styles
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    fontWeight: '600' as const,
    flex: 1,
  },
  sheetMeta: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    marginLeft: 22,
  },
  sheetDateRange: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    marginLeft: 22,
  },
  openCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 22,
    marginTop: 4,
  },
  openCalendarBtnText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  chatFab: {
    position: 'absolute',
    right: 16,
  },
  chatFabGlass: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatFabInner: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 10,
  },
  fastingZone: {
    position: 'absolute',
    left: 58, // after time labels (50px) + gap (8px)
    right: 0,
    borderRadius: 8,
    zIndex: 0, // behind time blocks
  },
  fastingLabel: {
    fontSize: 11,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    paddingTop: 6,
    paddingLeft: 8,
  },
});
