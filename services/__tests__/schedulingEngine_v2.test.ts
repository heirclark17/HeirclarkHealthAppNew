/**
 * Test Suite for Priority-Based Scheduling Engine V2
 * Tests realistic meal and workout placement scenarios
 */

import { SchedulingEngineV2 } from '../schedulingEngine_v2';
import { TimeBlock, PlannerPreferences } from '../../types/planner';

// ===================================
// TEST UTILITIES
// ===================================

function createMeal(title: string, type: string = 'meal_eating'): TimeBlock {
  return {
    id: `meal_${Date.now()}_${Math.random()}`,
    type: type as any,
    title,
    startTime: '00:00',
    endTime: '00:00',
    duration: 30,
    status: 'scheduled',
    color: '#10B981',
    icon: 'utensils',
    priority: 3,
    flexibility: 0.5,
    aiGenerated: true,
  };
}

function createWorkout(title: string = 'Push Day'): TimeBlock {
  return {
    id: `workout_${Date.now()}_${Math.random()}`,
    type: 'workout',
    title,
    startTime: '00:00',
    endTime: '00:00',
    duration: 60,
    status: 'scheduled',
    color: '#EF4444',
    icon: 'dumbbell',
    priority: 4,
    flexibility: 0.3,
    aiGenerated: true,
  };
}

