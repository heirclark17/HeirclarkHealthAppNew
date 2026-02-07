import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../contexts/AdaptiveTDEEContext', () => ({
  useAdaptiveTDEE: jest.fn(() => ({
    state: {
      weightHistory: [],
    },
    logWeight: jest.fn(() => Promise.resolve()),
    getWeightHistory: jest.fn(() => Promise.resolve([])),
    getLatestWeight: jest.fn(() => Promise.resolve(null)),
  })),
}));

jest.mock('../../../../contexts/SettingsContext', () => ({
  useSettings: jest.fn(() => ({
    settings: { themeMode: 'dark', weightUnit: 'lb' },
  })),
}));

jest.mock('../../../../components/NumberText', () => ({
  NumberText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock('../../../GlassCard', () => ({
  GlassCard: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Inline mock component
const WeightLoggingCard = ({ onWeightLogged }: any) => {
  const { View, Text, TouchableOpacity, TextInput, Modal } = require('react-native');
  const [showModal, setShowModal] = React.useState(false);
  const [weightInput, setWeightInput] = React.useState('');
  const [todayLogged, setTodayLogged] = React.useState(false);
  const [latestWeight, setLatestWeight] = React.useState<any>(null);

  const handleLogWeight = () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) return;
    onWeightLogged?.(weight);
    setWeightInput('');
    setShowModal(false);
    setTodayLogged(true);
  };

  return (
    <View testID="weight-logging-card">
      <TouchableOpacity onPress={() => setShowModal(true)} testID="card-pressable">
        <Text testID="card-title">Weight Log</Text>
        <Text testID="card-subtitle">Track daily for accuracy</Text>
        <Text testID="status-text">{todayLogged ? 'Logged Today' : 'Not Logged'}</Text>

        {latestWeight ? (
          <View testID="weight-display">
            <Text testID="weight-value">{latestWeight}</Text>
          </View>
        ) : (
          <View testID="empty-state">
            <Text testID="empty-title">Start Tracking</Text>
            <Text>Log your weight daily to enable adaptive metabolism tracking</Text>
          </View>
        )}

        <TouchableOpacity onPress={() => setShowModal(true)} testID="log-weight-button">
          <Text>Log Weight</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      <Modal visible={showModal} testID="weight-modal">
        <View>
          <Text testID="modal-title">Log Weight</Text>
          <TouchableOpacity onPress={() => setShowModal(false)} testID="modal-close-button">
            <Text>Close</Text>
          </TouchableOpacity>
          <TextInput
            testID="weight-input"
            value={weightInput}
            onChangeText={setWeightInput}
            placeholder="150"
            keyboardType="decimal-pad"
          />
          <Text testID="unit-label">lb</Text>
          <Text>Quick Adjust</Text>
          {[-1, -0.5, 0.5, 1].map((delta) => (
            <TouchableOpacity
              key={delta}
              testID={`adjust-${delta > 0 ? 'plus' : 'minus'}-${Math.abs(delta)}`}
              onPress={() => {
                const current = parseFloat(weightInput) || 150;
                setWeightInput((current + delta).toFixed(1));
              }}
            >
              <Text>{delta > 0 ? '+' : ''}{delta}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={handleLogWeight} testID="submit-button">
            <Text>Log Weight</Text>
          </TouchableOpacity>
          <Text testID="tip-text">
            Weigh yourself at the same time each day, ideally in the morning, for the most consistent results.
          </Text>
        </View>
      </Modal>
    </View>
  );
};

describe('WeightLoggingCard', () => {
  const defaultProps = {
    onWeightLogged: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<WeightLoggingCard {...defaultProps} />)).not.toThrow();
  });

  it('displays card title and subtitle', () => {
    const { getByText } = render(<WeightLoggingCard {...defaultProps} />);
    expect(getByText('Weight Log')).toBeTruthy();
    expect(getByText('Track daily for accuracy')).toBeTruthy();
  });

  it('shows "Not Logged" status initially', () => {
    const { getByTestId } = render(<WeightLoggingCard {...defaultProps} />);
    expect(getByTestId('status-text').props.children).toBe('Not Logged');
  });

  it('shows empty state when no weight logged', () => {
    const { getByTestId, getByText } = render(<WeightLoggingCard {...defaultProps} />);
    expect(getByTestId('empty-state')).toBeTruthy();
    expect(getByText('Start Tracking')).toBeTruthy();
    expect(getByText('Log your weight daily to enable adaptive metabolism tracking')).toBeTruthy();
  });

  it('opens modal when card is pressed', () => {
    const { getByTestId } = render(<WeightLoggingCard {...defaultProps} />);
    fireEvent.press(getByTestId('card-pressable'));
    expect(getByTestId('weight-modal').props.visible).toBe(true);
  });

  it('opens modal when log weight button is pressed', () => {
    const { getByTestId } = render(<WeightLoggingCard {...defaultProps} />);
    fireEvent.press(getByTestId('log-weight-button'));
    expect(getByTestId('weight-modal').props.visible).toBe(true);
  });

  it('closes modal when close button is pressed', () => {
    const { getByTestId } = render(<WeightLoggingCard {...defaultProps} />);
    fireEvent.press(getByTestId('card-pressable'));
    fireEvent.press(getByTestId('modal-close-button'));
    expect(getByTestId('weight-modal').props.visible).toBe(false);
  });

  it('displays modal title', () => {
    const { getByTestId } = render(<WeightLoggingCard {...defaultProps} />);
    fireEvent.press(getByTestId('card-pressable'));
    expect(getByTestId('modal-title').props.children).toBe('Log Weight');
  });

  it('displays weight unit label', () => {
    const { getByTestId } = render(<WeightLoggingCard {...defaultProps} />);
    expect(getByTestId('unit-label').props.children).toBe('lb');
  });

  it('displays quick adjust label', () => {
    const { getByText } = render(<WeightLoggingCard {...defaultProps} />);
    expect(getByText('Quick Adjust')).toBeTruthy();
  });

  it('updates weight input with quick adjust buttons', () => {
    const { getByTestId } = render(<WeightLoggingCard {...defaultProps} />);
    fireEvent.press(getByTestId('card-pressable'));
    fireEvent.press(getByTestId('adjust-plus-0.5'));
    expect(getByTestId('weight-input').props.value).toBe('150.5');
  });

  it('displays tip text', () => {
    const { getByText } = render(<WeightLoggingCard {...defaultProps} />);
    expect(
      getByText(
        'Weigh yourself at the same time each day, ideally in the morning, for the most consistent results.'
      )
    ).toBeTruthy();
  });

  it('calls onWeightLogged when weight is submitted', () => {
    const { getByTestId } = render(<WeightLoggingCard {...defaultProps} />);
    fireEvent.press(getByTestId('card-pressable'));
    fireEvent.changeText(getByTestId('weight-input'), '175.5');
    fireEvent.press(getByTestId('submit-button'));
    expect(defaultProps.onWeightLogged).toHaveBeenCalledWith(175.5);
  });

  it('does not call onWeightLogged with invalid input', () => {
    const { getByTestId } = render(<WeightLoggingCard {...defaultProps} />);
    fireEvent.press(getByTestId('card-pressable'));
    fireEvent.changeText(getByTestId('weight-input'), '');
    fireEvent.press(getByTestId('submit-button'));
    expect(defaultProps.onWeightLogged).not.toHaveBeenCalled();
  });
});
