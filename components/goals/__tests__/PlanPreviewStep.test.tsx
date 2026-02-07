import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock contexts
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark', weightUnit: 'lbs' },
  }),
}));

const mockCalculateResults = jest.fn().mockReturnValue({
  dailyCalories: 2000,
  protein: 150,
  carbs: 200,
  fat: 70,
  bmr: 1800,
  tdee: 2500,
  bmi: 25.0,
  weeklyDeficit: 500,
  weeksToGoal: 10,
});

const mockSaveGoals = jest.fn();

jest.mock('../../../contexts/GoalWizardContext', () => ({
  useGoalWizard: () => ({
    state: {
      currentWeight: 180,
      targetWeight: 170,
      weightUnit: 'lbs',
      heightFt: 5,
      heightIn: 10,
      age: 30,
      sex: 'male',
      activityLevel: 'moderate',
      goalType: 'lose_weight',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-06-01'),
      dietStyle: 'standard',
      mealsPerDay: 3,
      results: {
        dailyCalories: 2000,
        protein: 150,
        carbs: 200,
        fat: 70,
        bmr: 1800,
        tdee: 2500,
        bmi: 25.0,
        weeklyDeficit: 500,
        weeksToGoal: 10,
      },
    },
    calculateResults: mockCalculateResults,
    saveGoals: mockSaveGoals,
  }),
}));

jest.mock('../../../contexts/FoodPreferencesContext', () => ({
  useFoodPreferencesSafe: () => ({
    preferences: {
      proteins: ['chicken', 'fish'],
      vegetables: ['broccoli'],
      starches: ['rice'],
      snacks: [],
      cuisines: ['Italian'],
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
    FadeInDown: { delay: () => ({ springify: () => ({}) }) },
    FadeIn: { delay: () => ({}) },
  };
});

// Mock haptics
jest.mock('../../../utils/haptics', () => ({
  lightImpact: jest.fn(),
  selectionFeedback: jest.fn(),
  mediumImpact: jest.fn(),
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

import { PlanPreviewStep } from '../PlanPreviewStep';

describe('PlanPreviewStep', () => {
  const mockProps = {
    onBack: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<PlanPreviewStep {...mockProps} />)).not.toThrow();
  });

  it('displays the main title', () => {
    const { getByText } = render(<PlanPreviewStep {...mockProps} />);
    expect(getByText('Your Personalized Plan')).toBeTruthy();
  });

  it('displays daily calories section', () => {
    const { getByText } = render(<PlanPreviewStep {...mockProps} />);
    expect(getByText('DAILY CALORIES')).toBeTruthy();
  });

  it('displays CONFIRM MY PLAN button', () => {
    const { getByText } = render(<PlanPreviewStep {...mockProps} />);
    expect(getByText('CONFIRM MY PLAN')).toBeTruthy();
  });

  it('displays ADJUST button', () => {
    const { getByText } = render(<PlanPreviewStep {...mockProps} />);
    expect(getByText('ADJUST')).toBeTruthy();
  });

  it('calls onBack when ADJUST is pressed', () => {
    const { getByText } = render(<PlanPreviewStep {...mockProps} />);
    fireEvent.press(getByText('ADJUST'));
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('calls onConfirm when CONFIRM MY PLAN is pressed', () => {
    const { getByText } = render(<PlanPreviewStep {...mockProps} />);
    fireEvent.press(getByText('CONFIRM MY PLAN'));
    expect(mockProps.onConfirm).toHaveBeenCalled();
  });
});
