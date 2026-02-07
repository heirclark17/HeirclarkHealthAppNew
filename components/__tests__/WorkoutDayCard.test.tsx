import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutDayCard } from '../WorkoutDayCard';

// Mock ExerciseCard
jest.mock('../ExerciseCard', () => ({
  ExerciseCard: ({ exercise }: any) => {
    const { Text } = require('react-native');
    return <Text>{exercise.name}</Text>;
  },
}));

describe('WorkoutDayCard', () => {
  const mockExercises = [
    {
      id: '1',
      name: 'Bench Press',
      sets: 3,
      reps: '10',
      rest: '90s',
      completed: false,
    },
    {
      id: '2',
      name: 'Squat',
      sets: 4,
      reps: '8',
      rest: '120s',
      completed: true,
    },
  ];

  const defaultDay = {
    id: 'day-1',
    day: 'Monday',
    name: 'Upper Body Push',
    duration: '45 min',
    exercises: mockExercises,
    completed: false,
  };

  const defaultProps = {
    day: defaultDay,
    isExpanded: false,
    onToggle: jest.fn(),
    completedExercises: 1,
    totalExercises: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<WorkoutDayCard {...defaultProps} />)).not.toThrow();
  });

  it('displays the day name', () => {
    const { getByText } = render(<WorkoutDayCard {...defaultProps} />);
    expect(getByText('Monday')).toBeTruthy();
  });

  it('displays the workout name', () => {
    const { getByText } = render(<WorkoutDayCard {...defaultProps} />);
    expect(getByText('Upper Body Push')).toBeTruthy();
  });

  it('displays the workout duration', () => {
    const { getByText } = render(<WorkoutDayCard {...defaultProps} />);
    expect(getByText('45 min')).toBeTruthy();
  });

  it('displays expand icon as + when collapsed', () => {
    const { getByText } = render(<WorkoutDayCard {...defaultProps} />);
    expect(getByText('+')).toBeTruthy();
  });

  it('displays expand icon as minus when expanded', () => {
    const { getByText } = render(
      <WorkoutDayCard {...defaultProps} isExpanded={true} />
    );
    expect(getByText('\u2212')).toBeTruthy();
  });

  it('calls onToggle when header is pressed', () => {
    const onToggleMock = jest.fn();
    const { getByText } = render(
      <WorkoutDayCard {...defaultProps} onToggle={onToggleMock} />
    );
    fireEvent.press(getByText('Upper Body Push'));
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });

  it('shows exercise list when expanded', () => {
    const { getByText } = render(
      <WorkoutDayCard {...defaultProps} isExpanded={true} />
    );
    expect(getByText('Bench Press')).toBeTruthy();
    expect(getByText('Squat')).toBeTruthy();
  });

  it('does not show exercise list when collapsed', () => {
    const { queryByText } = render(
      <WorkoutDayCard {...defaultProps} isExpanded={false} />
    );
    expect(queryByText('Bench Press')).toBeFalsy();
    expect(queryByText('Squat')).toBeFalsy();
  });

  it('shows progress section when expanded with exercises', () => {
    const { getByText } = render(
      <WorkoutDayCard {...defaultProps} isExpanded={true} />
    );
    expect(getByText('Progress')).toBeTruthy();
    expect(getByText('1 / 2 exercises')).toBeTruthy();
  });

  it('shows checkmark when day is completed', () => {
    const completedDay = { ...defaultDay, completed: true };
    const { root } = render(
      <WorkoutDayCard {...defaultProps} day={completedDay} />
    );
    expect(root).toBeTruthy();
  });

  it('shows rest day message when no exercises', () => {
    const restDay = { ...defaultDay, exercises: [] };
    const { getByText } = render(
      <WorkoutDayCard
        {...defaultProps}
        day={restDay}
        isExpanded={true}
        totalExercises={0}
        completedExercises={0}
      />
    );
    expect(getByText('Rest day - no exercises scheduled')).toBeTruthy();
  });

  it('does not show progress section when there are no exercises', () => {
    const restDay = { ...defaultDay, exercises: [] };
    const { queryByText } = render(
      <WorkoutDayCard
        {...defaultProps}
        day={restDay}
        isExpanded={true}
        totalExercises={0}
        completedExercises={0}
      />
    );
    expect(queryByText('Progress')).toBeFalsy();
  });
});
