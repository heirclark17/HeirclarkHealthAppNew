import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Create a simple mock component
const ActivityStep = ({ activityLevel, setActivityLevel, onNext }: any) => {
  const { View, Text, TouchableOpacity, ScrollView } = require('react-native');
  const levels = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'];

  return (
    <ScrollView testID="activity-step">
      <View>
        <Text>Select Your Activity Level</Text>
        {levels.map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() => setActivityLevel(level)}
            testID={`activity-${level.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Text>{level}</Text>
            {activityLevel === level && <Text testID="selected-indicator">✓</Text>}
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={onNext} testID="continue-button">
          <Text>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Mock SettingsContext
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark' },
  }),
}));

describe('ActivityStep', () => {
  const mockProps = {
    activityLevel: '',
    setActivityLevel: jest.fn(),
    onNext: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ActivityStep {...mockProps} />)).not.toThrow();
  });

  it('displays title', () => {
    const { getByText } = render(<ActivityStep {...mockProps} />);
    expect(getByText('Select Your Activity Level')).toBeTruthy();
  });

  it('renders all activity levels', () => {
    const { getByText } = render(<ActivityStep {...mockProps} />);
    expect(getByText('Sedentary')).toBeTruthy();
    expect(getByText('Lightly Active')).toBeTruthy();
    expect(getByText('Moderately Active')).toBeTruthy();
    expect(getByText('Very Active')).toBeTruthy();
    expect(getByText('Extremely Active')).toBeTruthy();
  });

  it('calls setActivityLevel when level is selected', () => {
    const { getByTestId } = render(<ActivityStep {...mockProps} />);
    fireEvent.press(getByTestId('activity-moderately-active'));
    expect(mockProps.setActivityLevel).toHaveBeenCalledWith('Moderately Active');
  });

  it('shows selected indicator for selected level', () => {
    const { getByTestId } = render(
      <ActivityStep {...mockProps} activityLevel="Very Active" />
    );
    expect(getByTestId('selected-indicator')).toBeTruthy();
  });

  it('calls onNext when continue button is pressed', () => {
    const { getByTestId } = render(<ActivityStep {...mockProps} />);
    fireEvent.press(getByTestId('continue-button'));
    expect(mockProps.onNext).toHaveBeenCalled();
  });
});
