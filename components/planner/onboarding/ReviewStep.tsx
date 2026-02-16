/**
 * ReviewStep - Review and confirm preferences before completing
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle, Edit2 } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { DarkColors, LightColors, Fonts } from '../../../constants/Theme';
import { PlannerPreferences } from '../../../types/planner';

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
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;
  const surfaceColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const surfaceBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const formatEnergyPeak = (peak: string) => {
    const labels: Record<string, string> = {
      morning: 'Morning Person (6 AM - 12 PM)',
      afternoon: 'Afternoon Peak (12 PM - 5 PM)',
      evening: 'Night Owl (5 PM - 10 PM)',
    };
    return labels[peak] || peak;
  };

  const formatFlexibility = (flex: string) => {
    const labels: Record<string, string> = {
      very: 'Very Flexible',
      somewhat: 'Somewhat Flexible',
      not_very: 'Not Very Flexible',
    };
    return labels[flex] || flex;
  };

  const formatPriorities = (priorities: string[]) => {
    const labels: Record<string, string> = {
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
          <CheckCircle size={48} color={themeColors.protein} />
          <Text style={[styles.title, { color: themeColors.text }]}>Review Your Preferences</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
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
              themeColors={themeColors}
            />
            <ReviewItem
              label="Sleep Time"
              value={formatTime(preferences.sleepTime)}
              onEdit={() => onEdit(3)}
              themeColors={themeColors}
            />
            <ReviewItem
              label="Priorities"
              value={formatPriorities(preferences.priorities)}
              onEdit={() => onEdit(4)}
              themeColors={themeColors}
            />
            <ReviewItem
              label="Energy Peak"
              value={formatEnergyPeak(preferences.energyPeak)}
              onEdit={() => onEdit(5)}
              themeColors={themeColors}
            />
            <ReviewItem
              label="Flexibility"
              value={formatFlexibility(preferences.flexibility)}
              onEdit={() => onEdit(6)}
              themeColors={themeColors}
            />
            <ReviewItem
              label="Calendar Sync"
              value={preferences.calendarSyncEnabled ? 'Enabled' : 'Disabled'}
              onEdit={() => onEdit(7)}
              themeColors={themeColors}
            />
          </View>
        </ScrollView>

        {/* Progress */}
        <Text style={[styles.progress, { color: themeColors.textSecondary }]}>
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onPrevious}
            style={[styles.actionButton, { backgroundColor: surfaceColor, borderColor: surfaceBorder, borderWidth: 1 }]}
          >
            <Text style={[styles.actionButtonText, { color: themeColors.text }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            style={[styles.actionButton, { flex: 2, backgroundColor: themeColors.primary }]}
          >
            <Text style={[styles.actionButtonText, { color: themeColors.primaryText }]}>Complete Setup</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
}

function ReviewItem({
  label,
  value,
  onEdit,
  themeColors,
}: {
  label: string;
  value: string;
  onEdit: () => void;
  themeColors: typeof DarkColors;
}) {
  return (
    <GlassCard style={styles.reviewItem}>
      <View style={styles.reviewContent}>
        <Text style={[styles.reviewLabel, { color: themeColors.textSecondary }]}>{label}</Text>
        <Text style={[styles.reviewValue, { color: themeColors.text }]}>{value}</Text>
      </View>
      <TouchableOpacity
        onPress={onEdit}
        style={[styles.editButton, { backgroundColor: themeColors.primary + '20' }]}
      >
        <Edit2 size={16} color={themeColors.primary} />
      </TouchableOpacity>
    </GlassCard>
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
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
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
  },
  reviewContent: {
    flex: 1,
    gap: 4,
  },
  reviewLabel: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewValue: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '200' as const,
    fontSize: 16,
  },
});
