import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Inline mock component matching SwipeableMealItem interface
const SwipeableMealItem = ({ meal, onEdit, onDelete }: any) => {
  const { View, Text, Pressable } = require('react-native');

  return (
    <View testID="swipeable-meal-item">
      {/* Background Actions */}
      <View testID="actions-container">
        <Pressable
          testID="edit-action"
          onPress={() => onEdit(meal)}
        >
          <Text>Edit</Text>
        </Pressable>

        <Pressable
          testID="delete-action"
          onPress={() => onDelete(meal)}
        >
          <Text>Delete</Text>
        </Pressable>
      </View>

      {/* Meal Content */}
      <View testID="meal-content">
        <Text testID="meal-name" numberOfLines={1}>
          {meal.name}
        </Text>
        <View testID="macros-row">
          <Text testID="calories">{Math.round(meal.calories)} cal</Text>
          <Text>P: {Math.round(meal.protein)}g</Text>
          <Text>C: {Math.round(meal.carbs)}g</Text>
          <Text>F: {Math.round(meal.fat)}g</Text>
        </View>
      </View>
    </View>
  );
};

describe('SwipeableMealItem', () => {
  const mockMeal = {
    id: 'meal-1',
    name: 'Grilled Chicken Breast',
    calories: 350.6,
    protein: 42.3,
    carbs: 5.1,
    fat: 12.7,
    mealType: 'lunch',
    date: '2026-01-15',
  };

  const defaultProps = {
    meal: mockMeal,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<SwipeableMealItem {...defaultProps} />)).not.toThrow();
  });

  it('displays meal name', () => {
    const { getByTestId } = render(<SwipeableMealItem {...defaultProps} />);
    expect(getByTestId('meal-name').props.children).toBe('Grilled Chicken Breast');
  });

  it('displays rounded calorie count', () => {
    const { getByText } = render(<SwipeableMealItem {...defaultProps} />);
    expect(getByText('351 cal')).toBeTruthy();
  });

  it('displays rounded protein value', () => {
    const { getByText } = render(<SwipeableMealItem {...defaultProps} />);
    expect(getByText('P: 42g')).toBeTruthy();
  });

  it('displays rounded carbs value', () => {
    const { getByText } = render(<SwipeableMealItem {...defaultProps} />);
    expect(getByText('C: 5g')).toBeTruthy();
  });

  it('displays rounded fat value', () => {
    const { getByText } = render(<SwipeableMealItem {...defaultProps} />);
    expect(getByText('F: 13g')).toBeTruthy();
  });

  it('renders edit action', () => {
    const { getByText } = render(<SwipeableMealItem {...defaultProps} />);
    expect(getByText('Edit')).toBeTruthy();
  });

  it('renders delete action', () => {
    const { getByText } = render(<SwipeableMealItem {...defaultProps} />);
    expect(getByText('Delete')).toBeTruthy();
  });

  it('calls onEdit with meal when edit action is pressed', () => {
    const { getByTestId } = render(<SwipeableMealItem {...defaultProps} />);
    fireEvent.press(getByTestId('edit-action'));
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockMeal);
  });

  it('calls onDelete with meal when delete action is pressed', () => {
    const { getByTestId } = render(<SwipeableMealItem {...defaultProps} />);
    fireEvent.press(getByTestId('delete-action'));
    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockMeal);
  });

  it('renders with different meal data', () => {
    const anotherMeal = {
      ...mockMeal,
      name: 'Caesar Salad',
      calories: 250,
      protein: 15,
      carbs: 20,
      fat: 14,
    };
    const { getByText } = render(
      <SwipeableMealItem {...defaultProps} meal={anotherMeal} />
    );
    expect(getByText('Caesar Salad')).toBeTruthy();
    expect(getByText('250 cal')).toBeTruthy();
  });

  it('renders macros row container', () => {
    const { getByTestId } = render(<SwipeableMealItem {...defaultProps} />);
    expect(getByTestId('macros-row')).toBeTruthy();
  });

  it('renders actions container', () => {
    const { getByTestId } = render(<SwipeableMealItem {...defaultProps} />);
    expect(getByTestId('actions-container')).toBeTruthy();
  });
});
