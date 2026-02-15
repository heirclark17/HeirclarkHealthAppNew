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

      // Step 3: Add workout blocks (scheduled at energy peak time)
      this.addWorkoutBlocks(blocks, request.workoutBlocks, request.preferences);

      // Step 4: Add meal blocks (flexible timing within meal windows)
      this.addMealBlocks(blocks, request.mealBlocks, request.preferences);

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
   * Add calendar events (CLIENT-SIDE ONLY)
   */
  private static addCalendarBlocks(blocks: TimeBlock[], calendarBlocks: TimeBlock[]) {
    for (const event of calendarBlocks) {
      blocks.push({
        ...event,
        priority: 4, // High priority (can't be moved)
        flexibility: 0,
        aiGenerated: false,
      });
    }
  }

  /**
   * Add workout blocks (scheduled at energy peak time)
   */
  private static addWorkoutBlocks(
    blocks: TimeBlock[],
    workouts: TimeBlock[],
    preferences: PlannerPreferences
  ) {
    for (const workout of workouts) {
      // Schedule at energy peak time
      const preferredTime = this.getPreferredWorkoutTime(preferences.energyPeak);
      const startTime = this.findAvailableSlot(
        blocks,
        preferredTime,
        workout.duration,
        preferences
      );

      blocks.push({
        ...workout,
        startTime,
        endTime: this.addMinutesToTime(startTime, workout.duration),
        priority: 4,
        flexibility: this.flexibilityToNumber(preferences.flexibility),
        aiGenerated: true,
      });
    }
  }

  /**
   * Add meal blocks (flexible timing within meal windows)
   */
  private static addMealBlocks(
    blocks: TimeBlock[],
    meals: TimeBlock[],
    preferences: PlannerPreferences
  ) {
    for (const meal of meals) {
      let preferredTime: string;

      // Determine preferred time based on meal type
      if (meal.title.toLowerCase().includes('breakfast')) {
        preferredTime = this.addMinutesToTime(preferences.wakeTime, 30);
      } else if (meal.title.toLowerCase().includes('lunch')) {
        preferredTime = '12:00';
      } else if (meal.title.toLowerCase().includes('dinner')) {
        preferredTime = '18:00';
      } else {
        // Default meal time
        preferredTime = '12:00';
      }

      const startTime = this.findAvailableSlot(
        blocks,
        preferredTime,
        meal.duration,
        preferences
      );

      blocks.push({
        ...meal,
        startTime,
        endTime: this.addMinutesToTime(startTime, meal.duration),
        priority: 3,
        flexibility: 0.5,
        aiGenerated: true,
      });
    }
  }

  /**
   * Add buffer times between blocks
   */
  private static addBufferTimes(blocks: TimeBlock[], preferences: PlannerPreferences) {
    const bufferMinutes = PLANNER_CONSTANTS.DEFAULT_BUFFER;

    // Add buffers between adjacent blocks
    for (let i = 0; i < blocks.length - 1; i++) {
      const current = blocks[i];
      const next = blocks[i + 1];

      const currentEnd = this.timeToMinutes(current.endTime);
      const nextStart = this.timeToMinutes(next.startTime);
      const gap = nextStart - currentEnd;

      // Only add buffer if gap is small (5-15 minutes)
      if (gap >= 5 && gap <= 15) {
        blocks.push({
          id: this.generateId('buffer'),
          type: 'buffer',
          title: 'Buffer Time',
          startTime: current.endTime,
          endTime: this.minutesToTime(currentEnd + bufferMinutes),
          duration: bufferMinutes,
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
   * Detect conflicts between blocks
   */
  private static detectConflicts(blocks: TimeBlock[]): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];

    for (let i = 0; i < blocks.length - 1; i++) {
      const current = blocks[i];
      const next = blocks[i + 1];

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
      .filter(b => b.type !== 'sleep')
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
   * by requiring a minimum buffer between adjacent blocks.
   */
  private static findAvailableSlot(
    existingBlocks: TimeBlock[],
    preferredTime: string,
    duration: number,
    preferences: PlannerPreferences
  ): string {
    const buffer = PLANNER_CONSTANTS.DEFAULT_BUFFER; // min gap between blocks
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
        // Check overlap with buffer: require `buffer` minutes gap on each side
        const hasConflict = existingBlocks.some(block => {
          const blockStart = this.timeToMinutes(block.startTime);
          const blockEnd = this.timeToMinutes(block.endTime);

          // Conflict if candidate overlaps OR is too close to an existing block
          return (candStart < blockEnd + buffer && candEnd + buffer > blockStart);
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
      const candEnd = candStart + duration;

      if (candStart >= wakeMinutes && candEnd <= sleepMinutes) {
        const hasConflict = existingBlocks.some(block => {
          const blockStart = this.timeToMinutes(block.startTime);
          const blockEnd = this.timeToMinutes(block.endTime);
          return (candStart < blockEnd + buffer && candEnd + buffer > blockStart);
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
      if (wakeMinutes + duration + buffer <= firstStart) {
        return this.minutesToTime(wakeMinutes);
      }
    }

    // Check gaps between blocks
    for (let i = 0; i < sorted.length - 1; i++) {
      const gapStart = this.timeToMinutes(sorted[i].endTime) + buffer;
      const gapEnd = this.timeToMinutes(sorted[i + 1].startTime) - buffer;
      if (gapEnd - gapStart >= duration) {
        return this.minutesToTime(gapStart);
      }
    }

    // Check gap after last block
    if (sorted.length > 0) {
      const lastEnd = this.timeToMinutes(sorted[sorted.length - 1].endTime) + buffer;
      if (lastEnd + duration <= sleepMinutes) {
        return this.minutesToTime(lastEnd);
      }
    }

    // Truly no space - log warning and return preferred time
    console.warn('[SchedulingEngine] No conflict-free slot found for', duration, 'min block. Day may be over-scheduled.');
    return preferredTime;
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
   * Convert time string to minutes since midnight
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
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