function createCalendarEvent(title: string, startTime: string, endTime: string): TimeBlock {
  return {
    id: `event_${Date.now()}_${Math.random()}`,
    type: 'calendar_event',
    title,
    startTime,
    endTime,
    duration: calculateDuration(startTime, endTime),
    status: 'scheduled',
    color: '#3B82F6',
    icon: 'calendar',
    priority: 2,
    flexibility: 0,
    aiGenerated: false,
  };
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

const DEFAULT_PREFS: PlannerPreferences = {
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyPeak: 'morning',
  flexibility: 'somewhat',
  calendarSyncEnabled: true,
  priorities: ['health', 'work'],
};

// ===================================
// TEST CASE 1: CLEAN DAY (No Conflicts)
// ===================================

describe('SchedulingEngineV2 - Test Case 1: Clean Day', () => {
  test('should place breakfast at 8 AM, lunch at 12 PM, dinner at 6:30 PM, workout at 2 PM', () => {
    const meals = [
      createMeal('Breakfast - Scrambled Eggs'),
      createMeal('Lunch - Chicken Salad Bowl'),
      createMeal('Dinner - Baked Salmon'),
    ];

    const workout = createWorkout('Push Day');

    const result = SchedulingEngineV2.buildDailySchedule(
      '2026-02-20',
      [], // No calendar events
      { start: '22:30', end: '06:30' },
      null, // No eating window (not fasting)
      meals,
      workout,
      DEFAULT_PREFS
    );

    // Assertions
    expect(result.success).toBe(true);
    expect(result.conflicts).toHaveLength(0);

    const breakfast = result.timeline.blocks.find(b => b.title.includes('Eggs'));
    const lunch = result.timeline.blocks.find(b => b.title.includes('Salad'));
    const dinner = result.timeline.blocks.find(b => b.title.includes('Salmon'));
    const workoutBlock = result.timeline.blocks.find(b => b.title.includes('Push'));

    // Breakfast should be at target time (8:00 AM)
    expect(breakfast?.startTime).toBe('08:00');

    // Lunch should be at target time (12:00 PM)
    expect(lunch?.startTime).toBe('12:00');

    // Dinner should be at target time (6:30 PM)
    expect(dinner?.startTime).toBe('18:30');

    // Workout should be in 2-5 PM preferred zone
    expect(workoutBlock?.startTime).toMatch(/^(14|15|16):/); // Between 2-5 PM

    console.log('✅ Test Case 1 PASSED: Clean day scheduled correctly');
    console.log('   Breakfast:', breakfast?.startTime);
    console.log('   Lunch:', lunch?.startTime);
    console.log('   Workout:', workoutBlock?.startTime);
    console.log('   Dinner:', dinner?.startTime);
  });
});

// ===================================
// TEST CASE 2: PACKED LUNCH WINDOW
// ===================================

describe('SchedulingEngineV2 - Test Case 2: Packed Lunch Window', () => {
  test('should shift lunch earlier/later when 11 AM-2 PM is blocked', () => {
    const meals = [
      createMeal('Breakfast - Oatmeal'),
      createMeal('Lunch - Turkey Wrap'),
      createMeal('Dinner - Grilled Chicken'),
    ];

    const calendarEvents = [
      createCalendarEvent('Team Standup', '11:00', '11:30'),
      createCalendarEvent('Client Call', '11:45', '13:00'),
      createCalendarEvent('Code Review', '13:15', '14:00'),
    ];

    const workout = createWorkout('Leg Day');

    const result = SchedulingEngineV2.buildDailySchedule(
      '2026-02-20',
      calendarEvents,
      { start: '22:30', end: '06:30' },
      null,
      meals,
      workout,
      DEFAULT_PREFS
    );

    // Assertions
    expect(result.success).toBe(true);

    const lunch = result.timeline.blocks.find(b => b.title.includes('Wrap'));

    // Lunch should be pushed outside the blocked window
    // Either before 11:00 or after 14:00
    const lunchTime = lunch?.startTime || '';
    const lunchMinutes = parseInt(lunchTime.split(':')[0]) * 60 + parseInt(lunchTime.split(':')[1]);

    const isBeforeBlock = lunchMinutes + 30 <= 11 * 60; // Before 11 AM
    const isAfterBlock = lunchMinutes >= 14 * 60;       // After 2 PM

    expect(isBeforeBlock || isAfterBlock).toBe(true);

    // Should have at least one warning about lunch placement
    expect(result.warnings.length).toBeGreaterThan(0);

    console.log('✅ Test Case 2 PASSED: Lunch shifted around packed calendar');
    console.log('   Lunch placed at:', lunch?.startTime);
    console.log('   Warnings:', result.warnings);
  });
});

// ===================================
// TEST CASE 3: WORKOUT AT 5:30 PM
// ===================================

describe('SchedulingEngineV2 - Test Case 3: Late Workout Forces Dinner Shift', () => {
  test('should push dinner to after 6:30 PM when workout is at 5:30 PM', () => {
    const meals = [
      createMeal('Breakfast - Protein Pancakes'),
      createMeal('Lunch - Quinoa Bowl'),
      createMeal('Dinner - Steak and Veggies'),
    ];

    const calendarEvents = [
      createCalendarEvent('Morning Meeting', '09:00', '10:00'),
      // Afternoon is packed, forcing workout to 5:30 PM
      createCalendarEvent('Planning Session', '14:00', '15:30'),
      createCalendarEvent('1:1 with Manager', '16:00', '17:00'),
    ];

    const workout = createWorkout('Upper Body');

    const result = SchedulingEngineV2.buildDailySchedule(
      '2026-02-20',
      calendarEvents,
      { start: '22:30', end: '06:30' },
      null,
      meals,
      workout,
      DEFAULT_PREFS
    );

    // Assertions
    expect(result.success).toBe(true);

    const workoutBlock = result.timeline.blocks.find(b => b.title.includes('Upper'));
    const dinner = result.timeline.blocks.find(b => b.title.includes('Steak'));

    // Workout should be in 5-7 PM range (since 2-5 PM is blocked)
    const workoutTime = workoutBlock?.startTime || '';
    const workoutHour = parseInt(workoutTime.split(':')[0]);
    expect(workoutHour).toBeGreaterThanOrEqual(17); // 5 PM or later
    expect(workoutHour).toBeLessThan(19); // Before 7 PM

    // Dinner should be pushed to AFTER workout + 30 min buffer
    const workoutEnd = calculateDuration(workoutBlock?.startTime || '', workoutBlock?.endTime || '');
    const workoutEndMinutes = parseInt((workoutBlock?.startTime || '').split(':')[0]) * 60
      + parseInt((workoutBlock?.startTime || '').split(':')[1]) + workoutEnd;

    const dinnerStartMinutes = parseInt((dinner?.startTime || '').split(':')[0]) * 60
      + parseInt((dinner?.startTime || '').split(':')[1]);

    expect(dinnerStartMinutes).toBeGreaterThanOrEqual(workoutEndMinutes + 30);

    // Should have warning about dinner being pushed
    const hasDinnerWarning = result.warnings.some(w => w.includes('dinner') || w.includes('Workout'));
    expect(hasDinnerWarning).toBe(true);

    console.log('✅ Test Case 3 PASSED: Late workout forced dinner to shift');
    console.log('   Workout:', workoutBlock?.startTime, '-', workoutBlock?.endTime);
    console.log('   Dinner:', dinner?.startTime, '(pushed later)');
    console.log('   Warnings:', result.warnings);
  });
});

// ===================================
// TEST CASE 4: INTERMITTENT FASTING
// ===================================

describe('SchedulingEngineV2 - Test Case 4: Fasting Window Constraints', () => {
  test('should constrain all meals to 12 PM - 8 PM eating window', () => {
    const meals = [
      createMeal('Breakfast - First Meal'),
      createMeal('Lunch - Second Meal'),
      createMeal('Dinner - Third Meal'),
    ];

    const workout = createWorkout('HIIT');

    const result = SchedulingEngineV2.buildDailySchedule(
      '2026-02-20',
      [],
      { start: '22:30', end: '06:30' },
      { start: '12:00', end: '20:00' }, // Eating window: 12 PM - 8 PM
      meals,
      workout,
      DEFAULT_PREFS
    );

    // Assertions
    expect(result.success).toBe(true);

    // ALL meals must be within eating window
    const mealBlocks = result.timeline.blocks.filter(b => b.type === 'meal_eating');

    for (const meal of mealBlocks) {
      const startMinutes = parseInt(meal.startTime.split(':')[0]) * 60
        + parseInt(meal.startTime.split(':')[1]);
      const endMinutes = parseInt(meal.endTime.split(':')[0]) * 60
        + parseInt(meal.endTime.split(':')[1]);

      // Start must be >= 12:00 (720 min)
      expect(startMinutes).toBeGreaterThanOrEqual(12 * 60);

      // End must be <= 20:00 (1200 min)
      expect(endMinutes).toBeLessThanOrEqual(20 * 60);
    }

    console.log('✅ Test Case 4 PASSED: All meals within fasting eating window');
    mealBlocks.forEach(m => console.log('   Meal:', m.title, m.startTime, '-', m.endTime));
  });
});

// ===================================
// TEST CASE 5: SNACK PLACEMENT
// ===================================

describe('SchedulingEngineV2 - Test Case 5: Snack Placement in Gaps', () => {
  test('should place max 2 snacks in gaps >= 90 minutes', () => {
    const meals = [
      createMeal('Breakfast Bowl'),
      createMeal('Lunch Salad'),
      createMeal('Dinner Pasta'),
    ];

    const snacks = [
      createMeal('Apple with Almond Butter'),
      createMeal('Greek Yogurt'),
      createMeal('Protein Shake'), // Should be dropped (max 2)
    ];

    const workout = createWorkout('Cardio');

    const result = SchedulingEngineV2.buildDailySchedule(
      '2026-02-20',
      [],
      { start: '22:30', end: '06:30' },
      null,
      [...meals, ...snacks],
      workout,
      DEFAULT_PREFS
    );

    // Assertions
    expect(result.success).toBe(true);

    const snackBlocks = result.timeline.blocks.filter(b =>
      b.title.includes('Almond') || b.title.includes('Yogurt') || b.title.includes('Shake')
    );

    // Should have at most 2 snacks
    expect(snackBlocks.length).toBeLessThanOrEqual(2);

    // Each snack should be at least 30 min from adjacent blocks
    for (const snack of snackBlocks) {
      const snackStart = parseInt(snack.startTime.split(':')[0]) * 60
        + parseInt(snack.startTime.split(':')[1]);
      const snackEnd = parseInt(snack.endTime.split(':')[0]) * 60
        + parseInt(snack.endTime.split(':')[1]);

      const adjacentBlocks = result.timeline.blocks.filter(b => b.id !== snack.id && !b.isAllDay);

      for (const adj of adjacentBlocks) {
        const adjStart = parseInt(adj.startTime.split(':')[0]) * 60
          + parseInt(adj.startTime.split(':')[1]);
        const adjEnd = parseInt(adj.endTime.split(':')[0]) * 60
          + parseInt(adj.endTime.split(':')[1]);

        const gapBefore = snackStart - adjEnd;
        const gapAfter = adjStart - snackEnd;

        // If adjacent, should have 30 min gap
        if (Math.abs(gapBefore) < 120 || Math.abs(gapAfter) < 120) {
          expect(Math.min(Math.abs(gapBefore), Math.abs(gapAfter))).toBeGreaterThanOrEqual(30);
        }
      }
    }

    console.log('✅ Test Case 5 PASSED: Snacks placed correctly with gaps');
    console.log('   Snacks placed:', snackBlocks.length);
    snackBlocks.forEach(s => console.log('   -', s.title, 'at', s.startTime));
  });
});

// ===================================
// RUN ALL TESTS
// ===================================

console.log('\n========================================');
console.log('🧪 Running Scheduling Engine V2 Tests');
console.log('========================================\n');
