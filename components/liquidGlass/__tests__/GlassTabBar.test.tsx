import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GlassTabBar, GlassTabItem } from '../GlassTabBar';

// Mock dependencies
jest.mock('../useGlassTheme', () => ({
  useGlassTheme: () => ({
    isDark: true,
    colors: {
      semantic: {
        error: '#FF3B30',
      },
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

jest.mock('../AdaptiveIcon', () => ({
  AdaptiveIcon: ({ name, ...props }: any) => {
    const { View } = require('react-native');
    return <View testID={`icon-${name}`} {...props} />;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('GlassTabBar', () => {
  const mockTabs: GlassTabItem[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'search', label: 'Search', icon: 'search' },
    { key: 'profile', label: 'Profile', icon: 'person' },
  ];

  const mockOnTabPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <GlassTabBar
          tabs={mockTabs}
          activeTab="home"
          onTabPress={mockOnTabPress}
        />
      )
    ).not.toThrow();
  });

  it('renders all tabs', () => {
    const { getByText } = render(
      <GlassTabBar
        tabs={mockTabs}
        activeTab="home"
        onTabPress={mockOnTabPress}
      />
    );
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Search')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('renders tab icons', () => {
    const { getByTestId } = render(
      <GlassTabBar
        tabs={mockTabs}
        activeTab="home"
        onTabPress={mockOnTabPress}
      />
    );
    expect(getByTestId('icon-home')).toBeTruthy();
    expect(getByTestId('icon-search')).toBeTruthy();
    expect(getByTestId('icon-person')).toBeTruthy();
  });

  it('calls onTabPress when tab is pressed', () => {
    const { getByText } = render(
      <GlassTabBar
        tabs={mockTabs}
        activeTab="home"
        onTabPress={mockOnTabPress}
      />
    );
    fireEvent.press(getByText('Search'));
    expect(mockOnTabPress).toHaveBeenCalledWith('search');
  });

  it('hides labels when showLabels is false', () => {
    const { queryByText } = render(
      <GlassTabBar
        tabs={mockTabs}
        activeTab="home"
        onTabPress={mockOnTabPress}
        showLabels={false}
      />
    );
    expect(queryByText('Home')).toBeNull();
    expect(queryByText('Search')).toBeNull();
  });

  it('renders active icon when provided', () => {
    const tabsWithActiveIcon: GlassTabItem[] = [
      { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    ];
    const { getByTestId } = render(
      <GlassTabBar
        tabs={tabsWithActiveIcon}
        activeTab="home"
        onTabPress={mockOnTabPress}
      />
    );
    expect(getByTestId('icon-home')).toBeTruthy();
  });

  it('renders badge when provided', () => {
    const tabsWithBadge: GlassTabItem[] = [
      { key: 'home', label: 'Home', icon: 'home', badge: 5 },
    ];
    const { getByText } = render(
      <GlassTabBar
        tabs={tabsWithBadge}
        activeTab="home"
        onTabPress={mockOnTabPress}
      />
    );
    expect(getByText('5')).toBeTruthy();
  });

  it('renders 99+ for badges over 99', () => {
    const tabsWithBadge: GlassTabItem[] = [
      { key: 'home', label: 'Home', icon: 'home', badge: 150 },
    ];
    const { getByText } = render(
      <GlassTabBar
        tabs={tabsWithBadge}
        activeTab="home"
        onTabPress={mockOnTabPress}
      />
    );
    expect(getByText('99+')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByText } = render(
      <GlassTabBar
        tabs={mockTabs}
        activeTab="home"
        onTabPress={mockOnTabPress}
        style={{ backgroundColor: 'red' }}
      />
    );
    expect(getByText('Home')).toBeTruthy();
  });
});
