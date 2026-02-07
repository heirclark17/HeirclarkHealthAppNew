/**
 * Tests for trainingStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { trainingStorage } from '../trainingStorage';

describe('trainingStorage', () => {
  beforeEach(() => {
    AsyncStorage.__resetStore();
    jest.clearAllMocks();
  });

  describe('savePlanCache / loadPlanCache', () => {
    it('should save and load plan cache successfully', async () => {
      const mockCache = {
        weeklyPlan: {
          id: 'plan-1',
          weekNumber: 1,
          days: [
            {
              dayOfWeek: 'Monday',
              workout: null,
              isRestDay: true,
              completed: false,
            },
          ],
          totalWorkouts: 4,
          completedWorkouts: 0,
        },
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: '2025-01-15T00:00:00.000Z',
        preferences: null,
      };

      await trainingStorage.savePlanCache(mockCache);
      const loaded = await trainingStorage.loadPlanCache();

      expect(loaded).toEqual(mockCache);
    });

    it('should return null when no cache exists', async () => {
      const cache = await trainingStorage.loadPlanCache();
      expect(cache).toBeNull();
    });

    it('should return null and clear cache for invalid structure', async () => {
      const invalidCache = {
        weeklyPlan: { invalid: 'structure' }, // Missing days array
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: '2025-01-15T00:00:00.000Z',
        preferences: null,
      };

      await AsyncStorage.setItem('hc_training_plan_cache', JSON.stringify(invalidCache));
      const loaded = await trainingStorage.loadPlanCache();

      expect(loaded).toBeNull();
      const stored = await AsyncStorage.getItem('hc_training_plan_cache');
      expect(stored).toBeNull();
    });

    it('should handle corrupted JSON gracefully', async () => {
      await AsyncStorage.setItem('hc_training_plan_cache', 'corrupted json');
      const cache = await trainingStorage.loadPlanCache();
      expect(cache).toBeNull();
    });

    it('should handle save errors', async () => {
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Save error'));

      const mockCache = {
        weeklyPlan: { id: 'plan-1', days: [], totalWorkouts: 0, completedWorkouts: 0 },
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: '2025-01-15T00:00:00.000Z',
        preferences: null,
      };

      await expect(trainingStorage.savePlanCache(mockCache)).rejects.toThrow('Save error');
    });
  });

  describe('saveCompletePlan / loadCompletePlan', () => {
    it('should save and load complete plan', async () => {
      const mockPlan = {
        id: 'complete-plan-1',
        programName: 'Strength Builder',
        totalWeeks: 12,
        weeks: [],
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      await trainingStorage.saveCompletePlan(mockPlan);
      const loaded = await trainingStorage.loadCompletePlan();

      expect(loaded).toEqual(mockPlan);
    });

    it('should return null when no complete plan exists', async () => {
      const plan = await trainingStorage.loadCompletePlan();
      expect(plan).toBeNull();
    });
  });

  describe('saveStats / loadStats', () => {
    it('should save and load training stats', async () => {
      const mockStats = {
        totalWorkouts: 25,
        totalVolume: 50000,
        averageWorkoutDuration: 45,
        streak: 7,
        lastWorkoutDate: '2025-01-15',
      };

      await trainingStorage.saveStats(mockStats);
      const loaded = await trainingStorage.loadStats();

      expect(loaded).toEqual(mockStats);
    });

    it('should return null when no stats exist', async () => {
      const stats = await trainingStorage.loadStats();
      expect(stats).toBeNull();
    });

    it('should handle save errors gracefully', async () => {
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Stats save error'));
      const mockStats = { totalWorkouts: 10, totalVolume: 10000 };
      await expect(trainingStorage.saveStats(mockStats)).resolves.not.toThrow();
    });
  });

  describe('haveGoalsChanged / updateGoalHash', () => {
    it('should return false for first-time check and save hash', async () => {
      const goalState = {
        primaryGoal: 'muscle',
        targetWeight: 180,
        activityLevel: 'moderate',
        workoutsPerWeek: 4,
      };

      const changed = await trainingStorage.haveGoalsChanged(goalState);
      expect(changed).toBe(false);

      // Hash should be saved
      const saved = await AsyncStorage.getItem('hc_last_goal_hash');
      expect(saved).toBeTruthy();
    });

    it('should return true when goals have changed', async () => {
      const goalState1 = { primaryGoal: 'muscle', workoutsPerWeek: 4 };
      const goalState2 = { primaryGoal: 'fat_loss', workoutsPerWeek: 5 };

      await trainingStorage.haveGoalsChanged(goalState1);
      const changed = await trainingStorage.haveGoalsChanged(goalState2);

      expect(changed).toBe(true);
    });

    it('should return false when goals are the same', async () => {
      const goalState = { primaryGoal: 'muscle', workoutsPerWeek: 4 };

      await trainingStorage.haveGoalsChanged(goalState);
      const changed = await trainingStorage.haveGoalsChanged(goalState);

      expect(changed).toBe(false);
    });

    it('should handle null goal state', async () => {
      const changed = await trainingStorage.haveGoalsChanged(null);
      expect(changed).toBe(false);
    });

    it('should handle storage errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));
      const changed = await trainingStorage.haveGoalsChanged({ primaryGoal: 'muscle' });
      expect(changed).toBe(false);
    });
  });

  describe('savePreferences / loadPreferences', () => {
    it('should save and load preferences', async () => {
      const mockPreferences = {
        equipmentAvailable: ['barbell', 'dumbbells'],
        excludedExercises: ['burpees'],
        preferredSplit: 'upper_lower',
      };

      await trainingStorage.savePreferences(mockPreferences);
      const loaded = await trainingStorage.loadPreferences();

      expect(loaded).toEqual(mockPreferences);
    });

    it('should return null when no preferences exist', async () => {
      const prefs = await trainingStorage.loadPreferences();
      expect(prefs).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all training data', async () => {
      await trainingStorage.savePlanCache({
        weeklyPlan: { id: 'plan-1', days: [], totalWorkouts: 0, completedWorkouts: 0 },
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: '2025-01-15T00:00:00.000Z',
        preferences: null,
      });

      await trainingStorage.saveStats({ totalWorkouts: 10, totalVolume: 10000 });
      await trainingStorage.savePreferences({ equipmentAvailable: ['barbell'] });

      await trainingStorage.clearAll();

      const cache = await trainingStorage.loadPlanCache();
      const stats = await trainingStorage.loadStats();
      const prefs = await trainingStorage.loadPreferences();

      expect(cache).toBeNull();
      expect(stats).toBeNull();
      expect(prefs).toBeNull();
    });

    it('should handle clear errors gracefully', async () => {
      AsyncStorage.multiRemove.mockRejectedValueOnce(new Error('Clear error'));
      await expect(trainingStorage.clearAll()).resolves.not.toThrow();
    });
  });

  describe('clearPlan', () => {
    it('should clear only plan data, keeping stats', async () => {
      await trainingStorage.savePlanCache({
        weeklyPlan: { id: 'plan-1', days: [], totalWorkouts: 0, completedWorkouts: 0 },
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: '2025-01-15T00:00:00.000Z',
        preferences: null,
      });

      await trainingStorage.saveStats({ totalWorkouts: 10, totalVolume: 10000 });

      await trainingStorage.clearPlan();

      const cache = await trainingStorage.loadPlanCache();
      const stats = await trainingStorage.loadStats();

      expect(cache).toBeNull();
      expect(stats).not.toBeNull();
    });
  });

  describe('updateWorkoutCompletion', () => {
    it('should mark workout as completed', async () => {
      await trainingStorage.savePlanCache({
        weeklyPlan: {
          id: 'plan-1',
          days: [
            {
              dayOfWeek: 'Monday',
              workout: {
                id: 'workout-1',
                name: 'Upper Body',
                exercises: [{ id: 'ex-1', name: 'Bench Press', sets: 3, reps: 10 }],
                completed: false,
              },
              isRestDay: false,
              completed: false,
            },
          ],
          totalWorkouts: 1,
          completedWorkouts: 0,
        },
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: '2025-01-15T00:00:00.000Z',
        preferences: null,
      });

      await trainingStorage.updateWorkoutCompletion(0, true);

      const cache = await trainingStorage.loadPlanCache();
      expect(cache!.weeklyPlan.days[0].completed).toBe(true);
      expect(cache!.weeklyPlan.completedWorkouts).toBe(1);
    });

    it('should mark specific exercises as completed', async () => {
      await trainingStorage.savePlanCache({
        weeklyPlan: {
          id: 'plan-1',
          days: [
            {
              dayOfWeek: 'Monday',
              workout: {
                id: 'workout-1',
                name: 'Upper Body',
                exercises: [
                  { id: 'ex-1', name: 'Bench Press', sets: 3, reps: 10, completed: false },
                  { id: 'ex-2', name: 'Rows', sets: 3, reps: 10, completed: false },
                ],
                completed: false,
              },
              isRestDay: false,
              completed: false,
            },
          ],
          totalWorkouts: 1,
          completedWorkouts: 0,
        },
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: '2025-01-15T00:00:00.000Z',
        preferences: null,
      });

      await trainingStorage.updateWorkoutCompletion(0, false, ['ex-1']);

      const cache = await trainingStorage.loadPlanCache();
      expect(cache!.weeklyPlan.days[0].workout!.exercises[0].completed).toBe(true);
      expect(cache!.weeklyPlan.days[0].workout!.exercises[1].completed).toBe(false);
    });

    it('should do nothing when no cache exists', async () => {
      await expect(trainingStorage.updateWorkoutCompletion(0, true)).resolves.not.toThrow();
    });
  });

  describe('getWeeklyProgress', () => {
    it('should return progress data', async () => {
      await trainingStorage.savePlanCache({
        weeklyPlan: {
          id: 'plan-1',
          days: [
            {
              dayOfWeek: 'Monday',
              workout: { id: 'w1', name: 'Upper', exercises: [], completed: true },
              isRestDay: false,
              completed: true,
            },
            {
              dayOfWeek: 'Wednesday',
              workout: { id: 'w2', name: 'Lower', exercises: [], completed: false },
              isRestDay: false,
              completed: false,
            },
          ],
          totalWorkouts: 2,
          completedWorkouts: 1,
        },
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: '2025-01-15T00:00:00.000Z',
        preferences: null,
      });

      const progress = await trainingStorage.getWeeklyProgress();

      expect(progress).toEqual({
        completed: 1,
        total: 2,
        percentage: 50,
      });
    });

    it('should return null when no cache exists', async () => {
      const progress = await trainingStorage.getWeeklyProgress();
      expect(progress).toBeNull();
    });
  });

  describe('hasPlan', () => {
    it('should return true when plan exists', async () => {
      await trainingStorage.savePlanCache({
        weeklyPlan: { id: 'plan-1', days: [], totalWorkouts: 0, completedWorkouts: 0 },
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: '2025-01-15T00:00:00.000Z',
        preferences: null,
      });

      const hasPlan = await trainingStorage.hasPlan();
      expect(hasPlan).toBe(true);
    });

    it('should return false when no plan exists', async () => {
      const hasPlan = await trainingStorage.hasPlan();
      expect(hasPlan).toBe(false);
    });
  });

  describe('getPlanAge', () => {
    it('should return age in days', async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

      await trainingStorage.savePlanCache({
        weeklyPlan: { id: 'plan-1', days: [], totalWorkouts: 0, completedWorkouts: 0 },
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: fiveDaysAgo,
        preferences: null,
      });

      const age = await trainingStorage.getPlanAge();
      expect(age).toBe(5);
    });

    it('should return null when no plan exists', async () => {
      const age = await trainingStorage.getPlanAge();
      expect(age).toBeNull();
    });
  });

  describe('shouldRegeneratePlan', () => {
    it('should return true when plan is older than 7 days', async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

      await trainingStorage.savePlanCache({
        weeklyPlan: { id: 'plan-1', days: [], totalWorkouts: 0, completedWorkouts: 0 },
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: eightDaysAgo,
        preferences: null,
      });

      const shouldRegenerate = await trainingStorage.shouldRegeneratePlan();
      expect(shouldRegenerate).toBe(true);
    });

    it('should return false when plan is fresh', async () => {
      const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

      await trainingStorage.savePlanCache({
        weeklyPlan: { id: 'plan-1', days: [], totalWorkouts: 0, completedWorkouts: 0 },
        selectedProgram: null,
        goalAlignment: null,
        currentWeek: 1,
        lastGeneratedAt: yesterday,
        preferences: null,
      });

      const shouldRegenerate = await trainingStorage.shouldRegeneratePlan();
      expect(shouldRegenerate).toBe(false);
    });

    it('should return true when no plan exists', async () => {
      const shouldRegenerate = await trainingStorage.shouldRegeneratePlan();
      expect(shouldRegenerate).toBe(true);
    });
  });
});
