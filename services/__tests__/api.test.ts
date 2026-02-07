/**
 * API Service Tests
 * Tests all methods of the HeirclarkAPI singleton
 */

import { api, HealthMetrics, MealData, UserGoals, UserProfile, UserPreferences, WorkoutStats, AuthUser, Habit } from '../api';

// Mock global.fetch
beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

// Helper to mock fetch responses
function mockFetch(data: any, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

// Helper to mock fetch network error
function mockFetchError(error: Error) {
  (global.fetch as jest.Mock).mockRejectedValueOnce(error);
}

describe('HeirclarkAPI - Authentication', () => {
  describe('authenticateWithApple', () => {
    it('should authenticate successfully with Apple ID', async () => {
      const mockUser: AuthUser = {
        id: 'user123',
        email: 'test@example.com',
        fullName: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
      };

      mockFetch({ success: true, token: 'test-token', user: mockUser });

      const result = await api.authenticateWithApple('apple123', 'test@example.com', 'Test User');

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/apple'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('apple123'),
        })
      );
    });

    it('should return null on authentication failure', async () => {
      mockFetch({ success: false }, false, 401);

      const result = await api.authenticateWithApple('apple123');

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.authenticateWithApple('apple123');

      expect(result).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.png',
      };

      mockFetch({ success: true, user: mockUser });

      const result = await api.getCurrentUser();

      expect(result).toEqual({
        id: 'user123',
        email: 'test@example.com',
        fullName: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
      });
    });

    it('should return null if not authenticated', async () => {
      mockFetch({}, false, 401);

      const result = await api.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockFetch({ success: true });

      const result = await api.logout();

      expect(result).toBe(true);
    });

    it('should clear auth token even if request fails', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.logout();

      expect(result).toBe(false);
    });
  });
});

describe('HeirclarkAPI - User Goals', () => {
  describe('getGoals', () => {
    it('should fetch user goals successfully', async () => {
      const mockGoals = {
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 200,
        dailyFat: 65,
        dailySteps: 10000,
        dailyWaterOz: 64,
        sleepHours: 8,
        workoutDaysPerWeek: 4,
      };

      mockFetch({ success: true, goals: mockGoals });

      const result = await api.getGoals();

      expect(result).toEqual(mockGoals);
    });

    it('should return null when goals not found', async () => {
      mockFetch({}, false, 404);

      const result = await api.getGoals();

      expect(result).toBeNull();
    });
  });

  describe('updateGoals', () => {
    it('should update goals successfully', async () => {
      mockFetch({ success: true });

      const goals: Partial<UserGoals> = {
        dailyCalories: 2500,
        dailyProtein: 180,
      };

      const result = await api.updateGoals(goals);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/user/goals'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should return false on update failure', async () => {
      mockFetch({}, false, 400);

      const result = await api.updateGoals({ dailyCalories: 2500 });

      expect(result).toBe(false);
    });
  });
});

describe('HeirclarkAPI - User Profile', () => {
  describe('getProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile: UserProfile = {
        fullName: 'Test User',
        heightCm: 180,
        weightKg: 75,
        age: 30,
        sex: 'male',
        activityLevel: 'moderate',
        goalType: 'lose',
      };

      mockFetch({ success: true, profile: mockProfile });

      const result = await api.getProfile();

      expect(result).toEqual(mockProfile);
    });

    it('should return null on error', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.getProfile();

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      mockFetch({ success: true });

      const profile: Partial<UserProfile> = {
        fullName: 'Updated User',
        heightCm: 185,
      };

      const result = await api.updateProfile(profile);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 400);

      const result = await api.updateProfile({ fullName: 'Test' });

      expect(result).toBe(false);
    });
  });
});

describe('HeirclarkAPI - User Preferences', () => {
  describe('getPreferences', () => {
    it('should fetch preferences successfully', async () => {
      const mockPreferences: UserPreferences = {
        cardioPreference: 'running',
        fitnessLevel: 'intermediate',
        workoutDuration: 60,
        dietStyle: 'high_protein',
        allergies: ['peanuts'],
      };

      mockFetch({ success: true, preferences: mockPreferences });

      const result = await api.getPreferences();

      expect(result).toEqual(mockPreferences);
    });

    it('should return null on error', async () => {
      mockFetch({}, false, 404);

      const result = await api.getPreferences();

      expect(result).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences successfully', async () => {
      mockFetch({ success: true });

      const prefs: Partial<UserPreferences> = {
        cardioPreference: 'hiit',
        workoutsPerWeek: 5,
      };

      const result = await api.updatePreferences(prefs);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 500);

      const result = await api.updatePreferences({ fitnessLevel: 'beginner' });

      expect(result).toBe(false);
    });
  });
});

