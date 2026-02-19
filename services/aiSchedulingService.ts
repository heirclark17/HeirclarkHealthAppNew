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

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "13:30", "07:00")
 * @returns Time in 12-hour format (e.g., "1:30 PM", "7:00 AM")
 */
function to12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

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
          content: 'You schedule workouts and meals around calendar events. Use 24-hour format. IMPORTANT: Meals have STRICT TIME WINDOWS - Breakfast: 05:00-10:59 (target 08:00), Lunch: 11:00-14:00 (target 12:00), Dinner: 17:00-22:00 (target 18:30). Schedule each meal type WITHIN its designated window. DO NOT schedule breakfast after 11 AM, lunch outside 11 AM-2 PM, or dinner outside 5 PM-10 PM. If fasting is active, meals must ALSO be within the eating window.',
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
      const timeRange = `${to12Hour(block.startTime)}-${to12Hour(block.endTime)}`;
      console.log(`  ${block.type}: ${block.title} | ${timeRange}`);
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

    // VALIDATION: Fix meals outside eating window if fasting active
    // Instead of just removing them, reschedule within the eating window
    if (request.lifeContext?.isFasting && !request.lifeContext?.isCheatDay) {
      const fastingEnd = request.lifeContext.fastingEnd;
      const fastingStart = request.lifeContext.fastingStart;

      const timeToMin = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const minToTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      const eatingWindowStart = timeToMin(fastingEnd);
      const eatingWindowEnd = timeToMin(fastingStart);

      blocks = blocks.map(block => {
        if (block.type !== 'meal_eating') return block;

        const blockStart = timeToMin(block.startTime);
        const blockEnd = timeToMin(block.endTime);
        const duration = block.duration || (blockEnd - blockStart);

        const isValid = blockStart >= eatingWindowStart && blockEnd <= eatingWindowEnd;

        if (!isValid) {
          const blockTime = `${to12Hour(block.startTime)}-${to12Hour(block.endTime)}`;
          const windowTime = `${to12Hour(fastingEnd)}-${to12Hour(fastingStart)}`;
          console.warn(`[AI Scheduler] ⚠️ RESCHEDULING meal outside eating window: ${block.title} at ${blockTime} (window: ${windowTime})`);

          // Reschedule within eating window based on meal type
          const title = block.title.toLowerCase();
          let newStart: number;
          if (title.includes('breakfast')) {
            newStart = eatingWindowStart; // First meal at window open
          } else if (title.includes('lunch')) {
            newStart = Math.round((eatingWindowStart + eatingWindowEnd) / 2) - Math.round(duration / 2); // Middle
          } else if (title.includes('dinner')) {
            newStart = eatingWindowEnd - duration - 15; // Near window close
          } else {
            newStart = eatingWindowStart + 60; // Snack shortly after window opens
          }

          // Clamp to eating window
          newStart = Math.max(newStart, eatingWindowStart);
          newStart = Math.min(newStart, eatingWindowEnd - duration);

          console.log(`[AI Scheduler] ✅ Rescheduled "${block.title}" to ${to12Hour(minToTime(newStart))}-${to12Hour(minToTime(newStart + duration))}`);

          return {
            ...block,
            startTime: minToTime(newStart),
            endTime: minToTime(newStart + duration),
            duration,
          };
        }

        return block;
      });
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
            const time1 = `${to12Hour(block1.startTime)}-${to12Hour(block1.endTime)}`;
            const time2 = `${to12Hour(block2.startTime)}-${to12Hour(block2.endTime)}`;
            conflicts.push(
              `❌ CONFLICT: "${block1.title}" (${time1}) overlaps with "${block2.title}" (${time2})`
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

    // VERIFICATION: Ensure AI included all input meals in its response
    const aiMealBlocks = blocks.filter(b => b.type === 'meal_eating');
    const inputMealTypes = request.mealBlocks.map(m => {
      const t = m.title.toLowerCase();
      if (t.includes('breakfast')) return 'breakfast';
      if (t.includes('lunch')) return 'lunch';
      if (t.includes('dinner')) return 'dinner';
      return 'snack';
    });

    for (const inputMeal of request.mealBlocks) {
      const inputTitle = inputMeal.title.toLowerCase();
      const found = aiMealBlocks.some(ab => {
        const abTitle = ab.title.toLowerCase();
        if (inputTitle.includes('breakfast') && abTitle.includes('breakfast')) return true;
        if (inputTitle.includes('lunch') && abTitle.includes('lunch')) return true;
        if (inputTitle.includes('dinner') && abTitle.includes('dinner')) return true;
        return abTitle === inputTitle || abTitle.includes(inputTitle) || inputTitle.includes(abTitle);
      });

      if (!found) {
        console.warn(`[AI Scheduler] ⚠️ AI OMITTED meal: "${inputMeal.title}" – adding it back`);
        // Add the missing meal at a conflict-free time.
        // FIX (Bug 4): Scan for an available slot rather than blindly using a
        // fixed target time, preventing overlap with already-placed AI blocks.
        const duration = inputMeal.duration || 30;
        const wakeMin = timeToMinutes(request.preferences.wakeTime);
        const sleepMin = timeToMinutes(request.preferences.sleepTime);
        let targetMin: number;
        let rangeStart = wakeMin;
        let rangeEnd = sleepMin > wakeMin ? sleepMin : wakeMin + 960;

        if (inputTitle.includes('breakfast')) targetMin = wakeMin + 30;
        else if (inputTitle.includes('lunch')) targetMin = Math.round((wakeMin + sleepMin) / 2);
        else if (inputTitle.includes('dinner')) targetMin = sleepMin - 90;
        else targetMin = Math.round((wakeMin + sleepMin) / 2) + 60;

        // Apply eating window constraint if fasting
        if (request.lifeContext?.isFasting && !request.lifeContext?.isCheatDay) {
          const ewStart = timeToMinutes(request.lifeContext.fastingEnd);
          const ewEnd = timeToMinutes(request.lifeContext.fastingStart);
          rangeStart = ewStart;
          rangeEnd = ewEnd;
          targetMin = Math.max(targetMin, ewStart);
          targetMin = Math.min(targetMin, ewEnd - duration);
        }

        const minToTime = (m: number) => {
          const h = Math.floor(m / 60) % 24;
          const mi = m % 60;
          return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
        };

        // Find a conflict-free slot near targetMin
        const isSlotFree = (slotStart: number): boolean => {
          const slotEnd = slotStart + duration;
          for (const b of blocks) {
            if (b.isAllDay) continue;
            const bStart = timeToMinutes(b.startTime);
            const bEnd = timeToMinutes(b.endTime);
            if (slotStart < bEnd && slotEnd > bStart) return false;
          }
          return true;
        };

        let chosenMin: number | null = null;
        const clampedTarget = Math.max(rangeStart, Math.min(targetMin, rangeEnd - duration));
        if (isSlotFree(clampedTarget)) {
          chosenMin = clampedTarget;
        } else {
          let offset = 15;
          const maxOffset = Math.max(clampedTarget - rangeStart, rangeEnd - clampedTarget);
          while (offset <= maxOffset) {
            const earlier = clampedTarget - offset;
            if (earlier >= rangeStart && isSlotFree(earlier)) { chosenMin = earlier; break; }
            const later = clampedTarget + offset;
            if (later + duration <= rangeEnd && isSlotFree(later)) { chosenMin = later; break; }
            offset += 15;
          }
        }

        if (chosenMin === null) {
          console.warn(`[AI Scheduler] ⚠️ No conflict-free slot for recovered meal "${inputMeal.title}" – skipping`);
          // Do not push a block; the outer DayPlannerContext safety net will handle it.
        } else {
          console.log(`[AI Scheduler] ✅ Recovered "${inputMeal.title}" at ${to12Hour(minToTime(chosenMin))}`);
          blocks.push({
            id: `ai-recovered-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            type: 'meal_eating' as any,
            title: inputMeal.title,
            startTime: minToTime(chosenMin),
            endTime: minToTime(chosenMin + duration),
            duration,
            status: 'scheduled' as any,
            color: getDefaultColor('meal_eating'),
            icon: getDefaultIcon('meal_eating'),
            priority: 3,
            flexibility: 0.5,
            aiGenerated: true,
          });
        }
      }
    }

    // MERGE: Add calendar blocks to final timeline
    const allBlocks = [...blocks, ...request.calendarBlocks];

    // Log final blocks after all validation
    console.log('[AI Scheduler] Final blocks AFTER validation (with calendar events):');
    allBlocks.forEach(block => {
      const timeRange = `${to12Hour(block.startTime)}-${to12Hour(block.endTime)}`;
      console.log(`  ${block.type}: ${block.title} | ${timeRange}`);
    });

    // Calculate stats (exclude calendar blocks from stats)
    const stats = calculateStats(blocks, request.preferences);

    // Build timeline
    const timeline: DailyTimeline = {
      date: request.date,
      blocks: allBlocks,
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
${isFasting ? `- 🚨 FASTING ACTIVE - EATING WINDOW: ${lifeContext.fastingEnd} TO ${lifeContext.fastingStart}

  STRICT MEAL SCHEDULING RULES:
  - Fasting ENDS at ${lifeContext.fastingEnd} → Eating window OPENS
  - Fasting STARTS at ${lifeContext.fastingStart} → Eating window CLOSES
  - ALL meals must have BOTH start AND end times within ${lifeContext.fastingEnd}-${lifeContext.fastingStart}

  EXAMPLES (for ${lifeContext.fastingEnd}-${lifeContext.fastingStart} window):
  ✅ VALID: Meal at ${lifeContext.fastingEnd === '12:00' ? '12:30-13:00' : '13:00-13:30'} (inside window)
  ✅ VALID: Meal at ${lifeContext.fastingEnd === '12:00' ? '15:00-15:45' : '16:00-16:45'} (inside window)
  ✅ VALID: Meal at ${lifeContext.fastingEnd === '12:00' ? '19:00-19:45' : '18:00-18:45'} (ends before ${lifeContext.fastingStart})
  ❌ INVALID: Meal at 08:00-08:30 (BEFORE ${lifeContext.fastingEnd} - still fasting!)
  ❌ INVALID: Meal at 11:00-11:30 (BEFORE ${lifeContext.fastingEnd} - still fasting!)
  ❌ INVALID: Meal at 11:30-12:30 (STARTS before ${lifeContext.fastingEnd} - WRONG!)
  ❌ INVALID: Meal at 19:30-20:30 (ENDS after ${lifeContext.fastingStart} - WRONG!)
  ❌ INVALID: Meal at 20:00-20:30 (STARTS at/after ${lifeContext.fastingStart} - window closed!)` : '- Not active'}
${isCheatDay ? '- 🎂 CHEAT DAY: No fasting restrictions today - schedule meals anytime' : ''}

**Workouts to Schedule:**
${workoutBlocks.length > 0 ? workoutBlocks.map(w => `- ${w.title} (${w.duration} min)`).join('\n') : '- None'}

**Meals to Schedule:**
${mealBlocks.length > 0 ? mealBlocks.map(m => {
  const mealType = m.title.toLowerCase().includes('breakfast') ? 'breakfast'
    : m.title.toLowerCase().includes('lunch') ? 'lunch'
    : m.title.toLowerCase().includes('dinner') ? 'dinner'
    : 'snack';
  return `- ${m.title} (${m.duration} min) - TYPE: ${mealType}`;
}).join('\n') : '- Breakfast (30 min), Lunch (45 min), Dinner (45 min)'}

**MEAL TIME WINDOWS (Flexible Ranges):**
🍳 **BREAKFAST WINDOW:** 05:00 - 10:59
   - Morning meal (target: 08:00)
   - Can be scheduled ANYTIME within this window
   - Example: 07:30-08:00, or 09:00-09:30
   - ${isFasting ? `⚠️ IF FASTING: Must start AFTER ${lifeContext.fastingEnd} (eating window opens)` : ''}

🥗 **LUNCH WINDOW:** 11:00 - 14:00
   - Mid-day meal (target: 12:00)
   - Can be scheduled ANYTIME within this window
   - Example: 12:00-12:30, or 13:00-13:45

🍽️ **DINNER WINDOW:** 17:00 - 22:00
   - Evening meal (target: 18:30)
   - Can be scheduled ANYTIME within this window
   - ${isFasting ? `⚠️ IF FASTING: Must END before ${lifeContext.fastingStart} (eating window closes)` : ''}
   - Example: 18:30-19:15, or 19:00-19:45

🍿 **SNACKS (Flexible):**
   - Can be scheduled ANYTIME between meal windows
   - Ideal times: After breakfast before lunch, After lunch before dinner
   - Keep 30-60 min gap from main meals

**Calendar Events (DO NOT SCHEDULE OVER THESE):**
${calendarBlocks.length > 0 ? calendarBlocks.map(e => `- ${e.startTime}-${e.endTime}: ${e.title}`).join('\n') : '- None'}

**CRITICAL SCHEDULING RULES:**
1. Include sleep block from ${preferences.sleepTime} to ${preferences.wakeTime}
2. 🚨 **MEAL TYPE AWARENESS**:
   - Breakfast → Schedule within BREAKFAST WINDOW
   - Lunch → Schedule within LUNCH WINDOW
   - Dinner → Schedule within DINNER WINDOW
   - Snacks → Schedule BETWEEN meal windows (flexible)
3. 🚨 IF FASTING: ALL meals MUST be between ${isFasting ? lifeContext.fastingEnd : 'N/A'} and ${isFasting ? lifeContext.fastingStart : 'N/A'}
4. 🚨 NEVER overlap workouts with meals - they must be completely separate time blocks
5. 🚨 NEVER overlap workouts/meals with calendar events
6. 🚨 Leave at least 15 minutes between consecutive blocks (workout→meal, meal→workout, etc.)
7. Schedule workouts BEFORE or AFTER meals, never during
8. **DO NOT use fixed meal times** - use the flexible windows above

**Scheduling Strategy:**
- Find all occupied time slots (calendar events + sleep)
- Identify free time windows
- Place workouts in free windows (avoiding fasting eating time if possible)
- Place BREAKFAST within breakfast window (05:00-10:59)${isFasting ? ` BUT must start AFTER ${lifeContext.fastingEnd}` : ''}
- Place LUNCH within lunch window (11:00-14:00)${isFasting ? ` AND must end before ${lifeContext.fastingStart}` : ''}
- Place DINNER within dinner window (17:00-22:00)${isFasting ? ` AND must end before ${lifeContext.fastingStart}` : ''}
- Place SNACKS between meal windows with 30-60 min gaps
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
