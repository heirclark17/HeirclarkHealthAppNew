import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const WorkoutFormCoachCard = ({ currentExercise, formScore, onPress, onViewForm }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} testID="workout-form-coach-card">
      <View>
        <Text>Workout Form Coach</Text>
        {currentExercise && <Text testID="current-exercise">{currentExercise}</Text>}
        <Text testID="form-score">{formScore}% form score</Text>
        <TouchableOpacity onPress={onViewForm} testID="view-form-button">
          <Text>View Form Guide</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

describe('WorkoutFormCoachCard', () => {
  const mockProps = {
    currentExercise: 'Barbell Squat',
    formScore: 92,
    onPress: jest.fn(),
    onViewForm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<WorkoutFormCoachCard {...mockProps} />)).not.toThrow();
  });

  it('displays current exercise', () => {
    const { getByText } = render(<WorkoutFormCoachCard {...mockProps} />);
    expect(getByText('Barbell Squat')).toBeTruthy();
  });

  it('displays form score', () => {
    const { getByText } = render(<WorkoutFormCoachCard {...mockProps} />);
    expect(getByText('92% form score')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(<WorkoutFormCoachCard {...mockProps} />);
    fireEvent.press(getByTestId('workout-form-coach-card'));
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it('calls onViewForm when view form button is pressed', () => {
    const { getByTestId } = render(<WorkoutFormCoachCard {...mockProps} />);
    fireEvent.press(getByTestId('view-form-button'));
    expect(mockProps.onViewForm).toHaveBeenCalled();
  });

  it('renders without current exercise', () => {
    const { queryByTestId } = render(
      <WorkoutFormCoachCard {...mockProps} currentExercise={null} />
    );
    expect(queryByTestId('current-exercise')).toBeNull();
  });
});
