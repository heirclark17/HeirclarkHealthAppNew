import OpenAI from 'openai';
import Constants from 'expo-constants';

/**
 * OpenAI Service for direct GPT-4.1-mini API calls
 * Used for generating detailed customized guidance on SuccessScreen
 */

// Get API key from Expo environment variables
const getApiKey = () => {
  return Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
};

// Lazy-load OpenAI client to avoid crashes if API key is missing
let openaiClient: OpenAI | null = null;

const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = getApiKey();

    if (!apiKey) {
      throw new Error(
        'OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file. ' +
        'Get your key from https://platform.openai.com/api-keys'
      );
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Required for React Native
    });
  }

  return openaiClient;
};

export interface WorkoutGuidanceParams {
  primaryGoal: string;
  workoutsPerWeek: number;
  workoutDuration: number;
  activityLevel: string;
  equipmentAccess: string[];
  injuries?: string;
}

export interface DailyGuidanceParams {
  primaryGoal: string;
  currentWeight: number;
  targetWeight: number;
  activityLevel: string;
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionGuidanceParams {
  dietStyle?: string;
  allergies?: string[];
  favoriteCuisines?: string[];
  cookingTime?: string;
  budgetLevel?: string;
  mealsPerDay?: number;
  intermittentFasting?: boolean;
  fastingWindow?: { start: string; end: string };
  dislikedIngredients?: string[];
}

/**
 * Generate detailed workout guidance using GPT-4o-mini
 */
export async function generateWorkoutGuidance(
  params: WorkoutGuidanceParams
): Promise<string> {
  try {
    const prompt = `You are a professional fitness coach. Create a detailed, personalized workout guidance summary (3-4 paragraphs) for a client with the following profile:

Goal: ${params.primaryGoal.replace('_', ' ')}
Training Frequency: ${params.workoutsPerWeek} days per week
Session Duration: ${params.workoutDuration} minutes
Fitness Level: ${params.activityLevel}
Equipment Access: ${params.equipmentAccess.join(', ') || 'Bodyweight only'}
${params.injuries ? `Injuries/Limitations: ${params.injuries}` : ''}

Provide:
1. An overview of the recommended training approach and split
2. Specific exercises or movement patterns they should focus on
3. Progressive overload strategy (how to advance over time)
4. Recovery recommendations

Keep it motivating, practical, and specific to their goals and constraints. Write in second person ("you should..."). Be concise but comprehensive.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert fitness coach providing personalized workout guidance. Be encouraging, specific, and evidence-based.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate workout guidance at this time.';
  } catch (error) {
    console.error('[OpenAI Service] Error generating workout guidance:', error);

    // Return a friendly fallback message instead of crashing
    if (error instanceof Error && error.message.includes('API key not configured')) {
      return 'AI-powered workout guidance is not currently available. To enable this feature, please configure your OpenAI API key in the app settings.';
    }

    return 'Unable to generate personalized workout guidance at this time. Your workout plan will be customized based on your goals and preferences.';
  }
}

/**
 * Generate daily guidance using GPT-4o-mini
 */
export async function generateDailyGuidance(
  params: DailyGuidanceParams
): Promise<string> {
  try {
    const weightChange = params.currentWeight - params.targetWeight;
    const goalDirection = weightChange > 0 ? 'lose' : weightChange < 0 ? 'gain' : 'maintain';

    const prompt = `You are a nutrition and lifestyle coach. Create a brief daily guidance summary (2-3 paragraphs) for a client with the following profile:

Goal: ${goalDirection} weight (${params.currentWeight} lbs → ${params.targetWeight} lbs)
Activity Level: ${params.activityLevel}
Daily Targets: ${params.dailyCalories} calories | ${params.protein}g protein | ${params.carbs}g carbs | ${params.fat}g fat

Provide practical daily guidance covering:
1. How to structure their day for success (meal timing, hydration, sleep)
2. Key habits to build or maintain
3. How to handle challenges (hunger, cravings, social situations)

Keep it actionable, positive, and realistic. Write in second person ("Focus on...", "Make sure to..."). Be encouraging but honest.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive nutrition and lifestyle coach. Provide practical, evidence-based daily guidance.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate daily guidance at this time.';
  } catch (error) {
    console.error('[OpenAI Service] Error generating daily guidance:', error);

    // Return a friendly fallback message instead of crashing
    if (error instanceof Error && error.message.includes('API key not configured')) {
      return 'AI-powered daily guidance is not currently available. To enable this feature, please configure your OpenAI API key in the app settings.';
    }

    return 'Focus on consistency and tracking your meals to stay accountable. Hit your daily calorie and protein targets, and remember that progress takes time.';
  }
}

/**
 * Generate nutrition guidance using GPT-4o-mini
 */
export async function generateNutritionGuidance(
  params: NutritionGuidanceParams
): Promise<string> {
  try {
    const dietStyleText = params.dietStyle && params.dietStyle !== 'standard'
      ? `Dietary Style: ${params.dietStyle.replace('_', ' ')}`
      : 'No specific dietary restrictions';

    const allergiesText = params.allergies && params.allergies.length > 0
      ? `Allergies: ${params.allergies.join(', ')}`
      : '';

    const cuisinesText = params.favoriteCuisines && params.favoriteCuisines.length > 0
      ? `Favorite Cuisines: ${params.favoriteCuisines.join(', ')}`
      : '';

    const dislikedText = params.dislikedIngredients && params.dislikedIngredients.length > 0
      ? `Foods to Avoid: ${params.dislikedIngredients.join(', ')}`
      : '';

    const fastingText = params.intermittentFasting && params.fastingWindow
      ? `Intermittent Fasting: ${params.fastingWindow.start} - ${params.fastingWindow.end}`
      : '';

    const prompt = `You are a nutrition specialist. Create a detailed nutrition guidance summary (3-4 paragraphs) for a client with the following preferences:

${dietStyleText}
${allergiesText}
${cuisinesText}
${dislikedText}
Cooking Time Preference: ${params.cookingTime || 'flexible'}
Budget Level: ${params.budgetLevel || 'moderate'}
Meals Per Day: ${params.mealsPerDay || 3}
${fastingText}

Provide:
1. How to build meals that align with their preferences and constraints
2. Specific food recommendations and meal ideas
3. Tips for meal prep and planning
4. How to navigate restaurants or social eating

Keep it practical, varied, and enjoyable. Write in second person. Focus on abundance and what they CAN eat, not just restrictions.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a knowledgeable nutrition specialist. Provide practical, enjoyable nutrition guidance that respects preferences and constraints.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate nutrition guidance at this time.';
  } catch (error) {
    console.error('[OpenAI Service] Error generating nutrition guidance:', error);

    // Return a friendly fallback message instead of crashing
    if (error instanceof Error && error.message.includes('API key not configured')) {
      return 'AI-powered nutrition guidance is not currently available. To enable this feature, please configure your OpenAI API key in the app settings.';
    }

    return 'Build your meals around whole foods and consistent meal timing. Focus on hitting your daily macro targets while enjoying foods you love.';
  }
}
