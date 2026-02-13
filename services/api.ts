// Heirclark Backend API Service v2.0
// Railway Backend with PostgreSQL + JWT Auth + 11 AI Agents

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://heirclarkinstacartbackend-production.up.railway.app';
const AUTH_TOKEN_KEY = 'heirclark_auth_token';

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
  fullName?: string;
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

export interface UserPreferences {
  // Workout preferences
  cardioPreference?: 'walking' | 'running' | 'hiit' | 'cycling' | 'swimming';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  workoutDuration?: number;
  workoutsPerWeek?: number;
  availableEquipment?: string[]; // Equipment user has access to for workouts
  injuries?: string[]; // Body areas to avoid or modify exercises for
  // Diet preferences
  dietStyle?: 'standard' | 'keto' | 'high_protein' | 'vegetarian' | 'vegan' | 'custom';
  mealsPerDay?: number;
  intermittentFasting?: boolean;
  fastingStart?: string;
  fastingEnd?: string;
  allergies?: string[];
  // Customizable daily goals
  waterGoalOz?: number;
  sleepGoalHours?: number;
  stepGoal?: number;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalMinutes: number;
  totalCaloriesBurned: number;
  averageRating: number;
  workoutsThisWeek: number;
  minutesThisWeek: number;
  caloriesThisWeek: number;
  currentStreak: number;
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
      if (!data.success || !data.user) return null;

