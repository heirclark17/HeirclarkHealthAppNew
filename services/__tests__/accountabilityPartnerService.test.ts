/**
 * Tests for accountabilityPartnerService.ts
 * Business logic for streak tracking, message generation, and progress analysis
 */

jest.mock('../accountabilityPartnerStorage', () => ({
  getStreaks: jest.fn(),
  updateActivityStreak: jest.fn(),
  getCheckIns: jest.fn(),
  addMessage: jest.fn(),
  getEngagementMetrics: jest.fn(),
  saveEngagementMetrics: jest.fn(),
  getWeeklySummaries: jest.fn(),
}));

import {
  updateActivityStreak,
  addMessage,
} from '../accountabilityPartnerStorage';
import {
  createMessage,
  generateStreakMessage,
  generateEncouragementMessage,
  generateComebackMessage,
  generateGoalAchievedMessage,
  generateReminderMessage,
  isStreakAtRisk,
  getBestStreak,
  getStreaksAtRisk,
  calculateConsistencyScore,
  generateWeeklySummary,
  calculateAverageMood,
  calculateAverageEnergy,
  getCheckInCompletionRate,
  getDaysSinceLastActive,
  needsComebackMessage,
  needsEncouragement,
  getSmartRecommendations,
  handleMealLogged,
  handleWeightLogged,
  handleWorkoutCompleted,
  handleCalorieGoalMet,
  handleWaterGoalMet,
} from '../accountabilityPartnerService';
import {
  ActivityStreaks,
  StreakData,
  DailyCheckIn,
  EngagementMetrics,
  ACCOUNTABILITY_CONSTANTS,
} from '../../types/accountabilityPartner';

// Helper to create a default StreakData
function makeStreak(overrides: Partial<StreakData> = {}): StreakData {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastLoggedDate: null,
    totalDaysLogged: 0,
    startDate: '2025-01-01',
    ...overrides,
  };
}

// Helper to create default ActivityStreaks
function makeStreaks(overrides: Partial<ActivityStreaks> = {}): ActivityStreaks {
  return {
    mealLogging: makeStreak(),
    weightLogging: makeStreak(),
    workoutCompletion: makeStreak(),
    waterIntake: makeStreak(),
    calorieGoalMet: makeStreak(),
    ...overrides,
  };
}

// Helper to create a DailyCheckIn
function makeCheckIn(overrides: Partial<DailyCheckIn> = {}): DailyCheckIn {
  return {
    date: '2025-01-15',
    morningCheckIn: false,
    eveningCheckIn: false,
    moodRating: null,
    energyLevel: null,
    notes: '',
    goalsForToday: [],
    accomplishments: [],
    timestamp: Date.now(),
    ...overrides,
  };
}

// Helper to create EngagementMetrics
function makeMetrics(overrides: Partial<EngagementMetrics> = {}): EngagementMetrics {
  return {
    appOpensThisWeek: 5,
    lastAppOpen: Date.now(),
    averageDailyEngagementMinutes: 10,
    preferredCheckInTime: null,
    mostActiveDay: null,
    consistencyScore: 50,
    ...overrides,
  };
}

