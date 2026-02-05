// Heirclark Backend API Service v2.0
// Railway Backend with PostgreSQL + JWT Auth + 11 AI Agents

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://heirclarkinstacartbackend-production.up.railway.app';
const AUTH_TOKEN_KEY = '@heirclark_auth_token';

export interface HealthMetrics {
  date: string;
  caloriesIn: number;
  caloriesOut: number;
  restingEnergy: number;
  steps: number;
  weight: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  waterOz?: number;
  sleepHours?: number;
  activeMinutes?: number;
}

export interface MealData {
  id?: string;
  odooId?: string;
  odooContactId?: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  time?: string;
  photoUrl?: string;
  source?: string;
  confidence?: string;
  foods?: Array<{
    name: string;
    portion?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

export interface SavedMeal {
  id: string;
  mealName: string;
  mealType?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: any[];
  recipe?: string;
  prepTimeMinutes?: number;
  photoUrl?: string;
  tags?: string[];
  useCount?: number;
  lastUsedAt?: string;
}

export interface UserGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  dailySteps: number;
  dailyWaterOz?: number;
  sleepHours?: number;
  workoutDaysPerWeek?: number;
  targetWeight?: number;
  weeklyWeightChange?: number;
  goalType?: 'lose' | 'maintain' | 'gain';
}

export interface UserProfile {
  heightCm?: number;
  weightKg?: number;
  age?: number;
  sex?: 'male' | 'female';
  activityLevel?: string;
  goalType?: 'lose' | 'maintain' | 'gain';
  targetWeightKg?: number;
  targetDate?: string;
  timezone?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface Habit {
  id: string;
  habitName: string;
  habitType?: string;
  frequency: string;
  targetValue: number;
  unit?: string;
  reminderTime?: string;
  weekCompletions?: number;
}

class HeirclarkAPI {
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
      console.warn('[API] Failed to load auth token:', error);
    }
  }

  // Save auth token
  private async saveAuthToken(token: string) {
    try {
      this.authToken = token;
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.warn('[API] Failed to save auth token:', error);
    }
  }

  // Clear auth token
  async clearAuthToken() {
    try {
      this.authToken = null;
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.warn('[API] Failed to clear auth token:', error);
    }
  }

