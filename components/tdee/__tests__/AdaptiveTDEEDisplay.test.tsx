import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AdaptiveTDEEDisplay } from '../AdaptiveTDEEDisplay';

// Mock GlassCard
jest.mock('../../GlassCard', () => ({
  GlassCard: ({ children, style }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

// Mock CircularGauge
jest.mock('../../CircularGauge', () => ({
  CircularGauge: ({ value, label }: any) => {
    const { Text } = require('react-native');
    return <Text>{label}: {value}</Text>;
  },
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock adaptiveTDEE utility
const mockTDEEResult = {
  adaptiveTDEE: 2350,
  formulaTDEE: 2200,
  confidence: 'high' as const,
  confidenceScore: 85,
  needsMoreData: false,
  minDaysRemaining: 0,
  daysOfData: 21,
  weightTrend: 'losing' as const,
  avgWeeklyChange: -0.5,
  variance: 6.8,
  recommendation: 'Your metabolism is running higher than predicted. Great progress!',
};

const mockCalorieAdjustment = {
  targetCalories: 1850,
  adjustment: -500,
};

jest.mock('../../../utils/adaptiveTDEE', () => ({
  calculateAdaptiveTDEE: jest.fn().mockReturnValue(mockTDEEResult),
  getCalorieAdjustment: jest.fn().mockReturnValue(mockCalorieAdjustment),
}));

describe('AdaptiveTDEEDisplay', () => {
  const mockWeightEntries = [
    { date: '2025-01-01', weight: 185 },
    { date: '2025-01-08', weight: 184 },
    { date: '2025-01-15', weight: 183.5 },
  ];

  const mockCalorieEntries = [
    { date: '2025-01-01', calories: 2000, meals: 3 },
    { date: '2025-01-02', calories: 2100, meals: 3 },
    { date: '2025-01-03', calories: 1900, meals: 3 },
  ];

  const mockUserStats = {
    age: 30,
    weight: 183.5,
    height: 70,
    gender: 'male' as const,
    activityLevel: 'moderate' as const,
  };

  const defaultProps = {
    weightEntries: mockWeightEntries,
    calorieEntries: mockCalorieEntries,
    userStats: mockUserStats,
    goal: 'fat_loss' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<AdaptiveTDEEDisplay {...defaultProps} />)).not.toThrow();
  });

  it('shows loading state initially', () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    expect(getByText('Calculating your metabolism...')).toBeTruthy();
  });

  it('displays Adaptive TDEE title after calculation', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('Adaptive TDEE')).toBeTruthy();
    });
  });

  it('displays confidence badge', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('HIGH')).toBeTruthy();
    });
  });

  it('displays TDEE value', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('2,350')).toBeTruthy();
    });
  });

  it('displays cal/day unit', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('cal/day')).toBeTruthy();
    });
  });

  it('displays confidence score', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('85/100')).toBeTruthy();
    });
  });

  it('displays days tracked', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('21 days tracked')).toBeTruthy();
    });
  });

  it('displays Data Quality label', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('Data Quality')).toBeTruthy();
    });
  });

  it('displays comparison between adaptive and formula TDEE', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('Your Data:')).toBeTruthy();
      expect(getByText('2350 cal')).toBeTruthy();
      expect(getByText('Formula Estimate:')).toBeTruthy();
      expect(getByText('2200 cal')).toBeTruthy();
    });
  });

  it('displays variance', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('Variance:')).toBeTruthy();
      expect(getByText('+6.8%')).toBeTruthy();
    });
  });

  it('displays weight trend', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText(/Losing 0.50 lbs\/week/)).toBeTruthy();
    });
  });

  it('displays target calories for fat loss', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('Target for fat loss:')).toBeTruthy();
      expect(getByText('1850 cal/day')).toBeTruthy();
      expect(getByText('-500 cal from TDEE')).toBeTruthy();
    });
  });

  it('displays recommendation text', async () => {
    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText(/Your metabolism is running higher/)).toBeTruthy();
    });
  });

  it('calls onTDEECalculated callback', async () => {
    const onTDEECalculated = jest.fn();
    render(
      <AdaptiveTDEEDisplay
        {...defaultProps}
        onTDEECalculated={onTDEECalculated}
      />
    );
    await waitFor(() => {
      expect(onTDEECalculated).toHaveBeenCalledWith(mockTDEEResult);
    });
  });

  it('shows needs more data state when appropriate', async () => {
    const { calculateAdaptiveTDEE } = require('../../../utils/adaptiveTDEE');
    calculateAdaptiveTDEE.mockReturnValueOnce({
      ...mockTDEEResult,
      needsMoreData: true,
      minDaysRemaining: 7,
      formulaTDEE: 2200,
    });

    const { getByText } = render(<AdaptiveTDEEDisplay {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('7 more days needed')).toBeTruthy();
      expect(getByText(/Continue tracking weight and calories/)).toBeTruthy();
      expect(getByText(/Using formula estimate: 2200 cal\/day/)).toBeTruthy();
    });
  });

  it('renders with muscle_gain goal', async () => {
    const { getByText } = render(
      <AdaptiveTDEEDisplay {...defaultProps} goal="muscle_gain" />
    );
    await waitFor(() => {
      expect(getByText('Target for muscle gain:')).toBeTruthy();
    });
  });

  it('renders with maintain goal', async () => {
    const { getByText } = render(
      <AdaptiveTDEEDisplay {...defaultProps} goal="maintain" />
    );
    await waitFor(() => {
      expect(getByText('Target for maintain:')).toBeTruthy();
    });
  });
});