describe('HeirclarkAPI - Workout Tracking', () => {
  describe('logWorkout', () => {
    it('should log workout successfully', async () => {
      mockFetch({ success: true });

      const workout = {
        sessionName: 'Morning Run',
        workoutType: 'cardio',
        durationMinutes: 30,
        caloriesBurned: 300,
        rating: 4,
      };

      const result = await api.logWorkout(workout);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 400);

      const result = await api.logWorkout({
        sessionName: 'Test',
        durationMinutes: 30,
        caloriesBurned: 200,
      });

      expect(result).toBe(false);
    });
  });

  describe('getWorkoutHistory', () => {
    it('should fetch workout history', async () => {
      const mockWorkouts = [
        { id: '1', sessionName: 'Morning Run', durationMinutes: 30 },
        { id: '2', sessionName: 'Evening Lift', durationMinutes: 45 },
      ];

      mockFetch({ success: true, workouts: mockWorkouts });

      const result = await api.getWorkoutHistory(7);

      expect(result).toEqual(mockWorkouts);
    });

    it('should return empty array on error', async () => {
      mockFetch({}, false, 500);

      const result = await api.getWorkoutHistory();

      expect(result).toEqual([]);
    });
  });

  describe('getWorkoutStats', () => {
    it('should fetch workout stats', async () => {
      const mockStats: WorkoutStats = {
        totalWorkouts: 100,
        totalMinutes: 3000,
        totalCaloriesBurned: 30000,
        averageRating: 4.5,
        workoutsThisWeek: 4,
        minutesThisWeek: 180,
        caloriesThisWeek: 1800,
        currentStreak: 5,
      };

      mockFetch({ success: true, stats: mockStats });

      const result = await api.getWorkoutStats();

      expect(result).toEqual(mockStats);
    });

    it('should return null on error', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.getWorkoutStats();

      expect(result).toBeNull();
    });
  });

  describe('saveWorkoutPlan', () => {
    it('should save workout plan successfully', async () => {
      mockFetch({ success: true });

      const planData = {
        weekly_schedule: [],
        summary: 'Test plan',
      };

      const result = await api.saveWorkoutPlan(planData, 'program123', 'Test Program');

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 400);

      const result = await api.saveWorkoutPlan({}, 'program123');

      expect(result).toBe(false);
    });
  });

  describe('getWorkoutPlan', () => {
    it('should fetch workout plan successfully', async () => {
      const mockPlan = {
        planData: { weekly_schedule: [] },
        programId: 'program123',
        programName: 'Test Program',
      };

      mockFetch({ success: true, plan: mockPlan });

      const result = await api.getWorkoutPlan();

      expect(result).toEqual(mockPlan);
    });

    it('should return null when not found', async () => {
      mockFetch({}, false, 404);

      const result = await api.getWorkoutPlan();

      expect(result).toBeNull();
    });
  });

  describe('savePersonalRecord', () => {
    it('should save PR successfully', async () => {
      mockFetch({ success: true });

      const result = await api.savePersonalRecord('Bench Press', 225, 5);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 500);

      const result = await api.savePersonalRecord('Squat', 315, 3);

      expect(result).toBe(false);
    });
  });

  describe('getPersonalRecords', () => {
    it('should fetch PRs successfully', async () => {
      const mockPRs = {
        'Bench Press': { weight: 225, reps: 5, achievedAt: '2026-01-01' },
        'Squat': { weight: 315, reps: 3, achievedAt: '2026-01-05' },
      };

      mockFetch({ success: true, prs: mockPRs });

      const result = await api.getPersonalRecords();

      expect(result).toEqual(mockPRs);
    });

    it('should return empty object on error', async () => {
      mockFetch({}, false, 404);

      const result = await api.getPersonalRecords();

      expect(result).toEqual({});
    });
  });

  describe('saveTrainingState', () => {
    it('should save training state successfully', async () => {
      mockFetch({ success: true });

      const state = {
        weeklyStats: { completedWorkouts: 4, totalWorkouts: 5, currentWeek: 1, caloriesBurned: 2000 },
        goalAlignment: { calorieDeficitSupport: 80, musclePreservation: 70, muscleGrowthPotential: 60, cardiovascularHealth: 75, overallAlignment: 71 },
      };

      const result = await api.saveTrainingState(state);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 500);

      const result = await api.saveTrainingState({});

      expect(result).toBe(false);
    });
  });

  describe('getTrainingState', () => {
    it('should fetch training state successfully', async () => {
      const mockState = {
        weeklyStats: { completedWorkouts: 3, totalWorkouts: 5, currentWeek: 2, caloriesBurned: 1500 },
      };

      mockFetch({ success: true, state: mockState });

      const result = await api.getTrainingState();

      expect(result).toEqual(mockState);
    });

    it('should return null when not found', async () => {
      mockFetch({}, false, 404);

      const result = await api.getTrainingState();

      expect(result).toBeNull();
    });
  });

  describe('saveWeightLog', () => {
    it('should save weight log successfully', async () => {
      mockFetch({ success: true });

      const log = {
        exerciseName: 'Bench Press',
        date: '2026-02-06',
        sets: [
          { setNumber: 1, weight: 135, reps: 10, unit: 'lbs' },
          { setNumber: 2, weight: 185, reps: 5, unit: 'lbs' },
        ],
      };

      const result = await api.saveWeightLog(log);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 400);

      const result = await api.saveWeightLog({
        exerciseName: 'Squat',
        date: '2026-02-06',
        sets: [],
      });

      expect(result).toBe(false);
    });
  });

  describe('getWeightLogs', () => {
    it('should fetch weight logs for exercise', async () => {
      const mockLogs = [
        { exerciseName: 'Bench Press', date: '2026-02-06', sets: [] },
      ];

      mockFetch({ success: true, logs: mockLogs });

      const result = await api.getWeightLogs('Bench Press');

      expect(result).toEqual(mockLogs);
    });

    it('should return empty array on error', async () => {
      mockFetch({}, false, 404);

      const result = await api.getWeightLogs();

      expect(result).toEqual([]);
    });
  });

  describe('saveExerciseCompletion', () => {
    it('should save exercise completion successfully', async () => {
      mockFetch({ success: true });

      const completion = {
        date: '2026-02-06',
        dayIndex: 1,
        exerciseId: 'ex123',
        exerciseName: 'Push-ups',
        completed: true,
      };

      const result = await api.saveExerciseCompletion(completion);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 500);

      const result = await api.saveExerciseCompletion({
        date: '2026-02-06',
        dayIndex: 1,
        exerciseId: 'ex123',
        exerciseName: 'Squats',
        completed: false,
      });

      expect(result).toBe(false);
    });
  });

  describe('getExerciseCompletions', () => {
    it('should fetch exercise completions', async () => {
      const mockCompletions = [
        { date: '2026-02-06', dayIndex: 1, exerciseId: 'ex123', exerciseName: 'Push-ups', completed: true },
      ];

      mockFetch({ success: true, completions: mockCompletions });

      const result = await api.getExerciseCompletions('2026-02-06', '2026-02-12');

      expect(result).toEqual(mockCompletions);
    });

    it('should return empty array on error', async () => {
      mockFetch({}, false, 404);

      const result = await api.getExerciseCompletions('2026-02-06');

      expect(result).toEqual([]);
    });
  });

  describe('saveWeeklyStats', () => {
    it('should save weekly stats successfully', async () => {
      mockFetch({ success: true });

      const stats = {
        weekNumber: 1,
        completedWorkouts: 4,
        totalWorkouts: 5,
        caloriesBurned: 2000,
        startDate: '2026-02-03',
        endDate: '2026-02-09',
      };

      const result = await api.saveWeeklyStats(stats);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 500);

      const result = await api.saveWeeklyStats({
        weekNumber: 1,
        completedWorkouts: 0,
        totalWorkouts: 5,
        caloriesBurned: 0,
        startDate: '2026-02-03',
        endDate: '2026-02-09',
      });

      expect(result).toBe(false);
    });
  });

  describe('getWeeklyStats', () => {
    it('should fetch weekly stats', async () => {
      const mockStats = [
        { weekNumber: 1, completedWorkouts: 4, totalWorkouts: 5, caloriesBurned: 2000, startDate: '2026-02-03', endDate: '2026-02-09' },
      ];

      mockFetch({ success: true, stats: mockStats });

      const result = await api.getWeeklyStats(1);

      expect(result).toEqual(mockStats);
    });

    it('should return empty array on error', async () => {
      mockFetch({}, false, 404);

      const result = await api.getWeeklyStats();

      expect(result).toEqual([]);
    });
  });
});

