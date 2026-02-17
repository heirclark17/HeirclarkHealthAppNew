// @ts-nocheck
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

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

import { PlanSummaryCard } from '../PlanSummaryCard';

describe('PlanSummaryCard', () => {
  const mockSummary = {
    overview: 'A balanced 4-week program focusing on progressive overload.',
    weeklyStructure: '3 strength days, 2 cardio days, 2 rest days',
    strengthFocus: 'Full body compound movements',
    cardioFocus: 'HIIT and steady-state mix',
    expectedOutcomes: ['Increased strength', 'Improved endurance'],
    progressionPlan: 'Add weight every two weeks',
    nutritionTips: ['Eat protein within 30min post-workout'],
    recoveryNotes: 'Ensure 7-8 hours of sleep',
    keyMetrics: { totalWorkouts: 20, avgDuration: 45 },
    adjustmentTriggers: ['Plateau after 2 weeks'],
  };

  const mockProps = {
    summary: mockSummary,
    onStartTraining: jest.fn(),
    onViewDetails: jest.fn(),
    isExpanded: false,
    showStartButton: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<PlanSummaryCard {...mockProps} />)).not.toThrow();
  });

  it('displays the training plan title', () => {
    const { getByText } = render(<PlanSummaryCard {...mockProps} />);
    expect(getByText('Your Training Plan')).toBeTruthy();
  });

  it('displays overview text', () => {
    const { getByText } = render(<PlanSummaryCard {...mockProps} />);
    expect(getByText(mockSummary.overview)).toBeTruthy();
  });

  it('displays Start Training Plan button when showStartButton is true', () => {
    const { getByText } = render(<PlanSummaryCard {...mockProps} />);
    expect(getByText('Start Training Plan')).toBeTruthy();
  });

  it('calls onStartTraining when Start Training Plan is pressed', () => {
    const { getByText } = render(<PlanSummaryCard {...mockProps} />);
    fireEvent.press(getByText('Start Training Plan'));
    expect(mockProps.onStartTraining).toHaveBeenCalled();
  });

  it('does not display Start Training Plan button when showStartButton is false', () => {
    const { queryByText } = render(
      <PlanSummaryCard {...mockProps} showStartButton={false} />
    );
    expect(queryByText('Start Training Plan')).toBeNull();
  });

  it('shows expanded content when isExpanded is true', () => {
    const { getByText } = render(
      <PlanSummaryCard {...mockProps} isExpanded={true} />
    );
    expect(getByText(mockSummary.weeklyStructure)).toBeTruthy();
  });
});
