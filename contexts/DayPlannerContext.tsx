/**
 * DayPlannerContext - State management for AI-Powered Day & Week Planner
 * Manages onboarding, weekly plans, calendar sync, and AI optimization
 *
 * Integrates with TrainingContext and MealPlanContext to pull real workout
 * and meal data into the daily timeline scheduling engine.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// expo-calendar requires a native build with ExpoCalendar module.
// Completely deferred - no require() at module level to avoid crash on
// dev clients that don't have it built in yet.
let _Calendar: any = null;
let _calendarChecked = false;

function getCalendar(): any {
  if (_calendarChecked) return _Calendar;
  _calendarChecked = true;
  try {
    // Probe for native module without triggering Metro's global error handler.
    // requireOptionalNativeModule returns null instead of throwing.
    const core = require('expo-modules-core');
    if (core.requireOptionalNativeModule) {
      const nativeMod = core.requireOptionalNativeModule('ExpoCalendar');
      if (!nativeMod) {
        console.warn('[Planner] expo-calendar native module not available - calendar sync disabled');
        _Calendar = null;
        return null;
      }
    }
    // String concat hides from Metro static analysis so module isn't eagerly evaluated.
    const mod = 'expo-' + 'calendar';
    _Calendar = require(mod);
  } catch (e) {
    console.warn('[Planner] expo-calendar native module not available - calendar sync disabled');
    _Calendar = null;
  }
  return _Calendar;
}
import { api } from '../services/api';
import { SchedulingEngine } from '../services/schedulingEngine';
import { useTraining } from './TrainingContext';
import { useMealPlan } from './MealPlanContext';
import {
  PlannerPreferences,
  WeeklyPlan,
  DailyTimeline,
  TimeBlock,
  AIOptimization,
  DeviceCalendarEvent,
  SchedulingRequest,
  CompletionHistory,
  PLANNER_CONSTANTS,
} from '../types/planner';

// AsyncStorage keys
const STORAGE_KEYS = {
  ONBOARDING: 'hc_planner_onboarding',
  WEEKLY_PLAN: 'hc_planner_weekly_plan',
  CALENDAR_PERMISSION: 'hc_planner_calendar_permission',
  AI_OPTIMIZATION: 'hc_planner_ai_optimization',
};

interface DayPlannerState {
  // Onboarding
  hasCompletedOnboarding: boolean;
  preferences: PlannerPreferences | null;

  // Weekly plan
  weeklyPlan: WeeklyPlan | null;
  selectedDayIndex: number; // 0-6 (Sunday-Saturday)

  // Calendar (CLIENT-SIDE ONLY)
  calendarPermission: boolean;
  deviceCalendarEvents: DeviceCalendarEvent[];
  lastCalendarSync: string | null;

  // AI optimization
  aiOptimization: AIOptimization | null;

  // Loading states
  isGeneratingPlan: boolean;
  isSyncingCalendar: boolean;
  isOptimizing: boolean;

  // Errors
  error: string | null;
}

interface DayPlannerActions {
  completeOnboarding: (preferences: PlannerPreferences) => Promise<void>;
  reopenOnboarding: () => void;
  generateWeeklyPlan: () => Promise<void>;
  syncCalendar: () => Promise<boolean>;
  markBlockComplete: (blockId: string, date: string) => Promise<void>;
  skipBlock: (blockId: string, date: string) => Promise<void>;
  updateBlockTime: (blockId: string, date: string, newStartTime: string) => Promise<void>;
  requestWeeklyOptimization: () => Promise<void>;
  setSelectedDay: (dayIndex: number) => void;
  setSelectedDate: (dateStr: string) => void;
  clearError: () => void;
}

interface DayPlannerContextValue {
  state: DayPlannerState;
  actions: DayPlannerActions;
}

const DayPlannerContext = createContext<DayPlannerContextValue | undefined>(undefined);

// ============================================================================
// Helper functions (pure, no hooks)
// ============================================================================

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a "YYYY-MM-DD" string as a local-timezone date (not UTC).
 * new Date("2026-02-16") is parsed as UTC midnight, which can shift the day.
 * This function avoids that by manually extracting year/month/day.
 */
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const addMinutesToTime = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Map a day-of-week name to an index (0=Sunday).
 */
