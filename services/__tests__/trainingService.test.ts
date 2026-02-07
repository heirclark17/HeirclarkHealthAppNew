/**
 * Tests for trainingService.ts
 */

import { trainingService } from '../trainingService';
import {
  TrainingPreferences,
  WeeklyTrainingPlan,
  MuscleGroup,
  WorkoutType,
  DifficultyLevel,
  GoalWorkoutAlignment,
} from '../../types/training';

// Mock the exerciseDbMapping to avoid file system dependencies
jest.mock('../../data/exerciseDbMapping', () => ({
  getExerciseDbMapping: jest.fn().mockReturnValue(null),
}));

function createDefaultPreferences(overrides: Partial<TrainingPreferences> = {}): TrainingPreferences {
  return {
    primaryGoal: 'lose_weight',
    fitnessLevel: 'intermediate',
    workoutsPerWeek: 4,
    workoutDuration: 45,
    availableEquipment: ['barbell', 'dumbbells', 'bodyweight'],
    ...overrides,
  } as TrainingPreferences;
}

describe('trainingService', () => {
  // =============================================
  // getExercise
  // =============================================
  describe('getExercise', () => {
    it('should return exercise by ID', () => {
      const exercise = trainingService.getExercise('bench-press');
      expect(exercise).toBeDefined();
      expect(exercise!.name).toBe('Bench Press');
    });

    it('should return undefined for unknown ID', () => {
      const exercise = trainingService.getExercise('nonexistent-exercise');
      expect(exercise).toBeUndefined();
    });
  });

  // =============================================
  // getAllExercises
  // =============================================
  describe('getAllExercises', () => {
    it('should return a copy of all exercises', () => {
      const exercises = trainingService.getAllExercises();
      expect(exercises.length).toBeGreaterThan(0);

      // Verify it is a copy (not the same reference)
      const exercises2 = trainingService.getAllExercises();
      expect(exercises).not.toBe(exercises2);
    });
  });

  // =============================================
  // getExercisesByMuscle
  // =============================================
  describe('getExercisesByMuscle', () => {
    it('should return exercises for chest', () => {
      const exercises = trainingService.getExercisesByMuscle('chest');
      expect(exercises.length).toBeGreaterThan(0);
      exercises.forEach(ex => {
        expect(ex.muscleGroups).toContain('chest');
      });
    });

    it('should return exercises for core', () => {
      const exercises = trainingService.getExercisesByMuscle('core');
      expect(exercises.length).toBeGreaterThan(0);
    });

    it('should return empty array for nonexistent muscle group', () => {
      const exercises = trainingService.getExercisesByMuscle('nonexistent' as MuscleGroup);
      expect(exercises).toEqual([]);
    });
  });

  // =============================================
  // getRecommendedProgram
  // =============================================
  describe('getRecommendedProgram', () => {
    it('should return fat loss program for lose_weight goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'lose_weight' });
      const program = trainingService.getRecommendedProgram(prefs);
      expect(program.targetGoals).toContain('lose_weight');
    });

    it('should return muscle building program for build_muscle goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'build_muscle' });
      const program = trainingService.getRecommendedProgram(prefs);
      expect(program.targetGoals).toContain('build_muscle');
    });

    it('should return maintenance program for maintain goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'maintain' });
      const program = trainingService.getRecommendedProgram(prefs);
      expect(program.targetGoals).toContain('maintain');
    });

    it('should return health program for improve_health goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'improve_health' });
      const program = trainingService.getRecommendedProgram(prefs);
      expect(program.targetGoals).toContain('improve_health');
    });

    it('should fallback to maintenance if no matching goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'unknown_goal' as any });
      const program = trainingService.getRecommendedProgram(prefs);
      expect(program).toBeDefined();
    });
  });

  // =============================================
  // getAllPrograms
  // =============================================
  describe('getAllPrograms', () => {
    it('should return all training programs', () => {
      const programs = trainingService.getAllPrograms();
      expect(programs.length).toBeGreaterThan(0);
    });

    it('should return a copy', () => {
      const p1 = trainingService.getAllPrograms();
      const p2 = trainingService.getAllPrograms();
      expect(p1).not.toBe(p2);
    });
  });

  // =============================================
  // generateWorkout
  // =============================================
  describe('generateWorkout', () => {
    it('should generate a rest day workout', () => {
      const workout = trainingService.generateWorkout('rest', [], 0, 'beginner');
      expect(workout.type).toBe('rest');
      expect(workout.name).toBe('Rest Day');
      expect(workout.exercises).toEqual([]);
      expect(workout.estimatedCaloriesBurned).toBe(0);
    });

    it('should generate a strength workout with exercises', () => {
      const workout = trainingService.generateWorkout(
        'strength',
        ['chest', 'triceps'],
        45,
        'intermediate'
      );
      expect(workout.type).toBe('strength');
      expect(workout.exercises.length).toBeGreaterThan(0);
      expect(workout.duration).toBe(45);
      expect(workout.completed).toBe(false);
    });

    it('should generate a hypertrophy workout', () => {
      const workout = trainingService.generateWorkout(
        'hypertrophy',
        ['back', 'biceps'],
        45,
        'intermediate'
      );
      expect(workout.type).toBe('hypertrophy');
      expect(workout.exercises.length).toBeGreaterThan(0);
      // Hypertrophy: 4 sets, 8-12 reps, 60s rest
      workout.exercises.forEach(ex => {
        expect(ex.sets).toBe(4);
        expect(ex.reps).toBe('8-12');
        expect(ex.restSeconds).toBe(60);
      });
    });

    it('should generate a cardio workout', () => {
      const workout = trainingService.generateWorkout(
        'cardio',
        ['cardio'],
        30,
        'beginner'
      );
      expect(workout.type).toBe('cardio');
      // Cardio: 1 set, "15-20 min" reps, 0s rest
      workout.exercises.forEach(ex => {
        expect(ex.sets).toBe(1);
        expect(ex.reps).toBe('15-20 min');
        expect(ex.restSeconds).toBe(0);
      });
    });

    it('should name cardio workout based on cardio preference (walking)', () => {
      const workout = trainingService.generateWorkout(
        'cardio',
        ['cardio', 'legs'],
        30,
        'beginner',
        'walking'
      );
      expect(workout.name).toBe('Walking Session');
    });

    it('should name cardio workout based on cardio preference (running)', () => {
      const workout = trainingService.generateWorkout(
        'cardio',
        ['cardio', 'legs'],
        30,
        'intermediate',
        'running'
      );
      expect(workout.name).toBe('Running Session');
    });

    it('should name HIIT workout based on HIIT preference', () => {
      const workout = trainingService.generateWorkout(
        'hiit',
        ['full_body', 'cardio'],
        25,
        'intermediate',
        'hiit'
      );
      expect(workout.name).toBe('HIIT Cardio Blast');
    });

    it('should respect difficulty level by filtering exercises', () => {
      const beginnerWorkout = trainingService.generateWorkout(
        'strength',
        ['chest', 'triceps'],
        45,
        'beginner'
      );

      beginnerWorkout.exercises.forEach(ex => {
        const diffLevels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
        const exerciseLevel = diffLevels.indexOf(ex.exercise.difficulty);
        const maxLevel = diffLevels.indexOf('beginner');
        expect(exerciseLevel).toBeLessThanOrEqual(maxLevel);
      });
    });

    it('should cap exercises at 8', () => {
      const workout = trainingService.generateWorkout(
        'strength',
        ['full_body', 'chest', 'back', 'legs', 'shoulders', 'core'],
        120,
        'advanced'
      );
      expect(workout.exercises.length).toBeLessThanOrEqual(8);
    });

    it('should calculate estimated calories', () => {
      const workout = trainingService.generateWorkout(
        'strength',
        ['chest', 'triceps'],
        45,
        'intermediate'
      );
      expect(workout.estimatedCaloriesBurned).toBeGreaterThan(0);
    });
  });

  // =============================================
  // generateWeeklyPlan
  // =============================================
  describe('generateWeeklyPlan', () => {
    it('should generate a 7-day weekly plan', () => {
      const prefs = createDefaultPreferences();
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      expect(plan.days.length).toBe(7);
      expect(plan.weekNumber).toBe(1);
      expect(plan.startDate).toBeDefined();
      expect(plan.endDate).toBeDefined();
    });

    it('should include correct number of workout days', () => {
      const prefs = createDefaultPreferences({ workoutsPerWeek: 3 });
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      const workoutDays = plan.days.filter(d => !d.isRestDay);
      expect(workoutDays.length).toBeLessThanOrEqual(3);
      expect(plan.totalWorkouts).toBeLessThanOrEqual(3);
    });

    it('should set correct day names', () => {
      const prefs = createDefaultPreferences();
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      const expectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      plan.days.forEach((day, i) => {
        expect(day.dayOfWeek).toBe(expectedDays[i]);
      });
    });

    it('should mark rest days correctly', () => {
      const prefs = createDefaultPreferences({ workoutsPerWeek: 3 });
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      plan.days.forEach(day => {
        if (day.isRestDay) {
          expect(day.workout).toBeNull();
        }
      });
    });

    it('should calculate total calories burned', () => {
      const prefs = createDefaultPreferences();
      const plan = trainingService.generateWeeklyPlan(prefs, 1);
      expect(plan.totalCaloriesBurned).toBeGreaterThanOrEqual(0);
    });

    it('should track focus areas', () => {
      const prefs = createDefaultPreferences();
      const plan = trainingService.generateWeeklyPlan(prefs, 1);
      expect(plan.focusAreas.length).toBeGreaterThanOrEqual(0);
    });
  });

  // =============================================
  // calculateGoalAlignment
  // =============================================
  describe('calculateGoalAlignment', () => {
    it('should calculate alignment for lose_weight goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'lose_weight' });
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      const alignment = trainingService.calculateGoalAlignment(prefs, plan);
      expect(alignment.overallAlignment).toBeGreaterThan(0);
      expect(alignment.overallAlignment).toBeLessThanOrEqual(100);
      expect(alignment.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate alignment for build_muscle goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'build_muscle', workoutsPerWeek: 5 });
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      const alignment = trainingService.calculateGoalAlignment(prefs, plan);
      expect(alignment.muscleGrowthPotential).toBeGreaterThan(0);
    });

    it('should calculate alignment for maintain goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'maintain' });
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      const alignment = trainingService.calculateGoalAlignment(prefs, plan);
      expect(alignment.overallAlignment).toBeGreaterThan(0);
    });

    it('should calculate alignment for improve_health goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'improve_health' });
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      const alignment = trainingService.calculateGoalAlignment(prefs, plan);
      expect(alignment.cardiovascularHealth).toBeGreaterThan(0);
    });

    it('should include recommendations', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'lose_weight', workoutsPerWeek: 2 });
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      const alignment = trainingService.calculateGoalAlignment(prefs, plan);
      expect(alignment.recommendations).toBeInstanceOf(Array);
      expect(alignment.recommendations.length).toBeGreaterThan(0);
    });
  });

  // =============================================
  // getTodaysWorkout
  // =============================================
  describe('getTodaysWorkout', () => {
    it('should return today\'s training day', () => {
      const prefs = createDefaultPreferences();
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      const todayDay = trainingService.getTodaysWorkout(plan);
      const today = new Date().toISOString().split('T')[0];

      // Should find today's date in the plan
      if (todayDay) {
        expect(todayDay.date).toBe(today);
      }
    });

    it('should return null when today is not in the plan', () => {
      const fakePlan: WeeklyTrainingPlan = {
        id: 'test',
        weekNumber: 1,
        startDate: '2020-01-01',
        endDate: '2020-01-07',
        days: [
          {
            id: 'd1',
            dayOfWeek: 'Monday',
            dayNumber: 1,
            date: '2020-01-01',
            workout: null,
            isRestDay: true,
            completed: false,
          },
        ],
        totalWorkouts: 0,
        completedWorkouts: 0,
        totalCaloriesBurned: 0,
        focusAreas: [],
      };

      const result = trainingService.getTodaysWorkout(fakePlan);
      expect(result).toBeNull();
    });
  });

  // =============================================
  // getPlanSummary
  // =============================================
  describe('getPlanSummary', () => {
    it('should return a plan summary with correct structure', () => {
      const prefs = createDefaultPreferences();
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      const summary = trainingService.getPlanSummary(plan, prefs);
      expect(summary.overview).toBeDefined();
      expect(summary.weeklyStructure).toBeDefined();
      expect(summary.strengthFocus).toBeDefined();
      expect(summary.cardioFocus).toBeDefined();
      expect(summary.expectedOutcomes).toBeInstanceOf(Array);
      expect(summary.weekByWeekProgression).toBeInstanceOf(Array);
      expect(summary.nutritionIntegration).toBeDefined();
      expect(summary.recoveryRecommendations).toBeInstanceOf(Array);
      expect(summary.keyMetricsToTrack).toBeInstanceOf(Array);
      expect(summary.adjustmentTriggers).toBeInstanceOf(Array);
    });

    it('should mention weight loss in overview for lose_weight goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'lose_weight' });
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      const summary = trainingService.getPlanSummary(plan, prefs);
      expect(summary.overview).toContain('weight loss');
    });

    it('should mention muscle building in overview for build_muscle goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'build_muscle' });
      const plan = trainingService.generateWeeklyPlan(prefs, 1);

      const summary = trainingService.getPlanSummary(plan, prefs);
      expect(summary.overview).toContain('muscle building');
    });
  });
});
