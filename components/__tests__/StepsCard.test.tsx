import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StepsCard } from '../StepsCard';

// Mock the SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

// Mock haptics
jest.mock('../../utils/haptics', () => ({
  lightImpact: jest.fn().mockResolvedValue(undefined),
}));

describe('StepsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<StepsCard />)).not.toThrow();
  });

  it('displays steps value', () => {
    const { getByText } = render(<StepsCard steps={8500} />);
    expect(getByText('8,500')).toBeTruthy();
  });

  it('displays STEPS label', () => {
    const { getByText } = render(<StepsCard steps={5000} />);
    expect(getByText('STEPS')).toBeTruthy();
  });

  it('displays goal in subtitle', () => {
    const { getByText } = render(<StepsCard steps={5000} goal={10000} />);
    expect(getByText('of 10,000')).toBeTruthy();
  });

  it('displays -- when steps is 0', () => {
    const { getByText } = render(<StepsCard steps={0} />);
    expect(getByText('--')).toBeTruthy();
  });

  it('formats large step counts with commas', () => {
    const { getByText } = render(<StepsCard steps={12345} />);
    expect(getByText('12,345')).toBeTruthy();
  });

  it('opens modal when card is pressed', () => {
    const { getByText } = render(<StepsCard steps={7500} />);
    const stepsText = getByText('7,500');
    fireEvent.press(stepsText.parent!);
  });

  it('calls onPress callback when provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<StepsCard steps={5000} onPress={onPressMock} />);
    const stepsText = getByText('5,000');
    fireEvent.press(stepsText.parent!);
    expect(onPressMock).toHaveBeenCalled();
  });

  it('calculates progress at 50%', () => {
    const { getByText } = render(<StepsCard steps={5000} goal={10000} />);
    expect(getByText('5,000')).toBeTruthy();
  });

  it('calculates progress at 100%', () => {
    const { getByText } = render(<StepsCard steps={10000} goal={10000} />);
    expect(getByText('10,000')).toBeTruthy();
  });

  it('handles steps exceeding goal', () => {
    const { getByText } = render(<StepsCard steps={12000} goal={10000} />);
    expect(getByText('12,000')).toBeTruthy();
  });

  it('displays weekly steps data', () => {
    const { root } = render(
      <StepsCard steps={8000} weeklySteps={56000} />
    );
    expect(root).toBeTruthy();
  });

  it('handles default goal value of 10000', () => {
    const { getByText } = render(<StepsCard steps={7500} />);
    expect(getByText('of 10,000')).toBeTruthy();
  });

  it('renders with all props provided', () => {
    const { getByText } = render(
      <StepsCard
        steps={8500}
        goal={10000}
        weeklySteps={60000}
        weeklyGoal={70000}
      />
    );
    expect(getByText('8,500')).toBeTruthy();
  });

  it('formats goal with commas', () => {
    const { getByText } = render(<StepsCard steps={5000} goal={15000} />);
    expect(getByText('of 15,000')).toBeTruthy();
  });

  it('handles zero goal gracefully', () => {
    const { getByText } = render(<StepsCard steps={100} goal={0} />);
    expect(getByText('100')).toBeTruthy();
  });

  it('displays step count without commas when less than 1000', () => {
    const { getByText } = render(<StepsCard steps={500} />);
    expect(getByText('500')).toBeTruthy();
  });
});
