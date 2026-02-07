import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const HabitFormationCard = ({ habits, onPress, onLogHabit }: any) => {
  const { View, Text, TouchableOpacity, FlatList } = require('react-native');
  const completedCount = habits.filter((h: any) => h.completed).length;
  return (
    <TouchableOpacity onPress={onPress} testID="habit-formation-card">
      <View>
        <Text>Habit Formation</Text>
        <Text testID="habits-count">{habits.length} habits</Text>
        <Text testID="completed-count">{completedCount} completed</Text>
        <TouchableOpacity onPress={onLogHabit} testID="log-habit-button">
          <Text>Log Habit</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

describe('HabitFormationCard', () => {
  const mockHabits = [
    { id: '1', name: 'Morning workout', completed: true },
    { id: '2', name: 'Drink water', completed: true },
    { id: '3', name: 'Meditate', completed: false },
  ];

  const mockProps = {
    habits: mockHabits,
    onPress: jest.fn(),
    onLogHabit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<HabitFormationCard {...mockProps} />)).not.toThrow();
  });

  it('displays total habits count', () => {
    const { getByText } = render(<HabitFormationCard {...mockProps} />);
    expect(getByText('3 habits')).toBeTruthy();
  });

  it('displays completed habits count', () => {
    const { getByText } = render(<HabitFormationCard {...mockProps} />);
    expect(getByText('2 completed')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(<HabitFormationCard {...mockProps} />);
    fireEvent.press(getByTestId('habit-formation-card'));
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it('calls onLogHabit when log button is pressed', () => {
    const { getByTestId } = render(<HabitFormationCard {...mockProps} />);
    fireEvent.press(getByTestId('log-habit-button'));
    expect(mockProps.onLogHabit).toHaveBeenCalled();
  });

  it('renders with empty habits', () => {
    const { getByText } = render(
      <HabitFormationCard {...mockProps} habits={[]} />
    );
    expect(getByText('0 habits')).toBeTruthy();
    expect(getByText('0 completed')).toBeTruthy();
  });
});
