/**
 * Tests for calorieBankingService.ts
 */

import {
  calculateBankableAmount,
  calculateBorrowableAmount,
  getBankingRecommendation,
  bankCalories,
  borrowCalories,
  redistributeCalories,
  completeDay,
  getWeeklySummary,
} from '../calorieBankingService';
import { calorieBankingStorage } from '../calorieBankingStorage';
import {
  CalorieBankingSettings,
  WeeklyCalorieBudget,
} from '../../types/calorieBanking';

jest.mock('../calorieBankingStorage', () => ({
  calorieBankingStorage: {
    getCurrentWeek: jest.fn(),
    getSettings: jest.fn(),
    createWeek: jest.fn(),
    updateWeek: jest.fn(),
    addTransaction: jest.fn(),
  },
}));

const mockedStorage = calorieBankingStorage as jest.Mocked<typeof calorieBankingStorage>;

const defaultSettings: CalorieBankingSettings = {
  isEnabled: true,
  maxBankablePerDay: 500,
  maxBorrowablePerDay: 300,
  maxWeeklyBank: 1500,
  minimumDailyCalories: 1200,
  autoDistributeDeficit: true,
  weekStartDay: 1,
};

function createMockWeek(overrides: Partial<WeeklyCalorieBudget> = {}): WeeklyCalorieBudget {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  return {
    id: 'week-1',
    weekStartDate: today,
    weekEndDate: dayAfter,
    weeklyTarget: 14000,
    dailyBaseTarget: 2000,
    bankedCalories: 200,
    specialEvents: [],
    createdAt: today,
    updatedAt: today,
    dailyLogs: [
      {
        date: today,
        dayName: 'Monday',
        targetCalories: 2000,
        consumedCalories: 0,
        bankedAmount: 0,
        isComplete: false,
      },
      {
        date: tomorrow,
        dayName: 'Tuesday',
        targetCalories: 2000,
        consumedCalories: 0,
        bankedAmount: 0,
        isComplete: false,
      },
      {
        date: dayAfter,
        dayName: 'Wednesday',
        targetCalories: 2000,
        consumedCalories: 0,
        bankedAmount: 0,
        isComplete: false,
      },
    ],
    ...overrides,
  };
}

