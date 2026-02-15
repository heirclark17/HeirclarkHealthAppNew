// Progressive Overload AI Service
// Uses GPT-4.1-mini for intelligent training recommendations

import OpenAI from 'openai';
import Constants from 'expo-constants';
import {
  AISetRecommendation,
  AIWeeklyAnalysis,
  UserProgressionProfile,
  ProgressiveOverloadEntry,
  MuscleGroup,
  OverloadStatus,
} from '../types/training';

// Lazy-load OpenAI client (same pattern as openaiService.ts)
let openaiClient: OpenAI | null = null;

const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    const apiKey =
      Constants.expoConfig?.extra?.openaiApiKey ||
      process.env.EXPO_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.'
      );
    }

    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  return openaiClient;
};

// ============================================================================
// Local Utility (No AI needed)
// ============================================================================

/** Calculate smart weight suggestion based on last session performance */
export function calculateSmartWeight(
  lastSessionSets: { weight: number; reps: number; rpe?: number }[],
  targetRepRange: [number, number],
  incrementSize: number
): { suggestedWeight: number; suggestedReps: number; reasoning: string } {
  if (lastSessionSets.length === 0) {
    return { suggestedWeight: 0, suggestedReps: targetRepRange[0], reasoning: 'No previous data' };
  }

  const avgReps = lastSessionSets.reduce((s, set) => s + set.reps, 0) / lastSessionSets.length;
  const maxWeight = Math.max(...lastSessionSets.map(s => s.weight));
  const avgRPE = lastSessionSets.filter(s => s.rpe).length > 0
    ? lastSessionSets.filter(s => s.rpe).reduce((s, set) => s + (set.rpe || 0), 0) / lastSessionSets.filter(s => s.rpe).length
    : 7;

  const [minReps, maxReps] = targetRepRange;

  // Decision tree
  if (avgReps >= maxReps && avgRPE <= 8) {
    // Hit top of range with manageable effort -> increase weight
    return {
      suggestedWeight: maxWeight + incrementSize,
      suggestedReps: minReps,
      reasoning: `Hit ${Math.round(avgReps)} reps at RPE ${avgRPE.toFixed(1)}. Ready to increase weight and reset reps.`,
    };
  } else if (avgReps >= minReps && avgReps < maxReps) {
    // In range -> keep weight, aim for more reps
    return {
      suggestedWeight: maxWeight,
      suggestedReps: Math.min(Math.round(avgReps) + 1, maxReps),
      reasoning: `At ${Math.round(avgReps)} reps. Add 1 rep before increasing weight.`,
    };
  } else if (avgReps < minReps) {
    // Below range -> reduce weight
    return {
      suggestedWeight: Math.max(maxWeight - incrementSize, incrementSize),
      suggestedReps: Math.round((minReps + maxReps) / 2),
      reasoning: `Only hit ${Math.round(avgReps)} reps. Reduce weight to build back up.`,
    };
  } else if (avgRPE >= 9.5) {
    // RPE too high -> keep weight, maybe deload
    return {
      suggestedWeight: maxWeight,
      suggestedReps: Math.round(avgReps),
      reasoning: `RPE ${avgRPE.toFixed(1)} is very high. Maintain weight and focus on recovery.`,
    };
  }

  return {
    suggestedWeight: maxWeight,
    suggestedReps: Math.round(avgReps),
    reasoning: 'Maintain current load and focus on quality reps.',
  };
}

// ============================================================================
// AI-Powered Functions
// ============================================================================

