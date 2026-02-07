import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GlassButton } from '../GlassButton';

// Mock dependencies
jest.mock('../useGlassTheme', () => ({
  useGlassTheme: () => ({
    isDark: true,
    colors: {
      text: {
        primary: '#fff',
        inverse: '#000',
      },
      icon: {
        primary: '#fff',
      },
      semantic: {
        info: '#007AFF',
      },
    },
    getGlassBackground: jest.fn(() => 'rgba(255, 255, 255, 0.1)'),
    getGlassBorder: jest.fn(() => 'rgba(255, 255, 255, 0.2)'),
  }),
}));

jest.mock('../AdaptiveText', () => ({
  AdaptiveText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock('../AdaptiveIcon', () => ({
  AdaptiveIcon: ({ name, ...props }: any) => {
    const { View } = require('react-native');
    return <View testID={`icon-${name}`} {...props} />;
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

describe('GlassButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<GlassButton />)).not.toThrow();
  });

  it('renders with title', () => {
    const { getByText } = render(<GlassButton title="Click Me" />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('renders with icon on left', () => {
    const { getByTestId } = render(
      <GlassButton title="Button" icon="checkmark" iconPosition="left" />
    );
    expect(getByTestId('icon-checkmark')).toBeTruthy();
  });

  it('renders with icon on right', () => {
    const { getByTestId } = render(
      <GlassButton title="Button" icon="arrow-forward" iconPosition="right" />
    );
    expect(getByTestId('icon-arrow-forward')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <GlassButton title="Press Me" onPress={onPress} />
    );

    fireEvent.press(getByText('Press Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <GlassButton title="Disabled" onPress={onPress} disabled />
    );

    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <GlassButton title="Loading" onPress={onPress} loading />
    );

    fireEvent.press(getByText('Loading'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies primary variant styles', () => {
    const { getByText } = render(
      <GlassButton title="Primary" variant="primary" />
    );
    expect(getByText('Primary')).toBeTruthy();
  });

  it('applies secondary variant styles', () => {
    const { getByText } = render(
      <GlassButton title="Secondary" variant="secondary" />
    );
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('applies ghost variant styles', () => {
    const { getByText } = render(
      <GlassButton title="Ghost" variant="ghost" />
    );
    expect(getByText('Ghost')).toBeTruthy();
  });

  it('applies accent variant styles', () => {
    const { getByText } = render(
      <GlassButton title="Accent" variant="accent" />
    );
    expect(getByText('Accent')).toBeTruthy();
  });

  it('applies small size styles', () => {
    const { getByText } = render(
      <GlassButton title="Small" size="small" />
    );
    expect(getByText('Small')).toBeTruthy();
  });

  it('applies medium size styles', () => {
    const { getByText } = render(
      <GlassButton title="Medium" size="medium" />
    );
    expect(getByText('Medium')).toBeTruthy();
  });

  it('applies large size styles', () => {
    const { getByText } = render(
      <GlassButton title="Large" size="large" />
    );
    expect(getByText('Large')).toBeTruthy();
  });

  it('applies fullWidth prop', () => {
    const { getByText } = render(
      <GlassButton title="Full Width" fullWidth />
    );
    expect(getByText('Full Width')).toBeTruthy();
  });

  it('applies custom style', () => {
    const customStyle = { marginTop: 20 };
    const { getByText } = render(
      <GlassButton title="Custom" style={customStyle} />
    );
    expect(getByText('Custom')).toBeTruthy();
  });

  it('renders icon-only button', () => {
    const { getByTestId } = render(
      <GlassButton icon="settings" />
    );
    expect(getByTestId('icon-settings')).toBeTruthy();
  });

  it('handles pressIn and pressOut events', () => {
    const { getByText } = render(
      <GlassButton title="Press Test" />
    );

    const button = getByText('Press Test');
    fireEvent(button, 'pressIn');
    fireEvent(button, 'pressOut');
    expect(button).toBeTruthy();
  });
});
