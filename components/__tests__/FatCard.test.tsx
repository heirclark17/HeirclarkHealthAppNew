import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FatCard } from '../FatCard';

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

describe('FatCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<FatCard />)).not.toThrow();
  });

  it('displays FAT label', () => {
    const { getByText } = render(<FatCard />);
    expect(getByText('FAT')).toBeTruthy();
  });

  it('displays current value rounded', () => {
    const { getByText } = render(<FatCard current={42.8} />);
    expect(getByText('43')).toBeTruthy();
  });

  it('displays default value of 0 when no current prop', () => {
    const { getByText } = render(<FatCard />);
    expect(getByText('0')).toBeTruthy();
  });

  it('displays goal in subtitle', () => {
    const { getByText } = render(<FatCard goal={80} />);
    expect(getByText('of 80g')).toBeTruthy();
  });

  it('displays default goal of 65g', () => {
    const { getByText } = render(<FatCard />);
    expect(getByText('of 65g')).toBeTruthy();
  });

  it('displays custom current and goal', () => {
    const { getByText } = render(<FatCard current={30} goal={70} />);
    expect(getByText('30')).toBeTruthy();
    expect(getByText('of 70g')).toBeTruthy();
  });

  it('calls onPress callback when provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<FatCard current={25} onPress={onPressMock} />);
    const cardText = getByText('25');
    fireEvent.press(cardText.parent!);
    expect(onPressMock).toHaveBeenCalled();
  });

  it('opens modal when pressed without onPress prop', () => {
    const { getByText } = render(<FatCard current={40} goal={65} />);
    const cardText = getByText('40');
    fireEvent.press(cardText.parent!);
  });

  it('handles zero goal gracefully', () => {
    const { getByText } = render(<FatCard current={20} goal={0} />);
    expect(getByText('20')).toBeTruthy();
    expect(getByText('of 0g')).toBeTruthy();
  });

  it('caps percentage at 100 when current exceeds goal', () => {
    const { getByText } = render(<FatCard current={80} goal={65} />);
    expect(getByText('80')).toBeTruthy();
  });

  it('rounds current value to nearest integer', () => {
    const { getByText } = render(<FatCard current={33.2} />);
    expect(getByText('33')).toBeTruthy();
  });

  it('renders with all props provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <FatCard current={50} goal={80} onPress={onPressMock} />
    );
    expect(getByText('50')).toBeTruthy();
    expect(getByText('of 80g')).toBeTruthy();
  });

  it('displays percentage in modal content', () => {
    const { getByText, queryByText } = render(
      <FatCard current={32} goal={64} />
    );
    fireEvent.press(getByText('32').parent!);
    expect(queryByText('50% of Daily Goal')).toBeTruthy();
  });

  it('displays modal info section about fat', () => {
    const { getByText, queryByText } = render(
      <FatCard current={20} goal={65} />
    );
    fireEvent.press(getByText('20').parent!);
    expect(queryByText('Why Fat Matters')).toBeTruthy();
  });

  it('displays Close button in modal', () => {
    const { getByText, queryByText } = render(
      <FatCard current={20} goal={65} />
    );
    fireEvent.press(getByText('20').parent!);
    expect(queryByText('Close')).toBeTruthy();
  });

  it('displays modal title as Fat', () => {
    const { getByText, queryByText } = render(
      <FatCard current={45} />
    );
    fireEvent.press(getByText('45').parent!);
    expect(queryByText('Fat')).toBeTruthy();
  });

  it('displays current grams in modal value', () => {
    const { getByText, queryByText } = render(
      <FatCard current={55} />
    );
    fireEvent.press(getByText('55').parent!);
    expect(queryByText('55g')).toBeTruthy();
  });
});
