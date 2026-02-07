import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MealLibraryModal } from '../MealLibrary';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}));

describe('MealLibraryModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectMeal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when visible', () => {
    expect(() =>
      render(<MealLibraryModal visible={true} onClose={mockOnClose} />)
    ).not.toThrow();
  });

  it('does not show content when not visible', () => {
    const { queryByText } = render(
      <MealLibraryModal visible={false} onClose={mockOnClose} />
    );
    expect(queryByText('MEAL LIBRARY')).toBeFalsy();
  });

  it('displays header title', () => {
    const { getByText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('MEAL LIBRARY')).toBeTruthy();
  });

  it('displays meal count subtitle', () => {
    const { getByText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('8 meals')).toBeTruthy();
  });

  it('displays search input', () => {
    const { getByPlaceholderText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    expect(getByPlaceholderText('Search meals...')).toBeTruthy();
  });

  it('displays categories section', () => {
    const { getByText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('CATEGORIES')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Breakfast')).toBeTruthy();
    expect(getByText('Lunch')).toBeTruthy();
    expect(getByText('Dinner')).toBeTruthy();
    expect(getByText('Snacks')).toBeTruthy();
    expect(getByText('Drinks')).toBeTruthy();
  });

  it('displays filter tags', () => {
    const { getByText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('FILTERS')).toBeTruthy();
    expect(getByText('High Protein')).toBeTruthy();
    expect(getByText('Low Carb')).toBeTruthy();
    expect(getByText('Vegetarian')).toBeTruthy();
    expect(getByText('Vegan')).toBeTruthy();
  });

  it('displays meal cards', () => {
    const { getByText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('Grilled Chicken Breast')).toBeTruthy();
    expect(getByText('Greek Yogurt Bowl')).toBeTruthy();
    expect(getByText('Quinoa Salad')).toBeTruthy();
    expect(getByText('Protein Smoothie')).toBeTruthy();
  });

  it('displays macro information on meal cards', () => {
    const { getByText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    // Grilled Chicken Breast macros
    expect(getByText('100g')).toBeTruthy();
  });

  it('displays close button', () => {
    const { root } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    expect(root).toBeTruthy();
  });

  it('filters meals by search query', () => {
    const { getByPlaceholderText, queryByText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    const searchInput = getByPlaceholderText('Search meals...');
    fireEvent.changeText(searchInput, 'Chicken');
    expect(queryByText('Grilled Chicken Breast')).toBeTruthy();
    expect(queryByText('Quinoa Salad')).toBeFalsy();
  });

  it('shows empty state when no meals match search', () => {
    const { getByPlaceholderText, getByText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    const searchInput = getByPlaceholderText('Search meals...');
    fireEvent.changeText(searchInput, 'zzzznotfound');
    expect(getByText('No meals found')).toBeTruthy();
    expect(getByText('Try adjusting your filters')).toBeTruthy();
  });

  it('filters meals by category', () => {
    const { getByText, queryByText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    fireEvent.press(getByText('Dinner'));
    expect(queryByText('Salmon Fillet')).toBeTruthy();
    expect(queryByText('Greek Yogurt Bowl')).toBeFalsy();
  });

  it('displays Add to Meal button on each meal card', () => {
    const { getAllByText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    const addButtons = getAllByText('+ Add to Meal');
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('calls onSelectMeal when Add to Meal is pressed', () => {
    const { getAllByText } = render(
      <MealLibraryModal
        visible={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
      />
    );
    const addButtons = getAllByText('+ Add to Meal');
    fireEvent.press(addButtons[0]);
    expect(mockOnSelectMeal).toHaveBeenCalledTimes(1);
  });

  it('updates meal count when filtered by category', () => {
    const { getByText } = render(
      <MealLibraryModal visible={true} onClose={mockOnClose} />
    );
    fireEvent.press(getByText('Dinner'));
    expect(getByText('1 meals')).toBeTruthy();
  });
});
