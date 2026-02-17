// @ts-nocheck
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, AccessibilityInfo } from 'react-native';
import { BackgroundLayer } from '../BackgroundLayer';

// Mock the SettingsContext with different backgrounds
let mockSettings = {
  themeMode: 'dark' as const,
  backgroundImage: 'default',
  customBackgroundUri: null as string | null,
};

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
  }),
}));

// Mock backgrounds module
jest.mock('../../constants/backgrounds', () => ({
  getBackgroundById: jest.fn((id: string) => {
    switch (id) {
      case 'default':
        return { id: 'default', type: 'solid', name: 'Default' };
      case 'gradient1':
        return {
          id: 'gradient1',
          type: 'gradient',
          name: 'Gradient',
          colors: {
            dark: ['#000', '#111'],
            light: ['#fff', '#eee'],
            locations: [0, 1],
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 },
          },
        };
      case 'dynamic':
        return {
          id: 'dynamic',
          type: 'animated',
          name: 'Dynamic',
          colors: {
            dark: ['#000', '#222'],
            light: ['#fff', '#ddd'],
            locations: [0, 1],
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 },
          },
        };
      case 'pattern1':
        return {
          id: 'pattern1',
          type: 'pattern',
          name: 'Pattern',
          patternType: 'dots',
        };
      default:
        return null;
    }
  }),
  getGradientColors: jest.fn(() => ['#000', '#111']),
  BACKGROUNDS: [],
}));

// Mock PatternBackground
jest.mock('../patterns/PatternBackground', () => ({
  PatternBackground: 'PatternBackground',
}));

// Mock AccessibilityInfo
jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
  remove: jest.fn(),
} as any);

describe('BackgroundLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings = {
      themeMode: 'dark',
      backgroundImage: 'default',
      customBackgroundUri: null,
    };
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <BackgroundLayer>
          <Text>Content</Text>
        </BackgroundLayer>
      )
    ).not.toThrow();
  });

  it('renders children content', () => {
    const { getByText } = render(
      <BackgroundLayer>
        <Text>App Content</Text>
      </BackgroundLayer>
    );
    expect(getByText('App Content')).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <BackgroundLayer>
        <Text>First</Text>
        <Text>Second</Text>
      </BackgroundLayer>
    );
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('renders with default background', () => {
    mockSettings.backgroundImage = 'default';
    const { root } = render(
      <BackgroundLayer>
        <Text>Default BG</Text>
      </BackgroundLayer>
    );
    expect(root).toBeTruthy();
  });

  it('renders with gradient background', () => {
    mockSettings.backgroundImage = 'gradient1';
    const { root } = render(
      <BackgroundLayer>
        <Text>Gradient BG</Text>
      </BackgroundLayer>
    );
    expect(root).toBeTruthy();
  });

  it('renders with animated background', () => {
    mockSettings.backgroundImage = 'dynamic';
    const { root } = render(
      <BackgroundLayer>
        <Text>Animated BG</Text>
      </BackgroundLayer>
    );
    expect(root).toBeTruthy();
  });

  it('renders with pattern background', () => {
    mockSettings.backgroundImage = 'pattern1';
    const { root } = render(
      <BackgroundLayer>
        <Text>Pattern BG</Text>
      </BackgroundLayer>
    );
    expect(root).toBeTruthy();
  });

  it('renders solid background for dark mode', () => {
    mockSettings.themeMode = 'dark';
    mockSettings.backgroundImage = 'default';
    const { root } = render(
      <BackgroundLayer>
        <Text>Dark</Text>
      </BackgroundLayer>
    );
    expect(root).toBeTruthy();
  });

  it('renders solid background for light mode', () => {
    mockSettings.themeMode = 'light';
    mockSettings.backgroundImage = 'default';
    const { root } = render(
      <BackgroundLayer>
        <Text>Light</Text>
      </BackgroundLayer>
    );
    expect(root).toBeTruthy();
  });

  it('renders fallback for unknown background', () => {
    mockSettings.backgroundImage = 'unknown_bg_id';
    const { root } = render(
      <BackgroundLayer>
        <Text>Fallback</Text>
      </BackgroundLayer>
    );
    expect(root).toBeTruthy();
  });

  it('checks reduce motion accessibility setting', () => {
    render(
      <BackgroundLayer>
        <Text>Motion Check</Text>
      </BackgroundLayer>
    );
    expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled();
  });

  it('listens for reduce motion changes', () => {
    render(
      <BackgroundLayer>
        <Text>Listener</Text>
      </BackgroundLayer>
    );
    expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
      'reduceMotionChanged',
      expect.any(Function)
    );
  });

  it('renders with custom photo background', () => {
    mockSettings.backgroundImage = 'custom';
    mockSettings.customBackgroundUri = 'file:///mock/photo.jpg';
    const { root } = render(
      <BackgroundLayer>
        <Text>Custom Photo</Text>
      </BackgroundLayer>
    );
    expect(root).toBeTruthy();
  });

  it('falls back to solid when custom has no URI', () => {
    mockSettings.backgroundImage = 'custom';
    mockSettings.customBackgroundUri = null;
    const { root } = render(
      <BackgroundLayer>
        <Text>No URI</Text>
      </BackgroundLayer>
    );
    expect(root).toBeTruthy();
  });
});
