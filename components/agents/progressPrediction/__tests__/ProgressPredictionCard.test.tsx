import React from 'react';
import { render } from '@testing-library/react-native';

const ProgressPredictionCard = ({ currentWeight, goalWeight, predictedDate, onPress }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress} testID="progress-prediction-card">
      <View>
        <Text>Progress Prediction</Text>
        <Text testID="current-weight">{currentWeight} lbs</Text>
        <Text testID="goal-weight">{goalWeight} lbs goal</Text>
        <Text testID="predicted-date">{predictedDate}</Text>
      </View>
    </TouchableOpacity>
  );
};

describe('ProgressPredictionCard', () => {
  const mockProps = {
    currentWeight: 200,
    goalWeight: 180,
    predictedDate: 'March 15, 2026',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ProgressPredictionCard {...mockProps} />)).not.toThrow();
  });

  it('displays current weight', () => {
    const { getByText } = render(<ProgressPredictionCard {...mockProps} />);
    expect(getByText('200 lbs')).toBeTruthy();
  });

  it('displays goal weight', () => {
    const { getByText } = render(<ProgressPredictionCard {...mockProps} />);
    expect(getByText('180 lbs goal')).toBeTruthy();
  });

  it('displays predicted date', () => {
    const { getByText } = render(<ProgressPredictionCard {...mockProps} />);
    expect(getByText('March 15, 2026')).toBeTruthy();
  });
});
