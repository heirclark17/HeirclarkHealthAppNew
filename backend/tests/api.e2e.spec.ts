// Heirclark Health App - End-to-End API Tests
// Run with: npx playwright test

import { test, expect, request, APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

let apiContext: APIRequestContext;
let authToken: string | null = null;
let testUserId: string | null = null;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  apiContext = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  });
});

test.afterAll(async () => {
  await apiContext.dispose();
});

// Helper to get auth headers
function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Shopify-Customer-Id': 'test_playwright_user',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

// ============================================
// HEALTH CHECK TESTS
// ============================================

test.describe('Health Check', () => {
  test('should return OK status', async () => {
    const response = await apiContext.get('/api/v1/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.message).toContain('Heirclark');
  });
});

// ============================================
// AUTHENTICATION TESTS
// ============================================

test.describe('Authentication', () => {
  test('should authenticate with Apple Sign-In', async () => {
    const response = await apiContext.post('/api/v1/auth/apple', {
      data: {
        appleId: 'test_apple_id_playwright_' + Date.now(),
        email: 'playwright@test.com',
        fullName: 'Playwright Test User',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.token).toBeTruthy();
    expect(data.user).toBeTruthy();
    expect(data.user.id).toBeTruthy();

    // Store for subsequent tests
    authToken = data.token;
    testUserId = data.user.id;
  });

  test('should get current user', async () => {
    const response = await apiContext.get('/api/v1/auth/me', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.user).toBeTruthy();
  });
});

// ============================================
// USER GOALS TESTS
// ============================================

test.describe('User Goals', () => {
  test('should get user goals', async () => {
    const response = await apiContext.get('/api/v1/user/goals', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.goals).toBeTruthy();
    expect(data.goals.dailyCalories).toBeGreaterThan(0);
  });

  test('should update user goals', async () => {
    const newGoals = {
      dailyCalories: 2200,
      dailyProtein: 180,
      dailyCarbs: 220,
      dailyFat: 70,
      dailySteps: 12000,
      dailyWaterOz: 80,
    };

    const response = await apiContext.post('/api/v1/user/goals', {
      headers: getHeaders(),
      data: newGoals,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// ============================================
// MEAL LOGGING TESTS
// ============================================

test.describe('Meal Logging', () => {
  let testMealId: string;

  test('should log a meal', async () => {
    const meal = {
      mealName: 'Test Breakfast',
      mealType: 'breakfast',
      calories: 450,
      protein: 30,
      carbs: 45,
      fat: 15,
      source: 'manual',
      confidence: 'high',
      foods: [
        { name: 'Eggs', portion: '3 large', calories: 210, protein: 18, carbs: 0, fat: 15 },
        { name: 'Toast', portion: '2 slices', calories: 160, protein: 6, carbs: 30, fat: 2 },
        { name: 'Orange Juice', portion: '8 oz', calories: 80, protein: 6, carbs: 15, fat: 0 },
      ],
    };

    const response = await apiContext.post('/api/v1/meals', {
      headers: getHeaders(),
      data: meal,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.meal).toBeTruthy();
    expect(data.meal.id).toBeTruthy();

    testMealId = data.meal.id;
  });

  test('should get meals for today', async () => {
    const today = new Date().toISOString().split('T')[0];

    const response = await apiContext.get(`/api/v1/meals?date=${today}`, {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.meals)).toBe(true);
    expect(data.meals.length).toBeGreaterThan(0);
  });

  test('should delete a meal', async () => {
    if (!testMealId) {
      test.skip();
      return;
    }

    const response = await apiContext.delete(`/api/v1/meals/${testMealId}`, {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// ============================================
// SAVED MEALS TESTS
// ============================================

test.describe('Saved Meals', () => {
  let savedMealId: string;

  test('should save a meal as favorite', async () => {
    const savedMeal = {
      mealName: 'My Favorite Oatmeal',
      mealType: 'breakfast',
      calories: 350,
      protein: 12,
      carbs: 55,
      fat: 10,
      ingredients: [
        { name: 'Oatmeal', amount: '1 cup' },
        { name: 'Banana', amount: '1 medium' },
        { name: 'Almond Butter', amount: '2 tbsp' },
      ],
      prepTimeMinutes: 10,
      tags: ['quick', 'healthy', 'vegan'],
    };

    const response = await apiContext.post('/api/v1/meals/saved', {
      headers: getHeaders(),
      data: savedMeal,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.savedMeal).toBeTruthy();
    savedMealId = data.savedMeal.id;
  });

  test('should get saved meals', async () => {
    const response = await apiContext.get('/api/v1/meals/saved', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.savedMeals)).toBe(true);
  });

  test('should delete saved meal', async () => {
    if (!savedMealId) {
      test.skip();
      return;
    }

    const response = await apiContext.delete(`/api/v1/meals/saved/${savedMealId}`, {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
  });
});

// ============================================
// NUTRITION AI TESTS
// ============================================

test.describe('Nutrition AI', () => {
  test('should analyze meal from text', async () => {
    const response = await apiContext.post('/api/v1/nutrition/ai/meal-from-text', {
      headers: getHeaders(),
      data: {
        text: 'Grilled chicken breast with rice and steamed broccoli',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.analysis).toBeTruthy();
    expect(data.analysis.calories).toBeGreaterThan(0);
    expect(data.analysis.protein).toBeGreaterThan(0);
    expect(data.analysis.mealName).toBeTruthy();
  });

  test('should search food database', async () => {
    const response = await apiContext.get('/api/v1/food/search?query=apple', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.foods)).toBe(true);
  });
});

// ============================================
// HEALTH METRICS TESTS
// ============================================

test.describe('Health Metrics', () => {
  test('should get today metrics', async () => {
    const response = await apiContext.get('/api/v1/health/metrics', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.metrics).toBeTruthy();
  });

  test('should ingest health data', async () => {
    const response = await apiContext.post('/api/v1/health/ingest-simple', {
      headers: getHeaders(),
      data: {
        steps: 8500,
        activeCalories: 350,
        weight: 175,
        sleepHours: 7.5,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('should get health history', async () => {
    const response = await apiContext.get('/api/v1/health/history?days=7', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.history).toBeTruthy();
  });
});

// ============================================
// WEIGHT LOGGING TESTS
// ============================================

test.describe('Weight Logging', () => {
  test('should log weight', async () => {
    const response = await apiContext.post('/api/v1/health/weight', {
      headers: getHeaders(),
      data: {
        weight: 175.5,
        unit: 'lbs',
        bodyFatPercent: 18.5,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// ============================================
// HYDRATION TESTS
// ============================================

test.describe('Hydration', () => {
  test('should log hydration', async () => {
    const response = await apiContext.post('/api/v1/health/hydration', {
      headers: getHeaders(),
      data: {
        amountOz: 16,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.todayTotal).toBeGreaterThan(0);
  });
});

// ============================================
// SLEEP TESTS
// ============================================

test.describe('Sleep', () => {
  test('should log sleep', async () => {
    const response = await apiContext.post('/api/v1/health/sleep', {
      headers: getHeaders(),
      data: {
        totalHours: 7.5,
        qualityScore: 85,
        bedTime: '2025-01-28T22:30:00Z',
        wakeTime: '2025-01-29T06:00:00Z',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('should get sleep history', async () => {
    const response = await apiContext.get('/api/v1/health/sleep?days=7', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.sleepLogs)).toBe(true);
  });
});

// ============================================
// HABITS TESTS
// ============================================

test.describe('Habits', () => {
  let habitId: string;

  test('should create a habit', async () => {
    const response = await apiContext.post('/api/v1/habits', {
      headers: getHeaders(),
      data: {
        habitName: 'Drink Water',
        habitType: 'health',
        frequency: 'daily',
        targetValue: 8,
        unit: 'glasses',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.habit).toBeTruthy();
    habitId = data.habit.id;
  });

  test('should get habits', async () => {
    const response = await apiContext.get('/api/v1/habits', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.habits)).toBe(true);
  });

  test('should complete a habit', async () => {
    if (!habitId) {
      test.skip();
      return;
    }

    const response = await apiContext.post(`/api/v1/habits/${habitId}/complete`, {
      headers: getHeaders(),
      data: {
        value: 8,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// ============================================
// FASTING TESTS
// ============================================

test.describe('Fasting', () => {
  test('should start a fast', async () => {
    const response = await apiContext.post('/api/v1/fasting/start', {
      headers: getHeaders(),
      data: {
        fastingType: '16:8',
        targetHours: 16,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.session).toBeTruthy();
  });

  test('should get current fast', async () => {
    const response = await apiContext.get('/api/v1/fasting/current', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
  });

  test('should end a fast', async () => {
    const response = await apiContext.post('/api/v1/fasting/end', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
  });
});

// ============================================
// AI AGENTS TESTS
// ============================================

test.describe('AI Agents', () => {
  test('Adaptive TDEE - should calculate TDEE', async () => {
    const response = await apiContext.post('/api/v1/agents/tdee/calculate', {
      headers: getHeaders(),
      data: {
        weightHistory: [
          { date: '2025-01-22', weight: 180, unit: 'lbs' },
          { date: '2025-01-23', weight: 179.8, unit: 'lbs' },
          { date: '2025-01-24', weight: 179.5, unit: 'lbs' },
          { date: '2025-01-25', weight: 179.2, unit: 'lbs' },
          { date: '2025-01-26', weight: 179, unit: 'lbs' },
          { date: '2025-01-27', weight: 178.8, unit: 'lbs' },
          { date: '2025-01-28', weight: 178.5, unit: 'lbs' },
        ],
        calorieHistory: [
          { date: '2025-01-22', caloriesConsumed: 1800 },
          { date: '2025-01-23', caloriesConsumed: 1750 },
          { date: '2025-01-24', caloriesConsumed: 1900 },
          { date: '2025-01-25', caloriesConsumed: 1700 },
          { date: '2025-01-26', caloriesConsumed: 1850 },
          { date: '2025-01-27', caloriesConsumed: 1800 },
          { date: '2025-01-28', caloriesConsumed: 1750 },
        ],
        userProfile: {
          heightCm: 175,
          age: 30,
          sex: 'male',
          activityLevel: 'moderate',
          goalType: 'lose',
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.result).toBeTruthy();
    expect(data.result.formulaTDEE).toBeGreaterThan(0);
  });

  test('Smart Meal Logger - should get suggestions', async () => {
    const response = await apiContext.post('/api/v1/agents/smart-meal-logger/suggestions', {
      headers: getHeaders(),
      data: {
        timeOfDay: 'morning',
        recentMeals: [],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.suggestions).toBeTruthy();
  });

  test('Accountability - should check in', async () => {
    const response = await apiContext.post('/api/v1/agents/accountability/check-in', {
      headers: getHeaders(),
      data: {
        todayProgress: {
          calories: 1500,
          protein: 120,
          steps: 8000,
        },
        goals: {
          dailyCalories: 2000,
          dailyProtein: 150,
          dailySteps: 10000,
        },
        streak: 5,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.message).toBeTruthy();
  });

  test('Progress Prediction - should forecast', async () => {
    const response = await apiContext.post('/api/v1/agents/prediction/forecast', {
      headers: getHeaders(),
      data: {
        currentWeight: 180,
        targetWeight: 165,
        averageDeficit: 500,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.predictedDate).toBeTruthy();
  });

  test('Habit Formation - should analyze', async () => {
    const response = await apiContext.post('/api/v1/agents/habits/analyze', {
      headers: getHeaders(),
      data: {
        habits: [
          { name: 'Drink Water', target: 8 },
          { name: 'Exercise', target: 1 },
        ],
        completions: [
          { habit: 'Drink Water', date: '2025-01-28', value: 8 },
          { habit: 'Exercise', date: '2025-01-28', value: 1 },
        ],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.weeklyScore).toBeTruthy();
  });

  test('Restaurant Menu - should analyze', async () => {
    const response = await apiContext.post('/api/v1/agents/restaurant/analyze', {
      headers: getHeaders(),
      data: {
        restaurantName: 'Chipotle',
        menuItems: [
          'Chicken Burrito Bowl',
          'Carnitas Tacos',
          'Sofritas Salad',
        ],
        goals: {
          dailyCalories: 2000,
          dailyProtein: 150,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.recommendations).toBeTruthy();
  });

  test('Sleep Recovery - should analyze', async () => {
    const response = await apiContext.post('/api/v1/agents/sleep/analyze', {
      headers: getHeaders(),
      data: {
        recentSleep: [
          { date: '2025-01-27', hours: 7.5 },
          { date: '2025-01-26', hours: 6.5 },
          { date: '2025-01-25', hours: 8 },
        ],
        goals: { sleepHours: 8 },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.averageSleep).toBeTruthy();
  });

  test('Hydration Status - should analyze', async () => {
    const response = await apiContext.post('/api/v1/agents/hydration/status', {
      headers: getHeaders(),
      data: {
        todayIntake: 48,
        goal: 64,
        activityLevel: 'moderate',
        weather: 'warm',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.percentOfGoal).toBeTruthy();
  });

  test('Calorie Banking - should calculate', async () => {
    const response = await apiContext.post('/api/v1/agents/banking/calculate', {
      headers: getHeaders(),
      data: {
        weeklyBudget: 14000,
        dailyLogs: [
          { date: '2025-01-27', calories: 1800 },
          { date: '2025-01-26', calories: 2000 },
          { date: '2025-01-25', calories: 1900 },
        ],
        specialEvents: [
          { date: '2025-02-01', name: 'Birthday dinner', estimatedCalories: 2500 },
        ],
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.currentBalance !== undefined).toBe(true);
  });

  test('Workout Form Coach - should analyze', async () => {
    const response = await apiContext.post('/api/v1/agents/form-coach/analyze', {
      headers: getHeaders(),
      data: {
        exercise: 'Deadlift',
        userDescription: 'My lower back rounds at the bottom of the lift',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.formIssues).toBeTruthy();
  });

  test('Nutrition Accuracy - should verify', async () => {
    const response = await apiContext.post('/api/v1/agents/nutrition-accuracy/verify', {
      headers: getHeaders(),
      data: {
        meal: 'Large pepperoni pizza (2 slices)',
        estimatedNutrition: {
          calories: 200,
          protein: 8,
          carbs: 25,
          fat: 8,
        },
        source: 'user_estimate',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.isAccurate !== undefined).toBe(true);
  });
});

// ============================================
// AI GENERATION TESTS
// ============================================

test.describe('AI Generation', () => {
  test('should generate meal plan', async () => {
    const response = await apiContext.post('/api/v1/ai/generate-meal-plan', {
      headers: getHeaders(),
      data: {
        goals: {
          dailyCalories: 2000,
          dailyProtein: 150,
        },
        preferences: {
          dietStyle: 'balanced',
          cuisines: ['american', 'mexican'],
          cookingSkill: 'intermediate',
        },
        restrictions: ['no shellfish'],
        days: 3,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.mealPlan).toBeTruthy();
    expect(Array.isArray(data.mealPlan)).toBe(true);
  });

  test('should generate workout plan', async () => {
    const response = await apiContext.post('/api/v1/ai/generate-workout-plan', {
      headers: getHeaders(),
      data: {
        goals: { type: 'build muscle' },
        fitnessLevel: 'intermediate',
        equipment: ['barbell', 'dumbbells', 'cables'],
        daysPerWeek: 4,
        preferences: {
          sessionLength: 45,
          focusAreas: ['chest', 'back'],
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.workoutPlan).toBeTruthy();
  });

  test('should send coach message', async () => {
    const response = await apiContext.post('/api/v1/ai/coach-message', {
      headers: getHeaders(),
      data: {
        message: 'How can I stay motivated during my weight loss journey?',
        conversationType: 'general',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.message).toBeTruthy();
    expect(data.message.length).toBeGreaterThan(20);
  });

  test('should get recipe details', async () => {
    const response = await apiContext.post('/api/v1/ai/recipe-details', {
      headers: getHeaders(),
      data: {
        mealName: 'Chicken Stir Fry',
        basicInfo: {
          calories: 450,
          servings: 2,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.recipe).toBeTruthy();
    expect(data.recipe.ingredients).toBeTruthy();
    expect(data.recipe.instructions).toBeTruthy();
  });
});

// ============================================
// AVATAR COACHING TESTS
// ============================================

test.describe('Avatar Coaching', () => {
  test('should check avatar config', async () => {
    const response = await apiContext.post('/api/v1/avatar/config', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
  });

  test('should get goal coaching script', async () => {
    const response = await apiContext.post('/api/v1/avatar/coach/goals', {
      headers: getHeaders(),
      data: {
        goals: {
          targetWeight: 170,
          dailyCalories: 2000,
        },
        progress: {
          currentWeight: 180,
          daysCompleted: 14,
          streak: 7,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.script).toBeTruthy();
  });

  test('should get meal plan coaching script', async () => {
    const response = await apiContext.post('/api/v1/avatar/coach/meal-plan', {
      headers: getHeaders(),
      data: {
        weeklyPlan: [
          {
            dayName: 'Monday',
            meals: [
              { mealType: 'breakfast', name: 'Oatmeal', calories: 350, protein: 12 },
              { mealType: 'lunch', name: 'Grilled Chicken Salad', calories: 450, protein: 40 },
              { mealType: 'dinner', name: 'Salmon with Vegetables', calories: 550, protein: 45 },
            ],
            dailyTotals: { calories: 1350, protein: 97 },
          },
        ],
        selectedDayIndex: 0,
        userGoals: {
          dailyCalories: 2000,
          dailyProtein: 150,
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.script).toBeTruthy();
  });
});

// ============================================
// CLEANUP / LOGOUT
// ============================================

test.describe('Cleanup', () => {
  test('should logout', async () => {
    const response = await apiContext.post('/api/v1/auth/logout', {
      headers: getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    authToken = null;
  });
});
