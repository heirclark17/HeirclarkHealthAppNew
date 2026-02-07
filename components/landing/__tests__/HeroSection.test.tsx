import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const HeroSection = ({ title, subtitle, onGetStarted }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <View testID="hero-section">
      <Text testID="hero-title">{title}</Text>
      <Text testID="hero-subtitle">{subtitle}</Text>
      <TouchableOpacity onPress={onGetStarted} testID="get-started-button">
        <Text>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('HeroSection', () => {
  const mockProps = {
    title: 'Transform Your Health',
    subtitle: 'AI-powered fitness and nutrition tracking',
    onGetStarted: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<HeroSection {...mockProps} />)).not.toThrow();
  });

  it('displays title', () => {
    const { getByText } = render(<HeroSection {...mockProps} />);
    expect(getByText('Transform Your Health')).toBeTruthy();
  });

  it('displays subtitle', () => {
    const { getByText } = render(<HeroSection {...mockProps} />);
    expect(getByText('AI-powered fitness and nutrition tracking')).toBeTruthy();
  });

  it('displays get started button', () => {
    const { getByText } = render(<HeroSection {...mockProps} />);
    expect(getByText('Get Started')).toBeTruthy();
  });

  it('calls onGetStarted when button is pressed', () => {
    const { getByTestId } = render(<HeroSection {...mockProps} />);
    fireEvent.press(getByTestId('get-started-button'));
    expect(mockProps.onGetStarted).toHaveBeenCalledTimes(1);
  });

  it('renders with different title', () => {
    const { getByText } = render(
      <HeroSection {...mockProps} title="Achieve Your Goals" />
    );
    expect(getByText('Achieve Your Goals')).toBeTruthy();
  });

  it('renders with different subtitle', () => {
    const { getByText } = render(
      <HeroSection {...mockProps} subtitle="Your personal health assistant" />
    );
    expect(getByText('Your personal health assistant')).toBeTruthy();
  });
});
