import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FoodPreferencesModal } from '../FoodPreferences';

// Mock SettingsContext
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      themeMode: 'dark',
    },
  }),
}));

// Mock FoodPreferencesContext
const mockUpdatePreferences = jest.fn().mockResolvedValue(undefined);
jest.mock('../../contexts/FoodPreferencesContext', () => ({
  useFoodPreferencesSafe: () => ({
    preferences: {
      dietaryPreferences: [],
      allergens: [],
      favoriteCuisines: [],
      favoriteProteins: ['Chicken'],
      favoriteVegetables: [],
      favoriteStarches: [],
      favoriteSnacks: [],
      hatedFoods: '',
      mealStyle: '',
      mealDiversity: '',
    },
    updatePreferences: mockUpdatePreferences,
  }),
}));

// Mock haptics
jest.mock('../../utils/haptics', () => ({
  selectionFeedback: jest.fn().mockResolvedValue(undefined),
  lightImpact: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children, ...props }: any) => <>{children}</>,
}));

// Mock GlassCard
jest.mock('../GlassCard', () => ({
  GlassCard: ({ children, style }: any) => <>{children}</>,
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('FoodPreferencesModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when visible', () => {
    expect(() =>
      render(<FoodPreferencesModal visible={true} onClose={mockOnClose} />)
    ).not.toThrow();
  });

  it('does not show content when not visible', () => {
    const { queryByText } = render(
      <FoodPreferencesModal visible={false} onClose={mockOnClose} />
    );
    expect(queryByText('Food Preferences')).toBeFalsy();
  });

  it('displays the header title when visible', () => {
    const { getByText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('Food Preferences')).toBeTruthy();
  });

  it('displays header subtitle', () => {
    const { getByText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('Customize your AI meal plans')).toBeTruthy();
  });

  it('displays section titles', () => {
    const { getByText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('MEAL VARIETY')).toBeTruthy();
    expect(getByText('FAVORITE PROTEINS')).toBeTruthy();
    expect(getByText('FAVORITE VEGETABLES')).toBeTruthy();
    expect(getByText('FAVORITE CARBS & STARCHES')).toBeTruthy();
    expect(getByText('FAVORITE SNACKS')).toBeTruthy();
    expect(getByText('FAVORITE CUISINES')).toBeTruthy();
    expect(getByText('DISLIKED FOODS')).toBeTruthy();
  });

  it('displays protein options', () => {
    const { getByText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('Chicken')).toBeTruthy();
    expect(getByText('Beef')).toBeTruthy();
    expect(getByText('Fish')).toBeTruthy();
    expect(getByText('Tofu')).toBeTruthy();
  });

  it('displays cuisine options', () => {
    const { getByText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('American')).toBeTruthy();
    expect(getByText('Italian')).toBeTruthy();
    expect(getByText('Mexican')).toBeTruthy();
    expect(getByText('Japanese')).toBeTruthy();
  });

  it('displays meal diversity options', () => {
    const { getByText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('Diverse daily')).toBeTruthy();
    expect(getByText('Same meals (prep)')).toBeTruthy();
  });

  it('displays Save Preferences button', () => {
    const { getByText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('Save Preferences')).toBeTruthy();
  });

  it('displays disliked food options', () => {
    const { getByText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('Mushrooms')).toBeTruthy();
    expect(getByText('Cilantro')).toBeTruthy();
    expect(getByText('Olives')).toBeTruthy();
  });

  it('displays the text input placeholder for custom disliked foods', () => {
    const { getByPlaceholderText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByPlaceholderText('Add other foods (comma separated)')).toBeTruthy();
  });

  it('renders vegetable options', () => {
    const { getByText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('Broccoli')).toBeTruthy();
    expect(getByText('Spinach')).toBeTruthy();
    expect(getByText('Kale')).toBeTruthy();
  });

  it('renders starch options', () => {
    const { getByText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('Rice')).toBeTruthy();
    expect(getByText('Quinoa')).toBeTruthy();
    expect(getByText('Sweet Potatoes')).toBeTruthy();
  });

  it('renders snack options', () => {
    const { getByText } = render(
      <FoodPreferencesModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText('Nuts')).toBeTruthy();
    expect(getByText('Yogurt')).toBeTruthy();
    expect(getByText('Protein Bars')).toBeTruthy();
  });
});
