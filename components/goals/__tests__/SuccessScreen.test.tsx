import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock contexts
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark', weightUnit: 'lbs', liveAvatar: false },
  }),
}));

jest.mock('../../../contexts/GoalWizardContext', () => ({
  useGoalWizard: () => ({
    state: {
      currentWeight: 180,
      targetWeight: 170,
      goalType: 'lose_weight',
      dailyCalories: 2000,
      results: {
        dailyCalories: 2000,
        protein: 150,
        carbs: 200,
        fat: 70,
      },
    },
    resetWizard: jest.fn(),
    calculateResults: jest.fn().mockReturnValue({
      dailyCalories: 2000,
      protein: 150,
      carbs: 200,
      fat: 70,
    }),
  }),
}));

jest.mock('../../../contexts/FoodPreferencesContext', () => ({
  useFoodPreferencesSafe: () => ({
    preferences: {
      proteins: [],
      vegetables: [],
      starches: [],
      snacks: [],
      cuisines: [],
      dislikedFoods: [],
      cheatDays: [],
    },
  }),
}));

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: any) => c },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
    withSpring: (v: any) => v,
    withRepeat: (v: any) => v,
    withSequence: (...args: any[]) => args[0],
    Easing: { inOut: () => undefined, ease: undefined },
    FadeInDown: { delay: () => ({ springify: () => ({}) }) },
    FadeIn: { delay: () => ({}) },
    cancelAnimation: jest.fn(),
  };
});

// Mock haptics
jest.mock('../../../utils/haptics', () => ({
  lightImpact: jest.fn(),
  selectionFeedback: jest.fn(),
  mediumImpact: jest.fn(),
  heavyImpact: jest.fn(),
}));

// Mock GlassCard
jest.mock('../../GlassCard', () => ({
  GlassCard: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock NumberText
jest.mock('../../NumberText', () => ({
  NumberText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

// Mock RoundedNumeral
jest.mock('../../RoundedNumeral', () => ({
  RoundedNumeral: ({ value, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{value}</Text>;
  },
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

import { SuccessScreen } from '../SuccessScreen';

describe('SuccessScreen', () => {
  const mockProps = {
    onLogMeal: jest.fn(),
    onViewDashboard: jest.fn(),
    onAdjust: jest.fn(),
    onViewAvatar: jest.fn(),
    onStartMealPlan: jest.fn(),
    onStartTrainingPlan: jest.fn(),
    isGeneratingMealPlan: false,
    isGeneratingTrainingPlan: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<SuccessScreen {...mockProps} />)).not.toThrow();
  });

  it('displays success title', () => {
    const { getByText } = render(<SuccessScreen {...mockProps} />);
    expect(getByText("You're All Set!")).toBeTruthy();
  });

  it('displays daily targets section', () => {
    const { getByText } = render(<SuccessScreen {...mockProps} />);
    expect(getByText('YOUR DAILY TARGETS')).toBeTruthy();
  });

  it('renders log meal button with testID', () => {
    const { getByTestId } = render(<SuccessScreen {...mockProps} />);
    expect(getByTestId('log-meal-button')).toBeTruthy();
  });

  it('renders view dashboard button with testID', () => {
    const { getByTestId } = render(<SuccessScreen {...mockProps} />);
    expect(getByTestId('view-dashboard-button')).toBeTruthy();
  });

  it('calls onLogMeal when log meal button is pressed', () => {
    const { getByTestId } = render(<SuccessScreen {...mockProps} />);
    fireEvent.press(getByTestId('log-meal-button'));
    expect(mockProps.onLogMeal).toHaveBeenCalled();
  });

  it('calls onViewDashboard when view dashboard button is pressed', () => {
    const { getByTestId } = render(<SuccessScreen {...mockProps} />);
    fireEvent.press(getByTestId('view-dashboard-button'));
    expect(mockProps.onViewDashboard).toHaveBeenCalled();
  });

  it('renders adjust goals button with testID', () => {
    const { getByTestId } = render(<SuccessScreen {...mockProps} />);
    expect(getByTestId('adjust-goals-button')).toBeTruthy();
  });

  it('calls onAdjust when adjust goals button is pressed', () => {
    const { getByTestId } = render(<SuccessScreen {...mockProps} />);
    fireEvent.press(getByTestId('adjust-goals-button'));
    expect(mockProps.onAdjust).toHaveBeenCalled();
  });

  it('displays LOG YOUR FIRST MEAL text', () => {
    const { getByText } = render(<SuccessScreen {...mockProps} />);
    expect(getByText('LOG YOUR FIRST MEAL')).toBeTruthy();
  });

  it('displays DASHBOARD text', () => {
    const { getByText } = render(<SuccessScreen {...mockProps} />);
    expect(getByText('DASHBOARD')).toBeTruthy();
  });
});
