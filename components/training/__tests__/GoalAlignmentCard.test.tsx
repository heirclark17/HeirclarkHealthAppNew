import React from 'react';
import { render } from '@testing-library/react-native';

// Mock contexts
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark' },
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
  };
});

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

import { GoalAlignmentCard } from '../GoalAlignmentCard';

describe('GoalAlignmentCard', () => {
  const mockAlignment = {
    overallScore: 85,
    alignmentDetails: [
      { label: 'Calorie Burn', value: 90, target: 100 },
      { label: 'Muscle Preservation', value: 80, target: 100 },
    ],
    recommendations: [
      'Add more compound movements',
      'Increase cardio frequency',
    ],
    goalType: 'lose_weight' as const,
  };

  const mockPreferences = {
    fitnessLevel: 'intermediate' as const,
    workoutsPerWeek: 4,
    workoutDuration: 45,
    equipment: ['dumbbells', 'barbell'],
    injuries: [],
    cardioPreference: 'hiit' as const,
  };

  const mockProps = {
    alignment: mockAlignment,
    preferences: mockPreferences,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<GoalAlignmentCard {...mockProps} />)).not.toThrow();
  });

  it('displays the Goal Alignment title', () => {
    const { getByText } = render(<GoalAlignmentCard {...mockProps} />);
    expect(getByText('Goal Alignment')).toBeTruthy();
  });

  it('displays the Match text', () => {
    const { getByText } = render(<GoalAlignmentCard {...mockProps} />);
    expect(getByText('Match')).toBeTruthy();
  });

  it('displays alignment detail labels', () => {
    const { getByText } = render(<GoalAlignmentCard {...mockProps} />);
    expect(getByText('Calorie Burn')).toBeTruthy();
    expect(getByText('Muscle Preservation')).toBeTruthy();
  });

  it('displays recommendations', () => {
    const { getByText } = render(<GoalAlignmentCard {...mockProps} />);
    expect(getByText('Add more compound movements')).toBeTruthy();
    expect(getByText('Increase cardio frequency')).toBeTruthy();
  });
});
