/**
 * Tests for exerciseDbService.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { exerciseDbService } from '../exerciseDbService';
import { EXERCISE_DB_FALLBACK } from '../../data/exerciseDbFallback';

// We need to reset the singleton between tests since it has internal state
// Access private members via any cast for testing
const service = exerciseDbService as any;

describe('exerciseDbService', () => {
  beforeEach(() => {
    AsyncStorage.__resetStore();
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();

    // Reset singleton internal state
    service.apiKey = null;
    service.cache = null;
    service.initialized = false;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =============================================
  // initialize
  // =============================================
  describe('initialize', () => {
    it('should initialize and load cache from storage', async () => {
      const mockCache = {
        exercises: { '0001': { id: '0001', name: 'Test', cachedAt: new Date().toISOString() } },
        lastUpdated: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      await AsyncStorage.setItem('hc_exercisedb_cache', JSON.stringify(mockCache));

      await service.initialize();

      expect(service.initialized).toBe(true);
      expect(service.cache).not.toBeNull();
      expect(service.cache.exercises['0001']).toBeDefined();
    });

    it('should mark as initialized even on error', async () => {
      // Force an error during initialization by making AsyncStorage throw
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await service.initialize();
      expect(service.initialized).toBe(true);
    });

    it('should skip re-initialization if already initialized', async () => {
      service.initialized = true;
      const getItemSpy = jest.spyOn(AsyncStorage, 'getItem');

      await service.initialize();
      expect(getItemSpy).not.toHaveBeenCalled();
    });

    it('should clear expired cache', async () => {
      const expiredCache = {
        exercises: { '0001': { id: '0001', name: 'Test' } },
        lastUpdated: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // expired
      };
      await AsyncStorage.setItem('hc_exercisedb_cache', JSON.stringify(expiredCache));

      await service.initialize();
      expect(service.cache).toBeNull();
    });
  });

  // =============================================
  // getExerciseById
  // =============================================
  describe('getExerciseById', () => {
    beforeEach(async () => {
      service.initialized = true;
      service.apiKey = null;
    });

    it('should return cached exercise if present', async () => {
      const cachedExercise = {
        id: 'test-id',
        name: 'Cached Push Up',
        bodyPart: 'chest',
        equipment: 'bodyweight',
        target: 'pectorals',
        gifUrl: 'http://example.com/pushup.gif',
        cachedAt: new Date().toISOString(),
      };
      service.cache = {
        exercises: { 'test-id': cachedExercise },
        lastUpdated: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = await exerciseDbService.getExerciseById('test-id');
      expect(result).toEqual(cachedExercise);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return fallback exercise if not in cache', async () => {
      service.cache = null;

      if (EXERCISE_DB_FALLBACK.length > 0) {
        const fallbackItem = EXERCISE_DB_FALLBACK[0];
        const result = await exerciseDbService.getExerciseById(fallbackItem.id);
        expect(result).toEqual(fallbackItem);
      }
    });

    it('should return null when no API key and not in cache/fallback', async () => {
      service.cache = null;
      service.apiKey = null;

      const result = await exerciseDbService.getExerciseById('nonexistent-id-xyz');
      expect(result).toBeNull();
    });

    it('should fetch from API when not in cache/fallback and API key exists', async () => {
      service.cache = null;
      service.apiKey = 'test-api-key';

      const mockExercise = {
        id: 'api-id',
        name: 'API Exercise',
        bodyPart: 'back',
        equipment: 'barbell',
        target: 'lats',
        gifUrl: 'http://example.com/exercise.gif',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExercise,
      });

      const result = await exerciseDbService.getExerciseById('api-id');
      expect(result).toEqual(mockExercise);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('exercises/exercise/api-id'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should cache API results', async () => {
      service.cache = null;
      service.apiKey = 'test-api-key';

      const mockExercise = {
        id: 'api-cache-id',
        name: 'Cache Test',
        bodyPart: 'chest',
        equipment: 'bodyweight',
        target: 'pectorals',
        gifUrl: 'http://example.com/test.gif',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExercise,
      });

      await exerciseDbService.getExerciseById('api-cache-id');
      expect(service.cache).not.toBeNull();
      expect(service.cache.exercises['api-cache-id']).toBeDefined();
    });

    it('should return null on API error', async () => {
      service.cache = null;
      service.apiKey = 'test-api-key';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await exerciseDbService.getExerciseById('error-id');
      expect(result).toBeNull();
    });

    it('should return null on fetch exception', async () => {
      service.cache = null;
      service.apiKey = 'test-api-key';

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await exerciseDbService.getExerciseById('network-error-id');
      expect(result).toBeNull();
    });
  });

  // =============================================
  // searchExercisesByName
  // =============================================
  describe('searchExercisesByName', () => {
    beforeEach(() => {
      service.initialized = true;
      service.apiKey = null;
    });

    it('should return cached matches if available', async () => {
      service.cache = {
        exercises: {
          '1': { id: '1', name: 'Bench Press', bodyPart: 'chest', equipment: 'barbell', target: 'pectorals' },
          '2': { id: '2', name: 'Squat', bodyPart: 'legs', equipment: 'barbell', target: 'quads' },
        },
        lastUpdated: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const results = await exerciseDbService.searchExercisesByName('bench');
      const hasBench = results.some(e => e.name.toLowerCase().includes('bench'));
      expect(hasBench).toBe(true);
    });

    it('should combine cached and fallback matches without duplicates', async () => {
      service.cache = { exercises: {}, lastUpdated: '', expiresAt: new Date(Date.now() + 86400000).toISOString() };

      // Search for something likely in fallback
      const results = await exerciseDbService.searchExercisesByName('squat');
      const ids = results.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size); // no duplicates
    });

    it('should return empty array when no matches and no API key', async () => {
      service.cache = { exercises: {}, lastUpdated: '', expiresAt: new Date(Date.now() + 86400000).toISOString() };
      service.apiKey = null;

      const results = await exerciseDbService.searchExercisesByName('zzznonexistent');
      // Might still return fallback matches, but if truly no match:
      const fallbackMatches = EXERCISE_DB_FALLBACK.filter(e =>
        e.name.toLowerCase().includes('zzznonexistent')
      );
      if (fallbackMatches.length === 0) {
        expect(results).toEqual([]);
      }
    });

    it('should fetch from API when no cached/fallback results', async () => {
      service.cache = { exercises: {}, lastUpdated: '', expiresAt: new Date(Date.now() + 86400000).toISOString() };
      service.apiKey = 'test-key';

      const mockResults = [
        { id: 'api-1', name: 'zzzuniquename exercise', bodyPart: 'chest', equipment: 'barbell', target: 'pectorals' },
      ];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      });

      // Only call API if no cache/fallback results
      const fallbackMatches = EXERCISE_DB_FALLBACK.filter(e =>
        e.name.toLowerCase().includes('zzzuniquename')
      );
      if (fallbackMatches.length === 0) {
        const results = await exerciseDbService.searchExercisesByName('zzzuniquename');
        expect(global.fetch).toHaveBeenCalled();
        expect(results.length).toBeGreaterThan(0);
      }
    });

    it('should return empty array on API error', async () => {
      service.cache = { exercises: {}, lastUpdated: '', expiresAt: new Date(Date.now() + 86400000).toISOString() };
      service.apiKey = 'test-key';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      // If no cache/fallback hit, API error returns []
      const fallbackMatches = EXERCISE_DB_FALLBACK.filter(e =>
        e.name.toLowerCase().includes('zzzuniquename')
      );
      if (fallbackMatches.length === 0) {
        const results = await exerciseDbService.searchExercisesByName('zzzuniquename');
        expect(results).toEqual([]);
      }
    });
  });

  // =============================================
  // getExercisesByBodyPart
  // =============================================
  describe('getExercisesByBodyPart', () => {
    beforeEach(() => {
      service.initialized = true;
      service.apiKey = null;
    });

    it('should match by bodyPart or target', async () => {
      service.cache = {
        exercises: {
          '1': { id: '1', name: 'Bench Press', bodyPart: 'chest', equipment: 'barbell', target: 'pectorals' },
          '2': { id: '2', name: 'Lat Pulldown', bodyPart: 'back', equipment: 'cable', target: 'lats' },
        },
        lastUpdated: '',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const results = await exerciseDbService.getExercisesByBodyPart('chest');
      expect(results.some(e => e.bodyPart === 'chest')).toBe(true);
      expect(results.some(e => e.bodyPart === 'back')).toBe(false);
    });

    it('should combine cache and fallback without duplicates', async () => {
      service.cache = { exercises: {}, lastUpdated: '', expiresAt: new Date(Date.now() + 86400000).toISOString() };
      const results = await exerciseDbService.getExercisesByBodyPart('chest');
      const ids = results.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  // =============================================
  // getExercisesByEquipment
  // =============================================
  describe('getExercisesByEquipment', () => {
    beforeEach(() => {
      service.initialized = true;
      service.apiKey = null;
    });

    it('should filter by equipment type', async () => {
      service.cache = {
        exercises: {
          '1': { id: '1', name: 'Bench Press', bodyPart: 'chest', equipment: 'barbell', target: 'pectorals' },
          '2': { id: '2', name: 'Push Up', bodyPart: 'chest', equipment: 'body weight', target: 'pectorals' },
        },
        lastUpdated: '',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const results = await exerciseDbService.getExercisesByEquipment('barbell');
      expect(results.every(e => e.equipment.toLowerCase() === 'barbell')).toBe(true);
    });
  });

  // =============================================
  // getRandomExerciseForMuscle
  // =============================================
  describe('getRandomExerciseForMuscle', () => {
    beforeEach(() => {
      service.initialized = true;
      service.apiKey = null;
    });

    it('should return an exercise for a valid muscle group', async () => {
      service.cache = { exercises: {}, lastUpdated: '', expiresAt: new Date(Date.now() + 86400000).toISOString() };
      // Will use fallback data
      const result = await exerciseDbService.getRandomExerciseForMuscle('chest');
      if (EXERCISE_DB_FALLBACK.some(e => e.bodyPart === 'chest' || e.target === 'chest')) {
        expect(result).not.toBeNull();
      }
    });

    it('should return null when no exercises match', async () => {
      service.cache = { exercises: {}, lastUpdated: '', expiresAt: new Date(Date.now() + 86400000).toISOString() };
      const result = await exerciseDbService.getRandomExerciseForMuscle('zzznonexistentmuscle');
      const hasFallback = EXERCISE_DB_FALLBACK.some(
        e => e.bodyPart === 'zzznonexistentmuscle' || e.target === 'zzznonexistentmuscle'
      );
      if (!hasFallback) {
        expect(result).toBeNull();
      }
    });
  });

  // =============================================
  // clearCache
  // =============================================
  describe('clearCache', () => {
    it('should clear internal cache and remove from AsyncStorage', async () => {
      service.cache = {
        exercises: { '1': { id: '1', name: 'Test' } },
        lastUpdated: '',
        expiresAt: '',
      };

      await exerciseDbService.clearCache();
      expect(service.cache).toBeNull();
      const stored = await AsyncStorage.getItem('hc_exercisedb_cache');
      expect(stored).toBeNull();
    });
  });

  // =============================================
  // getCacheStats
  // =============================================
  describe('getCacheStats', () => {
    it('should return zero count when no cache', () => {
      service.cache = null;
      const stats = exerciseDbService.getCacheStats();
      expect(stats.count).toBe(0);
      expect(stats.expiresAt).toBeNull();
    });

    it('should return correct count and expiry', () => {
      const expiresAt = new Date(Date.now() + 86400000).toISOString();
      service.cache = {
        exercises: { '1': {}, '2': {}, '3': {} },
        lastUpdated: '',
        expiresAt,
      };
      const stats = exerciseDbService.getCacheStats();
      expect(stats.count).toBe(3);
      expect(stats.expiresAt).toBe(expiresAt);
    });
  });

  // =============================================
  // prefetchCommonExercises
  // =============================================
  describe('prefetchCommonExercises', () => {
    it('should skip prefetch when no API key', async () => {
      service.initialized = true;
      service.apiKey = null;

      await exerciseDbService.prefetchCommonExercises();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
