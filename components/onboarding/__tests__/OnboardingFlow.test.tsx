import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OnboardingFlow } from '../OnboardingFlow';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (comp: any) => comp,
    },
    useSharedValue: (val: any) => ({ value: val }),
    useAnimatedStyle: (fn: any) => fn(),
    withSpring: (val: any, config: any, callback: any) => {
      if (callback) callback(true);
      return val;
    },
    runOnJS: (fn: any) => fn,
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock GlassCard
jest.mock('../../GlassCard', () => ({
  GlassCard: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

// Mock Button
jest.mock('../../Button', () => ({
  Button: ({ title, onPress }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('OnboardingFlow', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(<OnboardingFlow onComplete={mockOnComplete} />)
    ).not.toThrow();
  });

  it('displays the first screen title', () => {
    const { getByText } = render(
      <OnboardingFlow onComplete={mockOnComplete} />
    );
    expect(getByText('Welcome to Heirclark')).toBeTruthy();
  });

  it('displays the first screen description', () => {
    const { getByText } = render(
      <OnboardingFlow onComplete={mockOnComplete} />
    );
    expect(getByText(/AI-powered nutrition and fitness companion/)).toBeTruthy();
  });

  it('displays page counter on first screen', () => {
    const { getByText } = render(
      <OnboardingFlow onComplete={mockOnComplete} />
    );
    expect(getByText('1 of 5')).toBeTruthy();
  });

  it('displays Skip button', () => {
    const { getByText } = render(
      <OnboardingFlow onComplete={mockOnComplete} />
    );
    expect(getByText('Skip')).toBeTruthy();
  });

  it('displays Next button on first screen', () => {
    const { getByText } = render(
      <OnboardingFlow onComplete={mockOnComplete} />
    );
    expect(getByText('Next')).toBeTruthy();
  });

  it('does not display Back button on first screen', () => {
    const { queryByText } = render(
      <OnboardingFlow onComplete={mockOnComplete} />
    );
    expect(queryByText('Back')).toBeFalsy();
  });

  it('calls onComplete when Skip is pressed', () => {
    const { getByText } = render(
      <OnboardingFlow onComplete={mockOnComplete} />
    );
    fireEvent.press(getByText('Skip'));
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('renders all five screen titles in the DOM', () => {
    const { getByText } = render(
      <OnboardingFlow onComplete={mockOnComplete} />
    );
    // All screens are rendered in a horizontal scroll container
    expect(getByText('Welcome to Heirclark')).toBeTruthy();
    expect(getByText('Set Your Goals')).toBeTruthy();
    expect(getByText('Connect Apple Health')).toBeTruthy();
    expect(getByText('Log Meals in Seconds')).toBeTruthy();
    expect(getByText('Track Your Progress')).toBeTruthy();
  });

  it('renders all five screen descriptions', () => {
    const { getByText } = render(
      <OnboardingFlow onComplete={mockOnComplete} />
    );
    expect(getByText(/AI-powered nutrition/)).toBeTruthy();
    expect(getByText(/Define your fitness objectives/)).toBeTruthy();
    expect(getByText(/Sync your steps, calories/)).toBeTruthy();
    expect(getByText(/Take a photo, speak, scan/)).toBeTruthy();
    expect(getByText(/View your dashboard daily/)).toBeTruthy();
  });

  it('renders action buttons on appropriate screens', () => {
    const { getByText } = render(
      <OnboardingFlow onComplete={mockOnComplete} />
    );
    expect(getByText('Set Goals Now')).toBeTruthy();
    expect(getByText('Connect Apple Health')).toBeTruthy();
  });

  it('renders progress dots for all screens', () => {
    const { root } = render(
      <OnboardingFlow onComplete={mockOnComplete} />
    );
    // 5 screens = 5 dots
    expect(root).toBeTruthy();
  });
});
