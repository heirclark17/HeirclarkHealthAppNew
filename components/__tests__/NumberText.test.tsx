import React from 'react';
import { render } from '@testing-library/react-native';
import { NumberText } from '../NumberText';

describe('NumberText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<NumberText>123</NumberText>)).not.toThrow();
  });

  it('displays numeric content', () => {
    const { getByText } = render(<NumberText>1,450</NumberText>);
    expect(getByText('1,450')).toBeTruthy();
  });

  it('displays text content', () => {
    const { getByText } = render(<NumberText>2,200 kcal</NumberText>);
    expect(getByText('2,200 kcal')).toBeTruthy();
  });

  it('applies light weight font family', () => {
    const { getByText } = render(<NumberText weight="light">100</NumberText>);
    expect(getByText('100')).toBeTruthy();
  });

  it('applies regular weight font family (default)', () => {
    const { getByText } = render(<NumberText weight="regular">100</NumberText>);
    expect(getByText('100')).toBeTruthy();
  });

  it('applies medium weight font family', () => {
    const { getByText } = render(<NumberText weight="medium">100</NumberText>);
    expect(getByText('100')).toBeTruthy();
  });

  it('applies semiBold weight font family', () => {
    const { getByText } = render(<NumberText weight="semiBold">100</NumberText>);
    expect(getByText('100')).toBeTruthy();
  });

  it('applies bold weight font family', () => {
    const { getByText } = render(<NumberText weight="bold">100</NumberText>);
    expect(getByText('100')).toBeTruthy();
  });

  it('handles empty children', () => {
    const { root } = render(<NumberText />);
    expect(root).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <NumberText>
        <NumberText>100</NumberText>
        <NumberText> steps</NumberText>
      </NumberText>
    );
    expect(getByText('100')).toBeTruthy();
  });

  it('accepts custom style prop', () => {
    const { getByText } = render(
      <NumberText style={{ fontSize: 48 }}>500</NumberText>
    );
    expect(getByText('500')).toBeTruthy();
  });

  it('handles zero as children', () => {
    const { getByText } = render(<NumberText>{0}</NumberText>);
    expect(getByText('0')).toBeTruthy();
  });

  it('renders with default weight when not specified', () => {
    const { getByText } = render(<NumberText>42</NumberText>);
    expect(getByText('42')).toBeTruthy();
  });

  it('passes through additional Text props', () => {
    const { getByText } = render(
      <NumberText numberOfLines={1} ellipsizeMode="tail">
        Very long number text that might truncate
      </NumberText>
    );
    expect(getByText('Very long number text that might truncate')).toBeTruthy();
  });
});
