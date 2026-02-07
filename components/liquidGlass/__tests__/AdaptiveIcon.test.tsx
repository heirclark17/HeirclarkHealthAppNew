import React from 'react';
import { render } from '@testing-library/react-native';
import { AdaptiveIcon, AdaptiveIconButton } from '../AdaptiveIcon';

// Mock useGlassTheme
jest.mock('../useGlassTheme', () => ({
  useGlassTheme: () => ({
    isDark: true,
    colors: {
      icon: {
        primary: '#ffffff',
        secondary: '#cccccc',
        tertiary: '#999999',
        accent: '#007AFF',
      },
    },
  }),
}));

describe('AdaptiveIcon', () => {
  it('renders without crashing', () => {
    expect(() => render(<AdaptiveIcon name="home" />)).not.toThrow();
  });

  it('renders with default size', () => {
    const { UNSAFE_getByType } = render(<AdaptiveIcon name="heart" />);
    const icon = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
    expect(icon.props.size).toBe(24);
  });

  it('renders with custom size', () => {
    const { UNSAFE_getByType } = render(<AdaptiveIcon name="heart" size={32} />);
    const icon = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
    expect(icon.props.size).toBe(32);
  });

  it('applies primary color by default', () => {
    const { UNSAFE_getByType } = render(<AdaptiveIcon name="star" />);
    const icon = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
    expect(icon.props.color).toBe('#ffffff');
  });

  it('applies secondary color', () => {
    const { UNSAFE_getByType } = render(<AdaptiveIcon name="star" color="secondary" />);
    const icon = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
    expect(icon.props.color).toBe('#cccccc');
  });

  it('applies tertiary color', () => {
    const { UNSAFE_getByType } = render(<AdaptiveIcon name="star" color="tertiary" />);
    const icon = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
    expect(icon.props.color).toBe('#999999');
  });

  it('applies accent color', () => {
    const { UNSAFE_getByType } = render(<AdaptiveIcon name="star" color="accent" />);
    const icon = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
    expect(icon.props.color).toBe('#007AFF');
  });

  it('applies custom color override', () => {
    const { UNSAFE_getByType } = render(<AdaptiveIcon name="star" customColor="#FF0000" />);
    const icon = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
    expect(icon.props.color).toBe('#FF0000');
  });

  it('applies glassShadow', () => {
    const { root } = render(<AdaptiveIcon name="settings" glassShadow />);
    expect(root).toBeTruthy();
  });

  it('applies custom style', () => {
    const { root } = render(
      <AdaptiveIcon name="person" style={{ marginTop: 10 }} />
    );
    expect(root).toBeTruthy();
  });

  it('sets accessibility label', () => {
    const { getByLabelText } = render(
      <AdaptiveIcon name="search" accessibilityLabel="Search Icon" />
    );
    expect(getByLabelText('Search Icon')).toBeTruthy();
  });

  it('renders different icon names', () => {
    const icons = ['home', 'settings', 'person', 'search', 'add'];
    icons.forEach((iconName: any) => {
      const { UNSAFE_getByType } = render(<AdaptiveIcon name={iconName} />);
      const icon = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
      expect(icon.props.name).toBe(iconName);
    });
  });
});

describe('AdaptiveIconButton', () => {
  it('renders without crashing', () => {
    expect(() => render(<AdaptiveIconButton name="home" />)).not.toThrow();
  });

  it('renders with default button size', () => {
    const { root } = render(<AdaptiveIconButton name="add" />);
    expect(root).toBeTruthy();
  });

  it('renders with custom button size', () => {
    const { root } = render(<AdaptiveIconButton name="add" buttonSize={50} />);
    expect(root).toBeTruthy();
  });

  it('shows background by default', () => {
    const { root } = render(<AdaptiveIconButton name="close" />);
    expect(root).toBeTruthy();
  });

  it('hides background when showBackground is false', () => {
    const { root } = render(<AdaptiveIconButton name="close" showBackground={false} />);
    expect(root).toBeTruthy();
  });

  it('applies custom backgroundOpacity', () => {
    const { root } = render(
      <AdaptiveIconButton name="menu" backgroundOpacity={0.2} />
    );
    expect(root).toBeTruthy();
  });

  it('applies glassShadow', () => {
    const { root } = render(<AdaptiveIconButton name="notifications" glassShadow />);
    expect(root).toBeTruthy();
  });

  it('applies custom style', () => {
    const { root } = render(
      <AdaptiveIconButton name="bookmark" style={{ marginLeft: 5 }} />
    );
    expect(root).toBeTruthy();
  });
});
