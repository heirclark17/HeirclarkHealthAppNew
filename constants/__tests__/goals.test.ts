import {
  ACTIVITY_MULTIPLIERS,
  BMI_CATEGORIES,
  SAFE_LOSS_MIN,
  SAFE_LOSS_MAX,
  SAFE_GAIN_MIN,
  SAFE_GAIN_MAX,
  ActivityLevel,
  GoalType,
  Sex,
  UserProfile,
  CalculatedResults,
} from '../goals';

describe('Goals Constants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ACTIVITY_MULTIPLIERS', () => {
    it('should have all expected activity level keys', () => {
      expect(ACTIVITY_MULTIPLIERS.sedentary).toBeDefined();
      expect(ACTIVITY_MULTIPLIERS.light).toBeDefined();
      expect(ACTIVITY_MULTIPLIERS.moderate).toBeDefined();
      expect(ACTIVITY_MULTIPLIERS.very).toBeDefined();
      expect(ACTIVITY_MULTIPLIERS.extra).toBeDefined();
    });

    it('should have all multiplier values greater than 1.0', () => {
      Object.values(ACTIVITY_MULTIPLIERS).forEach((multiplier) => {
        expect(multiplier).toBeGreaterThan(1.0);
      });
    });

    it('should have expected multiplier values', () => {
      expect(ACTIVITY_MULTIPLIERS.sedentary).toBe(1.2);
      expect(ACTIVITY_MULTIPLIERS.light).toBe(1.375);
      expect(ACTIVITY_MULTIPLIERS.moderate).toBe(1.55);
      expect(ACTIVITY_MULTIPLIERS.very).toBe(1.725);
      expect(ACTIVITY_MULTIPLIERS.extra).toBe(1.9);
    });

    it('should have multipliers in ascending order', () => {
      const values = Object.values(ACTIVITY_MULTIPLIERS);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });
  });

  describe('BMI_CATEGORIES', () => {
    it('should be sorted by max value ascending', () => {
      for (let i = 1; i < BMI_CATEGORIES.length; i++) {
        expect(BMI_CATEGORIES[i].max).toBeGreaterThanOrEqual(BMI_CATEGORIES[i - 1].max);
      }
    });

    it('should cover full range with last entry max as Infinity', () => {
      const lastCategory = BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
      expect(lastCategory.max).toBe(Infinity);
    });

    it('should have all required properties in each category', () => {
      BMI_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('class');
        expect(category).toHaveProperty('color');
        expect(category).toHaveProperty('max');
        expect(typeof category.name).toBe('string');
        expect(typeof category.class).toBe('string');
        expect(typeof category.color).toBe('string');
        expect(typeof category.max).toBe('number');
      });
    });

    it('should have expected first category (Underweight)', () => {
      expect(BMI_CATEGORIES[0].name).toBe('Underweight');
      expect(BMI_CATEGORIES[0].max).toBe(18.5);
    });

    it('should have expected normal category', () => {
      const normalCategory = BMI_CATEGORIES.find((cat) => cat.name === 'Normal');
      expect(normalCategory).toBeDefined();
      expect(normalCategory?.max).toBe(25);
    });

    it('should have at least 4 categories', () => {
      expect(BMI_CATEGORIES.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Safe Weight Change Constants', () => {
    it('should have SAFE_LOSS_MIN and SAFE_LOSS_MAX defined', () => {
      expect(SAFE_LOSS_MIN).toBeDefined();
      expect(SAFE_LOSS_MAX).toBeDefined();
      expect(typeof SAFE_LOSS_MIN).toBe('number');
      expect(typeof SAFE_LOSS_MAX).toBe('number');
    });

    it('should have SAFE_GAIN_MIN and SAFE_GAIN_MAX defined', () => {
      expect(SAFE_GAIN_MIN).toBeDefined();
      expect(SAFE_GAIN_MAX).toBeDefined();
      expect(typeof SAFE_GAIN_MIN).toBe('number');
      expect(typeof SAFE_GAIN_MAX).toBe('number');
    });

    it('should have sensible safe weight loss values', () => {
      expect(SAFE_LOSS_MIN).toBe(0.5);
      expect(SAFE_LOSS_MAX).toBe(2.0);
      expect(SAFE_LOSS_MAX).toBeGreaterThan(SAFE_LOSS_MIN);
    });

    it('should have sensible safe weight gain values', () => {
      expect(SAFE_GAIN_MIN).toBe(0.25);
      expect(SAFE_GAIN_MAX).toBe(0.5);
      expect(SAFE_GAIN_MAX).toBeGreaterThan(SAFE_GAIN_MIN);
    });

    it('should have gain values lower than loss values', () => {
      expect(SAFE_GAIN_MAX).toBeLessThan(SAFE_LOSS_MAX);
    });
  });

  describe('Type Exports', () => {
    it('should export ActivityLevel type', () => {
      const activityLevel: ActivityLevel = 'moderate';
      expect(['sedentary', 'light', 'moderate', 'very', 'extra']).toContain(activityLevel);
    });

    it('should export GoalType type', () => {
      const goalType: GoalType = 'lose';
      expect(['lose', 'maintain', 'gain']).toContain(goalType);
    });

    it('should export Sex type', () => {
      const sex: Sex = 'male';
      expect(['male', 'female']).toContain(sex);
    });

    it('should export UserProfile interface with required fields', () => {
      const userProfile: UserProfile = {
        age: 30,
        sex: 'male',
        heightFt: 5,
        heightIn: 10,
        weight: 180,
        targetWeight: 170,
        activity: 'moderate',
        goalType: 'lose',
        startDate: '2026-01-01',
        endDate: '2026-06-01',
      };

      expect(userProfile.age).toBe(30);
      expect(userProfile.sex).toBe('male');
      expect(userProfile.activity).toBe('moderate');
      expect(userProfile.goalType).toBe('lose');
    });

    it('should export CalculatedResults interface with required fields', () => {
      const results: CalculatedResults = {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 67,
        bmr: 1800,
        tdee: 2400,
        bmi: 24.5,
        bmiCategory: BMI_CATEGORIES[1],
        weeklyChange: -1,
        dailyDelta: -500,
        totalWeeks: 10,
      };

      expect(results.calories).toBe(2000);
      expect(results.bmr).toBeDefined();
      expect(results.tdee).toBeDefined();
      expect(results.bmiCategory).toBeDefined();
    });
  });
});
