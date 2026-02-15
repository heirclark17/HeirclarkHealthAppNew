/**
 * SegmentedControl - Toggle between multiple options
 * Frosted liquid glass styling with light/dark mode support
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DarkColors, LightColors, Fonts } from '../constants/Theme';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function SegmentedControl({ values, selectedIndex, onChange }: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.05)',
        },
      ]}
    >
      {values.map((value, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.segment,
            index === 0 && styles.firstSegment,
            index === values.length - 1 && styles.lastSegment,
            selectedIndex === index && [
              styles.selectedSegment,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
            ],
          ]}
          onPress={() => onChange(index)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              { color: themeColors.textSecondary },
              selectedIndex === index && {
                color: themeColors.text,
              },
            ]}
          >
            {value}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstSegment: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  lastSegment: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  selectedSegment: {
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
});
