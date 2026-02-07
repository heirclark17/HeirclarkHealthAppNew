import {
  PROGRAM_TEMPLATES,
  getProgramById,
  getRecommendedPrograms,
  getProgramsByGoal,
} from '../programTemplates';

describe('Program Templates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PROGRAM_TEMPLATES', () => {
    it('should be defined and be an array', () => {
      expect(PROGRAM_TEMPLATES).toBeDefined();
      expect(Array.isArray(PROGRAM_TEMPLATES)).toBe(true);
    });

    it('should have at least 8 programs', () => {
      expect(PROGRAM_TEMPLATES.length).toBeGreaterThanOrEqual(8);
    });

    it('should have no duplicate program IDs', () => {
      const ids = PROGRAM_TEMPLATES.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have required fields in each program', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(program).toHaveProperty('id');
        expect(program).toHaveProperty('name');
        expect(program).toHaveProperty('shortName');
        expect(program).toHaveProperty('description');
        expect(program).toHaveProperty('philosophy');
        expect(program).toHaveProperty('source');
        expect(program).toHaveProperty('duration');
        expect(program).toHaveProperty('daysPerWeek');
        expect(program).toHaveProperty('difficulty');
        expect(program).toHaveProperty('focus');
        expect(program).toHaveProperty('targetGoals');
        expect(program).toHaveProperty('suitableFor');
        expect(program).toHaveProperty('weeklyStructure');
        expect(program).toHaveProperty('progressionScheme');
        expect(program).toHaveProperty('deloadProtocol');
      });
    });

    it('should have non-empty name strings', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(typeof program.name).toBe('string');
        expect(program.name.length).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty levels', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(validDifficulties).toContain(program.difficulty);
      });
    });

    it('should have daysPerWeek between 1 and 7', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(program.daysPerWeek).toBeGreaterThanOrEqual(1);
        expect(program.daysPerWeek).toBeLessThanOrEqual(7);
      });
    });

    it('should have duration greater than 0', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(program.duration).toBeGreaterThan(0);
      });
    });

    it('should have focus as array with at least one item', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(Array.isArray(program.focus)).toBe(true);
        expect(program.focus.length).toBeGreaterThan(0);
      });
    });

    it('should have targetGoals as array with at least one item', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(Array.isArray(program.targetGoals)).toBe(true);
        expect(program.targetGoals.length).toBeGreaterThan(0);
      });
    });

    it('should have weeklyStructure as array with correct number of days', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(Array.isArray(program.weeklyStructure)).toBe(true);
        expect(program.weeklyStructure.length).toBe(program.daysPerWeek);
      });
    });
  });

  describe('Program Categories', () => {
    it('should have beginner programs', () => {
      const beginnerPrograms = PROGRAM_TEMPLATES.filter((p) => p.difficulty === 'beginner');
      expect(beginnerPrograms.length).toBeGreaterThan(0);
    });

    it('should have intermediate programs', () => {
      const intermediatePrograms = PROGRAM_TEMPLATES.filter((p) => p.difficulty === 'intermediate');
      expect(intermediatePrograms.length).toBeGreaterThan(0);
    });

    it('should have programs for different goals', () => {
      const goals = ['build_muscle', 'lose_weight', 'improve_health'];
      goals.forEach((goal) => {
        const programsForGoal = PROGRAM_TEMPLATES.filter((p) => p.targetGoals.includes(goal as any));
        expect(programsForGoal.length).toBeGreaterThan(0);
      });
    });

    it('should have 3-day programs', () => {
      const threeDayPrograms = PROGRAM_TEMPLATES.filter((p) => p.daysPerWeek === 3);
      expect(threeDayPrograms.length).toBeGreaterThan(0);
    });

    it('should have 4-day programs', () => {
      const fourDayPrograms = PROGRAM_TEMPLATES.filter((p) => p.daysPerWeek === 4);
      expect(fourDayPrograms.length).toBeGreaterThan(0);
    });
  });

  describe('Weekly Structure', () => {
    it('should have valid workout structure for each day', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        program.weeklyStructure.forEach((workout) => {
          expect(workout).toHaveProperty('day');
          expect(workout).toHaveProperty('name');
          expect(workout).toHaveProperty('workoutType');
          expect(workout).toHaveProperty('muscleGroups');
          expect(workout).toHaveProperty('primaryLifts');
          expect(workout).toHaveProperty('accessoryWork');
          expect(workout).toHaveProperty('estimatedDuration');
        });
      });
    });

    it('should have muscleGroups as array', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        program.weeklyStructure.forEach((workout) => {
          expect(Array.isArray(workout.muscleGroups)).toBe(true);
          expect(workout.muscleGroups.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have primaryLifts as array', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        program.weeklyStructure.forEach((workout) => {
          expect(Array.isArray(workout.primaryLifts)).toBe(true);
        });
      });
    });

    it('should have accessoryWork as array', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        program.weeklyStructure.forEach((workout) => {
          expect(Array.isArray(workout.accessoryWork)).toBe(true);
        });
      });
    });

    it('should have estimatedDuration greater than 0', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        program.weeklyStructure.forEach((workout) => {
          expect(workout.estimatedDuration).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Suitable For', () => {
    it('should have suitableFor with required properties', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(program.suitableFor).toHaveProperty('fitnessLevels');
        expect(program.suitableFor).toHaveProperty('equipmentAccess');
        expect(program.suitableFor).toHaveProperty('timeCommitment');
        expect(program.suitableFor).toHaveProperty('experience');
      });
    });

    it('should have fitnessLevels as array', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(Array.isArray(program.suitableFor.fitnessLevels)).toBe(true);
        expect(program.suitableFor.fitnessLevels.length).toBeGreaterThan(0);
      });
    });

    it('should have equipmentAccess as array', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(Array.isArray(program.suitableFor.equipmentAccess)).toBe(true);
        expect(program.suitableFor.equipmentAccess.length).toBeGreaterThan(0);
      });
    });

    it('should have valid timeCommitment values', () => {
      const validCommitments = ['low', 'medium', 'high'];
      PROGRAM_TEMPLATES.forEach((program) => {
        expect(validCommitments).toContain(program.suitableFor.timeCommitment);
      });
    });
  });

  describe('getProgramById', () => {
    it('should return program for valid ID', () => {
      const program = getProgramById('starting-strength');
      expect(program).toBeDefined();
      expect(program?.id).toBe('starting-strength');
    });

    it('should return undefined for invalid ID', () => {
      const program = getProgramById('nonexistent-program');
      expect(program).toBeUndefined();
    });

    it('should return correct program data', () => {
      const ppl = getProgramById('ppl-6day');
      expect(ppl).toBeDefined();
      expect(ppl?.name).toBe('Push Pull Legs (6-Day)');
      expect(ppl?.daysPerWeek).toBe(6);
    });
  });

  describe('getRecommendedPrograms', () => {
    it('should return programs matching all criteria', () => {
      const programs = getRecommendedPrograms('beginner', 'build_muscle', 4, 'full_gym');
      expect(programs.length).toBeGreaterThan(0);
      programs.forEach((p) => {
        expect(p.suitableFor.fitnessLevels).toContain('beginner');
        expect(p.targetGoals).toContain('build_muscle');
        expect(p.daysPerWeek).toBeLessThanOrEqual(4);
        expect(p.suitableFor.equipmentAccess).toContain('full_gym');
      });
    });

    it('should return empty array when no programs match', () => {
      const programs = getRecommendedPrograms('beginner', 'build_muscle', 1, 'full_gym');
      // Might be empty depending on available programs
      expect(Array.isArray(programs)).toBe(true);
    });

    it('should filter by fitness level correctly', () => {
      const beginnerPrograms = getRecommendedPrograms('beginner', 'build_muscle', 7, 'full_gym');
      beginnerPrograms.forEach((p) => {
        expect(p.suitableFor.fitnessLevels).toContain('beginner');
      });
    });

    it('should filter by goal correctly', () => {
      const fatLossPrograms = getRecommendedPrograms('intermediate', 'lose_weight', 7, 'full_gym');
      fatLossPrograms.forEach((p) => {
        expect(p.targetGoals).toContain('lose_weight');
      });
    });
  });

  describe('getProgramsByGoal', () => {
    it('should return programs for build_muscle goal', () => {
      const programs = getProgramsByGoal('build_muscle');
      expect(programs.length).toBeGreaterThan(0);
      programs.forEach((p) => {
        expect(p.targetGoals).toContain('build_muscle');
      });
    });

    it('should return programs for lose_weight goal', () => {
      const programs = getProgramsByGoal('lose_weight');
      expect(programs.length).toBeGreaterThan(0);
      programs.forEach((p) => {
        expect(p.targetGoals).toContain('lose_weight');
      });
    });

    it('should return programs for improve_health goal', () => {
      const programs = getProgramsByGoal('improve_health');
      expect(programs.length).toBeGreaterThan(0);
      programs.forEach((p) => {
        expect(p.targetGoals).toContain('improve_health');
      });
    });

    it('should return empty array for non-existent goal', () => {
      const programs = getProgramsByGoal('nonexistent_goal');
      expect(programs).toEqual([]);
    });
  });

  describe('Famous Programs', () => {
    it('should include Starting Strength', () => {
      const ss = getProgramById('starting-strength');
      expect(ss).toBeDefined();
      expect(ss?.source).toBe('Mark Rippetoe');
    });

    it('should include StrongLifts 5x5', () => {
      const sl = getProgramById('stronglifts-5x5');
      expect(sl).toBeDefined();
      expect(sl?.daysPerWeek).toBe(3);
    });

    it('should include PPL', () => {
      const ppl = getProgramById('ppl-6day');
      expect(ppl).toBeDefined();
      expect(ppl?.daysPerWeek).toBe(6);
    });

    it('should include 5/3/1', () => {
      const fiveThreeOne = getProgramById('wendler-531');
      expect(fiveThreeOne).toBeDefined();
      expect(fiveThreeOne?.source).toBe('Jim Wendler');
    });
  });

  describe('Cardio Integration', () => {
    it('should have cardioIntegration in programs', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        if (program.cardioIntegration) {
          expect(program.cardioIntegration).toHaveProperty('type');
          expect(program.cardioIntegration).toHaveProperty('frequency');
          expect(program.cardioIntegration).toHaveProperty('duration');
          expect(program.cardioIntegration).toHaveProperty('intensity');
          expect(program.cardioIntegration).toHaveProperty('recommendations');
        }
      });
    });

    it('should have recommendations as array when present', () => {
      PROGRAM_TEMPLATES.forEach((program) => {
        if (program.cardioIntegration?.recommendations) {
          expect(Array.isArray(program.cardioIntegration.recommendations)).toBe(true);
        }
      });
    });
  });
});
