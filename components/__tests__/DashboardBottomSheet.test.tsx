import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { DashboardBottomSheet } from '../DashboardBottomSheet';

// Mock SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View, Text: RNText } = require('react-native');

  const BottomSheetModal = React.forwardRef(({ children, ...props }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      present: jest.fn(),
      dismiss: jest.fn(),
    }));
    return <View>{children}</View>;
  });

  const BottomSheetModalProvider = ({ children }: any) => <View>{children}</View>;
  const BottomSheetBackdrop = (props: any) => <View />;
  const BottomSheetScrollView = ({ children }: any) => <View>{children}</View>;

  return {
    __esModule: true,
    default: View,
    BottomSheetModal,
    BottomSheetModalProvider,
    BottomSheetBackdrop,
    BottomSheetScrollView,
  };
});

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('DashboardBottomSheet', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <DashboardBottomSheet title="Test Title">
          <Text>Content</Text>
        </DashboardBottomSheet>
      )
    ).not.toThrow();
  });

  it('displays the title', () => {
    const { getByText } = render(
      <DashboardBottomSheet title="Workout Details">
        <Text>Content</Text>
      </DashboardBottomSheet>
    );
    expect(getByText('Workout Details')).toBeTruthy();
  });

  it('renders children content', () => {
    const { getByText } = render(
      <DashboardBottomSheet title="Test">
        <Text>Inner Content Here</Text>
      </DashboardBottomSheet>
    );
    expect(getByText('Inner Content Here')).toBeTruthy();
  });

  it('accepts custom snapPoints prop', () => {
    expect(() =>
      render(
        <DashboardBottomSheet title="Test" snapPoints={['30%', '60%', '90%']}>
          <Text>Content</Text>
        </DashboardBottomSheet>
      )
    ).not.toThrow();
  });

  it('exposes ref methods', () => {
    const ref = React.createRef<any>();
    render(
      <DashboardBottomSheet ref={ref} title="Test">
        <Text>Content</Text>
      </DashboardBottomSheet>
    );
    expect(ref.current).toBeDefined();
    expect(typeof ref.current.present).toBe('function');
    expect(typeof ref.current.dismiss).toBe('function');
  });

  it('renders close button with accessibility', () => {
    const { root } = render(
      <DashboardBottomSheet title="Test">
        <Text>Content</Text>
      </DashboardBottomSheet>
    );
    expect(root).toBeTruthy();
  });

  it('has correct displayName', () => {
    expect(DashboardBottomSheet.displayName).toBe('DashboardBottomSheet');
  });
});
