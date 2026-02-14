// Heirclark AI Service - Backend Proxy Integration
// Proxies AI requests through backend to keep API keys secure

// Railway Backend for AI endpoints
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://heirclarkinstacartbackend-production.up.railway.app';
const AUTH_TOKEN_KEY = 'heirclark_auth_token';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { NutritionVerificationResult } from '../types/nutritionAccuracy';
import { verifyNutritionData, quickValidate } from './nutritionAccuracyService';
import { api } from './api';
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
  CheatDayGuidance,
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
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.loadAuthToken();
  }

  // Load auth token from storage
  private async loadAuthToken() {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.warn('[AIService] Failed to load auth token:', error);
    }
  }

  // Get common headers for requests
  private async getHeaders(): Promise<HeadersInit> {
    // Ensure auth token is loaded before getting headers
    if (!this.authToken) {
      await this.loadAuthToken();
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      // Send app version for backend version checking
      'X-App-Version': Constants.expoConfig?.version || '1.0.0',
      'X-App-Build-Number': Constants.expoConfig?.ios?.buildNumber || '1',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
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
        headers: await this.getHeaders(),
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
        headers: this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {},
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
        headers: await this.getHeaders(),
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
        headers: this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {},
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
  // Recipe Details Fetching
  // ============================================================================

  /**
   * Fetch detailed recipe (ingredients + instructions) for a meal
   * This is used when AI-generated meals need recipe details on-demand
   */
  async getRecipeDetails(dishName: string, mealType?: string, calories?: number, macros?: { protein: number; carbs: number; fat: number }): Promise<{
    ingredients: Array<{ name: string; quantity: number; unit: string }>;
    instructions: string[];
    prepMinutes: number;
    cookMinutes: number;
    tips?: string;
  } | null> {
    try {
      console.log('[AIService] Fetching recipe details for:', dishName);

      const response = await fetch(`${this.baseUrl}/api/v1/ai/recipe-details`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({
          dishName,
          mealType,
          calories,
          macros,
          shopifyCustomerId: 'guest_ios_app',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIService] Recipe details error:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('[AIService] Recipe details response:', JSON.stringify(data).substring(0, 500));

      // Handle multiple response formats
      if (data.ok && data.recipe) {
        return data.recipe;
      }

      // Handle success: true format
      if (data.success && data.recipe) {
        return data.recipe;
      }

      // Handle direct recipe data (no wrapper)
      if (data.ingredients && Array.isArray(data.ingredients)) {
        return {
          ingredients: data.ingredients,
          instructions: Array.isArray(data.instructions) ? data.instructions : [],
          prepMinutes: data.prepMinutes || data.prepTime || 15,
          cookMinutes: data.cookMinutes || data.cookTime || 20,
          tips: data.tips,
        };
      }

      console.log('[AIService] Recipe details - unrecognized response format:', Object.keys(data));
      return null;
    } catch (error) {
      console.error('[AIService] getRecipeDetails error:', error);
      return null;
    }
  }

  // ============================================================================
  // AI Meal Plan Generation
  // ============================================================================

  /**
   * Generate AI-powered meal plan based on user preferences
   * Includes timeout handling for better network reliability
   */
  async generateAIMealPlan(preferences: MealPlanPreferences, days: number = 7): Promise<AIWeeklyMealPlan | null> {
    const TIMEOUT_MS = 360000; // 6 minute timeout for AI generation (handles OpenAI API delays, cold starts, and complex meal plans)

    try {
      console.log('[AIService] Generating AI meal plan with preferences:', JSON.stringify(preferences, null, 2));
      console.log('[AIService] Backend URL:', this.baseUrl);

      // Create an abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-meal-plan`, {
          method: 'POST',
          headers: await this.getHeaders(),
          body: JSON.stringify({
            preferences,
            days,
            shopifyCustomerId: 'guest_ios_app',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AIService] Meal plan generation error:', response.status, errorText);
          console.error('[AIService] Request URL:', `${this.baseUrl}/api/v1/ai/generate-meal-plan`);
          return null;
        }

        const data = await response.json();
        console.log('[AIService] Meal plan response (first 300 chars):', JSON.stringify(data).substring(0, 300));

        // Handle different response formats from Railway backend
        if (data.success && (data.weeklyPlan || data.mealPlan)) {
          // Railway backend format: { success: true, weeklyPlan: [...] } or { success: true, mealPlan: [...] }
          const mealPlanData = data.weeklyPlan || data.mealPlan;

          // Validate that mealPlanData is an array
          if (!Array.isArray(mealPlanData)) {
            console.error('[AIService] Invalid meal plan data structure - not an array:', typeof mealPlanData);
            return null;
          }

          const plan: AIWeeklyMealPlan = {
            days: mealPlanData.map((day: any, index: number) => {
              // Validate day structure
              if (!day || typeof day !== 'object') {
                console.error('[AIService] Invalid day structure at index', index, ':', day);
                throw new Error('Invalid meal plan day structure');
              }

              // Ensure meals is an array
              const dayMeals = day.meals;
              if (!Array.isArray(dayMeals)) {
                console.warn('[AIService] Day', day.dayName, 'has invalid meals:', typeof dayMeals);
                // If meals is missing/invalid, default to empty array
                day.meals = [];
              }

              return {
                dayName: day.dayName,
                dayIndex: day.dayIndex,
                isCheatDay: day.isCheatDay || false,
                cheatDayAdvice: day.cheatDayAdvice || null,
                // Handle cheat days that don't have meals
                meals: day.isCheatDay ? [] : (day.meals || []).map((meal: any) => ({
                  mealType: meal.mealType,
                  name: meal.name || meal.dishName,
                  description: meal.description || '',
                  calories: meal.calories || 0,
                  protein: meal.protein || meal.macros?.protein || 0,
                  carbs: meal.carbs || meal.macros?.carbs || 0,
                  fat: meal.fat || meal.macros?.fat || 0,
                  servings: meal.servings || 1,
                  prepTime: meal.prepTime || meal.prepMinutes || 15,
                  cookTime: meal.cookTime || meal.cookMinutes || 20,
                  imageUrl: meal.imageUrl,
                  // Map ingredients from backend format
                  ingredients: (meal.ingredients || []).map((ing: any) => ({
                    name: ing.name,
                    amount: ing.amount || ing.quantity || '',
                    unit: ing.unit || '',
                    calories: ing.calories,
                  })),
                  instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
                })),
              };
            }),
            generatedAt: data.generatedAt || new Date().toISOString(),
          };
          await this.cacheMealPlan(plan);
          return plan;
        }

        if (data.ok && data.plan) {
          // Legacy format: { ok: true, plan: {...} }
          await this.cacheMealPlan(data.plan);
          return data.plan;
        }

        console.error('[AIService] Unexpected response structure:', Object.keys(data));
        return null;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          console.error('[AIService] Meal plan generation timed out after', TIMEOUT_MS, 'ms');
          return null;
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('[AIService] generateAIMealPlan error:', error.message || error);
      console.error('[AIService] Error type:', error.name);
      // Log additional network details for debugging
      if (error.message?.includes('Network request failed')) {
        console.error('[AIService] Network error - possible causes:');
        console.error('  1. Backend server not reachable at:', this.baseUrl);
        console.error('  2. No internet connection');
        console.error('  3. Request blocked by firewall/proxy');
      }
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
    const TIMEOUT_MS = 300000; // 5 minute timeout (matches Railway backend timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      console.log('[AIService] Generating AI workout plan with preferences:', preferences);

      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-workout-plan`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({
          preferences,
          weeks,
          shopifyCustomerId: 'guest_ios_app',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.error('[AIService] Workout plan generation timed out after', TIMEOUT_MS, 'ms');
        return null;
      }

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
        headers: await this.getHeaders(),
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
  // Cheat Day Guidance
  // ============================================================================

  /**
   * Generate AI-powered cheat day guidance and encouragement
   * Uses GPT-4.1-mini to provide personalized, supportive guidance
   */
  async generateCheatDayGuidance(dayName: string, userGoals?: { goalType?: string; dailyCalories?: number }): Promise<CheatDayGuidance | null> {
    const CACHE_KEY = `hc_cheat_day_guidance_${dayName}`;
    const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

    try {
      // Check cache first
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { guidance, cachedAt } = JSON.parse(cached);
        if (Date.now() - new Date(cachedAt).getTime() < CACHE_DURATION) {
          console.log('[AIService] Using cached cheat day guidance');
          return guidance;
        }
      }

      console.log('[AIService] Generating cheat day guidance for:', dayName);

      const response = await fetch(`${this.baseUrl}/api/v1/ai/cheat-day-guidance`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({
          dayName,
          userGoals,
          shopifyCustomerId: 'guest_ios_app',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIService] Cheat day guidance error:', response.status, errorText);
        return this.getFallbackCheatDayGuidance(dayName);
      }

      const data = await response.json();

      if (data.success && data.guidance) {
        // Cache the result
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          guidance: data.guidance,
          cachedAt: new Date().toISOString(),
        }));
        return data.guidance;
      }

      return this.getFallbackCheatDayGuidance(dayName);
    } catch (error) {
      console.error('[AIService] generateCheatDayGuidance error:', error);
      return this.getFallbackCheatDayGuidance(dayName);
    }
  }

  /**
   * Fallback guidance if API fails
   */
  private getFallbackCheatDayGuidance(dayName: string): CheatDayGuidance {
    return {
      greeting: `Happy ${dayName}! Today is your flexible eating day.`,
      encouragement: "Enjoy this day guilt-free! Flexible eating days are an important part of a sustainable wellness journey. They help prevent feelings of deprivation and support your mental well-being.",
      mindfulTips: [
        "Eat slowly and savor each bite - mindful eating enhances enjoyment",
        "Start with a protein-rich breakfast to set a balanced tone",
        "Choose one or two treats you truly love rather than grazing on everything",
        "Listen to your body's hunger and fullness cues"
      ],
      hydrationReminder: "Don't forget to stay hydrated! Water helps with digestion and keeps you feeling your best.",
      balanceTip: "Tomorrow is a new day to return to your regular eating pattern. No need to restrict or compensate - just get back to your normal routine.",
      motivationalQuote: "\"Balance is not something you find, it's something you create.\" - Jana Kingsford"
    };
  }

  // ============================================================================
  // Saved Meals Management
  // ============================================================================

  /**
   * Get all saved meals (backend first, local fallback)
   */
  async getSavedMeals(): Promise<SavedMeal[]> {
    try {
      // First try to get from backend
      console.log('[AIService] 🔄 Fetching saved meals from backend...');
      const backendMeals = await api.getSavedMeals();

      if (backendMeals && backendMeals.length > 0) {
        console.log('[AIService] ✅ Loaded', backendMeals.length, 'saved meals from backend');

        // Convert backend format to local format and cache locally
        const localFormat: SavedMeal[] = backendMeals.map((m: any) => ({
          id: m.id,
          meal: {
            id: m.id,
            name: m.mealName || m.meal_name,
            mealType: m.mealType || m.meal_type || 'lunch',
            description: m.recipe || '',
            nutrients: {
              calories: m.calories,
              protein_g: m.protein,
              carbs_g: m.carbs,
              fat_g: m.fat,
            },
            prepTimeMinutes: m.prepTimeMinutes || m.prep_time_minutes || 15,
            ingredients: m.ingredients || [],
            tags: m.tags || [],
            imageUrl: m.photoUrl || m.photo_url || undefined,
          },
          savedAt: m.lastUsedAt || m.last_used_at || new Date().toISOString(),
          source: 'custom',
          isFavorite: (m.useCount || m.use_count || 0) > 3,
          timesUsed: m.useCount || m.use_count || 0,
        }));

        // Deduplicate by meal name (keep most recent)
        const seen = new Map<string, SavedMeal>();
        for (const sm of localFormat) {
          const key = sm.meal.name.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.set(key, sm);
          }
        }
        const deduped = Array.from(seen.values());

        // Cache locally for offline access
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(deduped));
        return deduped;
      }

      // Fallback to local storage
      console.log('[AIService] ⚠️ No backend meals, checking local cache...');
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_MEALS);
      if (!stored) return [];

      const meals: SavedMeal[] = JSON.parse(stored);
      return meals;
    } catch (error) {
      console.error('[AIService] Error getting saved meals:', error);

      // Fallback to local on error
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_MEALS);
        if (stored) return JSON.parse(stored);
      } catch {}

      return [];
    }
  }

  /**
   * Save a meal to favorites (syncs to backend)
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

      // Save locally first
      savedMeals.push(savedMeal);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(savedMeals));

      // Sync to backend
      try {
        console.log('[AIService] 🔄 Syncing saved meal to backend...');
        const backendResult = await api.saveMeal({
          mealName: meal.name,
          mealType: meal.mealType,
          calories: meal.nutrients.calories,
          protein: meal.nutrients.protein_g,
          carbs: meal.nutrients.carbs_g,
          fat: meal.nutrients.fat_g,
          ingredients: meal.ingredients,
          recipe: meal.description,
          prepTimeMinutes: meal.prepTimeMinutes,
          photoUrl: meal.imageUrl || '',
          tags: meal.tags,
        });

        if (backendResult) {
          console.log('[AIService] ✅ Saved meal synced to backend');
          // Update local ID with backend ID
          savedMeal.id = backendResult.id;
          await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(savedMeals));
        } else {
          console.warn('[AIService] ⚠️ Backend sync failed - meal saved locally');
        }
      } catch (syncError) {
        console.error('[AIService] ❌ Backend sync error:', syncError);
      }

      return savedMeal;
    } catch (error) {
      console.error('[AIService] Error saving meal:', error);
      return null;
    }
  }

  /**
   * Remove a saved meal (syncs to backend)
   */
  async removeSavedMeal(savedMealId: string): Promise<boolean> {
    try {
      const savedMeals = await this.getSavedMeals();
      const filtered = savedMeals.filter(m => m.id !== savedMealId);

      // Remove locally
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MEALS, JSON.stringify(filtered));

      // Delete from backend
      try {
        console.log('[AIService] 🔄 Deleting saved meal from backend...');
        const success = await api.deleteSavedMeal(savedMealId);
        if (success) {
          console.log('[AIService] ✅ Deleted from backend');
        } else {
          console.warn('[AIService] ⚠️ Backend delete failed');
        }
      } catch (syncError) {
        console.error('[AIService] ❌ Backend delete error:', syncError);
      }

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
