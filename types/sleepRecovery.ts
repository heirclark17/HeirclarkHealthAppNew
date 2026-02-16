/**
 * Sleep & Recovery Agent Types
 */

export interface SleepEntry {
  id: string;
  date: string;
  bedtime: string; // HH:mm
  wakeTime: string; // HH:mm
  duration: number; // minutes
  quality: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface RecoveryScore {
  date: string;
  score: number; // 0-100
  factors: {
    sleep: number;
    quality: number;
    hrv: number;
    activity: number;
    streak: number;
    // Legacy fields kept for backwards compat
    nutrition?: number;
    stress?: number;
  };
}

export interface SleepGoal {
  targetBedtime: string;
  targetWakeTime: string;
  targetDuration: number; // minutes
}

export interface SleepRecoveryState {
  sleepEntries: SleepEntry[];
  recoveryScores: RecoveryScore[];
  sleepGoal: SleepGoal;
  averageSleepDuration: number;
  sleepDebt: number;
  isLoading: boolean;
}

export const SLEEP_TIPS = [
  'Maintain a consistent sleep schedule',
  'Avoid screens 1 hour before bed',
  'Keep your bedroom cool and dark',
  'Limit caffeine after 2pm',
  'Exercise regularly but not before bed',
  'Create a relaxing bedtime routine',
  'Avoid large meals before sleep',
  'Limit alcohol before bed',
];

export const RECOVERY_TIPS = [
  'Take rest days between intense workouts',
  'Stay hydrated throughout the day',
  'Include protein with every meal',
  'Stretch or do light yoga on rest days',
  'Take short walks to promote blood flow',
  'Listen to your body - rest when needed',
];

export const DEFAULT_SLEEP_GOAL: SleepGoal = {
  targetBedtime: '22:30',
  targetWakeTime: '06:30',
  targetDuration: 480, // 8 hours
};
