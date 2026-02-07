import React from 'react';
import { render } from '@testing-library/react-native';
import {
  AdaptiveText,
  LargeTitle,
  Title1,
  Title2,
  Title3,
  Headline,
  Body,
  Callout,
  Subheadline,
  Footnote,
  Caption,
} from '../AdaptiveText';

// Mock useGlassTheme
jest.mock('../useGlassTheme', () => ({
  useGlassTheme: () => ({
    isDark: true,
    colors: {
      text: {
        primary: '#ffffff',
        secondary: '#cccccc',
        tertiary: '#999999',
        muted: '#666666',
        inverse: '#000000',
      },
    },
    textShadow: {
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  }),
}));

describe('AdaptiveText', () => {
  it('renders without crashing', () => {
    expect(() => render(<AdaptiveText>Hello</AdaptiveText>)).not.toThrow();
  });

  it('renders children text', () => {
    const { getByText } = render(<AdaptiveText>Hello World</AdaptiveText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('applies largeTitle variant', () => {
    const { getByText } = render(
      <AdaptiveText variant="largeTitle">Large Title</AdaptiveText>
    );
    expect(getByText('Large Title')).toBeTruthy();
  });

  it('applies title1 variant', () => {
    const { getByText } = render(
      <AdaptiveText variant="title1">Title 1</AdaptiveText>
    );
    expect(getByText('Title 1')).toBeTruthy();
  });

  it('applies title2 variant', () => {
    const { getByText } = render(
      <AdaptiveText variant="title2">Title 2</AdaptiveText>
    );
    expect(getByText('Title 2')).toBeTruthy();
  });

  it('applies title3 variant', () => {
    const { getByText } = render(
      <AdaptiveText variant="title3">Title 3</AdaptiveText>
    );
    expect(getByText('Title 3')).toBeTruthy();
  });

  it('applies headline variant', () => {
    const { getByText } = render(
      <AdaptiveText variant="headline">Headline</AdaptiveText>
    );
    expect(getByText('Headline')).toBeTruthy();
  });

  it('applies body variant by default', () => {
    const { getByText } = render(<AdaptiveText>Body Text</AdaptiveText>);
    expect(getByText('Body Text')).toBeTruthy();
  });

  it('applies callout variant', () => {
    const { getByText } = render(
      <AdaptiveText variant="callout">Callout</AdaptiveText>
    );
    expect(getByText('Callout')).toBeTruthy();
  });

  it('applies subheadline variant', () => {
    const { getByText } = render(
      <AdaptiveText variant="subheadline">Subheadline</AdaptiveText>
    );
    expect(getByText('Subheadline')).toBeTruthy();
  });

  it('applies footnote variant', () => {
    const { getByText } = render(
      <AdaptiveText variant="footnote">Footnote</AdaptiveText>
    );
    expect(getByText('Footnote')).toBeTruthy();
  });

  it('applies caption1 variant', () => {
    const { getByText } = render(
      <AdaptiveText variant="caption1">Caption 1</AdaptiveText>
    );
    expect(getByText('Caption 1')).toBeTruthy();
  });

  it('applies caption2 variant', () => {
    const { getByText } = render(
      <AdaptiveText variant="caption2">Caption 2</AdaptiveText>
    );
    expect(getByText('Caption 2')).toBeTruthy();
  });

  it('applies primary color by default', () => {
    const { getByText } = render(<AdaptiveText>Primary Color</AdaptiveText>);
    expect(getByText('Primary Color')).toBeTruthy();
  });

  it('applies secondary color', () => {
    const { getByText } = render(
      <AdaptiveText color="secondary">Secondary Color</AdaptiveText>
    );
    expect(getByText('Secondary Color')).toBeTruthy();
  });

  it('applies tertiary color', () => {
    const { getByText } = render(
      <AdaptiveText color="tertiary">Tertiary Color</AdaptiveText>
    );
    expect(getByText('Tertiary Color')).toBeTruthy();
  });

  it('applies muted color', () => {
    const { getByText } = render(
      <AdaptiveText color="muted">Muted Color</AdaptiveText>
    );
    expect(getByText('Muted Color')).toBeTruthy();
  });

  it('applies inverse color', () => {
    const { getByText } = render(
      <AdaptiveText color="inverse">Inverse Color</AdaptiveText>
    );
    expect(getByText('Inverse Color')).toBeTruthy();
  });

  it('applies custom color', () => {
    const { getByText } = render(
      <AdaptiveText customColor="#FF0000">Custom Color</AdaptiveText>
    );
    expect(getByText('Custom Color')).toBeTruthy();
  });

  it('applies glassShadow', () => {
    const { getByText } = render(
      <AdaptiveText glassShadow>Shadow Text</AdaptiveText>
    );
    expect(getByText('Shadow Text')).toBeTruthy();
  });

  it('applies weight override', () => {
    const { getByText } = render(
      <AdaptiveText weight="700">Bold Text</AdaptiveText>
    );
    expect(getByText('Bold Text')).toBeTruthy();
  });

  it('applies text align', () => {
    const { getByText } = render(
      <AdaptiveText align="center">Centered Text</AdaptiveText>
    );
    expect(getByText('Centered Text')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByText } = render(
      <AdaptiveText style={{ marginTop: 20 }}>Styled Text</AdaptiveText>
    );
    expect(getByText('Styled Text')).toBeTruthy();
  });

  // Convenience component tests
  it('LargeTitle renders correctly', () => {
    const { getByText } = render(<LargeTitle>Large Title</LargeTitle>);
    expect(getByText('Large Title')).toBeTruthy();
  });

  it('Title1 renders correctly', () => {
    const { getByText } = render(<Title1>Title 1</Title1>);
    expect(getByText('Title 1')).toBeTruthy();
  });

  it('Title2 renders correctly', () => {
    const { getByText } = render(<Title2>Title 2</Title2>);
    expect(getByText('Title 2')).toBeTruthy();
  });

  it('Title3 renders correctly', () => {
    const { getByText } = render(<Title3>Title 3</Title3>);
    expect(getByText('Title 3')).toBeTruthy();
  });

  it('Headline renders correctly', () => {
    const { getByText } = render(<Headline>Headline</Headline>);
    expect(getByText('Headline')).toBeTruthy();
  });

  it('Body renders correctly', () => {
    const { getByText } = render(<Body>Body Text</Body>);
    expect(getByText('Body Text')).toBeTruthy();
  });

  it('Callout renders correctly', () => {
    const { getByText } = render(<Callout>Callout</Callout>);
    expect(getByText('Callout')).toBeTruthy();
  });

  it('Subheadline renders correctly', () => {
    const { getByText } = render(<Subheadline>Subheadline</Subheadline>);
    expect(getByText('Subheadline')).toBeTruthy();
  });

  it('Footnote renders correctly', () => {
    const { getByText } = render(<Footnote>Footnote</Footnote>);
    expect(getByText('Footnote')).toBeTruthy();
  });

  it('Caption renders correctly', () => {
    const { getByText } = render(<Caption>Caption</Caption>);
    expect(getByText('Caption')).toBeTruthy();
  });
});
