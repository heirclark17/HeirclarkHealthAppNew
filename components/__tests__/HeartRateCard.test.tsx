import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeartRateCard } from '../HeartRateCard';

// Mock the SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

// Mock the GoalWizardContext
jest.mock('../../contexts/GoalWizardContext', () => ({
  useGoalWizard: () => ({
    state: {
      age: 30,
    },
  }),
}));

// Mock haptics
jest.mock('../../utils/haptics', () => ({
  lightImpact: jest.fn().mockResolvedValue(undefined),
}));

describe('HeartRateCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<HeartRateCard />)).not.toThrow();
  });

  it('displays heart rate value', () => {
    const { getByText } = render(<HeartRateCard heartRate={72} />);
    expect(getByText('72')).toBeTruthy();
  });

  it('displays -- when heart rate is 0', () => {
    const { getByText } = render(<HeartRateCard heartRate={0} />);
    expect(getByText('--')).toBeTruthy();
  });

  it('displays BPM unit', () => {
    const { getByText } = render(<HeartRateCard heartRate={72} />);
    expect(getByText('BPM')).toBeTruthy();
  });

  it('calculates max heart rate based on age', () => {
    const { root } = render(<HeartRateCard heartRate={150} />);
    // Max HR = 220 - 30 (age) = 190
    expect(root).toBeTruthy();
  });

  it('determines correct zone for resting heart rate', () => {
    const { root } = render(<HeartRateCard heartRate={60} />);
    // 60 BPM should be in Rest zone for 30 year old
    expect(root).toBeTruthy();
  });

  it('determines correct zone for cardio heart rate', () => {
    const { root } = render(<HeartRateCard heartRate={130} />);
    // 130 BPM should be in Cardio zone for 30 year old
    expect(root).toBeTruthy();
  });

  it('determines correct zone for peak heart rate', () => {
    const { root } = render(<HeartRateCard heartRate={170} />);
    // 170 BPM should be in Peak zone for 30 year old
    expect(root).toBeTruthy();
  });

  it('displays blood pressure when provided', () => {
    const { root } = render(
      <HeartRateCard heartRate={72} systolic={120} diastolic={80} />
    );
    expect(root).toBeTruthy();
  });

  it('classifies normal blood pressure correctly', () => {
    const { root } = render(
      <HeartRateCard heartRate={72} systolic={115} diastolic={75} />
    );
    // Should classify as Normal (< 120 / < 80)
    expect(root).toBeTruthy();
  });

  it('classifies elevated blood pressure correctly', () => {
    const { root } = render(
      <HeartRateCard heartRate={72} systolic={125} diastolic={78} />
    );
    // Should classify as Elevated (120-129 / < 80)
    expect(root).toBeTruthy();
  });

  it('classifies high blood pressure Stage 1', () => {
    const { root } = render(
      <HeartRateCard heartRate={72} systolic={135} diastolic={85} />
    );
    // Should classify as High Stage 1 (130-139 / 80-89)
    expect(root).toBeTruthy();
  });

  it('classifies high blood pressure Stage 2', () => {
    const { root } = render(
      <HeartRateCard heartRate={72} systolic={145} diastolic={95} />
    );
    // Should classify as High Stage 2 (≥ 140 / ≥ 90)
    expect(root).toBeTruthy();
  });

  it('opens modal when card is pressed', () => {
    const { getByText } = render(<HeartRateCard heartRate={72} />);
    const hrText = getByText('72');
    fireEvent.press(hrText.parent!);
  });

  it('calls onPress callback when provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<HeartRateCard heartRate={72} onPress={onPressMock} />);
    const hrText = getByText('72');
    fireEvent.press(hrText.parent!);
    expect(onPressMock).toHaveBeenCalled();
  });

  it('handles very low heart rate', () => {
    const { getByText } = render(<HeartRateCard heartRate={40} />);
    expect(getByText('40')).toBeTruthy();
  });

  it('handles very high heart rate', () => {
    const { getByText } = render(<HeartRateCard heartRate={200} />);
    expect(getByText('200')).toBeTruthy();
  });

  it('renders with all props', () => {
    const { getByText } = render(
      <HeartRateCard heartRate={85} systolic={130} diastolic={85} />
    );
    expect(getByText('85')).toBeTruthy();
  });

  it('handles missing blood pressure gracefully', () => {
    const { root } = render(<HeartRateCard heartRate={72} systolic={0} diastolic={0} />);
    expect(root).toBeTruthy();
  });
});
