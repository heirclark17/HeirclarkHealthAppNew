// Training Storage Service - Persistent storage for training plans and progress
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WeeklyTrainingPlan,
  TrainingPreferences,
  TrainingProgram,
  GoalWorkoutAlignment,
  CompleteTrainingPlan,
  PlanSummary,
  ProgramTemplate,
  UserTrainingProfile,
  TrainingStats,
  CardioRecommendations,
  NutritionGuidance,
} from '../types/training';

// Storage Keys
const STORAGE_KEYS = {
  TRAINING_PLAN: 'hc_training_plan_cache',
  COMPLETE_PLAN: 'hc_complete_training_plan',
  TRAINING_STATS: 'hc_training_stats',
  PREFERENCES: 'hc_training_preferences',
  LAST_GOAL_HASH: 'hc_last_goal_hash',
  PLAN_HISTORY: 'hc_plan_history',
} as const;

// Cache structure for training plan
export interface TrainingPlanCache {
  weeklyPlan: WeeklyTrainingPlan;
  selectedProgram: TrainingProgram | ProgramTemplate | null;
  goalAlignment: GoalWorkoutAlignment | null;
  currentWeek: number;
  lastGeneratedAt: string;
  preferences: TrainingPreferences | null;
  planSummary?: PlanSummary;
  cardioRecommendations?: CardioRecommendations | null;
  nutritionGuidance?: NutritionGuidance | null;
}

// Hash function to detect goal changes
function hashGoalState(goalState: any): string {
  if (!goalState) return '';

  const relevantFields = {
    primaryGoal: goalState.primaryGoal,
    targetWeight: goalState.targetWeight,
    activityLevel: goalState.activityLevel,
    workoutsPerWeek: goalState.workoutsPerWeek,
    workoutDuration: goalState.workoutDuration,
    cardioPreference: goalState.cardioPreference,
  };

  return JSON.stringify(relevantFields);
}

