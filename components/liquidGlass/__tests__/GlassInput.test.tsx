import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GlassInput } from '../GlassInput';

// Mock dependencies
jest.mock('../useGlassTheme', () => ({
  useGlassTheme: () => ({
    isDark: true,
    colors: {
      text: {
        primary: '#fff',
        muted: '#999',
      },
      semantic: {
        error: '#FF3B30',
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

describe('GlassInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<GlassInput />)).not.toThrow();
  });

  it('renders with label', () => {
    const { getByText } = render(<GlassInput label="Username" />);
    expect(getByText('Username')).toBeTruthy();
  });

  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Enter text" />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('renders with left icon', () => {
    const { getByTestId } = render(
      <GlassInput leftIcon="person" />
    );
    expect(getByTestId('icon-person')).toBeTruthy();
  });

  it('renders with right icon', () => {
    const { getByTestId } = render(
      <GlassInput rightIcon="eye" />
    );
    expect(getByTestId('icon-eye')).toBeTruthy();
  });

  it('calls onRightIconPress when right icon is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <GlassInput rightIcon="eye" onRightIconPress={onPress} />
    );

    fireEvent.press(getByTestId('icon-eye').parent!);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('displays error message', () => {
    const { getByText } = render(
      <GlassInput error="This field is required" />
    );
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('displays helper text', () => {
    const { getByText } = render(
      <GlassInput helperText="Enter at least 8 characters" />
    );
    expect(getByText('Enter at least 8 characters')).toBeTruthy();
  });

  it('prioritizes error over helper text', () => {
    const { getByText, queryByText } = render(
      <GlassInput
        error="Invalid input"
        helperText="This is helper text"
      />
    );
    expect(getByText('Invalid input')).toBeTruthy();
    expect(queryByText('This is helper text')).toBeNull();
  });

  it('handles focus event', () => {
    const onFocus = jest.fn();
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Test" onFocus={onFocus} />
    );

    fireEvent(getByPlaceholderText('Test'), 'focus');
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('handles blur event', () => {
    const onBlur = jest.fn();
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Test" onBlur={onBlur} />
    );

    fireEvent(getByPlaceholderText('Test'), 'blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('handles text change', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Test" onChangeText={onChangeText} />
    );

    fireEvent.changeText(getByPlaceholderText('Test'), 'Hello');
    expect(onChangeText).toHaveBeenCalledWith('Hello');
  });

  it('applies disabled state', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Test" disabled />
    );
    const input = getByPlaceholderText('Test');
    expect(input.props.editable).toBe(false);
  });

  it('applies default variant', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Default" variant="default" />
    );
    expect(getByPlaceholderText('Default')).toBeTruthy();
  });

  it('applies filled variant', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Filled" variant="filled" />
    );
    expect(getByPlaceholderText('Filled')).toBeTruthy();
  });

  it('applies outline variant', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Outline" variant="outline" />
    );
    expect(getByPlaceholderText('Outline')).toBeTruthy();
  });

  it('applies small size', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Small" size="small" />
    );
    expect(getByPlaceholderText('Small')).toBeTruthy();
  });

  it('applies medium size', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Medium" size="medium" />
    );
    expect(getByPlaceholderText('Medium')).toBeTruthy();
  });

  it('applies large size', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Large" size="large" />
    );
    expect(getByPlaceholderText('Large')).toBeTruthy();
  });

  it('applies custom containerStyle', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Test" containerStyle={{ marginTop: 20 }} />
    );
    expect(getByPlaceholderText('Test')).toBeTruthy();
  });

  it('applies custom input style', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Test" style={{ backgroundColor: 'red' }} />
    );
    expect(getByPlaceholderText('Test')).toBeTruthy();
  });

  it('handles secure text entry', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Password" secureTextEntry />
    );
    const input = getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('handles multiline input', () => {
    const { getByPlaceholderText } = render(
      <GlassInput placeholder="Comment" multiline numberOfLines={4} />
    );
    const input = getByPlaceholderText('Comment');
    expect(input.props.multiline).toBe(true);
  });
});
