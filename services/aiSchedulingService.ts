/**
 * AI-Powered Scheduling Service
 * Uses GPT to intelligently create daily timelines
 */

import OpenAI from 'openai';
import Constants from 'expo-constants';
import { TimeBlock, PlannerPreferences, SchedulingRequest, DailyTimeline } from '../types/planner';

const apiKey = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
});

interface AIScheduleResponse {
  blocks: Array<{
    type: string;
    title: string;
    startTime: string;
    endTime: string;
    duration: number;
    status?: string;
    color?: string;
    icon?: string;
    priority?: number;
    flexibility?: number;
    notes?: string;
  }>;
  reasoning?: string;
  warnings?: string[];
}

/**
 * Generate daily timeline using AI
 */
export async function generateAISchedule(request: SchedulingRequest): Promise<DailyTimeline> {
  console.log('[AI Scheduler] Generating timeline for', request.date);

  try {
    // Build context for AI
    const prompt = buildSchedulingPrompt(request);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You schedule workouts and meals around calendar events. Use 24-hour format. If fasting is active, meals must be within the eating window.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,  // Lower = faster, more consistent
      max_tokens: 1200,  // Increased from 800 - need room for full schedule + reasoning
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    console.log('[AI Scheduler] Response length:', responseText.length, 'chars');

    // Parse AI response with better error handling
    let aiResponse: AIScheduleResponse;
    try {
      aiResponse = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error('[AI Scheduler] JSON parse error:', parseError.message);
      console.error('[AI Scheduler] Partial response:', responseText.substring(0, 500));
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }
    console.log('[AI Scheduler] AI reasoning:', aiResponse.reasoning);

    if (aiResponse.warnings && aiResponse.warnings.length > 0) {
      console.warn('[AI Scheduler] AI warnings:', aiResponse.warnings);
    }

    // Log all generated blocks before validation
    console.log('[AI Scheduler] Generated blocks BEFORE validation:');
    aiResponse.blocks.forEach(block => {
      console.log(`  ${block.type}: ${block.title} | ${block.startTime}-${block.endTime}`);
    });

    // Convert AI response to TimeBlock format
    let blocks: TimeBlock[] = aiResponse.blocks.map((block, index) => ({
      id: `ai-block-${Date.now()}-${index}`,
      type: block.type as any,
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
      duration: block.duration,
      status: (block.status || 'scheduled') as any,
      color: block.color || getDefaultColor(block.type),
      icon: block.icon || getDefaultIcon(block.type),
      priority: block.priority || 2,
      flexibility: block.flexibility || 0.5,
      aiGenerated: true,
      ...(block.notes && { notes: block.notes }),
    }));

    // VALIDATION: Filter out meals outside eating window if fasting active
    if (request.lifeContext?.isFasting && !request.lifeContext?.isCheatDay) {
      const fastingEnd = request.lifeContext.fastingEnd;
      const fastingStart = request.lifeContext.fastingStart;

      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const eatingWindowStart = timeToMinutes(fastingEnd);
      const eatingWindowEnd = timeToMinutes(fastingStart);

      const originalCount = blocks.length;
      blocks = blocks.filter(block => {
        if (block.type !== 'meal_eating') return true; // Keep non-meal blocks

        const blockStart = timeToMinutes(block.startTime);
        const blockEnd = timeToMinutes(block.endTime);

        const isValid = blockStart >= eatingWindowStart && blockEnd <= eatingWindowEnd;

        if (!isValid) {
          console.warn(`[AI Scheduler] ❌ REMOVED meal outside eating window: ${block.title} at ${block.startTime}-${block.endTime} (window: ${fastingEnd}-${fastingStart})`);
        }

        return isValid;
      });

      if (blocks.length < originalCount) {
        console.warn(`[AI Scheduler] Filtered out ${originalCount - blocks.length} meals outside eating window`);
      }
    }

    // VALIDATION: Detect conflicts between blocks
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const detectConflicts = (blocks: TimeBlock[]) => {
      const conflicts: string[] = [];
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          const block1 = blocks[i];
          const block2 = blocks[j];

          // Skip all-day events
          if (block1.isAllDay || block2.isAllDay) continue;

          const start1 = timeToMinutes(block1.startTime);
          const end1 = timeToMinutes(block1.endTime);
          const start2 = timeToMinutes(block2.startTime);
          const end2 = timeToMinutes(block2.endTime);

          // Check for overlap
          const overlap = (start1 < end2 && end1 > start2) || (start2 < end1 && end2 > start1);

          if (overlap) {
            conflicts.push(
              `❌ CONFLICT: "${block1.title}" (${block1.startTime}-${block1.endTime}) overlaps with "${block2.title}" (${block2.startTime}-${block2.endTime})`
            );
          }
        }
      }
      return conflicts;
    };

    const conflicts = detectConflicts(blocks);
    if (conflicts.length > 0) {
      console.error('[AI Scheduler] 🚨 CONFLICTS DETECTED:');
      conflicts.forEach(conflict => console.error(`  ${conflict}`));
      console.error('[AI Scheduler] ⚠️  AI generated conflicting blocks - this should not happen!');
    }

    // Log final blocks after all validation
    console.log('[AI Scheduler] Final blocks AFTER validation:');
    blocks.forEach(block => {
      console.log(`  ${block.type}: ${block.title} | ${block.startTime}-${block.endTime}`);
    });

    // Calculate stats
    const stats = calculateStats(blocks, request.preferences);

    // Build timeline
    const timeline: DailyTimeline = {
      date: request.date,
      blocks,
      completionRate: 0,
      totalScheduledMinutes: stats.totalScheduledMinutes,
      totalFreeMinutes: stats.totalFreeMinutes,
      aiGenerated: true,
    };

    console.log('[AI Scheduler] ✅ Generated timeline with', blocks.length, 'blocks');
    return timeline;
  } catch (error: any) {
    console.error('[AI Scheduler] Error:', error);
    throw new Error(`AI scheduling failed: ${error.message}`);
  }
}