// Training Storage Service
export const trainingStorage = {
  // Save training plan cache
  async savePlanCache(cache: TrainingPlanCache): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRAINING_PLAN, JSON.stringify(cache));
      console.log('[TrainingStorage] Plan cache saved successfully');
    } catch (error) {
      console.error('[TrainingStorage] Error saving plan cache:', error);
      throw error;
    }
  },

  // Load training plan cache
  async loadPlanCache(): Promise<TrainingPlanCache | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.TRAINING_PLAN);
      if (cached) {
        const parsed = JSON.parse(cached);

        // Validate the cached plan structure - must have weeklyPlan.days array
        if (!parsed.weeklyPlan?.days || !Array.isArray(parsed.weeklyPlan.days)) {
          console.warn('[TrainingStorage] Invalid cached plan structure (missing days), clearing cache');
          await AsyncStorage.removeItem(STORAGE_KEYS.TRAINING_PLAN);
          return null;
        }

        console.log('[TrainingStorage] Plan cache loaded successfully');
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('[TrainingStorage] Error loading plan cache:', error);
      return null;
    }
  },

  // Save complete training plan (multi-week)
  async saveCompletePlan(plan: CompleteTrainingPlan): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLETE_PLAN, JSON.stringify(plan));
      console.log('[TrainingStorage] Complete plan saved successfully');
    } catch (error) {
      console.error('[TrainingStorage] Error saving complete plan:', error);
      throw error;
    }
  },

  // Load complete training plan
  async loadCompletePlan(): Promise<CompleteTrainingPlan | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETE_PLAN);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('[TrainingStorage] Error loading complete plan:', error);
      return null;
    }
  },

  // Save training stats
  async saveStats(stats: TrainingStats): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRAINING_STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('[TrainingStorage] Error saving stats:', error);
    }
  },

  // Load training stats
  async loadStats(): Promise<TrainingStats | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.TRAINING_STATS);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('[TrainingStorage] Error loading stats:', error);
      return null;
    }
  },

  // Check if goals have changed (invalidates plan)
  async haveGoalsChanged(currentGoalState: any): Promise<boolean> {
    try {
      const currentHash = hashGoalState(currentGoalState);
      const savedHash = await AsyncStorage.getItem(STORAGE_KEYS.LAST_GOAL_HASH);

      if (!savedHash) {
        // First time, save the hash
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_GOAL_HASH, currentHash);
        return false;
      }

      const changed = savedHash !== currentHash;
      if (changed) {
        console.log('[TrainingStorage] Goals have changed - plan should be regenerated');
      }

      return changed;
    } catch (error) {
      console.error('[TrainingStorage] Error checking goal changes:', error);
      return false;
    }
  },

  // Update goal hash after regenerating plan
  async updateGoalHash(goalState: any): Promise<void> {
    try {
      const hash = hashGoalState(goalState);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_GOAL_HASH, hash);
    } catch (error) {
      console.error('[TrainingStorage] Error updating goal hash:', error);
    }
  },

  // Save preferences
  async savePreferences(preferences: TrainingPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('[TrainingStorage] Error saving preferences:', error);
    }
  },

  // Load preferences
  async loadPreferences(): Promise<TrainingPreferences | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('[TrainingStorage] Error loading preferences:', error);
      return null;
    }
  },

  // Clear all training data
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TRAINING_PLAN,
        STORAGE_KEYS.COMPLETE_PLAN,
        STORAGE_KEYS.TRAINING_STATS,
        STORAGE_KEYS.PREFERENCES,
        STORAGE_KEYS.LAST_GOAL_HASH,
        STORAGE_KEYS.PLAN_HISTORY,
      ]);
      console.log('[TrainingStorage] All training data cleared');
    } catch (error) {
      console.error('[TrainingStorage] Error clearing data:', error);
    }
  },

  // Clear only the plan (keep stats)
  async clearPlan(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TRAINING_PLAN,
        STORAGE_KEYS.COMPLETE_PLAN,
        STORAGE_KEYS.LAST_GOAL_HASH,
      ]);
      console.log('[TrainingStorage] Training plan cleared');
    } catch (error) {
      console.error('[TrainingStorage] Error clearing plan:', error);
    }
  },

  // Update workout completion in cached plan
  async updateWorkoutCompletion(
    dayIndex: number,
    completed: boolean,
    exercisesCompleted: string[] = []
  ): Promise<void> {
    try {
      const cache = await this.loadPlanCache();
      if (!cache || !cache.weeklyPlan) return;

      const updatedDays = [...cache.weeklyPlan.days];
      const day = updatedDays[dayIndex];

      if (day.workout) {
        const updatedExercises = day.workout.exercises.map(ex => ({
          ...ex,
          completed: completed || exercisesCompleted.includes(ex.id),
        }));

        updatedDays[dayIndex] = {
          ...day,
          completed,
          workout: {
            ...day.workout,
            exercises: updatedExercises,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
          },
        };
      }

      const completedCount = updatedDays.filter(d => d.completed && d.workout).length;
      const updatedCache: TrainingPlanCache = {
        ...cache,
        weeklyPlan: {
          ...cache.weeklyPlan,
          days: updatedDays,
          completedWorkouts: completedCount,
        },
      };

      await this.savePlanCache(updatedCache);
    } catch (error) {
      console.error('[TrainingStorage] Error updating workout completion:', error);
    }
  },

  // Get current week's progress
  async getWeeklyProgress(): Promise<{ completed: number; total: number; percentage: number } | null> {
    try {
      const cache = await this.loadPlanCache();
      if (!cache || !cache.weeklyPlan) return null;

      const total = cache.weeklyPlan.totalWorkouts;
      const completed = cache.weeklyPlan.completedWorkouts;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { completed, total, percentage };
    } catch (error) {
      console.error('[TrainingStorage] Error getting weekly progress:', error);
      return null;
    }
  },

  // Check if plan exists and is valid
  async hasPlan(): Promise<boolean> {
    try {
      const cache = await this.loadPlanCache();
      return cache !== null && cache.weeklyPlan !== null;
    } catch (error) {
      return false;
    }
  },

  // Get plan age in days
  async getPlanAge(): Promise<number | null> {
    try {
      const cache = await this.loadPlanCache();
      if (!cache || !cache.lastGeneratedAt) return null;

      const generatedAt = new Date(cache.lastGeneratedAt);
      const now = new Date();
      const diffMs = now.getTime() - generatedAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      return null;
    }
  },

  // Check if plan should be regenerated (older than 7 days)
  async shouldRegeneratePlan(): Promise<boolean> {
    const age = await this.getPlanAge();
    if (age === null) return true; // No plan exists
    return age >= 7;
  },
};

export default trainingStorage;
