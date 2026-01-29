import {
  ACTIVITY_MULTIPLIERS,
  BMI_CATEGORIES,
  UserProfile,
  CalculatedResults,
  GoalType,
} from '../constants/goals';

export function calculateGoals(profile: UserProfile): CalculatedResults {
  const { age, sex, heightFt, heightIn, weight, targetWeight, activity, goalType, startDate, endDate } = profile;

  // Convert to metric
  const heightCm = (heightFt * 12 + heightIn) * 2.54;
  const heightM = heightCm / 100;
  const weightKg = weight * 0.453592;

  // BMI
  const bmi = weightKg / (heightM * heightM);
  const bmiCategory = BMI_CATEGORIES.find((c) => bmi < c.max)!;

  // BMR (Mifflin-St Jeor)
  let bmr: number;
  if (sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  // TDEE
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activity];

  // Weekly change calculation
  let weeklyChange = 0;
  let totalWeeks = 0;
  let dailyDelta = 0;

  if (goalType !== 'maintain' && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    totalWeeks = Math.max(1, diffDays / 7);
    const totalChange = targetWeight - weight;
    weeklyChange = totalChange / totalWeeks;
    dailyDelta = (weeklyChange * 3500) / 7;
  }

  // Target calories
  let targetCalories = tdee + dailyDelta;
  targetCalories = Math.max(1200, Math.round(targetCalories));

  // Macros
  const proteinGrams = Math.round(weight * 0.8);
  const fatGrams = Math.round((targetCalories * 0.25) / 9);
  const proteinCals = proteinGrams * 4;
  const fatCals = fatGrams * 9;
  const carbsCals = targetCalories - proteinCals - fatCals;
  const carbsGrams = Math.round(carbsCals / 4);

  return {
    calories: targetCalories,
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    bmi,
    bmiCategory,
    weeklyChange,
    dailyDelta,
    totalWeeks,
  };
}

export function validateWeeklyChange(
  goalType: GoalType,
  weeklyChange: number
): { isWarning: boolean; message: string } {
  const absChange = Math.abs(weeklyChange);

  if (goalType === 'lose' && absChange > 2.0) {
    return {
      isWarning: true,
      message: `Losing more than 2 lb/week may be too aggressive. This pace could lead to muscle loss, fatigue, and is harder to sustain.`,
    };
  }

  if (goalType === 'gain' && absChange > 0.5) {
    return {
      isWarning: true,
      message: `Gaining more than 0.5 lb/week often means excess fat gain. For lean muscle gain, consider extending your timeline.`,
    };
  }

  return { isWarning: false, message: '' };
}

export function generateTips(results: CalculatedResults, goalType: GoalType): string[] {
  const tips: string[] = [];

  if (goalType === 'lose') {
    tips.push(`Prioritize protein: Aim for ${results.protein}g daily to preserve muscle while losing fat.`);
    tips.push('Weight fluctuates 2-4 lbs daily due to water, sodium, and food volume. Track weekly averages.');
    if (Math.abs(results.weeklyChange) > 1.5) {
      tips.push('Your rate is aggressive. If energy drops, add 100-200 calories. Sustainability trumps speed.');
    }
    tips.push('Strength train 2-3x weekly minimum to signal your body to keep muscle while shedding fat.');
  } else if (goalType === 'gain') {
    tips.push(`Hit your protein target of ${results.protein}g to support muscle protein synthesis.`);
    tips.push('Progressive overload in the gym is essential. Without challenging your muscles, extra calories become fat.');
    tips.push('Sleep 7-9 hours. Muscle grows during recovery, not just in the gym.');
  } else {
    tips.push('At maintenance, focus on food quality and body composition rather than the scale.');
    tips.push('Use this phase to build sustainable habits before any future cut or bulk.');
  }

  tips.push('Track your food for at least 2 weeks to build awareness. After that, you can be more flexible.');

  return tips;
}
