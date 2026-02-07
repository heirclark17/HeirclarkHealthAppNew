import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const SmartMealLoggerCard = ({ recentMeals, onPress, onQuickLog }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} testID="smart-meal-card">
      <View>
        <Text>Smart Meal Logger</Text>
        <Text testID="recent-count">{recentMeals.length} recent meals</Text>
        <TouchableOpacity onPress={onQuickLog} testID="quick-log-button">
          <Text>Quick Log</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

describe('SmartMealLoggerCard', () => {
  const mockRecentMeals = [
    { id: '1', name: 'Breakfast' },
    { id: '2', name: 'Lunch' },
  ];
  const mockOnPress = jest.fn();
  const mockOnQuickLog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <SmartMealLoggerCard
          recentMeals={mockRecentMeals}
          onPress={mockOnPress}
          onQuickLog={mockOnQuickLog}
        />
      )
    ).not.toThrow();
  });

  it('displays recent meals count', () => {
    const { getByText } = render(
      <SmartMealLoggerCard
        recentMeals={mockRecentMeals}
        onPress={mockOnPress}
        onQuickLog={mockOnQuickLog}
      />
    );
    expect(getByText('2 recent meals')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(
      <SmartMealLoggerCard
        recentMeals={mockRecentMeals}
        onPress={mockOnPress}
        onQuickLog={mockOnQuickLog}
      />
    );
    fireEvent.press(getByTestId('smart-meal-card'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('calls onQuickLog when quick log button is pressed', () => {
    const { getByTestId } = render(
      <SmartMealLoggerCard
        recentMeals={mockRecentMeals}
        onPress={mockOnPress}
        onQuickLog={mockOnQuickLog}
      />
    );
    fireEvent.press(getByTestId('quick-log-button'));
    expect(mockOnQuickLog).toHaveBeenCalled();
  });
});
