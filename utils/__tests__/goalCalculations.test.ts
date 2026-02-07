import { calculateGoals, validateWeeklyChange, generateTips } from '../goalCalculations';
import { createMockUserProfile } from '../../__tests__/testUtils';

describe('goalCalculations', () => {
  describe('calculateGoals', () => {
    it('calculates BMR correctly for male', () => {
      const profile = createMockUserProfile({ sex: 'male', age: 30, heightFt: 5, heightIn: 10, weight: 180 });
      const results = calculateGoals(profile);
      // Mifflin-St Jeor male: 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      const weightKg = 180 * 0.453592;
      const heightCm = (5 * 12 + 10) * 2.54;
      const expectedBmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * 30 + 5);
      expect(results.bmr).toBe(expectedBmr);
    });

    it('calculates BMR correctly for female', () => {
      const profile = createMockUserProfile({ sex: 'female', age: 25, heightFt: 5, heightIn: 5, weight: 140 });
      const results = calculateGoals(profile);
      const weightKg = 140 * 0.453592;
      const heightCm = (5 * 12 + 5) * 2.54;
      const expectedBmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * 25 - 161);
      expect(results.bmr).toBe(expectedBmr);
    });

    it('applies sedentary activity multiplier to TDEE', () => {
      const profile = createMockUserProfile({ activity: 'sedentary', goalType: 'maintain' });
      const results = calculateGoals(profile);
      // TDEE is computed from unrounded BMR * multiplier then rounded
      // Allow ±1 due to intermediate rounding
      expect(Math.abs(results.tdee - Math.round(results.bmr * 1.2))).toBeLessThanOrEqual(1);
    });

    it('applies light activity multiplier to TDEE', () => {
      const profile = createMockUserProfile({ activity: 'light', goalType: 'maintain' });
      const results = calculateGoals(profile);
      expect(Math.abs(results.tdee - Math.round(results.bmr * 1.375))).toBeLessThanOrEqual(1);
    });

    it('applies moderate activity multiplier to TDEE', () => {
      const profile = createMockUserProfile({ activity: 'moderate', goalType: 'maintain' });
      const results = calculateGoals(profile);
      expect(Math.abs(results.tdee - Math.round(results.bmr * 1.55))).toBeLessThanOrEqual(1);
    });

    it('applies very active activity multiplier to TDEE', () => {
      const profile = createMockUserProfile({ activity: 'very', goalType: 'maintain' });
      const results = calculateGoals(profile);
      expect(Math.abs(results.tdee - Math.round(results.bmr * 1.725))).toBeLessThanOrEqual(1);
    });

    it('applies extra active activity multiplier to TDEE', () => {
      const profile = createMockUserProfile({ activity: 'extra', goalType: 'maintain' });
      const results = calculateGoals(profile);
      expect(Math.abs(results.tdee - Math.round(results.bmr * 1.9))).toBeLessThanOrEqual(1);
    });

    it('calculates BMI correctly', () => {
      const profile = createMockUserProfile({ heightFt: 5, heightIn: 10, weight: 180 });
      const results = calculateGoals(profile);
      const heightM = ((5 * 12 + 10) * 2.54) / 100;
      const weightKg = 180 * 0.453592;
      const expectedBmi = weightKg / (heightM * heightM);
      expect(results.bmi).toBeCloseTo(expectedBmi, 5);
    });

    it('assigns correct BMI category for normal weight', () => {
      const profile = createMockUserProfile({ heightFt: 5, heightIn: 10, weight: 160 });
      const results = calculateGoals(profile);
      expect(results.bmiCategory.name).toBe('Normal');
    });

    it('assigns correct BMI category for overweight', () => {
      const profile = createMockUserProfile({ heightFt: 5, heightIn: 10, weight: 200 });
      const results = calculateGoals(profile);
      expect(results.bmiCategory.name).toBe('Overweight');
    });

    it('assigns correct BMI category for underweight', () => {
      const profile = createMockUserProfile({ heightFt: 5, heightIn: 10, weight: 120 });
      const results = calculateGoals(profile);
      expect(results.bmiCategory.name).toBe('Underweight');
    });

    it('enforces 1200 calorie floor', () => {
      // Very aggressive deficit scenario
      const profile = createMockUserProfile({
        weight: 120,
        targetWeight: 100,
        activity: 'sedentary',
        goalType: 'lose',
        startDate: '2026-01-01',
        endDate: '2026-01-15', // 2 weeks for 20 lbs = very aggressive
      });
      const results = calculateGoals(profile);
      expect(results.calories).toBeGreaterThanOrEqual(1200);
    });

    it('calculates protein at 0.8g per lb bodyweight', () => {
      const profile = createMockUserProfile({ weight: 180 });
      const results = calculateGoals(profile);
      expect(results.protein).toBe(Math.round(180 * 0.8));
    });

    it('allocates 25% of calories to fat', () => {
      const profile = createMockUserProfile({ goalType: 'maintain' });
      const results = calculateGoals(profile);
      const expectedFat = Math.round((results.calories * 0.25) / 9);
      expect(results.fat).toBe(expectedFat);
    });

    it('allocates remaining calories to carbs after protein and fat', () => {
      const profile = createMockUserProfile({ goalType: 'maintain' });
      const results = calculateGoals(profile);
      const proteinCals = results.protein * 4;
      const fatCals = results.fat * 9;
      const carbsCals = results.calories - proteinCals - fatCals;
      expect(results.carbs).toBe(Math.round(carbsCals / 4));
    });

    it('sets zero weekly change for maintain goal', () => {
      const profile = createMockUserProfile({ goalType: 'maintain' });
      const results = calculateGoals(profile);
      expect(results.weeklyChange).toBe(0);
      expect(results.dailyDelta).toBe(0);
      expect(results.totalWeeks).toBe(0);
    });

    it('calculates negative weekly change for weight loss', () => {
      const profile = createMockUserProfile({
        weight: 200,
        targetWeight: 180,
        goalType: 'lose',
        startDate: '2026-01-01',
        endDate: '2026-03-26', // ~12 weeks
      });
      const results = calculateGoals(profile);
      expect(results.weeklyChange).toBeLessThan(0);
    });

    it('calculates positive weekly change for weight gain', () => {
      const profile = createMockUserProfile({
        weight: 150,
        targetWeight: 165,
        goalType: 'gain',
        startDate: '2026-01-01',
        endDate: '2026-07-01', // ~26 weeks
      });
      const results = calculateGoals(profile);
      expect(results.weeklyChange).toBeGreaterThan(0);
    });

    it('rounds calories to nearest integer', () => {
      const profile = createMockUserProfile();
      const results = calculateGoals(profile);
      expect(Number.isInteger(results.calories)).toBe(true);
    });

    it('rounds BMR to nearest integer', () => {
      const profile = createMockUserProfile();
      const results = calculateGoals(profile);
      expect(Number.isInteger(results.bmr)).toBe(true);
    });

    it('rounds TDEE to nearest integer', () => {
      const profile = createMockUserProfile();
      const results = calculateGoals(profile);
      expect(Number.isInteger(results.tdee)).toBe(true);
    });
  });

  describe('validateWeeklyChange', () => {
    it('returns no warning for safe weight loss rate', () => {
      const result = validateWeeklyChange('lose', -1.5);
      expect(result.isWarning).toBe(false);
      expect(result.message).toBe('');
    });

    it('returns warning for excessive weight loss rate', () => {
      const result = validateWeeklyChange('lose', -2.5);
      expect(result.isWarning).toBe(true);
      expect(result.message).toContain('2 lb/week');
    });

    it('returns no warning for safe weight gain rate', () => {
      const result = validateWeeklyChange('gain', 0.4);
      expect(result.isWarning).toBe(false);
    });

    it('returns warning for excessive weight gain rate', () => {
      const result = validateWeeklyChange('gain', 0.8);
      expect(result.isWarning).toBe(true);
      expect(result.message).toContain('0.5 lb/week');
    });

    it('returns no warning for maintain goal', () => {
      const result = validateWeeklyChange('maintain', 0);
      expect(result.isWarning).toBe(false);
    });

    it('uses absolute value for comparison', () => {
      // -2.5 abs = 2.5 > 2.0 threshold
      const result = validateWeeklyChange('lose', -2.5);
      expect(result.isWarning).toBe(true);
    });

    it('returns no warning at exactly 2.0 lb/week loss', () => {
      const result = validateWeeklyChange('lose', -2.0);
      expect(result.isWarning).toBe(false);
    });

    it('returns no warning at exactly 0.5 lb/week gain', () => {
      const result = validateWeeklyChange('gain', 0.5);
      expect(result.isWarning).toBe(false);
    });
  });

  describe('generateTips', () => {
    it('generates weight loss tips for lose goal', () => {
      const profile = createMockUserProfile({ goalType: 'lose' });
      const results = calculateGoals(profile);
      const tips = generateTips(results, 'lose');
      expect(tips.length).toBeGreaterThanOrEqual(3);
      expect(tips[0]).toContain('protein');
    });

    it('generates weight gain tips for gain goal', () => {
      const profile = createMockUserProfile({ goalType: 'gain', targetWeight: 200 });
      const results = calculateGoals(profile);
      const tips = generateTips(results, 'gain');
      expect(tips.length).toBeGreaterThanOrEqual(3);
      expect(tips[0]).toContain('protein');
    });

    it('generates maintenance tips for maintain goal', () => {
      const profile = createMockUserProfile({ goalType: 'maintain' });
      const results = calculateGoals(profile);
      const tips = generateTips(results, 'maintain');
      expect(tips.length).toBeGreaterThanOrEqual(2);
      expect(tips[0]).toContain('maintenance');
    });

    it('adds aggressive rate tip when loss is > 1.5 lb/week', () => {
      const profile = createMockUserProfile({
        weight: 250,
        targetWeight: 200,
        goalType: 'lose',
        startDate: '2026-01-01',
        endDate: '2026-04-01', // ~13 weeks for 50 lbs = ~3.8 lb/week
      });
      const results = calculateGoals(profile);
      const tips = generateTips(results, 'lose');
      const aggressiveTip = tips.find((t) => t.includes('aggressive'));
      expect(aggressiveTip).toBeDefined();
    });

    it('always includes tracking tip', () => {
      const profile = createMockUserProfile({ goalType: 'maintain' });
      const results = calculateGoals(profile);
      const tips = generateTips(results, 'maintain');
      const trackingTip = tips.find((t) => t.includes('Track'));
      expect(trackingTip).toBeDefined();
    });
  });
});
