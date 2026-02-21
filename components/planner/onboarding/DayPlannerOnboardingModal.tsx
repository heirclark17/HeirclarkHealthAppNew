/**
 * DayPlannerOnboardingModal - 8-step wizard for planner preferences
 * Guides users through setting up their daily scheduling preferences
 */

import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, Platform, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../../../contexts/SettingsContext';
import { PlannerPreferences, Priority, EnergyPeak, Flexibility } from '../../../types/planner';
import { WelcomeStep } from './WelcomeStep';
import { WakeTimeStep } from './WakeTimeStep';
import { SleepTimeStep } from './SleepTimeStep';
import { PrioritiesStep } from './PrioritiesStep';
import { EnergyPeakStep } from './EnergyPeakStep';
import { FlexibilityStep } from './FlexibilityStep';
import { CalendarPermissionStep } from './CalendarPermissionStep';
import { ReviewStep } from './ReviewStep';

interface Props {
  visible: boolean;
  onComplete: (preferences: PlannerPreferences) => void;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function DayPlannerOnboardingModal({ visible, onComplete, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<PlannerPreferences>>({
    calendarSyncEnabled: false,
  });

  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';

  const totalSteps = 8;

  // Animation values
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const previousStep = useRef(currentStep);

  // Animate step transitions
  useEffect(() => {
    const direction = currentStep > previousStep.current ? 1 : -1;
    previousStep.current = currentStep;

    // Fade out and slide
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -direction * width * 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset position to opposite side
      translateX.setValue(direction * width * 0.3);

      // Fade in and slide to center
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [currentStep]);

  /**
   * Update a single preference field
   */
  const updatePreference = <K extends keyof PlannerPreferences>(
    key: K,
    value: PlannerPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Navigate to next step
   */
  const goToNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  /**
   * Navigate to previous step
   */
  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  /**
   * Complete onboarding
   */
  const handleComplete = () => {
    // Validate all fields are set
    if (
      !preferences.wakeTime ||
      !preferences.sleepTime ||
      !preferences.priorities ||
      !preferences.energyPeak ||
      !preferences.flexibility
    ) {
      console.error('[Onboarding] Missing required preferences');
      return;
    }

    onComplete(preferences as PlannerPreferences);
  };

  /**
   * Render current step
   */
  const renderStep = () => {
    const stepProps = {
      onNext: goToNext,
      onPrevious: goToPrevious,
      currentStep: currentStep + 1,
      totalSteps,
    };

    switch (currentStep) {
      case 0:
        return <WelcomeStep {...stepProps} onClose={onClose} />;

      case 1:
        return (
          <WakeTimeStep
            {...stepProps}
            value={preferences.wakeTime}
            onChange={(value) => updatePreference('wakeTime', value)}
          />
        );

      case 2:
        return (
          <SleepTimeStep
            {...stepProps}
            value={preferences.sleepTime}
            onChange={(value) => updatePreference('sleepTime', value)}
          />
        );

      case 3:
        return (
          <PrioritiesStep
            {...stepProps}
            value={preferences.priorities || []}
            onChange={(value) => updatePreference('priorities', value)}
          />
        );

      case 4:
        return (
          <EnergyPeakStep
            {...stepProps}
            value={preferences.energyPeak}
            onChange={(value) => updatePreference('energyPeak', value)}
          />
        );

      case 5:
        return (
          <FlexibilityStep
            {...stepProps}
            value={preferences.flexibility}
            onChange={(value) => updatePreference('flexibility', value)}
          />
        );

      case 6:
        return (
          <CalendarPermissionStep
            {...stepProps}
            onGranted={() => updatePreference('calendarSyncEnabled', true)}
            onSkipped={() => updatePreference('calendarSyncEnabled', false)}
          />
        );

      case 7:
        return (
          <ReviewStep
            preferences={preferences as PlannerPreferences}
            onConfirm={handleComplete}
            onEdit={(step) => setCurrentStep(step - 1)}
            {...stepProps}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={isDark ? 80 : 90} tint={isDark ? 'dark' : 'light'} style={styles.blurContainer}>
        {/* Semi-transparent overlay for better text contrast */}
        <View
          style={[
            styles.overlay,
            { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)' },
          ]}
        />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={{
              flex: 1,
              opacity,
              transform: [{ translateX }],
            }}
          >
            {renderStep()}
          </Animated.View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
});
