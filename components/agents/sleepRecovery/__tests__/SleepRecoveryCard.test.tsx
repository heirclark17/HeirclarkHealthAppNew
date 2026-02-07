import React from 'react';
import { render } from '@testing-library/react-native';

const SleepRecoveryCard = ({ hoursSlept, sleepQuality, onPress }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} testID="sleep-recovery-card">
      <View>
        <Text>Sleep & Recovery</Text>
        <Text testID="hours-slept">{hoursSlept}h slept</Text>
        <Text testID="sleep-quality">{sleepQuality}% quality</Text>
      </View>
    </TouchableOpacity>
  );
};

describe('SleepRecoveryCard', () => {
  const mockProps = {
    hoursSlept: 7.5,
    sleepQuality: 85,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<SleepRecoveryCard {...mockProps} />)).not.toThrow();
  });

  it('displays hours slept', () => {
    const { getByText } = render(<SleepRecoveryCard {...mockProps} />);
    expect(getByText('7.5h slept')).toBeTruthy();
  });

  it('displays sleep quality', () => {
    const { getByText } = render(<SleepRecoveryCard {...mockProps} />);
    expect(getByText('85% quality')).toBeTruthy();
  });

  it('renders with different values', () => {
    const { getByText } = render(
      <SleepRecoveryCard hoursSlept={8} sleepQuality={90} onPress={mockProps.onPress} />
    );
    expect(getByText('8h slept')).toBeTruthy();
    expect(getByText('90% quality')).toBeTruthy();
  });
});
