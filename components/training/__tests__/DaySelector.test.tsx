import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DaySelector } from '../DaySelector';
import { WeeklyTrainingPlan } from '../../../types/training';

// Mock dependencies
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark' },
  }),
}));

jest.mock('../../GlassCard', () => ({
  GlassCard: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('../../../utils/haptics', () => ({
  lightImpact: jest.fn(),
}));

describe('DaySelector', () => {
  const mockWeeklyPlan: WeeklyTrainingPlan = {
    weekNumber: 1,
    days: [
      {
        id: 'day-1',
        dayOfWeek: 'Monday',
        date: '2026-02-03',
        isRestDay: false,
        completed: false,
        workout: { id: 'workout-1' } as any,
      },
      {
        id: 'day-2',
        dayOfWeek: 'Tuesday',
        date: '2026-02-04',
        isRestDay: false,
        completed: true,
        workout: { id: 'workout-2' } as any,
      },
      {
        id: 'day-3',
        dayOfWeek: 'Wednesday',
        date: '2026-02-05',
        isRestDay: true,
        completed: false,
      },
    ],
  };

  const mockOnSelectDay = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <DaySelector
          weeklyPlan={mockWeeklyPlan}
          selectedDayIndex={0}
          onSelectDay={mockOnSelectDay}
        />
      )
    ).not.toThrow();
  });

  it('renders all days', () => {
    const { getByText } = render(
      <DaySelector
        weeklyPlan={mockWeeklyPlan}
        selectedDayIndex={0}
        onSelectDay={mockOnSelectDay}
      />
    );
    expect(getByText('Mon')).toBeTruthy();
    expect(getByText('Tue')).toBeTruthy();
    expect(getByText('Wed')).toBeTruthy();
  });

  it('renders day numbers', () => {
    const { getByText } = render(
      <DaySelector
        weeklyPlan={mockWeeklyPlan}
        selectedDayIndex={0}
        onSelectDay={mockOnSelectDay}
      />
    );
    expect(getByText('3')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
  });

  it('calls onSelectDay when day is pressed', () => {
    const { getByText } = render(
      <DaySelector
        weeklyPlan={mockWeeklyPlan}
        selectedDayIndex={0}
        onSelectDay={mockOnSelectDay}
      />
    );
    fireEvent.press(getByText('Tue'));
    expect(mockOnSelectDay).toHaveBeenCalledWith(1);
  });

  it('displays checkmark for completed day', () => {
    const { UNSAFE_getByType } = render(
      <DaySelector
        weeklyPlan={mockWeeklyPlan}
        selectedDayIndex={1}
        onSelectDay={mockOnSelectDay}
      />
    );
    const Ionicons = require('@expo/vector-icons').Ionicons;
    const icons = UNSAFE_getByType(Ionicons);
    expect(icons).toBeTruthy();
  });

  it('handles different selected day indices', () => {
    const { rerender, getByText } = render(
      <DaySelector
        weeklyPlan={mockWeeklyPlan}
        selectedDayIndex={0}
        onSelectDay={mockOnSelectDay}
      />
    );
    expect(getByText('Mon')).toBeTruthy();

    rerender(
      <DaySelector
        weeklyPlan={mockWeeklyPlan}
        selectedDayIndex={2}
        onSelectDay={mockOnSelectDay}
      />
    );
    expect(getByText('Wed')).toBeTruthy();
  });
});
