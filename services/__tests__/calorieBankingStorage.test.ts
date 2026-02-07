/**
 * Tests for calorieBankingStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { calorieBankingStorage } from '../calorieBankingStorage';
import { CALORIE_BANKING_CONSTANTS } from '../../types/calorieBanking';

const { STORAGE_KEYS } = CALORIE_BANKING_CONSTANTS;

describe('calorieBankingStorage', () => {
  beforeEach(() => {
    AsyncStorage.__resetStore();
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return default settings when none saved', async () => {
      const settings = await calorieBankingStorage.getSettings();
      expect(settings).toEqual({
        isEnabled: true,
        maxBankablePerDay: 500,
        maxBorrowablePerDay: 300,
        maxWeeklyBank: 1500,
        minimumDailyCalories: 1200,
        autoDistributeDeficit: true,
        weekStartDay: 1,
      });
    });

    it('should return saved settings', async () => {
      const customSettings = {
        isEnabled: false,
        maxBankablePerDay: 600,
        maxBorrowablePerDay: 400,
        maxWeeklyBank: 2000,
        minimumDailyCalories: 1500,
        autoDistributeDeficit: false,
        weekStartDay: 0,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(customSettings));
      const settings = await calorieBankingStorage.getSettings();
      expect(settings).toEqual(customSettings);
    });

    it('should handle JSON parse errors', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.settings, 'invalid json');
      const settings = await calorieBankingStorage.getSettings();
      expect(settings.isEnabled).toBe(true); // Should return defaults
    });
  });

  describe('saveSettings', () => {
    it('should save settings successfully', async () => {
      const settings = {
        isEnabled: false,
        maxBankablePerDay: 400,
        maxBorrowablePerDay: 200,
        maxWeeklyBank: 1000,
        minimumDailyCalories: 1300,
        autoDistributeDeficit: false,
        weekStartDay: 0,
      };
      await calorieBankingStorage.saveSettings(settings);
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.settings);
      expect(JSON.parse(stored!)).toEqual(settings);
    });
  });

  describe('getCurrentWeek', () => {
    it('should return null when no week exists', async () => {
      const week = await calorieBankingStorage.getCurrentWeek();
      expect(week).toBeNull();
    });

    it('should return current week when it matches date', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      const retrieved = await calorieBankingStorage.getCurrentWeek();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(week.id);
      expect(retrieved?.dailyBaseTarget).toBe(2000);
    });

    it('should archive and clear week when date has passed', async () => {
      const oldWeek = {
        id: 'old-week',
        weekStartDate: '2020-01-01',
        weekEndDate: '2020-01-07',
        weeklyTarget: 14000,
        dailyBaseTarget: 2000,
        dailyLogs: [],
        bankedCalories: 0,
        specialEvents: [],
        createdAt: '2020-01-01T00:00:00.000Z',
        updatedAt: '2020-01-01T00:00:00.000Z',
      };
      await AsyncStorage.setItem(STORAGE_KEYS.currentWeek, JSON.stringify(oldWeek));
      const week = await calorieBankingStorage.getCurrentWeek();
      expect(week).toBeNull();
    });

    it('should handle corrupted data', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.currentWeek, 'corrupted');
      const week = await calorieBankingStorage.getCurrentWeek();
      expect(week).toBeNull();
    });
  });

  describe('createWeek', () => {
    it('should create a new week with 7 days', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      expect(week.dailyLogs).toHaveLength(7);
      expect(week.weeklyTarget).toBe(14000);
      expect(week.dailyBaseTarget).toBe(2000);
      expect(week.bankedCalories).toBe(0);
    });

    it('should create week starting on configured day', async () => {
      await calorieBankingStorage.saveSettings({
        isEnabled: true,
        maxBankablePerDay: 500,
        maxBorrowablePerDay: 300,
        maxWeeklyBank: 1500,
        minimumDailyCalories: 1200,
        autoDistributeDeficit: true,
        weekStartDay: 0, // Sunday
      });
      const week = await calorieBankingStorage.createWeek(2000);
      expect(week.dailyLogs[0].dayName).toBe('Sunday');
    });

    it('should initialize all days with zero consumed calories', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      week.dailyLogs.forEach(day => {
        expect(day.consumedCalories).toBe(0);
        expect(day.bankedAmount).toBe(0);
        expect(day.isComplete).toBe(false);
      });
    });

    it('should persist created week to storage', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.currentWeek);
      expect(JSON.parse(stored!).id).toBe(week.id);
    });
  });

  describe('updateWeek', () => {
    it('should update week and save to storage', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      week.bankedCalories = 300;
      await calorieBankingStorage.updateWeek(week);
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.currentWeek);
      expect(JSON.parse(stored!).bankedCalories).toBe(300);
    });

    it('should update the updatedAt timestamp', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      const originalUpdatedAt = week.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await calorieBankingStorage.updateWeek(week);
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.currentWeek);
      const updatedWeek = JSON.parse(stored!);
      expect(updatedWeek.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('updateDayLog', () => {
    it('should update specific day log', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      const dateToUpdate = week.dailyLogs[0].date;
      const updated = await calorieBankingStorage.updateDayLog(dateToUpdate, {
        consumedCalories: 1800,
        isComplete: true,
      });
      expect(updated!.dailyLogs[0].consumedCalories).toBe(1800);
      expect(updated!.dailyLogs[0].isComplete).toBe(true);
    });

    it('should recalculate banked calories', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      const date1 = week.dailyLogs[0].date;
      const date2 = week.dailyLogs[1].date;

      await calorieBankingStorage.updateDayLog(date1, {
        consumedCalories: 1700,
        targetCalories: 2000,
        isComplete: true,
      });
      const updated = await calorieBankingStorage.updateDayLog(date2, {
        consumedCalories: 1800,
        targetCalories: 2000,
        isComplete: true,
      });

      expect(updated!.bankedCalories).toBe(500); // 300 + 200
    });

    it('should return null when week does not exist', async () => {
      const result = await calorieBankingStorage.updateDayLog('2025-01-01', {
        consumedCalories: 1500,
      });
      expect(result).toBeNull();
    });

    it('should return week unchanged when date not found', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      const result = await calorieBankingStorage.updateDayLog('2020-01-01', {
        consumedCalories: 1500,
      });
      expect(result!.id).toBe(week.id);
    });
  });

  describe('archiveWeek', () => {
    it('should add week to history', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      await calorieBankingStorage.archiveWeek(week);
      const history = await calorieBankingStorage.getWeeklyHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(week.id);
    });

    it('should limit history to 12 weeks', async () => {
      const weeks = Array.from({ length: 15 }, (_, i) => ({
        id: `week-${i}`,
        weekStartDate: `2025-${String(i + 1).padStart(2, '0')}-01`,
        weekEndDate: `2025-${String(i + 1).padStart(2, '0')}-07`,
        weeklyTarget: 14000,
        dailyBaseTarget: 2000,
        dailyLogs: [],
        bankedCalories: 0,
        specialEvents: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }));

      for (const week of weeks) {
        await calorieBankingStorage.archiveWeek(week);
      }

      const history = await calorieBankingStorage.getWeeklyHistory();
      expect(history).toHaveLength(12);
      expect(history[0].id).toBe('week-14'); // Most recent
    });

    it('should handle errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));
      const week = await calorieBankingStorage.createWeek(2000);
      await expect(calorieBankingStorage.archiveWeek(week)).resolves.not.toThrow();
    });
  });

  describe('getWeeklyHistory', () => {
    it('should return empty array when no history', async () => {
      const history = await calorieBankingStorage.getWeeklyHistory();
      expect(history).toEqual([]);
    });

    it('should return stored history', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      await calorieBankingStorage.archiveWeek(week);
      const history = await calorieBankingStorage.getWeeklyHistory();
      expect(history).toHaveLength(1);
    });
  });

  describe('addSpecialEvent', () => {
    it('should add special event to current week', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      const event = await calorieBankingStorage.addSpecialEvent({
        date: week.dailyLogs[0].date,
        eventName: 'Birthday Party',
        additionalCalories: 500,
      });

      expect(event.eventName).toBe('Birthday Party');
      expect(event.id).toBeDefined();

      const updated = await calorieBankingStorage.getCurrentWeek();
      expect(updated!.specialEvents).toHaveLength(1);
      expect(updated!.dailyLogs[0].targetCalories).toBe(2500); // 2000 + 500
    });

    it('should throw error when no active week', async () => {
      await expect(
        calorieBankingStorage.addSpecialEvent({
          date: '2025-01-01',
          eventName: 'Event',
          additionalCalories: 500,
        })
      ).rejects.toThrow('No active week');
    });
  });

  describe('removeSpecialEvent', () => {
    it('should remove special event and adjust calories', async () => {
      const week = await calorieBankingStorage.createWeek(2000);
      const event = await calorieBankingStorage.addSpecialEvent({
        date: week.dailyLogs[0].date,
        eventName: 'Birthday',
        additionalCalories: 500,
      });

      await calorieBankingStorage.removeSpecialEvent(event.id);

      const updated = await calorieBankingStorage.getCurrentWeek();
      expect(updated!.specialEvents).toHaveLength(0);
      expect(updated!.dailyLogs[0].targetCalories).toBe(2000); // Back to base
    });

    it('should handle non-existent event gracefully', async () => {
      await calorieBankingStorage.createWeek(2000);
      await expect(
        calorieBankingStorage.removeSpecialEvent('non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('addTransaction', () => {
    it('should add transaction to history', async () => {
      await calorieBankingStorage.addTransaction({
        date: '2025-01-15',
        type: 'bank',
        amount: 300,
        reason: 'Daily surplus',
        balanceAfter: 300,
      });

      const transactions = await calorieBankingStorage.getTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(300);
      expect(transactions[0].id).toBeDefined();
    });

    it('should limit transactions to 100 in storage, return 50 by default', async () => {
      for (let i = 0; i < 105; i++) {
        await calorieBankingStorage.addTransaction({
          date: '2025-01-15',
          type: 'bank',
          amount: 100,
          reason: 'Test',
          balanceAfter: 100 * (i + 1),
        });
      }

      // getTransactions has default limit of 50
      const transactions = await calorieBankingStorage.getTransactions();
      expect(transactions).toHaveLength(50);

      // But storage only keeps 100 total
      const allTransactions = await calorieBankingStorage.getTransactions(200);
      expect(allTransactions).toHaveLength(100);
    });

    it('should add new transactions at beginning', async () => {
      await calorieBankingStorage.addTransaction({
        date: '2025-01-15',
        type: 'bank',
        amount: 100,
        reason: 'First',
        balanceAfter: 100,
      });

      await calorieBankingStorage.addTransaction({
        date: '2025-01-16',
        type: 'bank',
        amount: 200,
        reason: 'Second',
        balanceAfter: 300,
      });

      const transactions = await calorieBankingStorage.getTransactions();
      expect(transactions[0].reason).toBe('Second');
      expect(transactions[1].reason).toBe('First');
    });
  });

  describe('getTransactions', () => {
    it('should return empty array when no transactions', async () => {
      const transactions = await calorieBankingStorage.getTransactions();
      expect(transactions).toEqual([]);
    });

    it('should limit returned transactions', async () => {
      for (let i = 0; i < 60; i++) {
        await calorieBankingStorage.addTransaction({
          date: '2025-01-15',
          type: 'bank',
          amount: 100,
          reason: 'Test',
          balanceAfter: 100,
        });
      }

      const transactions = await calorieBankingStorage.getTransactions(30);
      expect(transactions).toHaveLength(30);
    });
  });

  describe('clearAllData', () => {
    it('should clear all calorie banking data', async () => {
      await calorieBankingStorage.createWeek(2000);
      await calorieBankingStorage.addTransaction({
        date: '2025-01-15',
        type: 'bank',
        amount: 100,
        reason: 'Test',
        balanceAfter: 100,
      });
      await calorieBankingStorage.saveSettings({
        isEnabled: false,
        maxBankablePerDay: 400,
        maxBorrowablePerDay: 200,
        maxWeeklyBank: 1000,
        minimumDailyCalories: 1300,
        autoDistributeDeficit: false,
        weekStartDay: 0,
      });

      await calorieBankingStorage.clearAllData();

      const week = await calorieBankingStorage.getCurrentWeek();
      const transactions = await calorieBankingStorage.getTransactions();
      const settings = await calorieBankingStorage.getSettings();

      expect(week).toBeNull();
      expect(transactions).toEqual([]);
      expect(settings.isEnabled).toBe(true); // Back to defaults
    });
  });
});
