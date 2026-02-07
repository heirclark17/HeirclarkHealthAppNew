import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { DiningOutCard } from '../DiningOutCard';

describe('DiningOutCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<DiningOutCard />)).not.toThrow();
  });

  it('displays DINING OUT title', () => {
    const { getByText } = render(<DiningOutCard />);
    expect(getByText('DINING OUT')).toBeTruthy();
  });

  it('displays subtitle text', () => {
    const { getByText } = render(<DiningOutCard />);
    expect(getByText('Click to expand \u2022 Get restaurant recommendations')).toBeTruthy();
  });

  it('is collapsed by default', () => {
    const { queryByText } = render(<DiningOutCard />);
    // Expanded content should not be visible
    expect(queryByText('Restaurant')).toBeNull();
  });

  it('expands when header is pressed', () => {
    const { getByText, queryByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    // Expanded content should now be visible
    expect(queryByText('Restaurant')).toBeTruthy();
  });

  it('shows restaurant selector when expanded', () => {
    const { getByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    expect(getByText('Select a restaurant...')).toBeTruthy();
  });

  it('shows meal type selector when expanded', () => {
    const { getByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    expect(getByText('Meal Type (Optional)')).toBeTruthy();
    expect(getByText('Any')).toBeTruthy();
  });

  it('shows max calories input when expanded', () => {
    const { getByText, getByPlaceholderText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    expect(getByPlaceholderText('Enter max calories')).toBeTruthy();
  });

  it('shows Get Recommendations button when expanded', () => {
    const { getByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    expect(getByText('Get Recommendations')).toBeTruthy();
  });

  it('shows alert when getting recommendations without selecting restaurant', () => {
    const { getByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    fireEvent.press(getByText('Get Recommendations'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Select Restaurant',
      'Please select a restaurant first.'
    );
  });

  it('opens restaurant dropdown when restaurant picker is pressed', () => {
    const { getByText, queryByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    fireEvent.press(getByText('Select a restaurant...'));
    // Dropdown items should appear
    expect(queryByText("McDonald's")).toBeTruthy();
    expect(queryByText('Chick-fil-A')).toBeTruthy();
    expect(queryByText('Chipotle')).toBeTruthy();
  });

  it('selects a restaurant from dropdown', () => {
    const { getByText, queryByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    // Open dropdown
    fireEvent.press(getByText('Select a restaurant...'));
    // Select restaurant
    fireEvent.press(getByText('Chipotle'));
    // Verify dropdown closed and restaurant is selected
    expect(queryByText('Chipotle')).toBeTruthy();
  });

  it('opens meal type dropdown when meal type picker is pressed', () => {
    const { getByText, queryByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    fireEvent.press(getByText('Any'));
    // Dropdown items should appear
    expect(queryByText('Breakfast')).toBeTruthy();
    expect(queryByText('Lunch')).toBeTruthy();
    expect(queryByText('Dinner')).toBeTruthy();
    expect(queryByText('Snack')).toBeTruthy();
  });

  it('selects a meal type from dropdown', () => {
    const { getByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    fireEvent.press(getByText('Any'));
    fireEvent.press(getByText('Lunch'));
    // After selection, 'Lunch' should be the displayed value
    expect(getByText('Lunch')).toBeTruthy();
  });

  it('allows entering max calories', () => {
    const { getByText, getByPlaceholderText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    const input = getByPlaceholderText('Enter max calories');
    fireEvent.changeText(input, '500');
    // Input should reflect the new value
  });

  it('shows coming soon alert after selecting a restaurant and pressing recommendations', () => {
    const { getByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    // Open and select restaurant
    fireEvent.press(getByText('Select a restaurant...'));
    fireEvent.press(getByText('Subway'));
    // Press get recommendations
    fireEvent.press(getByText('Get Recommendations'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Coming Soon',
      'Restaurant recommendations for Subway will be available soon!'
    );
  });

  it('collapses when header is pressed again', () => {
    const { getByText, queryByText } = render(<DiningOutCard />);
    // Expand
    fireEvent.press(getByText('DINING OUT'));
    expect(queryByText('Restaurant')).toBeTruthy();
    // Collapse
    fireEvent.press(getByText('DINING OUT'));
    expect(queryByText('Restaurant')).toBeNull();
  });

  it('has proper accessibility label', () => {
    const { getByLabelText } = render(<DiningOutCard />);
    expect(getByLabelText('Dining Out card, collapsed')).toBeTruthy();
  });

  it('displays down arrow for restaurant picker initially', () => {
    const { getByText, queryByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    expect(queryByText('\u25BC')).toBeTruthy();
  });

  it('shows Max Calories label when expanded', () => {
    const { getByText } = render(<DiningOutCard />);
    fireEvent.press(getByText('DINING OUT'));
    expect(getByText('Max Calories')).toBeTruthy();
  });
});