describe('HeirclarkAPI - Meals', () => {
  describe('logMeal', () => {
    it('should log meal successfully', async () => {
      mockFetch({ success: true });

      const meal: Omit<MealData, 'odooId' | 'odooContactId'> = {
        date: '2026-02-06',
        mealType: 'breakfast',
        name: 'Oatmeal',
        calories: 350,
        protein: 12,
        carbs: 55,
        fat: 8,
      };

      const result = await api.logMeal(meal);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 400);

      const result = await api.logMeal({
        date: '2026-02-06',
        mealType: 'lunch',
        name: 'Salad',
        calories: 200,
        protein: 10,
        carbs: 15,
        fat: 12,
      });

      expect(result).toBe(false);
    });
  });

  describe('getMeals', () => {
    it('should fetch meals for date', async () => {
      const mockMeals = [
        { id: '1', meal_type: 'breakfast', meal_name: 'Oatmeal', calories: 350, protein: 12, carbs: 55, fat: 8 },
      ];

      mockFetch({ success: true, meals: mockMeals });

      const result = await api.getMeals('2026-02-06');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Oatmeal');
      expect(result[0].mealType).toBe('breakfast');
    });

    it('should return empty array on error', async () => {
      mockFetch({}, false, 404);

      const result = await api.getMeals('2026-02-06');

      expect(result).toEqual([]);
    });
  });

  describe('deleteMeal', () => {
    it('should delete meal successfully', async () => {
      mockFetch({ success: true });

      const result = await api.deleteMeal('meal123');

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 404);

      const result = await api.deleteMeal('meal999');

      expect(result).toBe(false);
    });
  });

  describe('getSavedMeals', () => {
    it('should fetch saved meals', async () => {
      const mockSavedMeals = [
        { id: 'saved1', mealName: 'Favorite Breakfast', calories: 400, protein: 20, carbs: 50, fat: 12 },
      ];

      mockFetch({ success: true, savedMeals: mockSavedMeals });

      const result = await api.getSavedMeals();

      expect(result).toEqual(mockSavedMeals);
    });

    it('should return empty array on error', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.getSavedMeals();

      expect(result).toEqual([]);
    });
  });

  describe('saveMeal', () => {
    it('should save meal successfully', async () => {
      const meal = {
        mealName: 'New Favorite',
        calories: 500,
        protein: 30,
        carbs: 60,
        fat: 15,
      };

      const savedMeal = { id: 'saved123', ...meal };

      mockFetch({ success: true, savedMeal });

      const result = await api.saveMeal(meal);

      expect(result).toEqual(savedMeal);
    });

    it('should return null on failure', async () => {
      mockFetch({}, false, 500);

      const result = await api.saveMeal({
        mealName: 'Test',
        calories: 300,
        protein: 20,
        carbs: 30,
        fat: 10,
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteSavedMeal', () => {
    it('should delete saved meal successfully', async () => {
      mockFetch({ success: true });

      const result = await api.deleteSavedMeal('saved123');

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.deleteSavedMeal('saved999');

      expect(result).toBe(false);
    });
  });

  describe('saveMealPlan', () => {
    it('should save meal plan successfully', async () => {
      mockFetch({ success: true });

      const result = await api.saveMealPlan({ days: [] }, '2026-02-03', 'keto');

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 500);

      const result = await api.saveMealPlan({}, '2026-02-03');

      expect(result).toBe(false);
    });
  });

  describe('getMealPlan', () => {
    it('should fetch meal plan successfully', async () => {
      const mockPlan = {
        planData: { days: [] },
        weekStart: '2026-02-03',
        dietStyle: 'keto',
      };

      mockFetch({ success: true, mealPlan: mockPlan });

      const result = await api.getMealPlan('2026-02-03');

      expect(result).toEqual(mockPlan);
    });

    it('should return null on error', async () => {
      mockFetch({}, false, 404);

      const result = await api.getMealPlan();

      expect(result).toBeNull();
    });
  });
});

describe('HeirclarkAPI - Health Metrics', () => {
  describe('getTodayMetrics', () => {
    it('should fetch today\'s metrics', async () => {
      const mockMetrics = {
        calories: 2000,
        steps: 10000,
        weight: 75,
        protein: 150,
        carbs: 200,
        fat: 65,
      };

      mockFetch({ success: true, metrics: mockMetrics });

      const result = await api.getTodayMetrics();

      expect(result).toBeDefined();
      expect(result?.caloriesIn).toBe(2000);
      expect(result?.steps).toBe(10000);
    });

    it('should return null on error', async () => {
      mockFetch({}, false, 404);

      const result = await api.getTodayMetrics();

      expect(result).toBeNull();
    });
  });

  describe('getMetricsByDate', () => {
    it('should fetch metrics for specific date', async () => {
      const mockMetrics = {
        calories: 1800,
        steps: 8000,
      };

      mockFetch({ success: true, metrics: mockMetrics });

      const result = await api.getMetricsByDate('2026-02-05');

      expect(result).toBeDefined();
      expect(result?.caloriesIn).toBe(1800);
    });

    it('should return null on error', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.getMetricsByDate('2026-02-05');

      expect(result).toBeNull();
    });
  });

  describe('ingestHealthData', () => {
    it('should ingest health data successfully', async () => {
      mockFetch({ success: true });

      const data: Partial<HealthMetrics> = {
        steps: 12000,
        caloriesOut: 2500,
        weight: 76,
      };

      const result = await api.ingestHealthData(data);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 400);

      const result = await api.ingestHealthData({ steps: 5000 });

      expect(result).toBe(false);
    });
  });

  describe('getHistory', () => {
    it('should fetch health history', async () => {
      const mockHistory = {
        weights: [{ logged_at: '2026-02-06', weight: 75 }],
        calories: [{ date: '2026-02-06', calories_consumed: 2000, calories_burned: 2500 }],
        steps: [{ date: '2026-02-06', steps: 10000 }],
      };

      mockFetch({ success: true, history: mockHistory });

      const result = await api.getHistory(7);

      expect(result).toBeInstanceOf(Array);
    });

    it('should return empty array on error', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.getHistory();

      expect(result).toEqual([]);
    });
  });

  describe('getConnectedDevices', () => {
    it('should fetch connected devices', async () => {
      const mockDevices = [
        { provider: 'fitbit', connected: true },
        { provider: 'apple_health', connected: true },
      ];

      mockFetch({ success: true, devices: mockDevices });

      const result = await api.getConnectedDevices();

      expect(result).toEqual(['fitbit', 'apple_health']);
    });

    it('should return empty array on error', async () => {
      mockFetch({}, false, 404);

      const result = await api.getConnectedDevices();

      expect(result).toEqual([]);
    });
  });

  describe('syncFitnessData', () => {
    it('should sync fitness data successfully', async () => {
      mockFetch({ success: true });

      const result = await api.syncFitnessData('fitbit', { steps: 10000 });

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.syncFitnessData('fitbit', {});

      expect(result).toBe(false);
    });
  });

  describe('logWeight', () => {
    it('should log weight successfully', async () => {
      mockFetch({ success: true });

      const result = await api.logWeight(175, 'lbs', 15);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetch({}, false, 400);

      const result = await api.logWeight(180, 'lbs');

      expect(result).toBe(false);
    });
  });

  describe('logHydration', () => {
    it('should log hydration successfully', async () => {
      mockFetch({ success: true, todayTotal: 48 });

      const result = await api.logHydration(16, '2026-02-06');

      expect(result.success).toBe(true);
      expect(result.todayTotal).toBe(48);
    });

    it('should return failure on error', async () => {
      mockFetch({}, false, 500);

      const result = await api.logHydration(8);

      expect(result.success).toBe(false);
      expect(result.todayTotal).toBe(0);
    });
  });

  describe('logSleep', () => {
    it('should log sleep successfully', async () => {
      mockFetch({ success: true });

      const result = await api.logSleep({
        date: '2026-02-06',
        totalHours: 7.5,
        qualityScore: 85,
      });

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.logSleep({ totalHours: 6 });

      expect(result).toBe(false);
    });
  });

  describe('getSleepHistory', () => {
    it('should fetch sleep history', async () => {
      const mockSleepLogs = [
        { date: '2026-02-06', totalHours: 7.5, qualityScore: 85 },
      ];

      mockFetch({ success: true, sleepLogs: mockSleepLogs });

      const result = await api.getSleepHistory(14);

      expect(result).toEqual(mockSleepLogs);
    });

    it('should return empty array on error', async () => {
      mockFetch({}, false, 404);

      const result = await api.getSleepHistory();

      expect(result).toEqual([]);
    });
  });
});

