import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';

// Minimal mock settings context value
const defaultSettings = {
  settings: {
    themeMode: 'dark' as const,
    unitSystem: 'imperial' as const,
    liveAvatar: false,
    captions: true,
    autoplayCoach: false,
    mealReminders: false,
    mealReminderTimes: { breakfast: '08:00', lunch: '12:00', dinner: '18:00' },
    waterTracking: true,
    dailyWaterGoal: 64,
    backgroundImage: 'default',
    customBackgroundUri: null,
    profileImageUri: null,
    pushNotifications: false,
    dailySummary: false,
    dailySummaryTime: '20:00',
    achievementAlerts: false,
    isLoaded: true,
  },
  setThemeMode: jest.fn(),
  setUnitSystem: jest.fn(),
  toggleLiveAvatar: jest.fn(),
  toggleCaptions: jest.fn(),
  toggleAutoplayCoach: jest.fn(),
  setMealReminders: jest.fn(),
  setMealReminderTimes: jest.fn(),
  toggleWaterTracking: jest.fn(),
  setDailyWaterGoal: jest.fn(),
  setBackgroundImage: jest.fn(),
  setCustomBackgroundUri: jest.fn(),
  setProfileImageUri: jest.fn(),
  togglePushNotifications: jest.fn(),
  toggleDailySummary: jest.fn(),
  setDailySummaryTime: jest.fn(),
  toggleAchievementAlerts: jest.fn(),
};

// Settings Context mock provider
const MockSettingsContext = React.createContext(defaultSettings);

// All-providers wrapper for component tests
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <MockSettingsContext.Provider value={defaultSettings}>
      {children}
    </MockSettingsContext.Provider>
  );
}

// Custom render that wraps in providers
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react-native';
export { customRender as render };
export { defaultSettings };

// ============================================
// Factory functions for common test data
// ============================================

export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    fullName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  };
}

export function createMockUserProfile(overrides: Record<string, any> = {}) {
  return {
    age: 30,
    sex: 'male' as const,
    heightFt: 5,
    heightIn: 10,
    weight: 180,
    targetWeight: 165,
    activity: 'moderate' as const,
    goalType: 'lose' as const,
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    ...overrides,
  };
}

export function createMockMealData(overrides: Record<string, any> = {}) {
  return {
    id: 'meal-1',
    date: '2026-02-06',
    mealType: 'lunch' as const,
    name: 'Grilled Chicken Salad',
    calories: 450,
    protein: 35,
    carbs: 30,
    fat: 18,
    ...overrides,
  };
}

export function createMockHealthMetrics(overrides: Record<string, any> = {}) {
  return {
    date: '2026-02-06',
    caloriesIn: 1800,
    caloriesOut: 2200,
    restingEnergy: 1600,
    steps: 8000,
    weight: 180,
    protein: 140,
    carbs: 200,
    fat: 60,
    waterOz: 64,
    sleepHours: 7.5,
    activeMinutes: 45,
    ...overrides,
  };
}

export function createMockWorkout(overrides: Record<string, any> = {}) {
  return {
    id: 'workout-1',
    date: '2026-02-06',
    name: 'Upper Body Strength',
    exercises: [
      {
        id: 'ex-1',
        name: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 185,
        muscleGroup: 'chest',
      },
    ],
    duration: 60,
    ...overrides,
  };
}

// ============================================
// Helper for fetch mocking
// ============================================

export function mockFetchResponse(data: any, options: { ok?: boolean; status?: number } = {}) {
  const { ok = true, status = 200 } = options;
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  });
}

export function mockFetchError(errorMessage = 'Network error') {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
}

// ============================================
// AsyncStorage test helpers
// ============================================

export async function clearAsyncStorage() {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.clear();
  if (AsyncStorage.__resetStore) {
    AsyncStorage.__resetStore();
  }
}

export async function getAsyncStorageData(key: string) {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export async function setAsyncStorageData(key: string, value: any) {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