/**
 * Build comprehensive prompt for AI scheduler
 */
function buildSchedulingPrompt(request: SchedulingRequest): string {
  const { date, preferences, workoutBlocks, mealBlocks, calendarBlocks, lifeContext, recoveryContext } = request;

  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  const isFasting = lifeContext?.isFasting && !lifeContext?.isCheatDay;
  const isCheatDay = lifeContext?.isCheatDay;

  let prompt = `Schedule workouts and meals for ${dayOfWeek}, ${date}.

**Sleep Schedule:**
- Sleep: ${preferences.sleepTime} to ${preferences.wakeTime}

**Intermittent Fasting:**
${isFasting ? `- 🚨 FASTING ACTIVE - STRICT RULES:
  - YOU CAN ONLY SCHEDULE MEALS BETWEEN ${lifeContext.fastingEnd} AND ${lifeContext.fastingStart}
  - BEFORE ${lifeContext.fastingEnd} = FASTING (NO MEALS ALLOWED)
  - AFTER ${lifeContext.fastingStart} = FASTING (NO MEALS ALLOWED)
  - Example: If window is 12:00-20:00, you can schedule meals at 12:30, 15:00, 19:00
  - Example: If window is 12:00-20:00, you CANNOT schedule meals at 08:00, 10:00, 21:00, 22:00` : '- Not active'}
${isCheatDay ? '- CHEAT DAY: No fasting restrictions' : ''}

**Workouts to Schedule:**
${workoutBlocks.length > 0 ? workoutBlocks.map(w => `- ${w.title} (${w.duration} min)`).join('\n') : '- None'}

**Meals to Schedule:**
${mealBlocks.length > 0 ? mealBlocks.map(m => `- ${m.title} (${m.duration} min)`).join('\n') : '- Breakfast (30 min), Lunch (45 min), Dinner (45 min)'}

**Calendar Events (DO NOT SCHEDULE OVER THESE):**
${calendarBlocks.length > 0 ? calendarBlocks.map(e => `- ${e.startTime}-${e.endTime}: ${e.title}`).join('\n') : '- None'}

**CRITICAL SCHEDULING RULES:**
1. Include sleep block from ${preferences.sleepTime} to ${preferences.wakeTime}
2. 🚨 IF FASTING: ALL meals MUST be between ${isFasting ? lifeContext.fastingEnd : 'N/A'} and ${isFasting ? lifeContext.fastingStart : 'N/A'}
3. 🚨 NEVER overlap workouts with meals - they must be completely separate time blocks
4. 🚨 NEVER overlap workouts/meals with calendar events
5. 🚨 Leave at least 15 minutes between consecutive blocks (workout→meal, meal→workout, etc.)
6. Schedule workouts BEFORE or AFTER meals, never during
7. If fasting is active, schedule workouts outside eating window when possible

**Scheduling Strategy:**
- Find all occupied time slots (calendar events + sleep)
- Identify free time windows
- Place workouts in free windows (avoiding fasting eating time if possible)
- Place meals in free windows that are within eating window (if fasting)
- Ensure no overlaps between any blocks

**Output (JSON):**
{
  "blocks": [
    {
      "type": "sleep|workout|meal_eating",
      "title": "Sleep|Activity name",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "duration": minutes
    }
  ]
}
`;

  return prompt;
}

/**
 * Calculate daily stats
 */
function calculateStats(
  blocks: TimeBlock[],
  preferences: PlannerPreferences
): {
  totalScheduledMinutes: number;
  totalFreeMinutes: number;
} {
  const wakeMinutes = timeToMinutes(preferences.wakeTime);
  const sleepMinutes = timeToMinutes(preferences.sleepTime);
  const awakeMinutes = sleepMinutes > wakeMinutes
    ? sleepMinutes - wakeMinutes
    : (24 * 60) - wakeMinutes + sleepMinutes;

  const totalScheduledMinutes = blocks
    .filter(b => b.type !== 'sleep' && !b.isAllDay)
    .reduce((sum, b) => sum + b.duration, 0);

  const totalFreeMinutes = awakeMinutes - totalScheduledMinutes;

  return {
    totalScheduledMinutes,
    totalFreeMinutes: Math.max(0, totalFreeMinutes),
  };
}

/**
 * Helper functions
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getDefaultColor(type: string): string {
  const colors: Record<string, string> = {
    sleep: '#9333EA40', // Transparent purple
    workout: '#EF4444',
    meal_eating: '#10B981',
    meal_prep: '#059669',
    calendar_event: '#3B82F6',
    buffer: '#9CA3AF',
  };
  return colors[type] || '#6B7280';
}

function getDefaultIcon(type: string): string {
  const icons: Record<string, string> = {
    sleep: 'moon',
    workout: 'dumbbell',
    meal_eating: 'utensils',
    meal_prep: 'chef-hat',
    calendar_event: 'calendar',
    buffer: 'clock',
  };
  return icons[type] || 'circle';
}
