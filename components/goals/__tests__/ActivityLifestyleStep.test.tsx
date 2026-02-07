import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock contexts
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark' },
  }),
}));

const mockGoalWizardState = {
  activityLevel: 'moderate',
  workoutsPerWeek: 3,
  workoutDuration: 45,
  cardioPreference: 'walking',
  fitnessLevel: 'intermediate',
  equipment: [] as string[],
  injuries: [] as string[],
};

const mockSetActivityLevel = jest.fn();
const mockSetWorkoutsPerWeek = jest.fn();
const mockSetWorkoutDuration = jest.fn();
const mockSetCardioPreference = jest.fn();
const mockSetFitnessLevel = jest.fn();
const mockToggleEquipment = jest.fn();
const mockToggleInjury = jest.fn();

jest.mock('../../../contexts/GoalWizardContext', () => ({
  useGoalWizard: () => ({
    state: mockGoalWizardState,
    setActivityLevel: mockSetActivityLevel,
    setWorkoutsPerWeek: mockSetWorkoutsPerWeek,
    setWorkoutDuration: mockSetWorkoutDuration,
    setCardioPreference: mockSetCardioPreference,
    setFitnessLevel: mockSetFitnessLevel,
    toggleEquipment: mockToggleEquipment,
    toggleInjury: mockToggleInjury,
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

// Now import component
import { ActivityLifestyleStep } from '../ActivityLifestyleStep';

describe('ActivityLifestyleStep', () => {
  const mockProps = {
    onNext: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ActivityLifestyleStep {...mockProps} />)).not.toThrow();
  });

  it('displays activity level section', () => {
    const { getByText } = render(<ActivityLifestyleStep {...mockProps} />);
    expect(getByText('ACTIVITY LEVEL')).toBeTruthy();
  });

  it('displays activity level options', () => {
    const { getByText } = render(<ActivityLifestyleStep {...mockProps} />);
    expect(getByText('Sedentary')).toBeTruthy();
    expect(getByText('Light')).toBeTruthy();
    expect(getByText('Moderate')).toBeTruthy();
  });

  it('displays workout frequency section', () => {
    const { getByText } = render(<ActivityLifestyleStep {...mockProps} />);
    expect(getByText('WORKOUTS PER WEEK')).toBeTruthy();
  });

  it('displays workout duration section', () => {
    const { getByText } = render(<ActivityLifestyleStep {...mockProps} />);
    expect(getByText('WORKOUT DURATION')).toBeTruthy();
  });

  it('displays cardio preference section', () => {
    const { getByText } = render(<ActivityLifestyleStep {...mockProps} />);
    expect(getByText('CARDIO PREFERENCE')).toBeTruthy();
  });

  it('displays fitness level section', () => {
    const { getByText } = render(<ActivityLifestyleStep {...mockProps} />);
    expect(getByText('FITNESS LEVEL')).toBeTruthy();
  });

  it('displays back and continue buttons', () => {
    const { getByText } = render(<ActivityLifestyleStep {...mockProps} />);
    expect(getByText('BACK')).toBeTruthy();
    expect(getByText('CONTINUE')).toBeTruthy();
  });

  it('calls onBack when BACK button is pressed', () => {
    const { getByText } = render(<ActivityLifestyleStep {...mockProps} />);
    fireEvent.press(getByText('BACK'));
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('calls onNext when CONTINUE button is pressed', () => {
    const { getByText } = render(<ActivityLifestyleStep {...mockProps} />);
    fireEvent.press(getByText('CONTINUE'));
    expect(mockProps.onNext).toHaveBeenCalled();
  });

  it('calls setActivityLevel when an activity level is pressed', () => {
    const { getByText } = render(<ActivityLifestyleStep {...mockProps} />);
    fireEvent.press(getByText('Sedentary'));
    expect(mockSetActivityLevel).toHaveBeenCalledWith('sedentary');
  });
});
