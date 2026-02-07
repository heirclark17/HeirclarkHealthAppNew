import React from 'react';
import { render } from '@testing-library/react-native';
import { RoundedNumeral } from '../RoundedNumeral';

describe('RoundedNumeral', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<RoundedNumeral value={123} />)).not.toThrow();
  });

  it('displays numeric value correctly', () => {
    const { getByText } = render(<RoundedNumeral value={1450} />);
    expect(getByText('1,450')).toBeTruthy();
  });

  it('formats numbers with commas by default', () => {
    const { getByText } = render(<RoundedNumeral value={2200} />);
    expect(getByText('2,200')).toBeTruthy();
  });

  it('displays numbers without commas when showCommas is false', () => {
    const { getByText } = render(<RoundedNumeral value={2200} showCommas={false} />);
    expect(getByText('2200')).toBeTruthy();
  });

  it('displays unit when provided', () => {
    const { getByText } = render(<RoundedNumeral value={150} unit="kcal" />);
    expect(getByText('150 kcal')).toBeTruthy();
  });

  it('formats decimals correctly', () => {
    const { getByText } = render(<RoundedNumeral value={42.567} decimals={2} />);
    expect(getByText('42.57')).toBeTruthy();
  });

  it('handles zero value', () => {
    const { getByText } = render(<RoundedNumeral value={0} />);
    expect(getByText('0')).toBeTruthy();
  });

  it('handles string numeric values', () => {
    const { getByText } = render(<RoundedNumeral value="500" />);
    expect(getByText('500')).toBeTruthy();
  });

  it('handles non-numeric strings gracefully', () => {
    const { getByText } = render(<RoundedNumeral value="abc" />);
    expect(getByText('abc')).toBeTruthy();
  });

  it('applies small size styles', () => {
    const { getByText } = render(<RoundedNumeral value={100} size="small" />);
    const element = getByText('100');
    expect(element).toBeTruthy();
  });

  it('applies medium size styles (default)', () => {
    const { getByText } = render(<RoundedNumeral value={100} size="medium" />);
    const element = getByText('100');
    expect(element).toBeTruthy();
  });

  it('applies large size styles', () => {
    const { getByText } = render(<RoundedNumeral value={100} size="large" />);
    const element = getByText('100');
    expect(element).toBeTruthy();
  });

  it('has accessibility label with value and unit', () => {
    const { getByLabelText } = render(<RoundedNumeral value={250} unit="ml" />);
    expect(getByLabelText('250 ml')).toBeTruthy();
  });

  it('handles negative numbers', () => {
    const { getByText } = render(<RoundedNumeral value={-42} />);
    expect(getByText('-42')).toBeTruthy();
  });

  it('formats large numbers with commas', () => {
    const { getByText } = render(<RoundedNumeral value={1234567} />);
    expect(getByText('1,234,567')).toBeTruthy();
  });
});
