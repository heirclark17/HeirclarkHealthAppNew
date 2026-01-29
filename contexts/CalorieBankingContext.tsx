// Calorie Banking Context
// Provides state management for the Weekly Calorie Banking Agent

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  CalorieBankingState,
  WeeklyCalorieBudget,
  CalorieBankTransaction,
  CalorieBankingSettings,
  BankingRecommendation,
  SpecialEvent,
  CALORIE_BANKING_CONSTANTS,
} from '../types/calorieBanking';
import { calorieBankingStorage } from '../services/calorieBankingStorage';
import {
  getBankingRecommendation,
  bankCalories,
  borrowCalories,
  redistributeCalories,
  completeDay,
  getWeeklySummary,
} from '../services/calorieBankingService';
import { useGoalWizard } from './GoalWizardContext';

interface CalorieBankingContextType {
  // State
  state: CalorieBankingState;

  // Week management
  initializeWeek: () => Promise<void>;
  getCurrentWeek: () => WeeklyCalorieBudget | null;

  // Banking operations
  getRecommendation: (consumed: number) => Promise<BankingRecommendation>;
  bankToday: (amount: number) => Promise<void>;
  borrowToday: (amount: number) => Promise<void>;
  completeToday: (consumed: number) => Promise<void>;
  redistribute: () => Promise<void>;

  // Special events
  addEvent: (event: Omit<SpecialEvent, 'id'>) => Promise<void>;
  removeEvent: (eventId: string) => Promise<void>;

  // Summary
  getSummary: () => Promise<{
    weeklyTarget: number;
    weeklyConsumed: number;
    weeklyRemaining: number;
    bankedCalories: number;
    daysComplete: number;
    daysRemaining: number;
    onTrack: boolean;
    projectedEndOfWeek: number;
  } | null>;

  // Settings
  updateSettings: (settings: Partial<CalorieBankingSettings>) => Promise<void>;

  // Utilities
  refreshData: () => Promise<void>;
}

const initialState: CalorieBankingState = {
  currentWeek: null,
  transactionHistory: [],
  weeklyHistory: [],
  settings: {
    isEnabled: true,
    maxBankablePerDay: CALORIE_BANKING_CONSTANTS.DEFAULT_MAX_BANKABLE_PER_DAY,
    maxBorrowablePerDay: CALORIE_BANKING_CONSTANTS.DEFAULT_MAX_BORROWABLE_PER_DAY,
    maxWeeklyBank: CALORIE_BANKING_CONSTANTS.DEFAULT_MAX_WEEKLY_BANK,
    minimumDailyCalories: CALORIE_BANKING_CONSTANTS.DEFAULT_MINIMUM_DAILY,
    autoDistributeDeficit: true,
    weekStartDay: 1,
  },
  isLoading: false,
};

const CalorieBankingContext = createContext<CalorieBankingContextType | undefined>(undefined);

