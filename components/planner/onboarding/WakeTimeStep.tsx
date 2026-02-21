/**
 * WakeTimeStep - Set typical wake time
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Sun, Hand } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  currentStep: number;
  totalSteps: number;
}

export function WakeTimeStep({
  value,
  onChange,
  onNext,
  onPrevious,
  currentStep,
  totalSteps,
}: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  // Initialize with 6:00 AM or existing value
  const [time, setTime] = useState(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    const date = new Date();
    date.setHours(6, 0, 0, 0);
    return date;
  });

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTime(selectedDate);
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
  };

  const handleNext = () => {
    if (!value) {
      // Auto-save current time if not manually set
      const hours = String(time.getHours()).padStart(2, '0');
      const minutes = String(time.getMinutes()).padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
    onNext();
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Sun size={48} color={themeColors.protein} />
          <Text style={[styles.title, { color: themeColors.text }]}>What time do you wake up?</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Choose your typical wake time on weekdays
          </Text>
        </View>

        {/* Time Picker */}
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            textColor={themeColors.text}
            style={styles.picker}
          />
        </View>

        {/* Current Selection */}
        <Text style={[styles.selectedTime, { color: themeColors.text }]}>
          {time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>

        {/* Progress */}
        <Text style={[styles.progress, { color: themeColors.textSecondary }]}>
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onPrevious} activeOpacity={0.7}>
            <GlassCard style={styles.actionButton} interactive>
              <View style={{ transform: [{ rotate: '-90deg' }, { scaleX: -1 }] }}>
                <Hand size={24} color={themeColors.text} />
              </View>
            </GlassCard>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} activeOpacity={0.7}>
            <GlassCard style={styles.actionButton} interactive>
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <Hand size={24} color={themeColors.primary} />
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
    lineHeight: 24,
  },
  pickerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  picker: {
    width: '100%',
    height: 200,
  },
  selectedTime: {
    fontSize: 32,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
  },
  progress: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
