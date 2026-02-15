/**
 * TimeBlockCard - Individual time block with swipe gestures
 *
 * Uses a plain View instead of GlassCard to avoid double padding
 * and overflow:hidden clipping that cut off text in short blocks.
 */

import React from 'react';
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
}

export function TimeBlockCard({ block, onPress, onSwipeRight, onSwipeLeft }: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const translateX = useSharedValue(0);

  // Calculate position (absolute positioning in timeline)
  const startMinutes = timeToMinutes(block.startTime);
  const top = ((startMinutes - 6 * 60) / 60) * 60; // Offset from 6 AM
  const height = Math.max((block.duration / 60) * 60, 56); // 60px per hour, min 56px

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
  const cardBg = isDark
    ? (block.color + (isCalendarEvent ? '35' : '25'))
    : (block.color + (isCalendarEvent ? '22' : '15'));
  const cardBorder = isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.06)';

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
                borderLeftColor: block.color,
                borderLeftWidth: isCalendarEvent ? 4 : 3,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <ActivityIcon type={block.type} size={14} color={block.color} />
                <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
                  {block.title}
                </Text>
              </View>
              {block.status === 'completed' && (
                <CheckCircle2 size={14} color={Colors.protein} />
              )}
              {block.status === 'skipped' && (
                <X size={14} color={themeColors.textSecondary} />
              )}
            </View>

            <Text style={[styles.time, { color: themeColors.textSecondary }]} numberOfLines={1}>
              {to12h(block.startTime)} – {to12h(block.endTime)}  ·  {block.duration}m
            </Text>
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
    left: 60,
    right: 0,
    paddingRight: 16,
    zIndex: 1,
  },
  card: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
    borderWidth: 0.5,
    borderRadius: 12,
    justifyContent: 'center',
    gap: 3,
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
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    flex: 1,
  },
  time: {
    fontSize: 11,
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
  },
});
