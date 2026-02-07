/**
 * Restaurant Menu Context
 */

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RestaurantMenuState,
  SavedRestaurant,
  MenuItem,
  RESTAURANT_TIPS,
  HEALTHY_MODIFICATIONS,
} from '../types/restaurantMenu';
import { api } from '../services/api';

interface RestaurantMenuContextType {
  state: RestaurantMenuState;
  getRestaurantTips: (cuisine: string) => string[];
  getHealthyModifications: () => string[];
  saveRestaurant: (name: string, cuisine: string) => Promise<void>;
  addRecentSearch: (query: string) => Promise<void>;
  getRecentSearches: () => string[];
  analyzeMenu: (restaurantName: string, menuItems: any[], goals?: any) => Promise<any>;
}

const RestaurantMenuContext = createContext<RestaurantMenuContextType | undefined>(undefined);

const STORAGE_KEYS = {
  RECENT_SEARCHES: '@restaurant_recent_searches',
  SAVED_RESTAURANTS: '@restaurant_saved',
};

const defaultState: RestaurantMenuState = {
  recentSearches: [],
  savedRestaurants: [],
  favoriteItems: [],
  isLoading: false,
};

export function RestaurantMenuProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RestaurantMenuState>(defaultState);

  const loadData = useCallback(async () => {
    try {
      const [searches, saved] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_RESTAURANTS),
      ]);

      setState((prev) => ({
        ...prev,
        recentSearches: searches ? JSON.parse(searches) : [],
        savedRestaurants: saved ? JSON.parse(saved) : [],
      }));
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const getRestaurantTips = useCallback((cuisine: string): string[] => {
    const cuisineLower = cuisine.toLowerCase();
    const specificTips = RESTAURANT_TIPS[cuisineLower] || [];
    return [...specificTips, ...RESTAURANT_TIPS.general];
  }, []);

  const getHealthyModifications = useCallback((): string[] => {
    return HEALTHY_MODIFICATIONS;
  }, []);

  const saveRestaurant = useCallback(async (name: string, cuisine: string) => {
    const newRestaurant: SavedRestaurant = {
      id: `rest_${Date.now()}`,
      name,
      cuisine,
      lastVisited: new Date().toISOString().split('T')[0],
      favoriteItems: [],
    };

    const updated = [...state.savedRestaurants.filter((r) => r.name !== name), newRestaurant];
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_RESTAURANTS, JSON.stringify(updated));

    setState((prev) => ({
      ...prev,
      savedRestaurants: updated,
    }));
  }, [state.savedRestaurants]);

  const addRecentSearch = useCallback(async (query: string) => {
    const updated = [query, ...state.recentSearches.filter((s) => s !== query)].slice(0, 10);
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));

    setState((prev) => ({
      ...prev,
      recentSearches: updated,
    }));
  }, [state.recentSearches]);

  const getRecentSearches = useCallback((): string[] => {
    return state.recentSearches;
  }, [state.recentSearches]);

  const analyzeMenu = useCallback(async (restaurantName: string, menuItems: any[], goals?: any): Promise<any> => {
    try {
      console.log('[RestaurantMenu] Requesting AI menu analysis for:', restaurantName);
      const analysis = await api.analyzeRestaurantMenu(restaurantName, menuItems, goals);
      if (analysis) {
        // Cache the result locally
        const cacheKey = `@restaurant_analysis_${restaurantName.replace(/\s+/g, '_').toLowerCase()}`;
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ ...analysis, cachedAt: Date.now() }));
        console.log('[RestaurantMenu] AI analysis received and cached');
      }
      return analysis;
    } catch (error) {
      console.error('[RestaurantMenu] API analyze error:', error);
      // Try to return cached result
      try {
        const cacheKey = `@restaurant_analysis_${restaurantName.replace(/\s+/g, '_').toLowerCase()}`;
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          console.log('[RestaurantMenu] Returning cached analysis');
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        // ignore cache errors
      }
      return null;
    }
  }, []);

  const value = useMemo<RestaurantMenuContextType>(() => ({
    state,
    getRestaurantTips,
    getHealthyModifications,
    saveRestaurant,
    addRecentSearch,
    getRecentSearches,
    analyzeMenu,
  }), [
    state,
    getRestaurantTips,
    getHealthyModifications,
    saveRestaurant,
    addRecentSearch,
    getRecentSearches,
    analyzeMenu,
  ]);

  return (
    <RestaurantMenuContext.Provider value={value}>
      {children}
    </RestaurantMenuContext.Provider>
  );
}

export function useRestaurantMenu(): RestaurantMenuContextType {
  const context = useContext(RestaurantMenuContext);
  if (!context) {
    throw new Error('useRestaurantMenu must be used within a RestaurantMenuProvider');
  }
  return context;
}
