/**
 * Tests for workoutFormCoachStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getExerciseHistory,
  saveExerciseHistory,
  updateExerciseHistory,
  getExerciseHistoryById,
  getFormChecks,
  saveFormCheck,
  getFormChecksForExercise,
  getDailyTip,
  saveDailyTip,
  markDailyTipSeen,
  getCoachingSessions,
  saveCoachingSession,
  getFavoriteExercises,
  toggleFavoriteExercise,
  clearAllFormCoachData,
} from '../workoutFormCoachStorage';
import {
  ExerciseHistory,
  FormCheckResult,
  DailyFormTip,
  CoachingSession,
  FORM_COACH_CONSTANTS,
} from '../../types/workoutFormCoach';

// Helper to create a mock ExerciseHistory
function createMockExerciseHistory(overrides: Partial<ExerciseHistory> = {}): ExerciseHistory {
  return {
    exerciseId: 'bench_press',
    exerciseName: 'Barbell Bench Press',
    lastPerformed: new Date().toISOString().split('T')[0],
    timesPerformed: 10,
    personalBest: { weight: 100, reps: 8 },
    notes: ['Good form today'],
    formIssuesNoted: ['Slight elbow flare'],
    ...overrides,
  };
}

// Helper to create a mock FormCheckResult
function createMockFormCheck(overrides: Partial<FormCheckResult> = {}): FormCheckResult {
  return {
    exerciseId: 'bench_press',
    exerciseName: 'Barbell Bench Press',
    timestamp: Date.now(),
    overallScore: 85,
    cuesFollowed: ['Plant feet firmly', 'Squeeze shoulder blades'],
    mistakesIdentified: ['Slight elbow flare'],
    personalizedTips: ['Focus on keeping elbows at 45 degrees'],
    ...overrides,
  };
}

// Helper to create a mock DailyFormTip
function createMockDailyTip(overrides: Partial<DailyFormTip> = {}): DailyFormTip {
  return {
    id: 'tip-1',
    date: new Date().toISOString().split('T')[0],
    exerciseId: 'bench_press',
    exerciseName: 'Barbell Bench Press',
    tip: 'Keep your shoulder blades squeezed together during the entire set.',
    category: 'chest',
    seen: false,
    ...overrides,
  };
}

// Helper to create a mock CoachingSession
function createMockCoachingSession(overrides: Partial<CoachingSession> = {}): CoachingSession {
  return {
    id: 'session-1',
    exerciseId: 'bench_press',
    exerciseName: 'Barbell Bench Press',
    date: new Date().toISOString().split('T')[0],
    duration: 300,
    setsCompleted: 4,
    formScore: 88,
    cuesReviewed: ['Plant feet', 'Squeeze shoulder blades'],
    mistakesCorrected: ['Elbow flare'],
    notes: 'Good session',
    ...overrides,
  };
}

describe('workoutFormCoachStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  // ============ Exercise History ============

  describe('getExerciseHistory', () => {
    it('should return empty array when no history saved', async () => {
      const history = await getExerciseHistory();
      expect(history).toEqual([]);
    });

    it('should return saved history', async () => {
      const mockHistory = [createMockExerciseHistory()];
      await AsyncStorage.setItem('@form_coach_exercise_history', JSON.stringify(mockHistory));

      const history = await getExerciseHistory();
      expect(history).toHaveLength(1);
      expect(history[0].exerciseId).toBe('bench_press');
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const history = await getExerciseHistory();
      expect(history).toEqual([]);
    });
  });

  describe('saveExerciseHistory', () => {
    it('should persist history to storage', async () => {
      const history = [createMockExerciseHistory()];
      await saveExerciseHistory(history);

      const stored = await AsyncStorage.getItem('@form_coach_exercise_history');
      expect(JSON.parse(stored!)).toHaveLength(1);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveExerciseHistory([createMockExerciseHistory()])).rejects.toThrow('Storage error');
    });
  });

  describe('updateExerciseHistory', () => {
    it('should create new entry for unknown exercise', async () => {
      const result = await updateExerciseHistory('squat', 'Barbell Back Squat');

      expect(result).toHaveLength(1);
      expect(result[0].exerciseId).toBe('squat');
      expect(result[0].exerciseName).toBe('Barbell Back Squat');
      expect(result[0].timesPerformed).toBe(1);
      expect(result[0].notes).toEqual([]);
      expect(result[0].formIssuesNoted).toEqual([]);
    });

    it('should update existing entry and increment timesPerformed', async () => {
      const existing = [createMockExerciseHistory({ exerciseId: 'bench_press', timesPerformed: 5 })];
      await AsyncStorage.setItem('@form_coach_exercise_history', JSON.stringify(existing));

      const result = await updateExerciseHistory('bench_press', 'Barbell Bench Press');
      const entry = result.find((h) => h.exerciseId === 'bench_press');

      expect(entry!.timesPerformed).toBe(6);
    });

    it('should update personal best when new value is higher', async () => {
      const existing = [
        createMockExerciseHistory({
          exerciseId: 'bench_press',
          personalBest: { weight: 100, reps: 8 },
        }),
      ];
      await AsyncStorage.setItem('@form_coach_exercise_history', JSON.stringify(existing));

      const result = await updateExerciseHistory(
        'bench_press',
        'Barbell Bench Press',
        { weight: 110, reps: 6 }
      );
      const entry = result.find((h) => h.exerciseId === 'bench_press');

      expect(entry!.personalBest.weight).toBe(110);
      // reps is not higher (6 < 8), so should stay at 8
      expect(entry!.personalBest.reps).toBe(8);
    });

    it('should not downgrade personal best', async () => {
      const existing = [
        createMockExerciseHistory({
          exerciseId: 'bench_press',
          personalBest: { weight: 100 },
        }),
      ];
      await AsyncStorage.setItem('@form_coach_exercise_history', JSON.stringify(existing));

      const result = await updateExerciseHistory(
        'bench_press',
        'Barbell Bench Press',
        { weight: 80 }
      );
      const entry = result.find((h) => h.exerciseId === 'bench_press');

      expect(entry!.personalBest.weight).toBe(100);
    });

    it('should add notes (keeping last 10)', async () => {
      const existingNotes = Array.from({ length: 10 }, (_, i) => `Note ${i}`);
      const existing = [
        createMockExerciseHistory({
          exerciseId: 'bench_press',
          notes: existingNotes,
        }),
      ];
      await AsyncStorage.setItem('@form_coach_exercise_history', JSON.stringify(existing));

      const result = await updateExerciseHistory(
        'bench_press',
        'Barbell Bench Press',
        undefined,
        'New note'
      );
      const entry = result.find((h) => h.exerciseId === 'bench_press');

      expect(entry!.notes).toHaveLength(10);
      expect(entry!.notes[0]).toBe('New note');
    });

    it('should add form issues (keeping last 10)', async () => {
      const result = await updateExerciseHistory(
        'squat',
        'Barbell Back Squat',
        undefined,
        undefined,
        'Knees caving in'
      );
      const entry = result.find((h) => h.exerciseId === 'squat');

      expect(entry!.formIssuesNoted).toEqual(['Knees caving in']);
    });

    it('should set lastPerformed to today', async () => {
      const today = new Date().toISOString().split('T')[0];
      const result = await updateExerciseHistory('squat', 'Barbell Back Squat');

      expect(result[0].lastPerformed).toBe(today);
    });

    it('should persist the update', async () => {
      await updateExerciseHistory('squat', 'Barbell Back Squat');

      const stored = await AsyncStorage.getItem('@form_coach_exercise_history');
      expect(JSON.parse(stored!)).toHaveLength(1);
    });
  });

  describe('getExerciseHistoryById', () => {
    it('should return null when exercise not found', async () => {
      const result = await getExerciseHistoryById('nonexistent');
      expect(result).toBeNull();
    });

    it('should return specific exercise history', async () => {
      const history = [
        createMockExerciseHistory({ exerciseId: 'bench_press' }),
        createMockExerciseHistory({ exerciseId: 'squat', exerciseName: 'Barbell Back Squat' }),
      ];
      await AsyncStorage.setItem('@form_coach_exercise_history', JSON.stringify(history));

      const result = await getExerciseHistoryById('squat');
      expect(result).not.toBeNull();
      expect(result!.exerciseName).toBe('Barbell Back Squat');
    });
  });

  // ============ Form Checks ============

  describe('getFormChecks', () => {
    it('should return empty array when no checks saved', async () => {
      const checks = await getFormChecks();
      expect(checks).toEqual([]);
    });

    it('should return saved form checks', async () => {
      const mockChecks = [createMockFormCheck()];
      await AsyncStorage.setItem('@form_coach_form_checks', JSON.stringify(mockChecks));

      const checks = await getFormChecks();
      expect(checks).toHaveLength(1);
      expect(checks[0].overallScore).toBe(85);
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const checks = await getFormChecks();
      expect(checks).toEqual([]);
    });
  });

  describe('saveFormCheck', () => {
    it('should save a new form check and prepend it', async () => {
      const check = createMockFormCheck({ overallScore: 90 });
      const result = await saveFormCheck(check);

      expect(result).toHaveLength(1);
      expect(result[0].overallScore).toBe(90);
    });

    it('should prepend new checks (most recent first)', async () => {
      await saveFormCheck(createMockFormCheck({ overallScore: 80 }));
      const result = await saveFormCheck(createMockFormCheck({ overallScore: 95 }));

      expect(result[0].overallScore).toBe(95);
      expect(result[1].overallScore).toBe(80);
    });

    it('should limit checks to MAX_FORM_CHECKS', async () => {
      const existingChecks = Array.from({ length: FORM_COACH_CONSTANTS.MAX_FORM_CHECKS }, (_, i) =>
        createMockFormCheck({ overallScore: i })
      );
      await AsyncStorage.setItem('@form_coach_form_checks', JSON.stringify(existingChecks));

      const result = await saveFormCheck(createMockFormCheck({ overallScore: 99 }));
      expect(result).toHaveLength(FORM_COACH_CONSTANTS.MAX_FORM_CHECKS);
      expect(result[0].overallScore).toBe(99);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveFormCheck(createMockFormCheck())).rejects.toThrow('Storage error');
    });
  });

  describe('getFormChecksForExercise', () => {
    it('should return only checks for specified exercise', async () => {
      const checks = [
        createMockFormCheck({ exerciseId: 'bench_press' }),
        createMockFormCheck({ exerciseId: 'squat' }),
        createMockFormCheck({ exerciseId: 'bench_press' }),
      ];
      await AsyncStorage.setItem('@form_coach_form_checks', JSON.stringify(checks));

      const result = await getFormChecksForExercise('bench_press');
      expect(result).toHaveLength(2);
      result.forEach((check) => expect(check.exerciseId).toBe('bench_press'));
    });

    it('should return empty array when no checks for exercise', async () => {
      const checks = [createMockFormCheck({ exerciseId: 'squat' })];
      await AsyncStorage.setItem('@form_coach_form_checks', JSON.stringify(checks));

      const result = await getFormChecksForExercise('deadlift');
      expect(result).toEqual([]);
    });
  });

  // ============ Daily Tip ============

  describe('getDailyTip', () => {
    it('should return null when no tip saved', async () => {
      const tip = await getDailyTip();
      expect(tip).toBeNull();
    });

    it('should return saved tip', async () => {
      const mockTip = createMockDailyTip();
      await AsyncStorage.setItem('@form_coach_daily_tip', JSON.stringify(mockTip));

      const tip = await getDailyTip();
      expect(tip).not.toBeNull();
      expect(tip!.exerciseId).toBe('bench_press');
      expect(tip!.seen).toBe(false);
    });

    it('should return null on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const tip = await getDailyTip();
      expect(tip).toBeNull();
    });
  });

  describe('saveDailyTip', () => {
    it('should save and retrieve tip', async () => {
      const tip = createMockDailyTip();
      await saveDailyTip(tip);

      const stored = await AsyncStorage.getItem('@form_coach_daily_tip');
      expect(JSON.parse(stored!).id).toBe('tip-1');
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveDailyTip(createMockDailyTip())).rejects.toThrow('Storage error');
    });
  });

  describe('markDailyTipSeen', () => {
    it('should mark existing tip as seen', async () => {
      const tip = createMockDailyTip({ seen: false });
      await AsyncStorage.setItem('@form_coach_daily_tip', JSON.stringify(tip));

      await markDailyTipSeen();

      const stored = await AsyncStorage.getItem('@form_coach_daily_tip');
      const parsed = JSON.parse(stored!);
      expect(parsed.seen).toBe(true);
    });

    it('should do nothing when no tip exists', async () => {
      // Should not throw
      await expect(markDailyTipSeen()).resolves.not.toThrow();
    });
  });

  // ============ Coaching Sessions ============

  describe('getCoachingSessions', () => {
    it('should return empty array when no sessions saved', async () => {
      const sessions = await getCoachingSessions();
      expect(sessions).toEqual([]);
    });

    it('should return saved sessions', async () => {
      const mockSessions = [createMockCoachingSession()];
      await AsyncStorage.setItem('@form_coach_coaching_sessions', JSON.stringify(mockSessions));

      const sessions = await getCoachingSessions();
      expect(sessions).toHaveLength(1);
    });

    it('should limit to specified count', async () => {
      const mockSessions = [
        createMockCoachingSession({ id: 's1' }),
        createMockCoachingSession({ id: 's2' }),
        createMockCoachingSession({ id: 's3' }),
      ];
      await AsyncStorage.setItem('@form_coach_coaching_sessions', JSON.stringify(mockSessions));

      const sessions = await getCoachingSessions(2);
      expect(sessions).toHaveLength(2);
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const sessions = await getCoachingSessions();
      expect(sessions).toEqual([]);
    });
  });

  describe('saveCoachingSession', () => {
    it('should save a new coaching session and prepend it', async () => {
      const session = createMockCoachingSession();
      const result = await saveCoachingSession(session);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('session-1');
    });

    it('should prepend new sessions (most recent first)', async () => {
      await saveCoachingSession(createMockCoachingSession({ id: 's1', formScore: 70 }));
      const result = await saveCoachingSession(createMockCoachingSession({ id: 's2', formScore: 90 }));

      expect(result[0].id).toBe('s2');
      expect(result[1].id).toBe('s1');
    });

    it('should limit sessions to MAX_COACHING_SESSIONS', async () => {
      const existingSessions = Array.from({ length: FORM_COACH_CONSTANTS.MAX_COACHING_SESSIONS }, (_, i) =>
        createMockCoachingSession({ id: `s-${i}` })
      );
      await AsyncStorage.setItem('@form_coach_coaching_sessions', JSON.stringify(existingSessions));

      const result = await saveCoachingSession(createMockCoachingSession({ id: 'new-session' }));
      expect(result).toHaveLength(FORM_COACH_CONSTANTS.MAX_COACHING_SESSIONS);
      expect(result[0].id).toBe('new-session');
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveCoachingSession(createMockCoachingSession())).rejects.toThrow('Storage error');
    });
  });

  // ============ Favorite Exercises ============

  describe('getFavoriteExercises', () => {
    it('should return empty array when no favorites saved', async () => {
      const favorites = await getFavoriteExercises();
      expect(favorites).toEqual([]);
    });

    it('should return saved favorites', async () => {
      const mockFavorites = ['bench_press', 'squat'];
      await AsyncStorage.setItem('@form_coach_favorite_exercises', JSON.stringify(mockFavorites));

      const favorites = await getFavoriteExercises();
      expect(favorites).toEqual(['bench_press', 'squat']);
    });

    it('should return empty array on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const favorites = await getFavoriteExercises();
      expect(favorites).toEqual([]);
    });
  });

  describe('toggleFavoriteExercise', () => {
    it('should add exercise to favorites when not present', async () => {
      const result = await toggleFavoriteExercise('bench_press');
      expect(result).toEqual(['bench_press']);
    });

    it('should remove exercise from favorites when already present', async () => {
      await AsyncStorage.setItem(
        '@form_coach_favorite_exercises',
        JSON.stringify(['bench_press', 'squat'])
      );

      const result = await toggleFavoriteExercise('bench_press');
      expect(result).toEqual(['squat']);
    });

    it('should persist the toggled state', async () => {
      await toggleFavoriteExercise('bench_press');

      const stored = await AsyncStorage.getItem('@form_coach_favorite_exercises');
      expect(JSON.parse(stored!)).toEqual(['bench_press']);
    });

    it('should toggle back (add then remove)', async () => {
      await toggleFavoriteExercise('deadlift');
      const result = await toggleFavoriteExercise('deadlift');

      expect(result).toEqual([]);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(toggleFavoriteExercise('bench_press')).rejects.toThrow('Storage error');
    });
  });

  // ============ Clear All ============

  describe('clearAllFormCoachData', () => {
    it('should remove all form coach storage keys', async () => {
      await saveExerciseHistory([createMockExerciseHistory()]);
      await saveFormCheck(createMockFormCheck());
      await saveDailyTip(createMockDailyTip());
      await saveCoachingSession(createMockCoachingSession());
      await toggleFavoriteExercise('bench_press');

      await clearAllFormCoachData();

      const history = await getExerciseHistory();
      const checks = await getFormChecks();
      const tip = await getDailyTip();
      const sessions = await getCoachingSessions();
      const favorites = await getFavoriteExercises();

      expect(history).toEqual([]);
      expect(checks).toEqual([]);
      expect(tip).toBeNull();
      expect(sessions).toEqual([]);
      expect(favorites).toEqual([]);
    });

    it('should throw on AsyncStorage error', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(clearAllFormCoachData()).rejects.toThrow('Storage error');
    });
  });
});
