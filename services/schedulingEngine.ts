/**
 * Client-side constraint satisfaction algorithm for daily scheduling
 * Generates conflict-free timelines by intelligently placing time blocks
 */

import {
  SchedulingRequest,
  SchedulingResult,
  TimeBlock,
  DailyTimeline,
  SchedulingConflict,
  PlannerPreferences,
  EnergyPeak,
  RecoveryContext,
  CompletionPatterns,
  LifeContext,
  PLANNER_CONSTANTS,
} from '../types/planner';

export class SchedulingEngine {
  /**
   * Main entry point: Generate optimized daily timeline
   */
  static generateTimeline(request: SchedulingRequest): SchedulingResult {
    const blocks: TimeBlock[] = [];
    const conflicts: SchedulingConflict[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Step 1: Add fixed blocks (sleep)
      this.addSleepBlock(blocks, request.preferences);

      // Step 2: Add calendar events (CLIENT-SIDE ONLY - never sent to backend)
      this.addCalendarBlocks(blocks, request.calendarBlocks);

      // Step 2.5: Meeting density detection (Tier 4c)
      const meetingDensity = this.detectMeetingDensity(request.calendarBlocks);
      if (request.lifeContext) {
        request.lifeContext.meetingDensity = meetingDensity;
      }

      // Step 2.6: OOO day handling (Tier 4d)
      const isOOODay = request.lifeContext?.isOOODay ?? false;
      if (isOOODay) {
        // OOO day: skip default work blocks, move workout to casual time
        suggestions.push('OOO day detected — relaxed schedule applied.');
      }

      // Step 3: Add workout blocks (recovery-aware, learned preference)
      this.addWorkoutBlocks(
        blocks,
        request.workoutBlocks,
        request.preferences,
        request.recoveryContext,
        request.completionPatterns,
        meetingDensity,
        isOOODay,
      );

      // Step 4: Add meal blocks (IF-aware, cheat-day aware, learned preference)
      this.addMealBlocks(
        blocks,
        request.mealBlocks,
        request.preferences,
        request.lifeContext,
        request.completionPatterns,
      );

      // Step 4.5: Add fasting buffer block if IF active (Tier 4a)
      // Skip fasting block on cheat days - allow normal eating schedule
      if (request.lifeContext?.isFasting && !request.lifeContext?.isCheatDay) {
        this.addFastingBlock(blocks, request.lifeContext, request.preferences);
      }

      // Step 5: Sort by start time
      blocks.sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime));

      // Step 6: Detect conflicts
      const detectedConflicts = this.detectConflicts(blocks);
      conflicts.push(...detectedConflicts);

      // Step 7: Add buffer times between blocks
      this.addBufferTimes(blocks, request.preferences);

