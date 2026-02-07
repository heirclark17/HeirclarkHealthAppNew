import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GlassNavBar } from '../GlassNavBar';

// Mock dependencies
jest.mock('../useGlassTheme', () => ({
  useGlassTheme: () => ({
    isDark: true,
    colors: {
      text: { primary: '#fff' },
    },
    getGlassBackground: jest.fn(() => 'rgba(255, 255, 255, 0.1)'),
  }),
}));

jest.mock('../AdaptiveText', () => ({
  AdaptiveText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock('../GlassButton', () => ({
  GlassButton: ({ icon, title, onPress, ...props }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={`button-${icon || title}`} {...props}>
        <Text>{icon || title}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 0, left: 0, right: 0 }),
}));

describe('GlassNavBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<GlassNavBar />)).not.toThrow();
  });

  it('renders with title', () => {
    const { getByText } = render(<GlassNavBar title="Home" />);
    expect(getByText('Home')).toBeTruthy();
  });

  it('renders with large title', () => {
    const { getByText } = render(
      <GlassNavBar variant="large" largeTitle="Settings" />
    );
    expect(getByText('Settings')).toBeTruthy();
  });

  it('renders left button', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <GlassNavBar leftIcon="arrow-back" onLeftPress={onPress} />
    );
    expect(getByTestId('button-arrow-back')).toBeTruthy();
  });

  it('calls onLeftPress when left button is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <GlassNavBar leftIcon="arrow-back" onLeftPress={onPress} />
    );
    fireEvent.press(getByTestId('button-arrow-back'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders right button', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <GlassNavBar rightIcon="settings" onRightPress={onPress} />
    );
    expect(getByTestId('button-settings')).toBeTruthy();
  });

  it('calls onRightPress when right button is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <GlassNavBar rightIcon="settings" onRightPress={onPress} />
    );
    fireEvent.press(getByTestId('button-settings'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders secondary right button', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <GlassNavBar secondaryRightIcon="add" onSecondaryRightPress={onPress} />
    );
    expect(getByTestId('button-add')).toBeTruthy();
  });

  it('renders left button with label', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <GlassNavBar leftLabel="Back" onLeftPress={onPress} />
    );
    expect(getByTestId('button-Back')).toBeTruthy();
  });

  it('renders right button with label', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <GlassNavBar rightLabel="Done" onRightPress={onPress} />
    );
    expect(getByTestId('button-Done')).toBeTruthy();
  });

  it('renders default variant', () => {
    const { getByText } = render(
      <GlassNavBar title="Default" variant="default" />
    );
    expect(getByText('Default')).toBeTruthy();
  });

  it('renders transparent variant', () => {
    const { getByText } = render(
      <GlassNavBar title="Transparent" variant="transparent" />
    );
    expect(getByText('Transparent')).toBeTruthy();
  });

  it('renders custom center content', () => {
    const { Text } = require('react-native');
    const { getByText } = render(
      <GlassNavBar centerContent={<Text>Custom Center</Text>} />
    );
    expect(getByText('Custom Center')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByText } = render(
      <GlassNavBar title="Styled" style={{ backgroundColor: 'red' }} />
    );
    expect(getByText('Styled')).toBeTruthy();
  });
});
