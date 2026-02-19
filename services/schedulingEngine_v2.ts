/**
 * NEW Priority-Based Scheduling Engine
 * Implements human-realistic meal and workout timing with flex windows
 */

import {
  SchedulingRequest,
  SchedulingResult,
  TimeBlock,
  DailyTimeline,
  SchedulingConflict,
  PlannerPreferences,
  PLANNER_CONSTANTS,
} from '../types/planner';

// ===================================
// MEAL SCHEDULING CONFIGURATION
// ===================================

interface MealConfig {
  targetTime: string;      // Ideal time (anchor point)
  flexStart: string;        // Earliest acceptable time
  flexEnd: string;          // Latest acceptable time
  duration: number;         // Duration in minutes
  minGapAfter: number;      // Minimum gap before next meal (minutes)
}

const MEAL_CONFIGS: Record<string, MealConfig> = {
  breakfast: {
    targetTime: '08:00',
    flexStart: '05:00',
    flexEnd: '10:59',
    duration: 30,
    minGapAfter: 45,
  },
  lunch: {
    targetTime: '12:00',
    flexStart: '11:00',
    flexEnd: '14:00',
    duration: 30,
    minGapAfter: 45,
  },
  dinner: {
    targetTime: '18:30',
    flexStart: '17:00',
    flexEnd: '22:00',
    duration: 30,
    minGapAfter: 30,
  },
};

// ===================================
// WORKOUT SCHEDULING CONFIGURATION
// ===================================

const WORKOUT_WINDOW = {
  start: '14:00',  // 2:00 PM
  end: '19:00',    // 7:00 PM
  preferredStart: '14:00',  // Prefer 2-5 PM (gap between lunch and dinner)
  preferredEnd: '17:00',
};

// ===================================
// PRIORITY LEVELS
// ===================================

const PRIORITY = {
  SLEEP: 1,           // Immovable
  CALENDAR: 2,        // Immovable
  MEALS: 3,           // High priority (shift within flex window)
  WORKOUTS: 4,        // Medium priority (shift within 2-7 PM)
  SNACKS: 5,          // Low priority (drop if no slot)
};

// ===================================
// MAIN SCHEDULING ENGINE
// ===================================