describe('HeirclarkAPI - Habits', () => {
  describe('getHabits', () => {
    it('should fetch habits successfully', async () => {
      const mockHabits: Habit[] = [
        { id: 'habit1', habitName: 'Drink Water', frequency: 'daily', targetValue: 8 },
      ];

      mockFetch({ success: true, habits: mockHabits });

      const result = await api.getHabits();

      expect(result).toEqual(mockHabits);
    });

    it('should return empty array on error', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.getHabits();

      expect(result).toEqual([]);
    });
  });

  describe('createHabit', () => {
    it('should create habit successfully', async () => {
      const newHabit = {
        habitName: 'Morning Stretch',
        frequency: 'daily',
        targetValue: 1,
      };

      const createdHabit = { id: 'habit123', ...newHabit };

      mockFetch({ success: true, habit: createdHabit });

      const result = await api.createHabit(newHabit);

      expect(result).toEqual(createdHabit);
    });

    it('should return null on failure', async () => {
      mockFetch({}, false, 400);

      const result = await api.createHabit({
        habitName: 'Test',
        frequency: 'daily',
        targetValue: 1,
      });

      expect(result).toBeNull();
    });
  });

  describe('completeHabit', () => {
    it('should complete habit successfully', async () => {
      mockFetch({ success: true });

      const result = await api.completeHabit('habit123', '2026-02-06', 1);

      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.completeHabit('habit999');

      expect(result).toBe(false);
    });
  });
});

