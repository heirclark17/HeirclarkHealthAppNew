import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, CalculatedResults } from '../constants/goals';

const STORAGE_KEYS = {
  PROFILE: 'hc_user_profile',
  RESULTS: 'hc_calculated_results',
  GOALS: 'hc_user_goals',
};

export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save profile:', error);
  }
}

export async function loadProfile(): Promise<UserProfile | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load profile:', error);
    return null;
  }
}

export async function saveResults(results: CalculatedResults): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
  } catch (error) {
    console.error('Failed to save results:', error);
  }
}

export async function loadResults(): Promise<CalculatedResults | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.RESULTS);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load results:', error);
    return null;
  }
}

export async function saveGoals(
  goals: { calories: number; protein: number; carbs: number; fat: number; startDate: string }
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (error) {
    console.error('Failed to save goals:', error);
  }
}

export async function loadGoals() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load goals:', error);
    return null;
  }
}
