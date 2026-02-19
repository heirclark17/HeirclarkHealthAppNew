/**
 * TimeBlockCard - Individual time block with swipe gestures
 *
 * Uses a plain View instead of GlassCard to avoid double padding
 * and overflow:hidden clipping that cut off text in short blocks.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, X } from 'lucide-react-native';
import { ActivityIcon } from '../shared/ActivityIcon';
import { TimeBlock } from '../../../types/planner';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  block: TimeBlock;
  onPress: () => void;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  wakeTime?: string; // Format: "HH:MM"
}

export function TimeBlockCard({ block, onPress, onSwipeRight, onSwipeLeft, wakeTime = '06:00' }: Props) {
  const { settings } = useSettings();
  const translateX = useSharedValue(0);

  // Dynamic theme colors
  const themeColors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Calculate position (absolute positioning in timeline, relative to wake time)
  const startMinutes = timeToMinutes(block.startTime);
  const wakeMinutes = timeToMinutes(wakeTime);

  // Calculate position relative to wake time (handle wraparound for late night blocks)
  let relativeMinutes = startMinutes - wakeMinutes;
  if (relativeMinutes < 0) relativeMinutes += 24 * 60; // Wrap around for blocks after midnight

  // With 60px per hour scale, 1 minute = 1 pixel
  const top = relativeMinutes; // Position from wake time in pixels
  // Use actual duration without minimum (like Outlook/Teams calendars)
  const height = block.duration; // 1 minute = 1 pixel, no minimum

  // For very short events (<30min), use compact single-line layout like Outlook
  const isCompact = block.duration < 30;

  // Gesture handler
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > 100) {
        // Swipe right - complete
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -100) {
        // Swipe left - skip
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Warning);
        runOnJS(onSwipeLeft)();
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Calendar events get stronger backgrounds for visual clarity
  const isCalendarEvent = block.type === 'calendar_event';
  const blockColor = block.color || '#888888';
  const cardBg = isDark
    ? (blockColor + (isCalendarEvent ? '35' : '25'))
    : (blockColor + (isCalendarEvent ? '22' : '15'));

  // Use smaller text/icons for calendar events, normal size for meals/workouts
  const titleSize = isCalendarEvent ? 11 : 13;
  const timeSize = isCalendarEvent ? 10 : 11;
  const iconSize = isCalendarEvent ? (isCompact ? 11 : 12) : (isCompact ? 12 : 14);
  const statusIconSize = isCalendarEvent ? (isCompact ? 11 : 12) : (isCompact ? 12 : 14);
  const compactTextSize = isCalendarEvent ? 10 : 11;

  return (
    <Animated.View
      style={[
        styles.container,
        { top, height },
        animatedStyle,
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={{ flex: 1 }}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderLeftColor: blockColor,
                borderLeftWidth: isCalendarEvent ? 4 : 3,
              },
            ]}
          >
            {isCompact ? (
              // Compact single-line layout for short events (like Outlook/Teams)
              <View style={styles.compactRow}>
                <ActivityIcon type={block.type} size={iconSize} color={blockColor} />
                <Text style={[styles.compactText, { color: themeColors.text, fontSize: compactTextSize }]} numberOfLines={1}>
                  {block.title} · {to12h(block.startTime)}
                </Text>
                {block.status === 'completed' && (
                  <CheckCircle2 size={statusIconSize} color={Colors.protein} />
                )}
                {block.status === 'skipped' && (
                  <X size={statusIconSize} color={themeColors.textSecondary} />
                )}
              </View>
            ) : (
              // Standard two-line layout for normal events
              <>
                <View style={styles.header}>
                  <View style={styles.titleRow}>
                    <ActivityIcon type={block.type} size={iconSize} color={blockColor} />
                    <Text style={[styles.title, { color: themeColors.text, fontSize: titleSize }]} numberOfLines={1}>
                      {block.title}
                    </Text>
                  </View>
                  {block.status === 'completed' && (
                    <CheckCircle2 size={statusIconSize} color={Colors.protein} />
                  )}
                  {block.status === 'skipped' && (
                    <X size={statusIconSize} color={themeColors.textSecondary} />
                  )}
                </View>

                <Text style={[styles.time, { color: themeColors.textSecondary, fontSize: timeSize }]} numberOfLines={1}>
                  {to12h(block.startTime)} – {to12h(block.endTime)}  ·  {block.duration}m
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </GestureDetector>
    </Animated.View>
  );
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Convert "HH:MM" (24h) to "h:MM AM/PM" */
function to12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 58, // Align with grid lines: 50px time label + 8px gap
    right: 0,
    paddingRight: 16,
    zIndex: 1,
  },
  card: {
    flex: 1,
    // Use minimal padding for short events (like Outlook/Teams)
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
    borderRadius: 8,
    justifyContent: 'center',
    gap: 2,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 13, // Default for meals/workouts, overridden inline for calendar events
    fontFamily: Fonts.numericSemiBold,
    fontWeight: '600' as const,
    flex: 1,
  },
  time: {
    fontSize: 11, // Default for meals/workouts, overridden inline for calendar events
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  compactText: {
    fontSize: 11, // Default for meals/workouts, overridden inline for calendar events
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
    flex: 1,
  },
});
