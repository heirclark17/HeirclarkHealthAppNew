// @ts-nocheck
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock contexts
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark', weightUnit: 'lbs' },
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

import { ResultsStep } from '../ResultsStep';

describe('ResultsStep', () => {
  const mockResults = {
    dailyCalories: 2000,
    protein: 150,
    carbs: 200,
    fat: 70,
    bmr: 1800,
    tdee: 2500,
    bmi: 25.0,
    weeklyDeficit: 500,
    weeksToGoal: 10,
  };

  const mockProps = {
    results: mockResults,
    goalType: 'lose_weight' as const,
    currentWeight: 180,
    targetWeight: 170,
    onBack: jest.fn(),
    onSave: jest.fn(),
    isSaving: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ResultsStep {...mockProps} />)).not.toThrow();
  });

  it('displays the title', () => {
    const { getByText } = render(<ResultsStep {...mockProps} />);
    expect(getByText('Your Daily Targets')).toBeTruthy();
  });

  it('displays calorie information', () => {
    const { getByText } = render(<ResultsStep {...mockProps} />);
    expect(getByText('Calories per Day')).toBeTruthy();
  });

  it('displays macronutrient labels', () => {
    const { getByText } = render(<ResultsStep {...mockProps} />);
    expect(getByText('Protein')).toBeTruthy();
    expect(getByText('Carbs')).toBeTruthy();
    expect(getByText('Fat')).toBeTruthy();
  });

  it('displays SAVE MY PLAN button', () => {
    const { getByText } = render(<ResultsStep {...mockProps} />);
    expect(getByText('SAVE MY PLAN')).toBeTruthy();
  });

  it('displays ADJUST GOALS button', () => {
    const { getByText } = render(<ResultsStep {...mockProps} />);
    expect(getByText('ADJUST GOALS')).toBeTruthy();
  });

  it('calls onBack when ADJUST GOALS is pressed', () => {
    const { getByText } = render(<ResultsStep {...mockProps} />);
    fireEvent.press(getByText('ADJUST GOALS'));
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('calls onSave when SAVE MY PLAN is pressed', () => {
    const { getByText } = render(<ResultsStep {...mockProps} />);
    fireEvent.press(getByText('SAVE MY PLAN'));
    expect(mockProps.onSave).toHaveBeenCalled();
  });

  it('displays metabolism section', () => {
    const { getByText } = render(<ResultsStep {...mockProps} />);
    expect(getByText('Metabolism')).toBeTruthy();
  });

  it('displays starting point section', () => {
    const { getByText } = render(<ResultsStep {...mockProps} />);
    expect(getByText('Starting Point')).toBeTruthy();
  });

  it('shows saving state when isSaving is true', () => {
    const { queryByText } = render(<ResultsStep {...mockProps} isSaving={true} />);
    // When saving, the save button text may change
    expect(queryByText('SAVING...')).toBeTruthy();
  });
});
