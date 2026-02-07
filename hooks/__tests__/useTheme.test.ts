import { renderHook } from '@testing-library/react-native';
import { useTheme, getThemeColors } from '../useTheme';
import { useSettings } from '../../contexts/SettingsContext';
import { DarkColors, LightColors } from '../../constants/Theme';

// Mock the SettingsContext
jest.mock('../../contexts/SettingsContext');

const mockUseSettings = useSettings as jest.MockedFunction<typeof useSettings>;

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hook behavior', () => {
    it('returns colors object for dark mode', () => {
      mockUseSettings.mockReturnValue({
        settings: { themeMode: 'dark' } as any,
        setLiveAvatar: jest.fn(),
        setCaptions: jest.fn(),
        setAutoplayCoach: jest.fn(),
        setMealReminders: jest.fn(),
        setMealReminderTime: jest.fn(),
        setWaterTracking: jest.fn(),
        setDailyWaterGoal: jest.fn(),
        setUnitSystem: jest.fn(),
        setThemeMode: jest.fn(),
        setBackgroundImage: jest.fn(),
        setCustomBackgroundUri: jest.fn(),
        setProfileImageUri: jest.fn(),
        setPushNotifications: jest.fn(),
        setDailySummary: jest.fn(),
        setDailySummaryTime: jest.fn(),
        setAchievementAlerts: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        resetSettings: jest.fn(),
        requestNotificationPermissions: jest.fn(),
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.colors).toEqual(DarkColors);
    });

    it('returns colors object for light mode', () => {
      mockUseSettings.mockReturnValue({
        settings: { themeMode: 'light' } as any,
        setLiveAvatar: jest.fn(),
        setCaptions: jest.fn(),
        setAutoplayCoach: jest.fn(),
        setMealReminders: jest.fn(),
        setMealReminderTime: jest.fn(),
        setWaterTracking: jest.fn(),
        setDailyWaterGoal: jest.fn(),
        setUnitSystem: jest.fn(),
        setThemeMode: jest.fn(),
        setBackgroundImage: jest.fn(),
        setCustomBackgroundUri: jest.fn(),
        setProfileImageUri: jest.fn(),
        setPushNotifications: jest.fn(),
        setDailySummary: jest.fn(),
        setDailySummaryTime: jest.fn(),
        setAchievementAlerts: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        resetSettings: jest.fn(),
        requestNotificationPermissions: jest.fn(),
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.colors).toEqual(LightColors);
    });

    it('returns isDark boolean as true for dark mode', () => {
      mockUseSettings.mockReturnValue({
        settings: { themeMode: 'dark' } as any,
        setLiveAvatar: jest.fn(),
        setCaptions: jest.fn(),
        setAutoplayCoach: jest.fn(),
        setMealReminders: jest.fn(),
        setMealReminderTime: jest.fn(),
        setWaterTracking: jest.fn(),
        setDailyWaterGoal: jest.fn(),
        setUnitSystem: jest.fn(),
        setThemeMode: jest.fn(),
        setBackgroundImage: jest.fn(),
        setCustomBackgroundUri: jest.fn(),
        setProfileImageUri: jest.fn(),
        setPushNotifications: jest.fn(),
        setDailySummary: jest.fn(),
        setDailySummaryTime: jest.fn(),
        setAchievementAlerts: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        resetSettings: jest.fn(),
        requestNotificationPermissions: jest.fn(),
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDark).toBe(true);
    });

    it('returns isDark boolean as false for light mode', () => {
      mockUseSettings.mockReturnValue({
        settings: { themeMode: 'light' } as any,
        setLiveAvatar: jest.fn(),
        setCaptions: jest.fn(),
        setAutoplayCoach: jest.fn(),
        setMealReminders: jest.fn(),
        setMealReminderTime: jest.fn(),
        setWaterTracking: jest.fn(),
        setDailyWaterGoal: jest.fn(),
        setUnitSystem: jest.fn(),
        setThemeMode: jest.fn(),
        setBackgroundImage: jest.fn(),
        setCustomBackgroundUri: jest.fn(),
        setProfileImageUri: jest.fn(),
        setPushNotifications: jest.fn(),
        setDailySummary: jest.fn(),
        setDailySummaryTime: jest.fn(),
        setAchievementAlerts: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        resetSettings: jest.fn(),
        requestNotificationPermissions: jest.fn(),
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDark).toBe(false);
    });

    it('returns themeMode from settings', () => {
      mockUseSettings.mockReturnValue({
        settings: { themeMode: 'dark' } as any,
        setLiveAvatar: jest.fn(),
        setCaptions: jest.fn(),
        setAutoplayCoach: jest.fn(),
        setMealReminders: jest.fn(),
        setMealReminderTime: jest.fn(),
        setWaterTracking: jest.fn(),
        setDailyWaterGoal: jest.fn(),
        setUnitSystem: jest.fn(),
        setThemeMode: jest.fn(),
        setBackgroundImage: jest.fn(),
        setCustomBackgroundUri: jest.fn(),
        setProfileImageUri: jest.fn(),
        setPushNotifications: jest.fn(),
        setDailySummary: jest.fn(),
        setDailySummaryTime: jest.fn(),
        setAchievementAlerts: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        resetSettings: jest.fn(),
        requestNotificationPermissions: jest.fn(),
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.themeMode).toBe('dark');
    });
  });

  describe('color object structure', () => {
    beforeEach(() => {
      mockUseSettings.mockReturnValue({
        settings: { themeMode: 'dark' } as any,
        setLiveAvatar: jest.fn(),
        setCaptions: jest.fn(),
        setAutoplayCoach: jest.fn(),
        setMealReminders: jest.fn(),
        setMealReminderTime: jest.fn(),
        setWaterTracking: jest.fn(),
        setDailyWaterGoal: jest.fn(),
        setUnitSystem: jest.fn(),
        setThemeMode: jest.fn(),
        setBackgroundImage: jest.fn(),
        setCustomBackgroundUri: jest.fn(),
        setProfileImageUri: jest.fn(),
        setPushNotifications: jest.fn(),
        setDailySummary: jest.fn(),
        setDailySummaryTime: jest.fn(),
        setAchievementAlerts: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        resetSettings: jest.fn(),
        requestNotificationPermissions: jest.fn(),
      });
    });

    it('colors object has all expected background keys', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.colors).toHaveProperty('background');
      expect(result.current.colors).toHaveProperty('backgroundSecondary');
      expect(result.current.colors).toHaveProperty('card');
      expect(result.current.colors).toHaveProperty('cardHover');
    });

    it('colors object has all expected text keys', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.colors).toHaveProperty('text');
      expect(result.current.colors).toHaveProperty('textSecondary');
      expect(result.current.colors).toHaveProperty('textMuted');
    });

    it('colors object has all expected border keys', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.colors).toHaveProperty('border');
      expect(result.current.colors).toHaveProperty('cardBorder');
    });

    it('colors object has all expected button keys', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.colors).toHaveProperty('primary');
      expect(result.current.colors).toHaveProperty('primaryText');
    });

    it('colors object has all expected accent keys', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.colors).toHaveProperty('accent');
      expect(result.current.colors).toHaveProperty('link');
    });

    it('colors object has all expected status keys', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.colors).toHaveProperty('success');
      expect(result.current.colors).toHaveProperty('error');
      expect(result.current.colors).toHaveProperty('warning');
    });

    it('colors object has all expected macro color keys', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.colors).toHaveProperty('calories');
      expect(result.current.colors).toHaveProperty('protein');
      expect(result.current.colors).toHaveProperty('carbs');
      expect(result.current.colors).toHaveProperty('fat');
    });
  });

  describe('theme reactivity', () => {
    it('changes colors when theme mode changes from dark to light', () => {
      mockUseSettings.mockReturnValue({
        settings: { themeMode: 'dark' } as any,
        setLiveAvatar: jest.fn(),
        setCaptions: jest.fn(),
        setAutoplayCoach: jest.fn(),
        setMealReminders: jest.fn(),
        setMealReminderTime: jest.fn(),
        setWaterTracking: jest.fn(),
        setDailyWaterGoal: jest.fn(),
        setUnitSystem: jest.fn(),
        setThemeMode: jest.fn(),
        setBackgroundImage: jest.fn(),
        setCustomBackgroundUri: jest.fn(),
        setProfileImageUri: jest.fn(),
        setPushNotifications: jest.fn(),
        setDailySummary: jest.fn(),
        setDailySummaryTime: jest.fn(),
        setAchievementAlerts: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        resetSettings: jest.fn(),
        requestNotificationPermissions: jest.fn(),
      });

      const { result, rerender } = renderHook(() => useTheme());

      expect(result.current.colors).toEqual(DarkColors);
      expect(result.current.isDark).toBe(true);

      // Simulate theme change
      mockUseSettings.mockReturnValue({
        settings: { themeMode: 'light' } as any,
        setLiveAvatar: jest.fn(),
        setCaptions: jest.fn(),
        setAutoplayCoach: jest.fn(),
        setMealReminders: jest.fn(),
        setMealReminderTime: jest.fn(),
        setWaterTracking: jest.fn(),
        setDailyWaterGoal: jest.fn(),
        setUnitSystem: jest.fn(),
        setThemeMode: jest.fn(),
        setBackgroundImage: jest.fn(),
        setCustomBackgroundUri: jest.fn(),
        setProfileImageUri: jest.fn(),
        setPushNotifications: jest.fn(),
        setDailySummary: jest.fn(),
        setDailySummaryTime: jest.fn(),
        setAchievementAlerts: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        resetSettings: jest.fn(),
        requestNotificationPermissions: jest.fn(),
      });

      rerender();

      expect(result.current.colors).toEqual(LightColors);
      expect(result.current.isDark).toBe(false);
    });

    it('changes colors when theme mode changes from light to dark', () => {
      mockUseSettings.mockReturnValue({
        settings: { themeMode: 'light' } as any,
        setLiveAvatar: jest.fn(),
        setCaptions: jest.fn(),
        setAutoplayCoach: jest.fn(),
        setMealReminders: jest.fn(),
        setMealReminderTime: jest.fn(),
        setWaterTracking: jest.fn(),
        setDailyWaterGoal: jest.fn(),
        setUnitSystem: jest.fn(),
        setThemeMode: jest.fn(),
        setBackgroundImage: jest.fn(),
        setCustomBackgroundUri: jest.fn(),
        setProfileImageUri: jest.fn(),
        setPushNotifications: jest.fn(),
        setDailySummary: jest.fn(),
        setDailySummaryTime: jest.fn(),
        setAchievementAlerts: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        resetSettings: jest.fn(),
        requestNotificationPermissions: jest.fn(),
      });

      const { result, rerender } = renderHook(() => useTheme());

      expect(result.current.colors).toEqual(LightColors);
      expect(result.current.isDark).toBe(false);

      // Simulate theme change
      mockUseSettings.mockReturnValue({
        settings: { themeMode: 'dark' } as any,
        setLiveAvatar: jest.fn(),
        setCaptions: jest.fn(),
        setAutoplayCoach: jest.fn(),
        setMealReminders: jest.fn(),
        setMealReminderTime: jest.fn(),
        setWaterTracking: jest.fn(),
        setDailyWaterGoal: jest.fn(),
        setUnitSystem: jest.fn(),
        setThemeMode: jest.fn(),
        setBackgroundImage: jest.fn(),
        setCustomBackgroundUri: jest.fn(),
        setProfileImageUri: jest.fn(),
        setPushNotifications: jest.fn(),
        setDailySummary: jest.fn(),
        setDailySummaryTime: jest.fn(),
        setAchievementAlerts: jest.fn(),
        exportData: jest.fn(),
        importData: jest.fn(),
        resetSettings: jest.fn(),
        requestNotificationPermissions: jest.fn(),
      });

      rerender();

      expect(result.current.colors).toEqual(DarkColors);
      expect(result.current.isDark).toBe(true);
    });
  });

  describe('getThemeColors helper function', () => {
    it('returns DarkColors when passed "dark"', () => {
      const colors = getThemeColors('dark');
      expect(colors).toEqual(DarkColors);
    });

    it('returns LightColors when passed "light"', () => {
      const colors = getThemeColors('light');
      expect(colors).toEqual(LightColors);
    });
  });
});
