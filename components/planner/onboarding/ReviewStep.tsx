/**
 * ReviewStep - Review and confirm preferences before completing
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle, Edit2 } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { colors } from '@/constants/Theme';
import { PlannerPreferences } from '@/types/planner';

interface Props {
  preferences: PlannerPreferences;
  onConfirm: () => void;
  onEdit: (step: number) => void;
  onPrevious: () => void;
  currentStep: number;
  totalSteps: number;
}

export function ReviewStep({
  preferences,
  onConfirm,
  onEdit,
  onPrevious,
  currentStep,
  totalSteps,
}: Props) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const formatEnergyPeak = (peak: string) => {
    const labels = {
      morning: 'Morning Person (6 AM - 12 PM)',
      afternoon: 'Afternoon Peak (12 PM - 5 PM)',
      evening: 'Night Owl (5 PM - 10 PM)',
    };
    return labels[peak] || peak;
  };

  const formatFlexibility = (flex: string) => {
    const labels = {
      very: 'Very Flexible',
      somewhat: 'Somewhat Flexible',
      not_very: 'Not Very Flexible',
    };
    return labels[flex] || flex;
  };

  const formatPriorities = (priorities: string[]) => {
    const labels = {
      health: 'Health & Fitness',
      work: 'Work & Career',
      family: 'Family & Friends',
      learning: 'Learning',
      hobbies: 'Hobbies',
      relaxation: 'Relaxation',
    };
    return priorities.map((p) => labels[p] || p).join(', ');
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <CheckCircle size={48} color={colors.protein} />
          <Text style={styles.title}>Review Your Preferences</Text>
          <Text style={styles.subtitle}>
            Make sure everything looks good before we create your schedule
          </Text>
        </View>

        {/* Preferences Review */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.reviewList}>
            <ReviewItem
              label="Wake Time"
              value={formatTime(preferences.wakeTime)}
              onEdit={() => onEdit(2)}
            />
            <ReviewItem
              label="Sleep Time"
              value={formatTime(preferences.sleepTime)}
              onEdit={() => onEdit(3)}
            />
            <ReviewItem
              label="Priorities"
              value={formatPriorities(preferences.priorities)}
              onEdit={() => onEdit(4)}
            />
            <ReviewItem
              label="Energy Peak"
              value={formatEnergyPeak(preferences.energyPeak)}
              onEdit={() => onEdit(5)}
            />
            <ReviewItem
              label="Flexibility"
              value={formatFlexibility(preferences.flexibility)}
              onEdit={() => onEdit(6)}
            />
            <ReviewItem
              label="Calendar Sync"
              value={preferences.calendarSyncEnabled ? 'Enabled' : 'Disabled'}
              onEdit={() => onEdit(7)}
            />
          </View>
        </ScrollView>

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
            title="Complete Setup"
            onPress={onConfirm}
            variant="primary"
            style={{ flex: 1 }}
          />
        </View>
      </GlassCard>
    </View>
  );
}

function ReviewItem({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewContent}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue}>{value}</Text>
      </View>
      <TouchableOpacity onPress={onEdit} style={styles.editButton}>
        <Edit2 size={16} color={colors.primary} />
      </TouchableOpacity>
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
    maxHeight: '90%',
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
  scrollView: {
    flexGrow: 0,
  },
  reviewList: {
    gap: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface + '40',
    borderRadius: 12,
    padding: 16,
  },
  reviewContent: {
    flex: 1,
    gap: 4,
  },
  reviewLabel: {
    fontSize: 12,
    fontFamily: 'Urbanist_500Medium',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewValue: {
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
    color: colors.text,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
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
