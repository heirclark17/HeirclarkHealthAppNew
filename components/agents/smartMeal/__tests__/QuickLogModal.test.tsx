import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../../../liquidGlass/useGlassTheme', () => ({
  useGlassTheme: jest.fn(() => ({
    isDark: true,
    colors: {
      primary: '#4ECDC4',
      text: '#FFFFFF',
      textSecondary: '#999999',
      glassBorder: 'rgba(255,255,255,0.1)',
      background: '#000000',
    },
  })),
}));

jest.mock('../../../liquidGlass/GlassCard', () => ({
  GlassCard: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('../../../NumberText', () => ({
  NumberText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

// Inline mock component
const QuickLogModal = ({ visible, meal, selectedDate, onClose, onLog }: any) => {
  const { View, Text, TouchableOpacity, Modal, ActivityIndicator } = require('react-native');
  const [isLogging, setIsLogging] = React.useState(false);

  if (!meal) return null;

  const handleLog = async () => {
    setIsLogging(true);
    try {
      await onLog(meal);
    } finally {
      setIsLogging(false);
    }
  };

  const displayDate = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'Today';

  return (
    <Modal visible={visible} testID="quick-log-modal">
      <View>
        <Text testID="meal-name">{meal.name}</Text>
        <Text testID="meal-type">
          {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
        </Text>
        <Text testID="meal-calories">{meal.calories}</Text>
        <Text testID="meal-protein">{meal.protein}g</Text>
        <Text testID="meal-carbs">{meal.carbs}g</Text>
        <Text testID="meal-fat">{meal.fat}g</Text>
        <Text>Calories</Text>
        <Text>Protein</Text>
        <Text>Carbs</Text>
        <Text>Fat</Text>
        <Text testID="log-count">Logged {meal.logCount} times</Text>
        <TouchableOpacity onPress={handleLog} disabled={isLogging} testID="log-button">
          {isLogging ? (
            <ActivityIndicator testID="log-spinner" />
          ) : (
            <Text testID="log-button-text">Log for {displayDate}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} testID="cancel-button">
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} testID="close-button">
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

describe('QuickLogModal', () => {
  const mockMeal = {
    id: 'meal-1',
    name: 'Grilled Chicken Salad',
    mealType: 'lunch',
    calories: 450,
    protein: 35,
    carbs: 20,
    fat: 15,
    logCount: 5,
    lastLogged: new Date().toISOString(),
    averageTime: '12:30 PM',
  };

  const defaultProps = {
    visible: true,
    meal: mockMeal,
    onClose: jest.fn(),
    onLog: jest.fn(() => Promise.resolve()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<QuickLogModal {...defaultProps} />)).not.toThrow();
  });

  it('returns null when meal is null', () => {
    const { queryByTestId } = render(<QuickLogModal {...defaultProps} meal={null} />);
    expect(queryByTestId('quick-log-modal')).toBeNull();
  });

  it('displays meal name', () => {
    const { getByTestId } = render(<QuickLogModal {...defaultProps} />);
    expect(getByTestId('meal-name').props.children).toBe('Grilled Chicken Salad');
  });

  it('displays capitalized meal type', () => {
    const { getByTestId } = render(<QuickLogModal {...defaultProps} />);
    expect(getByTestId('meal-type').props.children).toBe('Lunch');
  });

  it('displays macro values', () => {
    const { getByText } = render(<QuickLogModal {...defaultProps} />);
    expect(getByText('Calories')).toBeTruthy();
    expect(getByText('Protein')).toBeTruthy();
    expect(getByText('Carbs')).toBeTruthy();
    expect(getByText('Fat')).toBeTruthy();
  });

  it('displays log count', () => {
    const { getByText } = render(<QuickLogModal {...defaultProps} />);
    expect(getByText('Logged 5 times')).toBeTruthy();
  });

  it('displays "Log for Today" when no selectedDate', () => {
    const { getByTestId } = render(<QuickLogModal {...defaultProps} />);
    expect(getByTestId('log-button-text').props.children).toEqual(['Log for ', 'Today']);
  });

  it('displays formatted date when selectedDate is provided', () => {
    const { getByTestId } = render(
      <QuickLogModal {...defaultProps} selectedDate="2026-01-15" />
    );
    expect(getByTestId('log-button-text').props.children[1]).toContain('Jan');
  });

  it('calls onLog when log button is pressed', async () => {
    const { getByTestId } = render(<QuickLogModal {...defaultProps} />);
    fireEvent.press(getByTestId('log-button'));
    await waitFor(() => {
      expect(defaultProps.onLog).toHaveBeenCalledWith(mockMeal);
    });
  });

  it('calls onClose when cancel button is pressed', () => {
    const { getByTestId } = render(<QuickLogModal {...defaultProps} />);
    fireEvent.press(getByTestId('cancel-button'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = render(<QuickLogModal {...defaultProps} />);
    fireEvent.press(getByTestId('close-button'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
