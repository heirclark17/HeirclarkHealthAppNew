// Muscle Group Volume Chart
// Horizontal bars showing weekly set counts with MEV/MRV markers

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../../contexts/SettingsContext';
import { DarkColors, LightColors, Fonts } from '../../constants/Theme';
import { NumberText } from '../NumberText';
import { MuscleGroup } from '../../types/training';

interface MuscleVolumeData {
  muscleGroup: MuscleGroup;
  weeklySets: number;
  mev?: number;
  mrv?: number;
}

interface MuscleVolumeChartProps {
  data: MuscleVolumeData[];
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  biceps: 'Biceps',
  triceps: 'Triceps',
  calves: 'Calves',
  core: 'Core',
  forearms: 'Forearms',
  legs: 'Legs',
  full_body: 'Full Body',
  cardio: 'Cardio',
};

export default function MuscleVolumeChart({ data }: MuscleVolumeChartProps) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const maxSets = Math.max(25, ...data.map(d => d.weeklySets));

  const getBarColor = (sets: number, mev: number, mrv: number) => {
    if (sets < mev) return colors.error;
    if (sets <= mrv) return colors.success;
    return colors.warningOrange;
  };

  const filteredData = data.filter(d => d.weeklySets > 0 || true); // show all groups

  return (
    <View style={styles.container}>
      {filteredData.map((item) => {
        const mev = item.mev || 10;
        const mrv = item.mrv || 20;
        const barWidth = Math.min((item.weeklySets / maxSets) * 100, 100);
        const mevPosition = (mev / maxSets) * 100;
        const mrvPosition = (mrv / maxSets) * 100;
        const barColor = getBarColor(item.weeklySets, mev, mrv);

        return (
          <View key={item.muscleGroup} style={styles.row}>
            <Text
              style={[styles.label, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {MUSCLE_LABELS[item.muscleGroup] || item.muscleGroup}
            </Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.track,
                  { backgroundColor: isDark ? '#1a1a1a' : '#E5E5E5' },
                ]}
              >
                {/* MEV marker */}
                <View
                  style={[
                    styles.marker,
                    { left: `${mevPosition}%`, backgroundColor: colors.warningOrange + '60' },
                  ]}
                />
                {/* MRV marker */}
                <View
                  style={[
                    styles.marker,
                    { left: `${mrvPosition}%`, backgroundColor: colors.error + '60' },
                  ]}
                />
                {/* Fill bar */}
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${barWidth}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
            </View>
            <NumberText style={[styles.value, { color: barColor }]}>
              {item.weeklySets}
            </NumberText>
          </View>
        );
      })}
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Under MEV</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Optimal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warningOrange }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Over MRV</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    width: 70,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  barContainer: {
    flex: 1,
  },
  track: {
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 1,
  },
  value: {
    width: 28,
    textAlign: 'right',
    fontSize: 13,
    fontFamily: Fonts.numericSemiBold,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
});
