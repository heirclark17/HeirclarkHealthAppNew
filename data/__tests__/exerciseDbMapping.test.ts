import {
  EXERCISE_DB_MAPPING,
  getExerciseDbMapping,
  getExerciseGifUrl,
  getExerciseInstructions,
  MAPPED_EXERCISE_NAMES,
} from '../exerciseDbMapping';

describe('Exercise DB Mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EXERCISE_DB_MAPPING', () => {
    it('should be defined as an object', () => {
      expect(EXERCISE_DB_MAPPING).toBeDefined();
      expect(typeof EXERCISE_DB_MAPPING).toBe('object');
    });

    it('should have at least 50 exercise mappings', () => {
      const keys = Object.keys(EXERCISE_DB_MAPPING);
      expect(keys.length).toBeGreaterThanOrEqual(50);
    });

    it('should have valid mapping structure for each exercise', () => {
      Object.values(EXERCISE_DB_MAPPING).forEach((mapping) => {
        expect(mapping).toHaveProperty('id');
        expect(mapping).toHaveProperty('gifUrl');
        expect(mapping).toHaveProperty('bodyPart');
        expect(mapping).toHaveProperty('target');
        expect(mapping).toHaveProperty('instructions');
        expect(typeof mapping.id).toBe('string');
        expect(typeof mapping.gifUrl).toBe('string');
        expect(typeof mapping.bodyPart).toBe('string');
        expect(typeof mapping.target).toBe('string');
        expect(Array.isArray(mapping.instructions)).toBe(true);
      });
    });

    it('should have valid gifUrl format', () => {
      Object.values(EXERCISE_DB_MAPPING).forEach((mapping) => {
        expect(mapping.gifUrl).toMatch(/^https:\/\//);
        expect(mapping.gifUrl).toContain('exercisedb.io');
      });
    });

    it('should have instructions with at least one entry', () => {
      Object.values(EXERCISE_DB_MAPPING).forEach((mapping) => {
        expect(mapping.instructions.length).toBeGreaterThan(0);
      });
    });

    it('should have common exercises mapped', () => {
      expect(EXERCISE_DB_MAPPING['bench press']).toBeDefined();
      expect(EXERCISE_DB_MAPPING['squats']).toBeDefined();
      expect(EXERCISE_DB_MAPPING['deadlift']).toBeDefined();
      expect(EXERCISE_DB_MAPPING['pull ups']).toBeDefined();
    });

    it('should have variations of common exercises', () => {
      expect(EXERCISE_DB_MAPPING['barbell bench press']).toBeDefined();
      expect(EXERCISE_DB_MAPPING['dumbbell bench press']).toBeDefined();
      expect(EXERCISE_DB_MAPPING['push up']).toBeDefined();
    });
  });

  describe('getExerciseDbMapping', () => {
    it('should return mapping for valid exercise name', () => {
      const mapping = getExerciseDbMapping('bench press');
      expect(mapping).toBeDefined();
      expect(mapping?.id).toBe('0025');
    });

    it('should return null for invalid exercise name', () => {
      const mapping = getExerciseDbMapping('nonexistent exercise');
      expect(mapping).toBeNull();
    });

    it('should handle case-insensitive matching', () => {
      const lower = getExerciseDbMapping('bench press');
      const upper = getExerciseDbMapping('BENCH PRESS');
      const mixed = getExerciseDbMapping('Bench Press');
      expect(lower).toEqual(upper);
      expect(upper).toEqual(mixed);
    });

    it('should handle variations with hyphens and underscores', () => {
      const withSpace = getExerciseDbMapping('bench press');
      const withHyphen = getExerciseDbMapping('bench-press');
      const withUnderscore = getExerciseDbMapping('bench_press');
      expect(withSpace).toBeDefined();
      // Normalization should handle these
      expect(withHyphen?.id).toBe(withSpace?.id);
      expect(withUnderscore?.id).toBe(withSpace?.id);
    });

    it('should handle partial matches', () => {
      const mapping = getExerciseDbMapping('squat');
      expect(mapping).toBeDefined();
      expect(mapping?.bodyPart).toBe('upper legs');
    });
  });

  describe('getExerciseGifUrl', () => {
    it('should return gif URL for valid exercise', () => {
      const url = getExerciseGifUrl('bench press');
      expect(url).toBeDefined();
      expect(url).toContain('exercisedb.io');
    });

    it('should return null for invalid exercise', () => {
      const url = getExerciseGifUrl('nonexistent exercise');
      expect(url).toBeNull();
    });

    it('should return correct URL for known exercise', () => {
      const url = getExerciseGifUrl('bench press');
      expect(url).toBe('https://v2.exercisedb.io/image/0025.gif');
    });

    it('should work with variations', () => {
      const url1 = getExerciseGifUrl('push ups');
      const url2 = getExerciseGifUrl('push up');
      expect(url1).toBeDefined();
      expect(url2).toBeDefined();
    });
  });

  describe('getExerciseInstructions', () => {
    it('should return instructions for valid exercise', () => {
      const instructions = getExerciseInstructions('bench press');
      expect(instructions).toBeDefined();
      expect(Array.isArray(instructions)).toBe(true);
      expect(instructions!.length).toBeGreaterThan(0);
    });

    it('should return null for invalid exercise', () => {
      const instructions = getExerciseInstructions('nonexistent exercise');
      expect(instructions).toBeNull();
    });

    it('should return detailed instructions', () => {
      const instructions = getExerciseInstructions('bench press');
      expect(instructions).toBeDefined();
      expect(instructions!.length).toBeGreaterThanOrEqual(4);
      instructions!.forEach((instruction) => {
        expect(typeof instruction).toBe('string');
        expect(instruction.length).toBeGreaterThan(0);
      });
    });

    it('should have instructions for common exercises', () => {
      const exercises = ['squats', 'deadlift', 'pull ups', 'shoulder press'];
      exercises.forEach((exercise) => {
        const instructions = getExerciseInstructions(exercise);
        expect(instructions).toBeDefined();
        expect(instructions!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MAPPED_EXERCISE_NAMES', () => {
    it('should be defined and be an array', () => {
      expect(MAPPED_EXERCISE_NAMES).toBeDefined();
      expect(Array.isArray(MAPPED_EXERCISE_NAMES)).toBe(true);
    });

    it('should contain all keys from EXERCISE_DB_MAPPING', () => {
      const mappingKeys = Object.keys(EXERCISE_DB_MAPPING);
      expect(MAPPED_EXERCISE_NAMES.length).toBe(mappingKeys.length);
      mappingKeys.forEach((key) => {
        expect(MAPPED_EXERCISE_NAMES).toContain(key);
      });
    });

    it('should have exercise names as strings', () => {
      MAPPED_EXERCISE_NAMES.forEach((name) => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Exercise Coverage by Body Part', () => {
    it('should have chest exercises', () => {
      const chestExercises = Object.values(EXERCISE_DB_MAPPING).filter(
        (ex) => ex.bodyPart === 'chest'
      );
      expect(chestExercises.length).toBeGreaterThan(0);
    });

    it('should have back exercises', () => {
      const backExercises = Object.values(EXERCISE_DB_MAPPING).filter((ex) => ex.bodyPart === 'back');
      expect(backExercises.length).toBeGreaterThan(0);
    });

    it('should have leg exercises', () => {
      const legExercises = Object.values(EXERCISE_DB_MAPPING).filter(
        (ex) => ex.bodyPart === 'upper legs'
      );
      expect(legExercises.length).toBeGreaterThan(0);
    });

    it('should have shoulder exercises', () => {
      const shoulderExercises = Object.values(EXERCISE_DB_MAPPING).filter(
        (ex) => ex.bodyPart === 'shoulders'
      );
      expect(shoulderExercises.length).toBeGreaterThan(0);
    });

    it('should have arm exercises', () => {
      const armExercises = Object.values(EXERCISE_DB_MAPPING).filter(
        (ex) => ex.bodyPart === 'upper arms'
      );
      expect(armExercises.length).toBeGreaterThan(0);
    });

    it('should have core exercises', () => {
      const coreExercises = Object.values(EXERCISE_DB_MAPPING).filter((ex) => ex.bodyPart === 'waist');
      expect(coreExercises.length).toBeGreaterThan(0);
    });
  });
});
