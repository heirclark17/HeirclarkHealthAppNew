import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const HydrationCard = ({ waterIntake, goal, onPress, onLogWater }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  const percentage = Math.round((waterIntake / goal) * 100);
  return (
    <TouchableOpacity onPress={onPress} testID="hydration-card">
      <View>
        <Text>Hydration Tracker</Text>
        <Text testID="water-intake">{waterIntake} oz</Text>
        <Text testID="water-goal">{goal} oz goal</Text>
        <Text testID="percentage">{percentage}%</Text>
        <TouchableOpacity onPress={onLogWater} testID="log-water-button">
          <Text>Log Water</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

describe('HydrationCard', () => {
  const mockOnPress = jest.fn();
  const mockOnLogWater = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <HydrationCard
          waterIntake={64}
          goal={128}
          onPress={mockOnPress}
          onLogWater={mockOnLogWater}
        />
      )
    ).not.toThrow();
  });

  it('displays water intake', () => {
    const { getByText } = render(
      <HydrationCard
        waterIntake={64}
        goal={128}
        onPress={mockOnPress}
        onLogWater={mockOnLogWater}
      />
    );
    expect(getByText('64 oz')).toBeTruthy();
  });

  it('displays water goal', () => {
    const { getByText } = render(
      <HydrationCard
        waterIntake={64}
        goal={128}
        onPress={mockOnPress}
        onLogWater={mockOnLogWater}
      />
    );
    expect(getByText('128 oz goal')).toBeTruthy();
  });

  it('calculates correct percentage', () => {
    const { getByText } = render(
      <HydrationCard
        waterIntake={64}
        goal={128}
        onPress={mockOnPress}
        onLogWater={mockOnLogWater}
      />
    );
    expect(getByText('50%')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(
      <HydrationCard
        waterIntake={64}
        goal={128}
        onPress={mockOnPress}
        onLogWater={mockOnLogWater}
      />
    );
    fireEvent.press(getByTestId('hydration-card'));
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('calls onLogWater when log button is pressed', () => {
    const { getByTestId } = render(
      <HydrationCard
        waterIntake={64}
        goal={128}
        onPress={mockOnPress}
        onLogWater={mockOnLogWater}
      />
    );
    fireEvent.press(getByTestId('log-water-button'));
    expect(mockOnLogWater).toHaveBeenCalled();
  });
});
