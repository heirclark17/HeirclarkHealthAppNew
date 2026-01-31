/**
 * Onboarding Screen - First-time user experience
 * Shows 5-screen tutorial and guides initial setup
 */
import React from 'react';
import { router } from 'expo-router';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen() {
  const handleComplete = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Navigate anyway
      router.replace('/(tabs)');
    }
  };

  return <OnboardingFlow onComplete={handleComplete} />;
}
