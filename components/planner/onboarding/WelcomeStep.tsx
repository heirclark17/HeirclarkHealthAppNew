/**
 * WelcomeStep - Introduction to Day Planner onboarding
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Clock, Zap } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { colors } from '@/constants/Theme';

interface Props {
  onNext: () => void;
  currentStep: number;
  totalSteps: number;
}

export function WelcomeStep({ onNext, currentStep, totalSteps }: Props) {
  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Calendar size={48} color={colors.primary} />
          <Text style={styles.title}>Welcome to Day Planner</Text>
          <Text style={styles.subtitle}>
            Let's set up your personalized daily scheduling assistant
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            icon={<Clock size={24} color={colors.primary} />}
            title="Smart Scheduling"
            description="AI-powered timeline that balances workouts, meals, and your calendar"
          />
          <FeatureItem
            icon={<Zap size={24} color={colors.protein} />}
            title="Energy Optimization"
            description="Schedule activities when you're at your peak energy level"
          />
          <FeatureItem
            icon={<Calendar size={24} color={colors.carbs} />}
            title="Calendar Integration"
            description="Sync with your device calendar for conflict-free planning"
          />
        </View>

        {/* Progress */}
        <Text style={styles.progress}>
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

function FeatureItem({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
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
    backgroundColor: colors.surface + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
    color: colors.text,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Urbanist_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  progress: {
    fontSize: 14,
    fontFamily: 'Urbanist_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
