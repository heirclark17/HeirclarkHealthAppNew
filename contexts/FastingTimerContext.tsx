import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGoalWizard } from './GoalWizardContext';
import { api } from '../services/api';

// Fasting presets matching the goal wizard
export const FASTING_PRESETS = [
  { id: '16:8', label: '16:8', fastingHours: 16, eatingHours: 8, description: 'Most popular' },
  { id: '18:6', label: '18:6', fastingHours: 18, eatingHours: 6, description: 'Intermediate' },
  { id: '20:4', label: '20:4', fastingHours: 20, eatingHours: 4, description: 'Advanced' },
  { id: '14:10', label: '14:10', fastingHours: 14, eatingHours: 10, description: 'Beginner' },
  { id: 'omad', label: 'OMAD', fastingHours: 23, eatingHours: 1, description: 'One meal a day' },
] as const;

export type FastingPresetId = typeof FASTING_PRESETS[number]['id'];

export type FastingState = 'fasting' | 'eating' | 'idle';

export interface FastingTimerState {
  // Timer state
  isActive: boolean;
  isPaused: boolean;
  currentState: FastingState;

  // Times (stored as ISO strings for persistence)
  fastingStartTime: string | null;  // When current fast started
  fastingEndTime: string | null;    // When current fast should end

  // Selected preset
  selectedPreset: FastingPresetId;

  // Custom times from goal wizard (24-hour format "HH:MM")
  eatingWindowStart: string;  // e.g., "12:00"
  eatingWindowEnd: string;    // e.g., "20:00"

  // Weekly tracking
  weekStartDate: string;  // ISO date of current week start (Sunday)
  completedFastsThisWeek: number;
  totalFastingMinutesThisWeek: number;

  // Streak tracking
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

interface FastingTimerContextType {
  state: FastingTimerState;

  // Timer controls
  startFast: () => void;
  pauseFast: () => void;
  resumeFast: () => void;
  stopFast: () => void;
  resetTimer: () => void;

  // Settings
  setPreset: (presetId: FastingPresetId) => void;
  setCustomWindow: (start: string, end: string) => void;

  // Computed values
  getTimeRemaining: () => { hours: number; minutes: number; seconds: number; totalSeconds: number };
  getProgress: () => number; // 0-100
  getFastingDuration: () => number; // Total fasting hours for current preset
  getEatingDuration: () => number; // Total eating hours for current preset
  getCurrentPhaseEndTime: () => Date | null;

  // Sync with goal wizard
  syncWithGoalWizard: () => void;
}

const STORAGE_KEY = 'hc_fasting_timer_state';

const getWeekStartDate = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString().split('T')[0];
};

