import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChevronLeft } from 'lucide-react-native';
import { Fonts } from '../../constants/Theme';
import { lightImpact } from '../../utils/haptics';

interface WizardHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  onBack: () => void;
  isDark?: boolean;
}

export function WizardHeader({ currentStep, totalSteps, title, onBack, isDark = true }: WizardHeaderProps) {
  const handleBack = async () => {
    await lightImpact();
    onBack();
  };

  // iOS 26 Liquid Glass colors - adaptive based on theme
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)';
  const progressBg = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)';
  const progressFill = isDark ? '#96CEB4' : '#4A9B7A';
  const glassOverlay = isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.35)';


  // Calculate progress percentage
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.headerContainer}>
      {/* iOS 26 Liquid Glass Blur Background */}
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        {/* Frosted glass overlay for depth */}
        <View style={[styles.glassOverlay, { backgroundColor: glassOverlay }]} />
      </BlurView>

      {/* Header Content */}
      <View style={styles.headerContent}>
        {/* Top Row: Back Button + Step Counter */}
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            accessibilityHint="Returns to the previous step"
          >
            <View style={[styles.backButtonInner, { backgroundColor: progressBg }]}>
              <ChevronLeft size={20} color={textColor} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.stepCounter, { color: textSecondary }]}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>

        {/* Modern Progress Bar with Liquid Glass Aesthetic */}
        <View style={styles.progressContainer}>
          {/* Background Track */}
          <View style={[styles.progressTrack, { backgroundColor: progressBg }]}>
            {/* Active Progress Fill with Glow Effect */}
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: progressFill,
                },
              ]}
            >
              {/* Shimmer overlay for liquid glass effect */}
              <View style={styles.shimmerOverlay} />
            </View>
          </View>

          {/* Step Indicators (Dots) */}
          <View style={styles.stepDots}>
            {Array.from({ length: totalSteps }, (_, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              const isPast = stepNumber < currentStep;

              return (
                <View key={stepNumber} style={styles.dotContainer}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isPast || isCurrent ? progressFill : progressBg,
                        transform: [{ scale: isCurrent ? 1.2 : 1 }],
                      },
                    ]}
                  >
                    {isCurrent && <View style={styles.dotPulse} />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    zIndex: 10,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCounter: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.numericSemiBold,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  progressContainer: {
    gap: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    position: 'relative',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'relative',
  },
  dotPulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 206, 180, 0.2)',
    top: -4,
    left: -4,
  },
});
