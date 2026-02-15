/**
 * SleepTimeStep - Set typical sleep time
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Moon } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { colors } from '@/constants/Theme';

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
          <Moon size={48} color={colors.sleep} />
          <Text style={styles.title}>What time do you go to bed?</Text>
          <Text style={styles.subtitle}>
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
            textColor={colors.text}
            style={styles.picker}
          />
        </View>

        {/* Current Selection */}
        <Text style={styles.selectedTime}>
          {time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>

        {/* Progress */}
        <Text style={styles.progress}>
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Back"
            onPress={onPrevious}
            variant="secondary"
            style={{ flex: 1 }}
          />
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            style={{ flex: 1 }}
          />
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
    fontFamily: 'Urbanist_700Bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Urbanist_400Regular',
    color: colors.textSecondary,
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
    fontFamily: 'SFProRounded-Bold',
    color: colors.sleep,
    textAlign: 'center',
  },
  progress: {
    fontSize: 14,
    fontFamily: 'Urbanist_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
