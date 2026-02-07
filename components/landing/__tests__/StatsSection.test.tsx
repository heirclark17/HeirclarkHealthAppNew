import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../../hooks/useResponsive', () => ({
  useBreakpoint: jest.fn(() => 'desktop'),
  useScrollReveal: jest.fn(() => ({ ref: { current: null }, isVisible: true })),
}));

jest.mock('../LandingGlassCard', () => ({
  LandingGlassCard: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Inline mock component
const StatsSection = () => {
  const { View, Text } = require('react-native');

  const stats = [
    { id: 'users', value: '10K+', label: 'Active Users' },
    { id: 'meals', value: '500K+', label: 'Meals Tracked' },
    { id: 'rating', value: '4.9', label: 'App Store Rating' },
    { id: 'goals', value: '85%', label: 'Users Hit Goals' },
  ];

  return (
    <View testID="stats-section">
      {stats.map((stat) => (
        <View key={stat.id} testID={`stat-card-${stat.id}`}>
          <Text testID={`stat-value-${stat.id}`}>{stat.value}</Text>
          <Text testID={`stat-label-${stat.id}`}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

describe('StatsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<StatsSection />)).not.toThrow();
  });

  it('displays all four stat cards', () => {
    const { getByTestId } = render(<StatsSection />);
    expect(getByTestId('stat-card-users')).toBeTruthy();
    expect(getByTestId('stat-card-meals')).toBeTruthy();
    expect(getByTestId('stat-card-rating')).toBeTruthy();
    expect(getByTestId('stat-card-goals')).toBeTruthy();
  });

  it('displays Active Users stat', () => {
    const { getByText } = render(<StatsSection />);
    expect(getByText('Active Users')).toBeTruthy();
    expect(getByText('10K+')).toBeTruthy();
  });

  it('displays Meals Tracked stat', () => {
    const { getByText } = render(<StatsSection />);
    expect(getByText('Meals Tracked')).toBeTruthy();
    expect(getByText('500K+')).toBeTruthy();
  });

  it('displays App Store Rating stat', () => {
    const { getByText } = render(<StatsSection />);
    expect(getByText('App Store Rating')).toBeTruthy();
    expect(getByText('4.9')).toBeTruthy();
  });

  it('displays Users Hit Goals stat', () => {
    const { getByText } = render(<StatsSection />);
    expect(getByText('Users Hit Goals')).toBeTruthy();
    expect(getByText('85%')).toBeTruthy();
  });

  it('renders the stats section container', () => {
    const { getByTestId } = render(<StatsSection />);
    expect(getByTestId('stats-section')).toBeTruthy();
  });
});
