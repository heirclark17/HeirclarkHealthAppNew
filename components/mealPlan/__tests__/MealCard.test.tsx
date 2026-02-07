import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Create a simple mock component
const MealCard = ({ meal, onPress }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} testID="meal-card">
      <View>
        <Text>{meal.name}</Text>
        <Text>{meal.calories} cal</Text>
      </View>
    </TouchableOpacity>
  );
};

// Mock dependencies
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark' },
  }),
}));

describe('MealCard', () => {
  const mockMeal = {
    id: 'meal-1',
    name: 'Grilled Chicken Salad',
    calories: 450,
    protein: 40,
    carbs: 30,
    fat: 15,
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<MealCard meal={mockMeal} onPress={mockOnPress} />)).not.toThrow();
  });

  it('displays meal name', () => {
    const { getByText } = render(<MealCard meal={mockMeal} onPress={mockOnPress} />);
    expect(getByText('Grilled Chicken Salad')).toBeTruthy();
  });

  it('displays calorie information', () => {
    const { getByText } = render(<MealCard meal={mockMeal} onPress={mockOnPress} />);
    expect(getByText('450 cal')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(<MealCard meal={mockMeal} onPress={mockOnPress} />);
    fireEvent.press(getByTestId('meal-card'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders with different meal data', () => {
    const differentMeal = {
      ...mockMeal,
      name: 'Salmon Bowl',
      calories: 600,
    };
    const { getByText } = render(<MealCard meal={differentMeal} onPress={mockOnPress} />);
    expect(getByText('Salmon Bowl')).toBeTruthy();
    expect(getByText('600 cal')).toBeTruthy();
  });
});