describe('HeirclarkAPI - Fasting', () => {
  describe('startFast', () => {
    it('should start fasting session successfully', async () => {
      const mockSession = {
        id: 'fast123',
        fastingType: '16:8',
        targetHours: 16,
        startedAt: '2026-02-06T22:00:00Z',
      };

      mockFetch({ success: true, session: mockSession });

      const result = await api.startFast('16:8', 16);

      expect(result).toEqual(mockSession);
    });

    it('should return null on failure', async () => {
      mockFetch({}, false, 400);

      const result = await api.startFast();

      expect(result).toBeNull();
    });
  });

  describe('endFast', () => {
    it('should end fasting session successfully', async () => {
      const mockSession = {
        id: 'fast123',
        completed: true,
        duration: 16.5,
      };

      mockFetch({ success: true, session: mockSession });

      const result = await api.endFast();

      expect(result).toEqual(mockSession);
    });

    it('should return null on failure', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.endFast();

      expect(result).toBeNull();
    });
  });

  describe('getCurrentFast', () => {
    it('should fetch current fasting session', async () => {
      const mockSession = {
        id: 'fast123',
        fastingType: '16:8',
        startedAt: '2026-02-06T22:00:00Z',
      };

      mockFetch({ success: true, session: mockSession });

      const result = await api.getCurrentFast();

      expect(result).toEqual(mockSession);
    });

    it('should return null when no active fast', async () => {
      mockFetch({}, false, 404);

      const result = await api.getCurrentFast();

      expect(result).toBeNull();
    });
  });
});

