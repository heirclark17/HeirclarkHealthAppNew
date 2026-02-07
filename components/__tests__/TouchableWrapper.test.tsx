import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TouchableWrapper } from '../TouchableWrapper';

// Mock haptics
jest.mock('../../utils/haptics', () => ({
  lightImpact: jest.fn().mockResolvedValue(undefined),
  mediumImpact: jest.fn().mockResolvedValue(undefined),
  heavyImpact: jest.fn().mockResolvedValue(undefined),
  selectionFeedback: jest.fn().mockResolvedValue(undefined),
}));

describe('TouchableWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(
        <TouchableWrapper>
          <Text>Button</Text>
        </TouchableWrapper>
      )
    ).not.toThrow();
  });

  it('renders children content', () => {
    const { getByText } = render(
      <TouchableWrapper>
        <Text>Press Me</Text>
      </TouchableWrapper>
    );
    expect(getByText('Press Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <TouchableWrapper onPress={onPressMock}>
        <Text>Tap</Text>
      </TouchableWrapper>
    );
    fireEvent.press(getByText('Tap'));
    expect(onPressMock).toHaveBeenCalled();
  });

  it('triggers light haptic by default', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <TouchableWrapper onPress={onPressMock}>
        <Text>Light</Text>
      </TouchableWrapper>
    );
    fireEvent.press(getByText('Light'));
    const { lightImpact } = require('../../utils/haptics');
    expect(lightImpact).toHaveBeenCalled();
  });

  it('triggers medium haptic when specified', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <TouchableWrapper onPress={onPressMock} haptic="medium">
        <Text>Medium</Text>
      </TouchableWrapper>
    );
    fireEvent.press(getByText('Medium'));
    const { mediumImpact } = require('../../utils/haptics');
    expect(mediumImpact).toHaveBeenCalled();
  });

  it('triggers heavy haptic when specified', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <TouchableWrapper onPress={onPressMock} haptic="heavy">
        <Text>Heavy</Text>
      </TouchableWrapper>
    );
    fireEvent.press(getByText('Heavy'));
    const { heavyImpact } = require('../../utils/haptics');
    expect(heavyImpact).toHaveBeenCalled();
  });

  it('triggers selection haptic when specified', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <TouchableWrapper onPress={onPressMock} haptic="selection">
        <Text>Selection</Text>
      </TouchableWrapper>
    );
    fireEvent.press(getByText('Selection'));
    const { selectionFeedback } = require('../../utils/haptics');
    expect(selectionFeedback).toHaveBeenCalled();
  });

  it('does not trigger haptic when haptic is none', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <TouchableWrapper onPress={onPressMock} haptic="none">
        <Text>No Haptic</Text>
      </TouchableWrapper>
    );
    fireEvent.press(getByText('No Haptic'));
    const { lightImpact, mediumImpact, heavyImpact, selectionFeedback } =
      require('../../utils/haptics');
    expect(lightImpact).not.toHaveBeenCalled();
    expect(mediumImpact).not.toHaveBeenCalled();
    expect(heavyImpact).not.toHaveBeenCalled();
    expect(selectionFeedback).not.toHaveBeenCalled();
  });

  it('sets accessibility label', () => {
    const { getByLabelText } = render(
      <TouchableWrapper accessibilityLabel="Close button">
        <Text>X</Text>
      </TouchableWrapper>
    );
    expect(getByLabelText('Close button')).toBeTruthy();
  });

  it('sets accessibility hint', () => {
    const { root } = render(
      <TouchableWrapper
        accessibilityLabel="Save"
        accessibilityHint="Saves your changes"
      >
        <Text>Save</Text>
      </TouchableWrapper>
    );
    expect(root).toBeTruthy();
  });

  it('defaults to button accessibility role', () => {
    const { root } = render(
      <TouchableWrapper>
        <Text>Button</Text>
      </TouchableWrapper>
    );
    expect(root).toBeTruthy();
  });

  it('accepts custom accessibility role', () => {
    const { root } = render(
      <TouchableWrapper accessibilityRole="link">
        <Text>Link</Text>
      </TouchableWrapper>
    );
    expect(root).toBeTruthy();
  });

  it('applies custom style', () => {
    const { root } = render(
      <TouchableWrapper style={{ backgroundColor: 'blue' }}>
        <Text>Styled</Text>
      </TouchableWrapper>
    );
    expect(root).toBeTruthy();
  });

  it('accepts custom minSize', () => {
    const { root } = render(
      <TouchableWrapper minSize={60}>
        <Text>Large Target</Text>
      </TouchableWrapper>
    );
    expect(root).toBeTruthy();
  });

  it('uses default minSize of 44 (iOS touch target)', () => {
    const { root } = render(
      <TouchableWrapper>
        <Text>Default Size</Text>
      </TouchableWrapper>
    );
    expect(root).toBeTruthy();
  });

  it('handles press without onPress callback', () => {
    const { getByText } = render(
      <TouchableWrapper>
        <Text>No Callback</Text>
      </TouchableWrapper>
    );
    // Should not throw when pressed without onPress
    fireEvent.press(getByText('No Callback'));
  });

  it('passes through additional TouchableOpacity props', () => {
    const { root } = render(
      <TouchableWrapper activeOpacity={0.5} testID="wrapper">
        <Text>Extra Props</Text>
      </TouchableWrapper>
    );
    expect(root).toBeTruthy();
  });

  it('renders with all props combined', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <TouchableWrapper
        onPress={onPressMock}
        haptic="medium"
        minSize={48}
        accessibilityLabel="Complete action"
        accessibilityHint="Completes the current action"
        accessibilityRole="button"
        style={{ padding: 10 }}
      >
        <Text>Full Props</Text>
      </TouchableWrapper>
    );
    expect(getByText('Full Props')).toBeTruthy();
    fireEvent.press(getByText('Full Props'));
    expect(onPressMock).toHaveBeenCalled();
  });
});
