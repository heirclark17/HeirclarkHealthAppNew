import React from 'react';
import { render } from '@testing-library/react-native';

const FeaturesSection = ({ features }: any) => {
  const { View, Text } = require('react-native');
  return (
    <View testID="features-section">
      <Text testID="section-title">Features</Text>
      {features.map((feature: any) => (
        <View key={feature.id} testID={`feature-${feature.id}`}>
          <Text testID={`feature-title-${feature.id}`}>{feature.title}</Text>
          <Text testID={`feature-description-${feature.id}`}>{feature.description}</Text>
        </View>
      ))}
    </View>
  );
};

describe('FeaturesSection', () => {
  const mockFeatures = [
    {
      id: 'feature-1',
      title: 'AI Meal Logging',
      description: 'Log meals with AI-powered recognition',
    },
    {
      id: 'feature-2',
      title: 'Workout Tracking',
      description: 'Track your fitness progress',
    },
    {
      id: 'feature-3',
      title: 'Calorie Banking',
      description: 'Bank calories for special occasions',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<FeaturesSection features={mockFeatures} />)).not.toThrow();
  });

  it('displays section title', () => {
    const { getByText } = render(<FeaturesSection features={mockFeatures} />);
    expect(getByText('Features')).toBeTruthy();
  });

  it('renders all features', () => {
    const { getByTestId } = render(<FeaturesSection features={mockFeatures} />);
    expect(getByTestId('feature-feature-1')).toBeTruthy();
    expect(getByTestId('feature-feature-2')).toBeTruthy();
    expect(getByTestId('feature-feature-3')).toBeTruthy();
  });

  it('displays feature titles', () => {
    const { getByText } = render(<FeaturesSection features={mockFeatures} />);
    expect(getByText('AI Meal Logging')).toBeTruthy();
    expect(getByText('Workout Tracking')).toBeTruthy();
    expect(getByText('Calorie Banking')).toBeTruthy();
  });

  it('displays feature descriptions', () => {
    const { getByText } = render(<FeaturesSection features={mockFeatures} />);
    expect(getByText('Log meals with AI-powered recognition')).toBeTruthy();
    expect(getByText('Track your fitness progress')).toBeTruthy();
    expect(getByText('Bank calories for special occasions')).toBeTruthy();
  });

  it('renders with empty features array', () => {
    const { getByTestId } = render(<FeaturesSection features={[]} />);
    expect(getByTestId('features-section')).toBeTruthy();
  });

  it('renders with single feature', () => {
    const { getByText } = render(
      <FeaturesSection features={[mockFeatures[0]]} />
    );
    expect(getByText('AI Meal Logging')).toBeTruthy();
  });
});
