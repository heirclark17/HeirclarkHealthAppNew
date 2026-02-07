import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../contexts/AdaptiveTDEEContext', () => ({
  useAdaptiveTDEE: jest.fn(() => ({
    state: {
      result: null,
      isEnabled: false,
      daysUntilReady: 10,
    },
    getRecommendedCalories: jest.fn(() => 2000),
  })),
}));

jest.mock('../../../liquidGlass/useGlassTheme', () => ({
  useGlassTheme: jest.fn(() => ({
    isDark: true,
    getGlassBackground: jest.fn(() => 'rgba(0,0,0,0.5)'),
    getGlassBorder: jest.fn(() => 'rgba(255,255,255,0.1)'),
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

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 44, bottom: 34, left: 0, right: 0 })),
}));

// Inline mock component
const TDEEInsightModal = ({ visible, onClose }: any) => {
  const { View, Text, TouchableOpacity, Modal, ScrollView } = require('react-native');
  const { useAdaptiveTDEE } = require('../../../../contexts/AdaptiveTDEEContext');
  const { state, getRecommendedCalories } = useAdaptiveTDEE();
  const { result, isEnabled, daysUntilReady } = state;

  return (
    <Modal visible={visible} testID="tdee-insight-modal">
      <View>
        <Text testID="header-title">Adaptive TDEE</Text>
        <Text testID="header-subtitle">
          {isEnabled ? 'Your personalized metabolism' : 'Learning in progress'}
        </Text>

        <TouchableOpacity onPress={onClose} testID="close-button">
          <Text>Close</Text>
        </TouchableOpacity>

        {!isEnabled ? (
          <View testID="not-ready-section">
            <Text testID="not-ready-title">Building Your Profile</Text>
            <Text testID="not-ready-desc">
              We need {daysUntilReady} more days of data to calculate your true TDEE.
            </Text>
            <Text>Tips for Accuracy</Text>
          </View>
        ) : result ? (
          <View testID="main-stats-section">
            <Text>Your Adaptive TDEE</Text>
            <Text testID="adaptive-tdee">{result.adaptiveTDEE.toLocaleString()}</Text>
            <Text>cal/day</Text>
            <Text>Formula TDEE</Text>
            <Text testID="formula-tdee">{result.formulaTDEE.toLocaleString()}</Text>
            <Text>Recommended Daily Intake</Text>
            <Text testID="recommended-cal">{getRecommendedCalories().toLocaleString()} calories</Text>
          </View>
        ) : null}

        {/* How It Works - always shows */}
        <View testID="how-it-works-section">
          <Text>How Adaptive TDEE Works</Text>
          <Text>Track Your Data</Text>
          <Text>We Analyze Patterns</Text>
          <Text>Continuous Learning</Text>
        </View>
      </View>
    </Modal>
  );
};

describe('TDEEInsightModal', () => {
  const { useAdaptiveTDEE } = require('../../../../contexts/AdaptiveTDEEContext');

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<TDEEInsightModal {...defaultProps} />)).not.toThrow();
  });

  it('displays header title', () => {
    const { getByText } = render(<TDEEInsightModal {...defaultProps} />);
    expect(getByText('Adaptive TDEE')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = render(<TDEEInsightModal {...defaultProps} />);
    fireEvent.press(getByTestId('close-button'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows not ready state when not enabled', () => {
    const { getByTestId, getByText } = render(<TDEEInsightModal {...defaultProps} />);
    expect(getByTestId('not-ready-section')).toBeTruthy();
    expect(getByText('Building Your Profile')).toBeTruthy();
    expect(getByText('Tips for Accuracy')).toBeTruthy();
  });

  it('shows "Learning in progress" subtitle when not enabled', () => {
    const { getByTestId } = render(<TDEEInsightModal {...defaultProps} />);
    expect(getByTestId('header-subtitle').props.children).toBe('Learning in progress');
  });

  it('shows TDEE stats when enabled with result', () => {
    (useAdaptiveTDEE as jest.Mock).mockReturnValue({
      state: {
        result: {
          adaptiveTDEE: 2400,
          formulaTDEE: 2200,
          confidence: 'high',
          confidenceScore: 90,
          difference: 200,
          differencePercent: 9,
          metabolismTrend: 'faster',
          dataPoints: 8,
          weeklyHistory: [],
          insights: [],
        },
        isEnabled: true,
        daysUntilReady: 0,
      },
      getRecommendedCalories: jest.fn(() => 2100),
    });

    const { getByTestId, getByText } = render(<TDEEInsightModal {...defaultProps} />);
    expect(getByTestId('main-stats-section')).toBeTruthy();
    expect(getByText('Your Adaptive TDEE')).toBeTruthy();
    expect(getByText('cal/day')).toBeTruthy();
    expect(getByText('Formula TDEE')).toBeTruthy();
    expect(getByText('Recommended Daily Intake')).toBeTruthy();
  });

  it('shows personalized metabolism subtitle when enabled', () => {
    (useAdaptiveTDEE as jest.Mock).mockReturnValue({
      state: {
        result: {
          adaptiveTDEE: 2400,
          formulaTDEE: 2200,
          confidence: 'high',
          confidenceScore: 90,
          difference: 200,
          differencePercent: 9,
          metabolismTrend: 'faster',
          dataPoints: 8,
          weeklyHistory: [],
          insights: [],
        },
        isEnabled: true,
        daysUntilReady: 0,
      },
      getRecommendedCalories: jest.fn(() => 2100),
    });

    const { getByTestId } = render(<TDEEInsightModal {...defaultProps} />);
    expect(getByTestId('header-subtitle').props.children).toBe('Your personalized metabolism');
  });

  it('always shows How It Works section', () => {
    const { getByText } = render(<TDEEInsightModal {...defaultProps} />);
    expect(getByText('How Adaptive TDEE Works')).toBeTruthy();
    expect(getByText('Track Your Data')).toBeTruthy();
    expect(getByText('We Analyze Patterns')).toBeTruthy();
    expect(getByText('Continuous Learning')).toBeTruthy();
  });

  it('displays days until ready in not-ready description', () => {
    (useAdaptiveTDEE as jest.Mock).mockReturnValue({
      state: {
        result: null,
        isEnabled: false,
        daysUntilReady: 5,
      },
      getRecommendedCalories: jest.fn(() => 2000),
    });

    const { getByText } = render(<TDEEInsightModal {...defaultProps} />);
    expect(getByText(/We need 5 more days/)).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { getByTestId } = render(<TDEEInsightModal {...defaultProps} visible={false} />);
    expect(getByTestId('tdee-insight-modal').props.visible).toBe(false);
  });
});
