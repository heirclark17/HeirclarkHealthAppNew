/**
 * DayPlannerContext - State management for AI-Powered Day & Week Planner
 * Manages onboarding, weekly plans, calendar sync, and AI optimization
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import { api } from '@/services/api';
import { SchedulingEngine } from '@/services/schedulingEngine';
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
} from '@/types/planner';

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
  generateWeeklyPlan: () => Promise<void>;
  syncCalendar: () => Promise<boolean>;
  markBlockComplete: (blockId: string, date: string) => Promise<void>;
  skipBlock: (blockId: string, date: string) => Promise<void>;
  updateBlockTime: (blockId: string, date: string, newStartTime: string) => Promise<void>;
  requestWeeklyOptimization: () => Promise<void>;
  setSelectedDay: (dayIndex: number) => void;
  clearError: () => void;
}

interface DayPlannerContextValue {
  state: DayPlannerState;
  actions: DayPlannerActions;
}

const DayPlannerContext = createContext<DayPlannerContextValue | undefined>(undefined);

export function DayPlannerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DayPlannerState>({
    hasCompletedOnboarding: false,
    preferences: null,
    weeklyPlan: null,
    selectedDayIndex: new Date().getDay(), // Today
    calendarPermission: false,
    deviceCalendarEvents: [],
    lastCalendarSync: null,
    aiOptimization: null,
    isGeneratingPlan: false,
    isSyncingCalendar: false,
    isOptimizing: false,
    error: null,
  });

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

      console.log('[Planner] ✅ Cached data loaded');
    } catch (error) {
      console.error('[Planner] Error loading cached data:', error);
    }
  };

  /**
   * Complete onboarding and save preferences
   */
  const completeOnboarding = async (preferences: PlannerPreferences) => {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(preferences));

      // Save to backend
      await api.post('/planner/onboarding', { preferences });

      setState((prev) => ({
        ...prev,
        hasCompletedOnboarding: true,
        preferences,
      }));

      console.log('[Planner] ✅ Onboarding completed');
    } catch (error) {
      console.error('[Planner] Onboarding save error:', error);
      setState((prev) => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  /**
   * Generate weekly plan (7 daily timelines)
   */
  const generateWeeklyPlan = async () => {
    if (!state.preferences) {
      console.error('[Planner] Cannot generate plan without preferences');
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

        const timeline = await generateDailyTimeline(date);
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

      // Save to backend (excludes calendar events)
      await api.post('/planner/weekly-plan', { weeklyPlan });

      setState((prev) => ({
        ...prev,
        weeklyPlan,
        isGeneratingPlan: false,
      }));

      console.log('[Planner] ✅ Weekly plan generated');
    } catch (error) {
      console.error('[Planner] Generation error:', error);
      setState((prev) => ({
        ...prev,
        error: error.message,
        isGeneratingPlan: false,
      }));
    }
  };

  /**
   * Generate daily timeline for a specific date
   */
  const generateDailyTimeline = async (date: Date): Promise<DailyTimeline> => {
    const dateStr = formatLocalDate(date);

    // Extract workouts for this date (placeholder - integrate with TrainingContext)
    const workoutBlocks: TimeBlock[] = [];

    // Extract meals for this date (placeholder - integrate with MealPlanContext)
    const mealBlocks: TimeBlock[] = [];

    // Get calendar events (CLIENT-SIDE ONLY)
    const calendarBlocks = state.deviceCalendarEvents
      .filter((event) => isSameDay(event.startDate, date))
      .map((event) => convertCalendarEventToBlock(event));

    // Build scheduling request
    const request: SchedulingRequest = {
      date: dateStr,
      preferences: state.preferences!,
      workoutBlocks,
      mealBlocks,
      calendarBlocks, // CLIENT-SIDE ONLY
    };

    // Run scheduling engine
    const result = SchedulingEngine.generateTimeline(request);

    if (!result.success) {
      console.warn(`[Planner] Timeline for ${dateStr} has conflicts:`, result.conflicts);
    }

    return result.timeline;
  };

  /**
   * Sync calendar events from device (CLIENT-SIDE ONLY)
   */
  const syncCalendar = async (): Promise<boolean> => {
    // Check/request permission
    if (!state.calendarPermission) {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      const granted = status === 'granted';
      setState((prev) => ({ ...prev, calendarPermission: granted }));
      await AsyncStorage.setItem(STORAGE_KEYS.CALENDAR_PERMISSION, granted.toString());

      if (!granted) {
        console.log('[Planner] Calendar permission denied');
        return false;
      }
    }

    setState((prev) => ({ ...prev, isSyncingCalendar: true }));

    try {
      // Get all calendars
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      // Get events for next 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const events: DeviceCalendarEvent[] = [];
      for (const calendar of calendars) {
        const calendarEvents = await Calendar.getEventsAsync(
          [calendar.id],
          startDate,
          endDate
        );
        events.push(
          ...calendarEvents.map((e) => ({
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

      console.log(`[Planner] ✅ Synced ${events.length} calendar events (client-side only)`);
      return true;
    } catch (error) {
      console.error('[Planner] Calendar sync error:', error);
      setState((prev) => ({
        ...prev,
        isSyncingCalendar: false,
        error: error.message,
      }));
      return false;
    }
  };

  /**
   * Mark a time block as completed
   */
  const markBlockComplete = async (blockId: string, date: string) => {
    if (!state.weeklyPlan) return;

    const updatedPlan = { ...state.weeklyPlan };
    const dayIndex = updatedPlan.days.findIndex((d) => d.date === date);
    if (dayIndex === -1) return;

    const blockIndex = updatedPlan.days[dayIndex].blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    updatedPlan.days[dayIndex].blocks[blockIndex].status = 'completed';
    updatedPlan.days[dayIndex].completionRate = calculateCompletionRate(
      updatedPlan.days[dayIndex].blocks
    );

    // Save
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PLAN, JSON.stringify(updatedPlan));
    await api.post('/planner/update-block-status', { blockId, status: 'completed' });

    setState((prev) => ({ ...prev, weeklyPlan: updatedPlan }));
    console.log(`[Planner] ✅ Block ${blockId} marked complete`);
  };

  /**
   * Skip a time block
   */
  const skipBlock = async (blockId: string, date: string) => {
    if (!state.weeklyPlan) return;

    const updatedPlan = { ...state.weeklyPlan };
    const dayIndex = updatedPlan.days.findIndex((d) => d.date === date);
    if (dayIndex === -1) return;

    const blockIndex = updatedPlan.days[dayIndex].blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    updatedPlan.days[dayIndex].blocks[blockIndex].status = 'skipped';
    updatedPlan.days[dayIndex].completionRate = calculateCompletionRate(
      updatedPlan.days[dayIndex].blocks
    );

    // Save
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PLAN, JSON.stringify(updatedPlan));
    await api.post('/planner/update-block-status', { blockId, status: 'skipped' });

    setState((prev) => ({ ...prev, weeklyPlan: updatedPlan }));
    console.log(`[Planner] Block ${blockId} skipped`);
  };

  /**
   * Update block start time (drag-and-drop)
   */
  const updateBlockTime = async (blockId: string, date: string, newStartTime: string) => {
    if (!state.weeklyPlan) return;

    const updatedPlan = { ...state.weeklyPlan };
    const dayIndex = updatedPlan.days.findIndex((d) => d.date === date);
    if (dayIndex === -1) return;

    const blockIndex = updatedPlan.days[dayIndex].blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    const block = updatedPlan.days[dayIndex].blocks[blockIndex];
    block.startTime = newStartTime;
    block.endTime = addMinutesToTime(newStartTime, block.duration);

    // Save
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_PLAN, JSON.stringify(updatedPlan));
    await api.post('/planner/update-block-time', { blockId, startTime: newStartTime });

    setState((prev) => ({ ...prev, weeklyPlan: updatedPlan }));
    console.log(`[Planner] Block ${blockId} rescheduled to ${newStartTime}`);
  };

  /**
   * Request AI weekly optimization
   */
  const requestWeeklyOptimization = async () => {
    if (!state.weeklyPlan) {
      console.error('[Planner] Cannot optimize without weekly plan');
      return;
    }

    setState((prev) => ({ ...prev, isOptimizing: true }));

    try {
      const completionHistory = buildCompletionHistory(state.weeklyPlan);

      const response = await api.post('/planner/optimize', {
        currentWeekPlan: state.weeklyPlan,
        completionHistory,
      });

      const optimization = response.data.optimization;

      // Cache for 7 days
      await AsyncStorage.setItem(STORAGE_KEYS.AI_OPTIMIZATION, JSON.stringify(optimization));

      setState((prev) => ({
        ...prev,
        aiOptimization: optimization,
        isOptimizing: false,
      }));

      console.log('[Planner] ✅ AI optimization completed');
    } catch (error) {
      console.error('[Planner] Optimization error:', error);
      setState((prev) => ({
        ...prev,
        isOptimizing: false,
        error: error.message,
      }));
    }
  };

  /**
   * Set selected day index
   */
  const setSelectedDay = (dayIndex: number) => {
    setState((prev) => ({ ...prev, selectedDayIndex: dayIndex }));
  };

  /**
   * Clear error
   */
  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  // Helper functions
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

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  const actions: DayPlannerActions = {
    completeOnboarding,
    generateWeeklyPlan,
    syncCalendar,
    markBlockComplete,
    skipBlock,
    updateBlockTime,
    requestWeeklyOptimization,
    setSelectedDay,
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