/** Generate AI set recommendations for next session */
export async function generateSetRecommendations(
  exerciseName: string,
  previousSessions: ProgressiveOverloadEntry[],
  userProfile: UserProgressionProfile,
  goal: string = 'hypertrophy'
): Promise<AISetRecommendation | null> {
  try {
    const sessionHistory = previousSessions
      .slice(-4)
      .map(
        (s) =>
          `Week ${s.weekNumber}: ${s.totalSets} sets, ${s.totalReps} total reps, max ${s.maxWeight}lb, volume ${s.totalVolume}lb, e1RM ${s.estimated1RM}lb, status: ${s.overloadStatus}`
      )
      .join('\n');

    const repRange = userProfile.repRanges[goal as keyof typeof userProfile.repRanges] || [8, 12];

    const prompt = `You are an elite strength coach. Analyze this exercise history and provide the optimal set/rep/weight plan for next session.

Exercise: ${exerciseName}
Goal: ${goal}
Target rep range: ${repRange[0]}-${repRange[1]}
Progression model: ${userProfile.progressionModel}
Fitness level: ${userProfile.fitnessLevel}
Weight increment: ${userProfile.weightIncrements.upper}lb upper / ${userProfile.weightIncrements.lower}lb lower
Target RPE: ${userProfile.targetRPE}

Recent history:
${sessionHistory || 'No previous data'}

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "sets": [
    {"setNumber": 1, "targetWeight": <number>, "targetReps": <number>, "isWarmup": <boolean>, "notes": "<string>"}
  ],
  "reasoning": "<1-2 sentence explanation>",
  "confidence": "high" | "medium" | "low",
  "progressionStrategy": "<brief strategy name>"
}

Include 1-2 warmup sets and 3-4 working sets.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a strength training AI coach. Respond only with valid JSON. No markdown fences.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      exerciseId: '',
      exerciseName,
      sets: parsed.sets,
      reasoning: parsed.reasoning,
      confidence: parsed.confidence || 'medium',
      progressionStrategy: parsed.progressionStrategy || 'progressive overload',
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[ProgressiveOverloadAI] Error generating set recommendations:', error);

    // Fallback to local calculation
    const lastSession = previousSessions[previousSessions.length - 1];
    if (lastSession) {
      const repRange = userProfile.repRanges.hypertrophy;
      const smart = calculateSmartWeight(
        [{ weight: lastSession.maxWeight, reps: Math.round(lastSession.totalReps / lastSession.totalSets) }],
        repRange,
        userProfile.weightIncrements.upper
      );
      return {
        exerciseId: '',
        exerciseName,
        sets: [
          { setNumber: 1, targetWeight: Math.round(smart.suggestedWeight * 0.5), targetReps: 10, isWarmup: true, notes: 'Warmup' },
          { setNumber: 2, targetWeight: Math.round(smart.suggestedWeight * 0.75), targetReps: 8, isWarmup: true, notes: 'Warmup' },
          { setNumber: 3, targetWeight: smart.suggestedWeight, targetReps: smart.suggestedReps, isWarmup: false },
          { setNumber: 4, targetWeight: smart.suggestedWeight, targetReps: smart.suggestedReps, isWarmup: false },
          { setNumber: 5, targetWeight: smart.suggestedWeight, targetReps: smart.suggestedReps, isWarmup: false },
        ],
        reasoning: smart.reasoning,
        confidence: 'medium',
        progressionStrategy: 'Local fallback (AI unavailable)',
        generatedAt: new Date().toISOString(),
      };
    }
    return null;
  }
}

/** Generate comprehensive AI weekly analysis */
export async function generateWeeklyAnalysis(
  weeklyData: ProgressiveOverloadEntry[],
  previousWeeks: ProgressiveOverloadEntry[][],
  userProfile: UserProgressionProfile,
  muscleVolumes: { muscleGroup: MuscleGroup; weeklySets: number }[]
): Promise<AIWeeklyAnalysis | null> {
  try {
    const exerciseSummary = weeklyData
      .map(
        (e) =>
          `- ${e.exerciseName}: ${e.totalSets} sets, ${e.totalReps} reps, vol ${e.totalVolume}lb, e1RM ${e.estimated1RM}lb, change ${e.volumeChangePercent}%, status: ${e.overloadStatus}`
      )
      .join('\n');

    const volumeSummary = muscleVolumes
      .filter((v) => v.weeklySets > 0)
      .map((v) => `- ${v.muscleGroup}: ${v.weeklySets} sets (MEV: 10, MRV: 20)`)
      .join('\n');

    const prompt = `You are an elite strength & conditioning coach providing a weekly training analysis.

This week's exercises:
${exerciseSummary || 'No exercises logged this week'}

Muscle group volume this week:
${volumeSummary || 'No volume data'}

User profile: ${userProfile.fitnessLevel} level, ${userProfile.progressionModel} progression

Respond ONLY with valid JSON (no markdown):
{
  "overallScore": <0-100>,
  "headline": "<one compelling sentence>",
  "exerciseAnalyses": [
    {
      "exerciseId": "",
      "exerciseName": "<name>",
      "status": "progressing" | "maintaining" | "stalling" | "regressing" | "new_exercise" | "pr_set",
      "volumeChange": <number>,
      "strengthChange": <number>,
      "recommendation": "<1 sentence>"
    }
  ],
  "muscleVolumeAudit": [
    {
      "muscleGroup": "<group>",
      "weeklySets": <number>,
      "mev": 10,
      "mrv": 20,
      "status": "under" | "optimal" | "over"
    }
  ],
  "recoveryAssessment": "<1-2 sentences>",
  "nutritionNote": "<1 sentence>",
  "achievements": ["<achievement strings>"]
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a training analysis AI. Respond only with valid JSON. Be specific and actionable.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      weekNumber: weeklyData[0]?.weekNumber || 0,
      weekStartDate: weeklyData[0]?.weekStartDate || new Date().toISOString().split('T')[0],
      overallScore: parsed.overallScore || 50,
      headline: parsed.headline || 'Keep pushing forward!',
      exerciseAnalyses: parsed.exerciseAnalyses || [],
      muscleVolumeAudit: parsed.muscleVolumeAudit || [],
      recoveryAssessment: parsed.recoveryAssessment || 'Monitor your sleep and nutrition for optimal recovery.',
      nutritionNote: parsed.nutritionNote || 'Ensure adequate protein intake to support muscle growth.',
      achievements: parsed.achievements || [],
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[ProgressiveOverloadAI] Error generating weekly analysis:', error);
    return null;
  }
}

/** Generate plateau-breaking strategies */
export async function generatePlateauBreaker(
  exerciseName: string,
  stalledData: ProgressiveOverloadEntry[],
  userProfile: UserProgressionProfile,
  goal: string = 'hypertrophy'
): Promise<{
  diagnosis: string;
  strategies: { name: string; description: string; duration: string; isRecommended: boolean }[];
} | null> {
  try {
    const history = stalledData
      .map(
        (s) =>
          `Week ${s.weekNumber}: ${s.totalSets}×${Math.round(s.totalReps / s.totalSets)} @ ${s.maxWeight}lb, vol ${s.totalVolume}lb, e1RM ${s.estimated1RM}lb`
      )
      .join('\n');

    const prompt = `You are a plateau-breaking specialist. This lifter is stalled on ${exerciseName}.

Stall history (last ${stalledData.length} weeks):
${history}

Goal: ${goal}
Level: ${userProfile.fitnessLevel}
Progression: ${userProfile.progressionModel}

Respond ONLY with valid JSON:
{
  "diagnosis": "<1-2 sentence root cause>",
  "strategies": [
    {
      "name": "<strategy name>",
      "description": "<2-3 sentence how-to>",
      "duration": "<e.g. 2 weeks>",
      "isRecommended": <boolean>
    }
  ]
}

Provide exactly 3 strategies. Mark exactly one as recommended.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a plateau-breaking specialist. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch (error) {
    console.error('[ProgressiveOverloadAI] Error generating plateau breaker:', error);
    return {
      diagnosis: 'Unable to analyze plateau. Try these general strategies.',
      strategies: [
        {
          name: 'Deload Week',
          description: 'Reduce volume by 40% and intensity by 10% for one week. This allows accumulated fatigue to dissipate and primes your body for new adaptation.',
          duration: '1 week',
          isRecommended: true,
        },
        {
          name: 'Rep Range Shift',
          description: 'If training 8-12 reps, switch to 5-8 for 2-3 weeks to build strength, then return. The new strength base will allow higher volume at previous weights.',
          duration: '2-3 weeks',
          isRecommended: false,
        },
        {
          name: 'Exercise Variation',
          description: 'Swap to a close variation for 3-4 weeks. For example, switch from barbell bench to dumbbell bench or incline press to develop weak points.',
          duration: '3-4 weeks',
          isRecommended: false,
        },
      ],
    };
  }
}
