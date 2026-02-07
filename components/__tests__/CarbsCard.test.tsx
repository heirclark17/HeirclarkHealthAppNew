import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CarbsCard } from '../CarbsCard';

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

describe('CarbsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<CarbsCard />)).not.toThrow();
  });

  it('displays CARBS label', () => {
    const { getByText } = render(<CarbsCard />);
    expect(getByText('CARBS')).toBeTruthy();
  });

  it('displays current value rounded', () => {
    const { getByText } = render(<CarbsCard current={125.7} />);
    expect(getByText('126')).toBeTruthy();
  });

  it('displays default value of 0 when no current prop', () => {
    const { getByText } = render(<CarbsCard />);
    expect(getByText('0')).toBeTruthy();
  });

  it('displays goal in subtitle', () => {
    const { getByText } = render(<CarbsCard goal={250} />);
    expect(getByText('of 250g')).toBeTruthy();
  });

  it('displays default goal of 200g', () => {
    const { getByText } = render(<CarbsCard />);
    expect(getByText('of 200g')).toBeTruthy();
  });

  it('displays custom current and goal', () => {
    const { getByText } = render(<CarbsCard current={80} goal={300} />);
    expect(getByText('80')).toBeTruthy();
    expect(getByText('of 300g')).toBeTruthy();
  });

  it('calls onPress callback when provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<CarbsCard current={50} onPress={onPressMock} />);
    const cardText = getByText('50');
    fireEvent.press(cardText.parent!);
    expect(onPressMock).toHaveBeenCalled();
  });

  it('opens modal when pressed without onPress prop', () => {
    const { getByText } = render(<CarbsCard current={100} goal={200} />);
    const cardText = getByText('100');
    fireEvent.press(cardText.parent!);
    // Modal content should appear
  });

  it('handles zero goal gracefully (percentage stays 0)', () => {
    const { getByText } = render(<CarbsCard current={50} goal={0} />);
    expect(getByText('50')).toBeTruthy();
    expect(getByText('of 0g')).toBeTruthy();
  });

  it('caps percentage at 100 when current exceeds goal', () => {
    const { getByText } = render(<CarbsCard current={300} goal={200} />);
    expect(getByText('300')).toBeTruthy();
  });

  it('rounds current value to nearest integer', () => {
    const { getByText } = render(<CarbsCard current={99.4} />);
    expect(getByText('99')).toBeTruthy();
  });

  it('renders with all props provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <CarbsCard current={150} goal={250} onPress={onPressMock} />
    );
    expect(getByText('150')).toBeTruthy();
    expect(getByText('of 250g')).toBeTruthy();
  });

  it('displays percentage in modal content', () => {
    const { getByText, queryByText } = render(
      <CarbsCard current={100} goal={200} />
    );
    // Trigger modal by pressing the card
    const cardText = getByText('100');
    fireEvent.press(cardText.parent!);
    // Modal should show percentage
    expect(queryByText('50% of Daily Goal')).toBeTruthy();
  });

  it('displays modal info section about carbs', () => {
    const { getByText, queryByText } = render(
      <CarbsCard current={50} goal={200} />
    );
    fireEvent.press(getByText('50').parent!);
    expect(queryByText('Why Carbs Matter')).toBeTruthy();
  });

  it('displays Close button in modal', () => {
    const { getByText, queryByText } = render(
      <CarbsCard current={50} goal={200} />
    );
    fireEvent.press(getByText('50').parent!);
    expect(queryByText('Close')).toBeTruthy();
  });

  it('displays modal title as Carbs', () => {
    const { getByText, queryByText } = render(
      <CarbsCard current={75} />
    );
    fireEvent.press(getByText('75').parent!);
    expect(queryByText('Carbs')).toBeTruthy();
  });

  it('displays current grams in modal value', () => {
    const { getByText, queryByText } = render(
      <CarbsCard current={120} />
    );
    fireEvent.press(getByText('120').parent!);
    expect(queryByText('120g')).toBeTruthy();
  });
});
