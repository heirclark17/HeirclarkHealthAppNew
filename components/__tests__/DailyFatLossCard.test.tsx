import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DailyFatLossCard } from '../DailyFatLossCard';

// Mock the SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

describe('DailyFatLossCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(
      <DailyFatLossCard caloriesIn={1800} caloriesOut={2200} />
    )).not.toThrow();
  });

  it('displays DAILY FAT LOSS title', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={2000} caloriesOut={2500} />
    );
    expect(getByText('DAILY FAT LOSS')).toBeTruthy();
  });

  it('displays subtitle text', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={2000} caloriesOut={2500} />
    );
    expect(getByText('Click to expand \u2022 Based on net calories')).toBeTruthy();
  });

  it('is collapsed by default', () => {
    const { queryByText } = render(
      <DailyFatLossCard caloriesIn={1800} caloriesOut={2200} />
    );
    // Expanded content should not be visible
    expect(queryByText('STATUS')).toBeNull();
  });

  it('expands when header is pressed', () => {
    const { getByText, queryByText } = render(
      <DailyFatLossCard caloriesIn={1800} caloriesOut={2200} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    // Expanded content should now be visible
    expect(queryByText('STATUS')).toBeTruthy();
  });

  it('shows Deficit status when caloriesIn < caloriesOut', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={1800} caloriesOut={2200} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText('Deficit')).toBeTruthy();
  });

  it('shows Surplus status when caloriesIn > caloriesOut', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={2500} caloriesOut={2000} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText('Surplus')).toBeTruthy();
  });

  it('shows Maintenance status when caloriesIn equals caloriesOut', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={2000} caloriesOut={2000} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText('Maintenance')).toBeTruthy();
  });

  it('displays estimated fat lost label in deficit', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={1800} caloriesOut={2200} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText('ESTIMATED FAT LOST TODAY')).toBeTruthy();
  });

  it('displays estimated fat gained label in surplus', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={2800} caloriesOut={2000} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText('ESTIMATED FAT GAINED TODAY')).toBeTruthy();
  });

  it('displays maintenance label when calories are equal', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={2000} caloriesOut={2000} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText('MAINTENANCE')).toBeTruthy();
  });

  it('calculates fat change correctly (400 cal deficit = 0.114 lbs)', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={1800} caloriesOut={2200} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    // 400 / 3500 = 0.114
    expect(getByText('0.114 lbs')).toBeTruthy();
  });

  it('shows helper text for deficit', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={1800} caloriesOut={2200} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText("You're in a calorie deficit - great work!")).toBeTruthy();
  });

  it('shows helper text for surplus', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={2500} caloriesOut={2000} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText("You're in a calorie surplus")).toBeTruthy();
  });

  it('shows helper text for maintenance', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={2000} caloriesOut={2000} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText('Perfect maintenance')).toBeTruthy();
  });

  it('displays calorie info text', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={1800} caloriesOut={2200} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText('\u25CF 1 lb of fat = 3,500 calories')).toBeTruthy();
  });

  it('displays net calories difference in deficit', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={1800} caloriesOut={2200} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText('-400 cal')).toBeTruthy();
  });

  it('displays net calories difference in surplus with plus sign', () => {
    const { getByText } = render(
      <DailyFatLossCard caloriesIn={2500} caloriesOut={2000} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(getByText('+500 cal')).toBeTruthy();
  });

  it('shows weekly target section when weeklyTarget is set', () => {
    const { getByText, queryByText } = render(
      <DailyFatLossCard
        caloriesIn={1800}
        caloriesOut={2200}
        weeklyTarget={-1}
        goalType="lose"
      />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(queryByText('WEEKLY TARGET')).toBeTruthy();
  });

  it('hides weekly target section when weeklyTarget is 0', () => {
    const { getByText, queryByText } = render(
      <DailyFatLossCard caloriesIn={1800} caloriesOut={2200} weeklyTarget={0} />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(queryByText('WEEKLY TARGET')).toBeNull();
  });

  it('shows On Track badge when on target for loss goal', () => {
    const { getByText, queryByText } = render(
      <DailyFatLossCard
        caloriesIn={1500}
        caloriesOut={2500}
        weeklyTarget={-2}
        goalType="lose"
      />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(queryByText('On Track')).toBeTruthy();
  });

  it('collapses when header is pressed again', () => {
    const { getByText, queryByText } = render(
      <DailyFatLossCard caloriesIn={1800} caloriesOut={2200} />
    );
    // Expand
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(queryByText('STATUS')).toBeTruthy();
    // Collapse
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(queryByText('STATUS')).toBeNull();
  });

  it('has proper accessibility label', () => {
    const { getByLabelText } = render(
      <DailyFatLossCard caloriesIn={2000} caloriesOut={2500} />
    );
    expect(getByLabelText('Daily Fat Loss card, collapsed')).toBeTruthy();
  });

  it('renders with gain goalType', () => {
    const { getByText, queryByText } = render(
      <DailyFatLossCard
        caloriesIn={3000}
        caloriesOut={2500}
        weeklyTarget={0.5}
        goalType="gain"
      />
    );
    fireEvent.press(getByText('DAILY FAT LOSS'));
    expect(queryByText('lbs/gain')).toBeTruthy();
  });

  it('renders with maintain goalType', () => {
    const { root } = render(
      <DailyFatLossCard
        caloriesIn={2000}
        caloriesOut={2000}
        goalType="maintain"
      />
    );
    expect(root).toBeTruthy();
  });
});
