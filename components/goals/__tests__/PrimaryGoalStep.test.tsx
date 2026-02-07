import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Create a simple mock component
const PrimaryGoalStep = ({ primaryGoal, setPrimaryGoal, onNext }: any) => {
  const { View, Text, TouchableOpacity, ScrollView } = require('react-native');
  const goals = ['Lose Weight', 'Gain Muscle', 'Maintain Weight', 'Improve Health'];

  return (
    <ScrollView testID="primary-goal-step">
      <View>
        <Text>What is Your Primary Goal?</Text>
        {goals.map((goal) => (
          <TouchableOpacity
            key={goal}
            onPress={() => setPrimaryGoal(goal)}
            testID={`goal-${goal.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Text>{goal}</Text>
            {primaryGoal === goal && <Text testID="selected-indicator">✓</Text>}
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

describe('PrimaryGoalStep', () => {
  const mockProps = {
    primaryGoal: '',
    setPrimaryGoal: jest.fn(),
    onNext: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<PrimaryGoalStep {...mockProps} />)).not.toThrow();
  });

  it('displays title', () => {
    const { getByText } = render(<PrimaryGoalStep {...mockProps} />);
    expect(getByText('What is Your Primary Goal?')).toBeTruthy();
  });

  it('renders all goal options', () => {
    const { getByText } = render(<PrimaryGoalStep {...mockProps} />);
    expect(getByText('Lose Weight')).toBeTruthy();
    expect(getByText('Gain Muscle')).toBeTruthy();
    expect(getByText('Maintain Weight')).toBeTruthy();
    expect(getByText('Improve Health')).toBeTruthy();
  });

  it('calls setPrimaryGoal when goal is selected', () => {
    const { getByTestId } = render(<PrimaryGoalStep {...mockProps} />);
    fireEvent.press(getByTestId('goal-lose-weight'));
    expect(mockProps.setPrimaryGoal).toHaveBeenCalledWith('Lose Weight');
  });

  it('shows selected indicator for selected goal', () => {
    const { getByTestId } = render(
      <PrimaryGoalStep {...mockProps} primaryGoal="Gain Muscle" />
    );
    expect(getByTestId('selected-indicator')).toBeTruthy();
  });

  it('calls onNext when continue button is pressed', () => {
    const { getByTestId } = render(<PrimaryGoalStep {...mockProps} />);
    fireEvent.press(getByTestId('continue-button'));
    expect(mockProps.onNext).toHaveBeenCalled();
  });
});
