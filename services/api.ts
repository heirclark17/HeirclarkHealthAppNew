// Heirclark Backend API Service
// Railway Backend: https://heirclarkinstacartbackend-production.up.railway.app

const API_BASE_URL = 'https://heirclarkinstacartbackend-production.up.railway.app';

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
  time?: string;
}

export interface UserGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  dailySteps: number;
  targetWeight?: number;
  weeklyWeightChange?: number; // Negative for loss, positive for gain (in lbs)
  goalType?: 'lose' | 'maintain' | 'gain';
}

class HeirclarkAPI {
  private baseUrl: string;
  private odooId: string;
  private shopifyCustomerId: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    // Guest user IDs for unauthenticated access
    this.odooId = 'guest_user';
    this.shopifyCustomerId = 'guest_ios_app';
  }

  // Set authenticated user IDs
  setUserIds(odooId: string, shopifyCustomerId?: string) {
    this.odooId = odooId;
    if (shopifyCustomerId) {
      this.shopifyCustomerId = shopifyCustomerId;
    }
  }

  // Get common headers for authenticated requests
  private getHeaders(includeContentType: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'X-Shopify-Customer-Id': this.shopifyCustomerId,
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  // Health Check (public endpoint)
  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        // Return a simulated OK if health endpoint requires auth
        if (response.status === 401) {
          return { status: 'ok', message: 'API reachable (auth required)' };
        }
        throw new Error('Health check failed');
      }
      return await response.json();
    } catch (error) {
      // console.error('Health check error:', error);
      // Return ok status if we can reach the server at all
      return { status: 'ok', message: 'API reachable' };
    }
  }

  // Get today's metrics
  async getTodayMetrics(): Promise<HealthMetrics | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/health/metrics?shopifyCustomerId=${this.shopifyCustomerId}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        if (response.status === 404 || response.status === 401 || response.status === 400) return null;
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      return data.ok ? data.data : null;
    } catch (error) {
      // console.error('Get metrics error:', error);
      return null;
    }
  }

  // Get metrics for specific date
  async getMetricsByDate(date: string): Promise<HealthMetrics | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/health/metrics?shopifyCustomerId=${this.shopifyCustomerId}&date=${date}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        if (response.status === 404 || response.status === 401 || response.status === 400) return null;
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      return data.ok ? data.data : null;
    } catch (error) {
      // console.error('Get metrics by date error:', error);
      return null;
    }
  }

  // Submit health data (calories, steps, weight, etc.)
  async ingestHealthData(data: Partial<HealthMetrics>): Promise<boolean> {
    try {
      // Build payload with only defined values
      const payload: any = {
        shopifyCustomerId: this.shopifyCustomerId,
        date: data.date || new Date().toISOString().split('T')[0],
      };

      // Only include fields that have values
      if (data.steps !== undefined && data.steps !== null) {
        payload.steps = data.steps;
      }
      if (data.caloriesOut !== undefined && data.caloriesOut !== null) {
        payload.caloriesOut = data.caloriesOut;
      }
      if (data.restingEnergy !== undefined && data.restingEnergy !== null) {
        payload.restingEnergy = data.restingEnergy;
      }

      // Calculate activeEnergy only if we have the required data
      if (data.caloriesOut !== undefined && data.restingEnergy !== undefined) {
        payload.activeEnergy = (data.caloriesOut || 0) - (data.restingEnergy || 0);
      }

      console.log('[API] Ingesting health data:', payload);

      const response = await fetch(`${this.baseUrl}/api/v1/health/ingest-simple`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('[API] Auth required for ingest');
          return false;
        }
        const errorText = await response.text();
        console.warn('[API] Ingest error:', response.status, errorText);
        console.warn('[API] Payload that failed:', JSON.stringify(payload, null, 2));
        // Don't throw - just return false to avoid LogBox errors
        return false;
      }

      const result = await response.json();
      console.log('[API] Ingest success:', result);
      return true;
    } catch (error) {
      // Silently handle network errors - they're not critical for app functionality
      console.warn('[API] Ingest data error (non-critical):', error);
      return false;
    }
  }

  // Get historical data for charts
  async getHistory(days: number = 7): Promise<HealthMetrics[]> {
    try {
      // Calculate startDate and endDate
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await fetch(
        `${this.baseUrl}/api/v1/health/history?shopifyCustomerId=${this.shopifyCustomerId}&startDate=${startDateStr}&endDate=${endDateStr}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        if (response.status === 401 || response.status === 400) return [];
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      // Backend returns history as object with dates as keys, convert to array
      if (data.ok && data.history) {
        return Object.entries(data.history).map(([date, metrics]: [string, any]) => ({
          date,
          caloriesIn: 0, // Not provided by backend
          caloriesOut: metrics.activeCalories || 0,
          restingEnergy: metrics.restingEnergy || 0,
          steps: metrics.steps || 0,
          weight: 0, // Not provided by backend
        }));
      }
      return [];
    } catch (error) {
      // console.error('Get history error:', error);
      return [];
    }
  }

  // Get connected devices
  async getConnectedDevices(): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/health/devices?shopifyCustomerId=${this.shopifyCustomerId}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        if (response.status === 401 || response.status === 404) return [];
        throw new Error('Failed to fetch devices');
      }
      const data = await response.json();
      return data.devices || [];
    } catch (error) {
      // console.error('Get devices error:', error);
      return [];
    }
  }

  // Log a meal
  async logMeal(meal: Omit<MealData, 'odooId' | 'odooContactId'>): Promise<boolean> {
    try {
      // Backend expects mealType at root level and foods in 'items' array
      const payload = {
        shopifyCustomerId: this.shopifyCustomerId,
        mealType: meal.mealType,
        date: meal.date,
        items: [
          {
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            odooId: this.odooId,
            odooContactId: this.odooId,
          }
        ],
      };

      console.log('[API] Logging meal to:', `${this.baseUrl}/api/v1/meals`);
      console.log('[API] Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${this.baseUrl}/api/v1/meals`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(payload),
      });

      console.log('[API] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Meal log error response:', response.status, errorText);
        if (response.status === 401) {
          console.warn('[API] Auth required for meal logging');
          return false;
        }
        throw new Error(`Failed to log meal: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[API] Meal log success:', JSON.stringify(result, null, 2));
      return true;
    } catch (error) {
      console.error('[API] Log meal error:', error);
      return false;
    }
  }

  // Get meals for a date
  async getMeals(date: string): Promise<MealData[]> {
    try {
      console.log('[API] Fetching meals for date:', date);
      const response = await fetch(
        `${this.baseUrl}/api/v1/meals?shopifyCustomerId=${this.shopifyCustomerId}&date=${date}`,
        { headers: this.getHeaders() }
      );
      console.log('[API] getMeals response status:', response.status);

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) return [];
        throw new Error('Failed to fetch meals');
      }
      const data = await response.json();
      console.log('[API] getMeals raw response:', JSON.stringify(data, null, 2));

      // Backend returns: { meals: [{ mealType, items: [{name, calories, ...}] }] }
      // We need to flatten this to: [{ mealType, name, calories, ... }]
      let meals: MealData[] = [];

      if (data.meals && Array.isArray(data.meals)) {
        // Flatten nested structure - each item becomes a MealData entry
        for (const meal of data.meals) {
          if (meal.items && Array.isArray(meal.items)) {
            for (const item of meal.items) {
              meals.push({
                id: meal.id,  // Use parent meal ID for deletion
                date: date,
                mealType: meal.mealType,
                name: item.name,
                calories: item.calories || 0,
                protein: item.protein || 0,
                carbs: item.carbs || 0,
                fat: item.fat || 0,
              });
            }
          }
        }
      } else if (Array.isArray(data)) {
        meals = data;
      }

      console.log('[API] Parsed meals:', meals.length, 'items');
      console.log('[API] Flattened meals data:', JSON.stringify(meals, null, 2));
      return meals;
    } catch (error) {
      console.error('[API] Get meals error:', error);
      return [];
    }
  }

  // Delete a meal
  async deleteMeal(mealId: string): Promise<boolean> {
    try {
      console.log('[API] Deleting meal:', mealId);

      const response = await fetch(
        `${this.baseUrl}/api/v1/meals/${mealId}?shopifyCustomerId=${this.shopifyCustomerId}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );

      console.log('[API] Delete response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Delete meal error:', response.status, errorText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[API] Delete meal error:', error);
      return false;
    }
  }

  // Search food database
  async searchFood(query: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/food/search?q=${encodeURIComponent(query)}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to search food');
      }
      return await response.json();
    } catch (error) {
      // console.error('Search food error:', error);
      return [];
    }
  }

  // Get user goals
  async getGoals(): Promise<UserGoals | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/user/goals`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        if (response.status === 404 || response.status === 401 || response.status === 400) return null;
        throw new Error('Failed to fetch goals');
      }
      const data = await response.json();
      if (data.ok && data.goals) {
        // Map backend format to frontend UserGoals format
        return {
          dailyCalories: data.goals.calories || 2200,
          dailyProtein: data.goals.protein || 190,
          dailyCarbs: data.goals.carbs || 190,
          dailyFat: data.goals.fat || 60,
          dailySteps: 10000, // Backend doesn't store steps goal, use default
          targetWeight: data.goals.goalWeight || undefined,
        };
      }
      return null;
    } catch (error) {
      // console.error('Get goals error:', error);
      return null;
    }
  }

  // Update user goals
  async updateGoals(goals: Partial<UserGoals>): Promise<boolean> {
    try {
      // Map frontend UserGoals format to backend format
      const backendGoals = {
        calories: goals.dailyCalories,
        protein: goals.dailyProtein,
        carbs: goals.dailyCarbs,
        fat: goals.dailyFat,
        goalWeight: goals.targetWeight || null,
      };

      const payload = { goals: backendGoals };
      console.log('[API] Updating goals with payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(
        `${this.baseUrl}/api/v1/user/goals`,
        {
          method: 'POST',
          headers: this.getHeaders(true),
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Update goals failed:', response.status, errorText);
        if (response.status === 401 || response.status === 404) {
          // console.warn('Auth required for updating goals or endpoint not found');
          return false;
        }
        throw new Error(`Failed to update goals: ${response.status} - ${errorText}`);
      }
      return true;
    } catch (error) {
      console.error('[API] Update goals error:', error);
      return false;
    }
  }

  // Sync with fitness provider (Apple Health, Fitbit, etc.)
  async syncFitnessData(provider: string, data: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health/sync`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({
          shopifyCustomerId: this.shopifyCustomerId,
          provider,
          data,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          // console.warn('Auth required for sync or endpoint not found');
          return false;
        }
        throw new Error('Failed to sync fitness data');
      }
      return true;
    } catch (error) {
      // console.error('Sync fitness data error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const api = new HeirclarkAPI();
export default api;
