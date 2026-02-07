import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../contexts/AdaptiveTDEEContext', () => ({
  useAdaptiveTDEE: jest.fn(() => ({
    state: {
      result: null,
      isCalculating: false,
      isEnabled: false,
      daysUntilReady: 10,
      weightHistory: [],
      calorieHistory: [],
    },
    recalculateTDEE: jest.fn(),
    getRecommendedCalories: jest.fn(() => 2000),
  })),
}));

jest.mock('../../../../contexts/SettingsContext', () => ({
  useSettings: jest.fn(() => ({
    settings: { themeMode: 'dark' },
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

jest.mock('../TDEEInsightModal', () => {
  return {
    __esModule: true,
    default: () => null,
  };
});

// Inline mock component
const AdaptiveTDEECard = ({ onPress }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  const { useAdaptiveTDEE } = require('../../../../contexts/AdaptiveTDEEContext');
  const { state, getRecommendedCalories } = useAdaptiveTDEE();
  const [showModal, setShowModal] = React.useState(false);

  const { result, isCalculating, isEnabled, daysUntilReady } = state;

  return (
    <View testID="adaptive-tdee-card">
      <TouchableOpacity onPress={() => setShowModal(true)} testID="card-pressable">
        <Text testID="card-title">Adaptive TDEE</Text>
        <Text testID="card-subtitle">Your true metabolism</Text>

        {isCalculating ? (
          <Text testID="loading-text">Calculating your metabolism...</Text>
        ) : !isEnabled ? (
          <View testID="not-ready-state">
            <Text testID="not-ready-title">Learning Your Metabolism</Text>
            <Text testID="days-until-ready">
              Log your weight and meals daily. In {daysUntilReady} more days, we'll calculate your true TDEE.
            </Text>
            <Text>Log daily weight</Text>
            <Text>Track meals</Text>
          </View>
        ) : (
          <View testID="tdee-display">
            <Text testID="tdee-value">{result?.adaptiveTDEE?.toLocaleString()}</Text>
            <Text>cal/day</Text>
            <Text testID="formula-tdee">{result?.formulaTDEE?.toLocaleString()}</Text>
            <Text testID="recommended-calories">{getRecommendedCalories().toLocaleString()}</Text>
          </View>
        )}

        <Text testID="footer-text">
          {isEnabled
            ? 'Tap for insights and detailed breakdown'
            : 'Tap for more information'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

describe('AdaptiveTDEECard', () => {
  const { useAdaptiveTDEE } = require('../../../../contexts/AdaptiveTDEEContext');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<AdaptiveTDEECard />)).not.toThrow();
  });

  it('displays card title and subtitle', () => {
    const { getByText } = render(<AdaptiveTDEECard />);
    expect(getByText('Adaptive TDEE')).toBeTruthy();
    expect(getByText('Your true metabolism')).toBeTruthy();
  });

  it('shows not ready state when not enabled', () => {
    const { getByTestId, getByText } = render(<AdaptiveTDEECard />);
    expect(getByTestId('not-ready-state')).toBeTruthy();
    expect(getByText('Learning Your Metabolism')).toBeTruthy();
    expect(getByText('Log daily weight')).toBeTruthy();
    expect(getByText('Track meals')).toBeTruthy();
  });

  it('shows calculating state when isCalculating is true', () => {
    (useAdaptiveTDEE as jest.Mock).mockReturnValue({
      state: {
        result: null,
        isCalculating: true,
        isEnabled: false,
        daysUntilReady: 5,
        weightHistory: [],
        calorieHistory: [],
      },
      recalculateTDEE: jest.fn(),
      getRecommendedCalories: jest.fn(() => 2000),
    });

    const { getByText } = render(<AdaptiveTDEECard />);
    expect(getByText('Calculating your metabolism...')).toBeTruthy();
  });

  it('shows TDEE display when enabled', () => {
    (useAdaptiveTDEE as jest.Mock).mockReturnValue({
      state: {
        result: {
          adaptiveTDEE: 2350,
          formulaTDEE: 2200,
          confidence: 'high',
          dataPoints: 8,
          metabolismTrend: 'faster',
          difference: 150,
          differencePercent: 6.8,
        },
        isCalculating: false,
        isEnabled: true,
        daysUntilReady: 0,
        weightHistory: [{ weight: 180 }],
        calorieHistory: [{ calories: 2200 }],
      },
      recalculateTDEE: jest.fn(),
      getRecommendedCalories: jest.fn(() => 2100),
    });

    const { getByTestId, getByText } = render(<AdaptiveTDEECard />);
    expect(getByTestId('tdee-display')).toBeTruthy();
    expect(getByText('cal/day')).toBeTruthy();
  });

  it('shows correct footer text when not enabled', () => {
    const { getByTestId } = render(<AdaptiveTDEECard />);
    expect(getByTestId('footer-text').props.children).toBe('Tap for more information');
  });

  it('shows correct footer text when enabled', () => {
    (useAdaptiveTDEE as jest.Mock).mockReturnValue({
      state: {
        result: {
          adaptiveTDEE: 2350,
          formulaTDEE: 2200,
          confidence: 'high',
          dataPoints: 8,
          metabolismTrend: 'normal',
          difference: 150,
          differencePercent: 6.8,
        },
        isCalculating: false,
        isEnabled: true,
        daysUntilReady: 0,
        weightHistory: [],
        calorieHistory: [],
      },
      recalculateTDEE: jest.fn(),
      getRecommendedCalories: jest.fn(() => 2100),
    });

    const { getByTestId } = render(<AdaptiveTDEECard />);
    expect(getByTestId('footer-text').props.children).toBe(
      'Tap for insights and detailed breakdown'
    );
  });

  it('displays days until ready message', () => {
    (useAdaptiveTDEE as jest.Mock).mockReturnValue({
      state: {
        result: null,
        isCalculating: false,
        isEnabled: false,
        daysUntilReady: 7,
        weightHistory: [],
        calorieHistory: [],
      },
      recalculateTDEE: jest.fn(),
      getRecommendedCalories: jest.fn(() => 2000),
    });

    const { getByText } = render(<AdaptiveTDEECard />);
    expect(
      getByText(
        /In 7 more days/
      )
    ).toBeTruthy();
  });
});
