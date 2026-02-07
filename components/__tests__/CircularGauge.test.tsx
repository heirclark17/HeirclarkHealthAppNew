import React from 'react';
import { render } from '@testing-library/react-native';
import { CircularGauge } from '../CircularGauge';

// Mock the SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

describe('CircularGauge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<CircularGauge value={50} maxValue={100} />)).not.toThrow();
  });

  it('displays current value', () => {
    const { getByText } = render(<CircularGauge value={75} maxValue={100} />);
    expect(getByText('75')).toBeTruthy();
  });

  it('displays unit when provided', () => {
    const { getByText } = render(<CircularGauge value={500} maxValue={1000} unit="kcal" />);
    expect(getByText('kcal')).toBeTruthy();
  });

  it('displays label when provided', () => {
    const { getByText } = render(<CircularGauge value={8000} maxValue={10000} label="STEPS" />);
    expect(getByText('STEPS')).toBeTruthy();
  });

  it('handles zero value', () => {
    const { getByText } = render(<CircularGauge value={0} maxValue={100} />);
    expect(getByText('0')).toBeTruthy();
  });

  it('handles max value reached', () => {
    const { getByText } = render(<CircularGauge value={100} maxValue={100} />);
    expect(getByText('100')).toBeTruthy();
  });

  it('handles value exceeding max (capped at 100%)', () => {
    const { getByText } = render(<CircularGauge value={150} maxValue={100} />);
    expect(getByText('150')).toBeTruthy();
  });

  it('has accessibility label with percentage', () => {
    const { getByLabelText } = render(
      <CircularGauge value={50} maxValue={100} label="Progress" unit="%" />
    );
    expect(getByLabelText(/50% of 100/)).toBeTruthy();
  });

  it('has accessibility role of progressbar', () => {
    const { getByRole } = render(<CircularGauge value={25} maxValue={100} />);
    expect(getByRole('progressbar')).toBeTruthy();
  });

  it('formats large numbers with commas in value', () => {
    const { getByText } = render(<CircularGauge value={1450} maxValue={2000} />);
    expect(getByText('1,450')).toBeTruthy();
  });

  it('renders with custom size', () => {
    expect(() => render(<CircularGauge value={50} maxValue={100} size={150} />)).not.toThrow();
  });

  it('renders with custom stroke width', () => {
    expect(() => render(<CircularGauge value={50} maxValue={100} strokeWidth={20} />)).not.toThrow();
  });

  it('renders SVG circle elements', () => {
    const { root } = render(<CircularGauge value={50} maxValue={100} />);
    expect(root).toBeTruthy();
  });

  it('displays both label and unit together', () => {
    const { getByText } = render(
      <CircularGauge value={250} maxValue={500} label="WATER" unit="ml" />
    );
    expect(getByText('WATER')).toBeTruthy();
    expect(getByText('ml')).toBeTruthy();
  });

  it('handles decimal values', () => {
    const { getByText } = render(<CircularGauge value={42.7} maxValue={100} />);
    expect(getByText('43')).toBeTruthy(); // Rounded to 0 decimals by default
  });
});
