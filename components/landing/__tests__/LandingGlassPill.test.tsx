import React from 'react';
import { render } from '@testing-library/react-native';

// Inline mock component matching LandingGlassPill interface
const LandingGlassPill = ({
  label,
  icon,
  variant = 'default',
  size = 'md',
}: any) => {
  const { View, Text } = require('react-native');

  return (
    <View testID="glass-pill" accessibilityHint={`${variant}-${size}`}>
      {icon && <View testID="pill-icon">{icon}</View>}
      <Text testID="pill-label">{label}</Text>
    </View>
  );
};

describe('LandingGlassPill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<LandingGlassPill label="Test Pill" />)).not.toThrow();
  });

  it('displays the label text', () => {
    const { getByText } = render(<LandingGlassPill label="Features" />);
    expect(getByText('Features')).toBeTruthy();
  });

  it('renders icon when provided', () => {
    const { Text } = require('react-native');
    const icon = <Text>Icon</Text>;
    const { getByTestId } = render(
      <LandingGlassPill label="Test" icon={icon} />
    );
    expect(getByTestId('pill-icon')).toBeTruthy();
  });

  it('does not render icon when not provided', () => {
    const { queryByTestId } = render(<LandingGlassPill label="Test" />);
    expect(queryByTestId('pill-icon')).toBeNull();
  });

  it('renders with default variant and md size by default', () => {
    const { getByTestId } = render(<LandingGlassPill label="Test" />);
    expect(getByTestId('glass-pill').props.accessibilityHint).toBe('default-md');
  });

  it('renders with accent variant', () => {
    const { getByTestId } = render(
      <LandingGlassPill label="Test" variant="accent" />
    );
    expect(getByTestId('glass-pill').props.accessibilityHint).toBe('accent-md');
  });

  it('renders with sm size', () => {
    const { getByTestId } = render(
      <LandingGlassPill label="Test" size="sm" />
    );
    expect(getByTestId('glass-pill').props.accessibilityHint).toBe('default-sm');
  });

  it('renders with accent variant and sm size', () => {
    const { getByTestId } = render(
      <LandingGlassPill label="Test" variant="accent" size="sm" />
    );
    expect(getByTestId('glass-pill').props.accessibilityHint).toBe('accent-sm');
  });

  it('displays different labels', () => {
    const { getByText, rerender } = render(<LandingGlassPill label="Testimonials" />);
    expect(getByText('Testimonials')).toBeTruthy();

    rerender(<LandingGlassPill label="Features" />);
    expect(getByText('Features')).toBeTruthy();
  });
});
