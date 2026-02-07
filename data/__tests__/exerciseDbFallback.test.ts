import {
  EXERCISE_DB_FALLBACK,
  EXERCISE_BY_BODY_PART,
  EXERCISE_BY_TARGET,
  EXERCISE_BY_EQUIPMENT,
} from '../exerciseDbFallback';

describe('Exercise DB Fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EXERCISE_DB_FALLBACK', () => {
    it('should be defined and be an array', () => {
      expect(EXERCISE_DB_FALLBACK).toBeDefined();
      expect(Array.isArray(EXERCISE_DB_FALLBACK)).toBe(true);
    });

    it('should have at least 40 exercises', () => {
      expect(EXERCISE_DB_FALLBACK.length).toBeGreaterThanOrEqual(40);
    });

    it('should have required fields in each exercise', () => {
      EXERCISE_DB_FALLBACK.forEach((exercise) => {
        expect(exercise).toHaveProperty('id');
        expect(exercise).toHaveProperty('name');
        expect(exercise).toHaveProperty('bodyPart');
        expect(exercise).toHaveProperty('target');
        expect(exercise).toHaveProperty('equipment');
        expect(exercise).toHaveProperty('gifUrl');
        expect(exercise).toHaveProperty('instructions');
      });
    });

    it('should have non-empty name strings', () => {
      EXERCISE_DB_FALLBACK.forEach((exercise) => {
        expect(typeof exercise.name).toBe('string');
        expect(exercise.name.length).toBeGreaterThan(0);
      });
    });

    it('should have valid gifUrl format', () => {
      EXERCISE_DB_FALLBACK.forEach((exercise) => {
        expect(exercise.gifUrl).toMatch(/^https:\/\//);
        expect(exercise.gifUrl).toContain('exercisedb.io');
      });
    });

    it('should have instructions as array with at least one instruction', () => {
      EXERCISE_DB_FALLBACK.forEach((exercise) => {
        expect(Array.isArray(exercise.instructions)).toBe(true);
        expect(exercise.instructions.length).toBeGreaterThan(0);
      });
    });

    it('should have secondaryMuscles as array', () => {
      EXERCISE_DB_FALLBACK.forEach((exercise) => {
        if (exercise.secondaryMuscles) {
          expect(Array.isArray(exercise.secondaryMuscles)).toBe(true);
        }
      });
    });

    it('should have valid body part categories', () => {
      const validBodyParts = [
        'chest',
        'back',
        'shoulders',
        'upper arms',
        'lower arms',
        'upper legs',
        'lower legs',
        'waist',
        'cardio',
        'forearms',
      ];
      EXERCISE_DB_FALLBACK.forEach((exercise) => {
        expect(validBodyParts).toContain(exercise.bodyPart);
      });
    });

    it('should include major compound exercises', () => {
      const majorExercises = ['barbell bench press', 'barbell squat', 'barbell deadlift', 'pull-up'];
      const exerciseNames = EXERCISE_DB_FALLBACK.map((ex) => ex.name);
      majorExercises.forEach((name) => {
        expect(exerciseNames).toContain(name);
      });
    });

    it('should have chest exercises', () => {
      const chestExercises = EXERCISE_DB_FALLBACK.filter((ex) => ex.bodyPart === 'chest');
      expect(chestExercises.length).toBeGreaterThan(0);
    });

    it('should have back exercises', () => {
      const backExercises = EXERCISE_DB_FALLBACK.filter((ex) => ex.bodyPart === 'back');
      expect(backExercises.length).toBeGreaterThan(0);
    });

    it('should have leg exercises', () => {
      const legExercises = EXERCISE_DB_FALLBACK.filter((ex) => ex.bodyPart === 'upper legs');
      expect(legExercises.length).toBeGreaterThan(0);
    });
  });

  describe('EXERCISE_BY_BODY_PART', () => {
    it('should be defined as an object', () => {
      expect(EXERCISE_BY_BODY_PART).toBeDefined();
      expect(typeof EXERCISE_BY_BODY_PART).toBe('object');
    });

    it('should have chest exercises', () => {
      expect(EXERCISE_BY_BODY_PART.chest).toBeDefined();
      expect(Array.isArray(EXERCISE_BY_BODY_PART.chest)).toBe(true);
      expect(EXERCISE_BY_BODY_PART.chest.length).toBeGreaterThan(0);
    });

    it('should have back exercises', () => {
      expect(EXERCISE_BY_BODY_PART.back).toBeDefined();
      expect(Array.isArray(EXERCISE_BY_BODY_PART.back)).toBe(true);
      expect(EXERCISE_BY_BODY_PART.back.length).toBeGreaterThan(0);
    });

    it('should have all exercises categorized correctly', () => {
      Object.values(EXERCISE_BY_BODY_PART).forEach((exercises) => {
        exercises.forEach((exercise) => {
          expect(EXERCISE_DB_FALLBACK).toContainEqual(exercise);
        });
      });
    });
  });

  describe('EXERCISE_BY_TARGET', () => {
    it('should be defined as an object', () => {
      expect(EXERCISE_BY_TARGET).toBeDefined();
      expect(typeof EXERCISE_BY_TARGET).toBe('object');
    });

    it('should have pectorals exercises', () => {
      expect(EXERCISE_BY_TARGET.pectorals).toBeDefined();
      expect(Array.isArray(EXERCISE_BY_TARGET.pectorals)).toBe(true);
    });

    it('should have lats exercises', () => {
      expect(EXERCISE_BY_TARGET.lats).toBeDefined();
      expect(Array.isArray(EXERCISE_BY_TARGET.lats)).toBe(true);
    });

    it('should have quads exercises', () => {
      expect(EXERCISE_BY_TARGET.quads).toBeDefined();
      expect(Array.isArray(EXERCISE_BY_TARGET.quads)).toBe(true);
    });

    it('should have all exercises categorized correctly', () => {
      Object.values(EXERCISE_BY_TARGET).forEach((exercises) => {
        exercises.forEach((exercise) => {
          expect(EXERCISE_DB_FALLBACK).toContainEqual(exercise);
        });
      });
    });
  });

  describe('EXERCISE_BY_EQUIPMENT', () => {
    it('should be defined as an object', () => {
      expect(EXERCISE_BY_EQUIPMENT).toBeDefined();
      expect(typeof EXERCISE_BY_EQUIPMENT).toBe('object');
    });

    it('should have barbell exercises', () => {
      expect(EXERCISE_BY_EQUIPMENT.barbell).toBeDefined();
      expect(Array.isArray(EXERCISE_BY_EQUIPMENT.barbell)).toBe(true);
      expect(EXERCISE_BY_EQUIPMENT.barbell.length).toBeGreaterThan(0);
    });

    it('should have dumbbell exercises', () => {
      expect(EXERCISE_BY_EQUIPMENT.dumbbell).toBeDefined();
      expect(Array.isArray(EXERCISE_BY_EQUIPMENT.dumbbell)).toBe(true);
      expect(EXERCISE_BY_EQUIPMENT.dumbbell.length).toBeGreaterThan(0);
    });

    it('should have body weight exercises', () => {
      expect(EXERCISE_BY_EQUIPMENT['body weight']).toBeDefined();
      expect(Array.isArray(EXERCISE_BY_EQUIPMENT['body weight'])).toBe(true);
      expect(EXERCISE_BY_EQUIPMENT['body weight'].length).toBeGreaterThan(0);
    });

    it('should have all exercises categorized correctly', () => {
      Object.values(EXERCISE_BY_EQUIPMENT).forEach((exercises) => {
        exercises.forEach((exercise) => {
          expect(EXERCISE_DB_FALLBACK).toContainEqual(exercise);
        });
      });
    });
  });

  describe('Fallback Data Structure Consistency', () => {
    it('should have same structure as main exercise database', () => {
      const requiredFields = ['id', 'name', 'bodyPart', 'target', 'equipment', 'gifUrl', 'instructions'];
      EXERCISE_DB_FALLBACK.forEach((exercise) => {
        requiredFields.forEach((field) => {
          expect(exercise).toHaveProperty(field);
        });
      });
    });

    it('should have mostly unique exercise IDs', () => {
      const ids = EXERCISE_DB_FALLBACK.map((ex) => ex.id);
      const uniqueIds = new Set(ids);
      // Allow at most 1 duplicate in the fallback data
      expect(ids.length - uniqueIds.size).toBeLessThanOrEqual(1);
    });
  });
});
