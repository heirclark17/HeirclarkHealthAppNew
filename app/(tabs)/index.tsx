import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Alert, Modal, TextInput, Animated, Platform, Pressable, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Dumbbell, BarChart3, Watch, X, Clock, Trash2 } from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReanimatedModule, { useSharedValue, useAnimatedStyle, withSpring, ReduceMotion } from 'react-native-reanimated';
import { api } from '../../services/api';
import { appleHealthService } from '../../services/appleHealthService';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { CircularGauge } from '../../components/CircularGauge';
import { SemiCircularGauge } from '../../components/SemiCircularGauge';
import { DailyFatLossCard } from '../../components/DailyFatLossCard';
import { WeeklyProgressCard } from '../../components/WeeklyProgressCard';
import { WearableSyncCard } from '../../components/WearableSyncCard';
import { CalendarCard } from '../../components/CalendarCard';
import { AIMealLogger } from '../../components/AIMealLogger';
import { GlassCard } from '../../components/GlassCard';
import { WaterTrackingCard } from '../../components/WaterTrackingCard';
import { TodaysWorkoutCard } from '../../components/TodaysWorkoutCard';
import { FastingTimerCard } from '../../components/FastingTimerCard';
import { HeartRateCard } from '../../components/HeartRateCard';
import { StepsCard } from '../../components/StepsCard';
import { ActiveEnergyCard } from '../../components/ActiveEnergyCard';
import { RestingEnergyCard } from '../../components/RestingEnergyCard';
import { ProteinCard } from '../../components/ProteinCard';
import { FatCard } from '../../components/FatCard';
import { CarbsCard } from '../../components/CarbsCard';
import { DashboardBottomSheet, DashboardBottomSheetRef, BottomSheetModalProvider } from '../../components/DashboardBottomSheet';
import { WorkoutDetailContent } from '../../components/WorkoutDetailContent';
import { WeeklyStatsContent } from '../../components/WeeklyStatsContent';
import { WearablesSyncContent } from '../../components/WearablesSyncContent';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTraining } from '../../contexts/TrainingContext';
import { useGoalWizard } from '../../contexts/GoalWizardContext';
import { usePostHog } from '../../contexts/PostHogContext';
import { NumberText } from '../../components/NumberText';
import { LiquidGlassProfileImage } from '../../components/LiquidGlassProfileImage';

const AnimatedPressable = ReanimatedModule.createAnimatedComponent(Pressable);

const { width } = Dimensions.get('window');

// Heirclark Design Colors (matching Shopify theme)

