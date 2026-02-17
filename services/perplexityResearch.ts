import Constants from 'expo-constants';
import { UserTrainingProfile, PerplexityResearchResult } from '../types/training';

/**
 * Perplexity Research Service
 * Uses Perplexity Sonar model to research optimal training approaches
 * based on current exercise science literature
 */

const getPerplexityKey = (): string | null => {
  return Constants.expoConfig?.extra?.perplexityApiKey ||
    process.env.EXPO_PUBLIC_PERPLEXITY_API_KEY ||
    null;
};

/**
 * Research optimal program design for a user profile
 * Returns structured research summary to inject into GPT program generation prompt
 */
export async function researchOptimalProgram(
  profile: UserTrainingProfile
): Promise<PerplexityResearchResult | null> {
  const apiKey = getPerplexityKey();

  if (!apiKey) {
    console.log('[PerplexityResearch] No API key configured, skipping research');
    return null;
  }

  const goalMap: Record<string, string> = {
    'strength': 'maximal strength',
    'hypertrophy': 'muscle hypertrophy (muscle growth)',
    'fat_loss': 'fat loss while preserving muscle',
    'endurance': 'muscular endurance',
    'general_fitness': 'general fitness and health',
    'athletic_performance': 'athletic performance',
  };

  const goal = goalMap[profile.primaryGoal] || profile.primaryGoal;
  const level = profile.fitnessLevel;
  const days = profile.daysPerWeek;
  const duration = profile.sessionDuration;
  const equipment = profile.availableEquipment.join(', ') || profile.equipmentAccess;
  const injuries = profile.injuries?.join(', ') || 'none';
  const years = profile.experience?.yearsTraining || 0;

  const query = `Based on current exercise science research and meta-analyses, what is the optimal training program for someone with these characteristics:

- Goal: ${goal}
- Training experience: ${years} years (${level} level)
- Available days: ${days} days per week
- Session duration: ${duration} minutes
- Equipment: ${equipment}
- Injuries/limitations: ${injuries}

Please provide evidence-based recommendations for:
1. Optimal training split (e.g., PPL, upper/lower, full body)
2. Weekly volume per muscle group (sets per week) based on current research (cite Schoenfeld, Krieger meta-analyses)
3. Rep ranges for their specific goal
4. Periodization approach for their training age
5. Deload frequency based on training experience
6. Exercise selection priorities
7. Any special considerations

Keep the response concise and actionable (300-500 words). Focus on practical recommendations backed by research.`;

  try {
    console.log('[PerplexityResearch] Researching optimal program for', level, goal);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are an exercise science researcher. Provide evidence-based training recommendations citing relevant research when possible. Be concise and practical.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('[PerplexityResearch] API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      console.warn('[PerplexityResearch] Empty response');
      return null;
    }

    console.log('[PerplexityResearch] Research complete, length:', content.length);

    // Parse into structured result
    const result: PerplexityResearchResult = {
      summary: content,
      recommendedSplit: extractSplit(content, days),
      volumeTargets: extractVolumeTargets(content),
      periodizationApproach: extractPeriodization(content, years),
      deloadFrequency: extractDeloadFrequency(content, level),
      specialConsiderations: extractConsiderations(content, injuries),
      researchedAt: new Date().toISOString(),
    };

    return result;

  } catch (error) {
    console.error('[PerplexityResearch] Research failed:', error);
    return null;
  }
}

// ============================================================================
// Parsing helpers - extract structured data from free-text research
// ============================================================================

function extractSplit(content: string, daysPerWeek: number): string {
  const lower = content.toLowerCase();

  if (lower.includes('push/pull/legs') || lower.includes('ppl')) return 'Push/Pull/Legs';
  if (lower.includes('upper/lower') || lower.includes('upper lower')) return 'Upper/Lower';
  if (lower.includes('full body') || lower.includes('full-body')) return 'Full Body';
  if (lower.includes('bro split')) return 'Body Part Split';

  // Default based on days
  if (daysPerWeek <= 3) return 'Full Body';
  if (daysPerWeek === 4) return 'Upper/Lower';
  return 'Push/Pull/Legs';
}

function extractVolumeTargets(content: string): { muscleGroup: string; setsPerWeek: number }[] {
  // Default evidence-based volumes (Schoenfeld 2017 meta-analysis)
  const defaults = [
    { muscleGroup: 'chest', setsPerWeek: 12 },
    { muscleGroup: 'back', setsPerWeek: 14 },
    { muscleGroup: 'shoulders', setsPerWeek: 12 },
    { muscleGroup: 'quads', setsPerWeek: 12 },
    { muscleGroup: 'hamstrings', setsPerWeek: 10 },
    { muscleGroup: 'glutes', setsPerWeek: 10 },
    { muscleGroup: 'biceps', setsPerWeek: 8 },
    { muscleGroup: 'triceps', setsPerWeek: 8 },
    { muscleGroup: 'calves', setsPerWeek: 8 },
    { muscleGroup: 'core', setsPerWeek: 6 },
  ];

  // Try to extract numbers from content
  const numberPattern = /(\d+)[\s-]*(?:to|-)[\s-]*(\d+)\s*sets?\s*(?:per\s*week|weekly)/gi;
  const matches = Array.from(content.matchAll(numberPattern));

  if (matches.length > 0) {
    // Use the average of found ranges as a scaling factor
    const avgSets = matches.reduce((sum, m) => {
      const low = parseInt(m[1]);
      const high = parseInt(m[2]);
      return sum + (low + high) / 2;
    }, 0) / matches.length;

    // Scale defaults based on research findings
    const scaleFactor = avgSets / 12;
    return defaults.map(d => ({
      ...d,
      setsPerWeek: Math.round(d.setsPerWeek * scaleFactor),
    }));
  }

  return defaults;
}

function extractPeriodization(content: string, yearsTraining: number): string {
  const lower = content.toLowerCase();

  if (lower.includes('linear periodization')) return 'Linear Periodization';
  if (lower.includes('undulating') || lower.includes('dup')) return 'Daily Undulating Periodization';
  if (lower.includes('block periodization')) return 'Block Periodization';
  if (lower.includes('conjugate')) return 'Conjugate';

  // Default based on experience
  if (yearsTraining < 1) return 'Linear Periodization';
  if (yearsTraining < 3) return 'Daily Undulating Periodization';
  return 'Block Periodization';
}

function extractDeloadFrequency(content: string, level: string): number {
  // Try to find deload frequency in text
  const deloadMatch = content.match(/deload\s*(?:every)?\s*(\d+)\s*weeks?/i);
  if (deloadMatch) return parseInt(deloadMatch[1]);

  // Defaults based on level
  if (level === 'beginner') return 6;
  if (level === 'intermediate') return 4;
  return 3;
}

function extractConsiderations(content: string, injuries: string): string[] {
  const considerations: string[] = [];

  if (injuries && injuries !== 'none') {
    considerations.push(`Modify exercises around: ${injuries}`);
  }

  const lower = content.toLowerCase();
  if (lower.includes('recovery')) considerations.push('Prioritize recovery between sessions');
  if (lower.includes('nutrition') || lower.includes('protein')) considerations.push('Ensure adequate protein intake for goal');
  if (lower.includes('sleep')) considerations.push('Adequate sleep (7-9 hours) critical for adaptation');
  if (lower.includes('warm')) considerations.push('Include proper warm-up before heavy compound lifts');

  return considerations.length > 0 ? considerations : ['Follow progressive overload principles'];
}