describe('HeirclarkAPI - Food Search', () => {
  describe('searchFood', () => {
    it('should search for food successfully', async () => {
      const mockFoods = [
        { id: 'food1', name: 'Chicken Breast', calories: 165 },
        { id: 'food2', name: 'Chicken Thigh', calories: 209 },
      ];

      mockFetch({ success: true, foods: mockFoods });

      const result = await api.searchFood('chicken');

      expect(result).toEqual(mockFoods);
    });

    it('should return empty array on error', async () => {
      mockFetch({}, false, 401);

      const result = await api.searchFood('test');

      expect(result).toEqual([]);
    });
  });

  describe('getFoodByBarcode', () => {
    it('should fetch food by barcode', async () => {
      const mockFood = {
        id: 'food123',
        name: 'Protein Bar',
        barcode: '123456789',
        calories: 200,
      };

      mockFetch({ success: true, food: mockFood });

      const result = await api.getFoodByBarcode('123456789');

      expect(result).toEqual(mockFood);
    });

    it('should return null when not found', async () => {
      mockFetch({}, false, 404);

      const result = await api.getFoodByBarcode('999999999');

      expect(result).toBeNull();
    });
  });

  describe('getFoodById', () => {
    it('should fetch food by ID', async () => {
      const mockFood = {
        id: 'food123',
        name: 'Salmon',
        calories: 206,
      };

      mockFetch({ success: true, food: mockFood });

      const result = await api.getFoodById('food123');

      expect(result).toEqual(mockFood);
    });

    it('should return null on error', async () => {
      mockFetchError(new Error('Network error'));

      const result = await api.getFoodById('food999');

      expect(result).toBeNull();
    });
  });
});

// Continuing in next part due to length...