      // Transform snake_case to camelCase
      const user = data.user;
      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name || user.fullName,
        avatarUrl: user.avatar_url || user.avatarUrl,
      };
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
          full_name: profile.fullName,
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
  // USER PREFERENCES (Workout/Diet Preferences)
  // ============================================

  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/user/preferences`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.preferences : null;
    } catch (error) {
      console.error('[API] Get preferences error:', error);
      return null;
    }
  }

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      console.log('[API] Saving preferences:', preferences);
      const response = await fetch(`${this.baseUrl}/api/v1/user/preferences`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(preferences),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Update preferences failed:', response.status, errorText);
        return false;
      }
      console.log('[API] ✅ Preferences saved successfully');
      return true;
    } catch (error) {
      console.error('[API] Update preferences error:', error);
      return false;
    }
  }

  // ============================================
  // WORKOUT TRACKING
  // ============================================

  async logWorkout(workout: {
    sessionName: string;
    workoutType?: string;
    exercises?: any[];
    durationMinutes: number;
    caloriesBurned: number;
    notes?: string;
    rating?: number;
    completedAt?: string;
  }): Promise<boolean> {
    try {
      console.log('[API] Logging workout:', workout.sessionName);
      const response = await fetch(`${this.baseUrl}/api/v1/workouts/log`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(workout),
      });
      if (!response.ok) {
        console.error('[API] Log workout failed:', response.status);
        return false;
      }
      console.log('[API] ✅ Workout logged successfully');
      return true;
    } catch (error) {
      console.error('[API] Log workout error:', error);
      return false;
    }
  }

  async getWorkoutHistory(days: number = 30): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/workouts/history?days=${days}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.success ? data.workouts : [];
    } catch (error) {
      console.error('[API] Get workout history error:', error);
      return [];
    }
  }

  async getWorkoutStats(): Promise<WorkoutStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workouts/stats`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.stats : null;
    } catch (error) {
      console.error('[API] Get workout stats error:', error);
      return null;
    }
  }

  // Save workout plan to backend
  async saveWorkoutPlan(planData: any, programId?: string, programName?: string): Promise<boolean> {
    try {
      console.log('[API] Saving workout plan to backend...');

      // Extract weekly_schedule from planData and send at top level as backend expects
      const { weekly_schedule, ...restPlanData } = planData;

      const response = await fetch(`${this.baseUrl}/api/v1/workouts/plan`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({
          planData: restPlanData,
          programId,
          programName,
          weekly_schedule: weekly_schedule || [],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Save workout plan error:', response.status, errorText);
        return false;
      }

      console.log('[API] ✅ Workout plan saved successfully');
      return true;
    } catch (error) {
      console.error('[API] Save workout plan error:', error);
      return false;
    }
  }

  // Get saved workout plan from backend
  async getWorkoutPlan(): Promise<{ planData: any; programId?: string; programName?: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workouts/plan`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) return null;
        throw new Error('Failed to get workout plan');
      }

      const data = await response.json();
      if (data.success && data.plan) {
        return {
          planData: data.plan.planData,
          programId: data.plan.programId,
          programName: data.plan.programName,
        };
      }
      return null;
    } catch (error) {
      console.error('[API] Get workout plan error:', error);
      return null;
    }
  }

  // Save personal record
  async savePersonalRecord(exerciseName: string, weight: number, reps?: number, notes?: string): Promise<boolean> {
    try {
      console.log('[API] Saving PR:', exerciseName, weight, reps);
      const response = await fetch(`${this.baseUrl}/api/v1/workouts/pr`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ exerciseName, weight, reps, notes }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Save PR error:', response.status, errorText);
        return false;
      }

      console.log('[API] ✅ PR saved successfully');
      return true;
    } catch (error) {
      console.error('[API] Save PR error:', error);
      return false;
    }
  }

  // Get all personal records
  async getPersonalRecords(): Promise<Record<string, { weight: number; reps: number; achievedAt: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workouts/prs`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) return {};
        throw new Error('Failed to get PRs');
      }

      const data = await response.json();
      return data.success ? data.prs : {};
    } catch (error) {
      console.error('[API] Get PRs error:', error);
      return {};
    }
  }

  // ============================================
  // FULL TRAINING STATE SYNC
  // ============================================

  // Save complete training state (weekly stats, goal alignment, plan summary)
  async saveTrainingState(trainingState: {
    weeklyStats?: { completedWorkouts: number; totalWorkouts: number; currentWeek: number; caloriesBurned: number };
    goalAlignment?: { calorieDeficitSupport: number; musclePreservation: number; muscleGrowthPotential: number; cardiovascularHealth: number; overallAlignment: number };
    planSummary?: any;
    preferences?: any;
  }): Promise<boolean> {
    try {
      console.log('[API] 🔄 Syncing full training state to backend...');
      const response = await fetch(`${this.baseUrl}/api/v1/workouts/state`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(trainingState),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Save training state error:', response.status, errorText);
        return false;
      }

      console.log('[API] ✅ Training state synced successfully');
      return true;
    } catch (error) {
      console.error('[API] Save training state error:', error);
      return false;
    }
  }

  // Get complete training state
  async getTrainingState(): Promise<{
    weeklyStats?: { completedWorkouts: number; totalWorkouts: number; currentWeek: number; caloriesBurned: number };
    goalAlignment?: { calorieDeficitSupport: number; musclePreservation: number; muscleGrowthPotential: number; cardiovascularHealth: number; overallAlignment: number };
    planSummary?: any;
    preferences?: any;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workouts/state`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) return null;
        throw new Error('Failed to get training state');
      }

      const data = await response.json();
      return data.success ? data.state : null;
    } catch (error) {
      console.error('[API] Get training state error:', error);
      return null;
    }
  }

  // Save individual weight log (not just PRs)
  async saveWeightLog(log: {
    exerciseName: string;
    date: string;
    sets: Array<{ setNumber: number; weight: number; reps: number; unit: string }>;
    notes?: string;
    personalRecord?: boolean;
  }): Promise<boolean> {
    try {
      console.log('[API] 💪 Saving weight log:', log.exerciseName);
      const response = await fetch(`${this.baseUrl}/api/v1/workouts/weight-logs`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Save weight log error:', response.status, errorText);
        return false;
      }

      console.log('[API] ✅ Weight log saved successfully');
      return true;
    } catch (error) {
      console.error('[API] Save weight log error:', error);
      return false;
    }
  }

  // Get weight logs for an exercise
  async getWeightLogs(exerciseName?: string): Promise<Array<{
    exerciseName: string;
    date: string;
    sets: Array<{ setNumber: number; weight: number; reps: number; unit: string }>;
    notes?: string;
    personalRecord?: boolean;
  }>> {
    try {
      const url = exerciseName
        ? `${this.baseUrl}/api/v1/workouts/weight-logs?exercise=${encodeURIComponent(exerciseName)}`
        : `${this.baseUrl}/api/v1/workouts/weight-logs`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) return [];
        throw new Error('Failed to get weight logs');
      }

      const data = await response.json();
      return data.success ? data.logs : [];
    } catch (error) {
      console.error('[API] Get weight logs error:', error);
      return [];
    }
  }

  // Save exercise completion status
  async saveExerciseCompletion(completion: {
    date: string;
    dayIndex: number;
    exerciseId: string;
    exerciseName: string;
    completed: boolean;
    completedAt?: string;
  }): Promise<boolean> {
    try {
      console.log('[API] ✅ Saving exercise completion:', completion.exerciseName, completion.completed);
      const response = await fetch(`${this.baseUrl}/api/v1/workouts/exercise-completions`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(completion),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Save exercise completion error:', response.status, errorText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[API] Save exercise completion error:', error);
      return false;
    }
  }

  // Get exercise completions for a date range
  async getExerciseCompletions(startDate: string, endDate?: string): Promise<Array<{
    date: string;
    dayIndex: number;
    exerciseId: string;
    exerciseName: string;
    completed: boolean;
    completedAt?: string;
  }>> {
    try {
      const url = endDate
        ? `${this.baseUrl}/api/v1/workouts/exercise-completions?start=${startDate}&end=${endDate}`
        : `${this.baseUrl}/api/v1/workouts/exercise-completions?start=${startDate}`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) return [];
        throw new Error('Failed to get exercise completions');
      }

      const data = await response.json();
      return data.success ? data.completions : [];
    } catch (error) {
      console.error('[API] Get exercise completions error:', error);
      return [];
    }
  }

  // Save weekly stats
  async saveWeeklyStats(stats: {
    weekNumber: number;
    completedWorkouts: number;
    totalWorkouts: number;
    caloriesBurned: number;
    startDate: string;
    endDate: string;
  }): Promise<boolean> {
    try {
      console.log('[API] 📊 Saving weekly stats for week', stats.weekNumber);
      const response = await fetch(`${this.baseUrl}/api/v1/workouts/weekly-stats`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(stats),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Save weekly stats error:', response.status, errorText);
        return false;
      }

      console.log('[API] ✅ Weekly stats saved successfully');
      return true;
    } catch (error) {
      console.error('[API] Save weekly stats error:', error);
      return false;
    }
  }

  // Get weekly stats history
  async getWeeklyStats(weekNumber?: number): Promise<Array<{
    weekNumber: number;
    completedWorkouts: number;
    totalWorkouts: number;
    caloriesBurned: number;
    startDate: string;
    endDate: string;
  }>> {
    try {
      const url = weekNumber
        ? `${this.baseUrl}/api/v1/workouts/weekly-stats?week=${weekNumber}`
        : `${this.baseUrl}/api/v1/workouts/weekly-stats`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) return [];
        throw new Error('Failed to get weekly stats');
      }

      const data = await response.json();
      return data.success ? data.stats : [];
    } catch (error) {
      console.error('[API] Get weekly stats error:', error);
      return [];
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

  // Save meal plan to backend
  async saveMealPlan(planData: any, weekStart?: string, dietStyle?: string): Promise<boolean> {
    try {
      console.log('[API] Saving meal plan to backend...');
      const response = await fetch(`${this.baseUrl}/api/v1/meals/plan`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ planData, weekStart, dietStyle }),
      });

      if (!response.ok) {
        console.error('[API] Save meal plan error:', response.status);
        return false;
      }

      console.log('[API] ✅ Meal plan saved successfully');
      return true;
    } catch (error) {
      console.error('[API] Save meal plan error:', error);
      return false;
    }
  }

  // Get meal plan from backend
  async getMealPlan(weekStart?: string): Promise<{ planData: any; weekStart?: string; dietStyle?: string } | null> {
    try {
      console.log('[API] Fetching meal plan from backend...');
      const url = weekStart
        ? `${this.baseUrl}/api/v1/meals/plan?weekStart=${weekStart}`
        : `${this.baseUrl}/api/v1/meals/plan`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error('[API] Get meal plan error:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.success && data.mealPlan) {
        console.log('[API] ✅ Meal plan fetched successfully');
        return data.mealPlan;
      }

      return null;
    } catch (error) {
      console.error('[API] Get meal plan error:', error);
      return null;
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

  /**
   * Get food by barcode
   */
  async getFoodByBarcode(barcode: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/food/barcode/${encodeURIComponent(barcode)}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to lookup barcode');
      }

      const data = await response.json();
      return data.success ? data.food : null;
    } catch (error) {
      console.error('[API] Barcode lookup error:', error);
      return null;
    }
  }

  /**
   * Get food details by ID
   */
  async getFoodById(foodId: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/food/${encodeURIComponent(foodId)}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get food details');
      }

      const data = await response.json();
      return data.success ? data.food : null;
    } catch (error) {
      console.error('[API] Get food error:', error);
      return null;
    }
  }

  // ============================================
  // WEARABLES
  // ============================================

  /**
   * Get available wearable providers and their connection status
   */
  async getWearableProviders(): Promise<{
    providers: Array<{
      id: string;
      name: string;
      icon: string;
      description: string;
      connected: boolean;
      lastSync?: string;
    }>;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/wearables/providers`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        // Return default providers if endpoint not available
        return {
          providers: [
            { id: 'apple_health', name: 'Apple Health', icon: 'heart', description: 'Steps, workouts, heart rate', connected: false },
            { id: 'fitbit', name: 'Fitbit', icon: 'watch', description: 'Activity, sleep, heart rate', connected: false },
            { id: 'garmin', name: 'Garmin', icon: 'fitness', description: 'Training, GPS, recovery', connected: false },
            { id: 'oura', name: 'Oura Ring', icon: 'ellipse', description: 'Sleep, readiness, activity', connected: false },
            { id: 'strava', name: 'Strava', icon: 'bicycle', description: 'Running, cycling, swimming', connected: false },
            { id: 'whoop', name: 'Whoop', icon: 'pulse', description: 'Recovery, strain, sleep', connected: false },
            { id: 'withings', name: 'Withings', icon: 'scale', description: 'Weight, body composition', connected: false },
          ],
        };
      }

      const data = await response.json();
      return { providers: data.providers || [] };
    } catch (error) {
      console.error('[API] Get wearable providers error:', error);
      return { providers: [] };
    }
  }

  /**
   * Get OAuth URL to connect a wearable provider
   */
  async connectWearable(providerId: string): Promise<{ authUrl?: string; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/wearables/connect/${providerId}`,
        {
          method: 'POST',
          headers: this.getHeaders(true),
        }
      );

      if (!response.ok) {
        return { error: 'Failed to initiate connection' };
      }

      const data = await response.json();
      return { authUrl: data.authUrl };
    } catch (error) {
      console.error('[API] Connect wearable error:', error);
      return { error: 'Connection failed' };
    }
  }

  /**
   * Disconnect a wearable provider
   */
  async disconnectWearable(providerId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/wearables/disconnect/${providerId}`,
        {
          method: 'POST',
          headers: this.getHeaders(true),
        }
      );

      return { success: response.ok };
    } catch (error) {
      console.error('[API] Disconnect wearable error:', error);
      return { success: false };
    }
  }

  /**
   * Manually sync data from a wearable provider
   */
  async syncWearable(providerId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/wearables/sync/${providerId}`,
        {
          method: 'POST',
          headers: this.getHeaders(true),
        }
      );

      if (!response.ok) {
        return { success: false, message: 'Sync failed' };
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error('[API] Sync wearable error:', error);
      return { success: false, message: 'Sync failed' };
    }
  }

  // ============================================
  // WEATHER
  // ============================================

  /**
   * Get current weather for hydration reminders
   */
  async getCurrentWeather(latitude: number, longitude: number): Promise<{
    temperature?: number;
    humidity?: number;
    conditions?: string;
    hydrationRecommendation?: string;
  } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/weather/current?lat=${latitude}&lon=${longitude}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.success ? data.weather : null;
    } catch (error) {
      console.error('[API] Get weather error:', error);
      return null;
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

  // ============================================
  // ONBOARDING PROGRAMS
  // ============================================

  async getAvailablePrograms(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/programs/available`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.success ? (data.data || data.programs || []) : [];
    } catch (error) {
      console.error('[API] Get programs error:', error);
      return [];
    }
  }

  async enrollInProgram(programId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/programs/enroll`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ programId }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('[API] Enroll in program error:', error);
      return null;
    }
  }

  async getProgramTasks(programId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/programs/${programId}/tasks`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.success ? (data.data?.days || data.tasks || []) : [];
    } catch (error) {
      console.error('[API] Get program tasks error:', error);
      return [];
    }
  }

  async getDayTasks(programId: string, day: number): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/programs/${programId}/days/${day}/tasks`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.success ? (data.data?.tasks || data.tasks || []) : [];
    } catch (error) {
      console.error('[API] Get day tasks error:', error);
      return [];
    }
  }

  async completeTask(programId: string, taskId: string, taskResponse?: any): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/programs/${programId}/tasks/${taskId}/complete`,
        {
          method: 'POST',
          headers: this.getHeaders(true),
          body: JSON.stringify({ response: taskResponse }),
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('[API] Complete task error:', error);
      return null;
    }
  }

  async getProgramProgress(programId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/programs/${programId}/progress`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('[API] Get program progress error:', error);
      return null;
    }
  }

  async getStreakMilestones(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/programs/streak-milestones`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('[API] Get streak milestones error:', error);
      return null;
    }
  }

  // ============================================
  // BUDGET TIERS & MEAL PLANNING WITH CART
  // ============================================

  async getBudgetTiers(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/grocery/budget-tiers`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.success ? (data.data || data.tiers || []) : [];
    } catch (error) {
      console.error('[API] Get budget tiers error:', error);
      return [];
    }
  }

  async generateMealPlanWithCart(preferences: {
    daily_calories: number;
    daily_protein_g: number;
    daily_carbs_g?: number;
    daily_fat_g?: number;
    dietary_restrictions: string[];
    allergies: string[];
    cuisine_preferences?: string[];
    cooking_skill: 'beginner' | 'intermediate' | 'advanced';
    max_prep_time_minutes?: number;
    meals_per_day: number;
    budget_tier: 'budget' | 'moderate' | 'premium';
    pantry_items: Array<{ name: string; quantity: number; unit: string }>;
    landing_url?: string;
  }): Promise<any> {
    try {
      console.log('[API] Generating meal plan with cart:', preferences);

      const response = await fetch(`${this.baseUrl}/api/v1/grocery/plan-with-cart`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        console.error('[API] Generate meal plan with cart failed:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('[API] Meal plan with cart generated successfully');
      return data.success ? data.data : null;
    } catch (error) {
      console.error('[API] Generate meal plan with cart error:', error);
      return null;
    }
  }

  // ============================================
  // INSTACART INTEGRATION
  // ============================================

  /**
   * Create Instacart shopping cart from grocery list
   * Calls backend /api/instacart/products-link endpoint
   */
  async createInstacartCart(
    groceryList: Array<{ category: string; items: Array<{ name: string; totalAmount: string; unit: string }> }>,
    filters?: {
      budgetTier?: 'low' | 'medium' | 'high';
      dietary?: string[];
    }
  ): Promise<{ cart_url: string } | null> {
    try {
      console.log('[API] Creating Instacart cart with', {
        categories: groceryList.length,
        filters,
      });

      // Flatten grocery categories into line items for Instacart API
      const lineItems = groceryList.flatMap(category =>
        category.items.map(item => ({
          name: item.name,
          quantity: parseFloat(item.totalAmount) || 1,
          unit: item.unit,
        }))
      );

      if (lineItems.length === 0) {
        console.warn('[API] No items to send to Instacart');
        return null;
      }

      const payload = {
        items: lineItems,
        filters: filters || {},
        title: 'Heirclark 7-Day Meal Plan',
        instructions: ['Generated from your personalized 7-day nutrition plan.'],
        partnerLinkbackUrl: 'heirclark://meal-plan',
      };

      console.log('[API] Sending to Instacart:', payload);

      const response = await fetch(`${this.baseUrl}/api/instacart/products-link`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('[API] Instacart cart creation failed:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('[API] Instacart response:', data);

      if (data.ok && data.products_link_url) {
        console.log('[API] ✅ Instacart cart created:', data.products_link_url);
        return { cart_url: data.products_link_url };
      } else if (data.success && data.cart_url) {
        console.log('[API] ✅ Instacart cart created:', data.cart_url);
        return { cart_url: data.cart_url };
      }

      console.warn('[API] Instacart response missing cart URL');
      return null;
    } catch (error) {
      console.error('[API] Create Instacart cart error:', error);
      return null;
    }
  }

  /**
   * Search for a product on Instacart
   * Calls backend /api/instacart/search endpoint
   */
  async searchInstacartProduct(query: string): Promise<{
    products?: Array<{
      name: string;
      price?: string;
      image_url?: string;
      web_url?: string;
    }>;
    products_link_url?: string;
  } | null> {
    try {
      console.log('[API] Searching Instacart for:', query);

      const response = await fetch(`${this.baseUrl}/api/instacart/search`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        console.error('[API] Instacart search failed:', response.status);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[API] Instacart search error:', error);
      return null;
    }
  }

  /**
   * Get available Instacart retailers by postal code
   */
  async getInstacartRetailers(postalCode: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/instacart/retailers?postal_code=${encodeURIComponent(postalCode)}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.retailers || [];
    } catch (error) {
      console.error('[API] Get Instacart retailers error:', error);
      return [];
    }
  }

  // ============================================
  // ENHANCED HEALTH SYNC (for background sync)
  // ============================================

  async syncAppleHealthData(healthData: {
    date: string;
    steps: number;
    activeCalories: number;
    restingEnergy: number;
    totalCaloriesOut: number;
    workouts: number;
    distance?: number;
    heartRate?: number;
  }): Promise<boolean> {
    try {
      const payload = {
        ...healthData,
        source: 'heirclark-ios-app',
      };

      console.log('[API] Syncing Apple Health data:', payload);

      const response = await fetch(`${this.baseUrl}/api/v1/health/ingest-simple`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('[API] Apple Health sync failed:', response.status);
        return false;
      }

      console.log('[API] Apple Health sync successful');
      return true;
    } catch (error) {
      console.error('[API] Apple Health sync error:', error);
      return false;
    }
  }

  // ============================================
  // FOOD PREFERENCES
  // ============================================

  /**
   * Save food preferences to backend
   */
  async saveFoodPreferences(preferences: {
    dietaryPreferences?: string[];
    allergens?: string[];
    favoriteCuisines?: string[];
    favoriteProteins?: string[];
    favoriteVegetables?: string[];
    favoriteFruits?: string[];
    favoriteStarches?: string[];
    favoriteSnacks?: string[];
    hatedFoods?: string;
    mealStyle?: string;
    mealDiversity?: string;
    cheatDays?: string[];
    cookingSkill?: string;
  }): Promise<boolean> {
    try {
      console.log('[API] Saving food preferences to backend...');

      const response = await fetch(`${this.baseUrl}/api/v1/food-preferences`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        console.error('[API] Save food preferences failed:', response.status);
        return false;
      }

      console.log('[API] ✅ Food preferences saved to backend');
      return true;
    } catch (error) {
      console.error('[API] Save food preferences error:', error);
      return false;
    }
  }

  /**
   * Get food preferences from backend
   */
  async getFoodPreferences(): Promise<{
    dietaryPreferences: string[];
    allergens: string[];
    favoriteCuisines: string[];
    favoriteProteins: string[];
    favoriteVegetables: string[];
    favoriteFruits: string[];
    favoriteStarches: string[];
    favoriteSnacks: string[];
    hatedFoods: string;
    mealStyle: string;
    mealDiversity: string;
    cheatDays: string[];
    cookingSkill: string;
    updatedAt?: string;
  } | null> {
    try {
      console.log('[API] Fetching food preferences from backend...');

      const response = await fetch(`${this.baseUrl}/api/v1/food-preferences`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) return null;
        console.error('[API] Get food preferences failed:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.success && data.preferences) {
        console.log('[API] ✅ Food preferences loaded from backend');
        return data.preferences;
      }
      return null;
    } catch (error) {
      console.error('[API] Get food preferences error:', error);
      return null;
    }
  }

  /**
   * Sync exercises to backend database
   */
  async syncExercises(exercises: any[]): Promise<{ success: boolean; count: number }> {
    try {
      console.log(`[API] Syncing ${exercises.length} exercises to backend...`);

      const response = await fetch(`${this.baseUrl}/api/v1/exercises/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exercises }),
      });

      if (!response.ok) {
        console.error('[API] Sync exercises failed:', response.status);
        return { success: false, count: 0 };
      }

      const data = await response.json();
      console.log(`[API] ✅ Synced ${data.count} exercises to backend`);
      return { success: true, count: data.count };
    } catch (error) {
      console.error('[API] Sync exercises error:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Get exercises from backend database with filters
   */
  async getExercises(filters?: {
    bodyPart?: string;
    equipment?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.bodyPart) params.append('bodyPart', filters.bodyPart);
      if (filters?.equipment) params.append('equipment', filters.equipment);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const queryString = params.toString();
      const url = `${this.baseUrl}/api/v1/exercises${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('[API] Get exercises failed:', response.status);
        return [];
      }

      const data = await response.json();
      if (data.success && data.exercises) {
        console.log(`[API] ✅ Loaded ${data.exercises.length} exercises from backend`);
        return data.exercises;
      }
      return [];
    } catch (error) {
      console.error('[API] Get exercises error:', error);
      return [];
    }
  }

  /**
   * Get total exercise count from backend
   */
  async getExerciseCount(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/exercises/count`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('[API] Get exercise count failed:', response.status);
        return 0;
      }

      const data = await response.json();
      if (data.success && typeof data.count === 'number') {
        console.log(`[API] ✅ Total exercises in database: ${data.count}`);
        return data.count;
      }
      return 0;
    } catch (error) {
      console.error('[API] Get exercise count error:', error);
      return 0;
    }
  }

  /**
   * Add exercise to favorites
   */
  async addFavoriteExercise(exerciseId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/favorite-exercises`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ exerciseId }),
      });

      if (response.ok) {
        console.log(`[API] ✅ Added exercise ${exerciseId} to favorites`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[API] Add favorite exercise error:', error);
      return false;
    }
  }

  /**
   * Remove exercise from favorites
   */
  async removeFavoriteExercise(exerciseId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/favorite-exercises/${exerciseId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        console.log(`[API] ✅ Removed exercise ${exerciseId} from favorites`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[API] Remove favorite exercise error:', error);
      return false;
    }
  }

  /**
   * Get user's favorite exercise IDs
   */
  async getFavoriteExercises(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/favorite-exercises`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error('[API] Get favorite exercises failed:', response.status);
        return [];
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.favoriteIds)) {
        console.log(`[API] ✅ Loaded ${data.favoriteIds.length} favorite exercises`);
        return data.favoriteIds;
      }
      return [];
    } catch (error) {
      console.error('[API] Get favorite exercises error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const api = new HeirclarkAPI();
export default api;
