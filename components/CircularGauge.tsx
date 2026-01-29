import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Fonts, DarkColors, LightColors } from '../constants/Theme';
import { NumberText } from './NumberText';
import { RoundedNumeral } from './RoundedNumeral';
import { useSettings } from '../contexts/SettingsContext';

interface CircularGaugeProps {
  value: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  unit?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  maxValue,
  size = 200,
  strokeWidth = 12,
  label,
  unit,
}) => {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware gauge background
  const gaugeBgColor = isDark ? Colors.gaugeBg : 'rgba(0, 0, 0, 0.1)';
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / maxValue, 1);
  const strokeDashoffset = circumference * (1 - progress);

  // Create accessibility label with progress percentage
  const percentage = Math.round(progress * 100);
  const accessibilityLabel = label
    ? `${label}: ${value.toLocaleString()}${unit ? ` ${unit}` : ''}, ${percentage}% of ${maxValue.toLocaleString()}`
    : `${value.toLocaleString()}${unit ? ` ${unit}` : ''}, ${percentage}% complete`;

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: maxValue,
        now: value,
        text: `${percentage}%`,
      }}
    >
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gaugeBgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.gaugeFill}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.centerContent}>
        <RoundedNumeral
          value={value}
          size="large"
          style={[styles.mainValue, { color: colors.text }]}
          showCommas={true}
          decimals={0}
        />
        {unit && <Text style={[styles.unit, { color: colors.textMuted }]}>{unit}</Text>}
        {label && <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainValue: {
    fontSize: 48,
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontWeight: '200',
    letterSpacing: 2,
  },
  unit: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
});