const initialState: FastingTimerState = {
  isActive: false,
  isPaused: false,
  currentState: 'idle',
  fastingStartTime: null,
  fastingEndTime: null,
  selectedPreset: '16:8',
  eatingWindowStart: '12:00',
  eatingWindowEnd: '20:00',
  weekStartDate: getWeekStartDate(),
  completedFastsThisWeek: 0,
  totalFastingMinutesThisWeek: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

const FastingTimerContext = createContext<FastingTimerContextType | undefined>(undefined);

export function FastingTimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FastingTimerState>(initialState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Try to get goal wizard context
  let goalWizardContext: any = null;
  try {
    goalWizardContext = useGoalWizard();
  } catch (e) {
    // GoalWizard context may not be available
  }

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousStateRef = useRef<string | null>(null);

  // Load saved state on mount
  useEffect(() => {
    loadSavedState();
  }, []);

  // Debounced save - only saves if state actually changed
  useEffect(() => {
    const currentStateStr = JSON.stringify(state);
    if (previousStateRef.current === currentStateStr) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      previousStateRef.current = currentStateStr;
      saveState();
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.isActive, state.isPaused, state.currentState, state.fastingStartTime,
      state.fastingEndTime, state.selectedPreset, state.completedFastsThisWeek,
      state.totalFastingMinutesThisWeek, state.currentStreak, state.longestStreak]);

  // Check for week reset
  useEffect(() => {
    const currentWeekStart = getWeekStartDate();
    if (state.weekStartDate !== currentWeekStart) {
      // New week - reset weekly stats
      setState(prev => ({
        ...prev,
        weekStartDate: currentWeekStart,
        completedFastsThisWeek: 0,
        totalFastingMinutesThisWeek: 0,
      }));
    }
  }, [state.weekStartDate]);

  // Auto-transition between fasting and eating states
  useEffect(() => {
    if (state.isActive && !state.isPaused && state.fastingEndTime) {
      const checkTransition = () => {
        const now = new Date();
        const endTime = new Date(state.fastingEndTime!);

        if (now >= endTime) {
          // Fast completed!
          completeFast();
        }
      };

      // Check every second
      timerRef.current = setInterval(checkTransition, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [state.isActive, state.isPaused, state.fastingEndTime]);

  const loadSavedState = async () => {
    try {
      // Try to check for active fast from API first
      try {
        const apiFast = await api.getCurrentFast();
        if (apiFast && apiFast.startedAt) {
          console.log('[FastingTimer] Found active fast from API:', apiFast);
        }
      } catch (error) {
        console.error('[FastingTimer] API getCurrentFast error, using local:', error);
      }

      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[FastingTimer] Loaded saved state');

        // Check if we need to reset weekly stats
        const currentWeekStart = getWeekStartDate();
        if (parsed.weekStartDate !== currentWeekStart) {
          parsed.weekStartDate = currentWeekStart;
          parsed.completedFastsThisWeek = 0;
          parsed.totalFastingMinutesThisWeek = 0;
        }

        setState(parsed);
      }
    } catch (error) {
      console.error('[FastingTimer] Error loading state:', error);
    }
  };

  const saveState = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[FastingTimer] Error saving state:', error);
    }
  };

  const getPresetConfig = (presetId: FastingPresetId) => {
    return FASTING_PRESETS.find(p => p.id === presetId) || FASTING_PRESETS[0];
  };

  const startFast = useCallback(async () => {
    const now = new Date();
    const preset = getPresetConfig(state.selectedPreset);
    const endTime = new Date(now.getTime() + preset.fastingHours * 60 * 60 * 1000);

    setState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      currentState: 'fasting',
      fastingStartTime: now.toISOString(),
      fastingEndTime: endTime.toISOString(),
    }));

    console.log('[FastingTimer] Fast started:', {
      preset: preset.label,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
    });

    // Sync fast start to backend (fire-and-forget)
    try {
      await api.startFast(state.selectedPreset, preset.fastingHours);
    } catch (error) {
      console.error('[FastingTimer] API startFast sync error:', error);
    }
  }, [state.selectedPreset]);

  const pauseFast = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaused: true,
    }));
    console.log('[FastingTimer] Fast paused');
  }, []);

  const resumeFast = useCallback(() => {
    // When resuming, adjust the end time by the paused duration
    // For simplicity, we just continue from where we left off
    setState(prev => ({
      ...prev,
      isPaused: false,
    }));
    console.log('[FastingTimer] Fast resumed');
  }, []);

  const stopFast = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      currentState: 'idle',
      fastingStartTime: null,
      fastingEndTime: null,
    }));
    console.log('[FastingTimer] Fast stopped');

    // Sync fast end to backend (fire-and-forget)
    try {
      await api.endFast();
    } catch (error) {
      console.error('[FastingTimer] API endFast sync error:', error);
    }
  }, []);

  const completeFast = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const preset = getPresetConfig(state.selectedPreset);

    // Update streak
    let newStreak = state.currentStreak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (state.lastCompletedDate === yesterdayStr || state.lastCompletedDate === today) {
      newStreak = state.currentStreak + 1;
    } else if (state.lastCompletedDate !== today) {
      newStreak = 1; // Reset streak if not consecutive
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      currentState: 'eating',
      completedFastsThisWeek: prev.completedFastsThisWeek + 1,
      totalFastingMinutesThisWeek: prev.totalFastingMinutesThisWeek + (preset.fastingHours * 60),
      currentStreak: newStreak,
      longestStreak: Math.max(prev.longestStreak, newStreak),
      lastCompletedDate: today,
    }));

    console.log('[FastingTimer] Fast completed!', {
      completedFastsThisWeek: state.completedFastsThisWeek + 1,
      streak: newStreak,
    });

    // Sync fast completion to backend (fire-and-forget)
    try {
      await api.endFast();
    } catch (error) {
      console.error('[FastingTimer] API endFast sync error:', error);
    }
  }, [state.selectedPreset, state.currentStreak, state.lastCompletedDate]);

  const resetTimer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      currentState: 'idle',
      fastingStartTime: null,
      fastingEndTime: null,
    }));
    console.log('[FastingTimer] Timer reset');
  }, []);

  const setPreset = useCallback((presetId: FastingPresetId) => {
    setState(prev => ({
      ...prev,
      selectedPreset: presetId,
    }));
    console.log('[FastingTimer] Preset changed to:', presetId);
  }, []);

  const setCustomWindow = useCallback((start: string, end: string) => {
    setState(prev => ({
      ...prev,
      eatingWindowStart: start,
      eatingWindowEnd: end,
    }));
    console.log('[FastingTimer] Custom window set:', start, '-', end);
  }, []);

  const syncWithGoalWizard = useCallback(() => {
    if (goalWizardContext?.state) {
      const { intermittentFasting, fastingStart, fastingEnd } = goalWizardContext.state;

      if (intermittentFasting && fastingStart && fastingEnd) {
        // Calculate fasting hours from eating window
        const [startHour, startMin] = fastingStart.split(':').map(Number);
        const [endHour, endMin] = fastingEnd.split(':').map(Number);

        let eatingHours = endHour - startHour;
        if (eatingHours < 0) eatingHours += 24;

        const fastingHours = 24 - eatingHours;

        // Find matching preset or use closest
        let matchedPreset: FastingPresetId = '16:8';
        for (const preset of FASTING_PRESETS) {
          if (preset.fastingHours === fastingHours) {
            matchedPreset = preset.id;
            break;
          }
        }

        setState(prev => ({
          ...prev,
          selectedPreset: matchedPreset,
          eatingWindowStart: fastingStart,
          eatingWindowEnd: fastingEnd,
        }));

        console.log('[FastingTimer] Synced with goal wizard:', {
          fastingHours,
          eatingHours,
          preset: matchedPreset,
        });
      }
    }
  }, [goalWizardContext?.state]);

  const getTimeRemaining = useCallback(() => {
    if (!state.isActive || !state.fastingEndTime || state.isPaused) {
      return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
    }

    const now = new Date();
    const endTime = new Date(state.fastingEndTime);
    const diffMs = Math.max(0, endTime.getTime() - now.getTime());

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds, totalSeconds };
  }, [state.isActive, state.fastingEndTime, state.isPaused]);

  const getProgress = useCallback(() => {
    if (!state.isActive || !state.fastingStartTime || !state.fastingEndTime) {
      return 0;
    }

    const now = new Date();
    const startTime = new Date(state.fastingStartTime);
    const endTime = new Date(state.fastingEndTime);

    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();

    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, [state.isActive, state.fastingStartTime, state.fastingEndTime]);

  const getFastingDuration = useCallback(() => {
    const preset = getPresetConfig(state.selectedPreset);
    return preset.fastingHours;
  }, [state.selectedPreset]);

  const getEatingDuration = useCallback(() => {
    const preset = getPresetConfig(state.selectedPreset);
    return preset.eatingHours;
  }, [state.selectedPreset]);

  const getCurrentPhaseEndTime = useCallback(() => {
    if (!state.fastingEndTime) return null;
    return new Date(state.fastingEndTime);
  }, [state.fastingEndTime]);

  const value = useMemo<FastingTimerContextType>(() => ({
    state,
    startFast,
    pauseFast,
    resumeFast,
    stopFast,
    resetTimer,
    setPreset,
    setCustomWindow,
    getTimeRemaining,
    getProgress,
    getFastingDuration,
    getEatingDuration,
    getCurrentPhaseEndTime,
    syncWithGoalWizard,
  }), [
    state,
    startFast,
    pauseFast,
    resumeFast,
    stopFast,
    resetTimer,
    setPreset,
    setCustomWindow,
    getTimeRemaining,
    getProgress,
    getFastingDuration,
    getEatingDuration,
    getCurrentPhaseEndTime,
    syncWithGoalWizard,
  ]);

  return (
    <FastingTimerContext.Provider value={value}>
      {children}
    </FastingTimerContext.Provider>
  );
}

export function useFastingTimer() {
  const context = useContext(FastingTimerContext);
  if (context === undefined) {
    throw new Error('useFastingTimer must be used within a FastingTimerProvider');
  }
  return context;
}

export default FastingTimerContext;
