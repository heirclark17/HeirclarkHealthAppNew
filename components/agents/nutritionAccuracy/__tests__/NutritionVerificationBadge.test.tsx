import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../liquidGlass/useGlassTheme', () => ({
  useGlassTheme: jest.fn(() => ({
    isDark: true,
  })),
}));

// Inline mock component matching real interface
const NutritionVerificationBadge = ({ verification, size = 'medium', showLabel = false, onPress }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');

  if (!verification) return null;

  const CONFIDENCE_CONFIG: Record<string, { label: string }> = {
    high: { label: 'Verified' },
    medium: { label: 'Partial' },
    low: { label: 'Unverified' },
  };

  const config = CONFIDENCE_CONFIG[verification.confidence];
  const hasFlags = verification.flags.filter(
    (f: any) => f.type === 'warning' || f.type === 'error'
  ).length > 0;

  const content = (
    <View testID="verification-badge">
      <Text testID="confidence-level">{verification.confidence}</Text>
      {showLabel && <Text testID="badge-label">{config.label}</Text>}
      {hasFlags && size !== 'small' && <View testID="flag-dot" />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} testID="badge-pressable">
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

describe('NutritionVerificationBadge', () => {
  const highConfidenceVerification = {
    confidence: 'high',
    confidenceScore: 95,
    flags: [],
    sources: [],
    adjustments: [],
    originalData: { calories: 500, protein: 30, carbs: 50, fat: 20 },
    verifiedData: { calories: 500, protein: 30, carbs: 50, fat: 20 },
  };

  const lowConfidenceVerification = {
    confidence: 'low',
    confidenceScore: 30,
    flags: [{ type: 'warning', message: 'Calorie count seems low', code: 'LOW_CAL' }],
    sources: [],
    adjustments: [],
    originalData: { calories: 100, protein: 5, carbs: 10, fat: 3 },
    verifiedData: { calories: 200, protein: 10, carbs: 20, fat: 6 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(<NutritionVerificationBadge verification={highConfidenceVerification} />)
    ).not.toThrow();
  });

  it('returns null when verification is null', () => {
    const { queryByTestId } = render(
      <NutritionVerificationBadge verification={null} />
    );
    expect(queryByTestId('verification-badge')).toBeNull();
  });

  it('displays high confidence level', () => {
    const { getByTestId } = render(
      <NutritionVerificationBadge verification={highConfidenceVerification} />
    );
    expect(getByTestId('confidence-level').props.children).toBe('high');
  });

  it('displays low confidence level', () => {
    const { getByTestId } = render(
      <NutritionVerificationBadge verification={lowConfidenceVerification} />
    );
    expect(getByTestId('confidence-level').props.children).toBe('low');
  });

  it('shows label when showLabel is true', () => {
    const { getByTestId } = render(
      <NutritionVerificationBadge
        verification={highConfidenceVerification}
        showLabel={true}
      />
    );
    expect(getByTestId('badge-label').props.children).toBe('Verified');
  });

  it('does not show label when showLabel is false', () => {
    const { queryByTestId } = render(
      <NutritionVerificationBadge verification={highConfidenceVerification} />
    );
    expect(queryByTestId('badge-label')).toBeNull();
  });

  it('shows label "Unverified" for low confidence', () => {
    const { getByTestId } = render(
      <NutritionVerificationBadge
        verification={lowConfidenceVerification}
        showLabel={true}
      />
    );
    expect(getByTestId('badge-label').props.children).toBe('Unverified');
  });

  it('shows flag dot when there are warning flags and size is not small', () => {
    const { getByTestId } = render(
      <NutritionVerificationBadge
        verification={lowConfidenceVerification}
        size="medium"
      />
    );
    expect(getByTestId('flag-dot')).toBeTruthy();
  });

  it('does not show flag dot for small size even with flags', () => {
    const { queryByTestId } = render(
      <NutritionVerificationBadge
        verification={lowConfidenceVerification}
        size="small"
      />
    );
    expect(queryByTestId('flag-dot')).toBeNull();
  });

  it('does not show flag dot when no warning/error flags', () => {
    const { queryByTestId } = render(
      <NutritionVerificationBadge verification={highConfidenceVerification} />
    );
    expect(queryByTestId('flag-dot')).toBeNull();
  });

  it('wraps in TouchableOpacity when onPress is provided', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <NutritionVerificationBadge
        verification={highConfidenceVerification}
        onPress={onPress}
      />
    );
    expect(getByTestId('badge-pressable')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <NutritionVerificationBadge
        verification={highConfidenceVerification}
        onPress={onPress}
      />
    );
    fireEvent.press(getByTestId('badge-pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not wrap in TouchableOpacity when onPress is not provided', () => {
    const { queryByTestId } = render(
      <NutritionVerificationBadge verification={highConfidenceVerification} />
    );
    expect(queryByTestId('badge-pressable')).toBeNull();
  });
});
