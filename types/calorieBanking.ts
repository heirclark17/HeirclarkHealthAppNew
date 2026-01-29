// Weekly Calorie Banking Agent Types
// Enables flexible eating with weekly calorie budgets

export interface WeeklyCalorieBudget {
  id: string;
  weekStartDate: string; // ISO date (Monday)
  weekEndDate: string; // ISO date (Sunday)
  weeklyTarget: number; // Total calories for the week
  dailyBaseTarget: number; // Default daily target
  dailyLogs: DayCalorieLog[];
  bankedCalories: number; // Positive = saved, Negative = borrowed
  specialEvents: SpecialEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface DayCalorieLog {
  date: string; // ISO date
  dayName: string; // Monday, Tuesday, etc.
  targetCalories: number; // Adjusted target for this day
  consumedCalories: number;
  bankedAmount: number; // Positive = saved, Negative = borrowed
  isComplete: boolean;
  notes?: string;
}

export interface SpecialEvent {
  id: string;
  date: string;
  name: string;
  description?: string;
  additionalCalories: number; // Extra calories allocated
  isRecurring: boolean;
  recurringType?: 'weekly' | 'monthly';
}

export interface CalorieBankTransaction {
  id: string;
  date: string;
  type: 'bank' | 'borrow' | 'adjustment' | 'event_allocation';
  amount: number;
  reason: string;
  balanceAfter: number;
}

export interface CalorieBankingState {
  currentWeek: WeeklyCalorieBudget | null;
  transactionHistory: CalorieBankTransaction[];
  weeklyHistory: WeeklyCalorieBudget[];
  settings: CalorieBankingSettings;
  isLoading: boolean;
}

export interface CalorieBankingSettings {
  isEnabled: boolean;
  maxBankablePerDay: number; // Max calories that can be banked per day
  maxBorrowablePerDay: number; // Max calories that can be borrowed per day
  maxWeeklyBank: number; // Max total banked calories
  minimumDailyCalories: number; // Floor for daily intake
  autoDistributeDeficit: boolean; // Auto-spread deficit across remaining days
  weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
}

export interface BankingRecommendation {
  type: 'bank' | 'borrow' | 'maintain';
  amount: number;
  reason: string;
  adjustedTarget: number;
  weeklyRemaining: number;
  daysRemaining: number;
  averageNeeded: number;
}

// Constants
export const CALORIE_BANKING_CONSTANTS = {
  DEFAULT_MAX_BANKABLE_PER_DAY: 500,
  DEFAULT_MAX_BORROWABLE_PER_DAY: 300,
  DEFAULT_MAX_WEEKLY_BANK: 1500,
  DEFAULT_MINIMUM_DAILY: 1200,
  STORAGE_KEYS: {
    currentWeek: '@calorieBanking:currentWeek',
    weeklyHistory: '@calorieBanking:weeklyHistory',
    transactions: '@calorieBanking:transactions',
    settings: '@calorieBanking:settings',
  },
};
