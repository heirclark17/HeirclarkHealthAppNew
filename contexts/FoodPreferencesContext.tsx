import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'hc_food_preferences';

export interface FoodPreferences {
  // Dietary preferences
  dietaryPreferences: string[]; // vegan, vegetarian, keto, etc.

  // Allergens
  allergens: string[]; // dairy, eggs, nuts, etc.

  // Favorite foods by category
  favoriteCuisines: string[]; // italian, mexican, etc.
  favoriteProteins: string[]; // chicken, beef, fish, tofu, etc.
  favoriteVegetables: string[]; // broccoli, spinach, etc.
  favoriteFruits: string[]; // apples, berries, etc.
  favoriteStarches: string[]; // rice, potatoes, pasta, etc.
  favoriteSnacks: string[]; // nuts, yogurt, fruit, etc.

  // Disliked/hated foods (critical for meal generation)
  hatedFoods: string; // comma-separated or free text

  // Meal structure preferences
  mealStyle: 'threePlusSnacks' | 'fewerLarger' | ''; // include snacks or not
  mealDiversity: 'diverse' | 'sameDaily' | ''; // variety vs meal prep
  cheatDays: string[]; // Monday, Tuesday, etc.

  // Cooking preferences
  cookingSkill: 'beginner' | 'intermediate' | 'advanced' | '';
}

const defaultPreferences: FoodPreferences = {
  dietaryPreferences: [],
  allergens: [],
  favoriteCuisines: [],
  favoriteProteins: [],
  favoriteVegetables: [],
  favoriteFruits: [],
  favoriteStarches: [],
  favoriteSnacks: [],
  hatedFoods: '',
  mealStyle: '',
  mealDiversity: '',
  cheatDays: [],
  cookingSkill: '',
};

interface FoodPreferencesContextType {
  preferences: FoodPreferences;
  isLoaded: boolean;

  // Update functions
  updatePreferences: (updates: Partial<FoodPreferences>) => Promise<void>;
  setDietaryPreferences: (diets: string[]) => Promise<void>;
  setAllergens: (allergens: string[]) => Promise<void>;
  setFavoriteCuisines: (cuisines: string[]) => Promise<void>;
  setFavoriteProteins: (proteins: string[]) => Promise<void>;
  setFavoriteVegetables: (vegetables: string[]) => Promise<void>;
  setFavoriteFruits: (fruits: string[]) => Promise<void>;
  setFavoriteStarches: (starches: string[]) => Promise<void>;
  setFavoriteSnacks: (snacks: string[]) => Promise<void>;
  setHatedFoods: (foods: string) => Promise<void>;
  setMealStyle: (style: 'threePlusSnacks' | 'fewerLarger' | '') => Promise<void>;
  setMealDiversity: (diversity: 'diverse' | 'sameDaily' | '') => Promise<void>;
  setCheatDays: (days: string[]) => Promise<void>;
  setCookingSkill: (skill: 'beginner' | 'intermediate' | 'advanced' | '') => Promise<void>;

  // Utility
  clearPreferences: () => Promise<void>;
  loadPreferences: () => Promise<void>;
}

const FoodPreferencesContext = createContext<FoodPreferencesContextType | undefined>(undefined);

export function FoodPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<FoodPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from storage on mount
  const loadPreferences = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
        console.log('[FoodPreferences] Loaded preferences:', parsed);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('[FoodPreferences] Error loading:', error);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Save preferences to storage
  const savePreferences = useCallback(async (newPrefs: FoodPreferences) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
      console.log('[FoodPreferences] Saved preferences');
    } catch (error) {
      console.error('[FoodPreferences] Error saving:', error);
    }
  }, []);

  // Generic update function
  const updatePreferences = useCallback(async (updates: Partial<FoodPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  // Specific setters for convenience
  const setDietaryPreferences = useCallback(async (diets: string[]) => {
    await updatePreferences({ dietaryPreferences: diets });
  }, [updatePreferences]);

  const setAllergens = useCallback(async (allergens: string[]) => {
    await updatePreferences({ allergens });
  }, [updatePreferences]);

  const setFavoriteCuisines = useCallback(async (cuisines: string[]) => {
    await updatePreferences({ favoriteCuisines: cuisines });
  }, [updatePreferences]);

  const setFavoriteProteins = useCallback(async (proteins: string[]) => {
    await updatePreferences({ favoriteProteins: proteins });
  }, [updatePreferences]);

  const setFavoriteVegetables = useCallback(async (vegetables: string[]) => {
    await updatePreferences({ favoriteVegetables: vegetables });
  }, [updatePreferences]);

  const setFavoriteFruits = useCallback(async (fruits: string[]) => {
    await updatePreferences({ favoriteFruits: fruits });
  }, [updatePreferences]);

  const setFavoriteStarches = useCallback(async (starches: string[]) => {
    await updatePreferences({ favoriteStarches: starches });
  }, [updatePreferences]);

  const setFavoriteSnacks = useCallback(async (snacks: string[]) => {
    await updatePreferences({ favoriteSnacks: snacks });
  }, [updatePreferences]);

  const setHatedFoods = useCallback(async (foods: string) => {
    await updatePreferences({ hatedFoods: foods });
  }, [updatePreferences]);

  const setMealStyle = useCallback(async (style: 'threePlusSnacks' | 'fewerLarger' | '') => {
    await updatePreferences({ mealStyle: style });
  }, [updatePreferences]);

  const setMealDiversity = useCallback(async (diversity: 'diverse' | 'sameDaily' | '') => {
    await updatePreferences({ mealDiversity: diversity });
  }, [updatePreferences]);

  const setCheatDays = useCallback(async (days: string[]) => {
    await updatePreferences({ cheatDays: days });
  }, [updatePreferences]);

  const setCookingSkill = useCallback(async (skill: 'beginner' | 'intermediate' | 'advanced' | '') => {
    await updatePreferences({ cookingSkill: skill });
  }, [updatePreferences]);

  const clearPreferences = useCallback(async () => {
    setPreferences(defaultPreferences);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<FoodPreferencesContextType>(() => ({
    preferences,
    isLoaded,
    updatePreferences,
    setDietaryPreferences,
    setAllergens,
    setFavoriteCuisines,
    setFavoriteProteins,
    setFavoriteVegetables,
    setFavoriteFruits,
    setFavoriteStarches,
    setFavoriteSnacks,
    setHatedFoods,
    setMealStyle,
    setMealDiversity,
    setCheatDays,
    setCookingSkill,
    clearPreferences,
    loadPreferences,
  }), [
    preferences,
    isLoaded,
    updatePreferences,
    setDietaryPreferences,
    setAllergens,
    setFavoriteCuisines,
    setFavoriteProteins,
    setFavoriteVegetables,
    setFavoriteFruits,
    setFavoriteStarches,
    setFavoriteSnacks,
    setHatedFoods,
    setMealStyle,
    setMealDiversity,
    setCheatDays,
    setCookingSkill,
    clearPreferences,
    loadPreferences,
  ]);

  return (
    <FoodPreferencesContext.Provider value={value}>
      {children}
    </FoodPreferencesContext.Provider>
  );
}

export function useFoodPreferences() {
  const context = useContext(FoodPreferencesContext);
  if (!context) {
    throw new Error('useFoodPreferences must be used within a FoodPreferencesProvider');
  }
  return context;
}

// Helper to safely use the hook (returns null if not in provider)
export function useFoodPreferencesSafe(): FoodPreferencesContextType | null {
  return useContext(FoodPreferencesContext) || null;
}
