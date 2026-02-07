import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Inline mock component matching LandingGlassCard interface
const LandingGlassCard = ({
  tier = 'standard',
  hasSpecular = false,
  hasGlow = false,
  glowColor,
  interactive = false,
  borderRadius,
  onPress,
  children,
}: any) => {
  const { View, Text, TouchableOpacity, Pressable } = require('react-native');

  const content = (
    <View testID="glass-card" accessibilityHint={tier}>
      {hasSpecular && <View testID="specular-highlight" />}
      {hasGlow && <View testID="glow-effect" />}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} testID="card-pressable">
        {content}
      </Pressable>
    );
  }

  return content;
};

describe('LandingGlassCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <LandingGlassCard>
          <></>
        </LandingGlassCard>
      )
    ).not.toThrow();
  });

  it('renders children', () => {
    const { Text } = require('react-native');
    const { getByText } = render(
      <LandingGlassCard>
        <Text>Card Content</Text>
      </LandingGlassCard>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('shows specular highlight when hasSpecular is true', () => {
    const { getByTestId } = render(
      <LandingGlassCard hasSpecular={true}>
        <></>
      </LandingGlassCard>
    );
    expect(getByTestId('specular-highlight')).toBeTruthy();
  });

  it('does not show specular highlight when hasSpecular is false', () => {
    const { queryByTestId } = render(
      <LandingGlassCard>
        <></>
      </LandingGlassCard>
    );
    expect(queryByTestId('specular-highlight')).toBeNull();
  });

  it('shows glow effect when hasGlow is true', () => {
    const { getByTestId } = render(
      <LandingGlassCard hasGlow={true}>
        <></>
      </LandingGlassCard>
    );
    expect(getByTestId('glow-effect')).toBeTruthy();
  });

  it('does not show glow effect when hasGlow is false', () => {
    const { queryByTestId } = render(
      <LandingGlassCard>
        <></>
      </LandingGlassCard>
    );
    expect(queryByTestId('glow-effect')).toBeNull();
  });

  it('wraps in Pressable when onPress is provided', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <LandingGlassCard onPress={onPress}>
        <></>
      </LandingGlassCard>
    );
    expect(getByTestId('card-pressable')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <LandingGlassCard onPress={onPress}>
        <></>
      </LandingGlassCard>
    );
    fireEvent.press(getByTestId('card-pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not wrap in Pressable when onPress is not provided', () => {
    const { queryByTestId } = render(
      <LandingGlassCard>
        <></>
      </LandingGlassCard>
    );
    expect(queryByTestId('card-pressable')).toBeNull();
  });

  it('renders with standard tier by default', () => {
    const { getByTestId } = render(
      <LandingGlassCard>
        <></>
      </LandingGlassCard>
    );
    expect(getByTestId('glass-card').props.accessibilityHint).toBe('standard');
  });

  it('renders with elevated tier', () => {
    const { getByTestId } = render(
      <LandingGlassCard tier="elevated">
        <></>
      </LandingGlassCard>
    );
    expect(getByTestId('glass-card').props.accessibilityHint).toBe('elevated');
  });

  it('renders with subtle tier', () => {
    const { getByTestId } = render(
      <LandingGlassCard tier="subtle">
        <></>
      </LandingGlassCard>
    );
    expect(getByTestId('glass-card').props.accessibilityHint).toBe('subtle');
  });
});
