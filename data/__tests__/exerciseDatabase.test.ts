import {
  EXERCISE_DATABASE,
  getExerciseById,
  getExerciseAlternatives,
  getExercisesForEquipment,
  getExercisesByMuscleGroup,
  BENCH_PRESS_ALTERNATIVES,
  SQUAT_ALTERNATIVES,
} from '../exerciseDatabase';

describe('Exercise Database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EXERCISE_DATABASE', () => {
    it('should be defined and be an array', () => {
      expect(EXERCISE_DATABASE).toBeDefined();
      expect(Array.isArray(EXERCISE_DATABASE)).toBe(true);
    });

    it('should have at least 10 exercises', () => {
      expect(EXERCISE_DATABASE.length).toBeGreaterThanOrEqual(10);
    });

    it('should have no duplicate exercise IDs', () => {
      const ids = EXERCISE_DATABASE.map((ex) => ex.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have required fields in each exercise', () => {
      EXERCISE_DATABASE.forEach((exercise) => {
        expect(exercise).toHaveProperty('id');
        expect(exercise).toHaveProperty('name');
        expect(exercise).toHaveProperty('muscleGroups');
        expect(exercise).toHaveProperty('primaryMuscle');
        expect(exercise).toHaveProperty('category');
        expect(exercise).toHaveProperty('equipment');
        expect(exercise).toHaveProperty('difficulty');
        expect(exercise).toHaveProperty('caloriesPerMinute');
        expect(exercise).toHaveProperty('instructions');
      });
    });

    it('should have non-empty name strings', () => {
      EXERCISE_DATABASE.forEach((exercise) => {
        expect(typeof exercise.name).toBe('string');
        expect(exercise.name.length).toBeGreaterThan(0);
      });
    });

    it('should have valid categories', () => {
      const validCategories = ['compound', 'isolation', 'cardio', 'stretching'];
      EXERCISE_DATABASE.forEach((exercise) => {
        expect(validCategories).toContain(exercise.category);
      });
    });

    it('should have valid difficulty levels', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      EXERCISE_DATABASE.forEach((exercise) => {
        expect(validDifficulties).toContain(exercise.difficulty);
      });
    });

    it('should have muscleGroups as array', () => {
      EXERCISE_DATABASE.forEach((exercise) => {
        expect(Array.isArray(exercise.muscleGroups)).toBe(true);
        expect(exercise.muscleGroups.length).toBeGreaterThan(0);
      });
    });

    it('should have instructions as array', () => {
      EXERCISE_DATABASE.forEach((exercise) => {
        expect(Array.isArray(exercise.instructions)).toBe(true);
        expect(exercise.instructions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Exercise Alternatives', () => {
    it('should have alternatives for major exercises', () => {
      const benchPress = getExerciseById('bench-press');
      expect(benchPress?.alternatives).toBeDefined();
      expect(benchPress?.alternatives!.length).toBeGreaterThan(0);
    });

    it('should have valid alternative structure', () => {
      BENCH_PRESS_ALTERNATIVES.forEach((alt) => {
        expect(alt).toHaveProperty('id');
        expect(alt).toHaveProperty('name');
        expect(alt).toHaveProperty('equipment');
        expect(alt).toHaveProperty('difficultyModifier');
        expect(alt).toHaveProperty('muscleActivationNotes');
        expect(alt).toHaveProperty('whenToUse');
      });
    });

    it('should have difficultyModifier as easier, same, or harder', () => {
      const validModifiers = ['easier', 'same', 'harder'];
      BENCH_PRESS_ALTERNATIVES.forEach((alt) => {
        expect(validModifiers).toContain(alt.difficultyModifier);
      });
    });

    it('should have whenToUse as array', () => {
      BENCH_PRESS_ALTERNATIVES.forEach((alt) => {
        expect(Array.isArray(alt.whenToUse)).toBe(true);
        expect(alt.whenToUse.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getExerciseById', () => {
    it('should return exercise for valid ID', () => {
      const exercise = getExerciseById('bench-press');
      expect(exercise).toBeDefined();
      expect(exercise?.id).toBe('bench-press');
    });

    it('should return undefined for invalid ID', () => {
      const exercise = getExerciseById('nonexistent-exercise');
      expect(exercise).toBeUndefined();
    });

    it('should return correct exercise data', () => {
      const squat = getExerciseById('squat');
      expect(squat).toBeDefined();
      expect(squat?.name).toBe('Squat');
      expect(squat?.category).toBe('compound');
    });
  });

  describe('getExerciseAlternatives', () => {
    it('should return alternatives for exercise with alternatives', () => {
      const alternatives = getExerciseAlternatives('bench-press');
      expect(alternatives.length).toBeGreaterThan(0);
    });

    it('should return empty array for exercise without alternatives', () => {
      const alternatives = getExerciseAlternatives('nonexistent-exercise');
      expect(alternatives).toEqual([]);
    });

    it('should return correct alternatives', () => {
      const alternatives = getExerciseAlternatives('squat');
      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives[0]).toHaveProperty('equipment');
    });
  });

  describe('getExercisesForEquipment', () => {
    it('should return exercises for barbell', () => {
      const exercises = getExercisesForEquipment(['barbell']);
      expect(exercises.length).toBeGreaterThan(0);
      exercises.forEach((ex) => {
        expect(ex.equipment).toBe('barbell');
      });
    });

    it('should return exercises for bodyweight', () => {
      const exercises = getExercisesForEquipment(['bodyweight']);
      expect(exercises.length).toBeGreaterThan(0);
      exercises.forEach((ex) => {
        expect(ex.equipment).toBe('bodyweight');
      });
    });

    it('should return exercises for multiple equipment types', () => {
      const exercises = getExercisesForEquipment(['barbell', 'dumbbells']);
      expect(exercises.length).toBeGreaterThan(0);
      exercises.forEach((ex) => {
        expect(['barbell', 'dumbbells']).toContain(ex.equipment);
      });
    });

    it('should return empty array for non-existent equipment', () => {
      const exercises = getExercisesForEquipment(['nonexistent' as any]);
      expect(exercises).toEqual([]);
    });
  });

  describe('getExercisesByMuscleGroup', () => {
    it('should return exercises for chest', () => {
      const exercises = getExercisesByMuscleGroup('chest');
      expect(exercises.length).toBeGreaterThan(0);
      exercises.forEach((ex) => {
        expect(ex.muscleGroups).toContain('chest');
      });
    });

    it('should return exercises for legs', () => {
      const exercises = getExercisesByMuscleGroup('legs');
      expect(exercises.length).toBeGreaterThan(0);
      exercises.forEach((ex) => {
        expect(ex.muscleGroups).toContain('legs');
      });
    });

    it('should return exercises for back', () => {
      const exercises = getExercisesByMuscleGroup('back');
      expect(exercises.length).toBeGreaterThan(0);
      exercises.forEach((ex) => {
        expect(ex.muscleGroups).toContain('back');
      });
    });

    it('should return empty array for non-existent muscle group', () => {
      const exercises = getExercisesByMuscleGroup('nonexistent' as any);
      expect(exercises).toEqual([]);
    });
  });

  describe('SQUAT_ALTERNATIVES', () => {
    it('should be defined and be an array', () => {
      expect(SQUAT_ALTERNATIVES).toBeDefined();
      expect(Array.isArray(SQUAT_ALTERNATIVES)).toBe(true);
    });

    it('should have at least 5 alternatives', () => {
      expect(SQUAT_ALTERNATIVES.length).toBeGreaterThanOrEqual(5);
    });

    it('should include goblet squat', () => {
      const gobletSquat = SQUAT_ALTERNATIVES.find((alt) => alt.id === 'squat-goblet');
      expect(gobletSquat).toBeDefined();
      expect(gobletSquat?.equipment).toBe('dumbbells');
    });

    it('should include bodyweight squat', () => {
      const bodyweightSquat = SQUAT_ALTERNATIVES.find((alt) => alt.id === 'squat-bodyweight');
      expect(bodyweightSquat).toBeDefined();
      expect(bodyweightSquat?.equipment).toBe('bodyweight');
    });
  });
});
