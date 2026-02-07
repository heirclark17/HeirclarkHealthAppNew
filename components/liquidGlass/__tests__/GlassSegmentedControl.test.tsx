import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GlassSegmentedControl, SegmentItem } from '../GlassSegmentedControl';

// Mock dependencies
jest.mock('../useGlassTheme', () => ({
  useGlassTheme: () => ({
    isDark: true,
    colors: {
      text: {
        primary: '#fff',
        secondary: '#ccc',
        muted: '#999',
      },
      icon: {
        primary: '#fff',
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
  },
}));

describe('GlassSegmentedControl', () => {
  const mockSegments: SegmentItem[] = [
    { key: 'tab1', label: 'Tab 1' },
    { key: 'tab2', label: 'Tab 2' },
    { key: 'tab3', label: 'Tab 3' },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <GlassSegmentedControl
          segments={mockSegments}
          selectedKey="tab1"
          onChange={mockOnChange}
        />
      )
    ).not.toThrow();
  });

  it('renders all segments', () => {
    const { getByText } = render(
      <GlassSegmentedControl
        segments={mockSegments}
        selectedKey="tab1"
        onChange={mockOnChange}
      />
    );
    expect(getByText('Tab 1')).toBeTruthy();
    expect(getByText('Tab 2')).toBeTruthy();
    expect(getByText('Tab 3')).toBeTruthy();
  });

  it('calls onChange when segment is pressed', () => {
    const { getByText } = render(
      <GlassSegmentedControl
        segments={mockSegments}
        selectedKey="tab1"
        onChange={mockOnChange}
      />
    );
    fireEvent.press(getByText('Tab 2'));
    expect(mockOnChange).toHaveBeenCalledWith('tab2');
  });

  it('does not call onChange when disabled', () => {
    const { getByText } = render(
      <GlassSegmentedControl
        segments={mockSegments}
        selectedKey="tab1"
        onChange={mockOnChange}
        disabled
      />
    );
    fireEvent.press(getByText('Tab 2'));
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('renders segments with icons', () => {
    const segmentsWithIcons: SegmentItem[] = [
      { key: 'home', label: 'Home', icon: 'home' },
      { key: 'search', label: 'Search', icon: 'search' },
    ];
    const { getByTestId } = render(
      <GlassSegmentedControl
        segments={segmentsWithIcons}
        selectedKey="home"
        onChange={mockOnChange}
      />
    );
    expect(getByTestId('icon-home')).toBeTruthy();
    expect(getByTestId('icon-search')).toBeTruthy();
  });

  it('disables individual segment when marked disabled', () => {
    const segmentsWithDisabled: SegmentItem[] = [
      { key: 'tab1', label: 'Tab 1' },
      { key: 'tab2', label: 'Tab 2', disabled: true },
    ];
    const { getByText } = render(
      <GlassSegmentedControl
        segments={segmentsWithDisabled}
        selectedKey="tab1"
        onChange={mockOnChange}
      />
    );
    fireEvent.press(getByText('Tab 2'));
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('applies small size', () => {
    const { getByText } = render(
      <GlassSegmentedControl
        segments={mockSegments}
        selectedKey="tab1"
        onChange={mockOnChange}
        size="small"
      />
    );
    expect(getByText('Tab 1')).toBeTruthy();
  });

  it('applies medium size', () => {
    const { getByText } = render(
      <GlassSegmentedControl
        segments={mockSegments}
        selectedKey="tab1"
        onChange={mockOnChange}
        size="medium"
      />
    );
    expect(getByText('Tab 1')).toBeTruthy();
  });

  it('applies large size', () => {
    const { getByText } = render(
      <GlassSegmentedControl
        segments={mockSegments}
        selectedKey="tab1"
        onChange={mockOnChange}
        size="large"
      />
    );
    expect(getByText('Tab 1')).toBeTruthy();
  });

  it('applies fullWidth prop', () => {
    const { getByText } = render(
      <GlassSegmentedControl
        segments={mockSegments}
        selectedKey="tab1"
        onChange={mockOnChange}
        fullWidth
      />
    );
    expect(getByText('Tab 1')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByText } = render(
      <GlassSegmentedControl
        segments={mockSegments}
        selectedKey="tab1"
        onChange={mockOnChange}
        style={{ marginTop: 20 }}
      />
    );
    expect(getByText('Tab 1')).toBeTruthy();
  });
});
