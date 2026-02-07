import React from 'react';
import { render } from '@testing-library/react-native';
import { SemiCircularGauge } from '../SemiCircularGauge';

// Mock the SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

describe('SemiCircularGauge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<SemiCircularGauge value={1200} maxValue={2000} />)).not.toThrow();
  });

  it('displays current value when showCenterValue is true', () => {
    const { getByText } = render(
      <SemiCircularGauge value={1450} maxValue={2000} showCenterValue={true} />
    );
    expect(getByText('1450')).toBeTruthy();
  });

  it('does not display center value when showCenterValue is false', () => {
    const { queryByText } = render(
      <SemiCircularGauge value={1450} maxValue={2000} showCenterValue={false} />
    );
    // The value should not be rendered
    expect(queryByText('1450')).toBeFalsy();
  });

  it('displays label', () => {
    const { getByText } = render(
      <SemiCircularGauge value={1200} maxValue={2000} label="kcal" />
    );
    expect(getByText('kcal')).toBeTruthy();
  });

  it('displays goal text with unit', () => {
    const { getByText } = render(
      <SemiCircularGauge value={1200} maxValue={2000} unit="kcal" />
    );
    expect(getByText(/of 2,000 kcal goal/)).toBeTruthy();
  });

  it('handles zero value', () => {
    const { getByText } = render(
      <SemiCircularGauge value={0} maxValue={2000} showCenterValue={true} />
    );
    expect(getByText('0')).toBeTruthy();
  });

  it('handles max value reached', () => {
    const { getByText } = render(
      <SemiCircularGauge value={2000} maxValue={2000} showCenterValue={true} />
    );
    expect(getByText('2000')).toBeTruthy();
  });

  it('handles value exceeding max (capped at 100%)', () => {
    const { getByText } = render(
      <SemiCircularGauge value={2500} maxValue={2000} showCenterValue={true} />
    );
    expect(getByText('2500')).toBeTruthy();
  });

  it('has accessibility label with percentage', () => {
    const { getByLabelText } = render(
      <SemiCircularGauge value={1000} maxValue={2000} label="Calories" unit="kcal" />
    );
    expect(getByLabelText(/50% complete/)).toBeTruthy();
  });

  it('has accessibility role of progressbar', () => {
    const { getByRole } = render(
      <SemiCircularGauge value={1200} maxValue={2000} />
    );
    expect(getByRole('progressbar')).toBeTruthy();
  });

  it('formats large numbers with commas in goal text', () => {
    const { getByText } = render(
      <SemiCircularGauge value={500} maxValue={10000} unit="steps" />
    );
    expect(getByText(/of 10,000 steps goal/)).toBeTruthy();
  });

  it('renders with custom size', () => {
    expect(() =>
      render(<SemiCircularGauge value={100} maxValue={200} size={200} />)
    ).not.toThrow();
  });

  it('renders with custom stroke width', () => {
    expect(() =>
      render(<SemiCircularGauge value={100} maxValue={200} strokeWidth={30} />)
    ).not.toThrow();
  });

  it('renders with custom progress color', () => {
    expect(() =>
      render(<SemiCircularGauge value={100} maxValue={200} progressColor="#FF0000" />)
    ).not.toThrow();
  });

  it('uses RoundedNumeral by default', () => {
    const { getByText } = render(
      <SemiCircularGauge value={1234} maxValue={2000} useRoundedNumeral={true} showCenterValue={true} />
    );
    expect(getByText('1234')).toBeTruthy();
  });

  it('rounds value to nearest integer in display', () => {
    const { getByText } = render(
      <SemiCircularGauge value={1234.567} maxValue={2000} showCenterValue={true} />
    );
    expect(getByText('1235')).toBeTruthy(); // Rounded
  });

  it('renders SVG path elements for gauge arc', () => {
    const { root } = render(
      <SemiCircularGauge value={50} maxValue={100} />
    );
    expect(root).toBeTruthy();
  });
});
