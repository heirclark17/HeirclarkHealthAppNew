// Goals Calculator Constants
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
} as const;

export const BMI_CATEGORIES = [
  { max: 18.5, name: 'Underweight', class: 'underweight', color: '#60a5fa' },
  { max: 25, name: 'Normal', class: 'normal', color: '#4ade80' },
  { max: 30, name: 'Overweight', class: 'overweight', color: '#ffaa00' },
  { max: 35, name: 'Obese Class I', class: 'obese', color: '#f87171' },
  { max: 40, name: 'Obese Class II', class: 'obese', color: '#f87171' },
  { max: Infinity, name: 'Obese Class III', class: 'obese', color: '#f87171' },
] as const;

export const SAFE_LOSS_MIN = 0.5;
export const SAFE_LOSS_MAX = 2.0;
export const SAFE_GAIN_MIN = 0.25;
export const SAFE_GAIN_MAX = 0.5;

export type ActivityLevel = keyof typeof ACTIVITY_MULTIPLIERS;
export type GoalType = 'lose' | 'maintain' | 'gain';
export type Sex = 'male' | 'female';

export interface UserProfile {
  age: number;
  sex: Sex;
  heightFt: number;
  heightIn: number;
  weight: number;
  targetWeight: number;
  activity: ActivityLevel;
  goalType: GoalType;
  startDate: string;
  endDate: string;
}

export interface CalculatedResults {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bmr: number;
  tdee: number;
  bmi: number;
  bmiCategory: typeof BMI_CATEGORIES[number];
  weeklyChange: number;
  dailyDelta: number;
  totalWeeks: number;
}
