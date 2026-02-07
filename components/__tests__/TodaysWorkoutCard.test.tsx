import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TodaysWorkoutCard } from '../TodaysWorkoutCard';

// Mock the SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

// Mock haptics
jest.mock('../../utils/haptics', () => ({
  lightImpact: jest.fn().mockResolvedValue(undefined),
  selectionFeedback: jest.fn().mockResolvedValue(undefined),
}));

describe('TodaysWorkoutCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<TodaysWorkoutCard />)).not.toThrow();
  });

  it('displays WORKOUT label', () => {
    const { getByText } = render(<TodaysWorkoutCard />);
    expect(getByText('WORKOUT')).toBeTruthy();
  });

  it('displays workout type', () => {
    const { getByText } = render(<TodaysWorkoutCard workoutType="Push Day" />);
    expect(getByText('Push Day')).toBeTruthy();
  });

  it('displays workoutName when provided', () => {
    const { getByText } = render(
      <TodaysWorkoutCard workoutType="Push Day" workoutName="Chest & Shoulders" />
    );
    expect(getByText('Chest & Shoulders')).toBeTruthy();
  });

  it('displays Rest Day when isRestDay is true', () => {
    const { getByText } = render(<TodaysWorkoutCard isRestDay />);
    expect(getByText('Rest Day')).toBeTruthy();
  });

  it('displays "today" subtitle when workout is scheduled', () => {
    const { getByText } = render(<TodaysWorkoutCard workoutType="Leg Day" />);
    expect(getByText('today')).toBeTruthy();
  });

  it('does not display "today" subtitle on rest day', () => {
    const { queryByText } = render(<TodaysWorkoutCard isRestDay />);
    expect(queryByText('today')).toBeNull();
  });

  it('calls onPress callback when provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <TodaysWorkoutCard workoutType="HIIT" onPress={onPressMock} />
    );
    fireEvent.press(getByText('HIIT').parent!);
    expect(onPressMock).toHaveBeenCalled();
  });

  it('opens modal when pressed without onPress', () => {
    const { getByText, queryByText } = render(
      <TodaysWorkoutCard workoutType="Full Body" weeklyCount={4} />
    );
    fireEvent.press(getByText('Full Body').parent!);
    // Modal should show workout details
    expect(queryByText('4 workouts this week')).toBeTruthy();
  });

  it('shows Scheduled badge in modal for active workout', () => {
    const { getByText, queryByText } = render(
      <TodaysWorkoutCard workoutType="Upper Body" />
    );
    fireEvent.press(getByText('Upper Body').parent!);
    expect(queryByText('Scheduled')).toBeTruthy();
  });

  it('shows Completed badge in modal when completed', () => {
    const { getByText, queryByText } = render(
      <TodaysWorkoutCard workoutType="Cardio" isCompleted />
    );
    fireEvent.press(getByText('Cardio').parent!);
    expect(queryByText('Completed')).toBeTruthy();
  });

  it('shows Rest Day badge in modal on rest day', () => {
    const { getByText, queryByText } = render(
      <TodaysWorkoutCard isRestDay />
    );
    fireEvent.press(getByText('Rest Day').parent!);
    expect(queryByText('Rest Day')).toBeTruthy();
  });

  it('displays Close button in modal', () => {
    const { getByText, queryByText } = render(
      <TodaysWorkoutCard workoutType="Yoga" />
    );
    fireEvent.press(getByText('Yoga').parent!);
    expect(queryByText('Close')).toBeTruthy();
  });

  it('displays weekly count in modal', () => {
    const { getByText, queryByText } = render(
      <TodaysWorkoutCard workoutType="Running Session" weeklyCount={3} />
    );
    fireEvent.press(getByText('Running Session').parent!);
    expect(queryByText('3 workouts this week')).toBeTruthy();
  });

  it('displays 0 workouts this week when weeklyCount is 0', () => {
    const { getByText, queryByText } = render(
      <TodaysWorkoutCard workoutType="Core" weeklyCount={0} />
    );
    fireEvent.press(getByText('Core').parent!);
    expect(queryByText('0 workouts this week')).toBeTruthy();
  });

  it('defaults to No Workout when no workoutType provided', () => {
    const { getByText } = render(<TodaysWorkoutCard />);
    expect(getByText('No Workout')).toBeTruthy();
  });

  it('handles Leg Day workout type', () => {
    const { getByText } = render(<TodaysWorkoutCard workoutType="Leg Day" />);
    expect(getByText('Leg Day')).toBeTruthy();
  });

  it('handles Walking Session workout type', () => {
    const { getByText } = render(<TodaysWorkoutCard workoutType="Walking Session" />);
    expect(getByText('Walking Session')).toBeTruthy();
  });

  it('handles Recovery workout type', () => {
    const { getByText } = render(<TodaysWorkoutCard workoutType="Recovery" />);
    expect(getByText('Recovery')).toBeTruthy();
  });

  it('renders with all props combined', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <TodaysWorkoutCard
        workoutType="HIIT"
        workoutName="30 Min HIIT"
        isCompleted
        weeklyCount={5}
        onPress={onPressMock}
      />
    );
    expect(getByText('30 Min HIIT')).toBeTruthy();
  });

  it('handles unknown workout type gracefully', () => {
    const { getByText } = render(
      <TodaysWorkoutCard workoutType="Pilates" />
    );
    expect(getByText('Pilates')).toBeTruthy();
  });
});
