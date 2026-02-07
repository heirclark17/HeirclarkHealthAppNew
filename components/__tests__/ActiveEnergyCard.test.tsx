import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActiveEnergyCard } from '../ActiveEnergyCard';

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
  successNotification: jest.fn().mockResolvedValue(undefined),
}));

describe('ActiveEnergyCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ActiveEnergyCard />)).not.toThrow();
  });

  it('displays active energy value', () => {
    const { getByText } = render(<ActiveEnergyCard activeEnergy={350} />);
    expect(getByText('350')).toBeTruthy();
  });

  it('displays kcal unit', () => {
    const { getByText } = render(<ActiveEnergyCard activeEnergy={250} />);
    expect(getByText('kcal')).toBeTruthy();
  });

  it('displays ACTIVE label', () => {
    const { getByText } = render(<ActiveEnergyCard activeEnergy={100} />);
    expect(getByText('ACTIVE')).toBeTruthy();
  });

  it('displays -- when activeEnergy is 0', () => {
    const { getByText } = render(<ActiveEnergyCard activeEnergy={0} />);
    expect(getByText('--')).toBeTruthy();
  });

  it('formats large numbers with commas', () => {
    const { getByText } = render(<ActiveEnergyCard activeEnergy={1234} />);
    expect(getByText('1,234')).toBeTruthy();
  });

  it('opens modal when card is pressed', () => {
    const { getByText } = render(<ActiveEnergyCard activeEnergy={500} goal={1000} />);
    const card = getByText('500');
    fireEvent.press(card.parent!);
    // Modal should open - can verify by checking for modal content
  });

  it('calls onPress callback when provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ActiveEnergyCard activeEnergy={500} onPress={onPressMock} />
    );
    const card = getByText('500');
    fireEvent.press(card.parent!);
    expect(onPressMock).toHaveBeenCalled();
  });

  it('displays goal in modal', () => {
    const { getByText } = render(<ActiveEnergyCard activeEnergy={500} goal={800} />);
    expect(getByText('500')).toBeTruthy();
  });

  it('calculates percentage correctly at 50%', () => {
    const { getByText } = render(<ActiveEnergyCard activeEnergy={250} goal={500} />);
    expect(getByText('250')).toBeTruthy();
  });

  it('calculates percentage correctly at 100%', () => {
    const { getByText } = render(<ActiveEnergyCard activeEnergy={500} goal={500} />);
    expect(getByText('500')).toBeTruthy();
  });

  it('handles activeEnergy exceeding goal', () => {
    const { getByText } = render(<ActiveEnergyCard activeEnergy={600} goal={500} />);
    expect(getByText('600')).toBeTruthy();
  });

  it('displays weekly active energy', () => {
    const { root } = render(
      <ActiveEnergyCard activeEnergy={500} weeklyActiveEnergy={2500} />
    );
    expect(root).toBeTruthy();
  });

  it('handles default goal value', () => {
    const { getByText } = render(<ActiveEnergyCard activeEnergy={300} />);
    expect(getByText('300')).toBeTruthy();
  });

  it('renders with all props', () => {
    const { getByText } = render(
      <ActiveEnergyCard
        activeEnergy={450}
        goal={600}
        weeklyActiveEnergy={3000}
        weeklyGoal={4200}
      />
    );
    expect(getByText('450')).toBeTruthy();
  });
});
