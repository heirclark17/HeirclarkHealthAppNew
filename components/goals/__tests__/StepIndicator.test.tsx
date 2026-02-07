import React from 'react';
import { render } from '@testing-library/react-native';
import { StepIndicator } from '../StepIndicator';

// Mock SettingsContext
jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

describe('StepIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<StepIndicator currentStep={1} totalSteps={3} />)).not.toThrow();
  });

  it('renders all step labels', () => {
    const { getByText } = render(<StepIndicator currentStep={1} totalSteps={3} />);
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Activity')).toBeTruthy();
    expect(getByText('Goals')).toBeTruthy();
  });

  it('renders all step numbers', () => {
    const { getByText } = render(<StepIndicator currentStep={1} totalSteps={3} />);
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('renders with first step active', () => {
    const { getByText } = render(<StepIndicator currentStep={1} totalSteps={3} />);
    expect(getByText('1')).toBeTruthy();
  });

  it('renders with second step active', () => {
    const { getByText } = render(<StepIndicator currentStep={2} totalSteps={3} />);
    expect(getByText('2')).toBeTruthy();
  });

  it('renders with third step active', () => {
    const { getByText } = render(<StepIndicator currentStep={3} totalSteps={3} />);
    expect(getByText('3')).toBeTruthy();
  });

  it('handles different total steps', () => {
    const { getByText, rerender } = render(
      <StepIndicator currentStep={1} totalSteps={3} />
    );
    expect(getByText('Profile')).toBeTruthy();

    rerender(<StepIndicator currentStep={1} totalSteps={5} />);
    expect(getByText('Profile')).toBeTruthy();
  });
});
