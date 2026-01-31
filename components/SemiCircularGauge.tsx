import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors, Fonts, DarkColors, LightColors } from '../constants/Theme';
import { RoundedNumeral } from './RoundedNumeral';
import { useSettings } from '../contexts/SettingsContext';

interface SemiCircularGaugeProps {
  value: number;
  maxValue: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  unit?: string;
  progressColor?: string;
  showCenterValue?: boolean;
  useRoundedNumeral?: boolean;
}

export const SemiCircularGauge: React.FC<SemiCircularGaugeProps> = ({
  value,
  maxValue,
  size = 300,
  strokeWidth = 24,
  label = 'kcal',
  unit = 'kcal',
  progressColor = Colors.gaugeFill,
  showCenterValue = true,
  useRoundedNumeral = true,
}) => {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Background arc color based on theme
  const bgArcColor = isDark ? Colors.gaugeBg : 'rgba(0, 0, 0, 0.15)';

  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = radius + strokeWidth / 2;

  // Calculate percentage (0-100)
  const percentage = Math.min((value / maxValue) * 100, 100);

  // Semi-circle goes from -180° to 0° (180° total arc)
  const startAngle = -180;
  const endAngle = startAngle + (percentage / 100) * 180;

  // Convert angles to radians and calculate arc path
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Background arc (gray semi-circle)
  const bgStartX = centerX + radius * Math.cos(startRad);
  const bgStartY = centerY + radius * Math.sin(startRad);
  const bgEndX = centerX + radius * Math.cos(0);
  const bgEndY = centerY + radius * Math.sin(0);

  const bgPath = `
    M ${bgStartX} ${bgStartY}
    A ${radius} ${radius} 0 0 1 ${bgEndX} ${bgEndY}
  `;

  // Progress arc
  const progressStartX = centerX + radius * Math.cos(startRad);
  const progressStartY = centerY + radius * Math.sin(startRad);
  const progressEndX = centerX + radius * Math.cos(endRad);
  const progressEndY = centerY + radius * Math.sin(endRad);

  const progressPath = `
    M ${progressStartX} ${progressStartY}
    A ${radius} ${radius} 0 0 1 ${progressEndX} ${progressEndY}
  `;

  // Create accessibility label
  const accessibilityLabel = `${label}: ${Math.round(value).toLocaleString()} ${unit} of ${maxValue.toLocaleString()} ${unit} goal, ${Math.round(percentage)}% complete`;

  // Scale text sizes based on gauge size
  const isSmall = size < 150;
  const valueFontSize = isSmall ? 24 : 72;
  const unitFontSize = isSmall ? 10 : 16;
  const goalFontSize = isSmall ? 9 : 14;
  const centerContentBottom = isSmall ? size * 0.15 : 30;
  const goalTextBottom = isSmall ? 5 : 10;

  return (
    <View
      style={[styles.container, { width: size, height: size / 2 + strokeWidth / 2 + 40 }]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: maxValue,
        now: value,
        text: `${Math.round(percentage)}%`,
      }}
    >
      {/* SVG Gauge */}
      <Svg width={size} height={size / 2 + strokeWidth / 2} viewBox={`0 0 ${size} ${size / 2 + strokeWidth / 2}`}>
        {/* Background arc (gray) */}
        <Path
          d={bgPath}
          fill="none"
          stroke={bgArcColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress arc */}
        {percentage > 0 && (
          <Path
            d={progressPath}
            fill="none"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Dot at end of progress */}
        {percentage > 0 && (
          <Circle
            cx={progressEndX}
            cy={progressEndY}
            r={strokeWidth / 2}
            fill={progressColor}
          />
        )}
      </Svg>

      {/* Center text - only show if showCenterValue is true */}
      {showCenterValue && (
        <View style={[styles.centerContent, { bottom: centerContentBottom }]}>
          <View style={styles.valueRow}>
            {useRoundedNumeral ? (
              <RoundedNumeral
                value={Math.round(value)}
                size={isSmall ? 'small' : 'large'}
                style={[styles.valueText, { fontSize: valueFontSize, color: colors.text }]}
                showCommas={false}
                decimals={0}
              />
            ) : (
              <Text style={[styles.valueText, { fontSize: valueFontSize, color: colors.text }]}>
                {Math.round(value).toLocaleString()}
              </Text>
            )}
            {label && <Text style={[styles.unitText, { fontSize: unitFontSize, marginLeft: 4, color: colors.textSecondary }]}>{label}</Text>}
          </View>
        </View>
      )}

      {/* Bottom goal text */}
      {unit && (
        <Text style={[styles.goalText, { fontSize: goalFontSize, bottom: goalTextBottom, color: colors.textSecondary }]}>
          of <Text style={[styles.goalText, { fontSize: goalFontSize, color: colors.textSecondary }]}>{maxValue.toLocaleString()}</Text> {unit} goal
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueText: {
    fontSize: 72,
    fontFamily: Fonts.regular,
    fontWeight: '100',
    color: Colors.text,
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  goalText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    position: 'absolute',
    bottom: 10,
  },
});
