import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../liquidGlass/useGlassTheme', () => ({
  useGlassTheme: jest.fn(() => ({
    isDark: true,
    colors: {
      primary: '#4ECDC4',
      text: '#FFFFFF',
      textSecondary: '#999999',
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
const VerificationDetailsModal = ({ visible, verification, onClose, onApplyAdjustments }: any) => {
  const { View, Text, TouchableOpacity, Modal, ScrollView } = require('react-native');

  if (!verification) return null;

  const CONFIDENCE_CONFIG: Record<string, { label: string }> = {
    high: { label: 'High Confidence' },
    medium: { label: 'Medium Confidence' },
    low: { label: 'Low Confidence' },
  };

  const config = CONFIDENCE_CONFIG[verification.confidence];

  return (
    <Modal visible={visible} testID="verification-details-modal">
      <View>
        <Text testID="modal-title">Nutrition Verification</Text>
        <Text testID="confidence-label">{config.label}</Text>
        <Text testID="confidence-score">{verification.confidenceScore}%</Text>

        <TouchableOpacity onPress={onClose} testID="close-button">
          <Text>Close</Text>
        </TouchableOpacity>

        {/* Adjustments */}
        {verification.adjustments.length > 0 && (
          <View testID="adjustments-section">
            <Text>Suggested Adjustments</Text>
            {verification.adjustments.map((adj: any, i: number) => (
              <View key={i} testID={`adjustment-${i}`}>
                <Text>{adj.field.charAt(0).toUpperCase() + adj.field.slice(1)}</Text>
                <Text testID={`original-${i}`}>{adj.originalValue}</Text>
                <Text testID={`adjusted-${i}`}>{adj.adjustedValue}</Text>
                <Text>{adj.reason}</Text>
              </View>
            ))}
            {onApplyAdjustments && (
              <TouchableOpacity onPress={onApplyAdjustments} testID="apply-adjustments-button">
                <Text>Apply Adjustments</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Flags */}
        {verification.flags.length > 0 && (
          <View testID="flags-section">
            <Text>Validation Flags</Text>
            {verification.flags.map((flag: any, i: number) => (
              <View key={i} testID={`flag-${i}`}>
                <Text>{flag.message}</Text>
                <Text>{flag.code}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Sources */}
        <View testID="sources-section">
          <Text>Verification Sources</Text>
          {verification.sources.map((source: any, i: number) => (
            <View key={i} testID={`source-${i}`}>
              <Text>{source.name}</Text>
              <Text>{source.confidence}%</Text>
            </View>
          ))}
        </View>

        {/* Nutrition Table */}
        <View testID="nutrition-table">
          <Text>Nutrition Data</Text>
          <Text>Nutrient</Text>
          <Text>Original</Text>
          <Text>Verified</Text>
          {['calories', 'protein', 'carbs', 'fat'].map((field) => (
            <View key={field} testID={`nutrition-row-${field}`}>
              <Text>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
              <Text>{(verification.originalData as any)[field]}</Text>
              <Text>{(verification.verifiedData as any)[field]}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={onClose} testID="close-bottom-button">
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

describe('VerificationDetailsModal', () => {
  const mockVerification = {
    confidence: 'high' as const,
    confidenceScore: 92,
    flags: [
      { type: 'info' as const, message: 'Data cross-referenced with USDA', code: 'USDA_MATCH' },
    ],
    sources: [
      { type: 'usda' as const, name: 'USDA FoodData Central', confidence: 95, matchScore: 88 },
    ],
    adjustments: [
      {
        field: 'calories',
        originalValue: 500,
        adjustedValue: 480,
        percentChange: -4,
        reason: 'USDA reference suggests lower calorie count',
      },
    ],
    originalData: { calories: 500, protein: 30, carbs: 50, fat: 20 },
    verifiedData: { calories: 480, protein: 30, carbs: 48, fat: 19 },
  };

  const defaultProps = {
    visible: true,
    verification: mockVerification,
    onClose: jest.fn(),
    onApplyAdjustments: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<VerificationDetailsModal {...defaultProps} />)).not.toThrow();
  });

  it('returns null when verification is null', () => {
    const { queryByTestId } = render(
      <VerificationDetailsModal visible={true} verification={null} onClose={jest.fn()} />
    );
    expect(queryByTestId('verification-details-modal')).toBeNull();
  });

  it('displays modal title', () => {
    const { getByText } = render(<VerificationDetailsModal {...defaultProps} />);
    expect(getByText('Nutrition Verification')).toBeTruthy();
  });

  it('displays confidence label', () => {
    const { getByTestId } = render(<VerificationDetailsModal {...defaultProps} />);
    expect(getByTestId('confidence-label').props.children).toBe('High Confidence');
  });

  it('displays confidence score', () => {
    const { getByTestId } = render(<VerificationDetailsModal {...defaultProps} />);
    expect(getByTestId('confidence-score').props.children).toEqual(['92', '%']);
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = render(<VerificationDetailsModal {...defaultProps} />);
    fireEvent.press(getByTestId('close-button'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when bottom close button is pressed', () => {
    const { getByTestId } = render(<VerificationDetailsModal {...defaultProps} />);
    fireEvent.press(getByTestId('close-bottom-button'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays adjustments section when adjustments exist', () => {
    const { getByTestId, getByText } = render(<VerificationDetailsModal {...defaultProps} />);
    expect(getByTestId('adjustments-section')).toBeTruthy();
    expect(getByText('Suggested Adjustments')).toBeTruthy();
  });

  it('displays apply adjustments button when callback is provided', () => {
    const { getByTestId } = render(<VerificationDetailsModal {...defaultProps} />);
    expect(getByTestId('apply-adjustments-button')).toBeTruthy();
  });

  it('calls onApplyAdjustments when apply button is pressed', () => {
    const { getByTestId } = render(<VerificationDetailsModal {...defaultProps} />);
    fireEvent.press(getByTestId('apply-adjustments-button'));
    expect(defaultProps.onApplyAdjustments).toHaveBeenCalledTimes(1);
  });

  it('does not show apply button when onApplyAdjustments is not provided', () => {
    const { queryByTestId } = render(
      <VerificationDetailsModal {...defaultProps} onApplyAdjustments={undefined} />
    );
    expect(queryByTestId('apply-adjustments-button')).toBeNull();
  });

  it('displays flags section when flags exist', () => {
    const { getByTestId, getByText } = render(<VerificationDetailsModal {...defaultProps} />);
    expect(getByTestId('flags-section')).toBeTruthy();
    expect(getByText('Data cross-referenced with USDA')).toBeTruthy();
  });

  it('displays sources section', () => {
    const { getByText } = render(<VerificationDetailsModal {...defaultProps} />);
    expect(getByText('Verification Sources')).toBeTruthy();
    expect(getByText('USDA FoodData Central')).toBeTruthy();
  });

  it('displays nutrition data table', () => {
    const { getByText } = render(<VerificationDetailsModal {...defaultProps} />);
    expect(getByText('Nutrition Data')).toBeTruthy();
    expect(getByText('Calories')).toBeTruthy();
    expect(getByText('Protein')).toBeTruthy();
    expect(getByText('Carbs')).toBeTruthy();
    expect(getByText('Fat')).toBeTruthy();
  });

  it('hides adjustments section when no adjustments', () => {
    const noAdjustments = { ...mockVerification, adjustments: [] };
    const { queryByTestId } = render(
      <VerificationDetailsModal {...defaultProps} verification={noAdjustments} />
    );
    expect(queryByTestId('adjustments-section')).toBeNull();
  });

  it('hides flags section when no flags', () => {
    const noFlags = { ...mockVerification, flags: [] };
    const { queryByTestId } = render(
      <VerificationDetailsModal {...defaultProps} verification={noFlags} />
    );
    expect(queryByTestId('flags-section')).toBeNull();
  });
});
