import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

interface StepDotProps {
  stepNumber: number;
  currentStep: number;
  label?: string;
  colors: typeof DarkColors;
  isDark: boolean;
}

function StepDot({ stepNumber, currentStep, label, colors, isDark }: StepDotProps) {
  const isActive = stepNumber <= currentStep;
  const isCurrent = stepNumber === currentStep;

  const scale = useSharedValue(1);
  const progress = useSharedValue(isActive ? 1 : 0);

  // Theme-aware unselected colors
  const unselectedBg = isDark ? colors.backgroundSecondary : 'rgba(0,0,0,0.05)';
  const unselectedBorder = colors.border;
  const unselectedText = colors.textMuted;

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, GLASS_SPRING);
    if (isCurrent) {
      scale.value = withSpring(1.1, { damping: 10, stiffness: 200 });
    } else {
      scale.value = withSpring(1, { damping: 15 });
    }
  }, [isActive, isCurrent, scale, progress]);

  const dotStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [unselectedBg, Colors.success]
    );
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      [unselectedBorder, Colors.success]
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1],
      [unselectedText, Colors.background]
    );
    return { color };
  });

  return (
    <View style={styles.stepContainer}>
      <Animated.View style={[styles.dot, dotStyle]}>
        <Animated.Text style={[styles.dotText, textStyle]}>
          {stepNumber}
        </Animated.Text>
      </Animated.View>
      {label && (
        <Text style={[styles.label, { color: colors.textMuted }, isActive && styles.labelActive]}>
          {label}
        </Text>
      )}
    </View>
  );
}

interface ConnectorProps {
  isActive: boolean;
  colors: typeof DarkColors;
}

function Connector({ isActive, colors }: ConnectorProps) {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, GLASS_SPRING);
  }, [isActive, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.connectorContainer}>
      <View style={[styles.connectorBackground, { backgroundColor: colors.border }]} />
      <Animated.View style={[styles.connectorFill, fillStyle]} />
    </View>
  );
}

export function StepProgressBar({ currentStep, totalSteps, labels }: StepProgressBarProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const defaultLabels = ['Goal', 'Body', 'Activity', 'Nutrition', 'Review'];
  const stepLabels = labels || defaultLabels.slice(0, totalSteps);

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <React.Fragment key={index}>
            <StepDot
              stepNumber={index + 1}
              currentStep={currentStep}
              label={stepLabels[index]}
              colors={colors}
              isDark={isDark}
            />
            {index < totalSteps - 1 && (
              <Connector isActive={currentStep > index + 1} colors={colors} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    width: 56,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
  },
  dotText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.success,
  },
  connectorContainer: {
    flex: 1,
    height: 2,
    marginTop: 15,
    marginHorizontal: -4,
    position: 'relative',
  },
  connectorBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  connectorFill: {
    position: 'absolute',
    left: 0,
    height: 2,
    backgroundColor: Colors.success,
    borderRadius: 1,
  },
});
