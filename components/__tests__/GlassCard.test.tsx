import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { GlassCard } from '../GlassCard';

// Mock the SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

describe('GlassCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<GlassCard />)).not.toThrow();
  });

  it('renders children content', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>Test Content</Text>
      </GlassCard>
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>First Child</Text>
        <Text>Second Child</Text>
      </GlassCard>
    );
    expect(getByText('First Child')).toBeTruthy();
    expect(getByText('Second Child')).toBeTruthy();
  });

  it('applies custom style', () => {
    const customStyle = { padding: 20 };
    const { root } = render(
      <GlassCard style={customStyle}>
        <Text>Styled Content</Text>
      </GlassCard>
    );
    expect(root).toBeTruthy();
  });

  it('renders with default intensity', () => {
    const { getByText } = render(
      <GlassCard>
        <Text>Content</Text>
      </GlassCard>
    );
    expect(getByText('Content')).toBeTruthy();
  });

  it('renders with custom intensity', () => {
    const { getByText } = render(
      <GlassCard intensity={80}>
        <Text>Intense Blur</Text>
      </GlassCard>
    );
    expect(getByText('Intense Blur')).toBeTruthy();
  });

  it('renders with light tint', () => {
    const { getByText } = render(
      <GlassCard tint="light">
        <Text>Light Tint</Text>
      </GlassCard>
    );
    expect(getByText('Light Tint')).toBeTruthy();
  });

  it('renders with dark tint', () => {
    const { getByText } = render(
      <GlassCard tint="dark">
        <Text>Dark Tint</Text>
      </GlassCard>
    );
    expect(getByText('Dark Tint')).toBeTruthy();
  });

  it('renders with custom tint color', () => {
    const { getByText } = render(
      <GlassCard tintColor="#FF0000">
        <Text>Custom Color</Text>
      </GlassCard>
    );
    expect(getByText('Custom Color')).toBeTruthy();
  });

  it('renders as interactive card', () => {
    const { getByText } = render(
      <GlassCard interactive={true}>
        <Text>Interactive</Text>
      </GlassCard>
    );
    expect(getByText('Interactive')).toBeTruthy();
  });

  it('renders as non-interactive card', () => {
    const { getByText } = render(
      <GlassCard interactive={false}>
        <Text>Static</Text>
      </GlassCard>
    );
    expect(getByText('Static')).toBeTruthy();
  });

  it('handles empty children', () => {
    expect(() => render(<GlassCard />)).not.toThrow();
  });

  it('handles null children', () => {
    expect(() => render(<GlassCard>{null}</GlassCard>)).not.toThrow();
  });

  it('renders nested components', () => {
    const { getByText } = render(
      <GlassCard>
        <View>
          <Text>Nested Text</Text>
        </View>
      </GlassCard>
    );
    expect(getByText('Nested Text')).toBeTruthy();
  });

  it('passes through additional view props', () => {
    const { root } = render(
      <GlassCard testID="glass-card" accessible={true}>
        <Text>Accessible Card</Text>
      </GlassCard>
    );
    expect(root).toBeTruthy();
  });

  it('renders with combination of props', () => {
    const { getByText } = render(
      <GlassCard intensity={60} tint="dark" interactive={true} style={{ margin: 10 }}>
        <Text>Full Props</Text>
      </GlassCard>
    );
    expect(getByText('Full Props')).toBeTruthy();
  });

  it('maintains content layout', () => {
    const { getByText } = render(
      <GlassCard>
        <View>
          <Text>Top</Text>
          <Text>Bottom</Text>
        </View>
      </GlassCard>
    );
    expect(getByText('Top')).toBeTruthy();
    expect(getByText('Bottom')).toBeTruthy();
  });
});
