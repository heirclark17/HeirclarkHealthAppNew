import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const RestaurantMenuCard = ({ restaurant, estimatedCalories, onPress, onScan }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} testID="restaurant-menu-card">
      <View>
        <Text>Restaurant Menu Scanner</Text>
        {restaurant && <Text testID="restaurant-name">{restaurant}</Text>}
        <Text testID="estimated-calories">{estimatedCalories} cal</Text>
        <TouchableOpacity onPress={onScan} testID="scan-button">
          <Text>Scan Menu</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

describe('RestaurantMenuCard', () => {
  const mockProps = {
    restaurant: 'Italian Bistro',
    estimatedCalories: 850,
    onPress: jest.fn(),
    onScan: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<RestaurantMenuCard {...mockProps} />)).not.toThrow();
  });

  it('displays restaurant name', () => {
    const { getByText } = render(<RestaurantMenuCard {...mockProps} />);
    expect(getByText('Italian Bistro')).toBeTruthy();
  });

  it('displays estimated calories', () => {
    const { getByText } = render(<RestaurantMenuCard {...mockProps} />);
    expect(getByText('850 cal')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(<RestaurantMenuCard {...mockProps} />);
    fireEvent.press(getByTestId('restaurant-menu-card'));
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it('calls onScan when scan button is pressed', () => {
    const { getByTestId } = render(<RestaurantMenuCard {...mockProps} />);
    fireEvent.press(getByTestId('scan-button'));
    expect(mockProps.onScan).toHaveBeenCalled();
  });

  it('renders without restaurant name', () => {
    const { queryByTestId } = render(
      <RestaurantMenuCard {...mockProps} restaurant={null} />
    );
    expect(queryByTestId('restaurant-name')).toBeNull();
  });
});