export default function DashboardScreen() {
  const { openMealModal } = useLocalSearchParams<{ openMealModal?: string }>();
  const router = useRouter();
  const { settings } = useSettings();
  const { user, isAuthenticated, signInWithApple, isAppleSignInAvailable, isLoading: authLoading } = useAuth();
  const { capture } = usePostHog();

  // Training context for today's workout
  let trainingState: any = null;
  try {
    const training = useTraining();
    trainingState = training?.state;
  } catch (e) {
    // Training context may not be available
  }

  // Goal wizard context for fasting preferences
  let goalWizardState: any = null;
  try {
    const goalWizard = useGoalWizard();
    goalWizardState = goalWizard?.state;
  } catch (e) {
    // Goal wizard context may not be available
  }

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const [greeting, setGreeting] = useState('Good Morning');
  const [weekDays, setWeekDays] = useState<{day: string, date: number, dateStr: string, isToday: boolean}[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [isMealsExpanded, setIsMealsExpanded] = useState(true); // Always shown by default, user can collapse if desired

  // Modal states for quick action cards
  const [showFatLossModal, setShowFatLossModal] = useState(false);
  const [showWeeklyProgressModal, setShowWeeklyProgressModal] = useState(false);
  const [showWearableSyncModal, setShowWearableSyncModal] = useState(false);

  // Modal states for educational info cards
  const [showDailyBalanceInfoModal, setShowDailyBalanceInfoModal] = useState(false);
  const [showProteinInfoModal, setShowProteinInfoModal] = useState(false);
  const [showFatInfoModal, setShowFatInfoModal] = useState(false);
  const [showCarbsInfoModal, setShowCarbsInfoModal] = useState(false);
  const [showStepsInfoModal, setShowStepsInfoModal] = useState(false);
  const [showActiveEnergyInfoModal, setShowActiveEnergyInfoModal] = useState(false);
  const [showRestingEnergyInfoModal, setShowRestingEnergyInfoModal] = useState(false);

  // Handle openMealModal query parameter from Log Meal button
  useEffect(() => {
    if (openMealModal === 'true') {
      setShowMealModal(true);
      // Clear the query parameter to prevent re-opening on navigation
      router.setParams({ openMealModal: undefined });
    }
  }, [openMealModal]);

  // Data from API
  const [caloriesIn, setCaloriesIn] = useState(0);
  const [caloriesOut, setCaloriesOut] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [steps, setSteps] = useState(0);
  const [activeEnergy, setActiveEnergy] = useState(0);
  const [restingEnergy, setRestingEnergy] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState(0);
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState(0);
  const [meals, setMeals] = useState<any[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Goals (defaults, will be fetched from API)
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [proteinGoal, setProteinGoal] = useState(150);
  const [carbsGoal, setCarbsGoal] = useState(200);
  const [fatGoal, setFatGoal] = useState(65);
  const [stepsGoal, setStepsGoal] = useState(10000);
  const [activeEnergyGoal, setActiveEnergyGoal] = useState(500);
  const [restingEnergyGoal, setRestingEnergyGoal] = useState(1700);
  const [fatLossGoal, setFatLossGoal] = useState(2);
  const [weeklyWeightTarget, setWeeklyWeightTarget] = useState(0); // From goal wizard
  const [goalType, setGoalType] = useState<'lose' | 'maintain' | 'gain'>('maintain');

  // Weekly tracking state
  const [weeklySteps, setWeeklySteps] = useState(0);
  const [weeklyCalories, setWeeklyCalories] = useState(0);
  const [weeklyProtein, setWeeklyProtein] = useState(0);
  const [weeklyCarbs, setWeeklyCarbs] = useState(0);
  const [weeklyFat, setWeeklyFat] = useState(0);
  const [weeklyFatLoss, setWeeklyFatLoss] = useState(0);

  // Meal form state
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  const [cardOrder, setCardOrder] = useState<string[]>([
    'calendar',
    'dailyBalance',
    'macros',
    'waterTracking',
    'healthMetrics',
    'workoutFasting', // Today's Workout & Fasting Timer cards
    'quickActions',
  ]);

  // Throttle ref for health data fetches (prevent hammering HealthKit on rapid tab switches)
  const lastHealthFetchRef = useRef<number>(0);

  // Bottom sheet modal refs
  const workoutSheetRef = useRef<DashboardBottomSheetRef>(null);
  const weeklyStatsSheetRef = useRef<DashboardBottomSheetRef>(null);
  const wearablesSyncSheetRef = useRef<DashboardBottomSheetRef>(null);

  // Card press animation values
  const workoutCardScale = useSharedValue(1);
  const weeklyCardScale = useSharedValue(1);
  const wearablesCardScale = useSharedValue(1);

  // Animated styles for card press
  const workoutCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: workoutCardScale.value }],
  }));
  const weeklyCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: weeklyCardScale.value }],
  }));
  const wearablesCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: wearablesCardScale.value }],
  }));

  const calorieBalance = caloriesIn - caloriesOut;

  // Check API connection
  const checkApiConnection = async () => {
    try {
      await api.checkHealth();
      setApiStatus('connected');
      return true;
    } catch (error) {
      setApiStatus('error');
      return false;
    }
  };

  // Fetch data from backend
  const fetchData = useCallback(async () => {
    try {
      // Get metrics for selected date
      const metrics = await api.getMetricsByDate(selectedDate);
      if (metrics) {
        setCaloriesIn(metrics.caloriesIn || 0);
        setCaloriesOut(metrics.caloriesOut || 0);
        setProtein(metrics.protein || 0);
        setCarbs(metrics.carbs || 0);
        setFat(metrics.fat || 0);
      } else {
        // No data - keep at zero
        setCaloriesIn(0);
        setCaloriesOut(0);
        setProtein(0);
        setCarbs(0);
        setFat(0);
      }

      // Get meals for selected date
      const mealsData = await api.getMeals(selectedDate);
      console.log('[Dashboard] Meals fetched:', mealsData.length, 'items');
      setMeals(mealsData);

      // Calculate totals from meals
      if (mealsData.length > 0) {
        const totals = mealsData.reduce((acc, meal) => ({
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein || 0),
          carbs: acc.carbs + (meal.carbs || 0),
          fat: acc.fat + (meal.fat || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        console.log('[Dashboard] Calculated totals:', totals);
        setCaloriesIn(totals.calories);
        setProtein(totals.protein);
        setCarbs(totals.carbs);
        setFat(totals.fat);
      } else {
        console.log('[Dashboard] No meals, resetting to 0');
        setCaloriesIn(0);
        setProtein(0);
        setCarbs(0);
        setFat(0);
      }

      // Get user goals from API
      const goals = await api.getGoals();
      if (goals) {
        setCalorieGoal(goals.dailyCalories || 2200);
        setProteinGoal(goals.dailyProtein || 150);
        setCarbsGoal(goals.dailyCarbs || 250);
        setFatGoal(goals.dailyFat || 65);
        // Use API goal, then fallback to GoalWizard state, then default
        setStepsGoal(goals.dailySteps || goalWizardState?.stepGoal || 10000);
      } else if (goalWizardState?.stepGoal) {
        // Fallback to GoalWizard state if API returns nothing
        setStepsGoal(goalWizardState.stepGoal);
      }

      // Load weekly weight target and goal type from local wizard state
      // (These are not yet supported by backend API)
      try {
        const wizardStateStr = await AsyncStorage.getItem('hc_goal_wizard_progress');
        if (wizardStateStr) {
          const wizardState = JSON.parse(wizardStateStr);
          if (wizardState.results?.weeklyChange !== undefined) {
            setWeeklyWeightTarget(wizardState.results.weeklyChange);
          }
          if (wizardState.primaryGoal) {
            // Convert primaryGoal to goalType
            const goalTypeMap: any = {
              'lose_weight': 'lose',
              'build_muscle': 'gain',
              'maintain_weight': 'maintain',
              'improve_health': 'maintain',
            };
            setGoalType(goalTypeMap[wizardState.primaryGoal] || 'maintain');
          }
        }
      } catch (error) {
        console.log('[Dashboard] Could not load wizard state:', error);
      }

      // Get weekly data (Sunday-Saturday current week)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - dayOfWeek);
      const todayStr = now.toISOString().split('T')[0];

      // Fetch data from Sunday to today (current day of the week)
      const daysToFetch = dayOfWeek + 1; // Sunday (0) to today
      const history = await api.getHistory(daysToFetch);

      if (history && history.length > 0) {
        // Filter to only include dates from Sunday onwards
        const sundayStr = sunday.toISOString().split('T')[0];
        const weekHistory = history.filter((day: any) => day.date >= sundayStr);

        // Calculate totals from history (excluding today)
        const weeklyTotals = weekHistory.reduce((acc: any, day: any) => {
          // Skip today - we'll use live data instead
          if (day.date === todayStr) {
            return acc;
          }
          const dayNetCalories = (day.caloriesIn || 0) - (day.caloriesOut || 0);
          const dayFatChange = dayNetCalories / 3500; // negative = loss, positive = gain
          return {
            steps: acc.steps + (day.steps || 0),
            calories: acc.calories + (day.caloriesIn || 0),
            protein: acc.protein + (day.protein || 0),
            carbs: acc.carbs + (day.carbs || 0),
            fat: acc.fat + (day.fat || 0),
            fatLoss: acc.fatLoss - dayFatChange, // subtract because negative net = fat loss (positive contribution)
          };
        }, { steps: 0, calories: 0, protein: 0, carbs: 0, fat: 0, fatLoss: 0 });

        // Add today's LIVE metrics if selectedDate is today
        if (selectedDate === todayStr) {
          weeklyTotals.calories += caloriesIn; // Use state values
          weeklyTotals.protein += protein;
          weeklyTotals.carbs += carbs;
          weeklyTotals.fat += fat;
          // Add today's fat change (deficit adds to fat loss, surplus subtracts)
          const todayNetCalories = caloriesIn - caloriesOut;
          const todayFatChange = todayNetCalories / 3500; // negative = loss, positive = gain
          weeklyTotals.fatLoss -= todayFatChange; // subtract: negative net → positive fat loss
          // Note: Steps will be added separately after Apple Health fetch
        }

        console.log('[Dashboard] Weekly totals calculated:', weeklyTotals);
        console.log('[Dashboard] Today\'s contribution:', {
          calories: selectedDate === todayStr ? caloriesIn : 0,
          protein: selectedDate === todayStr ? protein : 0,
          carbs: selectedDate === todayStr ? carbs : 0,
          fat: selectedDate === todayStr ? fat : 0
        });

        setWeeklySteps(weeklyTotals.steps);
        setWeeklyCalories(weeklyTotals.calories);
        setWeeklyProtein(weeklyTotals.protein);
        setWeeklyCarbs(weeklyTotals.carbs);
        setWeeklyFat(weeklyTotals.fat);
        setWeeklyFatLoss(weeklyTotals.fatLoss);
      }
    } catch (error) {
      // console.error('Error fetching data:', error);
      // No data available - keep at zero
      setCaloriesIn(0);
      setCaloriesOut(0);
      setProtein(0);
      setCarbs(0);
      setFat(0);
      setMeals([]);
    }
  }, [selectedDate]);

  // Fetch wearables data (steps, active/resting energy) for the selected date
  const fetchWearablesData = useCallback(async (force: boolean = false) => {
    // Throttle: skip if last fetch was < 60s ago (unless force)
    const now = Date.now();
    if (!force && now - lastHealthFetchRef.current < 60_000) {
      console.log('[Dashboard] Skipping health fetch - throttled (last fetch', Math.round((now - lastHealthFetchRef.current) / 1000), 's ago)');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === todayStr;

    // If viewing today AND on iOS, fetch fresh data from Apple Health
    if (isToday && Platform.OS === 'ios') {
      try {
        console.log('[Dashboard] Fetching fresh Apple Health data for today...');
        const healthData = await appleHealthService.getTodayData();

        if (healthData) {
          console.log('[Dashboard] Apple Health data received:', healthData);
          const totalCaloriesOut = healthData.caloriesOut || 0;
          const totalSteps = healthData.steps || 0;
          const totalRestingEnergy = healthData.restingEnergy || 0;
          const totalActiveEnergy = totalCaloriesOut - totalRestingEnergy;
          const currentHeartRate = healthData.heartRate || 0;
          const systolic = healthData.bloodPressureSystolic || 0;
          const diastolic = healthData.bloodPressureDiastolic || 0;

          setCaloriesOut(totalCaloriesOut);
          setSteps(totalSteps);
          setActiveEnergy(totalActiveEnergy);
          setRestingEnergy(totalRestingEnergy);
          setHeartRate(currentHeartRate);
          setBloodPressureSystolic(systolic);
          setBloodPressureDiastolic(diastolic);
          setLastSynced(new Date().toLocaleTimeString());
          lastHealthFetchRef.current = Date.now();

          // Store today's data in backend for persistence
          try {
            await api.ingestHealthData({
              date: selectedDate,
              steps: totalSteps,
              caloriesOut: totalCaloriesOut,
              restingEnergy: totalRestingEnergy,
            });
            console.log('[Dashboard] Synced Apple Health data to backend');
          } catch (syncError) {
            console.log('[Dashboard] Failed to sync to backend:', syncError);
          }
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching Apple Health data:', error);
      }
    } else {
      // For historical dates OR non-iOS, fetch from backend
      try {
        console.log('[Dashboard] Fetching wearables data from backend for date:', selectedDate);
        const metrics = await api.getMetricsByDate(selectedDate);

        if (metrics) {
          console.log('[Dashboard] Backend metrics received:', metrics);
          setCaloriesOut(metrics.caloriesOut || 0);
          setSteps(metrics.steps || 0);
          setRestingEnergy(metrics.restingEnergy || 0);
          const activeEnergy = (metrics.caloriesOut || 0) - (metrics.restingEnergy || 0);
          setActiveEnergy(activeEnergy);
          lastHealthFetchRef.current = Date.now();
        } else {
          console.log('[Dashboard] No backend data for date:', selectedDate);
          // No data for this date - reset to zero
          setCaloriesOut(0);
          setSteps(0);
          setActiveEnergy(0);
          setRestingEnergy(0);
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching backend wearables data:', error);
      }
    }
  }, [selectedDate]);

  // Legacy function name for compatibility
  const fetchAppleHealthCalories = fetchWearablesData;

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    capture('pull_to_refresh', {
      screen_name: 'Home Dashboard',
    });
    await checkApiConnection();
    await fetchData();
    await fetchWearablesData(true); // force=true bypasses throttle on pull-to-refresh
    setRefreshing(false);
  }, [fetchData, fetchWearablesData, capture]);

  // Sync with fitness tracker
  const handleSync = async () => {
    setLastSynced('Syncing...');
    try {
      // In a real app, this would integrate with Apple Health / Google Fit
      const success = await api.syncFitnessData('manual', {
        date: selectedDate,
        steps: 0,
        caloriesOut: 0,
      });
      if (success) {
        setLastSynced(new Date().toLocaleTimeString());
        await fetchData();
      } else {
        setLastSynced('Sync failed');
      }
    } catch (error) {
      setLastSynced('Sync failed');
    }
  };

  // Log meal handler
  const handleLogMeal = async () => {
    if (!mealName || !mealCalories) {
      Alert.alert('Error', 'Please enter meal name and calories');
      return;
    }

    const success = await api.logMeal({
      date: selectedDate,
      mealType: selectedMealType,
      name: mealName,
      calories: parseInt(mealCalories) || 0,
      protein: parseInt(mealProtein) || 0,
      carbs: parseInt(mealCarbs) || 0,
      fat: parseInt(mealFat) || 0,
    });

    if (success) {
      setShowMealModal(false);
      setMealName('');
      setMealCalories('');
      setMealProtein('');
      setMealCarbs('');
      setMealFat('');
      await fetchData();
    } else {
      Alert.alert('Error', 'Failed to log meal. Please try again.');
    }
  };

  // Delete meal handler
  const handleDeleteMeal = (mealId: string, mealName: string) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${mealName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await api.deleteMeal(mealId);
            if (success) {
              await fetchData(); // Refresh the data
            } else {
              Alert.alert('Error', 'Failed to delete meal. Please try again.');
            }
          },
        },
      ]
    );
  };

  // One-time setup (greeting, week days, API check, analytics)
  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Generate week days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const today = now.getDay();
    const todayDate = now.getDate();

    const week = [];
    for (let i = 0; i < 7; i++) {
      const diff = i - today;
      const date = new Date(now);
      date.setDate(todayDate + diff);
      week.push({
        day: days[i],
        date: date.getDate(),
        dateStr: date.toISOString().split('T')[0],
        isToday: i === today
      });
    }
    setWeekDays(week);

    checkApiConnection();

    // Track screen view
    capture('screen_viewed', {
      screen_name: 'Home Dashboard',
      screen_type: 'tab',
    });
  }, []);

  // Auto-refresh: fetch on tab focus, app foreground, and poll every 5 minutes
  useFocusEffect(
    useCallback(() => {
      // Fetch data when tab gains focus
      fetchData();
      fetchWearablesData();

      // Refresh when app returns from background
      const sub = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          fetchData();
          fetchWearablesData();
        }
      });

      // Poll every 5 minutes while tab is focused
      const interval = setInterval(() => {
        fetchData();
        fetchWearablesData();
      }, 5 * 60 * 1000);

      return () => {
        sub.remove();
        clearInterval(interval);
      };
    }, [fetchData, fetchWearablesData])
  );

  // Refetch when calendar date changes
  useEffect(() => {
    fetchData();
    fetchWearablesData();
  }, [selectedDate]);

  // Log net calorie calculation for verification
  useEffect(() => {
    const netCalories = caloriesIn - caloriesOut;
    console.log('[Dashboard] Net Calories Calculation:');
    console.log('[Dashboard]   Calories In:', caloriesIn);
    console.log('[Dashboard]   Calories Out:', caloriesOut);
    console.log('[Dashboard]   Net Calories (In - Out):', netCalories);
    console.log('[Dashboard]   Calorie Goal:', calorieGoal);
    console.log('[Dashboard]   Gauge will display:', netCalories, '/', calorieGoal);
  }, [caloriesIn, caloriesOut, calorieGoal]);

  // Update weekly nutrition when today's meals change
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    console.log('[Weekly Update] Effect triggered:', {
      selectedDate,
      todayStr,
      isToday: selectedDate === todayStr,
      caloriesIn,
      protein,
      carbs,
      fat,
      mealsCount: meals.length
    });

    // Only update if we're viewing today
    if (selectedDate === todayStr) {
      const updateWeeklyNutrition = async () => {
        try {
          const dayOfWeek = now.getDay();
          const daysToFetch = dayOfWeek + 1;
          const history = await api.getHistory(daysToFetch);

          console.log('[Weekly Update] History fetched:', {
            historyLength: history?.length || 0,
            daysToFetch
          });

          // Initialize with zeros
          let historyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fatLoss: 0 };

          if (history && history.length > 0) {
            const sunday = new Date(now);
            sunday.setDate(now.getDate() - dayOfWeek);
            const sundayStr = sunday.toISOString().split('T')[0];
            const weekHistory = history.filter((day: any) => day.date >= sundayStr);

            console.log('[Weekly Update] Week history filtered:', {
              weekHistoryLength: weekHistory.length,
              sundayStr,
              todayStr
            });

            // Sum nutrition from history, excluding today
            historyTotals = weekHistory.reduce((acc: any, day: any) => {
              if (day.date === todayStr) {
                console.log('[Weekly Update] Skipping today from history:', day.date);
                return acc; // Skip today
              }
              console.log('[Weekly Update] Adding day:', {
                date: day.date,
                calories: day.caloriesIn,
                protein: day.protein,
                carbs: day.carbs,
                fat: day.fat
              });
              const dayNetCalories = (day.caloriesIn || 0) - (day.caloriesOut || 0);
              const dayFatChange = dayNetCalories / 3500; // negative = loss, positive = gain
              return {
                calories: acc.calories + (day.caloriesIn || 0),
                protein: acc.protein + (day.protein || 0),
                carbs: acc.carbs + (day.carbs || 0),
                fat: acc.fat + (day.fat || 0),
                fatLoss: acc.fatLoss - dayFatChange, // subtract: negative net → positive fat loss
              };
            }, { calories: 0, protein: 0, carbs: 0, fat: 0, fatLoss: 0 });
          }

          // Add today's LIVE metrics from state (always, even if no history)
          const totalWeeklyCalories = historyTotals.calories + caloriesIn;
          const totalWeeklyProtein = historyTotals.protein + protein;
          const totalWeeklyCarbs = historyTotals.carbs + carbs;
          const totalWeeklyFat = historyTotals.fat + fat;
          const todayNetCalories = caloriesIn - caloriesOut;
          const todayFatChange = todayNetCalories / 3500; // negative = loss, positive = gain
          const totalWeeklyFatLoss = historyTotals.fatLoss - todayFatChange; // subtract: negative net → positive fat loss

          console.log('[Weekly Update] 🎯 FINAL WEEKLY TOTALS:', {
            historyTotals,
            todayLive: { calories: caloriesIn, protein, carbs, fat },
            finalTotals: {
              calories: totalWeeklyCalories,
              protein: totalWeeklyProtein,
              carbs: totalWeeklyCarbs,
              fat: totalWeeklyFat,
              fatLoss: totalWeeklyFatLoss
            }
          });

          setWeeklyCalories(totalWeeklyCalories);
          setWeeklyProtein(totalWeeklyProtein);
          setWeeklyCarbs(totalWeeklyCarbs);
          setWeeklyFat(totalWeeklyFat);
          setWeeklyFatLoss(totalWeeklyFatLoss);
        } catch (error) {
          console.log('[Weekly Update] ❌ Error:', error);
        }
      };

      updateWeeklyNutrition();
    }
  }, [caloriesIn, protein, carbs, fat, meals.length, selectedDate]);

  // Update weekly steps when today's steps change (from Apple Health)
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Only update weekly steps if we're viewing today
    if (selectedDate === todayStr && steps > 0) {
      // Recalculate weekly steps: history steps (already excluding today) + today's live steps
      // This is triggered after Apple Health fetch updates the steps state
      const fetchWeeklySteps = async () => {
        try {
          const dayOfWeek = now.getDay();
          const daysToFetch = dayOfWeek + 1;
          const history = await api.getHistory(daysToFetch);

          // Initialize historySteps to 0 (works even with no history)
          let historySteps = 0;

          if (history && history.length > 0) {
            const sunday = new Date(now);
            sunday.setDate(now.getDate() - dayOfWeek);
            const sundayStr = sunday.toISOString().split('T')[0];
            const weekHistory = history.filter((day: any) => day.date >= sundayStr);

            // Sum steps from history, excluding today
            historySteps = weekHistory.reduce((acc: number, day: any) => {
              if (day.date === todayStr) return acc; // Skip today
              return acc + (day.steps || 0);
            }, 0);
          }

          // MOVED OUTSIDE if block - always set weekly steps
          const totalWeeklySteps = historySteps + steps;
          console.log('[Dashboard] Updated weekly steps:', {
            historySteps,
            todaySteps: steps,
            totalWeeklySteps
          });
          setWeeklySteps(totalWeeklySteps);
        } catch (error) {
          console.log('[Dashboard] Error updating weekly steps:', error);
        }
      };

      fetchWeeklySteps();
    }
  }, [steps, selectedDate]);

  const getMealCalories = (type: string) => {
    const mealList = meals.filter(m => m.mealType === type);
    return mealList.reduce((sum, m) => sum + (m.calories || 0), 0);
  };

  // Animated Calorie Gauge with red glow when over target
  const CalorieGaugeAnimated = ({ value, maxValue }: { value: number; maxValue: number }) => {
    const isOverTarget = value > maxValue;
    const displayColor = isOverTarget ? Colors.overTarget : Colors.gaugeFill;

    const glowAnim = useRef(new Animated.Value(0)).current;
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
      if (isOverTarget) {
        animationRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: false,
            }),
          ])
        );
        animationRef.current.start();
      } else {
        if (animationRef.current) {
          animationRef.current.stop();
        }
        glowAnim.setValue(0);
      }
      return () => {
        if (animationRef.current) {
          animationRef.current.stop();
        }
      };
    }, [isOverTarget]);

    const animatedShadowRadius = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 30],
    });

    const animatedShadowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 0.8],
    });

    return (
      <Animated.View style={[
        styles.semiGaugeContainer,
        isOverTarget && Platform.OS !== 'web' && {
          shadowColor: Colors.overTarget,
          shadowOpacity: animatedShadowOpacity,
          shadowRadius: animatedShadowRadius,
          shadowOffset: { width: 0, height: 0 },
        }
      ]}>
        <SemiCircularGauge
          value={value}
          maxValue={maxValue}
          size={340}
          strokeWidth={24}
          label="kcal"
          unit="kcal"
          progressColor={displayColor}
          showCenterValue={true}
          useRoundedNumeral={false}
        />
      </Animated.View>
    );
  };

  const MacroGauge = ({
    label,
    current,
    target,
    color,
    unit = 'g',
    displayType = 'gauge',
    themeColors = colors,
    usePastelBar = false,
  }: {
    label: string;
    current: number;
    target: number;
    color: string;
    unit?: string;
    displayType?: 'gauge' | 'bar';
    themeColors?: typeof colors;
    usePastelBar?: boolean;
  }) => {
    const percentage = Math.round((current / target) * 100);
    const isOverTarget = current > target;
    const isGoalMet = current >= target; // Goal is met or exceeded
    // For bar display (health metrics), turn green when goal met; for gauges, turn red when over
    const displayColor = displayType === 'bar'
      ? (isGoalMet ? Colors.goalAchieved : color)
      : (isOverTarget ? Colors.overTarget : color);

    // Animated glow effect for over-target (gauges)
    const glowAnim = useRef(new Animated.Value(0)).current;
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);

    // Animated pulse effect for goal achieved (bars)
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
      if (isOverTarget && displayType !== 'bar') {
        animationRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: false,
            }),
          ])
        );
        animationRef.current.start();
      } else {
        if (animationRef.current) {
          animationRef.current.stop();
        }
        glowAnim.setValue(0);
      }
      return () => {
        if (animationRef.current) {
          animationRef.current.stop();
        }
      };
    }, [isOverTarget, displayType]);

    // Pulse animation for bars when goal is met
    useEffect(() => {
      if (isGoalMet && displayType === 'bar') {
        pulseAnimRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 0.6,
              duration: 800,
              useNativeDriver: false,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: false,
            }),
          ])
        );
        pulseAnimRef.current.start();
      } else {
        if (pulseAnimRef.current) {
          pulseAnimRef.current.stop();
        }
        pulseAnim.setValue(1);
      }
      return () => {
        if (pulseAnimRef.current) {
          pulseAnimRef.current.stop();
        }
      };
    }, [isGoalMet, displayType]);

    const animatedShadowRadius = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [4, 20],
    });

    const animatedShadowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    });

    // Glow effect for goal achieved bars
    const barGlowRadius = pulseAnim.interpolate({
      inputRange: [0.6, 1],
      outputRange: [12, 6],
    });

    const barGlowOpacity = pulseAnim.interpolate({
      inputRange: [0.6, 1],
      outputRange: [0.9, 0.5],
    });

    const unitLabel = unit || '';

    if (displayType === 'bar') {
      // Horizontal bar display for health metrics
      const roundedCurrent = Math.round(current);
      const roundedTarget = Math.round(target);

      return (
        <View
          style={styles.healthMetricContainer}
          accessible={true}
          accessibilityLabel={`${label}: ${roundedCurrent.toLocaleString()} ${unitLabel} of ${roundedTarget.toLocaleString()} ${unitLabel} goal, ${percentage}% complete${isOverTarget ? ', over target' : ''}`}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: roundedTarget,
            now: roundedCurrent,
            text: `${percentage}%`,
          }}
        >
          <Text style={[styles.healthMetricLabel, { color: themeColors.textMuted }, isGoalMet && { color: Colors.goalAchieved }]} numberOfLines={1} adjustsFontSizeToFit>{label.toUpperCase()}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 16 }}>
            <NumberText weight="light" style={[styles.healthMetricValue, { color: themeColors.text }, isGoalMet && { color: Colors.goalAchieved }]} numberOfLines={1} adjustsFontSizeToFit>
              {roundedCurrent.toLocaleString()}
            </NumberText>
            {unitLabel && (
              <NumberText weight="light" style={[styles.healthMetricUnit, { color: themeColors.text }, isGoalMet && { color: Colors.goalAchieved }]}>
                {` ${unitLabel}`}
              </NumberText>
            )}
          </View>
          {/* Horizontal Progress Bar */}
          <View style={[styles.horizontalBarContainer, isGoalMet && { paddingVertical: 6 }]}>
            <View style={styles.horizontalBarWrapper}>
              {/* Background track - pastel version of the color when usePastelBar is true */}
              <View style={[styles.horizontalBarBg, { backgroundColor: usePastelBar ? `${color}20` : (isDark ? Colors.gaugeBg : 'rgba(0,0,0,0.08)') }]} />
              {/* Foreground fill with glow */}
              <Animated.View
                style={[
                  styles.horizontalBarFillAbsolute,
                  {
                    backgroundColor: displayColor,
                    width: `${Math.min(percentage, 100)}%`,
                    opacity: isGoalMet ? pulseAnim : 1,
                  },
                  isGoalMet && Platform.OS !== 'web' && {
                    shadowColor: Colors.goalAchieved,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: barGlowOpacity,
                    shadowRadius: barGlowRadius,
                    elevation: 8,
                  }
                ]}
              />
            </View>
          </View>
          <NumberText weight="regular" style={[styles.healthMetricGoal, { color: isGoalMet ? Colors.goalAchieved : themeColors.textMuted }]}>Goal: {roundedTarget.toLocaleString()}{unitLabel && ` ${unitLabel}`}</NumberText>
        </View>
      );
    }

    // Semi-circular gauge display for macros
    return (
      <View
        style={styles.macroGaugeContainer}
        accessible={true}
        accessibilityLabel={`${label}: ${current} ${unitLabel} of ${target} ${unitLabel} goal, ${percentage}% complete${isOverTarget ? ', over target' : ''}`}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: target,
          now: current,
          text: `${percentage}%`,
        }}
      >
        <Text style={[styles.macroLabel, { color: themeColors.textMuted }, isOverTarget && { color: Colors.overTarget }]}>{label.toUpperCase()}</Text>
        <Animated.View style={[
          styles.macroGaugeWrapper,
          isOverTarget && Platform.OS !== 'web' && {
            shadowColor: Colors.overTarget,
            shadowOpacity: animatedShadowOpacity,
            shadowRadius: animatedShadowRadius,
            shadowOffset: { width: 0, height: 0 },
          }
        ]}>
          <SemiCircularGauge
            value={current}
            maxValue={target}
            size={100}
            strokeWidth={10}
            label={unitLabel}
            unit=""
            progressColor={displayColor}
          />
        </Animated.View>
        <NumberText weight="regular" style={[styles.macroTarget, { color: themeColors.textMuted }]}>Goal: {target}{unitLabel}</NumberText>
      </View>
    );
  };

  // Render individual card based on ID
  const renderCard = useCallback((cardId: string) => {
    switch (cardId) {
      case 'calendar':
        return <CalendarCard key={cardId} selectedDate={selectedDate} onDateChange={setSelectedDate} />;

      case 'dailyBalance':
        // Calculate daily projected fat loss/gain
        // Formula: dailyDeficit = TDEE - caloriesConsumed, projectedDailyFatLoss = dailyDeficit / 3500
        const dailyDeficit = caloriesOut - caloriesIn;
        const projectedDailyFatChange = dailyDeficit / 3500; // positive = loss, negative = gain

        // Determine if it's a loss or gain for display
        const isDeficit = dailyDeficit >= 0;
        const fatChangeLabel = isDeficit ? 'FAT LOSS' : 'FAT GAIN';
        const fatChangeValue = Math.abs(projectedDailyFatChange) < 0.01 ? '0' : Math.abs(projectedDailyFatChange).toFixed(2);

        // Handle edge cases: if no TDEE data yet, show placeholder
        const hasTDEE = caloriesOut > 0;
        const displayFatValue = hasTDEE ? `${fatChangeValue}` : '--';

        // Color coding: green for loss, red/orange for gain
        const fatChangeColor = isDeficit ? colors.text : Colors.overTarget;

        return (
          <TouchableOpacity
            key={cardId}
            activeOpacity={0.7}
            onPress={() => setShowDailyBalanceInfoModal(true)}
            accessibilityLabel={`Daily balance: ${Math.round(caloriesIn)} calories in, ${Math.round(caloriesOut)} calories out, ${isDeficit ? 'deficit' : 'surplus'} of ${displayFatValue} pounds per day`}
            accessibilityRole="button"
            accessibilityHint="Opens detailed daily balance modal with calorie breakdown and fat change analysis"
          >
            <GlassCard style={{ marginHorizontal: 16, marginBottom: 24, marginTop: 32 }} interactive>
              <Text style={[styles.dailyBalanceTitle, { color: colors.text }, caloriesIn > calorieGoal && { color: Colors.overTarget }]}>DAILY BALANCE</Text>
              <CalorieGaugeAnimated value={caloriesIn - caloriesOut} maxValue={calorieGoal} />
              <View style={[styles.calorieCardsRow, { gap: 8 }]}>
                <GlassCard style={styles.calorieSubCard} interactive>
                  <Text style={[styles.calorieSubCardTitle, { color: colors.textMuted }]} numberOfLines={1}>CAL IN</Text>
                  <NumberText weight="regular" style={[styles.calorieSubCardValue, { color: colors.text }]}>{Math.round(caloriesIn)}</NumberText>
                  <NumberText weight="regular" style={[styles.calorieSubCardUnit, { color: colors.textSecondary }]}>kcal</NumberText>
                </GlassCard>
                <GlassCard style={styles.calorieSubCard} interactive>
                  <Text style={[styles.calorieSubCardTitle, { color: colors.textMuted }]} numberOfLines={1}>CAL OUT</Text>
                  <NumberText weight="regular" style={[styles.calorieSubCardValue, { color: colors.text }]}>{Math.round(caloriesOut)}</NumberText>
                  <NumberText weight="regular" style={[styles.calorieSubCardUnit, { color: colors.textSecondary }]}>kcal</NumberText>
                </GlassCard>
                <GlassCard style={styles.calorieSubCard} interactive>
                  <Text style={[styles.calorieSubCardTitle, { color: colors.textMuted }]} numberOfLines={1}>{fatChangeLabel}</Text>
                  <NumberText weight="regular" style={[styles.calorieSubCardValue, { color: fatChangeColor }]}>{displayFatValue}</NumberText>
                  <NumberText weight="regular" style={[styles.calorieSubCardUnit, { color: colors.textSecondary }]}>lbs/day</NumberText>
                </GlassCard>
              </View>
            </GlassCard>
          </TouchableOpacity>
        );

      case 'macros':
        return (
          <View key={cardId} style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 8 }}>
            <ProteinCard
              current={protein}
              goal={proteinGoal}
              onPress={() => setShowProteinInfoModal(true)}
            />
            <FatCard
              current={fat}
              goal={fatGoal}
              onPress={() => setShowFatInfoModal(true)}
            />
            <CarbsCard
              current={carbs}
              goal={carbsGoal}
              onPress={() => setShowCarbsInfoModal(true)}
            />
          </View>
        );

      case 'waterTracking':
        // Only render if water tracking is enabled in settings
        if (!settings.waterTracking) return null;
        return (
          <View key={cardId} style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <WaterTrackingCard date={selectedDate} />
          </View>
        );

      case 'healthMetrics':
        return (
          <View key={cardId} style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 8 }}>
            <StepsCard
              steps={steps}
              goal={stepsGoal}
              weeklySteps={weeklySteps}
              weeklyGoal={stepsGoal * 7}
            />
            <ActiveEnergyCard
              activeEnergy={activeEnergy}
              goal={activeEnergyGoal}
              weeklyActiveEnergy={weeklyCalories} // Using weeklyCalories as proxy for now
              weeklyGoal={activeEnergyGoal * 7}
            />
            <RestingEnergyCard
              restingEnergy={restingEnergy}
              goal={restingEnergyGoal}
              weeklyRestingEnergy={restingEnergyGoal * 7} // Calculated estimate
            />
          </View>
        );

      case 'workoutFasting':
        // Get today's workout info from training context
        const todayIndex = new Date().getDay(); // 0 = Sunday
        const dayIndex = todayIndex === 0 ? 6 : todayIndex - 1; // Convert to Monday = 0
        const todaysPlan = trainingState?.weeklyPlan?.days?.[dayIndex];
        const todaysWorkout = todaysPlan?.workout;

        // Determine workout type and name
        let workoutType = 'No Workout';
        let workoutName = '';
        let isRestDay = todaysPlan?.isRestDay ?? true;

        if (todaysWorkout) {
          workoutType = todaysWorkout.type || todaysWorkout.name || 'Workout';
          workoutName = todaysWorkout.name || '';
          isRestDay = false;
        } else if (todaysPlan?.isRestDay) {
          workoutType = 'Rest Day';
          isRestDay = true;
        }

        // Count workouts this week from training plan
        let weeklyWorkoutCount = 0;
        if (trainingState?.weeklyPlan?.days) {
          weeklyWorkoutCount = trainingState.weeklyPlan.days.filter(
            (day: any) => day.workout && day.workout.completed
          ).length;
        }

        // Check if fasting is enabled
        const fastingEnabled = goalWizardState?.intermittentFasting ?? false;

        return (
          <View key={cardId} style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 8, alignItems: 'flex-end' }}>
            {/* Today's Workout Card */}
            <TodaysWorkoutCard
              workoutType={workoutType}
              workoutName={workoutName}
              isRestDay={isRestDay}
              weeklyCount={weeklyWorkoutCount}
              onPress={() => router.push('/programs')}
            />

            {/* Fasting Timer Card - Only show if fasting is enabled */}
            {fastingEnabled && (
              <FastingTimerCard />
            )}

            {/* If fasting not enabled, show a minimal placeholder */}
            {!fastingEnabled && (
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => router.push('/goals')}
                activeOpacity={0.7}
                accessibilityLabel="Fasting not active, tap to enable"
                accessibilityRole="button"
                accessibilityHint="Opens goals settings where you can enable intermittent fasting tracking"
              >
                <GlassCard style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 12 }} interactive>
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    {/* Icon */}
                    <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Clock size={24} color={colors.text} />
                    </View>

                    {/* Label */}
                    <Text style={{ color: colors.textMuted, fontFamily: Fonts.semiBold, fontSize: 9, letterSpacing: 0.5, textAlign: 'center', marginBottom: 8 }}>FASTING</Text>

                    {/* Value */}
                    <Text style={{ color: colors.text, fontFamily: Fonts.light, fontSize: 16, textAlign: 'center', marginBottom: 4 }}>Tap to Enable</Text>

                    {/* Subtitle */}
                    <Text style={{ color: colors.textMuted, fontFamily: Fonts.regular, fontSize: 10, textAlign: 'center' }}>not active</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            )}

            {/* Heart Rate Card */}
            <HeartRateCard
              heartRate={heartRate}
              systolic={bloodPressureSystolic}
              diastolic={bloodPressureDiastolic}
            />
          </View>
        );

      case 'quickActions':
        // Get workouts completed this week from training state
        let completedWorkouts = 0;
        if (trainingState?.weeklyPlan?.days) {
          completedWorkouts = trainingState.weeklyPlan.days.filter(
            (day: any) => day.workout && day.workout.completed
          ).length;
        }
        // Get user's workout goal from GoalWizardContext
        const workoutsPerWeekGoal = goalWizardState?.workoutsPerWeek || 3;

        return (
          <View key={cardId} style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 8 }}>
            {/* Workouts Card - opens bottom sheet */}
            <AnimatedPressable
              style={[{ flex: 1 }, workoutCardAnimatedStyle]}
              onPressIn={() => {
                workoutCardScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
              }}
              onPressOut={() => {
                workoutCardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
              }}
              onPress={() => workoutSheetRef.current?.present()}
            >
              <GlassCard style={{ paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', minHeight: 150 }} interactive>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <Dumbbell size={24} color={colors.primary} />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.textMuted }]}>WORKOUTS</Text>
                <NumberText weight="light" style={[styles.quickActionValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{completedWorkouts}/{workoutsPerWeekGoal}</NumberText>
                <Text style={[styles.quickActionSubtitle, { color: colors.textMuted }]}>this week</Text>
              </GlassCard>
            </AnimatedPressable>

            {/* Weekly Progress Card - opens bottom sheet */}
            <AnimatedPressable
              style={[{ flex: 1 }, weeklyCardAnimatedStyle]}
              onPressIn={() => {
                weeklyCardScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
              }}
              onPressOut={() => {
                weeklyCardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
              }}
              onPress={() => weeklyStatsSheetRef.current?.present()}
            >
              <GlassCard style={{ paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', minHeight: 150 }} interactive>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <BarChart3 size={24} color={colors.primary} />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.textMuted }]}>WEEKLY</Text>
                <Text style={[styles.quickActionValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>View Stats</Text>
                <Text style={[styles.quickActionSubtitle, { color: colors.textMuted }]}>this week</Text>
              </GlassCard>
            </AnimatedPressable>

            {/* Wearable Sync Card - opens bottom sheet */}
            <AnimatedPressable
              style={[{ flex: 1 }, wearablesCardAnimatedStyle]}
              onPressIn={() => {
                wearablesCardScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
              }}
              onPressOut={() => {
                wearablesCardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
              }}
              onPress={() => wearablesSyncSheetRef.current?.present()}
            >
              <GlassCard style={{ paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', minHeight: 150 }} interactive>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <Watch size={24} color={colors.primary} />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.textMuted }]}>SYNC</Text>
                <Text style={[styles.quickActionValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{lastSynced ? 'Connected' : 'Not Synced'}</Text>
                <Text style={[styles.quickActionSubtitle, { color: colors.textMuted }]}>{lastSynced ? 'apple health' : 'no device'}</Text>
              </GlassCard>
            </AnimatedPressable>
          </View>
        );

      default:
        return null;
    }
  }, [selectedDate, colors, caloriesIn, caloriesOut, calorieGoal, protein, proteinGoal, fat, fatGoal, carbs, carbsGoal, heartRate, bloodPressureSystolic, bloodPressureDiastolic, lastSynced, goalWizardState]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BottomSheetModalProvider>
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
          }
        >
        {/* Header with Greeting */}
        <GlassCard style={styles.greetingCard} interactive>
          <View style={styles.profileImageWrapper}>
            <LiquidGlassProfileImage size={70} showEditButton={false} />
          </View>
          <Text style={[styles.greetingTime, { color: colors.textMuted }]}>{greeting}</Text>
          <Text style={[styles.greetingName, { color: colors.text }]}>
            {isAuthenticated && user?.firstName ? user.firstName.toUpperCase() : 'THERE'}
          </Text>
          <Text style={[styles.dailyQuote, { color: colors.textSecondary }]}>Energy flows where intention goes.</Text>

          {/* Sign in with Apple prompt for unauthenticated users */}
          {!isAuthenticated && !authLoading && isAppleSignInAvailable && (
            <TouchableOpacity
              onPress={signInWithApple}
              style={[styles.signInButton, { backgroundColor: colors.card }]}
              accessibilityLabel="Sign in with Apple"
              accessibilityRole="button"
            >
              <Ionicons name="logo-apple" size={18} color={colors.text} style={{ marginRight: 8 }} />
              <Text style={[styles.signInText, { color: colors.text }]}>Sign in with Apple</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Dashboard Cards */}
        {cardOrder.map(cardId => renderCard(cardId))}

      {/* Today's Meals Card - Handled separately due to complex state */}
      <GlassCard style={{ marginHorizontal: 16, marginBottom: 24 }} interactive>
        {/* Collapsible Header */}
        <TouchableOpacity
          onPress={() => setIsMealsExpanded(!isMealsExpanded)}
          style={styles.cardHeader}
          accessible={true}
          accessibilityLabel={`Today's Meals card, ${isMealsExpanded ? 'expanded' : 'collapsed'}`}
          accessibilityHint="Tap to expand or collapse"
          accessibilityRole="button"
        >
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 24, fontFamily: Fonts.numericSemiBold, letterSpacing: 0.5 }]}>TODAY'S MEALS</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Click to expand • View your meals</Text>
          </View>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>{isMealsExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {/* Expandable Content */}
        {isMealsExpanded && (
          <View style={styles.cardContent}>
            {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
          const mealList = meals.filter(m => m.mealType === mealType);
          const mealCals = mealList.reduce((sum, m) => sum + (m.calories || 0), 0);
          const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);
          return (
            <View key={mealType} style={styles.mealSection}>
              {/* Meal Type Header */}
              <TouchableOpacity
                style={styles.mealItem}
                onPress={() => {
                  setSelectedMealType(mealType as any);
                  setShowMealModal(true);
                }}
                accessible={true}
                accessibilityLabel={`${mealLabel}: ${mealCals} calories logged`}
                accessibilityHint={`Tap to log ${mealLabel.toLowerCase()}`}
                accessibilityRole="button"
              >
                <View style={styles.mealInfo}>
                  <Text style={[styles.mealName, { color: colors.text }]}>{mealLabel}</Text>
                  <Text style={[styles.mealTime, { color: colors.textMuted }]}>
                    {mealType === 'breakfast' ? '7:00 - 10:00 AM' :
                     mealType === 'lunch' ? '12:00 - 2:00 PM' :
                     mealType === 'dinner' ? '6:00 - 9:00 PM' : 'Any time'}
                  </Text>
                </View>
                <NumberText weight="regular" style={[styles.mealCalories, { color: colors.textSecondary }]}>{mealCals} kcal</NumberText>
              </TouchableOpacity>

              {/* Individual Meals */}
              {mealList.map((meal, index) => (
                <View key={meal.id || index} style={[styles.loggedMealItem, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                  <View style={styles.loggedMealContent}>
                    <Text style={[styles.loggedMealName, { color: colors.text }]}>{meal.name}</Text>
                    <NumberText weight="regular" style={[styles.loggedMealMacros, { color: colors.textMuted }]}>
                      {Math.round(meal.calories)} cal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                    </NumberText>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteMealButton}
                    onPress={() => handleDeleteMeal(meal.id, meal.name)}
                    accessibilityLabel={`Delete ${meal.name}`}
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash-outline" size={18} color="rgba(255,100,100,0.8)" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
          </View>
        )}
      </GlassCard>

      {/* AI Meal Logger */}
      <AIMealLogger
        visible={showMealModal}
        onClose={() => setShowMealModal(false)}
        onSuccess={() => {
          setShowMealModal(false);
          fetchData(); // Refresh data after logging
        }}
        selectedDate={selectedDate}
      />

      <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Fat Loss Modal */}
      <Modal
        visible={showFatLossModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFatLossModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)' }]}
              onPress={() => setShowFatLossModal(false)}
              accessibilityLabel="Close fat loss modal"
              accessibilityRole="button"
              accessibilityHint="Dismisses the daily fat loss breakdown and returns to home screen"
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <DailyFatLossCard
              caloriesIn={caloriesIn}
              caloriesOut={caloriesOut}
              weeklyTarget={weeklyWeightTarget}
              goalType={goalType}
            />
          </View>
        </View>
      </Modal>

      {/* Weekly Progress Modal */}
      <Modal
        visible={showWeeklyProgressModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowWeeklyProgressModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)' }]}
              onPress={() => setShowWeeklyProgressModal(false)}
              accessibilityLabel="Close weekly progress modal"
              accessibilityRole="button"
              accessibilityHint="Dismisses the weekly progress breakdown and returns to home screen"
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <WeeklyProgressCard
              weeklySteps={weeklySteps}
              weeklyCalories={weeklyCalories}
              weeklyProtein={weeklyProtein}
              weeklyCarbs={weeklyCarbs}
              weeklyFat={weeklyFat}
              weeklyFatLoss={Math.max(0, weeklyFatLoss)}
              stepsGoal={stepsGoal}
              caloriesGoal={calorieGoal}
              proteinGoal={proteinGoal}
              carbsGoal={carbsGoal}
              fatGoal={fatGoal}
              fatLossGoal={fatLossGoal}
            />
          </View>
        </View>
      </Modal>

      {/* Wearable Sync Modal */}
      <Modal
        visible={showWearableSyncModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowWearableSyncModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)' }]}
              onPress={() => setShowWearableSyncModal(false)}
              accessibilityLabel="Close wearable sync modal"
              accessibilityRole="button"
              accessibilityHint="Dismisses the wearable device sync settings and returns to home screen"
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <WearableSyncCard onSync={fetchAppleHealthCalories} />
          </View>
        </View>
      </Modal>

      {/* Educational Info Modals */}

      {/* Daily Balance Info Modal */}
      <Modal
        visible={showDailyBalanceInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDailyBalanceInfoModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
              <GlassCard style={{ padding: 24, width: '100%' }}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)' }]}
                onPress={() => setShowDailyBalanceInfoModal(false)}
                accessibilityLabel="Close daily balance information"
                accessibilityRole="button"
                accessibilityHint="Dismisses the daily calorie balance educational content and returns to home screen"
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.infoModalTitle, { color: colors.text }]}>Daily Calorie Balance</Text>
              <Text style={[styles.infoModalSubtitle, { color: colors.textMuted }]}>The Foundation of Weight Management</Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Why Track It?</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Calorie balance is the fundamental principle behind weight loss and gain. Research shows that people who track their calories lose twice as much weight as those who don't. Your daily balance shows the relationship between calories consumed (food) and calories burned (activity + metabolism).
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>The Science</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Weight management follows the law of thermodynamics: to lose fat, you must consume fewer calories than you burn (calorie deficit). A deficit of 3,500 calories equals approximately 1 pound of fat loss. Tracking helps increase nutritional awareness and reveals how different foods affect your energy balance.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Best Practices</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Aim for a 300-500 calorie deficit for sustainable fat loss{'\n'}
                • Track consistently - even small items add up{'\n'}
                • Focus on nutrient-dense whole foods{'\n'}
                • Be patient - healthy weight loss is 1-2 lbs per week{'\n'}
                • Adjust your goal as your weight changes
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Daily Goals</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Deficit (weight loss): 300-500 kcal below maintenance{'\n'}
                • Maintenance: Calories in = Calories out{'\n'}
                • Surplus (muscle gain): 200-300 kcal above maintenance
              </Text>
            </GlassCard>
          </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Protein Info Modal */}
      <Modal
        visible={showProteinInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowProteinInfoModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
              <GlassCard style={{ padding: 24, width: '100%' }}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)' }]}
                onPress={() => setShowProteinInfoModal(false)}
                accessibilityLabel="Close protein information"
                accessibilityRole="button"
                accessibilityHint="Dismisses the protein educational content and returns to home screen"
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.infoModalTitle, { color: colors.text }]}>Protein</Text>
              <Text style={[styles.infoModalSubtitle, { color: colors.textMuted }]}>The Muscle Preservation Macronutrient</Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Why Track It?</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Protein is essential for preserving lean muscle mass during weight loss. Research shows that enhanced protein intake significantly prevents muscle mass decline in adults with overweight or obesity who are aiming for fat loss. Higher protein also increases satiety and has a greater thermic effect than carbs or fats.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>The Science</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Studies demonstrate that protein intake of 1.2-1.6 g/kg/day preserves lean mass and improves body composition during weight loss. Protein intake below 1.0 g/kg/day is associated with higher risk of muscle loss. For athletes in a calorie deficit, 1.8-2.7 g/kg/day is optimal for preserving muscle while losing fat.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Best Practices</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Distribute protein evenly across meals (20-40g per meal){'\n'}
                • Prioritize complete protein sources (meat, fish, eggs, dairy){'\n'}
                • Consume protein within 2 hours of resistance training{'\n'}
                • Combine with strength training for best results{'\n'}
                • Don't skip protein even on rest days
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Recommended Intake</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Sedentary: 0.8-1.0 g/kg body weight{'\n'}
                • Active/Weight Loss: 1.2-1.6 g/kg body weight{'\n'}
                • Athletes/Heavy Training: 1.8-2.7 g/kg body weight{'\n'}
                • Example: 150 lb person = 82-109g daily (weight loss)
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Top Sources</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Chicken breast, lean beef, fish, eggs, Greek yogurt, cottage cheese, tofu, legumes, protein powder
              </Text>
            </GlassCard>
          </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Fat Info Modal */}
      <Modal
        visible={showFatInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFatInfoModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
              <GlassCard style={{ padding: 24, width: '100%' }}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)' }]}
                onPress={() => setShowFatInfoModal(false)}
                accessibilityLabel="Close fat information"
                accessibilityRole="button"
                accessibilityHint="Dismisses the dietary fat educational content and returns to home screen"
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.infoModalTitle, { color: colors.text }]}>Dietary Fat</Text>
              <Text style={[styles.infoModalSubtitle, { color: colors.textMuted }]}>Essential for Hormones & Health</Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Why Track It?</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Dietary fats are essential macronutrients required for hormone production, nutrient absorption, and brain health. Fat intake is particularly important for reproductive hormones like testosterone and estrogen. Essential fatty acids cannot be produced by your body and must come from food.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>The Science</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Research shows that total fat intake, particularly polyunsaturated fatty acids (PUFAs), is associated with increases in testosterone in healthy women. Essential fatty acids (omega-3 and omega-6) are necessary for inflammation regulation, brain health, heart health, and immune function. Fat also enables absorption of vitamins A, D, E, and K.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Best Practices</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Never go below minimum threshold (0.25g per lb body weight){'\n'}
                • Focus on unsaturated fats (olive oil, nuts, avocado, fish){'\n'}
                • Include omega-3 sources (fatty fish, walnuts, flaxseed){'\n'}
                • Limit saturated fats to less than 10% of total calories{'\n'}
                • Avoid trans fats completely
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Recommended Intake</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Minimum: 0.25-0.3 g/lb body weight{'\n'}
                • Optimal: 0.4-0.5 g/lb body weight{'\n'}
                • Example: 150 lb person = 38-75g daily{'\n'}
                • Omega-6 to Omega-3 ratio: aim for 1:1 to 4:1
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Top Sources</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Salmon, mackerel, olive oil, avocados, nuts (almonds, walnuts), seeds (chia, flax), eggs, nut butters
              </Text>
            </GlassCard>
          </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Carbs Info Modal */}
      <Modal
        visible={showCarbsInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCarbsInfoModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
              <GlassCard style={{ padding: 24, width: '100%' }}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)' }]}
                onPress={() => setShowCarbsInfoModal(false)}
                accessibilityLabel="Close carbs info modal"
                accessibilityRole="button"
                accessibilityHint="Dismisses the carbohydrates information and returns to home screen"
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.infoModalTitle, { color: colors.text }]}>Carbohydrates</Text>
              <Text style={[styles.infoModalSubtitle, { color: colors.textMuted }]}>Your Body's Primary Energy Source</Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Why Track It?</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Carbohydrates are your body's most efficient energy source and the only macronutrient that can be broken down rapidly enough to fuel high-intensity exercise. Fiber, a type of carbohydrate, is crucial for gut health, satiety, and disease prevention. In 2026, "fibermaxxing" has become a major nutrition trend.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>The Science</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Research shows that consumption of foods meeting a 10:1 carbohydrate-to-fiber ratio is associated with decreased blood triglycerides, lower fasting insulin, and better insulin sensitivity. Diets high in fiber reduce the risk of coronary heart disease, diabetes, obesity, and other chronic diseases. Fiber also supports beneficial gut bacteria.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Best Practices</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Prioritize complex carbs over simple sugars{'\n'}
                • Aim for 25-38g of fiber daily{'\n'}
                • Focus on whole grains, fruits, vegetables, legumes{'\n'}
                • Time carbs around workouts for performance{'\n'}
                • Choose carbs with 10:1 or better carb-to-fiber ratio
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Recommended Intake</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Weight Loss: 100-150g daily (low-moderate){'\n'}
                • Maintenance: 150-250g daily{'\n'}
                • Active/Athletes: 250-400g+ daily{'\n'}
                • Fiber Goal: 25g (women) / 38g (men) daily{'\n'}
                • Calculate: Protein + Fat calories first, fill rest with carbs
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Top Sources</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Oats, quinoa, sweet potatoes, brown rice, whole grain bread, fruits, vegetables, legumes (beans, lentils)
              </Text>
            </GlassCard>
          </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Steps Info Modal */}
      <Modal
        visible={showStepsInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowStepsInfoModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
              <GlassCard style={{ padding: 24, width: '100%' }}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)' }]}
                onPress={() => setShowStepsInfoModal(false)}
                accessibilityLabel="Close steps info modal"
                accessibilityRole="button"
                accessibilityHint="Dismisses the daily steps information and returns to home screen"
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.infoModalTitle, { color: colors.text }]}>Daily Steps</Text>
              <Text style={[styles.infoModalSubtitle, { color: colors.textMuted }]}>Your Non-Exercise Activity Foundation</Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Why Track It?</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Daily step tracking is one of the most powerful health interventions. A landmark 2025 review of 57 studies involving over 160,000 people found that people who walked 7,000 steps per day had a 25% lower risk of cardiovascular disease and a 47% lower risk of death from all causes compared to those walking only 2,000 steps.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>The Science</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Recent research shows that 9,000-10,000 steps daily can counteract high sedentary time, lowering mortality risk by 39% and cardiovascular disease risk by 21%. Adding just 1,000 extra steps per day (about 10 minutes of walking) significantly lowers risk of heart attack, stroke, and heart failure. Steps also contribute meaningfully to total daily calorie burn.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Best Practices</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Start where you are and gradually increase{'\n'}
                • Break up sitting time with short walks{'\n'}
                • Take stairs instead of elevators{'\n'}
                • Park farther away from entrances{'\n'}
                • Walk during phone calls{'\n'}
                • Use a step tracker or smartphone for accountability
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Step Goals</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Minimum Health Benefit: 7,000 steps/day{'\n'}
                • Optimal Health: 9,000-10,000 steps/day{'\n'}
                • Active Lifestyle: 10,000-15,000 steps/day{'\n'}
                • Each 1,000 step increase = measurable health benefits
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Calorie Impact</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Approximately 100 calories burned per mile (~2,000 steps). 10,000 steps = ~400-500 calories burned, supporting weight loss goals.
              </Text>
            </GlassCard>
          </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Active Energy Info Modal */}
      <Modal
        visible={showActiveEnergyInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowActiveEnergyInfoModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
              <GlassCard style={{ padding: 24, width: '100%' }}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)' }]}
                onPress={() => setShowActiveEnergyInfoModal(false)}
                accessibilityLabel="Close active energy info modal"
                accessibilityRole="button"
                accessibilityHint="Dismisses the active energy information and returns to home screen"
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.infoModalTitle, { color: colors.text }]}>Active Energy</Text>
              <Text style={[styles.infoModalSubtitle, { color: colors.textMuted }]}>Calories Burned Through Movement</Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Why Track It?</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Active Energy (also called Exercise Activity Thermogenesis or EAT) represents calories burned through intentional physical activity - from formal workouts to daily movement. This is your most controllable component of daily calorie expenditure and directly impacts your ability to create a calorie deficit for fat loss.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>The Science</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Active Energy typically contributes 5-15% of your Total Daily Energy Expenditure (TDEE), depending on activity level. For most people, exercise accounts for about 5% of TDEE, but this can increase significantly with dedicated training. Combined with Non-Exercise Activity Thermogenesis (NEAT), movement-related calories can account for 15-30% of total daily burn.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Best Practices</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Combine cardio and strength training for optimal results{'\n'}
                • Don't "eat back" all exercise calories if losing weight{'\n'}
                • Increase NEAT (steps, fidgeting, standing) for bonus burn{'\n'}
                • Focus on consistency over intensity{'\n'}
                • Track trends over time, not daily fluctuations
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Activity Level Guide</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Sedentary: 200-400 kcal/day{'\n'}
                • Lightly Active: 400-600 kcal/day{'\n'}
                • Moderately Active: 600-800 kcal/day{'\n'}
                • Very Active: 800-1200+ kcal/day
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Weight Loss Strategy</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Increasing active energy by 200-300 kcal/day through exercise, combined with a 200-300 kcal dietary deficit, creates an optimal 400-600 kcal total deficit for sustainable fat loss.
              </Text>
            </GlassCard>
          </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Resting Energy Info Modal */}
      <Modal
        visible={showRestingEnergyInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRestingEnergyInfoModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
              <GlassCard style={{ padding: 24, width: '100%' }}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)' }]}
                onPress={() => setShowRestingEnergyInfoModal(false)}
                accessibilityLabel="Close resting energy info modal"
                accessibilityRole="button"
                accessibilityHint="Dismisses the resting energy information and returns to home screen"
              >
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.infoModalTitle, { color: colors.text }]}>Resting Energy</Text>
              <Text style={[styles.infoModalSubtitle, { color: colors.textMuted }]}>Your Metabolic Baseline</Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Why Track It?</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Resting Energy Expenditure (REE), also known as Basal Metabolic Rate (BMR), is the calories your body burns at complete rest to maintain vital functions like breathing, circulation, cell production, and nutrient processing. This is your body's largest source of energy expenditure, accounting for 60-70% of total daily calories burned.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>The Science</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                BMR is determined by factors including body weight, body composition, age, and sex. Individuals with higher muscle mass have faster metabolisms because muscle tissue is more metabolically active than fat tissue. Understanding your BMR helps establish realistic calorie targets and explains why extreme calorie restriction can backfire by lowering metabolic rate.
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Best Practices</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Preserve muscle mass through strength training{'\n'}
                • Consume adequate protein (1.2-1.6g/kg body weight){'\n'}
                • Avoid extreme calorie deficits (below 800-1000 kcal/day){'\n'}
                • Get adequate sleep (7-9 hours) to maintain metabolism{'\n'}
                • Stay hydrated - dehydration can slow BMR
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Typical BMR Ranges</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                • Women: 1,200-1,500 kcal/day{'\n'}
                • Men: 1,500-1,800 kcal/day{'\n'}
                • Athletes/Muscular: +200-400 kcal above average{'\n'}
                • Note: BMR decreases with age (~2-3% per decade after 30)
              </Text>

              <Text style={[styles.infoModalSection, { color: colors.primary }]}>Protecting Your Metabolism</Text>
              <Text style={[styles.infoModalText, { color: colors.text }]}>
                Never eat below your BMR for extended periods. Use BMR as the foundation for calculating Total Daily Energy Expenditure (TDEE), then create modest deficits from TDEE, not BMR, to lose fat while preserving metabolic health.
              </Text>
            </GlassCard>
          </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Bottom Sheet Modals */}
      <DashboardBottomSheet ref={workoutSheetRef} title="Today's Workout" snapPoints={['50%', '85%']}>
        <WorkoutDetailContent />
      </DashboardBottomSheet>

      <DashboardBottomSheet ref={weeklyStatsSheetRef} title="Weekly Stats" snapPoints={['60%', '90%']}>
        <WeeklyStatsContent />
      </DashboardBottomSheet>

      <DashboardBottomSheet ref={wearablesSyncSheetRef} title="Wearables Sync" snapPoints={['55%', '80%']}>
        <WearablesSyncContent />
      </DashboardBottomSheet>
    </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
    alignItems: 'stretch',
  },
  halfCard: {
    flex: 1,
    minHeight: 120,
  },
  greetingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  profileImageWrapper: {
    marginBottom: 12,
  },
  macroCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
    paddingVertical: 12,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 170,
    overflow: 'hidden',
  },
  macroGaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  macroGaugeOverTarget: {
    // Subtle border glow effect for over-target state
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingVertical: 4,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  greetingName: {
    fontSize: 28,
    color: Colors.text,
    marginBottom: 8,
    fontFamily: Fonts.numericSemiBold,
    textAlign: 'center',
    letterSpacing: 0,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  signInText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
  },
  statusBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Spacing.borderRadius,
  },
  statusConnected: {
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: Fonts.regular,
  },
  dailyQuote: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  calendarSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  weekTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,  // 8pt
    paddingHorizontal: Spacing.xs,  // 4pt
    borderRadius: Spacing.radiusSM,  // 8pt
    backgroundColor: 'transparent', // Liquid glass - let GlassCard handle background
    minWidth: Spacing.touchTarget,  // 44pt minimum
    minHeight: Spacing.touchTarget,  // 44pt minimum (iOS HIG)
    justifyContent: 'center',
  },
  dayItemActive: {
    backgroundColor: Colors.text,
  },
  dayName: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
    fontFamily: Fonts.regular,
  },
  dayNameActive: {
    color: Colors.background,
  },
  dayNumber: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.regular,
  },
  dayNumberActive: {
    color: Colors.background,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  card: {
    backgroundColor: 'transparent', // Liquid glass - let GlassCard handle background
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: Spacing.borderRadius,
    padding: Spacing.cardPadding,  // Updated to 8pt grid (16)
  },
  dailyBalanceCard: {
    marginTop: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  cardContent: {
    marginTop: 20,
  },
  cardSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  chevron: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
    fontFamily: Fonts.regular,
  },
  dailyBalanceTitle: {
    fontSize: 22,
    color: Colors.text,
    letterSpacing: 8,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    marginLeft: 20,
    fontFamily: Fonts.numericSemiBold,
  },
  calorieCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  calorieSubCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    minHeight: 120,
  },
  calorieSubCardTitle: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0,
    marginBottom: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  calorieSubCardValue: {
    fontSize: 24,
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0,
  },
  calorieSubCardUnit: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0,
  },
  semiGaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  calorieItem: {
    alignItems: 'center',
    flex: 1,
  },
  calorieIcon: {
    fontSize: 24,
    marginBottom: 8,
    fontFamily: Fonts.regular,
  },
  calorieLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
    fontFamily: Fonts.regular,
  },
  calorieValue: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.regular,
  },
  calorieDivider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.border,
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Spacing.borderRadius,
    alignSelf: 'center',
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  syncButtonText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  syncStatus: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  macroLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    letterSpacing: 0.5,
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  macroGaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 12,
  },
  macroTarget: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    marginTop: 20,
    width: '100%',
  },
  // Health Metrics with Horizontal Bar
  healthMetricContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  healthMetricLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginBottom: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    width: '100%',
  },
  healthMetricValue: {
    fontSize: 20,
    color: Colors.text,
    textAlign: 'center',
  },
  healthMetricUnit: {
    fontSize: 12,
    color: Colors.text,
  },
  horizontalBarContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  horizontalBarWrapper: {
    width: '100%',
    height: 8,
    position: 'relative',
  },
  horizontalBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: Colors.gaugeBg,
    borderRadius: 4,
  },
  horizontalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  horizontalBarFillAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 8,
    borderRadius: 4,
  },
  healthMetricGoal: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  logMealButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: Spacing.sm,  // 8pt
    borderRadius: Spacing.radiusMD,  // 12pt
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,  // 16pt
    minHeight: Spacing.touchTarget,  // 44pt minimum (iOS HIG)
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  logMealButtonText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
    fontFamily: Fonts.regular,
  },
  mealTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  mealCalories: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  mealSection: {
    marginBottom: 8,
  },
  loggedMealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginLeft: 16,
    marginTop: 8,
  },
  loggedMealContent: {
    flex: 1,
  },
  loggedMealName: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.regular,
    marginBottom: 4,
  },
  loggedMealMacros: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  deleteMealButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'transparent', // Liquid glass - let GlassCard handle background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
    fontFamily: Fonts.regular,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.sm,  // 8pt
    borderRadius: Spacing.radiusMD,  // 12pt
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Spacing.touchTarget,  // 44pt minimum (iOS HIG)
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  saveButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: Spacing.sm,  // 8pt
    borderRadius: Spacing.radiusMD,  // 12pt
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Spacing.touchTarget,  // 44pt minimum (iOS HIG)
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  // Quick Action Card Styles
  quickActionTitle: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    letterSpacing: 0.3,
    marginBottom: 12,
    textAlign: 'center',
  },
  quickActionValue: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  quickActionSubtitle: {
    fontSize: 8,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    fontWeight: '300',
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Info Modal Styles
  infoModalTitle: {
    fontSize: 28,
    fontFamily: Fonts.light,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  infoModalSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  infoModalSection: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  infoModalText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
});
