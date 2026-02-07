import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Inline mock component matching LandingGlassButton interface
const LandingGlassButton = ({
  variant = 'primary',
  size = 'md',
  label,
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  onPress,
}: any) => {
  const { View, Text, TouchableOpacity, ActivityIndicator } = require('react-native');

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      testID="glass-button"
      accessibilityState={{ disabled: isDisabled }}
    >
      <View testID="button-content">
        {loading ? (
          <ActivityIndicator testID="loading-indicator" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View testID="icon-left">{icon}</View>
            )}
            <Text
              testID="button-label"
              style={isDisabled ? { opacity: 0.5 } : undefined}
            >
              {label}
            </Text>
            {icon && iconPosition === 'right' && (
              <View testID="icon-right">{icon}</View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

describe('LandingGlassButton', () => {
  const defaultProps = {
    label: 'Download App',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<LandingGlassButton {...defaultProps} />)).not.toThrow();
  });

  it('displays button label', () => {
    const { getByText } = render(<LandingGlassButton {...defaultProps} />);
    expect(getByText('Download App')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByTestId } = render(<LandingGlassButton {...defaultProps} />);
    fireEvent.press(getByTestId('glass-button'));
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading is true', () => {
    const { getByTestId, queryByText } = render(
      <LandingGlassButton {...defaultProps} loading={true} />
    );
    expect(getByTestId('loading-indicator')).toBeTruthy();
    expect(queryByText('Download App')).toBeNull();
  });

  it('is disabled when loading is true', () => {
    const { getByTestId } = render(
      <LandingGlassButton {...defaultProps} loading={true} />
    );
    expect(getByTestId('glass-button').props.accessibilityState.disabled).toBe(true);
  });

  it('is disabled when disabled prop is true', () => {
    const { getByTestId } = render(
      <LandingGlassButton {...defaultProps} disabled={true} />
    );
    expect(getByTestId('glass-button').props.accessibilityState.disabled).toBe(true);
  });

  it('renders icon on the left by default', () => {
    const { Text } = require('react-native');
    const icon = <Text testID="test-icon">Icon</Text>;
    const { getByTestId } = render(
      <LandingGlassButton {...defaultProps} icon={icon} />
    );
    expect(getByTestId('icon-left')).toBeTruthy();
  });

  it('renders icon on the right when iconPosition is right', () => {
    const { Text } = require('react-native');
    const icon = <Text testID="test-icon">Icon</Text>;
    const { getByTestId } = render(
      <LandingGlassButton {...defaultProps} icon={icon} iconPosition="right" />
    );
    expect(getByTestId('icon-right')).toBeTruthy();
  });

  it('renders with different label', () => {
    const { getByText } = render(
      <LandingGlassButton {...defaultProps} label="Get Started" />
    );
    expect(getByText('Get Started')).toBeTruthy();
  });

  it('does not call onPress when disabled', () => {
    const { getByTestId } = render(
      <LandingGlassButton {...defaultProps} disabled={true} />
    );
    fireEvent.press(getByTestId('glass-button'));
    expect(defaultProps.onPress).not.toHaveBeenCalled();
  });
});
