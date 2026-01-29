// Smart Meal Logger Storage Service
// Handles persistence of frequent meals, patterns, and meal history

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FrequentMeal,
  MealPattern,
  MealLogHistory,
  SMART_MEAL_CONSTANTS,
} from '../types/smartMealLogger';

const { STORAGE_KEYS, MAX_FREQUENT_MEALS, MIN_LOGS_FOR_FREQUENT } = SMART_MEAL_CONSTANTS;

// Generate unique ID
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

class SmartMealLoggerStorage {
  // ============ FREQUENT MEALS ============

  /**
   * Get all frequent meals
   */
  async getFrequentMeals(): Promise<FrequentMeal[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.frequentMeals);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[SmartMealStorage] Error getting frequent meals:', error);
      return [];
    }
  }

  /**
   * Get frequent meals for a specific meal type
   */
  async getFrequentMealsByType(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): Promise<FrequentMeal[]> {
    const meals = await this.getFrequentMeals();
    return meals.filter(m => m.mealType === mealType);
  }

  /**
   * Get top N frequent meals sorted by log count
   */
  async getTopFrequentMeals(limit: number = 10): Promise<FrequentMeal[]> {
    const meals = await this.getFrequentMeals();
    return meals
      .sort((a, b) => b.logCount - a.logCount)
      .slice(0, limit);
  }

  /**
   * Add or update a frequent meal
   */
  async upsertFrequentMeal(mealData: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    imageUrl?: string;
    source: 'manual' | 'ai' | 'barcode' | 'photo';
  }): Promise<FrequentMeal> {
    const meals = await this.getFrequentMeals();
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dayOfWeek = now.getDay();

    // Find existing meal by name (case-insensitive) and type
    const existingIndex = meals.findIndex(
      m => m.name.toLowerCase() === mealData.name.toLowerCase() && m.mealType === mealData.mealType
    );

    let updatedMeal: FrequentMeal;

    if (existingIndex >= 0) {
      // Update existing meal
      const existing = meals[existingIndex];
      const newDayFrequency = [...existing.dayOfWeekFrequency];
      newDayFrequency[dayOfWeek] = (newDayFrequency[dayOfWeek] || 0) + 1;

      // Calculate new average time
      const [existingH, existingM] = existing.averageTime.split(':').map(Number);
      const [newH, newM] = currentTime.split(':').map(Number);
      const existingMinutes = existingH * 60 + existingM;
      const newMinutes = newH * 60 + newM;
      const avgMinutes = Math.round((existingMinutes * existing.logCount + newMinutes) / (existing.logCount + 1));
      const avgHours = Math.floor(avgMinutes / 60);
      const avgMins = avgMinutes % 60;
      const newAvgTime = `${avgHours.toString().padStart(2, '0')}:${avgMins.toString().padStart(2, '0')}`;

      updatedMeal = {
        ...existing,
        logCount: existing.logCount + 1,
        lastLogged: now.toISOString(),
        averageTime: newAvgTime,
        dayOfWeekFrequency: newDayFrequency,
        // Update macros to latest (or could average them)
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        imageUrl: mealData.imageUrl || existing.imageUrl,
        updatedAt: now.toISOString(),
      };

      meals[existingIndex] = updatedMeal;
    } else {
      // Create new frequent meal
      const newDayFrequency = [0, 0, 0, 0, 0, 0, 0];
      newDayFrequency[dayOfWeek] = 1;

      updatedMeal = {
        id: generateId(),
        name: mealData.name,
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        mealType: mealData.mealType,
        logCount: 1,
        lastLogged: now.toISOString(),
        averageTime: currentTime,
        dayOfWeekFrequency: newDayFrequency,
        imageUrl: mealData.imageUrl,
        source: mealData.source,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      meals.push(updatedMeal);
    }

    // Trim to max frequent meals (keep most logged)
    const trimmedMeals = meals
      .sort((a, b) => b.logCount - a.logCount)
      .slice(0, MAX_FREQUENT_MEALS);

    await AsyncStorage.setItem(STORAGE_KEYS.frequentMeals, JSON.stringify(trimmedMeals));
    return updatedMeal;
  }

  /**
   * Delete a frequent meal
   */
  async deleteFrequentMeal(mealId: string): Promise<void> {
    const meals = await this.getFrequentMeals();
    const filtered = meals.filter(m => m.id !== mealId);
    await AsyncStorage.setItem(STORAGE_KEYS.frequentMeals, JSON.stringify(filtered));
  }

  /**
   * Search frequent meals by name
   */
  async searchFrequentMeals(query: string): Promise<FrequentMeal[]> {
    const meals = await this.getFrequentMeals();
    const lowerQuery = query.toLowerCase();
    return meals.filter(m => m.name.toLowerCase().includes(lowerQuery));
  }

  // ============ MEAL PATTERNS ============

  /**
   * Get all meal patterns
   */
  async getMealPatterns(): Promise<MealPattern[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.mealPatterns);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[SmartMealStorage] Error getting meal patterns:', error);
      return [];
    }
  }

  /**
   * Update meal patterns based on logging behavior
   */
  async updateMealPatterns(
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    frequentMealId: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number
  ): Promise<void> {
    const patterns = await this.getMealPatterns();
    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay();

    // Determine time range for this meal type
    const timeRanges = SMART_MEAL_CONSTANTS.MEAL_TIME_RANGES;
    const timeRange = timeRanges[mealType];

    // Find or create pattern for this meal type and day
    const patternKey = `${mealType}_${dayOfWeek}`;
    let patternIndex = patterns.findIndex(p => p.id === patternKey);

    if (patternIndex >= 0) {
      const existing = patterns[patternIndex];
      const newLogCount = existing.logCount + 1;

      // Update averages
      patterns[patternIndex] = {
        ...existing,
        frequentMealIds: [...new Set([...existing.frequentMealIds, frequentMealId])],
        averageCalories: Math.round((existing.averageCalories * existing.logCount + calories) / newLogCount),
        averageProtein: Math.round((existing.averageProtein * existing.logCount + protein) / newLogCount),
        averageCarbs: Math.round((existing.averageCarbs * existing.logCount + carbs) / newLogCount),
        averageFat: Math.round((existing.averageFat * existing.logCount + fat) / newLogCount),
        logCount: newLogCount,
      };
    } else {
      // Create new pattern
      patterns.push({
        id: patternKey,
        mealType,
        timeRange,
        dayOfWeek,
        frequentMealIds: [frequentMealId],
        averageCalories: calories,
        averageProtein: protein,
        averageCarbs: carbs,
        averageFat: fat,
        logCount: 1,
      });
    }

    await AsyncStorage.setItem(STORAGE_KEYS.mealPatterns, JSON.stringify(patterns));
  }

  // ============ MEAL LOG HISTORY ============

  /**
   * Get recent meal log history
   */
  async getMealLogHistory(days: number = 30): Promise<MealLogHistory[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.mealLogHistory);
      if (!data) return [];

      const history: MealLogHistory[] = JSON.parse(data);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return history.filter(h => new Date(h.date) >= cutoffDate);
    } catch (error) {
      console.error('[SmartMealStorage] Error getting meal log history:', error);
      return [];
    }
  }

  /**
   * Add a meal to log history
   */
  async addToLogHistory(meal: {
    name: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }): Promise<void> {
    const history = await this.getMealLogHistory(60); // Keep 60 days
    const now = new Date();

    const newEntry: MealLogHistory = {
      id: generateId(),
      date: now.toISOString().split('T')[0],
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      mealType: meal.mealType,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    };

    history.push(newEntry);

    // Keep only last 60 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);
    const trimmedHistory = history.filter(h => new Date(h.date) >= cutoffDate);

    await AsyncStorage.setItem(STORAGE_KEYS.mealLogHistory, JSON.stringify(trimmedHistory));
  }

  /**
   * Get meals logged on a specific day of the week
   */
  async getMealsForDayOfWeek(dayOfWeek: number): Promise<MealLogHistory[]> {
    const history = await this.getMealLogHistory(90);
    return history.filter(h => new Date(h.date).getDay() === dayOfWeek);
  }

  // ============ SYNC ============

  /**
   * Get last sync date
   */
  async getLastSyncDate(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.lastSync);
    } catch {
      return null;
    }
  }

  /**
   * Update last sync date
   */
  async updateLastSyncDate(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.lastSync, new Date().toISOString());
  }

  /**
   * Clear all smart meal logger data
   */
  async clearAllData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.frequentMeals),
      AsyncStorage.removeItem(STORAGE_KEYS.mealPatterns),
      AsyncStorage.removeItem(STORAGE_KEYS.mealLogHistory),
      AsyncStorage.removeItem(STORAGE_KEYS.lastSync),
    ]);
  }
}

export const smartMealLoggerStorage = new SmartMealLoggerStorage();
