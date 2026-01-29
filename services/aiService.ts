// Heirclark AI Service - Backend Proxy Integration
// Proxies AI requests through backend to keep API keys secure

// Use local backend for development with GPT-4.1-mini
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NutritionVerificationResult } from '../types/nutritionAccuracy';
import { verifyNutritionData, quickValidate } from './nutritionAccuracyService';
import {
  AIWeeklyMealPlan,
  AIWorkoutPlan,
  MealPlanPreferences,
  WorkoutPlanPreferences,
  CoachMessage,
  CoachContext,
  CoachResponse,
  SavedMeal,
  AIMeal,
  AI_CONSTANTS,
} from '../types/ai';

// Storage keys
const STORAGE_KEYS = {
  SAVED_MEALS: 'hc_saved_meals',
  MEAL_PLAN_CACHE: 'hc_meal_plan_cache',
  WORKOUT_PLAN_CACHE: 'hc_workout_plan_cache',
  COACH_HISTORY: 'hc_coach_history',
};

export interface NutritionAnalysis {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: string;
  foods: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  suggestions?: string[];
  imageUrl?: string;
  // Nutrition Accuracy Agent verification
  verification?: NutritionVerificationResult;
  isVerified?: boolean;
}

class AIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Add nutrition verification to analysis result (Nutrition Accuracy Agent)
   */
  private async addVerification(
    analysis: NutritionAnalysis,
    sourceType: 'ai_estimate' | 'barcode' | 'user_input' = 'ai_estimate'
  ): Promise<NutritionAnalysis> {
    try {
      // Quick validation first (no API calls)
      const quickResult = quickValidate({
        name: analysis.mealName,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fat: analysis.fat,
      });

      // If quick validation shows issues or confidence is not high, do full verification
      if (!quickResult.isValid || analysis.confidence !== 'high') {
        const verification = await verifyNutritionData({
          name: analysis.mealName,
          calories: analysis.calories,
          protein: analysis.protein,
          carbs: analysis.carbs,
          fat: analysis.fat,
        }, sourceType);

        return {
          ...analysis,
          verification,
          isVerified: verification.isVerified,
        };
      }

      // Quick validation passed, return with basic verification
      return {
        ...analysis,
        isVerified: true,
      };
    } catch (error) {
      console.warn('[AIService] Verification failed:', error);
      return analysis; // Return original if verification fails
    }
  }

  // Analyze meal description text via backend proxy
  async analyzeMealText(description: string): Promise<NutritionAnalysis | null> {
    try {
      console.log('[AIService] Analyzing meal text:', description);
      console.log('[AIService] Backend URL:', `${this.baseUrl}/api/v1/nutrition/ai/meal-from-text`);

      const response = await fetch(`${this.baseUrl}/api/v1/nutrition/ai/meal-from-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Customer-Id': 'guest_ios_app',
        },
        body: JSON.stringify({
          text: description,
          shopifyCustomerId: 'guest_ios_app',
        }),
      });

      console.log('[AIService] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIService] Backend AI text analysis error:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('[AIService] Response data:', JSON.stringify(data, null, 2));

      // Transform Railway backend response to our format
      // Railway returns data at root level with {ok: true, calories, protein, ...}
      if (data.ok && data.calories !== undefined) {
        const analysis: NutritionAnalysis = {
          mealName: data.mealName || data.name || 'Meal',
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          confidence: typeof data.confidence === 'number' ?
            (data.confidence > 0.7 ? 'high' : data.confidence > 0.4 ? 'medium' : 'low') :
            (data.confidence || 'medium'),
          foods: data.foods || [],
          suggestions: data.suggestions || data.healthierSwaps || data.swaps || [],
        };
        // Add nutrition verification (Nutrition Accuracy Agent)
        return this.addVerification(analysis, 'ai_estimate');
      }

      // Fallback for different response format (analysis nested)
      if (data.analysis) {
        const analysis: NutritionAnalysis = {
          mealName: data.analysis.mealName || data.analysis.name || 'Meal',
          calories: data.analysis.calories || 0,
          protein: data.analysis.protein || 0,
          carbs: data.analysis.carbs || 0,
          fat: data.analysis.fat || 0,
          confidence: data.analysis.confidence || 'medium',
          foods: data.analysis.foods || [],
          suggestions: data.analysis.suggestions || data.analysis.swaps || [],
        };
        // Add nutrition verification (Nutrition Accuracy Agent)
        return this.addVerification(analysis, 'ai_estimate');
      }

      console.warn('[AIService] No valid nutrition data in response');
      return null;
    } catch (error) {
      console.error('[AIService] AI meal text analysis error:', error);
      return null;
    }
  }

  // Analyze meal photo via backend proxy - accepts either base64 or file URI
  async analyzeMealPhoto(imageData: string, mimeType: string = 'image/jpeg'): Promise<NutritionAnalysis | null> {
    try {
      const isFileUri = imageData.startsWith('file://') || imageData.startsWith('content://');
      console.log('[AIService] Analyzing photo, isFileUri:', isFileUri, 'data length:', imageData.length);

      const formData = new FormData();

      if (isFileUri) {
        // File URI - React Native can handle this directly
        formData.append('photo', {
          uri: imageData,
          type: mimeType,
          name: 'meal.jpg',
        } as any);
      } else {
        // Base64 - send as data URI for React Native FormData
        formData.append('photo', {
          uri: `data:${mimeType};base64,${imageData}`,
          type: mimeType,
          name: 'meal.jpg',
        } as any);
      }

      formData.append('shopifyCustomerId', 'guest_ios_app');

      const apiResponse = await fetch(`${this.baseUrl}/api/v1/nutrition/ai/meal-from-photo`, {
        method: 'POST',
        headers: {
          'X-Shopify-Customer-Id': 'guest_ios_app',
        },
        body: formData,
      });

      if (!apiResponse.ok) {
        console.error('Backend AI photo analysis error:', apiResponse.status);
        return null;
      }

      const data = await apiResponse.json();
      console.log('[AIService] Photo analysis response:', JSON.stringify(data, null, 2));

      // Transform Railway backend response to our format
      // Railway returns data at root level with {ok: true, calories, protein, ...}
      if (data.ok && data.calories !== undefined) {
        const analysis: NutritionAnalysis = {
          mealName: data.mealName || data.name || 'Meal',
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          confidence: typeof data.confidence === 'number' ?
            (data.confidence > 0.7 ? 'high' : data.confidence > 0.4 ? 'medium' : 'low') :
            (data.confidence || 'medium'),
          foods: data.foods || [],
          suggestions: data.suggestions || data.healthierSwaps || data.swaps || [],
        };
        // Add nutrition verification (Nutrition Accuracy Agent)
        return this.addVerification(analysis, 'ai_estimate');
      }

      // Fallback for different response format (analysis nested)
      if (data.analysis) {
        const analysis: NutritionAnalysis = {
          mealName: data.analysis.mealName || data.analysis.name || 'Meal',
          calories: data.analysis.calories || 0,
          protein: data.analysis.protein || 0,
          carbs: data.analysis.carbs || 0,
          fat: data.analysis.fat || 0,
          confidence: data.analysis.confidence || 'medium',
          foods: data.analysis.foods || [],
          suggestions: data.analysis.suggestions || data.analysis.swaps || [],
        };
        // Add nutrition verification (Nutrition Accuracy Agent)
        return this.addVerification(analysis, 'ai_estimate');
      }

      console.warn('[AIService] No valid nutrition data in photo response');
      return null;
    } catch (error) {
      console.error('AI meal photo analysis error:', error);
      return null;
    }
  }

  // Lookup barcode from food database API
  async lookupBarcode(barcode: string): Promise<NutritionAnalysis | null> {
    try {
      // Use Open Food Facts API (free, no key required)
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);

      if (!response.ok) {
        console.error('Barcode lookup failed');
        return null;
      }

      const data = await response.json();

      if (data.status === 0) {
        // Product not found
        return null;
      }

      const product = data.product;
      const nutriments = product.nutriments || {};

      // Convert per 100g to per serving if serving size available
      const servingSize = product.serving_quantity || 100;
      const multiplier = servingSize / 100;

      // Get product image URL (Open Food Facts provides multiple image options)
      const imageUrl = product.image_front_url ||
                       product.image_url ||
                       product.image_front_small_url ||
                       product.image_small_url ||
                       null;

      console.log('[AIService] Barcode product image:', imageUrl);

      const analysis: NutritionAnalysis = {
        mealName: product.product_name || 'Unknown Product',
        calories: Math.round((nutriments['energy-kcal_100g'] || 0) * multiplier),
        protein: Math.round((nutriments.proteins_100g || 0) * multiplier),
        carbs: Math.round((nutriments.carbohydrates_100g || 0) * multiplier),
        fat: Math.round((nutriments.fat_100g || 0) * multiplier),
        confidence: 'high',
        foods: [
          {
            name: product.product_name || 'Unknown Product',
            portion: `${servingSize}g`,
            calories: Math.round((nutriments['energy-kcal_100g'] || 0) * multiplier),
            protein: Math.round((nutriments.proteins_100g || 0) * multiplier),
            carbs: Math.round((nutriments.carbohydrates_100g || 0) * multiplier),
            fat: Math.round((nutriments.fat_100g || 0) * multiplier),
          },
        ],
        imageUrl: imageUrl,
      };
      // Add nutrition verification (Nutrition Accuracy Agent) - barcode data is usually reliable
      return this.addVerification(analysis, 'barcode');
    } catch (error) {
      console.error('Barcode lookup error:', error);
      return null;
    }
  }

  // Generate a food image using OpenAI DALL-E via backend
  async generateFoodImage(mealName: string): Promise<string | null> {
    try {
      console.log('[AIService] Generating food image for:', mealName);

      const response = await fetch(`${this.baseUrl}/api/v1/nutrition/ai/generate-food-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Customer-Id': 'guest_ios_app',
        },
        body: JSON.stringify({
          mealName,
          shopifyCustomerId: 'guest_ios_app',
        }),
      });

      console.log('[AIService] Food image response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[AIService] Food image result:', data.imageUrl);
        return data.imageUrl || null;
      }

      return null;
    } catch (error) {
      console.error('[AIService] Food image generation error:', error);
      return null;
    }
  }

  // Transcribe voice audio to text using Whisper API
  async transcribeVoice(audioUri: string): Promise<string | null> {
    try {
      console.log('[AIService] Transcribing voice audio:', audioUri);

      // Create form data with audio file - use React Native FormData format
      const formData = new FormData();

      // Append audio file using React Native's file URI format (same as photo upload)
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('shopifyCustomerId', 'guest_ios_app');

      // Send to backend transcription endpoint
      const apiResponse = await fetch(`${this.baseUrl}/api/v1/nutrition/ai/transcribe-voice`, {
        method: 'POST',
        headers: {
          'X-Shopify-Customer-Id': 'guest_ios_app',
        },
        body: formData,
      });

      console.log('[AIService] Transcription response status:', apiResponse.status);

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('[AIService] Transcription error:', apiResponse.status, errorText);
        return null;
      }

      const data = await apiResponse.json();
      console.log('[AIService] Transcription result:', JSON.stringify(data, null, 2));

      // Railway backend may return {ok: true, text: "..."} or {text: "..."}
      return data.text || data.transcription || null;
    } catch (error) {
      console.error('[AIService] Voice transcription error:', error);
      return null;
    }
  }

  // ============================================================================
  // AI Meal Plan Generation
  // ============================================================================

  /**
   * Generate AI-powered meal plan based on user preferences
   */
  async generateAIMealPlan(preferences: MealPlanPreferences, days: number = 7): Promise<AIWeeklyMealPlan | null> {
    try {
      console.log('[AIService] Generating AI meal plan with preferences:', preferences);

      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-meal-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Customer-Id': 'guest_ios_app',
        },
        body: JSON.stringify({
          preferences,
          days,
          shopifyCustomerId: 'guest_ios_app',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIService] Meal plan generation error:', response.status, errorText);
        console.error('[AIService] Request URL:', `${this.baseUrl}/api/v1/ai/generate-meal-plan`);
        return null;
      }

      const data = await response.json();
      console.log('[AIService] Meal plan response:', JSON.stringify(data).substring(0, 200));

      if (data.ok && data.plan) {
        // Cache the plan
        await this.cacheMealPlan(data.plan);
        return data.plan;
      }

      console.error('[AIService] Unexpected response structure:', data);
      return null;
    } catch (error) {
      console.error('[AIService] generateAIMealPlan error:', error);
      return null;
    }
  }

  /**
   * Cache meal plan to AsyncStorage
   */
  private async cacheMealPlan(plan: AIWeeklyMealPlan): Promise<void> {
    try {
      const cacheData = {
        plan,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + AI_CONSTANTS.MEAL_PLAN_CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.MEAL_PLAN_CACHE, JSON.stringify(cacheData));
    } catch (error) {
      console.error('[AIService] Error caching meal plan:', error);
    }
  }

  /**
   * Get cached meal plan if still valid
   */
  async getCachedMealPlan(): Promise<AIWeeklyMealPlan | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.MEAL_PLAN_CACHE);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      if (new Date(cacheData.expiresAt) < new Date()) {
        await AsyncStorage.removeItem(STORAGE_KEYS.MEAL_PLAN_CACHE);
        return null;
      }

      return cacheData.plan;
    } catch (error) {
      console.error('[AIService] Error getting cached meal plan:', error);
      return null;
    }
  }

  // ============================================================================
  // AI Workout Plan Generation
  // ============================================================================

  /**
   * Generate AI-powered workout plan based on user preferences
   */
  async generateAIWorkoutPlan(preferences: WorkoutPlanPreferences, weeks: number = 4): Promise<AIWorkoutPlan | null> {
    try {
      console.log('[AIService] Generating AI workout plan with preferences:', preferences);

      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-workout-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Customer-Id': 'guest_ios_app',
        },
        body: JSON.stringify({
          preferences,
          weeks,
          shopifyCustomerId: 'guest_ios_app',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIService] Workout plan generation error:', response.status, errorText);
        return null;
      }

      const data = await response.json();

      if (data.ok && data.plan) {
        // Cache the plan
        await this.cacheWorkoutPlan(data.plan);
        return data.plan;
      }

      return null;
    } catch (error) {
      console.error('[AIService] generateAIWorkoutPlan error:', error);
      return null;
    }
  }

  /**
   * Cache workout plan to AsyncStorage
   */
  private async cacheWorkoutPlan(plan: AIWorkoutPlan): Promise<void> {
    try {
      const cacheData = {
        plan,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + AI_CONSTANTS.WORKOUT_PLAN_CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PLAN_CACHE, JSON.stringify(cacheData));
    } catch (error) {
      console.error('[AIService] Error caching workout plan:', error);
    }
  }

  /**
   * Get cached workout plan if still valid
   */
  async getCachedWorkoutPlan(): Promise<AIWorkoutPlan | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_PLAN_CACHE);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      if (new Date(cacheData.expiresAt) < new Date()) {
        await AsyncStorage.removeItem(STORAGE_KEYS.WORKOUT_PLAN_CACHE);
        return null;
      }

      return cacheData.plan;
    } catch (error) {
      console.error('[AIService] Error getting cached workout plan:', error);
      return null;
    }
  }

  // ============================================================================
  // AI Coach Chat
  // ============================================================================

  /**
   * Send message to AI coach and get response
   */
  async sendCoachMessage(message: string, context: CoachContext): Promise<CoachResponse | null> {
    try {
      console.log('[AIService] Sending coach message:', message, 'mode:', context.mode);

      const response = await fetch(`${this.baseUrl}/api/v1/ai/coach-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Customer-Id': 'guest_ios_app',
        },
        body: JSON.stringify({
          message,
          context,
          shopifyCustomerId: 'guest_ios_app',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIService] Coach message error:', response.status, errorText);
        return null;
      }

      const data = await response.json();

      if (data.ok && data.response) {
        return data.response;
      }

      return null;
    } catch (error) {
      console.error('[AIService] sendCoachMessage error:', error);
      return null;
    }
  }

  /**
   * Get coach conversation history
   */
  async getCoachHistory(mode: string): Promise<CoachMessage[]> {
    try {
      const key = `${STORAGE_KEYS.COACH_HISTORY}_${mode}`;
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return [];

      const messages: CoachMessage[] = JSON.parse(stored);
      // Keep only recent messages
      return messages.slice(-AI_CONSTANTS.MAX_COACH_HISTORY);
    } catch (error) {
      console.error('[AIService] Error getting coach history:', error);
      return [];
    }
  }

  /**
   * Save coach message to history
   */
  async saveCoachMessage(message: CoachMessage, mode: string): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.COACH_HISTORY}_${mode}`;
      const history = await this.getCoachHistory(mode);
      history.push(message);

      // Trim to max history
      const trimmed = history.slice(-AI_CONSTANTS.MAX_COACH_HISTORY);
      await AsyncStorage.setItem(key, JSON.stringify(trimmed));
    } catch (error) {
      console.error('[AIService] Error saving coach message:', error);
    }
  }

  /**
   * Clear coach conversation history
   */
  async clearCoachHistory(mode: string): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.COACH_HISTORY}_${mode}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[AIService] Error clearing coach history:', error);
    }
  }

  // ============================================================================
  // Saved Meals Management
  // ============================================================================

  /**
   * Get all saved meals
   */
  async getSavedMeals(): Promise<SavedMeal[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_MEALS);
      if (!stored) return [];

      const meals: SavedMeal[] = JSON.parse(stored);
      return meals;
    } catch (error) {
      console.error('[AIService] Error getting saved meals:', error);
      return [];
    }
  }

  /**
   * Save a meal to favorites
   */
  async saveMeal(meal: AIMeal, source: 'ai' | 'template' | 'custom' = 'ai'): Promise<SavedMeal | null> {
    try {
      const savedMeals = await this.getSavedMeals();

      // Check if meal already exists
      const exists = savedMeals.find(m => m.meal.id === meal.id);
      if (exists) {
        console.log('[AIService] Meal already saved:', meal.id);
        return exists;
      }

      // Enforce max saved meals limit
      if (savedMeals.length >= AI_CONSTANTS.MAX_SAVED_MEALS) {
        // Remove oldest non-favorite meal
        const nonFavorites = savedMeals.filter(m => !m.isFavorite);
        if (nonFavorites.length > 0) {
          const oldest = nonFavorites[0];
          await this.removeSavedMeal(oldest.id);
        } else {
          console.warn('[AIService] Cannot save more meals, all are favorites');
          return null;
        }
      }

      const savedMeal: SavedMeal = {
        id: `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        meal,
        savedAt: new Date().toISOString(),
        source,
        isFavorite: false,
        timesUsed: 0,
      };

      savedMeals.push(savedMeal);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(savedMeals));

      return savedMeal;
    } catch (error) {
      console.error('[AIService] Error saving meal:', error);
      return null;
    }
  }

  /**
   * Remove a saved meal
   */
  async removeSavedMeal(savedMealId: string): Promise<boolean> {
    try {
      const savedMeals = await this.getSavedMeals();
      const filtered = savedMeals.filter(m => m.id !== savedMealId);

      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('[AIService] Error removing saved meal:', error);
      return false;
    }
  }

  /**
   * Toggle favorite status of a saved meal
   */
  async toggleFavoriteMeal(savedMealId: string): Promise<boolean> {
    try {
      const savedMeals = await this.getSavedMeals();
      const mealIndex = savedMeals.findIndex(m => m.id === savedMealId);

      if (mealIndex === -1) return false;

      savedMeals[mealIndex].isFavorite = !savedMeals[mealIndex].isFavorite;
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(savedMeals));
      return true;
    } catch (error) {
      console.error('[AIService] Error toggling favorite:', error);
      return false;
    }
  }

  /**
   * Get saved meals by meal type
   */
  async getSavedMealsByType(mealType: string): Promise<SavedMeal[]> {
    try {
      const savedMeals = await this.getSavedMeals();
      return savedMeals.filter(m => m.meal.mealType === mealType);
    } catch (error) {
      console.error('[AIService] Error getting meals by type:', error);
      return [];
    }
  }

  /**
   * Get favorite meals only
   */
  async getFavoriteMeals(): Promise<SavedMeal[]> {
    try {
      const savedMeals = await this.getSavedMeals();
      return savedMeals.filter(m => m.isFavorite);
    } catch (error) {
      console.error('[AIService] Error getting favorite meals:', error);
      return [];
    }
  }

  /**
   * Increment times used counter for a meal
   */
  async incrementMealUsage(savedMealId: string): Promise<void> {
    try {
      const savedMeals = await this.getSavedMeals();
      const mealIndex = savedMeals.findIndex(m => m.id === savedMealId);

      if (mealIndex !== -1) {
        savedMeals[mealIndex].timesUsed += 1;
        savedMeals[mealIndex].lastUsed = new Date().toISOString();
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(savedMeals));
      }
    } catch (error) {
      console.error('[AIService] Error incrementing meal usage:', error);
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
