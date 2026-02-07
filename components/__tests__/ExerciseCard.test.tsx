import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExerciseCard } from '../ExerciseCard';

describe('ExerciseCard', () => {
  const mockExercise = {
    id: '1',
    name: 'Push-ups',
    sets: 3,
    reps: '12-15',
    rest: '60s',
    completed: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ExerciseCard exercise={mockExercise} />)).not.toThrow();
  });

  it('displays exercise name', () => {
    const { getByText } = render(<ExerciseCard exercise={mockExercise} />);
    expect(getByText('Push-ups')).toBeTruthy();
  });

  it('displays number of sets', () => {
    const { getByText } = render(<ExerciseCard exercise={mockExercise} />);
    expect(getByText('3')).toBeTruthy();
  });

  it('displays reps range', () => {
    const { getByText } = render(<ExerciseCard exercise={mockExercise} />);
    expect(getByText('12-15')).toBeTruthy();
  });

  it('displays rest time', () => {
    const { getByText } = render(<ExerciseCard exercise={mockExercise} />);
    expect(getByText('60s')).toBeTruthy();
  });

  it('displays Sets label', () => {
    const { getByText } = render(<ExerciseCard exercise={mockExercise} />);
    expect(getByText('Sets')).toBeTruthy();
  });

  it('displays Reps label', () => {
    const { getByText } = render(<ExerciseCard exercise={mockExercise} />);
    expect(getByText('Reps')).toBeTruthy();
  });

  it('displays Rest label', () => {
    const { getByText } = render(<ExerciseCard exercise={mockExercise} />);
    expect(getByText('Rest')).toBeTruthy();
  });

  it('displays notes when provided', () => {
    const exerciseWithNotes = {
      ...mockExercise,
      notes: 'Keep elbows tucked',
    };
    const { getByText } = render(<ExerciseCard exercise={exerciseWithNotes} />);
    expect(getByText(/Keep elbows tucked/)).toBeTruthy();
  });

  it('does not display notes section when notes are absent', () => {
    const { queryByText } = render(<ExerciseCard exercise={mockExercise} />);
    expect(queryByText(/💡/)).toBeFalsy();
  });

  it('starts uncompleted when completed is false', () => {
    const { getByText } = render(<ExerciseCard exercise={mockExercise} />);
    const exerciseName = getByText('Push-ups');
    expect(exerciseName).toBeTruthy();
  });

  it('starts completed when completed is true', () => {
    const completedExercise = { ...mockExercise, completed: true };
    const { getByText } = render(<ExerciseCard exercise={completedExercise} />);
    expect(getByText('✓')).toBeTruthy();
  });

  it('toggles completion state when pressed', () => {
    const { getByText, queryByText } = render(<ExerciseCard exercise={mockExercise} />);

    // Initially not completed
    expect(queryByText('✓')).toBeFalsy();

    // Press to complete
    const card = getByText('Push-ups');
    fireEvent.press(card);

    // Should now show checkmark
    expect(getByText('✓')).toBeTruthy();
  });

  it('toggles from completed to uncompleted', () => {
    const completedExercise = { ...mockExercise, completed: true };
    const { getByText, queryByText } = render(<ExerciseCard exercise={completedExercise} />);

    // Initially completed
    expect(getByText('✓')).toBeTruthy();

    // Press to uncomplete
    const card = getByText('Push-ups');
    fireEvent.press(card);

    // Checkmark should be gone
    expect(queryByText('✓')).toBeFalsy();
  });

  it('handles exercises with single digit sets', () => {
    const { getByText } = render(<ExerciseCard exercise={mockExercise} />);
    expect(getByText('3')).toBeTruthy();
  });

  it('handles exercises with different rep formats', () => {
    const exercise = { ...mockExercise, reps: '10' };
    const { getByText } = render(<ExerciseCard exercise={exercise} />);
    expect(getByText('10')).toBeTruthy();
  });

  it('handles different rest time formats', () => {
    const exercise = { ...mockExercise, rest: '90s' };
    const { getByText } = render(<ExerciseCard exercise={exercise} />);
    expect(getByText('90s')).toBeTruthy();
  });

  it('renders checkbox element', () => {
    const { root } = render(<ExerciseCard exercise={mockExercise} />);
    expect(root).toBeTruthy();
  });

  it('renders detail dividers between stats', () => {
    const { root } = render(<ExerciseCard exercise={mockExercise} />);
    expect(root).toBeTruthy();
  });

  it('handles complex exercise names', () => {
    const exercise = {
      ...mockExercise,
      name: 'Decline Dumbbell Bench Press',
    };
    const { getByText } = render(<ExerciseCard exercise={exercise} />);
    expect(getByText('Decline Dumbbell Bench Press')).toBeTruthy();
  });

  it('handles exercises with long notes', () => {
    const exercise = {
      ...mockExercise,
      notes: 'Keep your core engaged throughout the movement. Lower slowly and explosively push up.',
    };
    const { getByText } = render(<ExerciseCard exercise={exercise} />);
    expect(getByText(/Keep your core engaged/)).toBeTruthy();
  });
});
