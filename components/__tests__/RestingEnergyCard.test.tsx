import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RestingEnergyCard } from '../RestingEnergyCard';

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

describe('RestingEnergyCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<RestingEnergyCard />)).not.toThrow();
  });

  it('displays RESTING label', () => {
    const { getByText } = render(<RestingEnergyCard />);
    expect(getByText('RESTING')).toBeTruthy();
  });

  it('displays kcal unit', () => {
    const { getByText } = render(<RestingEnergyCard />);
    expect(getByText('kcal')).toBeTruthy();
  });

  it('displays -- when restingEnergy is 0', () => {
    const { getByText } = render(<RestingEnergyCard restingEnergy={0} />);
    expect(getByText('--')).toBeTruthy();
  });

  it('displays resting energy value when provided', () => {
    const { getByText } = render(<RestingEnergyCard restingEnergy={1700} />);
    expect(getByText('1,700')).toBeTruthy();
  });

  it('displays formatted resting energy for large values', () => {
    const { getByText } = render(<RestingEnergyCard restingEnergy={2100} />);
    expect(getByText('2,100')).toBeTruthy();
  });

  it('calls onPress callback when provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <RestingEnergyCard restingEnergy={1700} onPress={onPressMock} />
    );
    fireEvent.press(getByText('1,700').parent!);
    expect(onPressMock).toHaveBeenCalled();
  });

  it('opens modal when pressed without onPress prop', () => {
    const { getByText, queryByText } = render(
      <RestingEnergyCard restingEnergy={1700} />
    );
    fireEvent.press(getByText('1,700').parent!);
    // Modal content should appear
    expect(queryByText('Resting Energy')).toBeTruthy();
  });

  it('displays modal value with kcal', () => {
    const { getByText, queryByText } = render(
      <RestingEnergyCard restingEnergy={1700} />
    );
    fireEvent.press(getByText('1,700').parent!);
    expect(queryByText('1,700 kcal')).toBeTruthy();
  });

  it('displays Basal Metabolic Rate badge in modal', () => {
    const { getByText, queryByText } = render(
      <RestingEnergyCard restingEnergy={1700} />
    );
    fireEvent.press(getByText('1,700').parent!);
    expect(queryByText('Basal Metabolic Rate')).toBeTruthy();
  });

  it('displays What is Resting Energy info in modal', () => {
    const { getByText, queryByText } = render(
      <RestingEnergyCard restingEnergy={1700} />
    );
    fireEvent.press(getByText('1,700').parent!);
    expect(queryByText('What is Resting Energy?')).toBeTruthy();
  });

  it('displays ENERGY BREAKDOWN section in modal', () => {
    const { getByText, queryByText } = render(
      <RestingEnergyCard restingEnergy={1700} />
    );
    fireEvent.press(getByText('1,700').parent!);
    expect(queryByText('ENERGY BREAKDOWN')).toBeTruthy();
  });

  it('calculates calories per hour correctly', () => {
    const { getByText, queryByText } = render(
      <RestingEnergyCard restingEnergy={2400} />
    );
    fireEvent.press(getByText('2,400').parent!);
    // 2400 / 24 = 100 kcal/hour
    expect(queryByText('100')).toBeTruthy();
    expect(queryByText('kcal/hour')).toBeTruthy();
  });

  it('calculates calories per minute correctly', () => {
    const { getByText, queryByText } = render(
      <RestingEnergyCard restingEnergy={1440} />
    );
    fireEvent.press(getByText('1,440').parent!);
    // 1440 / 1440 = 1.00 kcal/min
    expect(queryByText('1.00')).toBeTruthy();
    expect(queryByText('kcal/min')).toBeTruthy();
  });

  it('displays WEEKLY AVERAGE section in modal', () => {
    const { getByText, queryByText } = render(
      <RestingEnergyCard restingEnergy={1700} weeklyRestingEnergy={11900} />
    );
    fireEvent.press(getByText('1,700').parent!);
    expect(queryByText('WEEKLY AVERAGE')).toBeTruthy();
    expect(queryByText('Daily Average')).toBeTruthy();
    expect(queryByText('Weekly Total')).toBeTruthy();
  });

  it('displays FACTORS AFFECTING BMR section in modal', () => {
    const { getByText, queryByText } = render(
      <RestingEnergyCard restingEnergy={1700} />
    );
    fireEvent.press(getByText('1,700').parent!);
    expect(queryByText('FACTORS AFFECTING BMR')).toBeTruthy();
  });

  it('displays BMR vs TDEE comparison in modal', () => {
    const { getByText, queryByText } = render(
      <RestingEnergyCard restingEnergy={1700} />
    );
    fireEvent.press(getByText('1,700').parent!);
    expect(queryByText('BMR (Resting)')).toBeTruthy();
    expect(queryByText('Activity')).toBeTruthy();
    expect(queryByText('TDEE')).toBeTruthy();
  });

  it('displays Close button in modal', () => {
    const { getByText, queryByText } = render(
      <RestingEnergyCard restingEnergy={1700} />
    );
    fireEvent.press(getByText('1,700').parent!);
    expect(queryByText('Close')).toBeTruthy();
  });

  it('handles default goal value', () => {
    const { root } = render(<RestingEnergyCard restingEnergy={1700} />);
    expect(root).toBeTruthy();
  });

  it('renders with all props provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <RestingEnergyCard
        restingEnergy={1800}
        goal={1700}
        weeklyRestingEnergy={12600}
        onPress={onPressMock}
      />
    );
    expect(getByText('1,800')).toBeTruthy();
  });

  it('handles small resting energy values', () => {
    const { getByText } = render(<RestingEnergyCard restingEnergy={500} />);
    expect(getByText('500')).toBeTruthy();
  });
});