export class SchedulingEngineV2 {
  /**
   * Main entry point: Build optimized daily schedule with priority-based placement
   */
  static buildDailySchedule(
    date: string,
    calendarEvents: TimeBlock[],
    sleepWindow: { start: string; end: string },
    eatingWindow: { start: string; end: string } | null,
    meals: TimeBlock[],
    workout: TimeBlock | null,
    preferences: PlannerPreferences
  ): SchedulingResult {
    const blocks: TimeBlock[] = [];
    const conflicts: SchedulingConflict[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      console.log('[Scheduling V2] === Starting Priority-Based Scheduling ===');
      console.log('[Scheduling V2] Date:', date);
      console.log('[Scheduling V2] Eating window:', eatingWindow);
      console.log('[Scheduling V2] Meals:', meals.map(m => m.title).join(', '));
      console.log('[Scheduling V2] Workout:', workout?.title || 'none');

      // ========================================
      // STEP 1: BUILD AVAILABILITY MAP
      // ========================================
      console.log('[Scheduling V2] Step 1: Building availability map...');

      // Add sleep block (immovable)
      const sleepBlock: TimeBlock = {
        id: this.generateId('sleep'),
        type: 'sleep',
        title: 'Sleep',
        startTime: sleepWindow.start,
        endTime: sleepWindow.end,
        duration: this.calculateDuration(sleepWindow.start, sleepWindow.end),
        status: 'scheduled',
        color: PLANNER_CONSTANTS.BLOCK_COLORS.sleep,
        icon: 'moon',
        priority: PRIORITY.SLEEP,
        flexibility: 0,
        aiGenerated: false,
      };
      blocks.push(sleepBlock);

      // Add calendar events (immovable)
      for (const event of calendarEvents) {
        blocks.push({
          ...event,
          priority: PRIORITY.CALENDAR,
          flexibility: 0,
        });
      }

      console.log('[Scheduling V2] Blocked slots:', blocks.length);

      // ========================================
      // STEP 2: ANCHOR MEALS FIRST (Priority 3)
      // ========================================
      console.log('[Scheduling V2] Step 2: Anchoring meals with flex windows...');

      const mealsByType = this.organizeMealsByType(meals);
      let lastMealEndTime = 0; // Track for min gap enforcement

      // Place breakfast
      if (mealsByType.breakfast) {
        const config = MEAL_CONFIGS.breakfast;
        const result = this.anchorMeal(
          mealsByType.breakfast,
          config,
          blocks,
          eatingWindow,
          lastMealEndTime,
          preferences
        );

        if (result.success && result.block) {
          blocks.push(result.block);
          lastMealEndTime = this.timeToMinutes(result.block.endTime);
          console.log('[Scheduling V2] ✅ Breakfast placed:', result.block.startTime);

          // Collect warning even on success (e.g., meal placed far from target)
          if (result.warning) {
            warnings.push(result.warning);
            console.warn('[Scheduling V2] ⚠️', result.warning);
          }
        } else {
          warnings.push(result.warning || 'Failed to place breakfast');
          console.warn('[Scheduling V2] ⚠️ Breakfast placement failed:', result.warning);
        }
      }

      // Place lunch
      if (mealsByType.lunch) {
        const config = MEAL_CONFIGS.lunch;
        const result = this.anchorMeal(
          mealsByType.lunch,
          config,
          blocks,
          eatingWindow,
          lastMealEndTime,
          preferences
        );

        if (result.success && result.block) {
          blocks.push(result.block);
          lastMealEndTime = this.timeToMinutes(result.block.endTime);
          console.log('[Scheduling V2] ✅ Lunch placed:', result.block.startTime);

          // Collect warning even on success (e.g., meal placed far from target)
          if (result.warning) {
            warnings.push(result.warning);
            console.warn('[Scheduling V2] ⚠️', result.warning);
          }
        } else {
          warnings.push(result.warning || 'Failed to place lunch');
          console.warn('[Scheduling V2] ⚠️ Lunch placement failed:', result.warning);
        }
      }

      // Place dinner
      if (mealsByType.dinner) {
        const config = MEAL_CONFIGS.dinner;
        const result = this.anchorMeal(
          mealsByType.dinner,
          config,
          blocks,
          eatingWindow,
          lastMealEndTime,
          preferences
        );

        if (result.success && result.block) {
          blocks.push(result.block);
          lastMealEndTime = this.timeToMinutes(result.block.endTime);
          console.log('[Scheduling V2] ✅ Dinner placed:', result.block.startTime);

          // Collect warning even on success (e.g., meal placed far from target)
          if (result.warning) {
            warnings.push(result.warning);
            console.warn('[Scheduling V2] ⚠️', result.warning);
          }
        } else {
          warnings.push(result.warning || 'Failed to place dinner');
          console.warn('[Scheduling V2] ⚠️ Dinner placement failed:', result.warning);
        }
      }

      // ========================================
      // STEP 3: PLACE WORKOUT (Priority 4)
      // ========================================
      console.log('[Scheduling V2] Step 3: Placing workout in 2-7 PM window...');

      if (workout) {
        const result = this.placeWorkout(workout, blocks, preferences);

        if (result.success && result.block) {
          blocks.push(result.block);
          console.log('[Scheduling V2] ✅ Workout placed:', result.block.startTime);

          // Check if workout affected dinner placement
          if (result.warning) {
            warnings.push(result.warning);
            console.warn('[Scheduling V2] ⚠️', result.warning);
          }
        } else {
          warnings.push(result.warning || 'Failed to place workout in 2-7 PM window');
          console.warn('[Scheduling V2] ⚠️ Workout placement failed:', result.warning);
        }
      }

      // ========================================
      // STEP 4: FILL SNACKS (Priority 5)
      // ========================================
      console.log('[Scheduling V2] Step 4: Filling snacks in remaining gaps...');

      const snacks = mealsByType.snacks || [];
      if (snacks.length > 0) {
        const placedSnacks = this.fillSnacks(snacks, blocks, preferences);
        blocks.push(...placedSnacks);
        console.log('[Scheduling V2] ✅ Placed', placedSnacks.length, 'snacks');
      }

      // ========================================
      // STEP 5: VALIDATE SCHEDULE
      // ========================================
      console.log('[Scheduling V2] Step 5: Validating final schedule...');

      // Sort blocks by start time
      blocks.sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime));

      // Detect conflicts
      const detectedConflicts = this.detectConflicts(blocks);
      conflicts.push(...detectedConflicts);

