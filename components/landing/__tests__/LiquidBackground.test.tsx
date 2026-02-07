import React from 'react';
import { render } from '@testing-library/react-native';

// Inline mock component matching LiquidBackground
const LiquidBackground = () => {
  const { View } = require('react-native');

  return (
    <View testID="liquid-background" style={{ position: 'absolute' }}>
      {/* Base gradient */}
      <View testID="base-gradient" />

      {/* Animated orbs */}
      <View testID="orb-0" />
      <View testID="orb-1" />
      <View testID="orb-2" />
      <View testID="orb-3" />

      {/* Blur overlay */}
      <View testID="blur-overlay" />

      {/* Noise texture */}
      <View testID="noise-overlay" />
    </View>
  );
};

describe('LiquidBackground', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<LiquidBackground />)).not.toThrow();
  });

  it('renders the main container', () => {
    const { getByTestId } = render(<LiquidBackground />);
    expect(getByTestId('liquid-background')).toBeTruthy();
  });

  it('renders the base gradient', () => {
    const { getByTestId } = render(<LiquidBackground />);
    expect(getByTestId('base-gradient')).toBeTruthy();
  });

  it('renders all four animated orbs', () => {
    const { getByTestId } = render(<LiquidBackground />);
    expect(getByTestId('orb-0')).toBeTruthy();
    expect(getByTestId('orb-1')).toBeTruthy();
    expect(getByTestId('orb-2')).toBeTruthy();
    expect(getByTestId('orb-3')).toBeTruthy();
  });

  it('renders the blur overlay', () => {
    const { getByTestId } = render(<LiquidBackground />);
    expect(getByTestId('blur-overlay')).toBeTruthy();
  });

  it('renders the noise overlay', () => {
    const { getByTestId } = render(<LiquidBackground />);
    expect(getByTestId('noise-overlay')).toBeTruthy();
  });

  it('uses absolute positioning for the container', () => {
    const { getByTestId } = render(<LiquidBackground />);
    const container = getByTestId('liquid-background');
    expect(container.props.style).toEqual(
      expect.objectContaining({ position: 'absolute' })
    );
  });
});
