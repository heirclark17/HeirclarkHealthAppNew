/**
 * SleepTimeStep - Set typical sleep time
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Moon } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  currentStep: number;
  totalSteps: number;
}

export function SleepTimeStep({
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
  const surfaceColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  // Initialize with 10:00 PM or existing value
  const [time, setTime] = useState(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    const date = new Date();
    date.setHours(22, 0, 0, 0);
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
          <Moon size={48} color={Colors.accentPurple} />
          <Text style={[styles.title, { color: themeColors.text }]}>What time do you go to bed?</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Choose your typical bedtime on weeknights
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
        <Text style={[styles.selectedTime, { color: Colors.accentPurple }]}>
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
          <TouchableOpacity
            onPress={onPrevious}
            style={[styles.actionButton, { backgroundColor: surfaceColor }]}
          >
            <Text style={[styles.actionButtonText, { color: themeColors.text }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.actionButton, { flex: 2, backgroundColor: themeColors.primary }]}
          >
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>Next</Text>
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
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.light,
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
    fontFamily: Fonts.numericLight,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
  progress: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  actionButtonText: {
    fontFamily: Fonts.light,
    fontSize: 16,
    fontWeight: '200' as const,
  },
});
