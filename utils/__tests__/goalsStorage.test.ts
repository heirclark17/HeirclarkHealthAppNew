// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveProfile,
  loadProfile,
  saveResults,
  loadResults,
  saveGoals,
  loadGoals,
} from '../goalsStorage';
import { resetAsyncStorage } from '../../__tests__/testUtils';

// ============================================
// Tests
// ============================================
describe('goalsStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAsyncStorage();
  });

  describe('saveProfile / loadProfile', () => {
    it('stores profile JSON in AsyncStorage', async () => {
      const profile = {
        age: 30,
        sex: 'male' as const,
        heightFt: 5,
        heightIn: 10,
        weight: 180,
        targetWeight: 170,
        activity: 'moderate' as const,
        goalType: 'lose' as const,
        startDate: '2026-01-01',
        endDate: '2026-04-01',
      };

      await saveProfile(profile);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'hc_user_profile',
        JSON.stringify(profile)
      );
    });

    it('returns parsed profile from AsyncStorage', async () => {
      const profile = {
        age: 30,
        sex: 'male' as const,
        heightFt: 5,
        heightIn: 10,
        weight: 180,
        targetWeight: 170,
        activity: 'moderate' as const,
        goalType: 'lose' as const,
        startDate: '2026-01-01',
        endDate: '2026-04-01',
      };

      await saveProfile(profile);
      const loaded = await loadProfile();

      expect(loaded).toEqual(profile);
    });

    it('returns null when no data stored', async () => {
      const loaded = await loadProfile();

      expect(loaded).toBeNull();
    });

    it('returns null on parse error (corrupt data)', async () => {
      // Manually set invalid JSON
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('{ invalid json');

      const loaded = await loadProfile();

      expect(loaded).toBeNull();
    });

    it('handles AsyncStorage errors gracefully on save', async () => {
      const profile = {
        age: 30,
        sex: 'male' as const,
        heightFt: 5,
        heightIn: 10,
        weight: 180,
        targetWeight: 170,
        activity: 'moderate' as const,
        goalType: 'lose' as const,
        startDate: '2026-01-01',
        endDate: '2026-04-01',
      };

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await saveProfile(profile);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save profile:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('handles AsyncStorage errors gracefully on load', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const loaded = await loadProfile();

      expect(loaded).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load profile:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveResults / loadResults', () => {
    it('round-trips results correctly', async () => {
      const results = {
        bmr: 1800,
        tdee: 2400,
        targetCalories: 1900,
        protein: 150,
        carbs: 200,
        fat: 65,
        weeks: 12,
        predictedWeightLoss: 12,
      };

      await saveResults(results);
      const loaded = await loadResults();

      expect(loaded).toEqual(results);
    });

    it('returns null when no results stored', async () => {
      const loaded = await loadResults();

      expect(loaded).toBeNull();
    });

    it('returns null on parse error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('{ bad data');

      const loaded = await loadResults();

      expect(loaded).toBeNull();
    });

    it('handles AsyncStorage errors gracefully on save', async () => {
      const results = {
        bmr: 1800,
        tdee: 2400,
        targetCalories: 1900,
        protein: 150,
        carbs: 200,
        fat: 65,
        weeks: 12,
        predictedWeightLoss: 12,
      };

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await saveResults(results);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save results:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('handles AsyncStorage errors gracefully on load', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const loaded = await loadResults();

      expect(loaded).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load results:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveGoals / loadGoals', () => {
    it('round-trips goals correctly', async () => {
      const goals = {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65,
        startDate: '2026-01-01',
      };

      await saveGoals(goals);
      const loaded = await loadGoals();

      expect(loaded).toEqual(goals);
    });

    it('returns null when no goals stored', async () => {
      const loaded = await loadGoals();

      expect(loaded).toBeNull();
    });

    it('returns null on parse error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not valid json');

      const loaded = await loadGoals();

      expect(loaded).toBeNull();
    });

    it('handles AsyncStorage errors gracefully on save', async () => {
      const goals = {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65,
        startDate: '2026-01-01',
      };

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await saveGoals(goals);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save goals:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('handles AsyncStorage errors gracefully on load', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const loaded = await loadGoals();

      expect(loaded).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load goals:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
