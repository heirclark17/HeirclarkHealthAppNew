import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, Platform } from 'react-native';
import { MidnightGoldGlassCard } from '../MidnightGoldGlassCard';

describe('MidnightGoldGlassCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <MidnightGoldGlassCard>
          <Text>Content</Text>
        </MidnightGoldGlassCard>
      )
    ).not.toThrow();
  });

  it('renders children content', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard>
        <Text>Gold Card Content</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('Gold Card Content')).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard>
        <Text>First</Text>
        <Text>Second</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('renders with default props', () => {
    const { root } = render(
      <MidnightGoldGlassCard>
        <Text>Default</Text>
      </MidnightGoldGlassCard>
    );
    expect(root).toBeTruthy();
  });

  it('renders with custom intensity', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard intensity={50}>
        <Text>Custom Intensity</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('Custom Intensity')).toBeTruthy();
  });

  it('renders with interactive mode', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard interactive>
        <Text>Interactive</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('Interactive')).toBeTruthy();
  });

  it('renders with selected state', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard selected>
        <Text>Selected</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('Selected')).toBeTruthy();
  });

  it('renders with glow effect', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard glowEffect>
        <Text>Glow</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('Glow')).toBeTruthy();
  });

  it('renders with custom style', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard style={{ padding: 20 }}>
        <Text>Styled</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('Styled')).toBeTruthy();
  });

  it('renders with layout styles passed through', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text>Layout</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('Layout')).toBeTruthy();
  });

  it('renders without children', () => {
    expect(() =>
      render(<MidnightGoldGlassCard />)
    ).not.toThrow();
  });

  it('renders with all props combined', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard
        intensity={60}
        interactive
        selected
        glowEffect
        style={{ margin: 10 }}
      >
        <Text>All Props</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('All Props')).toBeTruthy();
  });

  it('renders on non-iOS platform (fallback)', () => {
    // The test environment typically defaults to a non-iOS platform
    const { getByText } = render(
      <MidnightGoldGlassCard>
        <Text>Fallback Render</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('Fallback Render')).toBeTruthy();
  });

  it('handles selected false explicitly', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard selected={false}>
        <Text>Not Selected</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('Not Selected')).toBeTruthy();
  });

  it('handles interactive false explicitly', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard interactive={false}>
        <Text>Not Interactive</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('Not Interactive')).toBeTruthy();
  });

  it('handles glowEffect false explicitly', () => {
    const { getByText } = render(
      <MidnightGoldGlassCard glowEffect={false}>
        <Text>No Glow</Text>
      </MidnightGoldGlassCard>
    );
    expect(getByText('No Glow')).toBeTruthy();
  });
});
