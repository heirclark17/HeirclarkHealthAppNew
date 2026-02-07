import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WeeklyStatsContent } from '../WeeklyStatsContent';

// Mock SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

// Mock GoalWizardContext
jest.mock('../../contexts/GoalWizardContext', () => ({
  useGoalWizard: () => ({
    state: {
      results: {
        weeklyChange: 1.5,
        tdee: 2200,
      },
    },
  }),
}));

// Mock API
jest.mock('../../services/api', () => ({
  api: {
    getGoals: jest.fn().mockResolvedValue({
      dailyCalories: 2200,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 65,
    }),
    getMeals: jest.fn().mockResolvedValue([]),
  },
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
  GlassCard: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

// Mock RoundedNumeral
jest.mock('../RoundedNumeral', () => ({
  RoundedNumeral: ({ value, unit }: any) => {
    const { Text } = require('react-native');
    return <Text>{value}{unit}</Text>;
  },
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('WeeklyStatsContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<WeeklyStatsContent />)).not.toThrow();
  });

  it('shows loading state initially', () => {
    const { getByText } = render(<WeeklyStatsContent />);
    expect(getByText('Loading weekly stats...')).toBeTruthy();
  });

  it('displays the WEEKLY BUCKET title after loading', async () => {
    const { getByText } = render(<WeeklyStatsContent />);
    await waitFor(() => {
      expect(getByText('WEEKLY BUCKET')).toBeTruthy();
    });
  });

  it('displays Weekly/Monthly toggle buttons after loading', async () => {
    const { getByText } = render(<WeeklyStatsContent />);
    await waitFor(() => {
      expect(getByText('Weekly')).toBeTruthy();
      expect(getByText('Monthly')).toBeTruthy();
    });
  });

  it('displays macro labels after loading', async () => {
    const { getByText } = render(<WeeklyStatsContent />);
    await waitFor(() => {
      expect(getByText('CALORIES')).toBeTruthy();
      expect(getByText('PROTEIN')).toBeTruthy();
      expect(getByText('CARBS')).toBeTruthy();
      expect(getByText('FAT')).toBeTruthy();
      expect(getByText('STEPS')).toBeTruthy();
      expect(getByText('FAT LOSS')).toBeTruthy();
    });
  });

  it('switches to monthly view when Monthly button is pressed', async () => {
    const { getByText } = render(<WeeklyStatsContent />);
    await waitFor(() => {
      expect(getByText('Weekly')).toBeTruthy();
    });
    fireEvent.press(getByText('Monthly'));
    expect(getByText('MONTHLY BUCKET')).toBeTruthy();
  });

  it('switches back to weekly view', async () => {
    const { getByText } = render(<WeeklyStatsContent />);
    await waitFor(() => {
      expect(getByText('Weekly')).toBeTruthy();
    });
    fireEvent.press(getByText('Monthly'));
    expect(getByText('MONTHLY BUCKET')).toBeTruthy();
    fireEvent.press(getByText('Weekly'));
    expect(getByText('WEEKLY BUCKET')).toBeTruthy();
  });

  it('shows note when no calories logged', async () => {
    const { getByText } = render(<WeeklyStatsContent />);
    await waitFor(() => {
      expect(getByText('Log meals to see your weekly progress')).toBeTruthy();
    });
  });
});