describe('calorieBankingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================
  // calculateBankableAmount
  // =============================================
  describe('calculateBankableAmount', () => {
    it('should return 0 when consumed exceeds day target (no surplus)', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(createMockWeek());
      const result = await calculateBankableAmount(2200, 2000, defaultSettings);
      expect(result.amount).toBe(0);
      expect(result.reason).toBe('No surplus to bank');
    });

    it('should return 0 when consumed equals day target', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(createMockWeek());
      const result = await calculateBankableAmount(2000, 2000, defaultSettings);
      expect(result.amount).toBe(0);
      expect(result.reason).toBe('No surplus to bank');
    });

    it('should return 0 when consumed is below minimum daily calories', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(createMockWeek());
      const result = await calculateBankableAmount(1000, 2000, defaultSettings);
      expect(result.amount).toBe(0);
      expect(result.reason).toContain('Eat at least');
    });

    it('should return bankable amount capped at maxBankablePerDay', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(createMockWeek({ bankedCalories: 0 }));
      // consumed=1300, target=2000, surplus=700, max bankable=500
      const result = await calculateBankableAmount(1300, 2000, defaultSettings);
      expect(result.amount).toBe(500);
      expect(result.reason).toBe('Available to bank');
    });

    it('should return full surplus when below maxBankablePerDay', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(createMockWeek({ bankedCalories: 0 }));
      // consumed=1700, target=2000, surplus=300
      const result = await calculateBankableAmount(1700, 2000, defaultSettings);
      expect(result.amount).toBe(300);
      expect(result.reason).toBe('Available to bank');
    });

    it('should limit by weekly bank cap', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(
        createMockWeek({ bankedCalories: 1400 })
      );
      // surplus=500, banked=1400, weekly max=1500, so only 100 allowable
      const result = await calculateBankableAmount(1500, 2000, defaultSettings);
      expect(result.amount).toBe(100);
      expect(result.reason).toContain('weekly bank cap');
    });

    it('should return 0 when weekly bank is already at max', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(
        createMockWeek({ bankedCalories: 1500 })
      );
      const result = await calculateBankableAmount(1500, 2000, defaultSettings);
      expect(result.amount).toBe(0);
      expect(result.reason).toContain('weekly bank cap');
    });

    it('should handle no current week gracefully', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(null);
      // No week means no weekly limit check, just cap at maxBankablePerDay
      const result = await calculateBankableAmount(1500, 2000, defaultSettings);
      expect(result.amount).toBe(500);
      expect(result.reason).toBe('Available to bank');
    });
  });

  // =============================================
  // calculateBorrowableAmount
  // =============================================
  describe('calculateBorrowableAmount', () => {
    it('should return 0 when no active week', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(null);
      const result = await calculateBorrowableAmount(2500, 2000, defaultSettings);
      expect(result.amount).toBe(0);
      expect(result.reason).toBe('No active week');
    });

    it('should return 0 when no banked calories available', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(createMockWeek({ bankedCalories: 0 }));
      const result = await calculateBorrowableAmount(2500, 2000, defaultSettings);
      expect(result.amount).toBe(0);
      expect(result.reason).toBe('No banked calories available');
    });

    it('should return 0 when needed does not exceed day target', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(createMockWeek({ bankedCalories: 500 }));
      const result = await calculateBorrowableAmount(1800, 2000, defaultSettings);
      expect(result.amount).toBe(0);
      expect(result.reason).toBe('No need to borrow');
    });

    it('should return borrowable amount limited by banked calories', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(createMockWeek({ bankedCalories: 100 }));
      // want=2500-2000=500, maxBorrow=min(500,300,100)=100
      const result = await calculateBorrowableAmount(2500, 2000, defaultSettings);
      expect(result.amount).toBe(100);
      expect(result.reason).toBe('Available from banked calories');
    });

    it('should return borrowable amount limited by maxBorrowablePerDay', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(createMockWeek({ bankedCalories: 1000 }));
      // want=2500-2000=500, maxBorrow=min(500,300,1000)=300
      const result = await calculateBorrowableAmount(2500, 2000, defaultSettings);
      expect(result.amount).toBe(300);
    });

    it('should return exact want when it is the minimum', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(createMockWeek({ bankedCalories: 1000 }));
      // want=2100-2000=100, maxBorrow=min(100,300,1000)=100
      const result = await calculateBorrowableAmount(2100, 2000, defaultSettings);
      expect(result.amount).toBe(100);
    });
  });

  // =============================================
  // getBankingRecommendation
  // =============================================
  describe('getBankingRecommendation', () => {
    it('should create a new week if none exists', async () => {
      const mockWeek = createMockWeek({ bankedCalories: 0 });
      mockedStorage.getSettings.mockResolvedValue(defaultSettings);
      mockedStorage.getCurrentWeek.mockResolvedValue(null);
      mockedStorage.createWeek.mockResolvedValue(mockWeek);

      const result = await getBankingRecommendation(1500, 2000);
      expect(mockedStorage.createWeek).toHaveBeenCalledWith(2000);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('should recommend banking when surplus > 100 and bank not full', async () => {
      const today = new Date().toISOString().split('T')[0];
      const mockWeek = createMockWeek({
        bankedCalories: 0,
        dailyLogs: [
          {
            date: today,
            dayName: 'Monday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getSettings.mockResolvedValue(defaultSettings);
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);

      // consumed=1500, target=2000, surplus=500 > 100
      const result = await getBankingRecommendation(1500, 2000);
      expect(result.type).toBe('bank');
      expect(result.amount).toBeGreaterThan(0);
    });

    it('should recommend borrowing when deficit > 100 and banked > 0', async () => {
      const today = new Date().toISOString().split('T')[0];
      const mockWeek = createMockWeek({
        bankedCalories: 500,
        dailyLogs: [
          {
            date: today,
            dayName: 'Monday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getSettings.mockResolvedValue(defaultSettings);
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);

      // consumed=2200, target=2000, deficit=200 > 100
      const result = await getBankingRecommendation(2200, 2000);
      expect(result.type).toBe('borrow');
    });

    it('should recommend maintain when on track', async () => {
      const today = new Date().toISOString().split('T')[0];
      const mockWeek = createMockWeek({
        bankedCalories: 500,
        dailyLogs: [
          {
            date: today,
            dayName: 'Monday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getSettings.mockResolvedValue(defaultSettings);
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);

      // consumed=1950, target=2000, surplus=50 < 100
      const result = await getBankingRecommendation(1950, 2000);
      expect(result.type).toBe('maintain');
      expect(result.amount).toBe(0);
      expect(result.reason).toBe('On track for the day');
    });
  });

  // =============================================
  // bankCalories
  // =============================================
  describe('bankCalories', () => {
    it('should return null when no current week', async () => {
      mockedStorage.getSettings.mockResolvedValue(defaultSettings);
      mockedStorage.getCurrentWeek.mockResolvedValue(null);

      const result = await bankCalories(200);
      expect(result).toBeNull();
    });

    it('should bank calories and update week', async () => {
      const today = new Date().toISOString().split('T')[0];
      const mockWeek = createMockWeek({
        bankedCalories: 100,
        dailyLogs: [
          {
            date: today,
            dayName: 'Monday',
            targetCalories: 2000,
            consumedCalories: 1500,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getSettings.mockResolvedValue(defaultSettings);
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);
      mockedStorage.updateWeek.mockResolvedValue(undefined);
      mockedStorage.addTransaction.mockResolvedValue(undefined);

      const result = await bankCalories(200);
      expect(result).not.toBeNull();
      expect(result!.bankedCalories).toBe(300); // 100 + 200
      expect(result!.dailyLogs[0].bankedAmount).toBe(200);
      expect(mockedStorage.updateWeek).toHaveBeenCalled();
      expect(mockedStorage.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bank',
          amount: 200,
          reason: 'Daily surplus banked',
        })
      );
    });

    it('should return week unchanged if today not found in logs', async () => {
      const mockWeek = createMockWeek({
        dailyLogs: [
          {
            date: '2020-01-01',
            dayName: 'Monday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getSettings.mockResolvedValue(defaultSettings);
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);

      const result = await bankCalories(200);
      expect(result).toEqual(mockWeek);
      expect(mockedStorage.updateWeek).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // borrowCalories
  // =============================================
  describe('borrowCalories', () => {
    it('should return null when no current week', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(null);
      const result = await borrowCalories(200);
      expect(result).toBeNull();
    });

    it('should return null when banked < requested amount', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(createMockWeek({ bankedCalories: 100 }));
      const result = await borrowCalories(200);
      expect(result).toBeNull();
    });

    it('should borrow calories and update week', async () => {
      const today = new Date().toISOString().split('T')[0];
      const mockWeek = createMockWeek({
        bankedCalories: 500,
        dailyLogs: [
          {
            date: today,
            dayName: 'Monday',
            targetCalories: 2000,
            consumedCalories: 2200,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);
      mockedStorage.updateWeek.mockResolvedValue(undefined);
      mockedStorage.addTransaction.mockResolvedValue(undefined);

      const result = await borrowCalories(200);
      expect(result).not.toBeNull();
      expect(result!.bankedCalories).toBe(300); // 500 - 200
      expect(result!.dailyLogs[0].bankedAmount).toBe(-200);
      expect(result!.dailyLogs[0].targetCalories).toBe(2200); // 2000 + 200
      expect(mockedStorage.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'borrow',
          amount: -200,
        })
      );
    });
  });

  // =============================================
  // redistributeCalories
  // =============================================
  describe('redistributeCalories', () => {
    it('should return null when no current week', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(null);
      const result = await redistributeCalories();
      expect(result).toBeNull();
    });

    it('should redistribute remaining calories among incomplete days', async () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const mockWeek = createMockWeek({
        weeklyTarget: 14000,
        dailyLogs: [
          {
            date: '2020-01-01', // past, complete
            dayName: 'Monday',
            targetCalories: 2000,
            consumedCalories: 1800,
            bankedAmount: 200,
            isComplete: true,
          },
          {
            date: today,
            dayName: 'Tuesday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
          {
            date: tomorrow,
            dayName: 'Wednesday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);
      mockedStorage.updateWeek.mockResolvedValue(undefined);

      const result = await redistributeCalories();
      expect(result).not.toBeNull();
      // remaining = 14000 - 1800 = 12200
      // 2 remaining days, so 6100 each
      const todayLog = result!.dailyLogs.find(d => d.date === today);
      const tomorrowLog = result!.dailyLogs.find(d => d.date === tomorrow);
      expect(todayLog!.targetCalories).toBe(6100);
      expect(tomorrowLog!.targetCalories).toBe(6100);
    });

    it('should return week unchanged if no remaining incomplete days', async () => {
      const mockWeek = createMockWeek({
        weeklyTarget: 14000,
        dailyLogs: [
          {
            date: '2020-01-01',
            dayName: 'Monday',
            targetCalories: 2000,
            consumedCalories: 2000,
            bankedAmount: 0,
            isComplete: true,
          },
        ],
      });
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);

      const result = await redistributeCalories();
      expect(result).toEqual(mockWeek);
    });
  });

  // =============================================
  // completeDay
  // =============================================
  describe('completeDay', () => {
    it('should return null when no current week', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(null);
      const result = await completeDay('2025-01-15', 1800);
      expect(result).toBeNull();
    });

    it('should mark day as complete and recalculate banked', async () => {
      const mockWeek = createMockWeek({
        bankedCalories: 0,
        dailyLogs: [
          {
            date: '2025-01-15',
            dayName: 'Wednesday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);
      mockedStorage.updateWeek.mockResolvedValue(undefined);
      mockedStorage.addTransaction.mockResolvedValue(undefined);

      const result = await completeDay('2025-01-15', 1800);
      expect(result).not.toBeNull();
      const completedDay = result!.dailyLogs[0];
      expect(completedDay.isComplete).toBe(true);
      expect(completedDay.consumedCalories).toBe(1800);
      expect(completedDay.bankedAmount).toBe(200); // 2000 - 1800
      expect(result!.bankedCalories).toBe(200);
    });

    it('should handle overconsumption (negative surplus)', async () => {
      const mockWeek = createMockWeek({
        bankedCalories: 0,
        dailyLogs: [
          {
            date: '2025-01-15',
            dayName: 'Wednesday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);
      mockedStorage.updateWeek.mockResolvedValue(undefined);
      mockedStorage.addTransaction.mockResolvedValue(undefined);

      const result = await completeDay('2025-01-15', 2300);
      expect(result).not.toBeNull();
      expect(result!.dailyLogs[0].bankedAmount).toBe(-300); // 2000 - 2300
      expect(mockedStorage.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'borrow', amount: -300 })
      );
    });

    it('should not log transaction when surplus is zero', async () => {
      const mockWeek = createMockWeek({
        bankedCalories: 0,
        dailyLogs: [
          {
            date: '2025-01-15',
            dayName: 'Wednesday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);
      mockedStorage.updateWeek.mockResolvedValue(undefined);

      await completeDay('2025-01-15', 2000);
      expect(mockedStorage.addTransaction).not.toHaveBeenCalled();
    });

    it('should return week unchanged if date not found', async () => {
      const mockWeek = createMockWeek({
        dailyLogs: [
          {
            date: '2025-01-15',
            dayName: 'Wednesday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);

      const result = await completeDay('1999-01-01', 1800);
      expect(result).toEqual(mockWeek);
    });
  });

  // =============================================
  // getWeeklySummary
  // =============================================
  describe('getWeeklySummary', () => {
    it('should return null when no current week', async () => {
      mockedStorage.getCurrentWeek.mockResolvedValue(null);
      const result = await getWeeklySummary();
      expect(result).toBeNull();
    });

    it('should calculate correct weekly summary', async () => {
      const mockWeek = createMockWeek({
        weeklyTarget: 14000,
        bankedCalories: 300,
        dailyBaseTarget: 2000,
        dailyLogs: [
          {
            date: '2025-01-13',
            dayName: 'Monday',
            targetCalories: 2000,
            consumedCalories: 1800,
            bankedAmount: 200,
            isComplete: true,
          },
          {
            date: '2025-01-14',
            dayName: 'Tuesday',
            targetCalories: 2000,
            consumedCalories: 1900,
            bankedAmount: 100,
            isComplete: true,
          },
          {
            date: '2025-01-15',
            dayName: 'Wednesday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);

      const result = await getWeeklySummary();
      expect(result).not.toBeNull();
      expect(result!.weeklyTarget).toBe(14000);
      expect(result!.weeklyConsumed).toBe(3700); // 1800 + 1900
      expect(result!.weeklyRemaining).toBe(10300); // 14000 - 3700
      expect(result!.bankedCalories).toBe(300);
      expect(result!.daysComplete).toBe(2);
      expect(result!.daysRemaining).toBe(5); // 7 - 2
    });

    it('should use dailyBaseTarget when no days are complete', async () => {
      const mockWeek = createMockWeek({
        weeklyTarget: 14000,
        bankedCalories: 0,
        dailyBaseTarget: 2000,
        dailyLogs: [
          {
            date: '2025-01-13',
            dayName: 'Monday',
            targetCalories: 2000,
            consumedCalories: 0,
            bankedAmount: 0,
            isComplete: false,
          },
        ],
      });
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);

      const result = await getWeeklySummary();
      expect(result).not.toBeNull();
      expect(result!.daysComplete).toBe(0);
      // projectedEndOfWeek = 0 + (2000 * 7) = 14000
      expect(result!.projectedEndOfWeek).toBe(14000);
      expect(result!.onTrack).toBe(true); // 14000 <= 14000 * 1.05
    });

    it('should mark as not on track when projected exceeds target by >5%', async () => {
      const mockWeek = createMockWeek({
        weeklyTarget: 14000,
        bankedCalories: 0,
        dailyBaseTarget: 2000,
        dailyLogs: [
          {
            date: '2025-01-13',
            dayName: 'Monday',
            targetCalories: 2000,
            consumedCalories: 3000,
            bankedAmount: 0,
            isComplete: true,
          },
        ],
      });
      mockedStorage.getCurrentWeek.mockResolvedValue(mockWeek);

      const result = await getWeeklySummary();
      // averageDaily = 3000/1 = 3000, projected = 3000 + (3000*6) = 21000
      // 21000 > 14700 (14000 * 1.05)
      expect(result!.onTrack).toBe(false);
    });
  });
});
