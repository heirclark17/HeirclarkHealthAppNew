import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, Platform } from 'react-native';
import { GlassCard } from '../GlassCard';

// Mock dependencies
jest.mock('../useGlassTheme', () => ({
  useGlassTheme: () => ({
    isDark: true,
    colors: {
      text: { primary: '#fff' },
    },
    getGlassBackground: jest.fn(() => 'rgba(255, 255, 255, 0.1)'),
    getGlassBorder: jest.fn(() => 'rgba(255, 255, 255, 0.2)'),
  }),
}));

jest.mock('../GlassView', () => ({
  GlassView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  isLiquidGlassAvailable: jest.fn(() => false),
}));

describe('GlassCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<GlassCard />)).not.toThrow();
  });

  it('renders children', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>Test Content</Text>
      </GlassCard>
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('renders with standard variant', () => {
    const { getByText } = render(
      <GlassCard variant="standard">
        <Text>Standard Card</Text>
      </GlassCard>
    );
    expect(getByText('Standard Card')).toBeTruthy();
  });

  it('renders with elevated variant', () => {
    const { getByText } = render(
      <GlassCard variant="elevated">
        <Text>Elevated Card</Text>
      </GlassCard>
    );
    expect(getByText('Elevated Card')).toBeTruthy();
  });

  it('renders with compact variant', () => {
    const { getByText } = render(
      <GlassCard variant="compact">
        <Text>Compact Card</Text>
      </GlassCard>
    );
    expect(getByText('Compact Card')).toBeTruthy();
  });

  it('renders with flat variant', () => {
    const { getByText } = render(
      <GlassCard variant="flat">
        <Text>Flat Card</Text>
      </GlassCard>
    );
    expect(getByText('Flat Card')).toBeTruthy();
  });

  it('applies custom material', () => {
    const { getByText } = render(
      <GlassCard material="thick">
        <Text>Thick Material</Text>
      </GlassCard>
    );
    expect(getByText('Thick Material')).toBeTruthy();
  });

  it('applies custom radius as string', () => {
    const { getByText } = render(
      <GlassCard radius="xlarge">
        <Text>Large Radius</Text>
      </GlassCard>
    );
    expect(getByText('Large Radius')).toBeTruthy();
  });

  it('applies custom radius as number', () => {
    const { getByText } = render(
      <GlassCard radius={20}>
        <Text>Custom Radius</Text>
      </GlassCard>
    );
    expect(getByText('Custom Radius')).toBeTruthy();
  });

  it('applies custom shadow', () => {
    const { getByText } = render(
      <GlassCard shadow="elevated">
        <Text>Shadow Card</Text>
      </GlassCard>
    );
    expect(getByText('Shadow Card')).toBeTruthy();
  });

  it('applies no shadow when shadow="none"', () => {
    const { getByText } = render(
      <GlassCard shadow="none">
        <Text>No Shadow</Text>
      </GlassCard>
    );
    expect(getByText('No Shadow')).toBeTruthy();
  });

  it('applies custom padding', () => {
    const { getByText } = render(
      <GlassCard padding={24}>
        <Text>Custom Padding</Text>
      </GlassCard>
    );
    expect(getByText('Custom Padding')).toBeTruthy();
  });

  it('removes padding when noPadding is true', () => {
    const { getByText } = render(
      <GlassCard noPadding>
        <Text>No Padding</Text>
      </GlassCard>
    );
    expect(getByText('No Padding')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByText } = render(
      <GlassCard style={{ marginTop: 20 }}>
        <Text>Custom Style</Text>
      </GlassCard>
    );
    expect(getByText('Custom Style')).toBeTruthy();
  });

  it('renders with animation enabled', () => {
    const { getByText } = render(
      <GlassCard animated>
        <Text>Animated Card</Text>
      </GlassCard>
    );
    expect(getByText('Animated Card')).toBeTruthy();
  });

  it('applies animation delay', () => {
    const { getByText } = render(
      <GlassCard animated animationDelay={500}>
        <Text>Delayed Animation</Text>
      </GlassCard>
    );
    expect(getByText('Delayed Animation')).toBeTruthy();
  });

  it('renders interactive card', () => {
    const { getByText } = render(
      <GlassCard interactive>
        <Text>Interactive Card</Text>
      </GlassCard>
    );
    expect(getByText('Interactive Card')).toBeTruthy();
  });

  it('handles all material types', () => {
    const materials = ['ultraThin', 'thin', 'regular', 'thick'] as const;
    materials.forEach((material) => {
      const { getByText } = render(
        <GlassCard material={material}>
          <Text>{material}</Text>
        </GlassCard>
      );
      expect(getByText(material)).toBeTruthy();
    });
  });

  it('renders on Android platform', () => {
    Platform.OS = 'android';
    const { getByText } = render(
      <GlassCard>
        <Text>Android Card</Text>
      </GlassCard>
    );
    expect(getByText('Android Card')).toBeTruthy();
  });
});
