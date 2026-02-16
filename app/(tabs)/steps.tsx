import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { NumberText } from '../../components/NumberText';
import { CircularGauge } from '../../components/CircularGauge';
import { GlassCard } from '../../components/GlassCard';
import { useSettings } from '../../contexts/SettingsContext';

const { width } = Dimensions.get('window');



export default function StepsScreen() {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';
  const [greeting, setGreeting] = useState('Good Morning');
  const [weekDays, setWeekDays] = useState<{day: string, date: number, dateStr: string, isToday: boolean}[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState('Not connected');

  // Steps data from API
  const [currentSteps, setCurrentSteps] = useState(0);
  const [stepsGoal, setStepsGoal] = useState(7000);
  const [weeklySteps, setWeeklySteps] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  const weeklyGoal = stepsGoal * 7;
  const distance = (currentSteps * 0.0005).toFixed(2); // Approximate miles
  const dailyAvg = Math.round(weeklySteps / 7);
  const stepsPercent = Math.round((currentSteps / stepsGoal) * 100);
  const weeklyPercent = Math.round((weeklySteps / weeklyGoal) * 100);

  // Fetch data from API
  const fetchData = async () => {
    try {
      // Get today's metrics
      const metrics = await api.getMetricsByDate(selectedDate);
      if (metrics) {
        setCurrentSteps(metrics.steps || 0);
        setCaloriesBurned(metrics.caloriesOut || 0);
      } else {
        setCurrentSteps(0);
        setCaloriesBurned(0);
      }

      // Get weekly history
      const history = await api.getHistory(7);
      if (history && history.length > 0) {
        const totalSteps = history.reduce((sum, day) => sum + (day.steps || 0), 0);
        setWeeklySteps(totalSteps);
      }

      // Get goals
      const goals = await api.getGoals();
      if (goals && goals.dailySteps) {
        setStepsGoal(goals.dailySteps);
      }

      // Get connected devices
      const devices = await api.getConnectedDevices();
      if (devices && devices.length > 0) {
        setDataSource(devices[0]);
      }
    } catch (error) {
      // console.error('Error fetching steps data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [selectedDate]);

  const handleSync = async () => {
    setLastSynced('Syncing...');
    try {
      const success = await api.syncFitnessData('apple_health', {
        date: selectedDate,
        steps: currentSteps,
      });
      if (success) {
        setLastSynced(new Date().toLocaleTimeString());
        setDataSource('Apple Health');
        await fetchData();
      } else {
        setLastSynced('Sync failed');
      }
    } catch (error) {
      setLastSynced('Sync failed');
    }
  };

  useEffect(() => {
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

    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={[styles.avatarIcon, { color: colors.text }]}>●</Text>
          </View>
          <View>
            <Text style={[styles.greetingTime, { color: colors.textMuted }]}>{greeting}</Text>
            <Text style={[styles.greetingName, { color: colors.text }]}>there</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          accessibilityLabel="Settings"
          accessibilityRole="button"
          accessibilityHint="Opens settings to configure step goal and preferences"
        >
          <Text style={[styles.settingsIcon, { color: colors.text }]}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Strip */}
      <View style={styles.calendarSection}>
        <Text style={[styles.weekTitle, { color: colors.textSecondary }]}>This Week</Text>
        <View style={styles.calendarStrip}>
          {weekDays.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dayItem, selectedDate === item.dateStr && { backgroundColor: colors.text }]}
              onPress={() => setSelectedDate(item.dateStr)}
              accessibilityLabel={`${item.day}, ${item.date}${item.isToday ? ', today' : ''}${selectedDate === item.dateStr ? ', selected' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedDate === item.dateStr }}
              accessibilityHint={`Shows step data for ${item.day}, ${item.date}`}
            >
              <Text style={[styles.dayName, { color: colors.textMuted }, selectedDate === item.dateStr && { color: colors.background }]}>{item.day}</Text>
              <NumberText weight="semiBold" style={[styles.dayNumber, { color: colors.text }, selectedDate === item.dateStr && { color: colors.background }]}>{item.date}</NumberText>
              {item.isToday && <View style={[styles.todayDot, { backgroundColor: colors.success }]} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Steps Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>👟</Text>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Steps</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>Track the number of steps you take each day.</Text>
        </View>
      </View>

      {/* Steps Gauge Card */}
      <GlassCard style={styles.gaugeCard} interactive>
        {/* Circular Gauge */}
        <View style={styles.gaugeContainer}>
          <CircularGauge
            value={currentSteps}
            maxValue={stepsGoal}
            size={220}
            strokeWidth={14}
            label="STEPS TODAY"
          />
        </View>

        <Text style={[styles.motivational, { color: colors.textMuted }]}>See how far your feet have carried you today</Text>

        {/* Sync Button */}
        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: colors.text }]}
          onPress={handleSync}
          accessibilityLabel="Sync steps data"
          accessibilityRole="button"
          accessibilityHint="Syncs your latest step count from Apple Health or connected wearable device"
        >
          <Text style={[styles.appleIcon, { color: colors.background }]}>◐</Text>
          <Text style={[styles.syncText, { color: colors.background }]}>Sync Now</Text>
        </TouchableOpacity>
        <Text style={[styles.syncStatus, { color: colors.textMuted }]}>{lastSynced || 'Not synced yet'}</Text>
      </GlassCard>

      {/* Distance Stat */}
      <View style={styles.statRow}>
        <GlassCard style={styles.statItem} interactive>
          <NumberText weight="regular" style={[styles.statValue, { color: colors.text }]}>{distance}</NumberText>
          <Text style={[styles.statUnit, { color: colors.textSecondary }]}>MI</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Distance</Text>
        </GlassCard>
      </View>

      {/* Weekly Progress Card */}
      <GlassCard style={styles.weeklyCard} interactive>
        <View style={styles.weeklyHeader}>
          <Text style={[styles.weeklyTitle, { color: colors.text }]}>Weekly Progress</Text>
          <NumberText weight="semiBold" style={[styles.weeklyPercent, { color: colors.text }]}>{weeklyPercent}%</NumberText>
        </View>

        <View style={styles.weeklyRow}>
          <View>
            <Text style={[styles.weeklySubLabel, { color: colors.textMuted }]}>Total Steps</Text>
            <NumberText weight="semiBold" style={[styles.weeklyValue, { color: colors.text }]}>{weeklySteps.toLocaleString()}</NumberText>
          </View>
          <NumberText weight="regular" style={[styles.weeklyGoal, { color: colors.textMuted }]}>of {weeklyGoal.toLocaleString()}</NumberText>
        </View>

        <View style={[styles.progressBar, { backgroundColor: colors.gaugeBg }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.gaugeFill, width: `${Math.min(weeklyPercent, 100)}%` }]} />
        </View>

        <View style={styles.weeklyStatsRow}>
          <View style={styles.weeklyStat}>
            <Text style={[styles.weeklySubLabel, { color: colors.textMuted }]}>Active Calories</Text>
            <NumberText weight="medium" style={[styles.weeklySubValue, { color: colors.text }]}>{caloriesBurned} kcal</NumberText>
          </View>
          <View style={styles.weeklyStat}>
            <Text style={[styles.weeklySubLabel, { color: colors.textMuted }]}>Avg Daily</Text>
            <NumberText weight="medium" style={[styles.weeklySubValue, { color: colors.text }]}>{dailyAvg.toLocaleString()} steps</NumberText>
          </View>
        </View>
      </GlassCard>

      {/* Data Source */}
      <View style={styles.dataSource}>
        <Text style={[styles.dataSourceLabel, { color: colors.textMuted }]}>Data from:</Text>
        <Text style={[styles.dataSourceValue, { color: colors.textSecondary }]}>{dataSource}</Text>
      </View>

      <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 20,
    fontFamily: Fonts.regular,
  },
  greetingTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  greetingName: {
    fontSize: 24,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  settingsBtn: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 20,
    fontFamily: Fonts.regular,
  },
  calendarSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Spacing.borderRadius,
    backgroundColor: 'transparent',
    minWidth: (width - 48) / 7,
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
  },
  dayNumberActive: {
    color: Colors.background,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.success,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
    fontFamily: Fonts.regular,
  },
  sectionTitle: {
    fontSize: 32,
    color: Colors.text,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 0.5,
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  gaugeCard: {
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: Spacing.borderRadius,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  motivational: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    fontFamily: Fonts.regular,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.text,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 8,
  },
  appleIcon: {
    fontSize: 16,
    marginRight: 8,
    fontFamily: Fonts.regular,
  },
  syncText: {
    color: Colors.background,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  syncStatus: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statItem: {
    backgroundColor: 'transparent',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 32,
    color: Colors.text,
  },
  statUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    fontFamily: Fonts.semiBold,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    fontFamily: Fonts.regular,
  },
  weeklyCard: {
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: Spacing.borderRadius,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weeklyTitle: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  weeklyPercent: {
    fontSize: 16,
    color: Colors.text,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  weeklySubLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  weeklyValue: {
    fontSize: 24,
    color: Colors.text,
  },
  weeklyGoal: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gaugeBg,
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gaugeFill,
    borderRadius: 4,
  },
  weeklyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyStat: {},
  weeklySubValue: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 2,
  },
  dataSource: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dataSourceLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 8,
    fontFamily: Fonts.regular,
  },
  dataSourceValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
});
