import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkoutDetailContent } from '../WorkoutDetailContent';

// Mock SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

// Mock TrainingContext
const mockWorkout = {
  name: 'Upper Body Push',
  type: 'strength',
  exercises: [
    { id: '1', name: 'Bench Press', sets: 3, reps: '10', weight: 135, completed: false },
    { id: '2', name: 'Shoulder Press', sets: 3, reps: '8', weight: 95, completed: true },
  ],
  duration: 45,
  estimatedCaloriesBurned: 350,
};

let mockTrainingState: any = {
  weeklyPlan: {
    days: Array(7).fill(null).map(() => ({ workout: mockWorkout })),
  },
};

jest.mock('../../contexts/TrainingContext', () => ({
  useTraining: () => ({
    state: mockTrainingState,
  }),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      Text,
      createAnimatedComponent: (comp: any) => comp,
    },
    FadeIn: { delay: () => ({ duration: () => ({}) }) },
    SlideInDown: { delay: () => ({ duration: () => ({ springify: () => ({}) }) }) },
  };
});

// Mock GlassCard
jest.mock('../GlassCard', () => ({
  GlassCard: ({ children, style }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('WorkoutDetailContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrainingState = {
      weeklyPlan: {
        days: Array(7).fill(null).map(() => ({ workout: mockWorkout })),
      },
    };
  });

  it('renders without crashing', () => {
    expect(() => render(<WorkoutDetailContent />)).not.toThrow();
  });

  it('displays the workout name', () => {
    const { getByText } = render(<WorkoutDetailContent />);
    expect(getByText('Upper Body Push')).toBeTruthy();
  });

  it('displays Exercises section title', () => {
    const { getByText } = render(<WorkoutDetailContent />);
    expect(getByText('Exercises')).toBeTruthy();
  });

  it('displays exercise names', () => {
    const { getByText } = render(<WorkoutDetailContent />);
    expect(getByText('Bench Press')).toBeTruthy();
    expect(getByText('Shoulder Press')).toBeTruthy();
  });

  it('displays exercise details (sets x reps)', () => {
    const { getByText } = render(<WorkoutDetailContent />);
    expect(getByText(/3 sets × 10 reps/)).toBeTruthy();
    expect(getByText(/3 sets × 8 reps/)).toBeTruthy();
  });

  it('displays exercise weight', () => {
    const { getByText } = render(<WorkoutDetailContent />);
    expect(getByText(/135 lbs/)).toBeTruthy();
    expect(getByText(/95 lbs/)).toBeTruthy();
  });

  it('displays Summary section', () => {
    const { getAllByText } = render(<WorkoutDetailContent />);
    expect(getAllByText('Summary').length).toBeGreaterThan(0);
  });

  it('displays exercise count in summary', () => {
    const { getByText } = render(<WorkoutDetailContent />);
    expect(getByText('2')).toBeTruthy();
  });

  it('displays the workout type badge', () => {
    const { getByText } = render(<WorkoutDetailContent />);
    expect(getByText('Strength')).toBeTruthy();
  });

  it('shows empty state when no workout exists', () => {
    mockTrainingState = {
      weeklyPlan: {
        days: Array(7).fill(null).map(() => ({ workout: null })),
      },
    };
    const { getByText } = render(<WorkoutDetailContent />);
    expect(getByText('No Workouts Today')).toBeTruthy();
    expect(getByText('Take a rest day or add a workout from the training tab')).toBeTruthy();
  });
});
