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

// Mock validateWeeklyChange utility
jest.mock('../../../utils/goalCalculations', () => ({
  validateWeeklyChange: jest.fn().mockReturnValue({
    isValid: true,
    weeklyChange: 1.5,
    message: '',
  }),
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

import { GoalStep } from '../GoalStep';

describe('GoalStep', () => {
  const mockProps = {
    goalType: 'lose_weight' as const,
    setGoalType: jest.fn(),
    currentWeight: 180,
    targetWeight: 170,
    setTargetWeight: jest.fn(),
    startDate: new Date('2026-01-01'),
    setStartDate: jest.fn(),
    endDate: new Date('2026-06-01'),
    setEndDate: jest.fn(),
    onBack: jest.fn(),
    onCalculate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<GoalStep {...mockProps} />)).not.toThrow();
  });

  it('displays the main title', () => {
    const { getByText } = render(<GoalStep {...mockProps} />);
    expect(getByText("What's Your Goal?")).toBeTruthy();
  });

  it('displays goal type options', () => {
    const { getByText } = render(<GoalStep {...mockProps} />);
    expect(getByText('Lose Weight')).toBeTruthy();
    expect(getByText('Maintain Weight')).toBeTruthy();
    expect(getByText('Gain Weight')).toBeTruthy();
  });

  it('displays BACK and CALCULATE MY PLAN buttons', () => {
    const { getByText } = render(<GoalStep {...mockProps} />);
    expect(getByText('BACK')).toBeTruthy();
    expect(getByText('CALCULATE MY PLAN')).toBeTruthy();
  });

  it('calls onBack when BACK is pressed', () => {
    const { getByText } = render(<GoalStep {...mockProps} />);
    fireEvent.press(getByText('BACK'));
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('calls onCalculate when CALCULATE MY PLAN is pressed', () => {
    const { getByText } = render(<GoalStep {...mockProps} />);
    fireEvent.press(getByText('CALCULATE MY PLAN'));
    expect(mockProps.onCalculate).toHaveBeenCalled();
  });

  it('calls setGoalType when a goal type is selected', () => {
    const { getByText } = render(<GoalStep {...mockProps} />);
    fireEvent.press(getByText('Gain Weight'));
    expect(mockProps.setGoalType).toHaveBeenCalledWith('gain_weight');
  });

  it('calls setGoalType for maintain weight', () => {
    const { getByText } = render(<GoalStep {...mockProps} />);
    fireEvent.press(getByText('Maintain Weight'));
    expect(mockProps.setGoalType).toHaveBeenCalledWith('maintain');
  });
});
