import React from 'react';
import { render } from '@testing-library/react-native';
import { StepProgressBar } from '../StepProgressBar';

// Mock SettingsContext
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

describe('StepProgressBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<StepProgressBar currentStep={1} totalSteps={5} />)).not.toThrow();
  });

  it('renders with default labels', () => {
    const { getByText } = render(<StepProgressBar currentStep={1} totalSteps={5} />);
    expect(getByText('Goal')).toBeTruthy();
    expect(getByText('Body')).toBeTruthy();
    expect(getByText('Activity')).toBeTruthy();
    expect(getByText('Nutrition')).toBeTruthy();
    expect(getByText('Review')).toBeTruthy();
  });

  it('renders with custom labels', () => {
    const customLabels = ['Step 1', 'Step 2', 'Step 3'];
    const { getByText } = render(
      <StepProgressBar currentStep={1} totalSteps={3} labels={customLabels} />
    );
    expect(getByText('Step 1')).toBeTruthy();
    expect(getByText('Step 2')).toBeTruthy();
    expect(getByText('Step 3')).toBeTruthy();
  });

  it('renders correct number of steps', () => {
    const { getByText } = render(<StepProgressBar currentStep={1} totalSteps={3} />);
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('renders with first step active', () => {
    const { getByText } = render(<StepProgressBar currentStep={1} totalSteps={3} />);
    expect(getByText('1')).toBeTruthy();
  });

  it('renders with second step active', () => {
    const { getByText } = render(<StepProgressBar currentStep={2} totalSteps={3} />);
    expect(getByText('2')).toBeTruthy();
  });

  it('renders with last step active', () => {
    const { getByText } = render(<StepProgressBar currentStep={5} totalSteps={5} />);
    expect(getByText('5')).toBeTruthy();
  });

  it('handles totalSteps of 1', () => {
    const { getByText } = render(<StepProgressBar currentStep={1} totalSteps={1} />);
    expect(getByText('1')).toBeTruthy();
  });

  it('handles totalSteps of 10', () => {
    const { getByText } = render(<StepProgressBar currentStep={5} totalSteps={10} />);
    expect(getByText('5')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
  });

  it('uses default labels when custom labels are shorter than totalSteps', () => {
    const { getByText } = render(
      <StepProgressBar currentStep={1} totalSteps={5} labels={['One', 'Two']} />
    );
    expect(getByText('One')).toBeTruthy();
    expect(getByText('Two')).toBeTruthy();
  });
});
