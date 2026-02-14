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
  selectedProgram?: {
    name: string;
    description: string;
    difficulty: string;
    duration: number;
    daysPerWeek: number;
    focus: string[];
  };
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
    const programInfo = params.selectedProgram
      ? `Selected Training Program: ${params.selectedProgram.name}
Program Description: ${params.selectedProgram.description}
Program Duration: ${params.selectedProgram.duration} weeks
Difficulty Level: ${params.selectedProgram.difficulty}
Focus Areas: ${params.selectedProgram.focus.join(', ')}
`
      : '';

    const prompt = `You are a professional fitness coach. Create a detailed, personalized workout guidance summary (3-4 paragraphs) for a client with the following profile:

Goal: ${params.primaryGoal.replace('_', ' ')}
Training Frequency: ${params.workoutsPerWeek} days per week
Session Duration: ${params.workoutDuration} minutes
Fitness Level: ${params.activityLevel}
Equipment Access: ${params.equipmentAccess.join(', ') || 'Bodyweight only'}
${params.injuries ? `Injuries/Limitations: ${params.injuries}` : ''}
${programInfo}
${params.selectedProgram ? `IMPORTANT: This client has selected the "${params.selectedProgram.name}" program. Tailor your guidance specifically to this program's focus areas and difficulty level. Reference the program by name and explain how it aligns with their goals.` : ''}

Provide:
1. ${params.selectedProgram ? `How the ${params.selectedProgram.name} aligns with their ${params.primaryGoal.replace('_', ' ')} goal` : 'An overview of the recommended training approach and split'}
2. Specific exercises or movement patterns they should focus on${params.selectedProgram ? ' within this program' : ''}
3. Progressive overload strategy (how to advance over time)
4. Recovery recommendations

Keep it motivating, practical, and specific to their goals${params.selectedProgram ? ' and chosen program' : ' and constraints'}. Write in second person ("you should..."). Be concise but comprehensive.`;

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

export interface RestaurantDishParams {
  cuisine: string;
  dishType?: string; // 'appetizer', 'entree', 'dessert', 'beverage'
  dailyCalories: number;
  remainingCalories: number;
  dailyProtein: number;
  remainingProtein: number;
  dailyCarbs: number;
  remainingCarbs: number;
  dailyFat: number;
  remainingFat: number;
  primaryGoal: string; // 'lose_weight', 'build_muscle', 'maintain'
  allergies?: string[];
  dietaryPreferences?: string[]; // 'vegetarian', 'vegan', 'keto', etc.
}

/**
 * Generate detailed restaurant dish recommendations with accountability-focused AI guidance
 */
export async function generateRestaurantDishGuidance(
  params: RestaurantDishParams
): Promise<string> {
  try {
    const percentRemaining = (params.remainingCalories / params.dailyCalories) * 100;
    const budgetStatus = percentRemaining >= 50 ? 'comfortable' : percentRemaining >= 25 ? 'moderate' : 'tight';

    const prompt = `You are a nutrition specialist and accountability coach helping someone make smart dining-out choices. Provide DETAILED, ACTIONABLE guidance for ordering at a ${params.cuisine} restaurant.

CLIENT PROFILE & DAILY TARGETS:
- Primary Goal: ${params.primaryGoal.replace('_', ' ')}
- Daily Calorie Target: ${params.dailyCalories} cal
- Remaining Budget: ${params.remainingCalories} cal (${percentRemaining.toFixed(0)}% remaining - ${budgetStatus} budget)
- Daily Protein: ${params.dailyProtein}g (${params.remainingProtein}g remaining)
- Daily Carbs: ${params.dailyCarbs}g (${params.remainingCarbs}g remaining)
- Daily Fat: ${params.dailyFat}g (${params.remainingFat}g remaining)
${params.allergies && params.allergies.length > 0 ? `- Allergies: ${params.allergies.join(', ')}` : ''}
${params.dietaryPreferences && params.dietaryPreferences.length > 0 ? `- Dietary Preferences: ${params.dietaryPreferences.join(', ')}` : ''}
${params.dishType ? `- Looking for: ${params.dishType}` : ''}

PROVIDE DETAILED GUIDANCE IN 4-5 PARAGRAPHS:

1. ACCOUNTABILITY CHECK-IN (1-2 sentences): Address their current calorie budget status directly. If budget is tight (<30% remaining), acknowledge the challenge and pivot to smarter choices. If comfortable (>50%), encourage enjoying the meal while staying mindful.

2. BEST DISHES TO ORDER (detailed paragraph): List 3-5 specific dishes common at ${params.cuisine} restaurants that FIT their macro budget. For EACH dish, include:
   - Estimated calories and macros
   - WHY it aligns with their ${params.primaryGoal.replace('_', ' ')} goal
   - Specific protein/veggie/sauce components

3. SMART MODIFICATIONS (detailed paragraph): Provide 5-7 SPECIFIC modification requests they can make to ANY dish:
   - "Ask for sauce on the side"
   - "Request grilled instead of fried"
   - "Substitute rice with extra vegetables"
   - "Ask for no cheese or light cheese"
   - Include calorie savings for each modification (e.g., "saves ~200 calories")

4. WHAT TO AVOID (direct paragraph): List 3-5 common ${params.cuisine} dishes that will BLOW their budget. Be specific about why (e.g., "General Tso's Chicken: typically 1,200+ calories with deep-fried chicken and sugary sauce").

5. PRACTICAL ORDERING STRATEGY (action-focused): Give 3-4 tactical tips:
   - When to order appetizers vs skip them
   - Portion control strategies (ask for to-go box immediately, split entree, etc.)
   - Beverage recommendations (save calories here!)
   - How to handle sides/extras

Be HONEST, DIRECT, and PRACTICAL. Use actual dish names from ${params.cuisine} cuisine. Focus on ACCOUNTABILITY - help them stay on track while still enjoying eating out. Make recommendations feel achievable, not restrictive.`;

    console.log('[OpenAI Service] Generating restaurant dish guidance for:', params.cuisine);

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition specialist and accountability coach. Provide detailed, practical restaurant guidance that helps people stay on track with their goals while enjoying dining out. Be specific, honest, and actionable.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800, // More tokens for detailed guidance
    });

    return completion.choices[0]?.message?.content || 'Unable to generate restaurant guidance at this time.';
  } catch (error) {
    console.error('[OpenAI Service] Error generating restaurant dish guidance:', error);

    // Return a friendly fallback message
    if (error instanceof Error && error.message.includes('API key not configured')) {
      return 'AI-powered restaurant guidance is not currently available. To enable this feature, please configure your OpenAI API key in the app settings.';
    }

    return `When dining at ${params.cuisine} restaurants, focus on grilled proteins, vegetables, and requesting sauces on the side. Ask your server about portion sizes and consider sharing dishes. You have ${params.remainingCalories} calories remaining today, so choose mindfully.`;
  }
}