      // Step 8: Re-sort after adding buffers
      blocks.sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime));

      // Step 9: Calculate stats
      const stats = this.calculateStats(blocks, request.preferences);

      // Step 10: Generate suggestions
      if (stats.totalScheduledMinutes > 16 * 60) {
        warnings.push('Your day is heavily scheduled. Consider adding more free time.');
      }

      if (conflicts.length > 0) {
        suggestions.push('Reschedule conflicting blocks or adjust durations to resolve overlaps.');
      }

      const timeline: DailyTimeline = {
        date: request.date,
        dayOfWeek: this.formatDayOfWeek(request.date),
        blocks,
        ...stats,
      };

      return {
        success: conflicts.length === 0,
        timeline,
        conflicts,
        warnings,
        suggestions,
      };
    } catch (error) {
      console.error('[SchedulingEngine] Error generating timeline:', error);
      return {
        success: false,
        timeline: {
          date: request.date,
          dayOfWeek: this.formatDayOfWeek(request.date),
          blocks: [],
          totalScheduledMinutes: 0,
          totalFreeMinutes: 0,
          completionRate: 0,
        },
        conflicts: [],
        warnings: [`Failed to generate timeline: ${error.message}`],
        suggestions: [],
      };
    }
  }

  /**
   * Add sleep block (highest priority, fixed)
   */
  private static addSleepBlock(blocks: TimeBlock[], preferences: PlannerPreferences) {
    const sleepDuration = this.calculateSleepDuration(preferences.sleepTime, preferences.wakeTime);

    blocks.push({
      id: this.generateId('sleep'),
      type: 'sleep',
      title: 'Sleep',
      startTime: preferences.sleepTime,
      endTime: preferences.wakeTime,
      duration: sleepDuration,
      status: 'scheduled',
      color: PLANNER_CONSTANTS.BLOCK_COLORS.sleep,
      icon: PLANNER_CONSTANTS.BLOCK_ICONS.sleep,
      priority: 5,
      flexibility: 0,
      aiGenerated: true,
    });
  }

  /**
   * Add calendar events (CLIENT-SIDE ONLY).
   * All-day events (holidays, birthdays, OOO) are kept in the blocks array
   * for UI rendering as banner chips but are NOT treated as timed blocks.
   */
  private static addCalendarBlocks(blocks: TimeBlock[], calendarBlocks: TimeBlock[]) {
    for (const event of calendarBlocks) {
      if (event.isAllDay) {
        // Preserve in the block list so the UI can render a banner chip,
        // but don't give it a real time range that would cause conflicts.
        blocks.push({ ...event });
        continue;
      }
      blocks.push({
        ...event,
        priority: 4, // High priority (can't be moved)
        flexibility: 0,
        aiGenerated: false,
      });
    }
  }

  /**
   * Add workout blocks (recovery-aware, learned preference, meeting-density aware)
   */
  private static addWorkoutBlocks(
    blocks: TimeBlock[],
    workouts: TimeBlock[],
    preferences: PlannerPreferences,
    recovery?: RecoveryContext,
    patterns?: CompletionPatterns,
    meetingDensity: 'low' | 'medium' | 'high' = 'low',
    isOOODay: boolean = false,
  ) {
    for (const workout of workouts) {
      let adjustedDuration = workout.duration;
      let titleSuffix = '';
      let mutedColor: string | undefined;

      // Tier 1d: Recovery-aware adjustments
      if (recovery?.isLowRecovery) {
        // Reduce duration by 25%, round to nearest 15 min
        adjustedDuration = Math.round((workout.duration * 0.75) / 15) * 15;
        adjustedDuration = Math.max(PLANNER_CONSTANTS.MIN_BLOCK_DURATION, adjustedDuration);
        titleSuffix = ' (Recovery)';
        // Muted color: add transparency to workout color
        mutedColor = PLANNER_CONSTANTS.BLOCK_COLORS.workout + '80'; // 50% alpha
      }

      // Determine preferred time
      let preferredTime: string;

      // Tier 2b: Use learned preferred window if reliable
      const workoutPattern = patterns?.['workout'];
      if (workoutPattern?.preferredWindow && workoutPattern.completionRate > 0.6) {
        preferredTime = workoutPattern.preferredWindow;
      } else if (recovery?.isLowRecovery) {
        // Low recovery → prefer afternoon (body is more warmed up)
        preferredTime = '14:00';
      } else if (isOOODay) {
        // OOO day → casual mid-morning
        preferredTime = '10:00';
      } else {
        preferredTime = this.getPreferredWorkoutTime(preferences.energyPeak);
      }

      // Tier 4c: Meeting density avoidance
      if (meetingDensity === 'high') {
        // If high meeting density in morning, push workout to afternoon and vice versa
        const prefMinutes = this.timeToMinutes(preferredTime);
        if (prefMinutes < 720) { // before noon
          preferredTime = '14:00'; // push to afternoon
        } else {
          preferredTime = '07:00'; // push to morning
        }
      }

      const startTime = this.findAvailableSlot(
        blocks,
        preferredTime,
        adjustedDuration,
        preferences,
        'workout'
      );

      blocks.push({
        ...workout,
        title: workout.title + titleSuffix,
        duration: adjustedDuration,
        startTime,
        endTime: this.addMinutesToTime(startTime, adjustedDuration),
        color: mutedColor || workout.color,
        priority: 4,
        flexibility: this.flexibilityToNumber(preferences.flexibility),
        aiGenerated: true,
      });
    }
  }

  /**
   * Add meal blocks (IF-aware, cheat-day aware, learned preference)
   */
  private static addMealBlocks(
    blocks: TimeBlock[],
    meals: TimeBlock[],
    preferences: PlannerPreferences,
    lifeContext?: LifeContext,
    patterns?: CompletionPatterns,
  ) {
    const isFasting = lifeContext?.isFasting ?? false;
    const isCheatDay = lifeContext?.isCheatDay ?? false;

    // Parse IF eating window (fastingEnd = eating starts, fastingStart = eating ends)
    let eatingWindowStart = 0;   // minutes since midnight
    let eatingWindowEnd = 1440;  // minutes since midnight
    if (isFasting && lifeContext) {
      eatingWindowStart = this.timeToMinutes(lifeContext.fastingEnd);   // e.g. 12:00 → 720
      eatingWindowEnd = this.timeToMinutes(lifeContext.fastingStart);   // e.g. 20:00 → 1200
    }

    for (const meal of meals) {
      let preferredTime: string;
      let titleSuffix = '';
      let adjustedDuration = meal.duration;

      // Tier 2b: Use learned preferred window for meal type
      const mealType = meal.title.toLowerCase().includes('breakfast') ? 'meal_breakfast'
        : meal.title.toLowerCase().includes('lunch') ? 'meal_lunch'
        : meal.title.toLowerCase().includes('dinner') ? 'meal_dinner'
        : 'meal_eating';
      const mealPattern = patterns?.[mealType];

      if (mealPattern?.preferredWindow && mealPattern.completionRate > 0.6) {
        preferredTime = mealPattern.preferredWindow;
        console.log(`[Schedule] ${meal.title}: Using learned pattern ${preferredTime}`);
      } else if (meal.title.toLowerCase().includes('breakfast')) {
        preferredTime = this.addMinutesToTime(preferences.wakeTime, 15);
        console.log(`[Schedule] ${meal.title}: Preferred ${preferredTime} (wake+15min)`);
      } else if (meal.title.toLowerCase().includes('lunch')) {
        preferredTime = '12:00';
        console.log(`[Schedule] ${meal.title}: Preferred ${preferredTime}`);
      } else if (meal.title.toLowerCase().includes('dinner')) {
        preferredTime = '18:00';
        console.log(`[Schedule] ${meal.title}: Preferred ${preferredTime}`);
      } else {
        preferredTime = '12:00';
        console.log(`[Schedule] ${meal.title}: Default preferred ${preferredTime} (unrecognized meal type)`);
      }

      // Tier 4a: IF fasting window enforcement
      if (isFasting && !isCheatDay) {
        const prefMinutes = this.timeToMinutes(preferredTime);
        if (prefMinutes < eatingWindowStart) {
          // Shift to eating window start
          preferredTime = this.minutesToTime(eatingWindowStart);
        } else if (prefMinutes + meal.duration > eatingWindowEnd) {
          // Shift backward to fit within eating window
          preferredTime = this.minutesToTime(eatingWindowEnd - meal.duration);
        }
      }

      // Tier 4b: Cheat day adjustments
      if (isCheatDay) {
        titleSuffix = ' (Flex Day)';
        adjustedDuration = meal.duration + 15; // extra 15 min for special cooking
      }

      const startTime = this.findAvailableSlot(
        blocks,
        preferredTime,
        adjustedDuration,
        preferences,
        meal.type // Pass meal type (meal_eating or meal_prep)
      );

      console.log(`[Schedule] ${meal.title}: Scheduled at ${startTime} (duration: ${adjustedDuration}min)`);

      blocks.push({
        ...meal,
        title: meal.title + titleSuffix,
        duration: adjustedDuration,
        startTime,
        endTime: this.addMinutesToTime(startTime, adjustedDuration),
        priority: 3,
        flexibility: isCheatDay ? 0.8 : 0.5,
        aiGenerated: true,
      });
    }
  }

  /**
   * Add buffer times between blocks with intelligent spacing:
   * - 60 min after sleep before breakfast
   * - 45 min after meetings before meals
   * - 30 min before workouts for prep/commute
   * - 15 min default between other blocks
   */
  private static addBufferTimes(blocks: TimeBlock[], preferences: PlannerPreferences) {
    // Add buffers between adjacent blocks
    for (let i = 0; i < blocks.length - 1; i++) {
      const current = blocks[i];
      const next = blocks[i + 1];

      const currentEnd = this.timeToMinutes(current.endTime);
      const nextStart = this.timeToMinutes(next.startTime);
      const gap = nextStart - currentEnd;

      // Determine required buffer based on block transition types
      let requiredBuffer = PLANNER_CONSTANTS.DEFAULT_BUFFER; // 10 min default
      let bufferTitle = 'Buffer Time';

      // After sleep (wake up) → 60 min before breakfast
      if (current.type === 'sleep' && (next.type === 'meal_eating' || next.type === 'meal_prep')) {
        requiredBuffer = 60;
        bufferTitle = 'Morning Routine';
      }
      // After meetings/calendar events → 45 min before meals
      else if (current.type === 'calendar_event' && (next.type === 'meal_eating' || next.type === 'meal_prep')) {
        requiredBuffer = 45;
        bufferTitle = 'Transition Time';
      }
      // Before workouts → 30 min for getting dressed, driving, prep
      else if (next.type === 'workout') {
        requiredBuffer = 30;
        bufferTitle = 'Workout Prep';
      }
      // After workouts → 20 min for cooldown, shower
      else if (current.type === 'workout') {
        requiredBuffer = 20;
        bufferTitle = 'Cooldown';
      }
      // Between meals and meetings → 15 min
      else if ((current.type === 'meal_eating' || current.type === 'meal_prep') && next.type === 'calendar_event') {
        requiredBuffer = 15;
        bufferTitle = 'Buffer Time';
      }

      // Add buffer when blocks are too close together (gap < required buffer)
      if (gap > 0 && gap < requiredBuffer) {
        const bufferDuration = Math.min(requiredBuffer, gap);
        blocks.push({
          id: this.generateId('buffer'),
          type: 'buffer',
          title: bufferTitle,
          startTime: current.endTime,
          endTime: this.minutesToTime(currentEnd + bufferDuration),
          duration: bufferDuration,
          status: 'scheduled',
          color: PLANNER_CONSTANTS.BLOCK_COLORS.buffer,
          icon: PLANNER_CONSTANTS.BLOCK_ICONS.buffer,
          priority: 1,
          flexibility: 1,
          aiGenerated: true,
        });
      }
    }
  }

  /**
   * Detect conflicts between blocks.
   * All-day events are excluded — they render as banner chips and cannot overlap timed blocks.
   */
  private static detectConflicts(blocks: TimeBlock[]): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];
    // Only check timed blocks for overlaps
    const timedBlocks = blocks.filter(b => !b.isAllDay);

    for (let i = 0; i < timedBlocks.length - 1; i++) {
      const current = timedBlocks[i];
      const next = timedBlocks[i + 1];

      const currentEnd = this.timeToMinutes(current.endTime);
      const nextStart = this.timeToMinutes(next.startTime);

      // Overlap
      if (currentEnd > nextStart) {
        conflicts.push({
          type: 'overlap',
          blockIds: [current.id, next.id],
          message: `${current.title} overlaps with ${next.title}`,
        });
      }

      // Too tight (less than 5 minutes gap)
      if (nextStart - currentEnd > 0 && nextStart - currentEnd < 5) {
        conflicts.push({
          type: 'too_tight',
          blockIds: [current.id, next.id],
          message: `Not enough time between ${current.title} and ${next.title}`,
        });
      }
    }

    return conflicts;
  }

  /**
   * Calculate daily stats
   */
  private static calculateStats(
    blocks: TimeBlock[],
    preferences: PlannerPreferences
  ): {
    totalScheduledMinutes: number;
    totalFreeMinutes: number;
    completionRate: number;
  } {
    const wakeMinutes = this.timeToMinutes(preferences.wakeTime);
    const sleepMinutes = this.timeToMinutes(preferences.sleepTime);
    const awakeMinutes = sleepMinutes > wakeMinutes
      ? sleepMinutes - wakeMinutes
      : (24 * 60) - wakeMinutes + sleepMinutes;

    const totalScheduledMinutes = blocks
      .filter(b => b.type !== 'sleep' && !b.isAllDay)
      .reduce((sum, b) => sum + b.duration, 0);

    const totalFreeMinutes = awakeMinutes - totalScheduledMinutes;

    const completedBlocks = blocks.filter(b => b.status === 'completed').length;
    const completionRate = blocks.length > 0
      ? Math.round((completedBlocks / blocks.length) * 100)
      : 0;

    return {
      totalScheduledMinutes,
      totalFreeMinutes: Math.max(0, totalFreeMinutes),
      completionRate,
    };
  }

  /**
   * Find available time slot for a block.
   * Guarantees no overlap with existing blocks (calendar events, sleep, etc.)
   * by requiring intelligent buffer times between adjacent blocks.
   */
  private static findAvailableSlot(
    existingBlocks: TimeBlock[],
    preferredTime: string,
    duration: number,
    preferences: PlannerPreferences,
    blockType?: string
  ): string {
    // Ignore all-day blocks — they don't occupy timed slots
    existingBlocks = existingBlocks.filter(b => !b.isAllDay);

    // Buffer needed AFTER a block type
    const getBufferAfter = (blockType: string): number => {
      if (blockType === 'sleep') return 15; // Quick morning routine
      if (blockType === 'calendar_event') return 15; // Quick break after meetings
      if (blockType === 'workout') return 15; // Quick shower/cooldown
      return PLANNER_CONSTANTS.DEFAULT_BUFFER; // 10 min default
    };

    // Buffer needed BEFORE a block type
    const getBufferBefore = (blockType?: string): number => {
      if (blockType === 'workout') return 15; // Quick prep/change
      if (blockType === 'meal_eating' || blockType === 'meal_prep') return 5; // Minimal transition
      return PLANNER_CONSTANTS.DEFAULT_BUFFER; // 10 min default
    };

    const wakeMinutes = this.timeToMinutes(preferences.wakeTime);
    const sleepMinutes = this.timeToMinutes(preferences.sleepTime);

    // First pass: try forward from preferred time in 15-min increments
    let candidateTime = preferredTime;
    let attempts = 0;
    const maxAttempts = 96; // Try every 15 minutes across full waking window

    while (attempts < maxAttempts) {
      const candStart = this.timeToMinutes(candidateTime);
      const candEnd = candStart + duration;

      // Stay within waking hours
      if (candStart >= wakeMinutes && candEnd <= sleepMinutes) {
        // Check overlap with intelligent buffer: require appropriate gap based on block types
        const hasConflict = existingBlocks.some(block => {
          const blockStart = this.timeToMinutes(block.startTime);
          const blockEnd = this.timeToMinutes(block.endTime);

          // Get required buffers
          const bufferAfter = getBufferAfter(block.type);
          const bufferBefore = getBufferBefore(blockType);

          // Check if candidate violates buffer after existing block
          if (candStart >= blockEnd && candStart < blockEnd + bufferAfter) {
            return true; // Too soon after existing block
          }

          // Check if candidate violates buffer before existing block
          if (candEnd > blockStart - bufferBefore && candEnd <= blockStart) {
            return true; // Too close to start of existing block
          }

          // Check for direct overlap
          if (candStart < blockEnd && candEnd > blockStart) {
            return true; // Overlaps existing block
          }

          return false;
        });

        if (!hasConflict) {
          return candidateTime;
        }
      }

      // Try 15 minutes later
      candidateTime = this.addMinutesToTime(candidateTime, 15);
      attempts++;
    }

    // Second pass: try backward from preferred time in 15-min increments
    candidateTime = preferredTime;
    attempts = 0;
    while (attempts < maxAttempts) {
      const candStart = this.timeToMinutes(candidateTime);

      // Stop searching if we've gone before wake time
      if (candStart < wakeMinutes) break;

      const candEnd = candStart + duration;

      if (candStart >= wakeMinutes && candEnd <= sleepMinutes) {
        const hasConflict = existingBlocks.some(block => {
          const blockStart = this.timeToMinutes(block.startTime);
          const blockEnd = this.timeToMinutes(block.endTime);

          const bufferAfter = getBufferAfter(block.type);
          const bufferBefore = getBufferBefore(blockType);

          // Check all buffer violations and overlaps
          if (candStart >= blockEnd && candStart < blockEnd + bufferAfter) return true;
          if (candEnd > blockStart - bufferBefore && candEnd <= blockStart) return true;
          if (candStart < blockEnd && candEnd > blockStart) return true;

          return false;
        });

        if (!hasConflict) {
          return candidateTime;
        }
      }

      // Try 15 minutes earlier
      candidateTime = this.addMinutesToTime(candidateTime, -15);
      attempts++;
    }

    // Last resort: find ANY open gap in the waking window
    const sorted = [...existingBlocks].sort(
      (a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
    );

    // Check gap before first block
    if (sorted.length > 0) {
      const firstStart = this.timeToMinutes(sorted[0].startTime);
      const sleepBlock = sorted.find(b => b.type === 'sleep');
      const bufferAfterWake = sleepBlock ? getBufferAfter(sleepBlock.type) : 30;
      const bufferBefore = getBufferBefore(blockType);
      if (wakeMinutes + bufferAfterWake + duration + bufferBefore <= firstStart) {
        return this.minutesToTime(wakeMinutes + bufferAfterWake);
      }
    }

    // Check gaps between blocks
    for (let i = 0; i < sorted.length - 1; i++) {
      const bufferAfter = getBufferAfter(sorted[i].type);
      const bufferBefore = getBufferBefore(blockType);
      const gapStart = this.timeToMinutes(sorted[i].endTime) + bufferAfter;
      const gapEnd = this.timeToMinutes(sorted[i + 1].startTime) - bufferBefore;
      if (gapEnd - gapStart >= duration) {
        return this.minutesToTime(gapStart);
      }
    }

    // Check gap after last block
    if (sorted.length > 0) {
      const bufferAfter = getBufferAfter(sorted[sorted.length - 1].type);
      const lastEnd = this.timeToMinutes(sorted[sorted.length - 1].endTime) + bufferAfter;
      if (lastEnd + duration <= sleepMinutes) {
        return this.minutesToTime(lastEnd);
      }
    }

    // Truly no space - log warning and return preferred time
    console.warn('[SchedulingEngine] No conflict-free slot found for', duration, 'min block. Day may be over-scheduled.');
    return preferredTime;
  }

  /**
   * Tier 4c: Detect meeting density from calendar blocks.
   * Counts timed calendar_event blocks in 4-hour windows.
   */
  private static detectMeetingDensity(calendarBlocks: TimeBlock[]): 'low' | 'medium' | 'high' {
    const timedEvents = calendarBlocks.filter(b => !b.isAllDay && b.type === 'calendar_event');
    if (timedEvents.length === 0) return 'low';

    // Count events in morning (before 12:00) and afternoon (12:00-17:00)
    const morningCount = timedEvents.filter(b => this.timeToMinutes(b.startTime) < 720).length;
    const afternoonCount = timedEvents.filter(b => {
      const start = this.timeToMinutes(b.startTime);
      return start >= 720 && start < 1020;
    }).length;

    const maxDensity = Math.max(morningCount, afternoonCount);
    if (maxDensity >= 3) return 'high';
    if (maxDensity >= 2) return 'medium';
    return 'low';
  }

  /**
   * Tier 4a: Add a fasting buffer block during fasting hours.
   */
  private static addFastingBlock(
    blocks: TimeBlock[],
    lifeContext: LifeContext,
    preferences: PlannerPreferences
  ) {
    const fastingStart = this.timeToMinutes(lifeContext.fastingStart); // e.g. 20:00 → 1200
    const sleepTime = this.timeToMinutes(preferences.sleepTime);

    // Only add fasting block between fasting start and sleep
    if (fastingStart < sleepTime) {
      const duration = sleepTime - fastingStart;
      blocks.push({
        id: this.generateId('fasting'),
        type: 'buffer',
        title: 'Fasting Window',
        startTime: lifeContext.fastingStart,
        endTime: preferences.sleepTime,
        duration,
        status: 'scheduled',
        color: '#E0E0E040', // very light gray with transparency
        icon: 'timer',
        priority: 1,
        flexibility: 0,
        aiGenerated: true,
      });
    }
  }

  /**
   * Get preferred workout time based on energy peak
   */
  private static getPreferredWorkoutTime(energyPeak: EnergyPeak): string {
    switch (energyPeak) {
      case 'morning':
        return '07:00';
      case 'afternoon':
        return '14:00';
      case 'evening':
        return '18:00';
      default:
        return '10:00';
    }
  }

  /**
   * Calculate sleep duration (handles overnight sleep)
   */
  private static calculateSleepDuration(sleepTime: string, wakeTime: string): number {
    const sleepMinutes = this.timeToMinutes(sleepTime);
    const wakeMinutes = this.timeToMinutes(wakeTime);

    if (wakeMinutes > sleepMinutes) {
      return wakeMinutes - sleepMinutes;
    } else {
      // Overnight sleep
      return (24 * 60) - sleepMinutes + wakeMinutes;
    }
  }

  /**
   * Convert flexibility enum to number
   */
  private static flexibilityToNumber(flexibility: string): number {
    switch (flexibility) {
      case 'very':
        return 1;
      case 'somewhat':
        return 0.5;
      case 'not_very':
        return 0.2;
      default:
        return 0.5;
    }
  }

  /**
   * Convert time string to minutes since midnight.
   * Returns 0 for invalid input instead of NaN.
   */
  private static timeToMinutes(time: string): number {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string.
   * Handles negative values by wrapping within 0–1439.
   */
  private static minutesToTime(minutes: number): string {
    // Wrap negative and > 24h values into valid range
    const wrapped = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(wrapped / 60);
    const mins = wrapped % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Add minutes to a time string
   */
  private static addMinutesToTime(time: string, minutes: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutes;
    return this.minutesToTime(totalMinutes);
  }

  /**
   * Format date to day of week
   * Uses local-timezone parsing to avoid UTC date shift
   * (e.g. new Date("2026-02-16") in CST would show Feb 15)
   */
  private static formatDayOfWeek(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  /**
   * Generate unique ID
   */
  private static generateId(prefix: string = 'block'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
