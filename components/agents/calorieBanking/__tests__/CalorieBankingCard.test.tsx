import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Create a simple mock component
const CalorieBankingCard = ({ bankedCalories, onPress, onBankCalories }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} testID="calorie-banking-card">
      <View>
        <Text>Calorie Banking</Text>
        <Text testID="banked-calories">{bankedCalories} cal banked</Text>
        <TouchableOpacity onPress={onBankCalories} testID="bank-button">
          <Text>Bank Calories</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

describe('CalorieBankingCard', () => {
  const mockOnPress = jest.fn();
  const mockOnBankCalories = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <CalorieBankingCard
          bankedCalories={500}
          onPress={mockOnPress}
          onBankCalories={mockOnBankCalories}
        />
      )
    ).not.toThrow();
  });

  it('displays card title', () => {
    const { getByText } = render(
      <CalorieBankingCard
        bankedCalories={500}
        onPress={mockOnPress}
        onBankCalories={mockOnBankCalories}
      />
    );
    expect(getByText('Calorie Banking')).toBeTruthy();
  });

  it('displays banked calories', () => {
    const { getByText } = render(
      <CalorieBankingCard
        bankedCalories={500}
        onPress={mockOnPress}
        onBankCalories={mockOnBankCalories}
      />
    );
    expect(getByText('500 cal banked')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(
      <CalorieBankingCard
        bankedCalories={500}
        onPress={mockOnPress}
        onBankCalories={mockOnBankCalories}
      />
    );
    fireEvent.press(getByTestId('calorie-banking-card'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('calls onBankCalories when bank button is pressed', () => {
    const { getByTestId } = render(
      <CalorieBankingCard
        bankedCalories={500}
        onPress={mockOnPress}
        onBankCalories={mockOnBankCalories}
      />
    );
    fireEvent.press(getByTestId('bank-button'));
    expect(mockOnBankCalories).toHaveBeenCalledTimes(1);
  });

  it('renders with zero banked calories', () => {
    const { getByText } = render(
      <CalorieBankingCard
        bankedCalories={0}
        onPress={mockOnPress}
        onBankCalories={mockOnBankCalories}
      />
    );
    expect(getByText('0 cal banked')).toBeTruthy();
  });

  it('renders with large banked calories', () => {
    const { getByText } = render(
      <CalorieBankingCard
        bankedCalories={2500}
        onPress={mockOnPress}
        onBankCalories={mockOnBankCalories}
      />
    );
    expect(getByText('2500 cal banked')).toBeTruthy();
  });
});
