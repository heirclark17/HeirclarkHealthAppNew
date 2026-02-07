import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const CTASection = ({ title, description, buttonText, onPress }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <View testID="cta-section">
      <Text testID="cta-title">{title}</Text>
      <Text testID="cta-description">{description}</Text>
      <TouchableOpacity onPress={onPress} testID="cta-button">
        <Text>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('CTASection', () => {
  const mockProps = {
    title: 'Ready to get started?',
    description: 'Join thousands of users achieving their health goals',
    buttonText: 'Sign Up Now',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<CTASection {...mockProps} />)).not.toThrow();
  });

  it('displays title', () => {
    const { getByText } = render(<CTASection {...mockProps} />);
    expect(getByText('Ready to get started?')).toBeTruthy();
  });

  it('displays description', () => {
    const { getByText } = render(<CTASection {...mockProps} />);
    expect(getByText('Join thousands of users achieving their health goals')).toBeTruthy();
  });

  it('displays button text', () => {
    const { getByText } = render(<CTASection {...mockProps} />);
    expect(getByText('Sign Up Now')).toBeTruthy();
  });

  it('calls onPress when button is pressed', () => {
    const { getByTestId } = render(<CTASection {...mockProps} />);
    fireEvent.press(getByTestId('cta-button'));
    expect(mockProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('renders with different title', () => {
    const { getByText } = render(
      <CTASection {...mockProps} title="Start Your Journey" />
    );
    expect(getByText('Start Your Journey')).toBeTruthy();
  });

  it('renders with different button text', () => {
    const { getByText } = render(
      <CTASection {...mockProps} buttonText="Get Started Free" />
    );
    expect(getByText('Get Started Free')).toBeTruthy();
  });
});