const dayNameToIndex = (name: string): number => {
  const map: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };
  return map[name] ?? -1;
};

// ============================================================================
// Provider
// ============================================================================

export function DayPlannerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DayPlannerState>({
    hasCompletedOnboarding: false,
    preferences: null,
    weeklyPlan: null,
    selectedDayIndex: new Date().getDay(), // Today (0=Sun)
    calendarPermission: false,
    deviceCalendarEvents: [],
    lastCalendarSync: null,
    aiOptimization: null,
    isGeneratingPlan: false,
    isSyncingCalendar: false,
    isOptimizing: false,
    error: null,
  });

  // Access sibling contexts for workout and meal data.
  // These are safe because DayPlannerProvider is nested inside
  // TrainingProvider and MealPlanProvider in _layout.tsx.
  let trainingCtx: any = null;
  try {
    trainingCtx = useTraining();
  } catch {
    // TrainingContext not available
  }

  let mealPlanCtx: any = null;
  try {
    mealPlanCtx = useMealPlan();
  } catch {
    // MealPlanContext not available
  }

  // Store refs so async callbacks can access latest values without stale closures.
  const trainingRef = useRef(trainingCtx);
  trainingRef.current = trainingCtx;
  const mealPlanRef = useRef(mealPlanCtx);
  mealPlanRef.current = mealPlanCtx;
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
  }, []);

  /**
   * Load cached data from AsyncStorage
   */
  const loadCachedData = async () => {
    try {
      // Load onboarding
      const onboardingData = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
      if (onboardingData) {
        const preferences = JSON.parse(onboardingData);
        setState((prev) => ({
          ...prev,
          hasCompletedOnboarding: true,
          preferences,
        }));
      }

      // Load weekly plan
      const weeklyPlanData = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_PLAN);
      if (weeklyPlanData) {
        const weeklyPlan = JSON.parse(weeklyPlanData);
        setState((prev) => ({ ...prev, weeklyPlan }));
      }

      // Load calendar permission
      const calendarPerm = await AsyncStorage.getItem(STORAGE_KEYS.CALENDAR_PERMISSION);
      if (calendarPerm) {
        setState((prev) => ({ ...prev, calendarPermission: calendarPerm === 'true' }));
      }

      // Load AI optimization
      const aiOptData = await AsyncStorage.getItem(STORAGE_KEYS.AI_OPTIMIZATION);
      if (aiOptData) {
        const aiOptimization = JSON.parse(aiOptData);
        setState((prev) => ({ ...prev, aiOptimization }));
      }

      console.log('[Planner] Cached data loaded');
    } catch (error) {
      console.error('[Planner] Error loading cached data:', error);
    }
  };

  /**
   * Complete onboarding and save preferences
   */
  const completeOnboarding = useCallback(async (preferences: PlannerPreferences) => {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(preferences));

      // Save to backend (fire-and-forget)
      api.savePlannerOnboarding(preferences).catch((err: any) =>
        console.warn('[Planner] Backend onboarding save failed:', err)
      );

      setState((prev) => ({
        ...prev,
        hasCompletedOnboarding: true,
        preferences,
      }));

      console.log('[Planner] Onboarding completed');
    } catch (error: any) {
      console.error('[Planner] Onboarding save error:', error);
      setState((prev) => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // ========================================================================
  // Workout + Meal Block Extraction
  // ========================================================================

  /**
   * Extract workout TimeBlocks from the TrainingContext for a given day.
   * Falls back to generating a default workout block if training data
   * is not available but the user has 'health' as a priority.
   */
  const getWorkoutBlocksForDay = useCallback((date: Date, preferences: PlannerPreferences): TimeBlock[] => {
    const training = trainingRef.current;
    const dayOfWeek = DAY_NAMES[date.getDay()]; // "Monday", etc.

    // Try to get real workout data from TrainingContext
    if (training?.state?.weeklyPlan?.days) {
      const trainingDays = training.state.weeklyPlan.days;
      const trainingDay = trainingDays.find(
        (d: any) => d.dayOfWeek === dayOfWeek
      );

      if (trainingDay && trainingDay.workout && !trainingDay.isRestDay) {
        const workout = trainingDay.workout;
        const durationMin = workout.duration || workout.estimatedDuration || 45;

        return [{
          id: `workout_${date.getTime()}_${workout.id || 'main'}`,
          type: 'workout' as const,
          title: workout.name || `${workout.type || 'Workout'} Day`,
          startTime: '00:00', // placeholder -- scheduling engine will place it
          endTime: '00:00',
          duration: durationMin,
          status: trainingDay.completed ? 'completed' as const : 'scheduled' as const,
          color: PLANNER_CONSTANTS.BLOCK_COLORS.workout,
          icon: PLANNER_CONSTANTS.BLOCK_ICONS.workout,
          priority: 4,
          flexibility: 0.5,
          aiGenerated: true,
          relatedId: workout.id,
        }];
      }

      // Rest day -- no workout
      if (trainingDay?.isRestDay) {
        return [];
      }
    }

    // Fallback: if no training plan exists but user prioritizes health,
    // generate a default workout block for weekdays.
    const dayIdx = date.getDay();
    const isWeekday = dayIdx >= 1 && dayIdx <= 5;
    const prioritizesHealth = preferences.priorities.includes('health');
    if (prioritizesHealth && isWeekday) {
      return [{
        id: `workout_default_${date.getTime()}`,
        type: 'workout' as const,
        title: 'Workout',
        startTime: '00:00',
        endTime: '00:00',
        duration: 45,
        status: 'scheduled' as const,
        color: PLANNER_CONSTANTS.BLOCK_COLORS.workout,
        icon: PLANNER_CONSTANTS.BLOCK_ICONS.workout,
        priority: 4,
        flexibility: 0.5,
        aiGenerated: true,
      }];
    }

    return [];
  }, []);

  /**
   * Extract meal TimeBlocks from the MealPlanContext for a given day.
   * Falls back to generating default meal blocks (breakfast, lunch, dinner)
   * based on user preferences.
   */
  const getMealBlocksForDay = useCallback((date: Date, preferences: PlannerPreferences): TimeBlock[] => {
    const mealPlan = mealPlanRef.current;
    const dayOfWeek = date.getDay(); // 0=Sun

    // Try to get real meal data from MealPlanContext
    if (mealPlan?.state?.weeklyPlan) {
      const weeklyMealPlan = mealPlan.state.weeklyPlan;
      // MealPlan uses dayNumber 1-7 (Mon=1, Sun=7) or may index 0-6
      // The DayPlan has a dayNumber field and a date field.
      // Try to match by day name or by day-of-week number.
      const targetDayName = DAY_NAMES[dayOfWeek];
      const mealDay = weeklyMealPlan.find((d: any) => {
        if (d.dayName === targetDayName) return true;
        // Also match by dayNumber: 1=Monday .. 7=Sunday convention
        const mappedDayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
        return d.dayNumber === mappedDayNum;
      });

      if (mealDay?.meals?.length > 0) {
        return mealDay.meals.map((meal: any) => {
          const totalTime = (meal.prepTime || 15) + (meal.cookTime || 15);
          const eatingTime = 30; // eating duration

          return {
            id: `meal_${date.getTime()}_${meal.id || meal.mealType}`,
            type: 'meal_eating' as const,
            title: `${capitalize(meal.mealType)}: ${meal.name}`,
            startTime: '00:00', // scheduling engine will place it
            endTime: '00:00',
            duration: eatingTime,
            status: 'scheduled' as const,
            color: PLANNER_CONSTANTS.BLOCK_COLORS.meal_eating,
            icon: PLANNER_CONSTANTS.BLOCK_ICONS.meal_eating,
            priority: 3,
            flexibility: 0.5,
            aiGenerated: true,
            relatedId: meal.id,
          };
        });
      }
    }

    // Fallback: generate default meal blocks
    const defaultMeals = [
      { type: 'breakfast', title: 'Breakfast', duration: 30 },
      { type: 'lunch', title: 'Lunch', duration: 30 },
      { type: 'dinner', title: 'Dinner', duration: 45 },
    ];

    return defaultMeals.map((meal) => ({
      id: `meal_default_${date.getTime()}_${meal.type}`,
      type: 'meal_eating' as const,
      title: meal.title,
      startTime: '00:00',
      endTime: '00:00',
      duration: meal.duration,
      status: 'scheduled' as const,
      color: PLANNER_CONSTANTS.BLOCK_COLORS.meal_eating,
      icon: PLANNER_CONSTANTS.BLOCK_ICONS.meal_eating,
      priority: 3,
      flexibility: 0.5,
      aiGenerated: true,
    }));
  }, []);

  // ========================================================================
  // Plan Generation
  // ========================================================================

  /**
   * Generate weekly plan (7 daily timelines)
   */
  const generateWeeklyPlan = useCallback(async () => {
    const currentPrefs = stateRef.current.preferences;
    if (!currentPrefs) {
      console.error('[Planner] Cannot generate plan without preferences');
      Alert.alert('Setup Required', 'Please complete the planner setup first.');
      return;
    }

    setState((prev) => ({ ...prev, isGeneratingPlan: true, error: null }));

    try {
      // Calculate Sunday of current week
      const today = new Date();
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - today.getDay());
      sunday.setHours(0, 0, 0, 0);

      // Generate 7 daily timelines
      const days: DailyTimeline[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + i);

        const timeline = generateDailyTimeline(date, currentPrefs);
        days.push(timeline);
      }

      // Calculate weekly stats
      const weeklyStats = calculateWeeklyStats(days);

      const weeklyPlan: WeeklyPlan = {
        weekStartDate: formatLocalDate(sunday),
        days,
        weeklyStats,
        generatedAt: new Date().toISOString(),
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PLAN, JSON.stringify(weeklyPlan));

      // Save to backend (fire-and-forget)
      api.saveWeeklyPlan(weeklyPlan).catch((err: any) =>
        console.warn('[Planner] Backend weekly plan save failed:', err)
      );

      setState((prev) => ({
        ...prev,
        weeklyPlan,
        isGeneratingPlan: false,
      }));

      console.log('[Planner] Weekly plan generated with', days.reduce((s, d) => s + d.blocks.length, 0), 'total blocks');
    } catch (error: any) {
      console.error('[Planner] Generation error:', error);
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to generate plan',
        isGeneratingPlan: false,
      }));
    }
  }, [getWorkoutBlocksForDay, getMealBlocksForDay]);

  /**
   * Generate daily timeline for a specific date (synchronous -- no async needed).
   */
  const generateDailyTimeline = (date: Date, preferences: PlannerPreferences): DailyTimeline => {
    const dateStr = formatLocalDate(date);

    // Extract real workouts from TrainingContext
    const workoutBlocks = getWorkoutBlocksForDay(date, preferences);

    // Extract real meals from MealPlanContext
    const mealBlocks = getMealBlocksForDay(date, preferences);

    // Get calendar events (CLIENT-SIDE ONLY)
    const currentEvents = stateRef.current.deviceCalendarEvents;
    const calendarBlocks = currentEvents
      .filter((event) => isSameDay(event.startDate, date))
      .map((event) => convertCalendarEventToBlock(event));

    // Build scheduling request
    const request: SchedulingRequest = {
      date: dateStr,
      preferences,
      workoutBlocks,
      mealBlocks,
      calendarBlocks,
    };

    // Run scheduling engine
    const result = SchedulingEngine.generateTimeline(request);

    if (!result.success) {
      console.warn(`[Planner] Timeline for ${dateStr} has conflicts:`, result.conflicts);
    }

    return result.timeline;
  };

  // ========================================================================
  // Calendar Sync
  // ========================================================================

  /**
   * Sync calendar events from device (CLIENT-SIDE ONLY).
   * Shows user-facing Alert on failure instead of silently swallowing.
   */
  const syncCalendar = useCallback(async (): Promise<boolean> => {
    const Cal = getCalendar();
    if (!Cal) {
      Alert.alert(
        'Calendar Unavailable',
        'Calendar sync requires a native build with expo-calendar. It is not available in this development build.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Check/request permission
    const currentState = stateRef.current;
    if (!currentState.calendarPermission) {
      const { status } = await Cal.requestCalendarPermissionsAsync();
      const granted = status === 'granted';
      setState((prev) => ({ ...prev, calendarPermission: granted }));
      await AsyncStorage.setItem(STORAGE_KEYS.CALENDAR_PERMISSION, granted.toString());

      if (!granted) {
        Alert.alert(
          'Permission Denied',
          'Calendar access was denied. You can enable it in Settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }

    setState((prev) => ({ ...prev, isSyncingCalendar: true }));

    try {
      // Get all calendars
      const calendars = await Cal.getCalendarsAsync(Cal.EntityTypes.EVENT);

      // Get events for next 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const events: DeviceCalendarEvent[] = [];
      for (const calendar of calendars) {
        const calendarEvents = await Cal.getEventsAsync(
          [calendar.id],
          startDate,
          endDate
        );
        events.push(
          ...calendarEvents.map((e: any) => ({
            id: e.id,
            title: e.title,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
            isAllDay: e.allDay,
          }))
        );
      }

      // Store CLIENT-SIDE ONLY (never sent to backend)
      setState((prev) => ({
        ...prev,
        deviceCalendarEvents: events,
        lastCalendarSync: new Date().toISOString(),
        isSyncingCalendar: false,
      }));

      Alert.alert('Calendar Synced', `${events.length} events imported from your calendar.`);
      console.log(`[Planner] Synced ${events.length} calendar events (client-side only)`);
      return true;
    } catch (error: any) {
      console.error('[Planner] Calendar sync error:', error);
      setState((prev) => ({
        ...prev,
        isSyncingCalendar: false,
        error: error.message,
      }));
      Alert.alert('Sync Failed', 'Could not sync calendar events. Please try again.');
      return false;
    }
  }, []);

  // ========================================================================
  // Block status updates
  // ========================================================================

  /**
   * Mark a time block as completed
   */
  const markBlockComplete = useCallback(async (blockId: string, date: string) => {
    const currentPlan = stateRef.current.weeklyPlan;
    if (!currentPlan) return;

    const updatedPlan = { ...currentPlan, days: [...currentPlan.days] };
    const dayIndex = updatedPlan.days.findIndex((d) => d.date === date);
    if (dayIndex === -1) return;

    updatedPlan.days[dayIndex] = { ...updatedPlan.days[dayIndex], blocks: [...updatedPlan.days[dayIndex].blocks] };
    const blockIndex = updatedPlan.days[dayIndex].blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    updatedPlan.days[dayIndex].blocks[blockIndex] = { ...updatedPlan.days[dayIndex].blocks[blockIndex], status: 'completed' };
    updatedPlan.days[dayIndex].completionRate = calculateCompletionRate(updatedPlan.days[dayIndex].blocks);

    // Save
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PLAN, JSON.stringify(updatedPlan));
    api.updateBlockStatus(blockId, 'completed', date).catch(() => {});

    setState((prev) => ({ ...prev, weeklyPlan: updatedPlan }));
    console.log(`[Planner] Block ${blockId} marked complete`);
  }, []);

  /**
   * Skip a time block
   */
  const skipBlock = useCallback(async (blockId: string, date: string) => {
    const currentPlan = stateRef.current.weeklyPlan;
    if (!currentPlan) return;

    const updatedPlan = { ...currentPlan, days: [...currentPlan.days] };
    const dayIndex = updatedPlan.days.findIndex((d) => d.date === date);
    if (dayIndex === -1) return;

    updatedPlan.days[dayIndex] = { ...updatedPlan.days[dayIndex], blocks: [...updatedPlan.days[dayIndex].blocks] };
    const blockIndex = updatedPlan.days[dayIndex].blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    updatedPlan.days[dayIndex].blocks[blockIndex] = { ...updatedPlan.days[dayIndex].blocks[blockIndex], status: 'skipped' };
    updatedPlan.days[dayIndex].completionRate = calculateCompletionRate(updatedPlan.days[dayIndex].blocks);

    // Save
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PLAN, JSON.stringify(updatedPlan));
    api.updateBlockStatus(blockId, 'skipped', date).catch(() => {});

    setState((prev) => ({ ...prev, weeklyPlan: updatedPlan }));
    console.log(`[Planner] Block ${blockId} skipped`);
  }, []);

  /**
   * Update block start time (drag-and-drop)
   */
  const updateBlockTime = useCallback(async (blockId: string, date: string, newStartTime: string) => {
    const currentPlan = stateRef.current.weeklyPlan;
    if (!currentPlan) return;

    const updatedPlan = { ...currentPlan, days: [...currentPlan.days] };
    const dayIndex = updatedPlan.days.findIndex((d) => d.date === date);
    if (dayIndex === -1) return;

    updatedPlan.days[dayIndex] = { ...updatedPlan.days[dayIndex], blocks: [...updatedPlan.days[dayIndex].blocks] };
    const blockIndex = updatedPlan.days[dayIndex].blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    const block = { ...updatedPlan.days[dayIndex].blocks[blockIndex] };
    block.startTime = newStartTime;
    block.endTime = addMinutesToTime(newStartTime, block.duration);
    updatedPlan.days[dayIndex].blocks[blockIndex] = block;

    // Save
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PLAN, JSON.stringify(updatedPlan));
    api.updateBlockTime(blockId, newStartTime, block.endTime, date).catch(() => {});

    setState((prev) => ({ ...prev, weeklyPlan: updatedPlan }));
    console.log(`[Planner] Block ${blockId} rescheduled to ${newStartTime}`);
  }, []);

  /**
   * Request AI weekly optimization
   */
  const requestWeeklyOptimization = useCallback(async () => {
    const currentPlan = stateRef.current.weeklyPlan;
    if (!currentPlan) {
      console.error('[Planner] Cannot optimize without weekly plan');
      return;
    }

    setState((prev) => ({ ...prev, isOptimizing: true }));

    try {
      const completionHistory = buildCompletionHistory(currentPlan);

      const optimization = await api.getWeeklyOptimization({
        currentWeekPlan: currentPlan,
        completionHistory,
      });

      if (!optimization) {
        throw new Error('No optimization data returned');
      }

      // Cache for 7 days
      await AsyncStorage.setItem(STORAGE_KEYS.AI_OPTIMIZATION, JSON.stringify(optimization));

      setState((prev) => ({
        ...prev,
        aiOptimization: optimization,
        isOptimizing: false,
      }));

      console.log('[Planner] AI optimization completed');
    } catch (error: any) {
      console.error('[Planner] Optimization error:', error);
      setState((prev) => ({
        ...prev,
        isOptimizing: false,
        error: error.message,
      }));
    }
  }, []);

  /**
   * Set selected day index
   */
  const setSelectedDay = useCallback((dayIndex: number) => {
    setState((prev) => ({ ...prev, selectedDayIndex: dayIndex }));
  }, []);

  /**
   * Set selected day by date string (YYYY-MM-DD).
   * Finds the matching day in the weekly plan and updates selectedDayIndex.
   */
  const setSelectedDate = useCallback((dateStr: string) => {
    const currentPlan = stateRef.current.weeklyPlan;
    if (currentPlan) {
      const idx = currentPlan.days.findIndex((d) => d.date === dateStr);
      if (idx !== -1) {
        setState((prev) => ({ ...prev, selectedDayIndex: idx }));
        return;
      }
    }
    // If date is not in current weekly plan, still update index based on day of week
    const date = parseLocalDate(dateStr);
    setState((prev) => ({ ...prev, selectedDayIndex: date.getDay() }));
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reopenOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, hasCompletedOnboarding: false }));
  }, []);

  // ========================================================================
  // Internal helpers
  // ========================================================================

  const calculateWeeklyStats = (days: DailyTimeline[]) => {
    const workoutsCompleted = days.reduce(
      (sum, day) => sum + day.blocks.filter((b) => b.type === 'workout' && b.status === 'completed').length,
      0
    );
    const workoutsScheduled = days.reduce(
      (sum, day) => sum + day.blocks.filter((b) => b.type === 'workout').length,
      0
    );
    const mealsCompleted = days.reduce(
      (sum, day) =>
        sum +
        day.blocks.filter(
          (b) => (b.type === 'meal_eating' || b.type === 'meal_prep') && b.status === 'completed'
        ).length,
      0
    );
    const mealsScheduled = days.reduce(
      (sum, day) =>
        sum + day.blocks.filter((b) => b.type === 'meal_eating' || b.type === 'meal_prep').length,
      0
    );
    const avgFreeTime = Math.round(
      days.reduce((sum, day) => sum + day.totalFreeMinutes, 0) / days.length
    );
    const avgCompletionRate =
      days.reduce((sum, day) => sum + day.completionRate, 0) / days.length;

    return {
      workoutsCompleted,
      workoutsScheduled,
      mealsCompleted,
      mealsScheduled,
      avgFreeTime,
      productivityScore: Math.round(avgCompletionRate),
    };
  };

  const calculateCompletionRate = (blocks: TimeBlock[]): number => {
    const completedBlocks = blocks.filter((b) => b.status === 'completed').length;
    return blocks.length > 0 ? Math.round((completedBlocks / blocks.length) * 100) : 0;
  };

  const buildCompletionHistory = (weeklyPlan: WeeklyPlan): CompletionHistory[] => {
    return weeklyPlan.days.map((day) => ({
      date: day.date,
      completionRate: day.completionRate,
      skippedBlocks: day.blocks.filter((b) => b.status === 'skipped').map((b) => b.id),
      completedBlocks: day.blocks.filter((b) => b.status === 'completed').map((b) => b.id),
    }));
  };

  const convertCalendarEventToBlock = (event: DeviceCalendarEvent): TimeBlock => {
    const duration = Math.round(
      (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60)
    );

    return {
      id: `calendar_${event.id}`,
      type: 'calendar_event',
      title: event.title,
      startTime: formatTime(event.startDate),
      endTime: formatTime(event.endDate),
      duration,
      status: 'scheduled',
      color: PLANNER_CONSTANTS.BLOCK_COLORS.calendar_event,
      icon: PLANNER_CONSTANTS.BLOCK_ICONS.calendar_event,
      priority: 4,
      flexibility: 0,
      aiGenerated: false,
      deviceEventId: event.id,
    };
  };

  const actions: DayPlannerActions = {
    completeOnboarding,
    reopenOnboarding,
    generateWeeklyPlan,
    syncCalendar,
    markBlockComplete,
    skipBlock,
    updateBlockTime,
    requestWeeklyOptimization,
    setSelectedDay,
    setSelectedDate,
    clearError,
  };

  return (
    <DayPlannerContext.Provider value={{ state, actions }}>
      {children}
    </DayPlannerContext.Provider>
  );
}

export function useDayPlanner() {
  const context = useContext(DayPlannerContext);
  if (!context) {
    throw new Error('useDayPlanner must be used within DayPlannerProvider');
  }
  return context;
}

// ============================================================================
// Utility
// ============================================================================

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
