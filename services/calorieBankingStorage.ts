// Calorie Banking Storage Service
// Handles persistence of weekly calorie budgets and transactions

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WeeklyCalorieBudget,
  DayCalorieLog,
  SpecialEvent,
  CalorieBankTransaction,
  CalorieBankingSettings,
  CALORIE_BANKING_CONSTANTS,
} from '../types/calorieBanking';

const { STORAGE_KEYS, DEFAULT_MAX_BANKABLE_PER_DAY, DEFAULT_MAX_BORROWABLE_PER_DAY, DEFAULT_MAX_WEEKLY_BANK, DEFAULT_MINIMUM_DAILY } = CALORIE_BANKING_CONSTANTS;

// Generate unique ID
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Get day name from date
const getDayName = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

// Get week start date (default Monday)
function getWeekStartDate(date: Date, weekStartDay: number = 1): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - weekStartDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get week end date
function getWeekEndDate(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

class CalorieBankingStorage {
  // ============ SETTINGS ============

  async getSettings(): Promise<CalorieBankingSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.settings);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[CalorieBanking] Error getting settings:', error);
    }

    // Return defaults
    return {
      isEnabled: true,
      maxBankablePerDay: DEFAULT_MAX_BANKABLE_PER_DAY,
      maxBorrowablePerDay: DEFAULT_MAX_BORROWABLE_PER_DAY,
      maxWeeklyBank: DEFAULT_MAX_WEEKLY_BANK,
      minimumDailyCalories: DEFAULT_MINIMUM_DAILY,
      autoDistributeDeficit: true,
      weekStartDay: 1, // Monday
    };
  }

  async saveSettings(settings: CalorieBankingSettings): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  // ============ WEEKLY BUDGET ============

  async getCurrentWeek(): Promise<WeeklyCalorieBudget | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.currentWeek);
      if (!data) return null;

      const week: WeeklyCalorieBudget = JSON.parse(data);

      // Check if this week is still current
      const settings = await this.getSettings();
      const today = new Date();
      const currentWeekStart = getWeekStartDate(today, settings.weekStartDay);
      const storedWeekStart = new Date(week.weekStartDate);

      if (currentWeekStart.getTime() !== storedWeekStart.getTime()) {
        // Week has changed, archive old week and return null
        await this.archiveWeek(week);
        await AsyncStorage.removeItem(STORAGE_KEYS.currentWeek);
        return null;
      }

      return week;
    } catch (error) {
      console.error('[CalorieBanking] Error getting current week:', error);
      return null;
    }
  }

  async createWeek(dailyTarget: number): Promise<WeeklyCalorieBudget> {
    const settings = await this.getSettings();
    const today = new Date();
    const weekStart = getWeekStartDate(today, settings.weekStartDay);
    const weekEnd = getWeekEndDate(weekStart);

    // Create daily logs for the week
    const dailyLogs: DayCalorieLog[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);

      dailyLogs.push({
        date: date.toISOString().split('T')[0],
        dayName: getDayName(date),
        targetCalories: dailyTarget,
        consumedCalories: 0,
        bankedAmount: 0,
        isComplete: false,
      });
    }

    const week: WeeklyCalorieBudget = {
      id: generateId(),
      weekStartDate: weekStart.toISOString().split('T')[0],
      weekEndDate: weekEnd.toISOString().split('T')[0],
      weeklyTarget: dailyTarget * 7,
      dailyBaseTarget: dailyTarget,
      dailyLogs,
      bankedCalories: 0,
      specialEvents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.currentWeek, JSON.stringify(week));
    return week;
  }

  async updateWeek(week: WeeklyCalorieBudget): Promise<void> {
    week.updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.currentWeek, JSON.stringify(week));
  }

  async updateDayLog(date: string, updates: Partial<DayCalorieLog>): Promise<WeeklyCalorieBudget | null> {
    const week = await this.getCurrentWeek();
    if (!week) return null;

    const dayIndex = week.dailyLogs.findIndex(d => d.date === date);
    if (dayIndex === -1) return week;

    week.dailyLogs[dayIndex] = {
      ...week.dailyLogs[dayIndex],
      ...updates,
    };

    // Recalculate banked calories
    let totalBanked = 0;
    for (const day of week.dailyLogs) {
      if (day.isComplete) {
        totalBanked += day.targetCalories - day.consumedCalories;
      }
    }
    week.bankedCalories = totalBanked;

    await this.updateWeek(week);
    return week;
  }

  async archiveWeek(week: WeeklyCalorieBudget): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem(STORAGE_KEYS.weeklyHistory);
      const history: WeeklyCalorieBudget[] = historyData ? JSON.parse(historyData) : [];

      history.unshift(week);

      // Keep only last 12 weeks
      const trimmedHistory = history.slice(0, 12);

      await AsyncStorage.setItem(STORAGE_KEYS.weeklyHistory, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('[CalorieBanking] Error archiving week:', error);
    }
  }

  async getWeeklyHistory(): Promise<WeeklyCalorieBudget[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.weeklyHistory);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[CalorieBanking] Error getting weekly history:', error);
      return [];
    }
  }

  // ============ SPECIAL EVENTS ============

  async addSpecialEvent(event: Omit<SpecialEvent, 'id'>): Promise<SpecialEvent> {
    const week = await this.getCurrentWeek();
    if (!week) throw new Error('No active week');

    const newEvent: SpecialEvent = {
      ...event,
      id: generateId(),
    };

    week.specialEvents.push(newEvent);

    // Adjust the day's target
    const dayIndex = week.dailyLogs.findIndex(d => d.date === event.date);
    if (dayIndex !== -1) {
      week.dailyLogs[dayIndex].targetCalories += event.additionalCalories;
    }

    await this.updateWeek(week);
    return newEvent;
  }

  async removeSpecialEvent(eventId: string): Promise<void> {
    const week = await this.getCurrentWeek();
    if (!week) return;

    const eventIndex = week.specialEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;

    const event = week.specialEvents[eventIndex];

    // Remove the allocation from the day
    const dayIndex = week.dailyLogs.findIndex(d => d.date === event.date);
    if (dayIndex !== -1) {
      week.dailyLogs[dayIndex].targetCalories -= event.additionalCalories;
    }

    week.specialEvents.splice(eventIndex, 1);
    await this.updateWeek(week);
  }

  // ============ TRANSACTIONS ============

  async addTransaction(transaction: Omit<CalorieBankTransaction, 'id'>): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.transactions);
      const transactions: CalorieBankTransaction[] = data ? JSON.parse(data) : [];

      transactions.unshift({
        ...transaction,
        id: generateId(),
      });

      // Keep only last 100 transactions
      const trimmed = transactions.slice(0, 100);

      await AsyncStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(trimmed));
    } catch (error) {
      console.error('[CalorieBanking] Error adding transaction:', error);
    }
  }

  async getTransactions(limit: number = 50): Promise<CalorieBankTransaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.transactions);
      const transactions: CalorieBankTransaction[] = data ? JSON.parse(data) : [];
      return transactions.slice(0, limit);
    } catch (error) {
      console.error('[CalorieBanking] Error getting transactions:', error);
      return [];
    }
  }

  // ============ UTILITIES ============

  async clearAllData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.currentWeek),
      AsyncStorage.removeItem(STORAGE_KEYS.weeklyHistory),
      AsyncStorage.removeItem(STORAGE_KEYS.transactions),
      AsyncStorage.removeItem(STORAGE_KEYS.settings),
    ]);
  }
}

export const calorieBankingStorage = new CalorieBankingStorage();
