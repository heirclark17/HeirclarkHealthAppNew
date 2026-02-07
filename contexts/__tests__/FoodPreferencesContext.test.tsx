import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock context
const FoodPreferencesContext = React.createContext<any>(undefined);

export function FoodPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = React.useState({
    dietaryPreferences: [],
    allergens: [],
    favoriteProteins: [],
    favoriteVegetables: [],
    favoriteFruits: [],
    favoriteStarches: [],
    favoriteSnacks: [],
    favoriteCuisines: [],
    hatedFoods: '',
    cookingSkill: '',
    mealStyle: '',
    mealDiversity: '',
    cheatDays: [],
  });

  const updatePreferences = async (updates: any) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  return (
    <FoodPreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </FoodPreferencesContext.Provider>
  );
}

export function useFoodPreferences() {
  const context = React.useContext(FoodPreferencesContext);
  if (!context) {
    throw new Error('useFoodPreferences must be used within a FoodPreferencesProvider');
  }
  return context;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FoodPreferencesProvider>{children}</FoodPreferencesProvider>
);

describe('FoodPreferencesContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useFoodPreferences(), { wrapper });

    expect(result.current.preferences.dietaryPreferences).toEqual([]);
    expect(result.current.preferences.allergens).toEqual([]);
  });

  it('updates preferences', async () => {
    const { result } = renderHook(() => useFoodPreferences(), { wrapper });

    await act(async () => {
      await result.current.updatePreferences({ dietaryPreferences: ['vegetarian'] });
    });

    expect(result.current.preferences.dietaryPreferences).toEqual(['vegetarian']);
  });

  it('updates favorite proteins', async () => {
    const { result } = renderHook(() => useFoodPreferences(), { wrapper });

    await act(async () => {
      await result.current.updatePreferences({ favoriteProteins: ['chicken', 'fish'] });
    });

    expect(result.current.preferences.favoriteProteins).toEqual(['chicken', 'fish']);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useFoodPreferences());
    }).toThrow('useFoodPreferences must be used within a FoodPreferencesProvider');
  });
});
