/**
 * WelcomeStep - Introduction to Day Planner onboarding
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock, Zap, XCircle, Hand } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { DarkColors, LightColors, Fonts } from '../../../constants/Theme';

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

  const handleClose = () => {
    console.log('[WelcomeStep] Close button pressed');
    console.log('[WelcomeStep] onClose callback exists:', !!onClose);
    if (onClose) {
      console.log('[WelcomeStep] Calling onClose...');
      onClose();
      console.log('[WelcomeStep] onClose called successfully');
    } else {
      console.warn('[WelcomeStep] No onClose callback provided');
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        {/* Close Button */}
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <XCircle size={24} color={themeColors.textSecondary} />
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
            themeColors={themeColors}
          />
          <FeatureItem
            icon={<Zap size={24} color={themeColors.protein} />}
            title="Energy Optimization"
            description="Schedule activities when you're at your peak energy level"
            themeColors={themeColors}
          />
          <FeatureItem
            icon={<Calendar size={24} color={themeColors.carbs} />}
            title="Calendar Integration"
            description="Sync with your device calendar for conflict-free planning"
            themeColors={themeColors}
          />
        </View>

        {/* Progress */}
        <Text style={[styles.progress, { color: themeColors.textSecondary }]}>
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Action Button */}
        <TouchableOpacity onPress={onNext} activeOpacity={0.7}>
          <GlassCard style={styles.actionButton} interactive>
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <Hand size={24} color={themeColors.primary} />
            </View>
          </GlassCard>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

function FeatureItem({ icon, title, description, themeColors }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  themeColors: typeof DarkColors;
}) {
  return (
    <GlassCard style={styles.featureItem}>
      {icon}
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: themeColors.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: themeColors.textSecondary }]}>{description}</Text>
      </View>
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
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.numericSemiBold,
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
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: Fonts.numericSemiBold,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    lineHeight: 20,
  },
  progress: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