      if (conflicts.length > 0) {
        console.error('[Scheduling V2] ❌', conflicts.length, 'conflicts detected');
        conflicts.forEach(c => console.error('  -', c.message));
      } else {
        console.log('[Scheduling V2] ✅ No conflicts detected');
      }

      // Calculate stats
      const stats = this.calculateStats(blocks, preferences);

      const timeline: DailyTimeline = {
        date,
        dayOfWeek: this.formatDayOfWeek(date),
        blocks,
        ...stats,
      };

      console.log('[Scheduling V2] === Scheduling Complete ===');
      console.log('[Scheduling V2] Total blocks:', blocks.length);
      console.log('[Scheduling V2] Conflicts:', conflicts.length);
      console.log('[Scheduling V2] Warnings:', warnings.length);

      return {
        success: conflicts.length === 0,
        timeline,
        conflicts,
        warnings,
        suggestions,
      };
    } catch (error: any) {
      console.error('[Scheduling V2] Fatal error:', error);
      return {
        success: false,
        timeline: {
          date,
          dayOfWeek: this.formatDayOfWeek(date),
          blocks: [],
          totalScheduledMinutes: 0,
          totalFreeMinutes: 0,
          completionRate: 0,
        },
        conflicts: [],
        warnings: [`Scheduling failed: ${error.message}`],
        suggestions: [],
      };
    }
  }

  /**
   * Organize meals by type (breakfast, lunch, dinner, snacks)
   */
  private static organizeMealsByType(meals: TimeBlock[]): {
    breakfast?: TimeBlock;
    lunch?: TimeBlock;
    dinner?: TimeBlock;
    snacks: TimeBlock[];
  } {
    const result: { breakfast?: TimeBlock; lunch?: TimeBlock; dinner?: TimeBlock; snacks: TimeBlock[] } = {
      snacks: [],
    };

    for (const meal of meals) {
      const title = meal.title.toLowerCase();
      if (title.includes('breakfast')) {
        result.breakfast = meal;
      } else if (title.includes('lunch')) {
        result.lunch = meal;
      } else if (title.includes('dinner')) {
        result.dinner = meal;
      } else {
        result.snacks.push(meal);
      }
    }

    return result;
  }

  /**
   * Anchor a meal using target time + flex window strategy
   * Returns placement result with optional warning
   */
  private static anchorMeal(
    meal: TimeBlock,
    config: MealConfig,
    existingBlocks: TimeBlock[],
    eatingWindow: { start: string; end: string } | null,
    lastMealEndTime: number,
    preferences: PlannerPreferences
  ): { success: boolean; block?: TimeBlock; warning?: string } {
    const duration = config.duration;

    // Convert times to minutes
    const targetMinutes = this.timeToMinutes(config.targetTime);
    const flexStartMinutes = this.timeToMinutes(config.flexStart);
    const flexEndMinutes = this.timeToMinutes(config.flexEnd);

    // Apply eating window constraints if fasting
    let effectiveFlexStart = flexStartMinutes;
    let effectiveFlexEnd = flexEndMinutes;

    if (eatingWindow) {
      const eatingStartMinutes = this.timeToMinutes(eatingWindow.start);
      const eatingEndMinutes = this.timeToMinutes(eatingWindow.end);

      // Constrain flex window to eating window
      effectiveFlexStart = Math.max(effectiveFlexStart, eatingStartMinutes);
      effectiveFlexEnd = Math.min(effectiveFlexEnd, eatingEndMinutes - duration);

      console.log('[Scheduling V2] Eating window constraint applied:',
        this.minutesToTime(effectiveFlexStart), '-', this.minutesToTime(effectiveFlexEnd));
    }

    // Enforce minimum gap after last meal.
    // FIX (Bug 2): Apply this as an absolute lower bound on any slot we try,
    // not just on effectiveFlexStart. This prevents findNearestSlot from
    // returning an earlier-than-target slot that violates the minimum gap.
    const absoluteMinStart = lastMealEndTime > 0
      ? lastMealEndTime + config.minGapAfter
      : 0;

    if (effectiveFlexStart < absoluteMinStart) {
      effectiveFlexStart = absoluteMinStart;
      console.log('[Scheduling V2] Min gap enforced, flex start pushed to:', this.minutesToTime(effectiveFlexStart));
    }

    // Validate flex window is still viable after all constraints
    if (effectiveFlexStart + duration > effectiveFlexEnd) {
      console.error('[Scheduling V2] ❌ No viable flex window for', meal.title,
        `(start=${this.minutesToTime(effectiveFlexStart)}, end=${this.minutesToTime(effectiveFlexEnd)})`);
      return {
        success: false,
        warning: `Unable to fit ${meal.title} - eating window too narrow or day too packed`,
      };
    }

    // Rule 1: Try target time first (clamped to effective flex window)
    const clampedTarget = Math.max(effectiveFlexStart, Math.min(targetMinutes, effectiveFlexEnd - duration));
    console.log('[Scheduling V2] Attempting target time:', this.minutesToTime(clampedTarget));
    if (this.isSlotAvailable(clampedTarget, duration, existingBlocks)) {
      console.log('[Scheduling V2] ✅ Target time is available');
      return {
        success: true,
        block: this.createMealBlock(meal, this.minutesToTime(clampedTarget), duration),
      };
    }

    // Rule 2: Scan flex window outward from clamped target.
    // Pass absoluteMinStart as rangeStart so findNearestSlot never returns
    // a slot that would violate the minimum gap after the previous meal.
    console.log('[Scheduling V2] Target blocked, scanning flex window...');
    const bestSlot = this.findNearestSlot(
      clampedTarget,
      effectiveFlexStart,
      effectiveFlexEnd,
      duration,
      existingBlocks
    );

    if (bestSlot !== null) {
      const distanceFromTarget = Math.abs(bestSlot - targetMinutes);
      const warning = distanceFromTarget > 60
        ? `${meal.title} placed ${Math.round(distanceFromTarget / 60)}hr from ideal time (${config.targetTime})`
        : undefined;

      console.log('[Scheduling V2] ✅ Found slot at:', this.minutesToTime(bestSlot));
      return {
        success: true,
        block: this.createMealBlock(meal, this.minutesToTime(bestSlot), duration),
        warning,
      };
    }

    // Rule 3: Last resort - expand ±30 min beyond flex window,
    // but never go below absoluteMinStart (min gap from last meal).
    console.log('[Scheduling V2] Flex window full, expanding search ±30 min...');
    const expandedStart = Math.max(absoluteMinStart, effectiveFlexStart - 30);
    const expandedEnd = Math.min(1440 - duration, effectiveFlexEnd + 30);

    const emergencySlot = this.findNearestSlot(
      clampedTarget,
      expandedStart,
      expandedEnd,
      duration,
      existingBlocks
    );

    if (emergencySlot !== null) {
      console.log('[Scheduling V2] ⚠️ Using expanded slot at:', this.minutesToTime(emergencySlot));
      return {
        success: true,
        block: this.createMealBlock(meal, this.minutesToTime(emergencySlot), duration),
        warning: `${meal.title} placed outside normal window due to conflicts`,
      };
    }

    // Failed to place
    console.error('[Scheduling V2] ❌ No available slot for', meal.title);
    return {
      success: false,
      warning: `Unable to fit ${meal.title} - day is too packed`,
    };
  }

  /**
   * Place workout in 2:00 PM - 7:00 PM window
   */
  private static placeWorkout(
    workout: TimeBlock,
    existingBlocks: TimeBlock[],
    preferences: PlannerPreferences
  ): { success: boolean; block?: TimeBlock; warning?: string } {
    const duration = workout.duration;
    const windowStart = this.timeToMinutes(WORKOUT_WINDOW.start);        // 14:00 (2 PM)
    const windowEnd = this.timeToMinutes(WORKOUT_WINDOW.end) - duration; // 19:00 - duration (7 PM)
    const preferredStart = this.timeToMinutes(WORKOUT_WINDOW.preferredStart); // 14:00
    const preferredEnd = this.timeToMinutes(WORKOUT_WINDOW.preferredEnd) - duration; // 17:00

    // Priority 1: Try preferred zone (2-5 PM) - the gap between lunch and dinner
    console.log('[Scheduling V2] Trying preferred zone (2-5 PM)...');
    for (let time = preferredStart; time <= preferredEnd; time += 15) {
      if (this.isSlotAvailable(time, duration, existingBlocks, 30)) {
        console.log('[Scheduling V2] ✅ Workout placed in preferred zone:', this.minutesToTime(time));
        return {
          success: true,
          block: this.createWorkoutBlock(workout, this.minutesToTime(time), duration),
        };
      }
    }

    // Priority 2: Try 5-7 PM zone (may require shifting dinner)
    console.log('[Scheduling V2] Preferred zone busy, trying 5-7 PM...');
    const fivePM = this.timeToMinutes('17:00'); // Start at actual 5 PM
    for (let time = fivePM; time <= windowEnd; time += 15) {
      if (this.isSlotAvailable(time, duration, existingBlocks, 30)) {
        const workoutEnd = time + duration;
        const dinnerShiftNeeded = this.needsDinnerShift(workoutEnd, existingBlocks);

        const warning = dinnerShiftNeeded
          ? `Workout at ${this.minutesToTime(time)} pushed dinner to later time`
          : undefined;

        console.log('[Scheduling V2] ✅ Workout placed in 5-7 PM zone:', this.minutesToTime(time));
        if (warning) console.warn('[Scheduling V2]', warning);

        return {
          success: true,
          block: this.createWorkoutBlock(workout, this.minutesToTime(time), duration),
          warning,
        };
      }
    }

    // Priority 3: Try shifting dinner if it's blocking workout placement
    console.log('[Scheduling V2] 5-7 PM zone blocked, checking if dinner is the blocker...');
    const dinnerBlockIndex = existingBlocks.findIndex(b => b.title.toLowerCase().includes('dinner'));

    if (dinnerBlockIndex !== -1) {
      console.log('[Scheduling V2] Dinner found - attempting to shift it for workout placement');

      // Temporarily remove dinner
      const dinnerBlock = existingBlocks[dinnerBlockIndex];
      const blocksWithoutDinner = existingBlocks.filter((_, idx) => idx !== dinnerBlockIndex);

      // Try workout placement without dinner blocking
      for (let time = fivePM; time <= windowEnd; time += 15) {
        if (this.isSlotAvailable(time, duration, blocksWithoutDinner, 30)) {
          const workoutEnd = time + duration;
          const newDinnerStart = workoutEnd + 30; // 30 min buffer
          const newDinnerEnd = newDinnerStart + 30; // 30 min dinner duration

          // Verify shifted dinner fits within dinner flex window (17:00-22:00)
          const dinnerFlexStart = this.timeToMinutes(MEAL_CONFIGS.dinner.flexStart);
          const dinnerFlexEnd = this.timeToMinutes(MEAL_CONFIGS.dinner.flexEnd);

          if (newDinnerStart >= dinnerFlexStart && newDinnerEnd <= dinnerFlexEnd) {
            // Check if shifted dinner conflicts with other blocks
            if (this.isSlotAvailable(newDinnerStart, 30, blocksWithoutDinner, 0)) {
              console.log('[Scheduling V2] ✅ Dinner shifted to:', this.minutesToTime(newDinnerStart));
              console.log('[Scheduling V2] ✅ Workout placed at:', this.minutesToTime(time));

              // Remove old dinner from existingBlocks and add shifted dinner
              existingBlocks.splice(dinnerBlockIndex, 1);
              const shiftedDinner: TimeBlock = {
                ...dinnerBlock,
                startTime: this.minutesToTime(newDinnerStart),
                endTime: this.minutesToTime(newDinnerEnd),
              };
              existingBlocks.push(shiftedDinner);

              return {
                success: true,
                block: this.createWorkoutBlock(workout, this.minutesToTime(time), duration),
                warning: `Workout at ${this.minutesToTime(time)} pushed dinner from ${dinnerBlock.startTime} to ${this.minutesToTime(newDinnerStart)}`,
              };
            }
          }
        }
      }

      console.warn('[Scheduling V2] ⚠️ Could not shift dinner - new time outside flex window or conflicts');
    }

    // Failed to place within window
    console.error('[Scheduling V2] ❌ No slot in 2-7 PM window for workout');
    return {
      success: false,
      warning: 'Unable to fit workout in 2-7 PM window - day is too packed',
    };
  }

  /**
   * Fill snacks into remaining gaps (max 2 per day)
   */
  private static fillSnacks(
    snacks: TimeBlock[],
    existingBlocks: TimeBlock[],
    preferences: PlannerPreferences
  ): TimeBlock[] {
    const placed: TimeBlock[] = [];
    const maxSnacks = 2;

    // Find all gaps >= 90 minutes
    const gaps = this.findGaps(existingBlocks, preferences, 90);

    console.log('[Scheduling V2] Found', gaps.length, 'gaps >= 90 min for snacks');

    for (const gap of gaps) {
      if (placed.length >= maxSnacks) break;

      const snack = snacks[placed.length];
      if (!snack) break;

      const snackDuration = 15;
      const gapMidpoint = Math.floor((gap.start + gap.end) / 2);
      const snackStart = gapMidpoint - Math.floor(snackDuration / 2);

      // Check against both existing blocks AND previously placed snacks
      const allBlocks = [...existingBlocks, ...placed];

      // Ensure 30 min gap from adjacent blocks
      if (this.isSlotAvailable(snackStart, snackDuration, allBlocks, 30)) {
        const block = this.createSnackBlock(snack, this.minutesToTime(snackStart), snackDuration);
        placed.push(block);
        console.log('[Scheduling V2] ✅ Snack placed at:', this.minutesToTime(snackStart));
      }
    }

    return placed;
  }

  /**
   * Find all gaps >= minGap minutes between blocks
   */
  private static findGaps(
    blocks: TimeBlock[],
    preferences: PlannerPreferences,
    minGap: number
  ): Array<{ start: number; end: number }> {
    const sortedBlocks = blocks
      .filter(b => !b.isAllDay)
      .sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime));

    const gaps: Array<{ start: number; end: number }> = [];
    const wakeMinutes = this.timeToMinutes(preferences.wakeTime);
    const sleepMinutes = this.timeToMinutes(preferences.sleepTime);

    for (let i = 0; i < sortedBlocks.length - 1; i++) {
      const currentEnd = this.timeToMinutes(sortedBlocks[i].endTime);
      const nextStart = this.timeToMinutes(sortedBlocks[i + 1].startTime);
      const gapSize = nextStart - currentEnd;

      if (gapSize >= minGap) {
        gaps.push({ start: currentEnd, end: nextStart });
      }
    }

    return gaps;
  }

  /**
   * Check if a time slot is available (no overlaps + required buffer)
   */
  private static isSlotAvailable(
    startMinutes: number,
    duration: number,
    blocks: TimeBlock[],
    requiredBuffer: number = 0
  ): boolean {
    const endMinutes = startMinutes + duration;

    for (const block of blocks) {
      if (block.isAllDay) continue;

      const blockStart = this.timeToMinutes(block.startTime);
      const blockEnd = this.timeToMinutes(block.endTime);

      // Check for overlap with buffer
      const candidateStart = startMinutes - requiredBuffer;
      const candidateEnd = endMinutes + requiredBuffer;

      // Handle overnight blocks (e.g., sleep 22:30-06:30)
      const isOvernightBlock = blockEnd < blockStart;

      let overlaps = false;
      if (isOvernightBlock) {
        // Block wraps around midnight - check both segments
        // Night segment: blockStart to end-of-day (1440)
        const overlapsNight = candidateStart < 1440 && candidateEnd > blockStart;
        // Morning segment: start-of-day (0) to blockEnd
        const overlapsMorning = candidateStart < blockEnd && candidateEnd > 0;
        overlaps = overlapsNight || overlapsMorning;
      } else {
        // Normal same-day block: standard interval overlap test.
        // FIX (Bug 1): The original code had two identical boolean expressions
        // joined by ||. A single standard overlap check is correct and sufficient.
        overlaps = candidateStart < blockEnd && candidateEnd > blockStart;
      }

      if (overlaps) return false;
    }

    return true;
  }

  /**
   * Find nearest available slot to target within range
   * Scans outward from target in both directions
   */
  private static findNearestSlot(
    targetMinutes: number,
    rangeStart: number,
    rangeEnd: number,
    duration: number,
    blocks: TimeBlock[]
  ): number | null {
    // Try target first
    if (targetMinutes >= rangeStart && targetMinutes + duration <= rangeEnd) {
      if (this.isSlotAvailable(targetMinutes, duration, blocks)) {
        return targetMinutes;
      }
    }

    // Scan outward in 15-min increments
    let offset = 15;
    const maxOffset = Math.max(targetMinutes - rangeStart, rangeEnd - targetMinutes);

    while (offset <= maxOffset) {
      // Try earlier slot
      const earlierSlot = targetMinutes - offset;
      if (earlierSlot >= rangeStart && earlierSlot + duration <= rangeEnd) {
        if (this.isSlotAvailable(earlierSlot, duration, blocks)) {
          return earlierSlot;
        }
      }

      // Try later slot
      const laterSlot = targetMinutes + offset;
      if (laterSlot >= rangeStart && laterSlot + duration <= rangeEnd) {
        if (this.isSlotAvailable(laterSlot, duration, blocks)) {
          return laterSlot;
        }
      }

      offset += 15;
    }

    return null;
  }

  /**
   * Check if dinner needs to be shifted due to workout
   */
  private static needsDinnerShift(workoutEndMinutes: number, blocks: TimeBlock[]): boolean {
    const dinnerBlock = blocks.find(b => b.title.toLowerCase().includes('dinner'));
    if (!dinnerBlock) return false;

    const dinnerStart = this.timeToMinutes(dinnerBlock.startTime);
    const requiredGap = 30;

    return dinnerStart < workoutEndMinutes + requiredGap;
  }

  /**
   * Detect all conflicts between blocks
   */
  private static detectConflicts(blocks: TimeBlock[]): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];
    const timedBlocks = blocks.filter(b => !b.isAllDay);

    for (let i = 0; i < timedBlocks.length; i++) {
      for (let j = i + 1; j < timedBlocks.length; j++) {
        const block1 = timedBlocks[i];
        const block2 = timedBlocks[j];

        const start1 = this.timeToMinutes(block1.startTime);
        const end1 = this.timeToMinutes(block1.endTime);
        const start2 = this.timeToMinutes(block2.startTime);
        const end2 = this.timeToMinutes(block2.endTime);

        // Handle overnight blocks
        const isOvernight1 = end1 < start1;
        const isOvernight2 = end2 < start2;

        let overlaps = false;

        if (isOvernight1 && isOvernight2) {
          // Both blocks wrap around midnight - they always overlap
          overlaps = true;
        } else if (isOvernight1) {
          // Block1 wraps, Block2 doesn't
          // Check if Block2 overlaps with either segment of Block1
          const overlapsNight = start2 < 1440 && end2 > start1;
          const overlapsMorning = start2 < end1 && end2 > 0;
          overlaps = overlapsNight || overlapsMorning;
        } else if (isOvernight2) {
          // Block2 wraps, Block1 doesn't
          // Check if Block1 overlaps with either segment of Block2
          const overlapsNight = start1 < 1440 && end1 > start2;
          const overlapsMorning = start1 < end2 && end1 > 0;
          overlaps = overlapsNight || overlapsMorning;
        } else {
          // Neither block wraps - normal overlap check
          overlaps =
            (start1 < end2 && end1 > start2) ||
            (start2 < end1 && end2 > start1);
        }

        if (overlaps) {
          conflicts.push({
            type: 'overlap',
            blockIds: [block1.id, block2.id],
            message: `${block1.title} (${block1.startTime}-${block1.endTime}) overlaps with ${block2.title} (${block2.startTime}-${block2.endTime})`,
          });
        }
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

  // ===================================
  // HELPER FUNCTIONS
  // ===================================

  private static createMealBlock(meal: TimeBlock, startTime: string, duration: number): TimeBlock {
    return {
      ...meal,
      startTime,
      endTime: this.addMinutesToTime(startTime, duration),
      duration,
      priority: PRIORITY.MEALS,
      flexibility: 0.5,
      aiGenerated: true,
    };
  }

  private static createWorkoutBlock(workout: TimeBlock, startTime: string, duration: number): TimeBlock {
    return {
      ...workout,
      startTime,
      endTime: this.addMinutesToTime(startTime, duration),
      duration,
      priority: PRIORITY.WORKOUTS,
      flexibility: 0.3,
      aiGenerated: true,
    };
  }

  private static createSnackBlock(snack: TimeBlock, startTime: string, duration: number): TimeBlock {
    return {
      ...snack,
      startTime,
      endTime: this.addMinutesToTime(startTime, duration),
      duration,
      priority: PRIORITY.SNACKS,
      flexibility: 0.8,
      aiGenerated: true,
    };
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  private static addMinutesToTime(time: string, minutesToAdd: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutesToAdd;
    return this.minutesToTime(totalMinutes);
  }

  private static calculateDuration(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return end > start ? end - start : (1440 - start) + end;
  }

  private static generateId(type: string): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static formatDayOfWeek(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  }
}
