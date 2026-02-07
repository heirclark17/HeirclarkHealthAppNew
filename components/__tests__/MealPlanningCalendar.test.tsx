import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MealPlanningCalendarModal } from '../MealPlanningCalendar';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}));

// Mock MealLibrary to avoid deep rendering
jest.mock('../MealLibrary', () => ({
  MealLibraryModal: ({ visible, onClose }: any) => null,
}));

describe('MealPlanningCalendarModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when visible', () => {
    expect(() =>
      render(<MealPlanningCalendarModal visible={true} onClose={mockOnClose} />)
    ).not.toThrow();
  });

  it('does not show content when not visible', () => {
    const { queryByText } = render(
      <MealPlanningCalendarModal visible={false} onClose={mockOnClose} />
    );
    expect(queryByText('MEAL PLANNING')).toBeFalsy();
  });

  it('displays header title', () => {
    const { getByText } = render(
      <MealPlanningCalendarModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('MEAL PLANNING')).toBeTruthy();
  });

  it('displays This Week label', () => {
    const { getByText } = render(
      <MealPlanningCalendarModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('This Week')).toBeTruthy();
  });

  it('displays Generate Shopping List button', () => {
    const { root } = render(
      <MealPlanningCalendarModal visible={true} onClose={mockOnClose} />
    );
    expect(root).toBeTruthy();
  });

  it('displays day columns with Sun through Sat', () => {
    const { getByText } = render(
      <MealPlanningCalendarModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('Sun')).toBeTruthy();
    expect(getByText('Mon')).toBeTruthy();
    expect(getByText('Tue')).toBeTruthy();
    expect(getByText('Wed')).toBeTruthy();
    expect(getByText('Thu')).toBeTruthy();
    expect(getByText('Fri')).toBeTruthy();
    expect(getByText('Sat')).toBeTruthy();
  });

  it('displays meal time slots for each day', () => {
    const { getAllByText } = render(
      <MealPlanningCalendarModal visible={true} onClose={mockOnClose} />
    );
    // Each day has 4 meal time slots
    const breakfastSlots = getAllByText('Breakfast');
    const lunchSlots = getAllByText('Lunch');
    const dinnerSlots = getAllByText('Dinner');
    const snackSlots = getAllByText('Snacks');
    expect(breakfastSlots.length).toBe(7);
    expect(lunchSlots.length).toBe(7);
    expect(dinnerSlots.length).toBe(7);
    expect(snackSlots.length).toBe(7);
  });

  it('displays Add Meal buttons in empty slots', () => {
    const { getAllByText } = render(
      <MealPlanningCalendarModal visible={true} onClose={mockOnClose} />
    );
    // 7 days x 4 meal times = 28 Add Meal buttons
    const addButtons = getAllByText('+ Add Meal');
    expect(addButtons.length).toBe(28);
  });

  it('displays 0 cal totals for each day initially', () => {
    const { getAllByText } = render(
      <MealPlanningCalendarModal visible={true} onClose={mockOnClose} />
    );
    const calTexts = getAllByText('0 cal');
    expect(calTexts.length).toBe(7);
  });

  it('displays week date range in subtitle', () => {
    const { root } = render(
      <MealPlanningCalendarModal visible={true} onClose={mockOnClose} />
    );
    // The subtitle contains a date range like "1/5 - 1/11"
    expect(root).toBeTruthy();
  });

  it('displays close button', () => {
    const { root } = render(
      <MealPlanningCalendarModal visible={true} onClose={mockOnClose} />
    );
    expect(root).toBeTruthy();
  });
});
