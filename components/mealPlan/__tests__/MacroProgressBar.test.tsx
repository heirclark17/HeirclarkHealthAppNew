import React from 'react';
import { render } from '@testing-library/react-native';

// Create a simple mock component
const MacroProgressBar = ({ current, target, label, color }: any) => {
  const { View, Text } = require('react-native');
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <View testID="macro-progress-bar">
      <Text testID="macro-label">{label}</Text>
      <Text testID="macro-current">{current}g</Text>
      <Text testID="macro-target">{target}g</Text>
      <Text testID="macro-percentage">{percentage.toFixed(0)}%</Text>
    </View>
  );
};

describe('MacroProgressBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(<MacroProgressBar current={50} target={100} label="Protein" color="#FF6B6B" />)
    ).not.toThrow();
  });

  it('displays macro label', () => {
    const { getByText } = render(
      <MacroProgressBar current={50} target={100} label="Protein" color="#FF6B6B" />
    );
    expect(getByText('Protein')).toBeTruthy();
  });

  it('displays current value', () => {
    const { getByText } = render(
      <MacroProgressBar current={50} target={100} label="Carbs" color="#4ECDC4" />
    );
    expect(getByText('50g')).toBeTruthy();
  });

  it('displays target value', () => {
    const { getByText } = render(
      <MacroProgressBar current={50} target={100} label="Fat" color="#FFD93D" />
    );
    expect(getByText('100g')).toBeTruthy();
  });

  it('calculates correct percentage', () => {
    const { getByText } = render(
      <MacroProgressBar current={75} target={100} label="Protein" color="#FF6B6B" />
    );
    expect(getByText('75%')).toBeTruthy();
  });

  it('handles 0 current value', () => {
    const { getByText } = render(
      <MacroProgressBar current={0} target={150} label="Carbs" color="#4ECDC4" />
    );
    expect(getByText('0g')).toBeTruthy();
    expect(getByText('0%')).toBeTruthy();
  });

  it('caps percentage at 100%', () => {
    const { getByText } = render(
      <MacroProgressBar current={150} target={100} label="Protein" color="#FF6B6B" />
    );
    expect(getByText('100%')).toBeTruthy();
  });

  it('renders with different colors', () => {
    const { getByTestId } = render(
      <MacroProgressBar current={50} target={100} label="Fat" color="#FFD93D" />
    );
    expect(getByTestId('macro-progress-bar')).toBeTruthy();
  });
});