export function CalorieBankingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CalorieBankingState>(initialState);
  const initRef = useRef(false);
  const { state: goalState } = useGoalWizard();

  // Get daily target from goal wizard
  const getDailyTarget = useCallback(() => {
    return goalState.results?.calories || 2000;
  }, [goalState.results]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      console.log('[CalorieBanking] Loading initial data...');

      const [currentWeek, transactions, history, settings] = await Promise.all([
        calorieBankingStorage.getCurrentWeek(),
        calorieBankingStorage.getTransactions(),
        calorieBankingStorage.getWeeklyHistory(),
        calorieBankingStorage.getSettings(),
      ]);

      // Initialize week if needed
      let week = currentWeek;
      if (!week) {
        const dailyTarget = getDailyTarget();
        week = await calorieBankingStorage.createWeek(dailyTarget);
        console.log('[CalorieBanking] Created new week with target:', dailyTarget);
      }

      setState({
        currentWeek: week,
        transactionHistory: transactions,
        weeklyHistory: history,
        settings,
        isLoading: false,
      });

      console.log('[CalorieBanking] Initial data loaded:', {
        hasWeek: !!week,
        transactions: transactions.length,
        history: history.length,
      });
    } catch (error) {
      console.error('[CalorieBanking] Error loading initial data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [getDailyTarget]);

  // Initialize on mount
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      loadInitialData();
    }
  }, [loadInitialData]);

  // Initialize week
  const initializeWeek = useCallback(async () => {
    const dailyTarget = getDailyTarget();
    const week = await calorieBankingStorage.createWeek(dailyTarget);
    setState(prev => ({ ...prev, currentWeek: week }));
  }, [getDailyTarget]);

  // Get current week
  const getCurrentWeek = useCallback(() => {
    return state.currentWeek;
  }, [state.currentWeek]);

  // Get recommendation
  const getRecommendation = useCallback(async (consumed: number): Promise<BankingRecommendation> => {
    const dailyTarget = getDailyTarget();
    return getBankingRecommendation(consumed, dailyTarget);
  }, [getDailyTarget]);

  // Bank calories
  const bankToday = useCallback(async (amount: number) => {
    const week = await bankCalories(amount);
    if (week) {
      const transactions = await calorieBankingStorage.getTransactions();
      setState(prev => ({
        ...prev,
        currentWeek: week,
        transactionHistory: transactions,
      }));
    }
  }, []);

  // Borrow calories
  const borrowToday = useCallback(async (amount: number) => {
    const week = await borrowCalories(amount);
    if (week) {
      const transactions = await calorieBankingStorage.getTransactions();
      setState(prev => ({
        ...prev,
        currentWeek: week,
        transactionHistory: transactions,
      }));
    }
  }, []);

  // Complete today
  const completeToday = useCallback(async (consumed: number) => {
    const today = new Date().toISOString().split('T')[0];
    const week = await completeDay(today, consumed);
    if (week) {
      const transactions = await calorieBankingStorage.getTransactions();
      setState(prev => ({
        ...prev,
        currentWeek: week,
        transactionHistory: transactions,
      }));
    }
  }, []);

  // Redistribute
  const redistribute = useCallback(async () => {
    const week = await redistributeCalories();
    if (week) {
      setState(prev => ({ ...prev, currentWeek: week }));
    }
  }, []);

  // Add special event
  const addEvent = useCallback(async (event: Omit<SpecialEvent, 'id'>) => {
    await calorieBankingStorage.addSpecialEvent(event);
    const week = await calorieBankingStorage.getCurrentWeek();
    if (week) {
      setState(prev => ({ ...prev, currentWeek: week }));
    }
  }, []);

  // Remove special event
  const removeEvent = useCallback(async (eventId: string) => {
    await calorieBankingStorage.removeSpecialEvent(eventId);
    const week = await calorieBankingStorage.getCurrentWeek();
    if (week) {
      setState(prev => ({ ...prev, currentWeek: week }));
    }
  }, []);

  // Get summary
  const getSummary = useCallback(async () => {
    return getWeeklySummary();
  }, []);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<CalorieBankingSettings>) => {
    const newSettings = { ...state.settings, ...updates };
    await calorieBankingStorage.saveSettings(newSettings);
    setState(prev => ({ ...prev, settings: newSettings }));
  }, [state.settings]);

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  const value = useMemo<CalorieBankingContextType>(() => ({
    state,
    initializeWeek,
    getCurrentWeek,
    getRecommendation,
    bankToday,
    borrowToday,
    completeToday,
    redistribute,
    addEvent,
    removeEvent,
    getSummary,
    updateSettings,
    refreshData,
  }), [
    state,
    initializeWeek,
    getCurrentWeek,
    getRecommendation,
    bankToday,
    borrowToday,
    completeToday,
    redistribute,
    addEvent,
    removeEvent,
    getSummary,
    updateSettings,
    refreshData,
  ]);

  return (
    <CalorieBankingContext.Provider value={value}>
      {children}
    </CalorieBankingContext.Provider>
  );
}

export function useCalorieBanking() {
  const context = useContext(CalorieBankingContext);
  if (!context) {
    throw new Error('useCalorieBanking must be used within a CalorieBankingProvider');
  }
  return context;
}

export default CalorieBankingContext;