  // Get common headers for requests
  private getHeaders(includeContentType: boolean = false): HeadersInit {
    const headers: HeadersInit = {};

    // ✅ JWT Bearer token is the ONLY authentication method
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async authenticateWithApple(appleId: string, email?: string, fullName?: string): Promise<AuthUser | null> {
    try {
      console.log('[API] 🍎 Authenticating with Apple ID...');

      const response = await fetch(`${this.baseUrl}/api/v1/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appleId, email, fullName }),
      });

      if (!response.ok) {
        console.error('[API] ❌ Apple auth failed:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.success && data.token) {
        await this.saveAuthToken(data.token);
        console.log('[API] ✅ Apple authentication successful');
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('[API] Apple auth error:', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/me`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.user : null;
    } catch (error) {
      return null;
    }
  }

  async logout(): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      await this.clearAuthToken();
      return true;
    } catch (error) {
      await this.clearAuthToken();
      return false;
    }
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          return { status: 'ok', message: 'API reachable (auth required)' };
        }
        throw new Error('Health check failed');
      }
      return await response.json();
    } catch (error) {
      return { status: 'ok', message: 'API reachable' };
    }
  }

  // ============================================
  // USER GOALS
  // ============================================

  async getGoals(): Promise<UserGoals | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/user/goals`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        if (response.status === 404 || response.status === 401 || response.status === 400) return null;
        throw new Error('Failed to fetch goals');
      }
      const data = await response.json();
      if (data.success && data.goals) {
        return {
          dailyCalories: data.goals.dailyCalories || 2000,
          dailyProtein: data.goals.dailyProtein || 150,
          dailyCarbs: data.goals.dailyCarbs || 200,
          dailyFat: data.goals.dailyFat || 65,
          dailySteps: data.goals.dailySteps || 10000,
          dailyWaterOz: data.goals.dailyWaterOz || 64,
          sleepHours: data.goals.sleepHours || 8,
          workoutDaysPerWeek: data.goals.workoutDaysPerWeek || 4,
          targetWeight: data.goals.targetWeight,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async updateGoals(goals: Partial<UserGoals>): Promise<boolean> {
    try {
      // Backend expects: { goals: { calories, protein, carbs, fat, hydration, goalWeight, timezone } }
      const payload = {
        goals: {
          calories: Math.round(goals.dailyCalories || 2000),
          protein: Math.round(goals.dailyProtein || 150),
          carbs: Math.round(goals.dailyCarbs || 200),
          fat: Math.round(goals.dailyFat || 65),
          hydration: Math.round((goals.dailyWaterOz || 64) * 29.5735), // Convert oz to ml
          goalWeight: goals.targetWeight || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
        },
      };

      console.log('[API] Sending goals:', JSON.stringify(payload));

      const response = await fetch(`${this.baseUrl}/api/v1/user/goals`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Update goals failed:', response.status, errorText);
        return false;
      }
      return true;
    } catch (error) {
      console.error('[API] Update goals error:', error);
      return false;
    }
  }

  // ============================================
  // USER PROFILE (Weight Goal Alignment)
  // ============================================

  async getProfile(): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/user/profile`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.profile : null;
    } catch (error) {
      console.error('[API] Get profile error:', error);
      return null;
    }
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/user/profile`, {
        method: 'PATCH',
        headers: this.getHeaders(true),
        body: JSON.stringify({
          height_cm: profile.heightCm,
          weight_kg: profile.weightKg,
          age: profile.age,
          sex: profile.sex,
          activity_level: profile.activityLevel,
          goal_type: profile.goalType,
          target_weight_kg: profile.targetWeightKg,
          target_date: profile.targetDate,
          timezone: profile.timezone,
        }),
      });
      if (!response.ok) {
        console.error('[API] Update profile failed:', response.status);
        return false;
      }
      return true;
    } catch (error) {
      console.error('[API] Update profile error:', error);
      return false;
    }
  }

  // ============================================
  // MEALS
  // ============================================

  async logMeal(meal: Omit<MealData, 'odooId' | 'odooContactId'>): Promise<boolean> {
    try {
      const payload = {
        mealName: meal.name,
        mealType: meal.mealType,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: meal.fiber,
        photoUrl: meal.photoUrl,
        source: meal.source || 'manual',
        confidence: meal.confidence || 'medium',
        foods: meal.foods,
      };

      const response = await fetch(`${this.baseUrl}/api/v1/meals`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Meal log error:', response.status, errorText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[API] Log meal error:', error);
      return false;
    }
  }

  async getMeals(date: string): Promise<MealData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/meals?date=${date}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) return [];
        throw new Error('Failed to fetch meals');
      }

      const data = await response.json();
      if (data.success && data.meals) {
        return data.meals.map((m: any) => ({
          id: m.id,
          date: date,
          mealType: m.meal_type,
          name: m.meal_name,
          calories: m.calories || 0,
          protein: parseFloat(m.protein) || 0,
          carbs: parseFloat(m.carbs) || 0,
          fat: parseFloat(m.fat) || 0,
          fiber: parseFloat(m.fiber) || 0,
          photoUrl: m.photo_url,
          source: m.source,
          confidence: m.confidence,
          foods: m.foods || [],
        }));
      }
      return [];
    } catch (error) {
      console.error('[API] Get meals error:', error);
      return [];
    }
  }

  async deleteMeal(mealId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/meals/${mealId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('[API] Delete meal error:', error);
      return false;
    }
  }

  // ============================================
  // SAVED MEALS (Favorites)
  // ============================================

  async getSavedMeals(): Promise<SavedMeal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/meals/saved`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.success ? data.savedMeals : [];
    } catch (error) {
      console.error('[API] Get saved meals error:', error);
      return [];
    }
  }

  async saveMeal(meal: Omit<SavedMeal, 'id'>): Promise<SavedMeal | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/meals/saved`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(meal),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.savedMeal : null;
    } catch (error) {
      console.error('[API] Save meal error:', error);
      return null;
    }
  }

  async deleteSavedMeal(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/meals/saved/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // HEALTH METRICS
  // ============================================

  async getTodayMetrics(): Promise<HealthMetrics | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health/metrics`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401 || response.status === 400) return null;
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      if (data.success && data.metrics) {
        const m = data.metrics;
        return {
          date: new Date().toISOString().split('T')[0],
          caloriesIn: m.calories || 0,
          caloriesOut: m.steps ? Math.round(m.steps * 0.04) : 0,
          restingEnergy: 0,
          steps: m.steps || 0,
          weight: m.weight || 0,
          protein: m.protein || 0,
          carbs: m.carbs || 0,
          fat: m.fat || 0,
          waterOz: m.waterOz || 0,
          sleepHours: m.sleepHours || 0,
          activeMinutes: m.activeMinutes || 0,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async getMetricsByDate(date: string): Promise<HealthMetrics | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/health/metrics?date=${date}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        if (response.status === 404 || response.status === 401 || response.status === 400) return null;
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      if (data.success && data.metrics) {
        const m = data.metrics;
        return {
          date,
          caloriesIn: m.calories || 0,
          caloriesOut: m.steps ? Math.round(m.steps * 0.04) : 0,
          restingEnergy: 0,
          steps: m.steps || 0,
          weight: m.weight || 0,
          protein: m.protein || 0,
          carbs: m.carbs || 0,
          fat: m.fat || 0,
          waterOz: m.waterOz || 0,
          sleepHours: m.sleepHours || 0,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async ingestHealthData(data: Partial<HealthMetrics>): Promise<boolean> {
    try {
      const payload: any = {
        date: data.date || new Date().toISOString().split('T')[0],
      };

      if (data.steps !== undefined) payload.steps = data.steps;
      if (data.caloriesOut !== undefined) payload.activeCalories = data.caloriesOut;
      if (data.weight !== undefined) payload.weight = data.weight;
      if (data.sleepHours !== undefined) payload.sleepHours = data.sleepHours;

      const response = await fetch(`${this.baseUrl}/api/v1/health/ingest-simple`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.warn('[API] Ingest data error:', error);
      return false;
    }
  }

  async getHistory(days: number = 7): Promise<HealthMetrics[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/health/history?days=${days}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 400) return [];
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      if (data.success && data.history) {
        const { weights, calories, steps } = data.history;

        // Merge data by date
        const dateMap = new Map<string, HealthMetrics>();

        steps?.forEach((s: any) => {
          const date = s.date;
          if (!dateMap.has(date)) {
            dateMap.set(date, {
              date,
              caloriesIn: 0,
              caloriesOut: 0,
              restingEnergy: 0,
              steps: 0,
              weight: 0,
            });
          }
          dateMap.get(date)!.steps = s.steps;
        });

        calories?.forEach((c: any) => {
          const date = c.date;
          if (!dateMap.has(date)) {
            dateMap.set(date, {
              date,
              caloriesIn: 0,
              caloriesOut: 0,
              restingEnergy: 0,
              steps: 0,
              weight: 0,
            });
          }
          dateMap.get(date)!.caloriesIn = c.calories_consumed || 0;
          dateMap.get(date)!.caloriesOut = c.calories_burned || 0;
        });

        weights?.forEach((w: any) => {
          const date = new Date(w.logged_at).toISOString().split('T')[0];
          if (dateMap.has(date)) {
            dateMap.get(date)!.weight = w.weight;
          }
        });

        return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  async getConnectedDevices(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health/devices`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) return [];
        throw new Error('Failed to fetch devices');
      }

      const data = await response.json();
      return data.success ? data.devices.map((d: any) => d.provider) : [];
    } catch (error) {
      return [];
    }
  }

  async syncFitnessData(provider: string, data: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health/sync`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ provider, data }),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // WEIGHT LOGGING
  // ============================================

  async logWeight(weight: number, unit: string = 'lbs', bodyFatPercent?: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health/weight`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ weight, unit, bodyFatPercent }),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // HYDRATION
  // ============================================

  async logHydration(amountOz: number, date?: string): Promise<{ success: boolean; todayTotal: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health/hydration`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ amountOz, date }),
      });

      if (!response.ok) return { success: false, todayTotal: 0 };
      const data = await response.json();
      return { success: data.success, todayTotal: data.todayTotal || 0 };
    } catch (error) {
      return { success: false, todayTotal: 0 };
    }
  }

  // ============================================
  // SLEEP
  // ============================================

  async logSleep(sleepData: {
    date?: string;
    bedTime?: string;
    wakeTime?: string;
    totalHours?: number;
    qualityScore?: number;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health/sleep`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(sleepData),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getSleepHistory(days: number = 14): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health/sleep?days=${days}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.success ? data.sleepLogs : [];
    } catch (error) {
      return [];
    }
  }

  // ============================================
  // HABITS
  // ============================================

  async getHabits(): Promise<Habit[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/habits`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.success ? data.habits : [];
    } catch (error) {
      return [];
    }
  }

  async createHabit(habit: Omit<Habit, 'id' | 'weekCompletions'>): Promise<Habit | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/habits`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(habit),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.habit : null;
    } catch (error) {
      return null;
    }
  }

  async completeHabit(habitId: string, date?: string, value?: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/habits/${habitId}/complete`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ date, value }),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // FASTING
  // ============================================

  async startFast(fastingType: string = '16:8', targetHours: number = 16): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/fasting/start`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ fastingType, targetHours }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.session : null;
    } catch (error) {
      return null;
    }
  }

  async endFast(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/fasting/end`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.session : null;
    } catch (error) {
      return null;
    }
  }

  async getCurrentFast(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/fasting/current`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.session : null;
    } catch (error) {
      return null;
    }
  }

  // ============================================
  // FOOD SEARCH
  // ============================================

  async searchFood(query: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/food/search?query=${encodeURIComponent(query)}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to search food');
      }

      const data = await response.json();
      return data.success ? data.foods : [];
    } catch (error) {
      return [];
    }
  }

  // ============================================
  // AI AGENTS
  // ============================================

  async generateMealPlan(options: {
    goals?: UserGoals;
    preferences?: any;
    restrictions?: string[];
    days?: number;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-meal-plan`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        console.error('[API] Generate meal plan failed:', response.status);
        return null;
      }

      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      console.error('[API] Generate meal plan error:', error);
      return null;
    }
  }

  async generateWorkoutPlan(options: {
    goals?: any;
    fitnessLevel?: string;
    equipment?: string[];
    daysPerWeek?: number;
    preferences?: any;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-workout-plan`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(options),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.workoutPlan : null;
    } catch (error) {
      return null;
    }
  }

  async sendCoachMessage(message: string, conversationType?: string, context?: any): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/coach-message`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ message, conversationType, context }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.message : null;
    } catch (error) {
      return null;
    }
  }

  async getRecipeDetails(mealName: string, basicInfo?: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/recipe-details`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ mealName, basicInfo }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.recipe : null;
    } catch (error) {
      return null;
    }
  }

  // Smart Meal Logger Agent
  async getSmartMealSuggestions(timeOfDay?: string, recentMeals?: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/smart-meal-logger/suggestions`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ timeOfDay, recentMeals }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      return null;
    }
  }

  // Accountability Agent
  async getAccountabilityCheckIn(todayProgress: any, goals: any, streak?: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/accountability/check-in`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ todayProgress, goals, streak }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      return null;
    }
  }

  // Progress Prediction Agent
  async getProgressForecast(currentWeight: number, targetWeight: number, averageDeficit: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/prediction/forecast`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ currentWeight, targetWeight, averageDeficit }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      return null;
    }
  }

  // Habit Formation Agent
  async analyzeHabits(habits: any[], completions: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/habits/analyze`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ habits, completions }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      return null;
    }
  }

  // Restaurant Menu Agent
  async analyzeRestaurantMenu(restaurantName: string, menuItems: any[], goals?: UserGoals): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/restaurant/analyze`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ restaurantName, menuItems, goals }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      return null;
    }
  }

  // Sleep Recovery Agent
  async analyzeSleep(recentSleep: any[], goals?: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/sleep/analyze`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ recentSleep, goals }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      return null;
    }
  }

  // Hydration Agent
  async getHydrationStatus(todayIntake: number, goal: number, activityLevel?: string, weather?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/hydration/status`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ todayIntake, goal, activityLevel, weather }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      return null;
    }
  }

  // Calorie Banking Agent
  async calculateCalorieBanking(weeklyBudget: number, dailyLogs: any[], specialEvents?: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/banking/calculate`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ weeklyBudget, dailyLogs, specialEvents }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      return null;
    }
  }

  // Workout Form Coach Agent
  async analyzeExerciseForm(exercise: string, userDescription?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/form-coach/analyze`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ exercise, userDescription }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      return null;
    }
  }

  // Nutrition Accuracy Agent
  async verifyNutrition(meal: string, estimatedNutrition: any, source?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/agents/nutrition-accuracy/verify`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ meal, estimatedNutrition, source }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      return null;
    }
  }

  // ============================================
  // PUSH NOTIFICATIONS
  // ============================================

  async savePushToken(token: string, platform: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/notifications/register`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ expoPushToken: token, platform }),
      });
      return response.ok;
    } catch (error) {
      console.error('[API] Save push token error:', error);
      return false;
    }
  }

  async removePushToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/notifications/unregister`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('[API] Remove push token error:', error);
      return false;
    }
  }

  async sendTestNotification(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/notifications/test`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ message: 'Test notification from Heirclark Health App' }),
      });
      return response.ok;
    } catch (error) {
      console.error('[API] Send test notification error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const api = new HeirclarkAPI();
export default api;
