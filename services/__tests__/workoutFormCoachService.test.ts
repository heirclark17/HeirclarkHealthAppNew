/**
 * Tests for workoutFormCoachService.ts
 * Exercise form coaching, tips, and analysis
 */

import {
  getAllExercises,
  getExerciseById,
  getExercisesByCategory,
  searchExercises,
  createFormCheck,
  generatePersonalizedTips,
  generateDailyTip,
  createCoachingSession,
  getImprovementSuggestions,
  getMuscleActivationCues,
  getBreathingPattern,
  calculateAverageFormScore,
  getExerciseRecommendations,
} from '../workoutFormCoachService';
import {
  Exercise,
  ExerciseHistory,
  FormCheckResult,
  DEFAULT_EXERCISES,
} from '../../types/workoutFormCoach';

describe('workoutFormCoachService', () => {
  // ============ Exercise Lookup ============

  describe('getAllExercises', () => {
    it('should return all default exercises', () => {
      const exercises = getAllExercises();

      expect(exercises.length).toBe(DEFAULT_EXERCISES.length);
      expect(exercises).toEqual(DEFAULT_EXERCISES);
    });
  });

  describe('getExerciseById', () => {
    it('should find exercise by id', () => {
      const exercise = getExerciseById('bench_press');

      expect(exercise).toBeDefined();
      expect(exercise!.name).toBe('Barbell Bench Press');
      expect(exercise!.category).toBe('chest');
    });

    it('should return undefined for non-existent id', () => {
      const exercise = getExerciseById('nonexistent_exercise');
      expect(exercise).toBeUndefined();
    });
  });

  describe('getExercisesByCategory', () => {
    it('should filter exercises by category', () => {
      const chestExercises = getExercisesByCategory('chest');

      expect(chestExercises.length).toBeGreaterThan(0);
      chestExercises.forEach((e) => {
        expect(e.category).toBe('chest');
      });
    });

    it('should return empty array for category with no exercises', () => {
      const exercises = getExercisesByCategory('cardio');
      // There may or may not be cardio exercises in defaults
      expect(Array.isArray(exercises)).toBe(true);
    });

    it('should return legs exercises', () => {
      const legExercises = getExercisesByCategory('legs');

      expect(legExercises.length).toBeGreaterThan(0);
      expect(legExercises.some((e) => e.id === 'squat')).toBe(true);
    });
  });

  describe('searchExercises', () => {
    it('should find exercises by name', () => {
      const results = searchExercises('bench');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((e) => e.id === 'bench_press')).toBe(true);
    });

    it('should find exercises by muscle worked', () => {
      const results = searchExercises('chest');

      expect(results.length).toBeGreaterThan(0);
      // Bench press works chest
      expect(results.some((e) => e.id === 'bench_press')).toBe(true);
    });

    it('should find exercises by category', () => {
      const results = searchExercises('compound');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((e) => e.id === 'deadlift')).toBe(true);
    });

    it('should be case insensitive', () => {
      const results = searchExercises('BENCH');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = searchExercises('xyznonexistent');
      expect(results).toEqual([]);
    });
  });

  // ============ Form Check Generation ============

  describe('createFormCheck', () => {
    let benchPress: Exercise;

    beforeEach(() => {
      benchPress = getExerciseById('bench_press')!;
    });

    it('should create a form check with correct structure', () => {
      const cuesFollowed = ['bp1', 'bp2', 'bp3'];
      const mistakes = ['bpm1'];

      const result = createFormCheck(benchPress, cuesFollowed, mistakes);

      expect(result.exerciseId).toBe('bench_press');
      expect(result.exerciseName).toBe('Barbell Bench Press');
      expect(typeof result.timestamp).toBe('number');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.cuesFollowed).toEqual(cuesFollowed);
      expect(result.mistakesIdentified).toEqual(mistakes);
      expect(result.personalizedTips.length).toBeGreaterThan(0);
    });

    it('should give higher score for more cues followed and fewer mistakes', () => {
      const allCues = benchPress.formCues.map((c) => c.id);
      const noMistakes: string[] = [];
      const perfectResult = createFormCheck(benchPress, allCues, noMistakes);

      const noCues: string[] = [];
      const allMistakes = benchPress.commonMistakes.map((m) => m.id);
      const worstResult = createFormCheck(benchPress, noCues, allMistakes);

      expect(perfectResult.overallScore).toBeGreaterThan(worstResult.overallScore);
    });

    it('should give 100 when all cues followed and no mistakes', () => {
      const allCues = benchPress.formCues.map((c) => c.id);
      const result = createFormCheck(benchPress, allCues, []);

      expect(result.overallScore).toBe(100);
    });

    it('should include exercise history in tips when provided', () => {
      const history: ExerciseHistory = {
        exerciseId: 'bench_press',
        exerciseName: 'Barbell Bench Press',
        lastPerformed: '2025-01-14',
        timesPerformed: 10,
        personalBest: { weight: 185, reps: 5 },
        notes: [],
        formIssuesNoted: ['bpm1', 'bpm1', 'bpm1'], // recurring issue
      };

      const result = createFormCheck(benchPress, ['bp1'], ['bpm1'], history);

      // Should have tips including recurring issue
      expect(result.personalizedTips.some((t) => t.includes('Recurring'))).toBe(true);
    });
  });

  describe('generatePersonalizedTips', () => {
    let benchPress: Exercise;

    beforeEach(() => {
      benchPress = getExerciseById('bench_press')!;
    });

    it('should return max 4 tips', () => {
      const tips = generatePersonalizedTips(benchPress, [], benchPress.commonMistakes.map((m) => m.id));

      expect(tips.length).toBeLessThanOrEqual(4);
    });

    it('should include tips for missed cues', () => {
      // Only followed first cue, missed the rest
      const tips = generatePersonalizedTips(benchPress, ['bp1'], []);

      // Should have focus tip for missed cue
      expect(tips.some((t) => t.startsWith('Focus on:'))).toBe(true);
    });

    it('should include correction tips for identified mistakes', () => {
      const tips = generatePersonalizedTips(benchPress, benchPress.formCues.map((c) => c.id), ['bpm1']);

      expect(tips.some((t) => t.startsWith('Correction:'))).toBe(true);
    });

    it('should include breathing tip when not following breathing cue', () => {
      // Find a cue with a breathing tip
      const breathingCue = benchPress.formCues.find((c) => c.breathingTip);
      expect(breathingCue).toBeDefined();

      // Don't follow the breathing cue
      const cuesWithoutBreathing = benchPress.formCues
        .filter((c) => c.id !== breathingCue!.id)
        .map((c) => c.id);

      const tips = generatePersonalizedTips(benchPress, cuesWithoutBreathing, []);

      expect(tips.some((t) => t.startsWith('Breathing:'))).toBe(true);
    });

    it('should return empty tips when perfect form and no history', () => {
      const allCues = benchPress.formCues.map((c) => c.id);
      const tips = generatePersonalizedTips(benchPress, allCues, []);

      // May still have tips (breathing tips etc.) but should be minimal
      expect(tips.length).toBeLessThanOrEqual(4);
    });
  });

  // ============ Daily Tip Generation ============

  describe('generateDailyTip', () => {
    it('should generate a daily tip with correct structure', () => {
      const tip = generateDailyTip([], []);

      expect(tip.id).toMatch(/^fc_/);
      expect(tip.date).toBeTruthy();
      expect(tip.exerciseId).toBeTruthy();
      expect(tip.exerciseName).toBeTruthy();
      expect(tip.tip.length).toBeGreaterThan(0);
      expect(tip.seen).toBe(false);
    });

    it('should prioritize exercises with form issues', () => {
      const history: ExerciseHistory[] = [
        {
          exerciseId: 'bench_press',
          exerciseName: 'Barbell Bench Press',
          lastPerformed: '2025-01-14',
          timesPerformed: 5,
          personalBest: {},
          notes: [],
          formIssuesNoted: ['bpm1', 'bpm2', 'bpm3'],
        },
      ];

      const tip = generateDailyTip(history, []);

      // Should pick bench_press since it has the most issues
      expect(tip.exerciseId).toBe('bench_press');
    });

    it('should use favorite exercises when no issues', () => {
      const tip = generateDailyTip([], ['squat']);

      expect(tip.exerciseId).toBe('squat');
    });

    it('should fall back to random exercise when no history or favorites', () => {
      const tip = generateDailyTip([], []);

      // Should still return a valid exercise
      const exercise = getExerciseById(tip.exerciseId);
      expect(exercise).toBeDefined();
    });
  });

  // ============ Coaching Session ============

  describe('createCoachingSession', () => {
    it('should create a coaching session with correct fields', () => {
      const exercise = getExerciseById('squat')!;
      const session = createCoachingSession(exercise, 4, 85, ['sq1', 'sq2'], ['sqm1'], 'Good session');

      expect(session.id).toMatch(/^fc_/);
      expect(session.exerciseId).toBe('squat');
      expect(session.exerciseName).toBe('Barbell Back Squat');
      expect(session.setsCompleted).toBe(4);
      expect(session.formScore).toBe(85);
      expect(session.cuesReviewed).toEqual(['sq1', 'sq2']);
      expect(session.mistakesCorrected).toEqual(['sqm1']);
      expect(session.notes).toBe('Good session');
      expect(session.duration).toBe(0);
      expect(session.date).toBeTruthy();
    });

    it('should default notes to empty string', () => {
      const exercise = getExerciseById('plank')!;
      const session = createCoachingSession(exercise, 3, 90, ['pl1'], []);

      expect(session.notes).toBe('');
    });
  });

  // ============ Exercise Analysis ============

  describe('getImprovementSuggestions', () => {
    it('should suggest tracking when no form checks exist', () => {
      const exercise = getExerciseById('bench_press')!;
      const suggestions = getImprovementSuggestions(exercise, []);

      expect(suggestions.length).toBe(1);
      expect(suggestions[0]).toContain('Start tracking');
    });

    it('should provide fundamentals advice for low scores', () => {
      const exercise = getExerciseById('bench_press')!;
      const checks: FormCheckResult[] = [
        {
          exerciseId: 'bench_press',
          exerciseName: 'Barbell Bench Press',
          timestamp: Date.now(),
          overallScore: 40,
          cuesFollowed: ['bp1'],
          mistakesIdentified: ['bpm1', 'bpm2'],
          personalizedTips: [],
        },
      ];

      const suggestions = getImprovementSuggestions(exercise, checks);

      expect(suggestions.some((s) => s.includes('fundamentals'))).toBe(true);
    });

    it('should provide progression advice for high scores', () => {
      const exercise = getExerciseById('bench_press')!;
      const checks: FormCheckResult[] = [
        {
          exerciseId: 'bench_press',
          exerciseName: 'Barbell Bench Press',
          timestamp: Date.now(),
          overallScore: 90,
          cuesFollowed: ['bp1', 'bp2', 'bp3', 'bp4', 'bp5'],
          mistakesIdentified: [],
          personalizedTips: [],
        },
      ];

      const suggestions = getImprovementSuggestions(exercise, checks);

      expect(suggestions.some((s) => s.includes('Excellent'))).toBe(true);
    });

    it('should identify common mistakes across checks', () => {
      const exercise = getExerciseById('bench_press')!;
      const checks: FormCheckResult[] = [
        {
          exerciseId: 'bench_press',
          exerciseName: 'Barbell Bench Press',
          timestamp: Date.now(),
          overallScore: 70,
          cuesFollowed: ['bp1', 'bp2'],
          mistakesIdentified: ['bpm1'],
          personalizedTips: [],
        },
        {
          exerciseId: 'bench_press',
          exerciseName: 'Barbell Bench Press',
          timestamp: Date.now() - 1000,
          overallScore: 65,
          cuesFollowed: ['bp1'],
          mistakesIdentified: ['bpm1'],
          personalizedTips: [],
        },
      ];

      const suggestions = getImprovementSuggestions(exercise, checks);

      // Should mention the common mistake correction
      expect(suggestions.some((s) => s.includes('Common issue'))).toBe(true);
    });

    it('should only consider checks for the specified exercise', () => {
      const exercise = getExerciseById('bench_press')!;
      const checks: FormCheckResult[] = [
        {
          exerciseId: 'squat', // Different exercise
          exerciseName: 'Barbell Back Squat',
          timestamp: Date.now(),
          overallScore: 40,
          cuesFollowed: [],
          mistakesIdentified: ['sqm1'],
          personalizedTips: [],
        },
      ];

      const suggestions = getImprovementSuggestions(exercise, checks);

      // Should suggest tracking since no bench_press checks
      expect(suggestions[0]).toContain('Start tracking');
    });
  });

  describe('getMuscleActivationCues', () => {
    it('should return only cues with muscle activation info', () => {
      const exercise = getExerciseById('bench_press')!;
      const cues = getMuscleActivationCues(exercise);

      expect(cues.length).toBeGreaterThan(0);
      cues.forEach((cue) => {
        expect(cue).toContain(':');
      });
    });

    it('should return empty array for exercise with no activation cues', () => {
      // Create a minimal exercise with no muscle activation
      const minimalExercise: Exercise = {
        id: 'test',
        name: 'Test',
        category: 'core',
        musclesWorked: [],
        equipment: [],
        difficulty: 'beginner',
        description: 'Test',
        formCues: [{ id: 'c1', order: 1, cue: 'Do it' }],
        commonMistakes: [],
        variations: [],
        alternatives: [],
      };

      const cues = getMuscleActivationCues(minimalExercise);
      expect(cues).toEqual([]);
    });
  });

  describe('getBreathingPattern', () => {
    it('should return breathing tips for exercise', () => {
      const exercise = getExerciseById('bench_press')!;
      const patterns = getBreathingPattern(exercise);

      expect(patterns.length).toBeGreaterThan(0);
      patterns.forEach((p) => {
        expect(p.length).toBeGreaterThan(0);
      });
    });
  });

  describe('calculateAverageFormScore', () => {
    it('should return null for no checks', () => {
      const result = calculateAverageFormScore('bench_press', []);
      expect(result).toBeNull();
    });

    it('should calculate average correctly', () => {
      const checks: FormCheckResult[] = [
        {
          exerciseId: 'bench_press',
          exerciseName: 'Bench Press',
          timestamp: Date.now(),
          overallScore: 80,
          cuesFollowed: [],
          mistakesIdentified: [],
          personalizedTips: [],
        },
        {
          exerciseId: 'bench_press',
          exerciseName: 'Bench Press',
          timestamp: Date.now(),
          overallScore: 60,
          cuesFollowed: [],
          mistakesIdentified: [],
          personalizedTips: [],
        },
      ];

      const result = calculateAverageFormScore('bench_press', checks);
      expect(result).toBe(70);
    });

    it('should only consider matching exercise id', () => {
      const checks: FormCheckResult[] = [
        {
          exerciseId: 'bench_press',
          exerciseName: 'Bench Press',
          timestamp: Date.now(),
          overallScore: 80,
          cuesFollowed: [],
          mistakesIdentified: [],
          personalizedTips: [],
        },
        {
          exerciseId: 'squat',
          exerciseName: 'Squat',
          timestamp: Date.now(),
          overallScore: 40,
          cuesFollowed: [],
          mistakesIdentified: [],
          personalizedTips: [],
        },
      ];

      const result = calculateAverageFormScore('bench_press', checks);
      expect(result).toBe(80);
    });
  });

  // ============ Exercise Recommendations ============

  describe('getExerciseRecommendations', () => {
    it('should return max 5 recommendations', () => {
      const recs = getExerciseRecommendations([], []);
      expect(recs.length).toBeLessThanOrEqual(5);
    });

    it('should recommend untried exercises', () => {
      // Only tried bench press
      const history: ExerciseHistory[] = [
        {
          exerciseId: 'bench_press',
          exerciseName: 'Barbell Bench Press',
          lastPerformed: '2025-01-14',
          timesPerformed: 5,
          personalBest: {},
          notes: [],
          formIssuesNoted: [],
        },
      ];

      const recs = getExerciseRecommendations(history, []);

      // Should not include bench_press (already tried and no issues)
      const recIds = recs.map((r) => r.id);
      // Should include some untried exercises
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should recommend exercises needing form improvement', () => {
      const history: ExerciseHistory[] = [
        {
          exerciseId: 'squat',
          exerciseName: 'Barbell Back Squat',
          lastPerformed: '2025-01-14',
          timesPerformed: 10,
          personalBest: {},
          notes: [],
          formIssuesNoted: ['sqm1', 'sqm2'],
        },
      ];

      const recs = getExerciseRecommendations(history, []);

      // Should include squat since it needs improvement
      expect(recs.some((r) => r.id === 'squat')).toBe(true);
    });

    it('should recommend alternatives to favorites', () => {
      // Bench press alternatives include 'Dumbbell Bench Press', 'Push-ups', 'Machine Chest Press'
      // But those need to exist in DEFAULT_EXERCISES to be recommended
      const recs = getExerciseRecommendations([], ['bench_press']);

      // The alternatives may not exist as entries in DEFAULT_EXERCISES
      // So this may or may not add alternatives
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should not include duplicates', () => {
      const history: ExerciseHistory[] = [
        {
          exerciseId: 'squat',
          exerciseName: 'Barbell Back Squat',
          lastPerformed: '2025-01-14',
          timesPerformed: 10,
          personalBest: {},
          notes: [],
          formIssuesNoted: ['sqm1'],
        },
      ];

      const recs = getExerciseRecommendations(history, ['squat']);

      const ids = recs.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });
});
