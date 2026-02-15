/**
 * WelcomeStep - Introduction to Day Planner onboarding
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Clock, Zap } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { Button } from '../../Button';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  onNext: () => void;
  currentStep: number;
  totalSteps: number;
}

export function WelcomeStep({ onNext, currentStep, totalSteps }: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
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
        <Button
          title="Get Started"
          onPress={onNext}
          variant="primary"
        />
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
  header: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.semiBold,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  progress: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    textAlign: 'center',
  },
});
