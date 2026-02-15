/**
 * TimeBlockCard - Individual time block with swipe gestures
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, X } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { ActivityIcon } from '../shared/ActivityIcon';
import { TimeBlock } from '../../../types/planner';
import { Colors } from '../../../constants/Theme';

interface Props {
  block: TimeBlock;
  onPress: () => void;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}

export function TimeBlockCard({ block, onPress, onSwipeRight, onSwipeLeft }: Props) {
  const translateX = useSharedValue(0);

  // Calculate position (absolute positioning in timeline)
  const startMinutes = timeToMinutes(block.startTime);
  const top = ((startMinutes - 6 * 60) / 60) * 60; // Offset from 6 AM
  const height = (block.duration / 60) * 60; // 60px per hour

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

  return (
    <Animated.View
      style={[
        styles.container,
        { top, height, minHeight: 40 },
        animatedStyle,
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={{ flex: 1 }}
        >
          <GlassCard
            style={[
              styles.card,
              {
                backgroundColor: block.color + '20',
                borderLeftColor: block.color,
              },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <ActivityIcon type={block.type} size={16} color={block.color} />
                <Text style={styles.title} numberOfLines={1}>
                  {block.title}
                </Text>
              </View>
              {block.status === 'completed' && (
                <CheckCircle2 size={16} color={Colors.protein} />
              )}
              {block.status === 'skipped' && (
                <X size={16} color={Colors.textSecondary} />
              )}
            </View>

            <Text style={styles.time}>
              {block.startTime} - {block.endTime}
            </Text>

            {height > 60 && (
              <Text style={styles.duration} numberOfLines={1}>
                {block.duration} min
              </Text>
            )}
          </GlassCard>
        </TouchableOpacity>
      </GestureDetector>
    </Animated.View>
  );
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 60,
    right: 0,
    paddingRight: 16,
  },
  card: {
    flex: 1,
    padding: 12,
    borderLeftWidth: 4,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Urbanist_600SemiBold',
    color: Colors.text,
    flex: 1,
  },
  time: {
    fontSize: 12,
    fontFamily: 'SFProRounded-Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  duration: {
    fontSize: 10,
    fontFamily: 'Urbanist_500Medium',
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
