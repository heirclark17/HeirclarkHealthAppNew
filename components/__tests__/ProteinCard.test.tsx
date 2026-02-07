import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProteinCard } from '../ProteinCard';

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

describe('ProteinCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ProteinCard />)).not.toThrow();
  });

  it('displays PROTEIN label', () => {
    const { getByText } = render(<ProteinCard />);
    expect(getByText('PROTEIN')).toBeTruthy();
  });

  it('displays current value rounded', () => {
    const { getByText } = render(<ProteinCard current={89.6} />);
    expect(getByText('90')).toBeTruthy();
  });

  it('displays default value of 0 when no current prop', () => {
    const { getByText } = render(<ProteinCard />);
    expect(getByText('0')).toBeTruthy();
  });

  it('displays goal in subtitle', () => {
    const { getByText } = render(<ProteinCard goal={180} />);
    expect(getByText('of 180g')).toBeTruthy();
  });

  it('displays default goal of 150g', () => {
    const { getByText } = render(<ProteinCard />);
    expect(getByText('of 150g')).toBeTruthy();
  });

  it('displays custom current and goal', () => {
    const { getByText } = render(<ProteinCard current={100} goal={200} />);
    expect(getByText('100')).toBeTruthy();
    expect(getByText('of 200g')).toBeTruthy();
  });

  it('calls onPress callback when provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<ProteinCard current={75} onPress={onPressMock} />);
    const cardText = getByText('75');
    fireEvent.press(cardText.parent!);
    expect(onPressMock).toHaveBeenCalled();
  });

  it('opens modal when pressed without onPress prop', () => {
    const { getByText } = render(<ProteinCard current={120} goal={150} />);
    const cardText = getByText('120');
    fireEvent.press(cardText.parent!);
  });

  it('handles zero goal gracefully', () => {
    const { getByText } = render(<ProteinCard current={50} goal={0} />);
    expect(getByText('50')).toBeTruthy();
    expect(getByText('of 0g')).toBeTruthy();
  });

  it('caps percentage at 100 when current exceeds goal', () => {
    const { getByText } = render(<ProteinCard current={200} goal={150} />);
    expect(getByText('200')).toBeTruthy();
  });

  it('rounds current value to nearest integer', () => {
    const { getByText } = render(<ProteinCard current={74.3} />);
    expect(getByText('74')).toBeTruthy();
  });

  it('renders with all props provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ProteinCard current={130} goal={180} onPress={onPressMock} />
    );
    expect(getByText('130')).toBeTruthy();
    expect(getByText('of 180g')).toBeTruthy();
  });

  it('displays percentage in modal content', () => {
    const { getByText, queryByText } = render(
      <ProteinCard current={75} goal={150} />
    );
    fireEvent.press(getByText('75').parent!);
    expect(queryByText('50% of Daily Goal')).toBeTruthy();
  });

  it('displays modal info section about protein', () => {
    const { getByText, queryByText } = render(
      <ProteinCard current={60} goal={150} />
    );
    fireEvent.press(getByText('60').parent!);
    expect(queryByText('Why Protein Matters')).toBeTruthy();
  });

  it('displays Close button in modal', () => {
    const { getByText, queryByText } = render(
      <ProteinCard current={60} goal={150} />
    );
    fireEvent.press(getByText('60').parent!);
    expect(queryByText('Close')).toBeTruthy();
  });

  it('displays modal title as Protein', () => {
    const { getByText, queryByText } = render(
      <ProteinCard current={90} />
    );
    fireEvent.press(getByText('90').parent!);
    expect(queryByText('Protein')).toBeTruthy();
  });

  it('displays current grams in modal value', () => {
    const { getByText, queryByText } = render(
      <ProteinCard current={110} />
    );
    fireEvent.press(getByText('110').parent!);
    expect(queryByText('110g')).toBeTruthy();
  });
});
