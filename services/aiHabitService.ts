/**
 * AI-Powered Habit Suggestion Service
 * Uses GPT-4.1-mini to generate personalized habit recommendations
 */

import OpenAI from 'openai';
import Constants from 'expo-constants';
import { SuggestedHabit, UserHabitContext, HabitCategory, HabitFrequency } from '../types/habitFormation';

const apiKey = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
});

const VALID_CATEGORIES: HabitCategory[] = ['nutrition', 'fitness', 'sleep', 'mindfulness', 'hydration', 'custom'];
const VALID_FREQUENCIES: HabitFrequency[] = ['daily', 'weekly', 'specific_days'];
const VALID_ICONS = [
  'water', 'restaurant', 'walk', 'scale', 'moon', 'leaf', 'barbell',
  'sunny', 'bed', 'fitness', 'nutrition', 'timer', 'body', 'footsteps',
  'heart', 'medkit', 'pulse', 'cafe', 'flash', 'shield-checkmark',
  'book', 'musical-notes', 'bicycle', 'baseball', 'basketball',
  'football', 'tennisball', 'alarm', 'eye', 'hand-left', 'happy',
];

function buildSystemPrompt(): string {
  return `You are a health behavior scientist and habit formation expert. Your job is to analyze a user's health data and suggest 5-7 personalized daily habits that will help them reach their goals.

Rules:
- Suggest habits that address the user's WEAKEST areas first (low hydration, poor sleep, missed workouts, etc.)
- Never suggest a habit the user already has
- Each habit must be concrete and actionable (not generic like "Be healthier")
- Include a brief reason referencing their ACTUAL data (e.g., "Your avg water intake is 32oz vs your 64oz goal")
- Use valid Ionicons icon names from this list: ${VALID_ICONS.join(', ')}
- Categories must be one of: nutrition, fitness, sleep, mindfulness, hydration, custom
- Frequency must be one of: daily, weekly, specific_days
- Priority should reflect how impactful the habit would be for this specific user

Return JSON: { "habits": [ { "name", "description", "category", "icon", "frequency", "reason", "priority" } ] }`;
}

function buildUserPrompt(ctx: UserHabitContext): string {
  const lines: string[] = [
    '=== USER HEALTH DATA ===',
    '',
    `Goal: ${ctx.primaryGoal || 'Not set'}`,
    `Current Weight: ${ctx.currentWeight || 'Unknown'} | Target: ${ctx.targetWeight || 'Unknown'}`,
    `Weight Trend: ${ctx.weightTrend}`,
    `Activity Level: ${ctx.activityLevel || 'Unknown'}`,
    `Diet Style: ${ctx.dietStyle || 'standard'}`,
    '',
    '--- Hydration ---',
    `Daily Goal: ${ctx.hydrationGoalOz}oz | Avg Intake: ${ctx.hydrationAvgOz}oz`,
    `Streak: ${ctx.hydrationStreak} days`,
    '',
    '--- Sleep ---',
    `Goal: ${ctx.sleepGoalHours}hrs | Avg: ${ctx.sleepAvgHours}hrs`,
    `Sleep Debt: ${ctx.sleepDebtMinutes} minutes`,
    `Avg Quality: ${ctx.sleepAvgQuality}/5`,
    '',
    '--- Training ---',
    `Has Plan: ${ctx.hasTrainingPlan ? 'Yes' : 'No'}`,
    `Workouts/Week: ${ctx.workoutsPerWeek}`,
    `Current Week: ${ctx.trainingWeekIndex + 1}`,
    '',
    '--- Nutrition ---',
    `Has Meal Plan: ${ctx.hasMealPlan ? 'Yes' : 'No'}`,
    `Meals/Day: ${ctx.mealsPerDay}`,
    `Calorie Target: ${ctx.calorieTarget}`,
  ];

  if (ctx.isFasting && ctx.fastingWindow) {
    lines.push(`Intermittent Fasting: ${ctx.fastingWindow.start} - ${ctx.fastingWindow.end}`);
  }

  lines.push('');
  lines.push('--- Habit Tracking ---');
  lines.push(`Overall Completion Rate: ${ctx.habitCompletionRate}%`);
  lines.push(`Existing Habits: ${ctx.existingHabitNames.length > 0 ? ctx.existingHabitNames.join(', ') : 'None yet'}`);
  lines.push('');
  lines.push('Based on this data, suggest 5-7 personalized habits. Focus on the weakest areas first.');

  return lines.join('\n');
}

function validateSuggestion(h: any): SuggestedHabit | null {
  if (!h || typeof h.name !== 'string' || !h.name.trim()) return null;

  return {
    name: h.name.trim(),
    description: typeof h.description === 'string' ? h.description.trim() : '',
    category: VALID_CATEGORIES.includes(h.category) ? h.category : 'custom',
    icon: VALID_ICONS.includes(h.icon) ? h.icon : 'star',
    frequency: VALID_FREQUENCIES.includes(h.frequency) ? h.frequency : 'daily',
    reason: typeof h.reason === 'string' ? h.reason.trim() : 'Recommended for your goals',
    priority: ['high', 'medium', 'low'].includes(h.priority) ? h.priority : 'medium',
  };
}

/**
 * Generate personalized habit suggestions using AI
 */
export async function generatePersonalizedHabits(ctx: UserHabitContext): Promise<SuggestedHabit[]> {
  console.log('[AI Habits] Generating personalized suggestions...');

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(ctx) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 800,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    console.log('[AI Habits] Response length:', responseText.length, 'chars');

    const parsed = JSON.parse(responseText);
    const rawHabits = Array.isArray(parsed.habits) ? parsed.habits : [];

    const validated = rawHabits
      .map(validateSuggestion)
      .filter((h): h is SuggestedHabit => h !== null)
      .filter((h) => !ctx.existingHabitNames.some(
        (existing) => existing.toLowerCase() === h.name.toLowerCase()
      ));

    console.log('[AI Habits] Validated', validated.length, 'suggestions');
    return validated.slice(0, 7);
  } catch (error: any) {
    console.error('[AI Habits] Error:', error.message);
    return [];
  }
}
