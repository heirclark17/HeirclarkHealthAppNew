import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  useSharedValue,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import { Colors, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

interface LoadingStateProps {
  count?: number;
}

function SkeletonCard({ index, colors, isDark }: { index: number; colors: any; isDark: boolean }) {
  const cardBg = isDark ? Colors.card : 'rgba(255, 255, 255, 0.9)';
  const borderColor = isDark ? Colors.border : 'rgba(0, 0, 0, 0.1)';
  const secondaryBg = isDark ? Colors.backgroundSecondary : 'rgba(0, 0, 0, 0.05)';
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      index * 150,
      withRepeat(
        withSequence(
          withSpring(0.7, GLASS_SPRING),
          withSpring(0.3, GLASS_SPRING)
        ),
        -1,
        true
      )
    );

    // Cleanup animation on unmount to prevent memory leaks
    return () => {
      cancelAnimation(opacity);
    };
  }, [index, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.skeletonCard, animatedStyle, { backgroundColor: cardBg, borderColor }]}>
      {/* Header */}
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonIcon, { backgroundColor: secondaryBg }]} />
        <View style={styles.skeletonHeaderText}>
          <View style={[styles.skeletonTitle, { backgroundColor: secondaryBg }]} />
          <View style={[styles.skeletonSubtitle, { backgroundColor: secondaryBg }]} />
        </View>
        <View style={[styles.skeletonBadge, { backgroundColor: secondaryBg }]} />
      </View>

      {/* Exercise rows */}
      <View style={styles.skeletonExercises}>
        <View style={[styles.skeletonExerciseRow, { backgroundColor: secondaryBg }]} />
        <View style={[styles.skeletonExerciseRow, { width: '75%', backgroundColor: secondaryBg }]} />
        <View style={[styles.skeletonExerciseRow, { width: '85%', backgroundColor: secondaryBg }]} />
      </View>

      {/* Footer stats */}
      <View style={styles.skeletonFooter}>
        <View style={[styles.skeletonStat, { backgroundColor: secondaryBg }]} />
        <View style={[styles.skeletonStat, { backgroundColor: secondaryBg }]} />
        <View style={[styles.skeletonStat, { backgroundColor: secondaryBg }]} />
      </View>
    </Animated.View>
  );
}

export function LoadingState({ count = 4 }: LoadingStateProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} index={index} colors={colors} isDark={isDark} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
  },
  skeletonHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonTitle: {
    height: 18,
    width: '60%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 14,
    width: '40%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 60,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  skeletonExercises: {
    gap: 10,
    marginBottom: 16,
  },
  skeletonExerciseRow: {
    height: 12,
    width: '90%',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  skeletonStat: {
    width: 60,
    height: 14,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
  },
});
