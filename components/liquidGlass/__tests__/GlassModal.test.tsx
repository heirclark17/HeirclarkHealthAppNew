import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { GlassModal } from '../GlassModal';

// Mock dependencies
jest.mock('../useGlassTheme', () => ({
  useGlassTheme: () => ({
    isDark: true,
    colors: {
      text: {
        primary: '#fff',
        muted: '#999',
      },
    },
    getGlassBackground: jest.fn(() => 'rgba(255, 255, 255, 0.1)'),
    getGlassBorder: jest.fn(() => 'rgba(255, 255, 255, 0.2)'),
  }),
}));

jest.mock('../AdaptiveText', () => ({
  AdaptiveText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock('../GlassButton', () => ({
  GlassButton: ({ icon, onPress, ...props }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={`glass-button-${icon}`} {...props}>
        <Text>{icon}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('GlassModal', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when visible', () => {
    expect(() =>
      render(
        <GlassModal visible={true} onDismiss={mockOnDismiss}>
          <Text>Modal Content</Text>
        </GlassModal>
      )
    ).not.toThrow();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <GlassModal visible={false} onDismiss={mockOnDismiss}>
        <Text>Modal Content</Text>
      </GlassModal>
    );
    expect(queryByText('Modal Content')).toBeNull();
  });

  it('renders with title', () => {
    const { getByText } = render(
      <GlassModal visible={true} onDismiss={mockOnDismiss} title="Test Modal">
        <Text>Content</Text>
      </GlassModal>
    );
    expect(getByText('Test Modal')).toBeTruthy();
  });

  it('renders close button by default', () => {
    const { getByTestId } = render(
      <GlassModal visible={true} onDismiss={mockOnDismiss}>
        <Text>Content</Text>
      </GlassModal>
    );
    expect(getByTestId('glass-button-close')).toBeTruthy();
  });

  it('hides close button when showCloseButton is false', () => {
    const { queryByTestId } = render(
      <GlassModal visible={true} onDismiss={mockOnDismiss} showCloseButton={false}>
        <Text>Content</Text>
      </GlassModal>
    );
    expect(queryByTestId('glass-button-close')).toBeNull();
  });

  it('calls onDismiss when close button is pressed', () => {
    const { getByTestId } = render(
      <GlassModal visible={true} onDismiss={mockOnDismiss}>
        <Text>Content</Text>
      </GlassModal>
    );
    fireEvent.press(getByTestId('glass-button-close'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders with sheet variant', () => {
    const { getByText } = render(
      <GlassModal visible={true} onDismiss={mockOnDismiss} variant="sheet">
        <Text>Sheet Content</Text>
      </GlassModal>
    );
    expect(getByText('Sheet Content')).toBeTruthy();
  });

  it('renders with center variant', () => {
    const { getByText } = render(
      <GlassModal visible={true} onDismiss={mockOnDismiss} variant="center">
        <Text>Center Content</Text>
      </GlassModal>
    );
    expect(getByText('Center Content')).toBeTruthy();
  });

  it('renders with fullscreen variant', () => {
    const { getByText } = render(
      <GlassModal visible={true} onDismiss={mockOnDismiss} variant="fullscreen">
        <Text>Fullscreen Content</Text>
      </GlassModal>
    );
    expect(getByText('Fullscreen Content')).toBeTruthy();
  });

  it('renders with small size', () => {
    const { getByText } = render(
      <GlassModal visible={true} onDismiss={mockOnDismiss} size="small">
        <Text>Small Modal</Text>
      </GlassModal>
    );
    expect(getByText('Small Modal')).toBeTruthy();
  });

  it('renders with medium size', () => {
    const { getByText } = render(
      <GlassModal visible={true} onDismiss={mockOnDismiss} size="medium">
        <Text>Medium Modal</Text>
      </GlassModal>
    );
    expect(getByText('Medium Modal')).toBeTruthy();
  });

  it('renders with large size', () => {
    const { getByText } = render(
      <GlassModal visible={true} onDismiss={mockOnDismiss} size="large">
        <Text>Large Modal</Text>
      </GlassModal>
    );
    expect(getByText('Large Modal')).toBeTruthy();
  });

  it('renders custom header content', () => {
    const { getByText } = render(
      <GlassModal
        visible={true}
        onDismiss={mockOnDismiss}
        headerContent={<Text>Custom Header</Text>}
      >
        <Text>Content</Text>
      </GlassModal>
    );
    expect(getByText('Custom Header')).toBeTruthy();
  });

  it('renders custom footer content', () => {
    const { getByText } = render(
      <GlassModal
        visible={true}
        onDismiss={mockOnDismiss}
        footerContent={<Text>Custom Footer</Text>}
      >
        <Text>Content</Text>
      </GlassModal>
    );
    expect(getByText('Custom Footer')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByText } = render(
      <GlassModal
        visible={true}
        onDismiss={mockOnDismiss}
        style={{ backgroundColor: 'red' }}
      >
        <Text>Styled Modal</Text>
      </GlassModal>
    );
    expect(getByText('Styled Modal')).toBeTruthy();
  });

  it('applies custom contentStyle', () => {
    const { getByText } = render(
      <GlassModal
        visible={true}
        onDismiss={mockOnDismiss}
        contentStyle={{ padding: 20 }}
      >
        <Text>Content Styled</Text>
      </GlassModal>
    );
    expect(getByText('Content Styled')).toBeTruthy();
  });
});
