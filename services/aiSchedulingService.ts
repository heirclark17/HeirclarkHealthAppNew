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
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert daily planner AI for a health and fitness app. Your job is to create optimal daily schedules that balance workouts, meals, meetings, and recovery. You understand intermittent fasting, workout recovery, meeting preparation, and work-life balance. Always provide specific times in HH:MM 24-hour format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    const aiResponse: AIScheduleResponse = JSON.parse(responseText);
    console.log('[AI Scheduler] AI reasoning:', aiResponse.reasoning);

    if (aiResponse.warnings && aiResponse.warnings.length > 0) {
      console.warn('[AI Scheduler] AI warnings:', aiResponse.warnings);
    }

    // Convert AI response to TimeBlock format
    const blocks: TimeBlock[] = aiResponse.blocks.map((block, index) => ({
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

  let prompt = `Create an optimal daily schedule for ${dayOfWeek}, ${date}.

**User Preferences:**
- Wake time: ${preferences.wakeTime}
- Sleep time: ${preferences.sleepTime}
- Energy peak: ${preferences.energyPeak || 'morning'}

**Intermittent Fasting:**
${isFasting ? `- Active (eating window: ${lifeContext.fastingEnd} to ${lifeContext.fastingStart})
- ALL meals must be scheduled within this window
- No eating outside this window` : '- Not active today'}
${isCheatDay ? '- **CHEAT DAY**: No fasting restrictions, normal meal times allowed' : ''}

**Recovery Status:**
${recoveryContext ? `- Recovery score: ${recoveryContext.score}/100
- Status: ${recoveryContext.isLowRecovery ? 'LOW RECOVERY - suggest lighter activities, more rest' : 'GOOD - normal intensity OK'}
- Sleep quality: ${recoveryContext.sleepQuality}` : '- Not available'}

**Scheduled Workouts (must include):**
${workoutBlocks.length > 0 ? workoutBlocks.map(w => `- ${w.title} (${w.duration} min, type: ${w.type})`).join('\n') : '- None scheduled'}

**Meals to Schedule (must include):**
${mealBlocks.length > 0 ? mealBlocks.map(m => `- ${m.title} (${m.duration} min)`).join('\n') : '- Breakfast (30 min), Lunch (45 min), Dinner (45 min)'}

**Calendar Events (fixed times):**
${calendarBlocks.length > 0 ? calendarBlocks.map(e => `- ${e.startTime}-${e.endTime}: ${e.title}`).join('\n') : '- No meetings today'}

**Instructions:**
1. Schedule all meals within eating window (if IF active)
2. Add 15-30 min prep time BEFORE workouts (change clothes, commute, warmup)
3. Add 15-20 min recovery time AFTER workouts (shower, cooldown)
4. Add 15 min transition time after calendar meetings
5. Consider meeting prep time (10-15 min before important meetings)
6. Balance work and rest - avoid over-scheduling
7. Respect recovery status (low recovery = easier day)
8. Meals should be evenly spaced (4-6 hours apart if possible)
9. Don't schedule activities too close to sleep time
10. Include buffer times between activities

**Output Format (JSON):**
{
  "reasoning": "Brief explanation of your scheduling decisions",
  "warnings": ["Any concerns or notes about the schedule"],
  "blocks": [
    {
      "type": "sleep|workout|meal_eating|meal_prep|calendar_event|buffer",
      "title": "Activity name",
      "startTime": "HH:MM (24-hour format)",
      "endTime": "HH:MM",
      "duration": minutes (number),
      "notes": "Optional context or reasoning"
    }
  ]
}

**Important:**
- Include sleep block from previous night (${preferences.sleepTime} to ${preferences.wakeTime})
- All times must be in 24-hour format (e.g., "06:30", "14:00", "20:00")
- Duration should match endTime - startTime
- Be realistic about time needed for each activity
- Don't over-pack the schedule - leave breathing room
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
    sleep: '#6B7280',
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
