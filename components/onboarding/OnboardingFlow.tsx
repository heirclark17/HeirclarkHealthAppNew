/**
 * Onboarding Flow - 5-screen tutorial for first-time users
 * Guides users through app setup, permissions, and key features
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Theme';
import { GlassCard } from '../GlassCard';
import { Button } from '../Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// iOS 26 Liquid Glass spring physics
const GLASS_SPRING = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

interface OnboardingScreen {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const translateX = useSharedValue(0);

  const screens: OnboardingScreen[] = [
    {
      id: 0,
      icon: 'fitness',
      title: 'Welcome to Heirclark',
      description: 'Your AI-powered nutrition and fitness companion. Track meals, workouts, and progress with intelligent insights tailored to you.',
    },
    {
      id: 1,
      icon: 'target',
      title: 'Set Your Goals',
      description: 'Define your fitness objectives - fat loss, muscle gain, or maintenance. Our AI adapts to your unique metabolism and lifestyle.',
      action: {
        label: 'Set Goals Now',
        onPress: () => {
          // Will integrate with goal wizard
          console.log('Navigate to goal setup');
        },
      },
    },
    {
      id: 2,
      icon: 'heart',
      title: 'Connect Apple Health',
      description: 'Sync your steps, calories, and activity data automatically. Heirclark integrates seamlessly with Apple Health for comprehensive tracking.',
      action: {
        label: 'Connect Apple Health',
        onPress: async () => {
          // Will integrate with health permissions
          console.log('Request health permissions');
        },
      },
    },
    {
      id: 3,
      icon: 'camera',
      title: 'Log Meals in Seconds',
      description: 'Take a photo, speak, scan a barcode, or type. Our AI analyzes nutrition instantly with 90%+ accuracy. Meal logging has never been easier.',
    },
    {
      id: 4,
      icon: 'trending-up',
      title: 'Track Your Progress',
      description: 'View your dashboard daily for insights, predictions, and adaptive recommendations. Your plan gets smarter as you go.',
    },
  ];

  const goToNext = () => {
    if (currentScreen < screens.length - 1) {
      translateX.value = withSpring(
        -(currentScreen + 1) * SCREEN_WIDTH,
        GLASS_SPRING,
        () => {
          runOnJS(setCurrentScreen)(currentScreen + 1);
        }
      );
    } else {
      onComplete();
    }
  };

  const goToPrevious = () => {
    if (currentScreen > 0) {
      translateX.value = withSpring(
        -(currentScreen - 1) * SCREEN_WIDTH,
        GLASS_SPRING,
        () => {
          runOnJS(setCurrentScreen)(currentScreen - 1);
        }
      );
    }
  };

  const skip = () => {
    onComplete();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Skip */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {currentScreen + 1} of {screens.length}
        </Text>
        <Pressable onPress={skip} hitSlop={20}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Screens Container */}
      <Animated.View style={[styles.screensContainer, containerStyle]}>
        {screens.map((screen) => (
          <View key={screen.id} style={styles.screen}>
            <GlassCard style={styles.card} intensity={40}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Ionicons
                  name={screen.icon}
                  size={80}
                  color={Colors.text}
                />
              </View>

              {/* Title */}
              <Text style={styles.title}>{screen.title}</Text>

              {/* Description */}
              <Text style={styles.description}>{screen.description}</Text>

              {/* Action Button (if present) */}
              {screen.action && (
                <Button
                  title={screen.action.label}
                  onPress={screen.action.onPress}
                  variant="primary"
                  style={styles.actionButton}
                />
              )}
            </GlassCard>
          </View>
        ))}
      </Animated.View>

      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        {screens.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentScreen && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        {currentScreen > 0 && (
          <Button
            title="Back"
            onPress={goToPrevious}
            variant="secondary"
            style={styles.navButton}
          />
        )}
        <View style={{ flex: 1 }} />
        <Button
          title={currentScreen === screens.length - 1 ? 'Get Started' : 'Next'}
          onPress={goToNext}
          variant="primary"
          style={styles.navButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Urbanist_400Regular',
  },
  skipText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: 'Urbanist_600SemiBold',
  },
  screensContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  screen: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Urbanist_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Urbanist_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButton: {
    width: '100%',
    marginTop: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.text,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  navButton: {
    minWidth: 120,
  },
});
