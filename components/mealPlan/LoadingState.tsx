import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { Colors, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';

interface LoadingStateProps {
  count?: number;
}

const SkeletonCard = ({ index, colors, isDark }: { index: number; colors: typeof DarkColors; isDark: boolean }) => {
  const opacity = useSharedValue(0.3);

  // iOS Liquid Glass skeleton styling
  const cardBg = isDark ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.7)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)';
  const shimmerBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  React.useEffect(() => {
    opacity.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      )
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.skeletonCard, { backgroundColor: cardBg, borderColor: cardBorder }, animatedStyle]}>
      {/* Meal type indicator */}
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonIcon, { backgroundColor: shimmerBg }]} />
        <View style={[styles.skeletonTitleShort, { backgroundColor: shimmerBg }]} />
      </View>

      {/* Meal name */}
      <View style={[styles.skeletonTitle, { backgroundColor: shimmerBg }]} />

      {/* Description */}
      <View style={[styles.skeletonDescription, { backgroundColor: shimmerBg }]} />
      <View style={[styles.skeletonDescriptionShort, { backgroundColor: shimmerBg }]} />

      {/* Macros row */}
      <View style={styles.skeletonMacroRow}>
        <View style={[styles.skeletonMacro, { backgroundColor: shimmerBg }]} />
        <View style={[styles.skeletonMacro, { backgroundColor: shimmerBg }]} />
        <View style={[styles.skeletonMacro, { backgroundColor: shimmerBg }]} />
        <View style={[styles.skeletonMacro, { backgroundColor: shimmerBg }]} />
      </View>
    </Animated.View>
  );
};

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
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  skeletonTitleShort: {
    width: 60,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  skeletonTitle: {
    width: '70%',
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  skeletonDescription: {
    width: '100%',
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 6,
  },
  skeletonDescriptionShort: {
    width: '60%',
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  skeletonMacroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonMacro: {
    width: 50,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

export default LoadingState;
