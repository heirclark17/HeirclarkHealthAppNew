import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';

interface MacroProgressBarProps {
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  dailyGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
  colors: typeof DarkColors;
  isDark: boolean;
}

const MacroBar = ({ label, value, goal, color, unit = '', colors, isDark }: MacroBarProps) => {
  const percentage = Math.min((value / goal) * 100, 100);
  const widthValue = useSharedValue(0);
  const barBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  React.useEffect(() => {
    widthValue.value = withTiming(percentage, { duration: 800 });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value}%`,
  }));

  return (
    <View style={styles.macroBarContainer}>
      <View style={styles.macroLabelRow}>
        <View style={styles.macroLabelLeft}>
          <View style={[styles.macroDot, { backgroundColor: color }]} />
          <Text style={[styles.macroLabel, { color: colors.text }]}>{label}</Text>
        </View>
        <Text style={[styles.macroValue, { color: colors.textMuted }]}>
          {value}{unit} / {goal}{unit}
        </Text>
      </View>
      <View style={[styles.barContainer, { backgroundColor: barBg }]}>
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: color },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
};

export function MacroProgressBar({ dailyTotals, dailyGoals }: MacroProgressBarProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  return (
    <View style={styles.container}>
      <MacroBar
        label="Calories"
        value={dailyTotals.calories}
        goal={dailyGoals.calories}
        color={colors.calories}
        colors={colors}
        isDark={isDark}
      />
      <MacroBar
        label="Protein"
        value={dailyTotals.protein}
        goal={dailyGoals.protein}
        color={colors.protein}
        unit="g"
        colors={colors}
        isDark={isDark}
      />
      <MacroBar
        label="Carbs"
        value={dailyTotals.carbs}
        goal={dailyGoals.carbs}
        color={colors.carbs}
        unit="g"
        colors={colors}
        isDark={isDark}
      />
      <MacroBar
        label="Fat"
        value={dailyTotals.fat}
        goal={dailyGoals.fat}
        color={colors.fat}
        unit="g"
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  macroBarContainer: {
    gap: 4,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: Fonts.thin,
    letterSpacing: 0.3,
  },
  macroValue: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.thin,
    letterSpacing: 0.5,
  },
  barContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default MacroProgressBar;
