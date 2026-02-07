/**
 * Tests for habitFormationStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getHabits,
  saveHabits,
  addHabit,
  updateHabit,
  deleteHabit,
  getCompletions,
  saveCompletion,
  getTodayCompletions,
  getStreaks,
  saveStreaks,
  updateStreak,
  getStacks,
  saveStack,
  clearAllHabitData,
} from '../habitFormationStorage';
import { Habit, HabitCompletion, HabitStreak, HabitStack } from '../../types/habitFormation';

// Helper to create a mock Habit
function createMockHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Morning Water',
    description: 'Drink water upon waking',
    category: 'hydration',
    icon: 'water',
    frequency: 'daily',
    reminderEnabled: true,
    createdAt: Date.now(),
    isActive: true,
    ...overrides,
  };
}

// Helper to create a mock HabitCompletion
function createMockCompletion(overrides: Partial<HabitCompletion> = {}): HabitCompletion {
  return {
    habitId: 'habit-1',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    completedAt: Date.now(),
    ...overrides,
  };
}

// Helper to create a mock HabitStreak
function createMockStreak(overrides: Partial<HabitStreak> = {}): HabitStreak {
  return {
    habitId: 'habit-1',
    currentStreak: 5,
    longestStreak: 10,
    totalCompletions: 30,
    completionRate: 85,
    lastCompletedDate: new Date().toISOString().split('T')[0],
    ...overrides,
  };
}

// Helper to create a mock HabitStack
function createMockStack(overrides: Partial<HabitStack> = {}): HabitStack {
  return {
    id: 'stack-1',
    name: 'Morning Routine',
    habitIds: ['habit-1', 'habit-2'],
    triggerHabitId: 'habit-1',
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('habitFormationStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  // ============ Habits ============

  describe('getHabits', () => {
    it('should return empty array when no habits saved', async () => {
      const habits = await getHabits();
      expect(habits).toEqual([]);
    });

    it('should return saved habits', async () => {
      const mockHabits = [createMockHabit(), createMockHabit({ id: 'habit-2', name: 'Workout' })];
      await AsyncStorage.setItem('@habits_list', JSON.stringify(mockHabits));

      const habits = await getHabits();
      expect(habits).toHaveLength(2);
      expect(habits[0].id).toBe('habit-1');
      expect(habits[1].id).toBe('habit-2');
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const habits = await getHabits();
      expect(habits).toEqual([]);
    });
  });

  describe('saveHabits', () => {
    it('should persist habits to storage', async () => {
      const mockHabits = [createMockHabit()];
      await saveHabits(mockHabits);

      const stored = await AsyncStorage.getItem('@habits_list');
      expect(JSON.parse(stored!)).toEqual(mockHabits);
    });

    it('should overwrite existing habits', async () => {
      await saveHabits([createMockHabit({ id: 'old' })]);
      await saveHabits([createMockHabit({ id: 'new' })]);

      const stored = await AsyncStorage.getItem('@habits_list');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('new');
    });
  });

  describe('addHabit', () => {
    it('should add a habit to empty storage', async () => {
      const habit = createMockHabit();
      const result = await addHabit(habit);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('habit-1');
    });

    it('should append to existing habits', async () => {
      await saveHabits([createMockHabit({ id: 'habit-1' })]);

      const newHabit = createMockHabit({ id: 'habit-2', name: 'Exercise' });
      const result = await addHabit(newHabit);

      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('habit-2');
    });

    it('should persist the added habit', async () => {
      await addHabit(createMockHabit());

      const stored = await AsyncStorage.getItem('@habits_list');
      expect(JSON.parse(stored!)).toHaveLength(1);
    });
  });

  describe('updateHabit', () => {
    it('should update an existing habit', async () => {
      await saveHabits([createMockHabit({ id: 'habit-1', name: 'Old Name' })]);

      const result = await updateHabit('habit-1', { name: 'New Name' });
      expect(result[0].name).toBe('New Name');
    });

    it('should preserve other fields when updating', async () => {
      await saveHabits([createMockHabit({ id: 'habit-1', category: 'fitness' })]);

      const result = await updateHabit('habit-1', { name: 'Updated' });
      expect(result[0].category).toBe('fitness');
      expect(result[0].name).toBe('Updated');
    });

    it('should not modify list if habit ID not found', async () => {
      await saveHabits([createMockHabit({ id: 'habit-1' })]);

      const result = await updateHabit('nonexistent', { name: 'Nope' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Morning Water');
    });

    it('should persist the update', async () => {
      await saveHabits([createMockHabit({ id: 'habit-1' })]);
      await updateHabit('habit-1', { name: 'Updated' });

      const stored = await AsyncStorage.getItem('@habits_list');
      expect(JSON.parse(stored!)[0].name).toBe('Updated');
    });
  });

  describe('deleteHabit', () => {
    it('should remove habit by ID', async () => {
      await saveHabits([
        createMockHabit({ id: 'habit-1' }),
        createMockHabit({ id: 'habit-2' }),
      ]);

      const result = await deleteHabit('habit-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('habit-2');
    });

    it('should return unchanged list when ID not found', async () => {
      await saveHabits([createMockHabit({ id: 'habit-1' })]);

      const result = await deleteHabit('nonexistent');
      expect(result).toHaveLength(1);
    });

    it('should persist the deletion', async () => {
      await saveHabits([createMockHabit({ id: 'habit-1' })]);
      await deleteHabit('habit-1');

      const stored = await AsyncStorage.getItem('@habits_list');
      expect(JSON.parse(stored!)).toHaveLength(0);
    });
  });

  // ============ Completions ============

  describe('getCompletions', () => {
    it('should return empty array when no completions saved', async () => {
      const completions = await getCompletions();
      expect(completions).toEqual([]);
    });

    it('should filter completions by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const oldDate = '2020-01-01';
      const completions = [
        createMockCompletion({ date: today }),
        createMockCompletion({ habitId: 'habit-2', date: oldDate }),
      ];
      await AsyncStorage.setItem('@habits_completions', JSON.stringify(completions));

      const result = await getCompletions(30);
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe(today);
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const completions = await getCompletions();
      expect(completions).toEqual([]);
    });
  });

  describe('saveCompletion', () => {
    it('should save a new completion', async () => {
      const completion = createMockCompletion();
      const result = await saveCompletion(completion);

      expect(result).toHaveLength(1);
      expect(result[0].habitId).toBe('habit-1');
    });

    it('should update existing completion for same habit and date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const completion1 = createMockCompletion({ date: today, status: 'pending' });
      await saveCompletion(completion1);

      const completion2 = createMockCompletion({ date: today, status: 'completed' });
      const result = await saveCompletion(completion2);

      // Should not have duplicate entries for same habit + date
      const matchingEntries = result.filter(
        (c) => c.habitId === 'habit-1' && c.date === today
      );
      expect(matchingEntries).toHaveLength(1);
      expect(matchingEntries[0].status).toBe('completed');
    });

    it('should persist the completion', async () => {
      await saveCompletion(createMockCompletion());

      const stored = await AsyncStorage.getItem('@habits_completions');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!).length).toBeGreaterThan(0);
    });
  });

  describe('getTodayCompletions', () => {
    it('should return only today completions', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const completions = [
        createMockCompletion({ habitId: 'habit-1', date: today }),
        createMockCompletion({ habitId: 'habit-2', date: yesterdayStr }),
      ];
      await AsyncStorage.setItem('@habits_completions', JSON.stringify(completions));

      const result = await getTodayCompletions();
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe(today);
    });

    it('should return empty array when no completions for today', async () => {
      const result = await getTodayCompletions();
      expect(result).toEqual([]);
    });
  });

  // ============ Streaks ============

  describe('getStreaks', () => {
    it('should return empty array when no streaks saved', async () => {
      const streaks = await getStreaks();
      expect(streaks).toEqual([]);
    });

    it('should return saved streaks', async () => {
      const mockStreaks = [createMockStreak()];
      await AsyncStorage.setItem('@habits_streaks', JSON.stringify(mockStreaks));

      const streaks = await getStreaks();
      expect(streaks).toHaveLength(1);
      expect(streaks[0].currentStreak).toBe(5);
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const streaks = await getStreaks();
      expect(streaks).toEqual([]);
    });
  });

  describe('saveStreaks', () => {
    it('should persist streaks to storage', async () => {
      const mockStreaks = [createMockStreak()];
      await saveStreaks(mockStreaks);

      const stored = await AsyncStorage.getItem('@habits_streaks');
      expect(JSON.parse(stored!)).toEqual(mockStreaks);
    });
  });

  describe('updateStreak', () => {
    it('should create a new streak if none exists for the habit', async () => {
      const result = await updateStreak('habit-new', true);

      expect(result).toHaveLength(1);
      expect(result[0].habitId).toBe('habit-new');
      expect(result[0].currentStreak).toBe(1);
      expect(result[0].totalCompletions).toBe(1);
    });

    it('should increment streak on consecutive day completion', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const existingStreak = createMockStreak({
        habitId: 'habit-1',
        currentStreak: 3,
        longestStreak: 5,
        totalCompletions: 10,
        lastCompletedDate: yesterdayStr,
      });
      await AsyncStorage.setItem('@habits_streaks', JSON.stringify([existingStreak]));

      const result = await updateStreak('habit-1', true);
      const streak = result.find((s) => s.habitId === 'habit-1');

      expect(streak!.currentStreak).toBe(4);
      expect(streak!.totalCompletions).toBe(11);
    });

    it('should reset streak when day gap is more than 1', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

      const existingStreak = createMockStreak({
        habitId: 'habit-1',
        currentStreak: 5,
        lastCompletedDate: threeDaysAgoStr,
      });
      await AsyncStorage.setItem('@habits_streaks', JSON.stringify([existingStreak]));

      const result = await updateStreak('habit-1', true);
      const streak = result.find((s) => s.habitId === 'habit-1');

      expect(streak!.currentStreak).toBe(1);
    });

    it('should not increment streak if already completed today', async () => {
      const today = new Date().toISOString().split('T')[0];
      const existingStreak = createMockStreak({
        habitId: 'habit-1',
        currentStreak: 5,
        totalCompletions: 20,
        lastCompletedDate: today,
      });
      await AsyncStorage.setItem('@habits_streaks', JSON.stringify([existingStreak]));

      const result = await updateStreak('habit-1', true);
      const streak = result.find((s) => s.habitId === 'habit-1');

      expect(streak!.currentStreak).toBe(5);
      // totalCompletions still increments even on same day
      expect(streak!.totalCompletions).toBe(21);
    });

    it('should update longest streak when current exceeds it', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const existingStreak = createMockStreak({
        habitId: 'habit-1',
        currentStreak: 5,
        longestStreak: 5,
        lastCompletedDate: yesterdayStr,
      });
      await AsyncStorage.setItem('@habits_streaks', JSON.stringify([existingStreak]));

      const result = await updateStreak('habit-1', true);
      const streak = result.find((s) => s.habitId === 'habit-1');

      expect(streak!.currentStreak).toBe(6);
      expect(streak!.longestStreak).toBe(6);
    });

    it('should not modify streak when completed is false', async () => {
      const existingStreak = createMockStreak({
        habitId: 'habit-1',
        currentStreak: 5,
        totalCompletions: 20,
      });
      await AsyncStorage.setItem('@habits_streaks', JSON.stringify([existingStreak]));

      const result = await updateStreak('habit-1', false);
      const streak = result.find((s) => s.habitId === 'habit-1');

      expect(streak!.currentStreak).toBe(5);
      expect(streak!.totalCompletions).toBe(20);
    });
  });

  // ============ Stacks ============

  describe('getStacks', () => {
    it('should return empty array when no stacks saved', async () => {
      const stacks = await getStacks();
      expect(stacks).toEqual([]);
    });

    it('should return saved stacks', async () => {
      const mockStacks = [createMockStack()];
      await AsyncStorage.setItem('@habits_stacks', JSON.stringify(mockStacks));

      const stacks = await getStacks();
      expect(stacks).toHaveLength(1);
      expect(stacks[0].name).toBe('Morning Routine');
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const stacks = await getStacks();
      expect(stacks).toEqual([]);
    });
  });

  describe('saveStack', () => {
    it('should add a stack to empty storage', async () => {
      const stack = createMockStack();
      const result = await saveStack(stack);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('stack-1');
    });

    it('should append stack to existing stacks', async () => {
      await AsyncStorage.setItem('@habits_stacks', JSON.stringify([createMockStack({ id: 'stack-1' })]));

      const newStack = createMockStack({ id: 'stack-2', name: 'Evening Routine' });
      const result = await saveStack(newStack);

      expect(result).toHaveLength(2);
    });

    it('should persist the stack', async () => {
      await saveStack(createMockStack());

      const stored = await AsyncStorage.getItem('@habits_stacks');
      expect(JSON.parse(stored!)).toHaveLength(1);
    });
  });

  // ============ Clear All ============

  describe('clearAllHabitData', () => {
    it('should remove all habit storage keys', async () => {
      await saveHabits([createMockHabit()]);
      await saveStreaks([createMockStreak()]);
      await saveStack(createMockStack());
      await AsyncStorage.setItem('@habits_completions', JSON.stringify([createMockCompletion()]));

      await clearAllHabitData();

      const habits = await getHabits();
      const streaks = await getStreaks();
      const stacks = await getStacks();
      const completions = await getCompletions();

      expect(habits).toEqual([]);
      expect(streaks).toEqual([]);
      expect(stacks).toEqual([]);
      expect(completions).toEqual([]);
    });
  });
});
