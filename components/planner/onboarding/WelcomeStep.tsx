/**
 * WelcomeStep - Introduction to Day Planner onboarding
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock, Zap, X } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  onNext: () => void;
  onClose?: () => void;
  currentStep: number;
  totalSteps: number;
}

export function WelcomeStep({ onNext, onClose, currentStep, totalSteps }: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        {/* Close Button */}
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Calendar size={48} color={themeColors.primary} />
          <Text style={[styles.title, { color: themeColors.text }]}>Welcome to Day Planner</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Let's set up your personalized daily scheduling assistant
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            icon={<Clock size={24} color={themeColors.primary} />}
            title="Smart Scheduling"
            description="AI-powered timeline that balances workouts, meals, and your calendar"
            isDark={isDark}
            themeColors={themeColors}
          />
          <FeatureItem
            icon={<Zap size={24} color={Colors.protein} />}
            title="Energy Optimization"
            description="Schedule activities when you're at your peak energy level"
            isDark={isDark}
            themeColors={themeColors}
          />
          <FeatureItem
            icon={<Calendar size={24} color={Colors.carbs} />}
            title="Calendar Integration"
            description="Sync with your device calendar for conflict-free planning"
            isDark={isDark}
            themeColors={themeColors}
          />
        </View>

        {/* Progress */}
        <Text style={[styles.progress, { color: themeColors.textSecondary }]}>
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Action Button */}
        <TouchableOpacity
          onPress={onNext}
          style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
        >
          <Text style={[styles.actionButtonText, { color: '#fff' }]}>Get Started</Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

function FeatureItem({ icon, title, description, isDark, themeColors }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isDark: boolean;
  themeColors: typeof DarkColors;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={[
        styles.iconContainer,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
      ]}>
        {icon}
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: themeColors.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: themeColors.textSecondary }]}>{description}</Text>
      </View>
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
    gap: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
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
  features: {
    gap: 16,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: Fonts.light,
    lineHeight: 20,
  },
  progress: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
  },
  actionButton: {
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
