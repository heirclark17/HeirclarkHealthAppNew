import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card, CardHeader } from '../Card';

// Mock haptics
jest.mock('../../utils/haptics', () => ({
  lightImpact: jest.fn().mockResolvedValue(undefined),
}));

describe('Card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <Card>
          <Text>Content</Text>
        </Card>
      )
    ).not.toThrow();
  });

  it('renders children content', () => {
    const { getByText } = render(
      <Card>
        <Text>Test Content</Text>
      </Card>
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('renders title when provided', () => {
    const { getByText } = render(
      <Card title="DAILY BALANCE">
        <Text>Content</Text>
      </Card>
    );
    expect(getByText('DAILY BALANCE')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <Card title="DAILY BALANCE" subtitle="Your calorie summary">
        <Text>Content</Text>
      </Card>
    );
    expect(getByText('Your calorie summary')).toBeTruthy();
  });

  it('does not render title when not provided', () => {
    const { queryByText } = render(
      <Card>
        <Text>Content Only</Text>
      </Card>
    );
    expect(queryByText('Content Only')).toBeTruthy();
  });

  it('renders as pressable when onPress is provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Card onPress={onPressMock}>
        <Text>Pressable Card</Text>
      </Card>
    );
    fireEvent.press(getByText('Pressable Card'));
    expect(onPressMock).toHaveBeenCalled();
  });

  it('renders as non-pressable view when onPress is not provided', () => {
    const { getByText } = render(
      <Card>
        <Text>Static Card</Text>
      </Card>
    );
    expect(getByText('Static Card')).toBeTruthy();
  });

  it('applies fullWidth style when specified', () => {
    const { root } = render(
      <Card fullWidth>
        <Text>Full Width</Text>
      </Card>
    );
    expect(root).toBeTruthy();
  });

  it('applies noPadding style when specified', () => {
    const { root } = render(
      <Card noPadding>
        <Text>No Padding</Text>
      </Card>
    );
    expect(root).toBeTruthy();
  });

  it('applies custom style', () => {
    const { root } = render(
      <Card style={{ backgroundColor: 'red' }}>
        <Text>Custom Style</Text>
      </Card>
    );
    expect(root).toBeTruthy();
  });

  it('sets accessibility label from title', () => {
    const onPressMock = jest.fn();
    const { getByLabelText } = render(
      <Card title="MY CARD" onPress={onPressMock}>
        <Text>Content</Text>
      </Card>
    );
    expect(getByLabelText('MY CARD')).toBeTruthy();
  });

  it('sets custom accessibility label', () => {
    const onPressMock = jest.fn();
    const { getByLabelText } = render(
      <Card accessibilityLabel="Custom label" onPress={onPressMock}>
        <Text>Content</Text>
      </Card>
    );
    expect(getByLabelText('Custom label')).toBeTruthy();
  });

  it('renders with elevated variant', () => {
    const { root } = render(
      <Card variant="elevated">
        <Text>Elevated</Text>
      </Card>
    );
    expect(root).toBeTruthy();
  });

  it('renders with subtle variant', () => {
    const { root } = render(
      <Card variant="subtle">
        <Text>Subtle</Text>
      </Card>
    );
    expect(root).toBeTruthy();
  });

  it('renders with prominent variant', () => {
    const { root } = render(
      <Card variant="prominent">
        <Text>Prominent</Text>
      </Card>
    );
    expect(root).toBeTruthy();
  });

  it('renders with default variant', () => {
    const { root } = render(
      <Card variant="default">
        <Text>Default</Text>
      </Card>
    );
    expect(root).toBeTruthy();
  });

  it('renders without blur when useBlur is false', () => {
    const { getByText } = render(
      <Card useBlur={false}>
        <Text>No Blur</Text>
      </Card>
    );
    expect(getByText('No Blur')).toBeTruthy();
  });

  it('renders with blur by default', () => {
    const { getByText } = render(
      <Card>
        <Text>With Blur</Text>
      </Card>
    );
    expect(getByText('With Blur')).toBeTruthy();
  });

  it('disables animation when disableAnimation is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Card onPress={onPressMock} disableAnimation>
        <Text>No Animation</Text>
      </Card>
    );
    fireEvent.press(getByText('No Animation'));
    expect(onPressMock).toHaveBeenCalled();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <Card>
        <Text>First</Text>
        <Text>Second</Text>
      </Card>
    );
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('renders with all props combined', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Card
        title="TEST"
        subtitle="Test subtitle"
        onPress={onPressMock}
        variant="elevated"
        useBlur={true}
        fullWidth
        accessibilityLabel="Test card"
        accessibilityHint="Tap to interact"
      >
        <Text>Full Props</Text>
      </Card>
    );
    expect(getByText('TEST')).toBeTruthy();
    expect(getByText('Test subtitle')).toBeTruthy();
    expect(getByText('Full Props')).toBeTruthy();
  });
});

describe('CardHeader', () => {
  it('renders without crashing', () => {
    expect(() => render(<CardHeader title="Header" />)).not.toThrow();
  });

  it('displays title', () => {
    const { getByText } = render(<CardHeader title="MY HEADER" />);
    expect(getByText('MY HEADER')).toBeTruthy();
  });

  it('displays subtitle when provided', () => {
    const { getByText } = render(
      <CardHeader title="Header" subtitle="Subtitle text" />
    );
    expect(getByText('Subtitle text')).toBeTruthy();
  });

  it('does not display subtitle when not provided', () => {
    const { queryByText } = render(<CardHeader title="Header" />);
    expect(queryByText('Header')).toBeTruthy();
  });

  it('renders action component when provided', () => {
    const { getByText } = render(
      <CardHeader title="Header" action={<Text>Action</Text>} />
    );
    expect(getByText('Action')).toBeTruthy();
  });

  it('renders with title and action together', () => {
    const { getByText } = render(
      <CardHeader
        title="Header"
        subtitle="Sub"
        action={<Text>Button</Text>}
      />
    );
    expect(getByText('Header')).toBeTruthy();
    expect(getByText('Sub')).toBeTruthy();
    expect(getByText('Button')).toBeTruthy();
  });
});