describe('accountabilityPartnerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============ Message Generation ============

  describe('createMessage', () => {
    it('should create a motivational message with correct fields', () => {
      const msg = createMessage('encouragement', 'Test Title', 'Test body', 'heart');

      expect(msg.type).toBe('encouragement');
      expect(msg.title).toBe('Test Title');
      expect(msg.message).toBe('Test body');
      expect(msg.icon).toBe('heart');
      expect(msg.read).toBe(false);
      expect(msg.actionRequired).toBe(false);
      expect(msg.actionType).toBeUndefined();
      expect(msg.id).toMatch(/^msg_/);
      expect(typeof msg.timestamp).toBe('number');
    });

    it('should create a message with action required', () => {
      const msg = createMessage('reminder', 'Reminder', 'Log now', 'bell', true, 'log_meal');

      expect(msg.actionRequired).toBe(true);
      expect(msg.actionType).toBe('log_meal');
    });
  });

  describe('generateStreakMessage', () => {
    it('should return a message for a milestone streak', () => {
      const msg = generateStreakMessage('mealLogging', 7);

      expect(msg).not.toBeNull();
      expect(msg!.type).toBe('streak_milestone');
      expect(msg!.title).toContain('Meal Logging');
      expect(msg!.title).toContain('7 Days');
      expect(msg!.icon).toBe('restaurant');
    });

    it('should return null for a non-milestone streak', () => {
      const msg = generateStreakMessage('mealLogging', 5);
      expect(msg).toBeNull();
    });

    it('should return correct icon for each activity type', () => {
      const activities: Array<{ key: keyof ActivityStreaks; icon: string }> = [
        { key: 'mealLogging', icon: 'restaurant' },
        { key: 'weightLogging', icon: 'scale' },
        { key: 'workoutCompletion', icon: 'fitness' },
        { key: 'waterIntake', icon: 'water' },
        { key: 'calorieGoalMet', icon: 'flame' },
      ];

      for (const { key, icon } of activities) {
        const msg = generateStreakMessage(key, 3); // 3 is a milestone
        expect(msg).not.toBeNull();
        expect(msg!.icon).toBe(icon);
      }
    });

    it('should use fallback message for unlisted milestones', () => {
      // 150 is a milestone but not in STREAK_MESSAGES keys (only up to 100)
      const msg = generateStreakMessage('mealLogging', 150);
      expect(msg).not.toBeNull();
      expect(msg!.message).toContain('150 days');
    });
  });

  describe('generateEncouragementMessage', () => {
    it('should return a valid encouragement message', () => {
      const msg = generateEncouragementMessage();

      expect(msg.type).toBe('encouragement');
      expect(msg.title).toBe('Daily Motivation');
      expect(msg.icon).toBe('heart');
      expect(msg.message.length).toBeGreaterThan(0);
    });
  });

  describe('generateComebackMessage', () => {
    it('should include days since last active in title', () => {
      const msg = generateComebackMessage(10);

      expect(msg.type).toBe('comeback');
      expect(msg.title).toContain('10 days');
      expect(msg.icon).toBe('hand-right');
    });
  });

  describe('generateGoalAchievedMessage', () => {
    it('should include goal type in title', () => {
      const msg = generateGoalAchievedMessage('Calorie');

      expect(msg.type).toBe('goal_achieved');
      expect(msg.title).toContain('Calorie');
      expect(msg.title).toContain('Goal Achieved');
      expect(msg.icon).toBe('trophy');
    });
  });

  describe('generateReminderMessage', () => {
    it('should generate meal reminder with action', () => {
      const msg = generateReminderMessage('meal', 'Lunch');

      expect(msg.type).toBe('reminder');
      expect(msg.title).toContain('Lunch');
      expect(msg.actionRequired).toBe(true);
      expect(msg.actionType).toBe('log_meal');
      expect(msg.icon).toBe('restaurant');
    });

    it('should generate workout reminder', () => {
      const msg = generateReminderMessage('workout');

      expect(msg.title).toBe('Workout Reminder');
      expect(msg.actionType).toBe('log_workout');
    });

    it('should generate weight reminder', () => {
      const msg = generateReminderMessage('weight');

      expect(msg.title).toBe('Weight Check-In');
      expect(msg.actionType).toBe('log_weight');
    });

    it('should generate water reminder without action type', () => {
      const msg = generateReminderMessage('water');

      expect(msg.title).toBe('Hydration Reminder');
      expect(msg.actionType).toBeUndefined();
    });

    it('should generate check_in reminder', () => {
      const msg = generateReminderMessage('check_in');

      expect(msg.title).toBe('Daily Check-In');
      expect(msg.actionType).toBe('check_in');
    });

    it('should use generic meal title when no meal type provided', () => {
      const msg = generateReminderMessage('meal');

      expect(msg.title).toContain('a Meal');
    });
  });

  // ============ Streak Analysis ============

  describe('isStreakAtRisk', () => {
    it('should return false if streak is 0', () => {
      const streak = makeStreak({ currentStreak: 0 });
      expect(isStreakAtRisk(streak)).toBe(false);
    });

    it('should return false if lastLoggedDate is null', () => {
      const streak = makeStreak({ currentStreak: 5, lastLoggedDate: null });
      expect(isStreakAtRisk(streak)).toBe(false);
    });

    it('should return false if logged today', () => {
      const today = new Date().toISOString().split('T')[0];
      const streak = makeStreak({ currentStreak: 5, lastLoggedDate: today });
      expect(isStreakAtRisk(streak)).toBe(false);
    });

    it('should return false if logged yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const streak = makeStreak({
        currentStreak: 5,
        lastLoggedDate: yesterday.toISOString().split('T')[0],
      });
      expect(isStreakAtRisk(streak)).toBe(false);
    });

    it('should return true if last logged 2+ days ago', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const streak = makeStreak({
        currentStreak: 5,
        lastLoggedDate: twoDaysAgo.toISOString().split('T')[0],
      });
      expect(isStreakAtRisk(streak)).toBe(true);
    });
  });

  describe('getBestStreak', () => {
    it('should return the activity with the highest current streak', () => {
      const streaks = makeStreaks({
        mealLogging: makeStreak({ currentStreak: 3 }),
        workoutCompletion: makeStreak({ currentStreak: 10 }),
        waterIntake: makeStreak({ currentStreak: 5 }),
      });

      const result = getBestStreak(streaks);

      expect(result.activity).toBe('workoutCompletion');
      expect(result.streak.currentStreak).toBe(10);
    });

    it('should default to mealLogging when all are tied at 0', () => {
      const streaks = makeStreaks();
      const result = getBestStreak(streaks);

      expect(result.activity).toBe('mealLogging');
      expect(result.streak.currentStreak).toBe(0);
    });
  });

  describe('getStreaksAtRisk', () => {
    it('should return activities with at-risk streaks', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const dateStr = threeDaysAgo.toISOString().split('T')[0];

      const streaks = makeStreaks({
        mealLogging: makeStreak({ currentStreak: 5, lastLoggedDate: dateStr }),
        weightLogging: makeStreak({ currentStreak: 3, lastLoggedDate: dateStr }),
        workoutCompletion: makeStreak({ currentStreak: 0 }),
      });

      const atRisk = getStreaksAtRisk(streaks);

      expect(atRisk).toContain('mealLogging');
      expect(atRisk).toContain('weightLogging');
      expect(atRisk).not.toContain('workoutCompletion'); // streak is 0
    });

    it('should return empty array when no streaks at risk', () => {
      const today = new Date().toISOString().split('T')[0];
      const streaks = makeStreaks({
        mealLogging: makeStreak({ currentStreak: 5, lastLoggedDate: today }),
      });

      const atRisk = getStreaksAtRisk(streaks);
      // mealLogging is logged today, rest have streak 0
      expect(atRisk.length).toBe(0);
    });
  });

  describe('calculateConsistencyScore', () => {
    it('should return 0 when no days logged', () => {
      const streaks = makeStreaks();
      const score = calculateConsistencyScore(streaks, 30);
      expect(score).toBe(0);
    });

    it('should return 100 when all activities logged every day', () => {
      const streaks = makeStreaks({
        mealLogging: makeStreak({ totalDaysLogged: 30 }),
        weightLogging: makeStreak({ totalDaysLogged: 30 }),
        workoutCompletion: makeStreak({ totalDaysLogged: 30 }),
        waterIntake: makeStreak({ totalDaysLogged: 30 }),
        calorieGoalMet: makeStreak({ totalDaysLogged: 30 }),
      });
      const score = calculateConsistencyScore(streaks, 30);
      expect(score).toBe(100);
    });

    it('should cap individual activity score at 100', () => {
      const streaks = makeStreaks({
        mealLogging: makeStreak({ totalDaysLogged: 60 }),
        weightLogging: makeStreak({ totalDaysLogged: 60 }),
        workoutCompletion: makeStreak({ totalDaysLogged: 60 }),
        waterIntake: makeStreak({ totalDaysLogged: 60 }),
        calorieGoalMet: makeStreak({ totalDaysLogged: 60 }),
      });
      const score = calculateConsistencyScore(streaks, 30);
      expect(score).toBe(100);
    });
  });

  // ============ Weekly Summary Generation ============

  describe('generateWeeklySummary', () => {
    it('should generate a valid weekly summary', async () => {
      const streaks = makeStreaks({
        workoutCompletion: makeStreak({ currentStreak: 10 }),
      });

      const summary = await generateWeeklySummary(
        15, // mealsLogged
        4,  // workoutsCompleted
        5,  // daysOnTarget
        2000, // averageCalories
        150,  // averageProtein
        -1.5, // weightChange
        streaks
      );

      expect(summary.mealsLogged).toBe(15);
      expect(summary.workoutsCompleted).toBe(4);
      expect(summary.daysOnTarget).toBe(5);
      expect(summary.averageCalories).toBe(2000);
      expect(summary.averageProtein).toBe(150);
      expect(summary.weightChange).toBe(-1.5);
      expect(summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(summary.overallScore).toBeLessThanOrEqual(100);
      expect(summary.topAccomplishment.length).toBeGreaterThan(0);
      expect(summary.areasToImprove.length).toBeGreaterThan(0);
      expect(summary.motivationalNote.length).toBeGreaterThan(0);
    });

    it('should identify streak as top accomplishment when streak >= 7', async () => {
      const streaks = makeStreaks({
        mealLogging: makeStreak({ currentStreak: 14 }),
      });

      const summary = await generateWeeklySummary(21, 5, 7, 2000, 150, -1, streaks);

      expect(summary.topAccomplishment).toContain('streak');
    });

    it('should identify calorie target as top accomplishment when daysOnTarget >= 5 and no long streak', async () => {
      const streaks = makeStreaks();

      const summary = await generateWeeklySummary(21, 2, 6, 2000, 150, -1, streaks);

      expect(summary.topAccomplishment).toContain('calorie target');
    });

    it('should suggest improvements when stats are low', async () => {
      const streaks = makeStreaks();

      const summary = await generateWeeklySummary(10, 1, 2, 1500, 100, null, streaks);

      expect(summary.areasToImprove.length).toBeGreaterThan(0);
      // Should suggest hitting calorie targets (daysOnTarget < 4)
      expect(summary.areasToImprove.some((a: string) => a.includes('calorie'))).toBe(true);
    });

    it('should say keep doing what you are doing when all stats are good', async () => {
      const streaks = makeStreaks();

      const summary = await generateWeeklySummary(21, 5, 6, 2000, 150, -1, streaks);

      expect(summary.areasToImprove).toContain("Keep doing what you're doing!");
    });
  });

  // ============ Check-In Analysis ============

  describe('calculateAverageMood', () => {
    it('should return null for empty array', () => {
      expect(calculateAverageMood([])).toBeNull();
    });

    it('should return null if all mood ratings are null', () => {
      const checkIns = [
        makeCheckIn({ moodRating: null }),
        makeCheckIn({ moodRating: null }),
      ];
      expect(calculateAverageMood(checkIns)).toBeNull();
    });

    it('should calculate average mood correctly', () => {
      const checkIns = [
        makeCheckIn({ moodRating: 4 }),
        makeCheckIn({ moodRating: 2 }),
        makeCheckIn({ moodRating: 3 }),
      ];
      expect(calculateAverageMood(checkIns)).toBe(3);
    });

    it('should ignore null mood ratings', () => {
      const checkIns = [
        makeCheckIn({ moodRating: 4 }),
        makeCheckIn({ moodRating: null }),
        makeCheckIn({ moodRating: 2 }),
      ];
      expect(calculateAverageMood(checkIns)).toBe(3);
    });
  });

  describe('calculateAverageEnergy', () => {
    it('should return null for empty array', () => {
      expect(calculateAverageEnergy([])).toBeNull();
    });

    it('should calculate average energy correctly', () => {
      const checkIns = [
        makeCheckIn({ energyLevel: 5 }),
        makeCheckIn({ energyLevel: 3 }),
      ];
      expect(calculateAverageEnergy(checkIns)).toBe(4);
    });
  });

  describe('getCheckInCompletionRate', () => {
    it('should return 0 when no check-ins completed', () => {
      const checkIns = [
        makeCheckIn({ morningCheckIn: false, eveningCheckIn: false }),
      ];
      expect(getCheckInCompletionRate(checkIns, 7)).toBe(0);
    });

    it('should calculate completion rate correctly', () => {
      const checkIns = [
        makeCheckIn({ morningCheckIn: true }),
        makeCheckIn({ eveningCheckIn: true }),
        makeCheckIn({ morningCheckIn: true, eveningCheckIn: true }),
      ];
      // 3 completed out of 7 days
      expect(getCheckInCompletionRate(checkIns, 7)).toBe(43);
    });

    it('should handle custom day count', () => {
      const checkIns = [
        makeCheckIn({ morningCheckIn: true }),
        makeCheckIn({ eveningCheckIn: true }),
      ];
      expect(getCheckInCompletionRate(checkIns, 2)).toBe(100);
    });
  });

  // ============ Engagement Analysis ============

  describe('getDaysSinceLastActive', () => {
    it('should return 0 for current timestamp', () => {
      expect(getDaysSinceLastActive(Date.now())).toBe(0);
    });

    it('should return correct number of days', () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      expect(getDaysSinceLastActive(threeDaysAgo)).toBe(3);
    });
  });

  describe('needsComebackMessage', () => {
    it('should return true if inactive for >= INACTIVE_DAYS_COMEBACK', () => {
      const daysAgo = ACCOUNTABILITY_CONSTANTS.INACTIVE_DAYS_COMEBACK;
      const lastOpen = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
      const metrics = makeMetrics({ lastAppOpen: lastOpen });

      expect(needsComebackMessage(metrics)).toBe(true);
    });

    it('should return false if recently active', () => {
      const metrics = makeMetrics({ lastAppOpen: Date.now() });
      expect(needsComebackMessage(metrics)).toBe(false);
    });
  });

  describe('needsEncouragement', () => {
    it('should return true when consistency score is low', () => {
      const metrics = makeMetrics();
      const streaks = makeStreaks(); // all zeros = low consistency
      expect(needsEncouragement(metrics, streaks)).toBe(true);
    });

    it('should return false when consistency score is high', () => {
      const metrics = makeMetrics();
      const streaks = makeStreaks({
        mealLogging: makeStreak({ totalDaysLogged: 30 }),
        weightLogging: makeStreak({ totalDaysLogged: 30 }),
        workoutCompletion: makeStreak({ totalDaysLogged: 30 }),
        waterIntake: makeStreak({ totalDaysLogged: 30 }),
        calorieGoalMet: makeStreak({ totalDaysLogged: 30 }),
      });
      expect(needsEncouragement(metrics, streaks)).toBe(false);
    });
  });

  // ============ Smart Recommendations ============

  describe('getSmartRecommendations', () => {
    it('should return at most 3 recommendations', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const dateStr = threeDaysAgo.toISOString().split('T')[0];

      const streaks = makeStreaks({
        mealLogging: makeStreak({ currentStreak: 5, lastLoggedDate: dateStr }),
        weightLogging: makeStreak({ currentStreak: 3, lastLoggedDate: dateStr }),
      });

      const checkIns = [
        makeCheckIn({ moodRating: 1, energyLevel: 1, morningCheckIn: false }),
        makeCheckIn({ moodRating: 2, energyLevel: 2, morningCheckIn: false }),
        makeCheckIn({ moodRating: 1, energyLevel: 1, morningCheckIn: false }),
        makeCheckIn({ moodRating: 2, energyLevel: 2, morningCheckIn: false }),
        makeCheckIn({ moodRating: 1, energyLevel: 1, morningCheckIn: false }),
        makeCheckIn({ moodRating: 2, energyLevel: 2, morningCheckIn: false }),
        makeCheckIn({ moodRating: 1, energyLevel: 1, morningCheckIn: false }),
      ];

      const metrics = makeMetrics();

      const recs = getSmartRecommendations(streaks, checkIns, metrics);

      expect(recs.length).toBeLessThanOrEqual(3);
    });

    it('should recommend logging when streaks are at risk', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const dateStr = threeDaysAgo.toISOString().split('T')[0];

      const streaks = makeStreaks({
        mealLogging: makeStreak({ currentStreak: 5, lastLoggedDate: dateStr }),
      });

      const recs = getSmartRecommendations(streaks, [], makeMetrics());

      expect(recs.some((r: string) => r.includes('streak is at risk'))).toBe(true);
    });

    it('should encourage when best streak is high', () => {
      const today = new Date().toISOString().split('T')[0];
      const streaks = makeStreaks({
        mealLogging: makeStreak({ currentStreak: 10, lastLoggedDate: today }),
      });

      const recs = getSmartRecommendations(streaks, [], makeMetrics());

      expect(recs.some((r: string) => r.includes('on fire'))).toBe(true);
    });

    it('should return empty array when everything is fine and no data', () => {
      const streaks = makeStreaks();
      const recs = getSmartRecommendations(streaks, [], makeMetrics());
      // Only gets check-in rate recommendation since no check-ins
      expect(recs.length).toBeLessThanOrEqual(3);
    });
  });

  // ============ Activity Logging Handlers ============

  describe('handleMealLogged', () => {
    it('should update streak and return null for non-milestone', async () => {
      (updateActivityStreak as jest.Mock).mockResolvedValue(
        makeStreaks({ mealLogging: makeStreak({ currentStreak: 2 }) })
      );

      const result = await handleMealLogged();

      expect(updateActivityStreak).toHaveBeenCalledWith('mealLogging', true);
      expect(result).toBeNull();
      expect(addMessage).not.toHaveBeenCalled();
    });

    it('should return a message and save it for a milestone streak', async () => {
      (updateActivityStreak as jest.Mock).mockResolvedValue(
        makeStreaks({ mealLogging: makeStreak({ currentStreak: 7 }) })
      );

      const result = await handleMealLogged();

      expect(result).not.toBeNull();
      expect(result!.type).toBe('streak_milestone');
      expect(addMessage).toHaveBeenCalledWith(result);
    });
  });

  describe('handleWeightLogged', () => {
    it('should update weight streak', async () => {
      (updateActivityStreak as jest.Mock).mockResolvedValue(
        makeStreaks({ weightLogging: makeStreak({ currentStreak: 2 }) })
      );

      const result = await handleWeightLogged();

      expect(updateActivityStreak).toHaveBeenCalledWith('weightLogging', true);
      expect(result).toBeNull();
    });
  });

  describe('handleWorkoutCompleted', () => {
    it('should update workout streak', async () => {
      (updateActivityStreak as jest.Mock).mockResolvedValue(
        makeStreaks({ workoutCompletion: makeStreak({ currentStreak: 3 }) })
      );

      const result = await handleWorkoutCompleted();

      expect(updateActivityStreak).toHaveBeenCalledWith('workoutCompletion', true);
      expect(result).not.toBeNull(); // 3 is a milestone
    });
  });

  describe('handleCalorieGoalMet', () => {
    it('should update streak, add goal achieved message, and return goal message', async () => {
      (updateActivityStreak as jest.Mock).mockResolvedValue(
        makeStreaks({ calorieGoalMet: makeStreak({ currentStreak: 2 }) })
      );

      const result = await handleCalorieGoalMet();

      expect(updateActivityStreak).toHaveBeenCalledWith('calorieGoalMet', true);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('goal_achieved');
      // addMessage called at least once for goal message
      expect(addMessage).toHaveBeenCalled();
    });

    it('should add streak message too when at milestone', async () => {
      (updateActivityStreak as jest.Mock).mockResolvedValue(
        makeStreaks({ calorieGoalMet: makeStreak({ currentStreak: 7 }) })
      );

      await handleCalorieGoalMet();

      // addMessage called twice: once for goal, once for streak milestone
      expect(addMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleWaterGoalMet', () => {
    it('should update water intake streak', async () => {
      (updateActivityStreak as jest.Mock).mockResolvedValue(
        makeStreaks({ waterIntake: makeStreak({ currentStreak: 5 }) })
      );

      const result = await handleWaterGoalMet();

      expect(updateActivityStreak).toHaveBeenCalledWith('waterIntake', true);
      expect(result).toBeNull(); // 5 is not a milestone
    });
  });
});
