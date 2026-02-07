import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock contexts
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark', weightUnit: 'lbs', heightUnit: 'ft' },
  }),
}));

const mockGoalWizardState = {
  currentWeight: 180,
  targetWeight: 170,
  weightUnit: 'lbs' as const,
  heightFt: 5,
  heightIn: 10,
  heightCm: 178,
  heightUnit: 'ft' as const,
  age: 30,
  sex: 'male' as const,
  startDate: new Date('2026-01-01'),
  targetDate: new Date('2026-06-01'),
};

const mockSetCurrentWeight = jest.fn();
const mockSetTargetWeight = jest.fn();
const mockSetWeightUnit = jest.fn();
const mockSetHeightFt = jest.fn();
const mockSetHeightIn = jest.fn();
const mockSetHeightCm = jest.fn();
const mockSetHeightUnit = jest.fn();
const mockSetAge = jest.fn();
const mockSetSex = jest.fn();
const mockSetStartDate = jest.fn();
const mockSetTargetDate = jest.fn();

jest.mock('../../../contexts/GoalWizardContext', () => ({
  useGoalWizard: () => ({
    state: mockGoalWizardState,
    setCurrentWeight: mockSetCurrentWeight,
    setTargetWeight: mockSetTargetWeight,
    setWeightUnit: mockSetWeightUnit,
    setHeightFt: mockSetHeightFt,
    setHeightIn: mockSetHeightIn,
    setHeightCm: mockSetHeightCm,
    setHeightUnit: mockSetHeightUnit,
    setAge: mockSetAge,
    setSex: mockSetSex,
    setStartDate: mockSetStartDate,
    setTargetDate: mockSetTargetDate,
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

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

import { BodyMetricsStep } from '../BodyMetricsStep';

describe('BodyMetricsStep', () => {
  const mockProps = {
    onNext: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<BodyMetricsStep {...mockProps} />)).not.toThrow();
  });

  it('displays the main title', () => {
    const { getByText } = render(<BodyMetricsStep {...mockProps} />);
    expect(getByText('Your Body Metrics')).toBeTruthy();
  });

  it('displays weight section', () => {
    const { getByText } = render(<BodyMetricsStep {...mockProps} />);
    expect(getByText('WEIGHT')).toBeTruthy();
  });

  it('displays height section', () => {
    const { getByText } = render(<BodyMetricsStep {...mockProps} />);
    expect(getByText('HEIGHT')).toBeTruthy();
  });

  it('displays age section', () => {
    const { getByText } = render(<BodyMetricsStep {...mockProps} />);
    expect(getByText('AGE')).toBeTruthy();
  });

  it('displays biological sex section', () => {
    const { getByText } = render(<BodyMetricsStep {...mockProps} />);
    expect(getByText('BIOLOGICAL SEX')).toBeTruthy();
  });

  it('displays sex options', () => {
    const { getByText } = render(<BodyMetricsStep {...mockProps} />);
    expect(getByText('Male')).toBeTruthy();
    expect(getByText('Female')).toBeTruthy();
  });

  it('displays back and continue buttons', () => {
    const { getByText } = render(<BodyMetricsStep {...mockProps} />);
    expect(getByText('BACK')).toBeTruthy();
    expect(getByText('CONTINUE')).toBeTruthy();
  });

  it('calls onBack when BACK is pressed', () => {
    const { getByText } = render(<BodyMetricsStep {...mockProps} />);
    fireEvent.press(getByText('BACK'));
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('calls onNext when CONTINUE is pressed', () => {
    const { getByText } = render(<BodyMetricsStep {...mockProps} />);
    fireEvent.press(getByText('CONTINUE'));
    expect(mockProps.onNext).toHaveBeenCalled();
  });

  it('calls setSex when sex option is pressed', () => {
    const { getByText } = render(<BodyMetricsStep {...mockProps} />);
    fireEvent.press(getByText('Female'));
    expect(mockSetSex).toHaveBeenCalledWith('female');
  });

  it('displays current weight and target weight labels', () => {
    const { getByText } = render(<BodyMetricsStep {...mockProps} />);
    expect(getByText('Current Weight')).toBeTruthy();
    expect(getByText('Target Weight')).toBeTruthy();
  });
});
