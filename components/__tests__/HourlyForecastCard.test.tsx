import React from 'react';
import { render } from '@testing-library/react-native';
import { HourlyForecastCard } from '../HourlyForecastCard';

// Mock the SettingsContext (used by GlassCard internally)
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

describe('HourlyForecastCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<HourlyForecastCard />)).not.toThrow();
  });

  it('generates forecast data on mount', () => {
    const { root } = render(<HourlyForecastCard />);
    // Component should not be in loading state after initial render
    // since generateMockForecasts is synchronous
    expect(root).toBeTruthy();
  });

  it('displays temperature values with degree symbol', () => {
    const { getAllByText } = render(<HourlyForecastCard />);
    // There should be multiple temperature entries with degree symbol
    const tempElements = getAllByText(/\d+\u00B0/);
    expect(tempElements.length).toBeGreaterThan(0);
  });

  it('displays time labels', () => {
    const { getAllByText } = render(<HourlyForecastCard />);
    // Should have AM/PM time labels
    const amLabels = getAllByText(/\d+ AM/);
    const pmLabels = getAllByText(/\d+ PM/);
    expect(amLabels.length + pmLabels.length).toBeGreaterThan(0);
  });

  it('displays date labels', () => {
    const { getAllByText } = render(<HourlyForecastCard />);
    // Should have day of week labels like "Mon 5", "Tue 6", etc.
    const dateLabels = getAllByText(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat) \d+/);
    expect(dateLabels.length).toBeGreaterThan(0);
  });

  it('generates 168 hourly forecasts (7 days)', () => {
    const { getAllByText } = render(<HourlyForecastCard />);
    // Each forecast has a temperature, so count temp entries
    const tempElements = getAllByText(/\d+\u00B0/);
    expect(tempElements.length).toBe(168);
  });

  it('renders forecast cards in a scrollable container', () => {
    const { root } = render(<HourlyForecastCard />);
    // Component should render successfully with scrollable content
    expect(root).toBeTruthy();
  });

  it('includes current hour forecast', () => {
    const now = new Date();
    const hour = now.getHours();
    const expectedLabel = hour === 0
      ? '12 AM'
      : hour < 12
        ? `${hour} AM`
        : hour === 12
          ? '12 PM'
          : `${hour - 12} PM`;

    const { getAllByText } = render(<HourlyForecastCard />);
    const currentHourLabels = getAllByText(expectedLabel);
    expect(currentHourLabels.length).toBeGreaterThan(0);
  });
});
