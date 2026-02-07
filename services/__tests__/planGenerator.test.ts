/**
 * Tests for planGenerator.ts
 */

import { planGenerator, generatePlanSummary } from '../planGenerator';
import { trainingService } from '../trainingService';
import { PROGRAM_TEMPLATES, getRecommendedPrograms, getProgramById } from '../../data/programTemplates';
import { TrainingPreferences, ProgramTemplate } from '../../types/training';

// Mock trainingService
jest.mock('../trainingService', () => ({
  trainingService: {
    generateWeeklyPlan: jest.fn(),
    getRecommendedProgram: jest.fn(),
  },
}));

// Mock programTemplates
jest.mock('../../data/programTemplates', () => {
  const mockTemplate: any = {
    id: 'test-program',
    name: 'Test Program',
    description: 'A test program',
    philosophy: 'Test philosophy',
    progressionScheme: 'Linear progression',
    duration: 8,
    daysPerWeek: 4,
    difficulty: 'intermediate',
    targetGoals: ['lose_weight'],
    equipmentNeeded: ['barbell', 'dumbbells'],
    weeklyStructure: [
      { day: 1, workoutType: 'strength', muscleGroups: ['chest', 'triceps'] },
      { day: 2, workoutType: 'strength', muscleGroups: ['back', 'biceps'] },
      { day: 3, workoutType: 'rest', muscleGroups: [] },
      { day: 4, workoutType: 'hiit', muscleGroups: ['full_body'] },
      { day: 5, workoutType: 'strength', muscleGroups: ['legs', 'glutes'] },
      { day: 6, workoutType: 'cardio', muscleGroups: ['cardio'] },
      { day: 7, workoutType: 'rest', muscleGroups: [] },
    ],
  };

  const mockTemplate2: any = {
    ...mockTemplate,
    id: 'muscle-program',
    name: 'Muscle Builder',
    targetGoals: ['build_muscle'],
    daysPerWeek: 5,
  };

  const mockTemplate3: any = {
    ...mockTemplate,
    id: 'upper-lower-4day',
    name: 'Upper Lower 4 Day',
    targetGoals: ['maintain'],
    daysPerWeek: 4,
  };

  return {
    PROGRAM_TEMPLATES: [mockTemplate, mockTemplate2, mockTemplate3],
    getRecommendedPrograms: jest.fn().mockReturnValue([mockTemplate]),
    getProgramById: jest.fn().mockImplementation((id: string) => {
      const all = [mockTemplate, mockTemplate2, mockTemplate3];
      return all.find((p: any) => p.id === id);
    }),
  };
});

// Mock exerciseDbMapping
jest.mock('../../data/exerciseDbMapping', () => ({
  getExerciseDbMapping: jest.fn().mockReturnValue(null),
}));

const mockedTrainingService = trainingService as jest.Mocked<typeof trainingService>;
const mockedGetRecommended = getRecommendedPrograms as jest.Mock;
const mockedGetProgramById = getProgramById as jest.Mock;

function createDefaultPreferences(overrides: Partial<TrainingPreferences> = {}): TrainingPreferences {
  return {
    primaryGoal: 'lose_weight',
    fitnessLevel: 'intermediate',
    workoutsPerWeek: 4,
    workoutDuration: 45,
    availableEquipment: ['barbell', 'dumbbells'],
    cardioPreference: 'walking',
    ...overrides,
  } as TrainingPreferences;
}

function createMockWeeklyPlan() {
  return {
    id: 'week-1',
    weekNumber: 1,
    startDate: '2025-01-13',
    endDate: '2025-01-19',
    days: [
      {
        id: 'd1',
        dayOfWeek: 'Monday',
        dayNumber: 1,
        date: '2025-01-13',
        workout: {
          id: 'w1',
          name: 'Chest & Triceps',
          type: 'strength',
          duration: 45,
          estimatedCaloriesBurned: 300,
          muscleGroupsFocused: ['chest', 'triceps'],
          difficulty: 'intermediate',
          exercises: [],
          completed: false,
        },
        isRestDay: false,
        completed: false,
      },
      {
        id: 'd2',
        dayOfWeek: 'Tuesday',
        dayNumber: 2,
        date: '2025-01-14',
        workout: null,
        isRestDay: true,
        completed: false,
      },
    ],
    totalWorkouts: 1,
    completedWorkouts: 0,
    totalCaloriesBurned: 300,
    focusAreas: ['chest', 'triceps'],
  };
}

