/**
 * ExerciseDB Service
 * API integration with caching for exercise form coaching
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExerciseDBExercise,
  ExerciseDBCache,
  CachedExercise,
} from '../types/ai';
import { EXERCISE_DB_FALLBACK } from '../data/exerciseDbFallback';

// API configuration
const EXERCISEDB_API_URL = 'https://exercisedb.p.rapidapi.com';

// Cache configuration
const STORAGE_KEY = 'hc_exercisedb_cache';
const CACHE_DURATION_DAYS = 30;
const CACHE_DURATION_MS = CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000;

// Common exercises to prefetch
const COMMON_EXERCISES = [
  'squat',
  'deadlift',
  'bench press',
  'push-up',
  'pull-up',
  'lunge',
  'plank',
  'row',
  'shoulder press',
  'bicep curl',
  'tricep extension',
  'leg press',
  'lat pulldown',
  'crunch',
  'hip thrust',
];

class ExerciseDbServiceClass {
  private apiKey: string | null = null;
  private cache: ExerciseDBCache | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the service and load cache
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get API key from environment variable
      this.apiKey = process.env.EXPO_PUBLIC_EXERCISEDB_API_KEY || null;

      // Load cache from storage
      await this.loadCache();
      this.initialized = true;
      console.log('[ExerciseDbService] Initialized');

      // Prefetch common exercises in background
      this.prefetchCommonExercises().catch(err =>
        console.warn('[ExerciseDbService] Prefetch failed:', err)
      );
    } catch (error) {
      console.error('[ExerciseDbService] Initialization error:', error);
      this.initialized = true; // Mark as initialized even on error to use fallback
    }
  }

  /**
   * Get API headers for ExerciseDB requests
   */
  private getHeaders(): HeadersInit {
    if (!this.apiKey) {
      console.warn('[ExerciseDbService] No API key configured');
      return {};
    }
    return {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
    };
  }

  /**
   * Load cache from AsyncStorage
   */
  private async loadCache(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.cache = JSON.parse(stored);

        // Check if cache is expired
        if (this.cache && new Date(this.cache.expiresAt) < new Date()) {
          console.log('[ExerciseDbService] Cache expired, clearing');
          this.cache = null;
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('[ExerciseDbService] Error loading cache:', error);
    }
  }

  /**
   * Save cache to AsyncStorage
   */
  private async saveCache(): Promise<void> {
    if (!this.cache) return;

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('[ExerciseDbService] Error saving cache:', error);
    }
  }

  /**
   * Initialize cache structure if needed
   */
  private ensureCache(): void {
    if (!this.cache) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);

      this.cache = {
        exercises: {},
        lastUpdated: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
    }
  }

  /**
   * Get exercise by ID
   */
  async getExerciseById(id: string): Promise<ExerciseDBExercise | null> {
    await this.initialize();

    // Check cache first
    if (this.cache?.exercises[id]) {
      console.log('[ExerciseDbService] Cache hit for ID:', id);
      return this.cache.exercises[id];
    }

    // Check fallback data
    const fallback = EXERCISE_DB_FALLBACK.find(e => e.id === id);
    if (fallback) {
      console.log('[ExerciseDbService] Fallback hit for ID:', id);
      return fallback;
    }

    // Try API
    if (!this.apiKey) {
      console.warn('[ExerciseDbService] No API key, using fallback only');
      return null;
    }

    try {
      const response = await fetch(`${EXERCISEDB_API_URL}/exercises/exercise/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error('[ExerciseDbService] API error:', response.status);
        return null;
      }

      const exercise: ExerciseDBExercise = await response.json();

      // Cache the result
      this.ensureCache();
      this.cache!.exercises[id] = {
        ...exercise,
        cachedAt: new Date().toISOString(),
      };
      await this.saveCache();

      return exercise;
    } catch (error) {
      console.error('[ExerciseDbService] getExerciseById error:', error);
      return null;
    }
  }

  /**
   * Search exercises by name
   */
  async searchExercisesByName(name: string): Promise<ExerciseDBExercise[]> {
    await this.initialize();

    const searchTerm = name.toLowerCase();

    // First check cache for matching exercises
    const cachedMatches: ExerciseDBExercise[] = [];
    if (this.cache) {
      Object.values(this.cache.exercises).forEach(exercise => {
        if (exercise.name.toLowerCase().includes(searchTerm)) {
          cachedMatches.push(exercise);
        }
      });
    }

    // Check fallback data
    const fallbackMatches = EXERCISE_DB_FALLBACK.filter(e =>
      e.name.toLowerCase().includes(searchTerm)
    );

    // Combine and dedupe
    const combined = [...cachedMatches];
    fallbackMatches.forEach(fallback => {
      if (!combined.find(e => e.id === fallback.id)) {
        combined.push(fallback);
      }
    });

    if (combined.length > 0) {
      console.log('[ExerciseDbService] Found', combined.length, 'cached/fallback matches');
      return combined;
    }

    // Try API if no cached results
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(
        `${EXERCISEDB_API_URL}/exercises/name/${encodeURIComponent(searchTerm)}?limit=20`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        console.error('[ExerciseDbService] Search API error:', response.status);
        return [];
      }

      const exercises: ExerciseDBExercise[] = await response.json();

      // Cache all results
      this.ensureCache();
      exercises.forEach(exercise => {
        this.cache!.exercises[exercise.id] = {
          ...exercise,
          cachedAt: new Date().toISOString(),
        };
      });
      await this.saveCache();

      return exercises;
    } catch (error) {
      console.error('[ExerciseDbService] searchExercisesByName error:', error);
      return [];
    }
  }

  /**
   * Get exercises by body part
   */
  async getExercisesByBodyPart(bodyPart: string): Promise<ExerciseDBExercise[]> {
    await this.initialize();

    const searchPart = bodyPart.toLowerCase();

    // Check cache
    const cachedMatches: ExerciseDBExercise[] = [];
    if (this.cache) {
      Object.values(this.cache.exercises).forEach(exercise => {
        if (exercise.bodyPart.toLowerCase() === searchPart ||
            exercise.target.toLowerCase() === searchPart) {
          cachedMatches.push(exercise);
        }
      });
    }

    // Check fallback
    const fallbackMatches = EXERCISE_DB_FALLBACK.filter(e =>
      e.bodyPart.toLowerCase() === searchPart ||
      e.target.toLowerCase() === searchPart
    );

    // Combine and dedupe
    const combined = [...cachedMatches];
    fallbackMatches.forEach(fallback => {
      if (!combined.find(e => e.id === fallback.id)) {
        combined.push(fallback);
      }
    });

    if (combined.length > 0) {
      return combined;
    }

    // Try API
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(
        `${EXERCISEDB_API_URL}/exercises/bodyPart/${encodeURIComponent(searchPart)}?limit=30`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        console.error('[ExerciseDbService] Body part API error:', response.status);
        return [];
      }

      const rawExercises: any[] = await response.json();

      // Map exercises and construct GIF URLs
      const exercises: ExerciseDBExercise[] = rawExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        bodyPart: ex.bodyPart,
        target: ex.target,
        equipment: ex.equipment,
        gifUrl: `https://exercisedb.p.rapidapi.com/image?exerciseId=${ex.id}&resolution=180&rapidapi-key=${this.apiKey}`,
        instructions: ex.instructions || [],
        secondaryMuscles: ex.secondaryMuscles || []
      }));

      // Cache results
      this.ensureCache();
      exercises.forEach(exercise => {
        this.cache!.exercises[exercise.id] = {
          ...exercise,
          cachedAt: new Date().toISOString(),
        };
      });
      await this.saveCache();

      return exercises;
    } catch (error) {
      console.error('[ExerciseDbService] getExercisesByBodyPart error:', error);
      return [];
    }
  }

  /**
   * Prefetch common exercises to cache
   */
  async prefetchCommonExercises(): Promise<void> {
    if (!this.apiKey) {
      console.log('[ExerciseDbService] Skipping prefetch - no API key');
      return;
    }

    console.log('[ExerciseDbService] Starting prefetch of common exercises');

    for (const exerciseName of COMMON_EXERCISES) {
      try {
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

        await this.searchExercisesByName(exerciseName);
      } catch (error) {
        console.warn('[ExerciseDbService] Prefetch failed for:', exerciseName);
      }
    }

    console.log('[ExerciseDbService] Prefetch complete');
  }

  /**
   * Get exercises by equipment type
   */
  async getExercisesByEquipment(equipment: string): Promise<ExerciseDBExercise[]> {
    await this.initialize();

    const searchEquipment = equipment.toLowerCase();

    // Check cache and fallback
    const matches: ExerciseDBExercise[] = [];

    if (this.cache) {
      Object.values(this.cache.exercises).forEach(exercise => {
        if (exercise.equipment.toLowerCase() === searchEquipment) {
          matches.push(exercise);
        }
      });
    }

    EXERCISE_DB_FALLBACK.forEach(exercise => {
      if (exercise.equipment.toLowerCase() === searchEquipment &&
          !matches.find(e => e.id === exercise.id)) {
        matches.push(exercise);
      }
    });

    return matches;
  }

  /**
   * Get a random exercise for a specific target muscle
   */
  async getRandomExerciseForMuscle(muscle: string): Promise<ExerciseDBExercise | null> {
    const exercises = await this.getExercisesByBodyPart(muscle);
    if (exercises.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * exercises.length);
    return exercises[randomIndex];
  }

  /**
   * Get all exercises with pagination
   * @param limit - Number of exercises to fetch (default: 100, max: 1000)
   * @param offset - Starting index (default: 0)
   */
  async getAllExercises(limit: number = 100, offset: number = 0): Promise<ExerciseDBExercise[]> {
    await this.initialize();

    if (!this.apiKey) {
      console.warn('[ExerciseDbService] No API key, returning fallback data');
      return EXERCISE_DB_FALLBACK.slice(offset, offset + limit);
    }

    try {
      const response = await fetch(
        `${EXERCISEDB_API_URL}/exercises?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        console.error('[ExerciseDbService] API error:', response.status);
        return EXERCISE_DB_FALLBACK.slice(offset, offset + limit);
      }

      const rawExercises: any[] = await response.json();

      // Map exercises and construct GIF URLs
      const exercises: ExerciseDBExercise[] = rawExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        bodyPart: ex.bodyPart,
        target: ex.target,
        equipment: ex.equipment,
        gifUrl: `https://exercisedb.p.rapidapi.com/image?exerciseId=${ex.id}&resolution=180&rapidapi-key=${this.apiKey}`,
        instructions: ex.instructions || [],
        secondaryMuscles: ex.secondaryMuscles || []
      }));

      // Cache the results
      this.ensureCache();
      exercises.forEach(exercise => {
        this.cache!.exercises[exercise.id] = {
          ...exercise,
          cachedAt: new Date().toISOString(),
        };
      });
      await this.saveCache();

      console.log(`[ExerciseDbService] Fetched ${exercises.length} exercises (offset: ${offset})`);
      return exercises;
    } catch (error) {
      console.error('[ExerciseDbService] getAllExercises error:', error);
      return EXERCISE_DB_FALLBACK.slice(offset, offset + limit);
    }
  }

  /**
   * Clear the exercise cache
   */
  async clearCache(): Promise<void> {
    try {
      this.cache = null;
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('[ExerciseDbService] Cache cleared');
    } catch (error) {
      console.error('[ExerciseDbService] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { count: number; expiresAt: string | null } {
    return {
      count: this.cache ? Object.keys(this.cache.exercises).length : 0,
      expiresAt: this.cache?.expiresAt || null,
    };
  }
}

export const exerciseDbService = new ExerciseDbServiceClass();
export default exerciseDbService;
