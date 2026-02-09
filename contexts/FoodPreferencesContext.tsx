import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const STORAGE_KEY = 'hc_food_preferences';
const SYNC_DEBOUNCE_MS = 2000; // Debounce backend sync to avoid excessive API calls

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
  isSyncing: boolean;

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
  syncToBackend: () => Promise<boolean>;
}

const FoodPreferencesContext = createContext<FoodPreferencesContextType | undefined>(undefined);

export function FoodPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<FoodPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSyncedFromBackend = useRef(false);

  // Sync preferences to backend (debounced)
  const syncToBackend = useCallback(async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      console.log('[FoodPreferences] 🔄 Syncing to backend...');
      const success = await api.saveFoodPreferences(preferences);
      if (success) {
        console.log('[FoodPreferences] ✅ Synced to backend');
      } else {
        console.warn('[FoodPreferences] ⚠️ Backend sync failed, local data preserved');
      }
      return success;
    } catch (error) {
      console.error('[FoodPreferences] ❌ Backend sync error:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [preferences]);

  // Debounced backend sync
  const debouncedSyncToBackend = useCallback((newPrefs: FoodPreferences) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        console.log('[FoodPreferences] 🔄 Debounced sync to backend...');
        const success = await api.saveFoodPreferences(newPrefs);
        if (success) {
          console.log('[FoodPreferences] ✅ Synced to backend');
        }
      } catch (error) {
        console.error('[FoodPreferences] Backend sync error:', error);
      } finally {
        setIsSyncing(false);
      }
    }, SYNC_DEBOUNCE_MS);
  }, []);

  // Load preferences from backend first, then fall back to local storage
  const loadPreferences = useCallback(async () => {
    try {
      // Try to load from backend first (if not already done)
      if (!hasSyncedFromBackend.current) {
        console.log('[FoodPreferences] 🔄 Loading from backend...');
        const backendPrefs = await api.getFoodPreferences();

        if (backendPrefs) {
          console.log('[FoodPreferences] ✅ Loaded from backend');
          const mergedPrefs = { ...defaultPreferences, ...backendPrefs };
          setPreferences(mergedPrefs);
          // Also save to local storage for offline access
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mergedPrefs));
          hasSyncedFromBackend.current = true;
          setIsLoaded(true);
          return;
        }
        console.log('[FoodPreferences] No backend data, checking local storage...');
      }

      // Fall back to local storage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
        console.log('[FoodPreferences] Loaded from local storage');

        // If we have local data but no backend data, sync to backend
        if (!hasSyncedFromBackend.current && parsed) {
          console.log('[FoodPreferences] Local data exists, syncing to backend...');
          setTimeout(async () => {
            await api.saveFoodPreferences({ ...defaultPreferences, ...parsed });
            hasSyncedFromBackend.current = true;
          }, 1000);
        }
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('[FoodPreferences] Error loading:', error);
      // Try local storage as final fallback
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
        }
      } catch (localError) {
        console.error('[FoodPreferences] Local storage fallback failed:', localError);
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadPreferences();

    // Cleanup timeout on unmount
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [loadPreferences]);

  // Save preferences to storage and sync to backend
  const savePreferences = useCallback(async (newPrefs: FoodPreferences) => {
    try {
      // Save to local storage immediately
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
      console.log('[FoodPreferences] Saved to local storage');

      // Debounced sync to backend
      debouncedSyncToBackend(newPrefs);
    } catch (error) {
      console.error('[FoodPreferences] Error saving:', error);
    }
  }, [debouncedSyncToBackend]);

  // Generic update function
  const updatePreferences = useCallback(async (updates: Partial<FoodPreferences>) => {
    console.log('[FoodPreferences] 🔍 updatePreferences called with:', updates);
    console.log('[FoodPreferences] 🔍 Current preferences before update:', preferences);
    const newPrefs = { ...preferences, ...updates };
    console.log('[FoodPreferences] 🔍 New preferences after merge:', newPrefs);
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
    // Also clear on backend by saving default preferences
    try {
      await api.saveFoodPreferences(defaultPreferences);
      console.log('[FoodPreferences] Cleared on backend');
    } catch (error) {
      console.error('[FoodPreferences] Error clearing on backend:', error);
    }
  }, []);

  const value = useMemo<FoodPreferencesContextType>(() => ({
    preferences,
    isLoaded,
    isSyncing,
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
    syncToBackend,
  }), [
    preferences,
    isLoaded,
    isSyncing,
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
    syncToBackend,
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