describe('planGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTrainingService.generateWeeklyPlan.mockReturnValue(createMockWeeklyPlan() as any);
  });

  // =============================================
  // generateCompletePlan
  // =============================================
  describe('generateCompletePlan', () => {
    it('should auto-select a program when no programId provided', () => {
      const prefs = createDefaultPreferences();
      const result = planGenerator.generateCompletePlan(prefs);

      expect(result).toBeDefined();
      expect(result.weeklyPlan).toBeDefined();
      expect(result.program).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(mockedGetRecommended).toHaveBeenCalled();
    });

    it('should use specific program when programId provided', () => {
      const prefs = createDefaultPreferences();
      const result = planGenerator.generateCompletePlan(prefs, undefined, 'test-program');

      expect(result.program.id).toBe('test-program');
      expect(mockedGetProgramById).toHaveBeenCalledWith('test-program');
    });

    it('should fallback to auto-select when programId not found', () => {
      mockedGetProgramById.mockReturnValueOnce(undefined);
      const prefs = createDefaultPreferences();
      const result = planGenerator.generateCompletePlan(prefs, undefined, 'nonexistent-id');

      expect(result.program).toBeDefined();
      expect(mockedGetRecommended).toHaveBeenCalled();
    });

    it('should pass adjusted preferences to trainingService', () => {
      const prefs = createDefaultPreferences({ workoutsPerWeek: 3 });
      planGenerator.generateCompletePlan(prefs);

      expect(mockedTrainingService.generateWeeklyPlan).toHaveBeenCalledWith(
        expect.objectContaining({ workoutsPerWeek: 4 }), // program's daysPerWeek overrides
        1
      );
    });

    it('should generate plan summary', () => {
      const prefs = createDefaultPreferences();
      const result = planGenerator.generateCompletePlan(prefs);

      expect(result.summary.overview).toBeDefined();
      expect(result.summary.weeklyStructure).toBeDefined();
      expect(result.summary.expectedOutcomes).toBeInstanceOf(Array);
    });
  });

  // =============================================
  // generateMultiWeekPlan
  // =============================================
  describe('generateMultiWeekPlan', () => {
    it('should generate the specified number of weeks', () => {
      const prefs = createDefaultPreferences();
      const result = planGenerator.generateMultiWeekPlan(prefs, 4);

      expect(result.weeklyPlans.length).toBe(4);
      expect(mockedTrainingService.generateWeeklyPlan).toHaveBeenCalledTimes(4);
    });

    it('should default to 8 weeks', () => {
      const prefs = createDefaultPreferences();
      const result = planGenerator.generateMultiWeekPlan(prefs);

      expect(result.weeklyPlans.length).toBe(8);
    });

    it('should have correct metadata', () => {
      const prefs = createDefaultPreferences();
      const result = planGenerator.generateMultiWeekPlan(prefs, 4);

      expect(result.id).toBeDefined();
      expect(result.name).toContain('Test Program');
      expect(result.name).toContain('4 Week');
      expect(result.programTemplate).toBeDefined();
      expect(result.isActive).toBe(true);
      expect(result.currentWeek).toBe(1);
      expect(result.createdAt).toBeDefined();
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
    });

    it('should store user profile information', () => {
      const prefs = createDefaultPreferences({
        cardioPreference: 'running',
        fitnessLevel: 'beginner',
      });
      const result = planGenerator.generateMultiWeekPlan(prefs, 2);

      expect(result.userProfile.fitnessLevel).toBe('beginner');
      expect(result.userProfile.preferences.cardioPreference).toBe('running');
    });

    it('should include summary', () => {
      const prefs = createDefaultPreferences();
      const result = planGenerator.generateMultiWeekPlan(prefs, 4);

      expect(result.summary).toBeDefined();
      expect(result.summary.overview).toBeDefined();
    });
  });

  // =============================================
  // getAllPrograms
  // =============================================
  describe('getAllPrograms', () => {
    it('should return all program templates', () => {
      const programs = planGenerator.getAllPrograms();
      expect(programs).toBe(PROGRAM_TEMPLATES);
    });
  });

  // =============================================
  // getRecommendedPrograms
  // =============================================
  describe('getRecommendedPrograms', () => {
    it('should call getRecommendedPrograms with mapped goal', () => {
      planGenerator.getRecommendedPrograms('lose_weight', 4, 'intermediate');
      expect(mockedGetRecommended).toHaveBeenCalledWith('intermediate', 'lose_weight', 4, 'full_gym');
    });

    it('should map fat_loss to lose_weight', () => {
      planGenerator.getRecommendedPrograms('fat_loss', 4, 'intermediate');
      expect(mockedGetRecommended).toHaveBeenCalledWith('intermediate', 'lose_weight', 4, 'full_gym');
    });

    it('should map strength to build_muscle', () => {
      planGenerator.getRecommendedPrograms('strength', 4, 'intermediate');
      expect(mockedGetRecommended).toHaveBeenCalledWith('intermediate', 'build_muscle', 4, 'full_gym');
    });

    it('should map general_fitness to improve_health', () => {
      planGenerator.getRecommendedPrograms('general_fitness', 3, 'beginner');
      expect(mockedGetRecommended).toHaveBeenCalledWith('beginner', 'improve_health', 3, 'full_gym');
    });

    it('should map unknown goals to maintain', () => {
      planGenerator.getRecommendedPrograms('some_unknown', 3, 'beginner');
      expect(mockedGetRecommended).toHaveBeenCalledWith('beginner', 'maintain', 3, 'full_gym');
    });
  });

  // =============================================
  // getProgramById
  // =============================================
  describe('getProgramById', () => {
    it('should delegate to data module getProgramById', () => {
      planGenerator.getProgramById('test-program');
      expect(mockedGetProgramById).toHaveBeenCalledWith('test-program');
    });
  });

  // =============================================
  // generateSummaryOnly
  // =============================================
  describe('generateSummaryOnly', () => {
    it('should return a plan summary without generating workouts', () => {
      const prefs = createDefaultPreferences();
      const summary = planGenerator.generateSummaryOnly(prefs);

      expect(summary.overview).toBeDefined();
      expect(summary.weeklyStructure).toBeDefined();
      expect(summary.strengthFocus).toBeDefined();
      expect(summary.cardioFocus).toBeDefined();
      expect(summary.expectedOutcomes).toBeInstanceOf(Array);
      // Should NOT call generateWeeklyPlan for summary only
      // (it's called in generateCompletePlan, not generateSummaryOnly)
    });
  });

  // =============================================
  // generatePlanSummary (exported function)
  // =============================================
  describe('generatePlanSummary', () => {
    const mockProgram = PROGRAM_TEMPLATES[0] as ProgramTemplate;

    it('should generate summary for lose_weight goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'lose_weight', cardioPreference: 'walking' });
      const summary = generatePlanSummary(prefs, mockProgram);

      expect(summary.overview).toContain('fat loss');
      expect(summary.nutritionIntegration).toContain('calorie deficit');
    });

    it('should generate summary for build_muscle goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'build_muscle' });
      const summary = generatePlanSummary(prefs, mockProgram);

      expect(summary.overview).toContain('muscle building');
      expect(summary.nutritionIntegration).toContain('calorie surplus');
    });

    it('should generate summary for improve_health goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'improve_health' });
      const summary = generatePlanSummary(prefs, mockProgram);

      expect(summary.overview).toContain('health improvement');
    });

    it('should generate summary for maintain goal', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'maintain' });
      const summary = generatePlanSummary(prefs, mockProgram);

      expect(summary.overview).toContain('maintenance');
    });

    it('should include cardio focus with walking preference', () => {
      const prefs = createDefaultPreferences({ cardioPreference: 'walking', primaryGoal: 'lose_weight' });
      const summary = generatePlanSummary(prefs, mockProgram);

      expect(summary.cardioFocus.toLowerCase()).toContain('walking');
    });

    it('should include cardio focus with running preference', () => {
      const prefs = createDefaultPreferences({ cardioPreference: 'running', primaryGoal: 'lose_weight' });
      const summary = generatePlanSummary(prefs, mockProgram);

      expect(summary.cardioFocus.toLowerCase()).toContain('running');
    });

    it('should include cardio focus with hiit preference', () => {
      const prefs = createDefaultPreferences({ cardioPreference: 'hiit', primaryGoal: 'lose_weight' });
      const summary = generatePlanSummary(prefs, mockProgram);

      expect(summary.cardioFocus.toLowerCase()).toContain('hiit');
    });

    it('should include expected outcomes', () => {
      const prefs = createDefaultPreferences({ primaryGoal: 'lose_weight' });
      const summary = generatePlanSummary(prefs, mockProgram);

      expect(summary.expectedOutcomes.length).toBeGreaterThan(0);
      summary.expectedOutcomes.forEach(outcome => {
        expect(outcome.metric).toBeDefined();
        expect(outcome.targetValue).toBeDefined();
        expect(outcome.timeframe).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(outcome.confidence);
      });
    });

    it('should include recovery recommendations', () => {
      const prefs = createDefaultPreferences();
      const summary = generatePlanSummary(prefs, mockProgram);

      expect(summary.recoveryRecommendations.length).toBeGreaterThan(0);
    });

    it('should include week-by-week progression', () => {
      const prefs = createDefaultPreferences();
      const summary = generatePlanSummary(prefs, mockProgram);

      expect(summary.weekByWeekProgression.length).toBeGreaterThan(0);
    });
  });
});
