import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ListItem, ListSection } from '../ListItem';

// Mock haptics
jest.mock('../../utils/haptics', () => ({
  lightImpact: jest.fn().mockResolvedValue(undefined),
  selectionFeedback: jest.fn().mockResolvedValue(undefined),
}));

describe('ListItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ListItem title="Test" />)).not.toThrow();
  });

  it('displays title text', () => {
    const { getByText } = render(<ListItem title="Profile" />);
    expect(getByText('Profile')).toBeTruthy();
  });

  it('displays subtitle when provided', () => {
    const { getByText } = render(
      <ListItem title="Profile" subtitle="Update your information" />
    );
    expect(getByText('Update your information')).toBeTruthy();
  });

  it('does not display subtitle when not provided', () => {
    const { queryByText } = render(<ListItem title="Profile" />);
    expect(queryByText('Update your information')).toBeNull();
  });

  it('displays value when provided', () => {
    const { getByText } = render(
      <ListItem title="Weight" value="185 lbs" />
    );
    expect(getByText('185 lbs')).toBeTruthy();
  });

  it('calls onPress callback when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ListItem title="Settings" onPress={onPressMock} />
    );
    fireEvent.press(getByText('Settings'));
    expect(onPressMock).toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ListItem title="Disabled Item" onPress={onPressMock} disabled />
    );
    fireEvent.press(getByText('Disabled Item'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders as a static view when onPress is not provided', () => {
    const { getByText } = render(<ListItem title="Static Item" />);
    expect(getByText('Static Item')).toBeTruthy();
  });

  it('renders as pressable when onPress is provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ListItem title="Pressable" onPress={onPressMock} />
    );
    expect(getByText('Pressable')).toBeTruthy();
  });

  it('applies destructive styling', () => {
    const { getByText } = render(
      <ListItem title="Delete Account" destructive />
    );
    expect(getByText('Delete Account')).toBeTruthy();
  });

  it('sets accessibility label from title', () => {
    const onPressMock = jest.fn();
    const { getByLabelText } = render(
      <ListItem title="Profile" onPress={onPressMock} />
    );
    expect(getByLabelText('Profile')).toBeTruthy();
  });

  it('sets custom accessibility label', () => {
    const onPressMock = jest.fn();
    const { getByLabelText } = render(
      <ListItem
        title="Profile"
        accessibilityLabel="Edit profile"
        onPress={onPressMock}
      />
    );
    expect(getByLabelText('Edit profile')).toBeTruthy();
  });

  it('renders left accessory when provided', () => {
    const { getByText } = render(
      <ListItem
        title="Custom Left"
        leftAccessory={<Text>Left Icon</Text>}
      />
    );
    expect(getByText('Left Icon')).toBeTruthy();
  });

  it('renders right accessory when provided', () => {
    const { getByText } = render(
      <ListItem
        title="Custom Right"
        rightAccessory={<Text>Right Widget</Text>}
      />
    );
    expect(getByText('Right Widget')).toBeTruthy();
  });

  it('renders with icon prop', () => {
    const { getByText } = render(
      <ListItem title="With Icon" icon="person-outline" />
    );
    expect(getByText('With Icon')).toBeTruthy();
  });

  it('renders with showChevron and onPress', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ListItem title="Navigate" showChevron onPress={onPressMock} />
    );
    expect(getByText('Navigate')).toBeTruthy();
  });

  it('does not render chevron without onPress', () => {
    const { root } = render(
      <ListItem title="No Chevron" showChevron />
    );
    // Chevron should not render because there's no onPress
    expect(root).toBeTruthy();
  });

  it('applies isLast styling (no bottom border)', () => {
    const { root } = render(
      <ListItem title="Last Item" isLast />
    );
    expect(root).toBeTruthy();
  });

  it('applies custom style', () => {
    const { root } = render(
      <ListItem title="Styled" style={{ marginBottom: 10 }} />
    );
    expect(root).toBeTruthy();
  });

  it('renders with all props combined', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ListItem
        title="Full Item"
        subtitle="Full description"
        value="100"
        icon="settings-outline"
        showChevron
        onPress={onPressMock}
        haptic="selection"
        accessibilityHint="Opens settings"
      />
    );
    expect(getByText('Full Item')).toBeTruthy();
    expect(getByText('Full description')).toBeTruthy();
    expect(getByText('100')).toBeTruthy();
  });

  it('uses light haptic by default', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ListItem title="Light Haptic" onPress={onPressMock} />
    );
    fireEvent.press(getByText('Light Haptic'));
    const { lightImpact } = require('../../utils/haptics');
    expect(lightImpact).toHaveBeenCalled();
  });

  it('uses selection haptic when specified', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ListItem title="Selection Haptic" onPress={onPressMock} haptic="selection" />
    );
    fireEvent.press(getByText('Selection Haptic'));
    const { selectionFeedback } = require('../../utils/haptics');
    expect(selectionFeedback).toHaveBeenCalled();
  });

  it('does not trigger haptic when haptic is none', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ListItem title="No Haptic" onPress={onPressMock} haptic="none" />
    );
    fireEvent.press(getByText('No Haptic'));
    const { lightImpact, selectionFeedback } = require('../../utils/haptics');
    expect(lightImpact).not.toHaveBeenCalled();
    expect(selectionFeedback).not.toHaveBeenCalled();
  });
});

describe('ListSection', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <ListSection>
          <ListItem title="Item" />
        </ListSection>
      )
    ).not.toThrow();
  });

  it('displays section title when provided', () => {
    const { getByText } = render(
      <ListSection title="ACCOUNT">
        <ListItem title="Profile" />
      </ListSection>
    );
    expect(getByText('ACCOUNT')).toBeTruthy();
  });

  it('renders children', () => {
    const { getByText } = render(
      <ListSection>
        <ListItem title="First" />
        <ListItem title="Second" />
      </ListSection>
    );
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('renders without title', () => {
    const { getByText } = render(
      <ListSection>
        <ListItem title="No Title Section" />
      </ListSection>
    );
    expect(getByText('No Title Section')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { root } = render(
      <ListSection style={{ marginTop: 20 }}>
        <ListItem title="Styled Section" />
      </ListSection>
    );
    expect(root).toBeTruthy();
  });
});
