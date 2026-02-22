import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Fonts } from '../../constants/Theme';
import { NumberText } from '../NumberText';

interface WizardHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  icon?: React.ReactNode;
  onBack?: () => void; // Optional now, not used
  isDark?: boolean;
}

export function WizardHeader({ currentStep, totalSteps, title, icon, isDark = true }: WizardHeaderProps) {

  // iOS 26 Liquid Glass colors - adaptive based on theme
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)';
  const glassOverlay = isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.35)';

  return (
    <View style={styles.headerContainer}>
      {/* iOS 26 Liquid Glass Blur Background */}
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        {/* Frosted glass overlay for depth */}
        <View style={[styles.glassOverlay, { backgroundColor: glassOverlay }]} />
      </BlurView>

      {/* Header Content */}
      <View style={styles.headerContent}>
        {/* Top Row: Step Counter */}
        <View style={styles.topRow}>
          <NumberText weight="medium" style={[styles.stepCounter, { color: textSecondary }]}>
            Step {currentStep} of {totalSteps}
          </NumberText>
        </View>

        {/* Title */}
        <View style={styles.titleRow}>
          {icon}
          <NumberText weight="semiBold" style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </NumberText>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    justifyContent: 'center',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 0.5,
  },
});
