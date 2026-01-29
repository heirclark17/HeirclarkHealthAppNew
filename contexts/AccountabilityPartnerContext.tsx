/**
 * Accountability Partner Context
 * Provides state management for streaks, check-ins, messages, and engagement
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  AccountabilityPartnerState,
  ActivityStreaks,
  DailyCheckIn,
  MotivationalMessage,
  ReminderSettings,
  WeeklySummary,
  EngagementMetrics,
  DEFAULT_STREAK_DATA,
  DEFAULT_REMINDER_SETTINGS,
  DEFAULT_ENGAGEMENT_METRICS,
} from '../types/accountabilityPartner';
import {
  getStreaks,
  saveStreaks,
  getTodayCheckIn,
  saveCheckIn,
  getCheckIns,
  getMessages,
  addMessage as addMessageToStorage,
  markMessageRead as markMessageReadInStorage,
  markAllMessagesRead as markAllMessagesReadInStorage,
  getReminderSettings,
  saveReminderSettings,
  getWeeklySummaries,
  saveWeeklySummary,
  getEngagementMetrics,
  recordAppOpen,
} from '../services/accountabilityPartnerStorage';
import {
  handleMealLogged,
  handleWeightLogged,
  handleWorkoutCompleted,
  handleCalorieGoalMet,
  handleWaterGoalMet,
  generateEncouragementMessage,
  generateComebackMessage,
  getSmartRecommendations,
  needsComebackMessage,
  getDaysSinceLastActive,
  calculateConsistencyScore,
  getBestStreak,
  getStreaksAtRisk,
} from '../services/accountabilityPartnerService';

// Context interface
interface AccountabilityPartnerContextType {
  state: AccountabilityPartnerState;

  // Streak actions
  logActivity: (activity: keyof ActivityStreaks) => Promise<void>;
  getActivityStreak: (activity: keyof ActivityStreaks) => number;
  getBestCurrentStreak: () => { activity: keyof ActivityStreaks; streak: number };
  getAtRiskStreaks: () => Array<keyof ActivityStreaks>;

  // Check-in actions
  submitMorningCheckIn: (mood: number, energy: number, goals: string[]) => Promise<void>;
  submitEveningCheckIn: (accomplishments: string[], notes: string) => Promise<void>;
  hasCompletedTodayCheckIn: () => boolean;

  // Message actions
  getUnreadCount: () => number;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getRecentMessages: () => MotivationalMessage[];

  // Settings actions
  updateReminderSettings: (settings: Partial<ReminderSettings>) => Promise<void>;

  // Recommendations
  getRecommendations: () => string[];

  // Analytics
  getConsistencyScore: () => number;
  getWeeklySummary: () => WeeklySummary | null;

  // Refresh
  refresh: () => Promise<void>;
}

// Create context
const AccountabilityPartnerContext = createContext<AccountabilityPartnerContextType | undefined>(undefined);

// Provider props
interface AccountabilityPartnerProviderProps {
  children: ReactNode;
}

// Default state
const defaultState: AccountabilityPartnerState = {
  streaks: {
    mealLogging: { ...DEFAULT_STREAK_DATA },
    weightLogging: { ...DEFAULT_STREAK_DATA },
    workoutCompletion: { ...DEFAULT_STREAK_DATA },
    waterIntake: { ...DEFAULT_STREAK_DATA },
    calorieGoalMet: { ...DEFAULT_STREAK_DATA },
  },
  todayCheckIn: null,
  recentMessages: [],
  reminderSettings: DEFAULT_REMINDER_SETTINGS,
  lastWeeklySummary: null,
  engagement: DEFAULT_ENGAGEMENT_METRICS,
  isLoading: true,
  lastUpdated: 0,
};

// Provider component
export function AccountabilityPartnerProvider({ children }: AccountabilityPartnerProviderProps) {
  const [state, setState] = useState<AccountabilityPartnerState>(defaultState);

  // Load all data on mount
  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Load all data in parallel
      const [streaks, todayCheckIn, messages, settings, summaries, engagement] = await Promise.all([
        getStreaks(),
        getTodayCheckIn(),
        getMessages(),
        getReminderSettings(),
        getWeeklySummaries(1),
        recordAppOpen(), // Also records this app open
      ]);

      // Check if user needs a comeback message
      if (needsComebackMessage(engagement)) {
        const daysSince = getDaysSinceLastActive(engagement.lastAppOpen);
        const comebackMsg = generateComebackMessage(daysSince);
        await addMessageToStorage(comebackMsg);
        messages.unshift(comebackMsg);
      }

      setState({
        streaks,
        todayCheckIn,
        recentMessages: messages,
        reminderSettings: settings,
        lastWeeklySummary: summaries[0] || null,
        engagement,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error loading accountability data:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Log activity and update streak
  const logActivity = useCallback(async (activity: keyof ActivityStreaks) => {
    try {
      let message: MotivationalMessage | null = null;

      switch (activity) {
        case 'mealLogging':
          message = await handleMealLogged();
          break;
        case 'weightLogging':
          message = await handleWeightLogged();
          break;
        case 'workoutCompletion':
          message = await handleWorkoutCompleted();
          break;
        case 'calorieGoalMet':
          message = await handleCalorieGoalMet();
          break;
        case 'waterIntake':
          message = await handleWaterGoalMet();
          break;
      }

      // Refresh streaks
      const updatedStreaks = await getStreaks();
      const updatedMessages = await getMessages();

      setState((prev) => ({
        ...prev,
        streaks: updatedStreaks,
        recentMessages: updatedMessages,
        lastUpdated: Date.now(),
      }));
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, []);

  // Get current streak for an activity
  const getActivityStreak = useCallback(
    (activity: keyof ActivityStreaks): number => {
      return state.streaks[activity]?.currentStreak || 0;
    },
    [state.streaks]
  );

  // Get the best current streak
  const getBestCurrentStreak = useCallback((): { activity: keyof ActivityStreaks; streak: number } => {
    const { activity, streak } = getBestStreak(state.streaks);
    return { activity, streak: streak.currentStreak };
  }, [state.streaks]);

  // Get streaks at risk
  const getAtRiskStreaks = useCallback((): Array<keyof ActivityStreaks> => {
    return getStreaksAtRisk(state.streaks);
  }, [state.streaks]);

  // Submit morning check-in
  const submitMorningCheckIn = useCallback(
    async (mood: number, energy: number, goals: string[]) => {
      const today = new Date().toISOString().split('T')[0];
      const existingCheckIn = state.todayCheckIn;

      const checkIn: DailyCheckIn = {
        date: today,
        morningCheckIn: true,
        eveningCheckIn: existingCheckIn?.eveningCheckIn || false,
        moodRating: mood as 1 | 2 | 3 | 4 | 5,
        energyLevel: energy as 1 | 2 | 3 | 4 | 5,
        notes: existingCheckIn?.notes || '',
        goalsForToday: goals,
        accomplishments: existingCheckIn?.accomplishments || [],
        timestamp: Date.now(),
      };

      await saveCheckIn(checkIn);

      setState((prev) => ({
        ...prev,
        todayCheckIn: checkIn,
        lastUpdated: Date.now(),
      }));
    },
    [state.todayCheckIn]
  );

  // Submit evening check-in
  const submitEveningCheckIn = useCallback(
    async (accomplishments: string[], notes: string) => {
      const today = new Date().toISOString().split('T')[0];
      const existingCheckIn = state.todayCheckIn;

      const checkIn: DailyCheckIn = {
        date: today,
        morningCheckIn: existingCheckIn?.morningCheckIn || false,
        eveningCheckIn: true,
        moodRating: existingCheckIn?.moodRating || null,
        energyLevel: existingCheckIn?.energyLevel || null,
        notes,
        goalsForToday: existingCheckIn?.goalsForToday || [],
        accomplishments,
        timestamp: Date.now(),
      };

      await saveCheckIn(checkIn);

      // Generate encouragement message
      const encouragement = generateEncouragementMessage();
      await addMessageToStorage(encouragement);

      const updatedMessages = await getMessages();

      setState((prev) => ({
        ...prev,
        todayCheckIn: checkIn,
        recentMessages: updatedMessages,
        lastUpdated: Date.now(),
      }));
    },
    [state.todayCheckIn]
  );

  // Check if today's check-in is complete
  const hasCompletedTodayCheckIn = useCallback((): boolean => {
    return state.todayCheckIn?.morningCheckIn || state.todayCheckIn?.eveningCheckIn || false;
  }, [state.todayCheckIn]);

  // Get unread message count
  const getUnreadCount = useCallback((): number => {
    return state.recentMessages.filter((m) => !m.read).length;
  }, [state.recentMessages]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    const updatedMessages = await markMessageReadInStorage(messageId);
    setState((prev) => ({
      ...prev,
      recentMessages: updatedMessages,
    }));
  }, []);

  // Mark all messages as read
  const markAllAsRead = useCallback(async () => {
    const updatedMessages = await markAllMessagesReadInStorage();
    setState((prev) => ({
      ...prev,
      recentMessages: updatedMessages,
    }));
  }, []);

  // Get recent messages
  const getRecentMessages = useCallback((): MotivationalMessage[] => {
    return state.recentMessages;
  }, [state.recentMessages]);

  // Update reminder settings
  const updateReminderSettings = useCallback(async (updates: Partial<ReminderSettings>) => {
    const currentSettings = await getReminderSettings();
    const newSettings = { ...currentSettings, ...updates };
    await saveReminderSettings(newSettings);

    setState((prev) => ({
      ...prev,
      reminderSettings: newSettings,
    }));
  }, []);

  // Get smart recommendations
  const getRecommendations = useCallback((): string[] => {
    return getSmartRecommendations(state.streaks, [], state.engagement);
  }, [state.streaks, state.engagement]);

  // Get consistency score
  const getConsistencyScore = useCallback((): number => {
    return calculateConsistencyScore(state.streaks);
  }, [state.streaks]);

  // Get last weekly summary
  const getWeeklySummary = useCallback((): WeeklySummary | null => {
    return state.lastWeeklySummary;
  }, [state.lastWeeklySummary]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Context value
  const value = useMemo<AccountabilityPartnerContextType>(() => ({
    state,
    logActivity,
    getActivityStreak,
    getBestCurrentStreak,
    getAtRiskStreaks,
    submitMorningCheckIn,
    submitEveningCheckIn,
    hasCompletedTodayCheckIn,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    getRecentMessages,
    updateReminderSettings,
    getRecommendations,
    getConsistencyScore,
    getWeeklySummary,
    refresh,
  }), [
    state,
    logActivity,
    getActivityStreak,
    getBestCurrentStreak,
    getAtRiskStreaks,
    submitMorningCheckIn,
    submitEveningCheckIn,
    hasCompletedTodayCheckIn,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    getRecentMessages,
    updateReminderSettings,
    getRecommendations,
    getConsistencyScore,
    getWeeklySummary,
    refresh,
  ]);

  return (
    <AccountabilityPartnerContext.Provider value={value}>
      {children}
    </AccountabilityPartnerContext.Provider>
  );
}

// Hook to use the context
export function useAccountabilityPartner(): AccountabilityPartnerContextType {
  const context = useContext(AccountabilityPartnerContext);
  if (!context) {
    throw new Error('useAccountabilityPartner must be used within an AccountabilityPartnerProvider');
  }
  return context;
}
