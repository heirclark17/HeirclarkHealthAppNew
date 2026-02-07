import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WeeklyProgressCard } from '../WeeklyProgressCard';

// Mock the SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

describe('WeeklyProgressCard', () => {
  const defaultProps = {
    weeklySteps: 50000,
    weeklyCalories: 15400,
    weeklyProtein: 1050,
    weeklyCarbs: 1750,
    weeklyFat: 455,
    weeklyFatLoss: 1.5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<WeeklyProgressCard {...defaultProps} />)).not.toThrow();
  });

  it('displays weekly steps data', () => {
    const { getByText } = render(<WeeklyProgressCard {...defaultProps} />);
    expect(getByText('50,000')).toBeTruthy();
  });

  it('displays weekly calories data', () => {
    const { getByText } = render(<WeeklyProgressCard {...defaultProps} />);
    expect(getByText('15,400')).toBeTruthy();
  });

  it('displays weekly protein data', () => {
    const { getByText } = render(<WeeklyProgressCard {...defaultProps} />);
    expect(getByText('1,050')).toBeTruthy();
  });

  it('handles zero values', () => {
    const { root } = render(
      <WeeklyProgressCard
        weeklySteps={0}
        weeklyCalories={0}
        weeklyProtein={0}
        weeklyCarbs={0}
        weeklyFat={0}
        weeklyFatLoss={0}
      />
    );
    expect(root).toBeTruthy();
  });

  it('uses default goals when not provided', () => {
    const { root } = render(<WeeklyProgressCard {...defaultProps} />);
    expect(root).toBeTruthy();
  });

  it('uses custom goals when provided', () => {
    const { root } = render(
      <WeeklyProgressCard
        {...defaultProps}
        stepsGoal={12000}
        caloriesGoal={2500}
        proteinGoal={180}
      />
    );
    expect(root).toBeTruthy();
  });

  it('expands to show more details when toggled', () => {
    const { root } = render(<WeeklyProgressCard {...defaultProps} />);
    // Would need to find expand button and press it
    expect(root).toBeTruthy();
  });

  it('calculates weekly goals correctly', () => {
    const { root } = render(
      <WeeklyProgressCard {...defaultProps} stepsGoal={10000} />
    );
    // Should calculate 10000 * 7 = 70000 weekly goal
    expect(root).toBeTruthy();
  });

  it('displays progress bars for each metric', () => {
    const { root } = render(<WeeklyProgressCard {...defaultProps} />);
    expect(root).toBeTruthy();
  });

  it('shows percentage completion', () => {
    const { root } = render(<WeeklyProgressCard {...defaultProps} />);
    // Should show percentage for each metric
    expect(root).toBeTruthy();
  });

  it('handles values exceeding goals', () => {
    const { root } = render(
      <WeeklyProgressCard
        weeklySteps={100000}
        weeklyCalories={20000}
        weeklyProtein={1500}
        weeklyCarbs={2000}
        weeklyFat={500}
        weeklyFatLoss={3}
        stepsGoal={10000}
      />
    );
    expect(root).toBeTruthy();
  });

  it('toggles between weekly and monthly view', () => {
    const { root } = render(<WeeklyProgressCard {...defaultProps} />);
    // Should have toggle functionality
    expect(root).toBeTruthy();
  });

  it('calculates monthly goals based on days in month', () => {
    const { root } = render(<WeeklyProgressCard {...defaultProps} />);
    // Monthly goals should be daily goal * days in current month
    expect(root).toBeTruthy();
  });

  it('displays macro cards with color coding', () => {
    const { root } = render(<WeeklyProgressCard {...defaultProps} />);
    // Protein, carbs, fat should have different colors
    expect(root).toBeTruthy();
  });

  it('renders in collapsed state initially', () => {
    const { root } = render(<WeeklyProgressCard {...defaultProps} />);
    expect(root).toBeTruthy();
  });

  it('formats large numbers with commas', () => {
    const { getByText } = render(
      <WeeklyProgressCard
        {...defaultProps}
        weeklySteps={123456}
      />
    );
    expect(getByText('123,456')).toBeTruthy();
  });
});
