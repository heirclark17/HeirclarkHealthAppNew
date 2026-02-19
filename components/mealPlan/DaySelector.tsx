import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { useFoodPreferencesSafe } from '../../contexts/FoodPreferencesContext';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import { DayPlan } from '../../types/mealPlan';
import { generateMealTheme } from '../../services/openaiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DaySelectorProps {
  weeklyPlan: DayPlan[];
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
}

export function DaySelector({ weeklyPlan, selectedDayIndex, onSelectDay }: DaySelectorProps) {
  const { settings } = useSettings();
  const foodPrefsContext = useFoodPreferencesSafe();
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [mealThemes, setMealThemes] = useState<Record<number, string>>({});

  // Get cheat days from preferences
  const cheatDays = foodPrefsContext?.preferences?.cheatDays || [];

  // Generate AI meal themes for each day
  useEffect(() => {
    const generateThemes = async () => {
      const themes: Record<number, string> = {};

      for (const day of weeklyPlan) {
        if (day.meals && day.meals.length > 0) {
          try {
            const theme = await generateMealTheme({
              meals: day.meals.map(m => ({
                name: m.name,
                mealType: m.mealType,
                calories: m.calories,
                protein: m.protein,
              })),
              totalCalories: day.dailyTotals.calories,
              totalProtein: day.dailyTotals.protein,
            });

            if (theme) {
              themes[day.dayNumber] = theme;
            }
          } catch (error) {
            console.error('[DaySelector] Error generating theme for day', day.dayNumber, error);
          }
        }
      }

      setMealThemes(themes);
    };

    if (weeklyPlan.length > 0) {
      generateThemes();
    }
  }, [weeklyPlan]);

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware styling (matching CalendarCard exactly)
  const dayItemBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const cheatDayBg = isDark ? 'rgba(251, 146, 60, 0.08)' : 'rgba(251, 146, 60, 0.06)';
  const cheatDayColor = isDark ? 'rgba(251, 146, 60, 0.9)' : 'rgba(251, 146, 60, 0.85)';
  const cheatDayBorder = isDark ? 'rgba(251, 146, 60, 0.25)' : 'rgba(251, 146, 60, 0.20)';
  const dayNameColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const modalOverlayBg = isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)';

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    if (showFullCalendar) {
      generateMonthDays(currentMonth);
    }
  }, [currentMonth, showFullCalendar]);

  // Helper: Format date in user's LOCAL timezone (not UTC)
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateMonthDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const today = new Date();
    const todayStr = formatLocalDate(today); // Use local timezone for today

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }

    // Add all days in month
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const dateStr = formatLocalDate(date); // Use local timezone, not UTC

      // Check if this date is in the weekly plan
      const planDayIndex = weeklyPlan.findIndex(d => d.date === dateStr);
      const isInPlan = planDayIndex !== -1;
      const isSelected = planDayIndex === selectedDayIndex;
      const isToday = dateStr === todayStr; // Compare local dates
      const dayOfWeek = fullDayNames[date.getDay()];
      const isCheat = cheatDays.includes(dayOfWeek);

      days.push({
        day,
        dateStr,
        isToday,
        isSelected,
        isInPlan,
        planDayIndex,
        isCheat,
      });
    }

    setCalendarDays(days);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleCalendarDayPress = (item: any) => {
    if (item.isInPlan && item.planDayIndex !== undefined) {
      onSelectDay(item.planDayIndex);
      setShowFullCalendar(false);
    }
  };

  // Get short day name (Mon, Tue, etc.)
  const getShortDayName = (dayName: string | undefined, date?: string) => {
    if (dayName) {
      return dayName.slice(0, 3);
    }
    // Fallback: derive day name from date
    if (date) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return dayNames[new Date(date).getDay()];
    }
    return 'Day';
  };

  // Get day number from date
  const getDayNumber = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate();
  };

  // Check if a day is a cheat day
  const isCheatDay = (dayName: string | undefined, date?: string): boolean => {
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let fullDayName = '';

    if (dayName) {
      // Convert short name to full name if needed
      const shortToFull: { [key: string]: string } = {
        'Sun': 'Sunday', 'Mon': 'Monday', 'Tue': 'Tuesday',
        'Wed': 'Wednesday', 'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday'
      };
      fullDayName = shortToFull[dayName.slice(0, 3)] || dayName;
    } else if (date) {
      fullDayName = fullDayNames[new Date(date).getDay()];
    }

    return cheatDays.includes(fullDayName);
  };

  // Get meal summary for a day
  const getMealSummary = (day: DayPlan, isCheat: boolean): string => {
    // Show special commentary for cheat days
    if (isCheat) return 'Enjoy!';

    if (!day.meals || day.meals.length === 0) return '';

    const mealCount = day.meals.length;
    const calories = Math.round(day.dailyTotals?.calories || 0);
    const theme = mealThemes[day.dayNumber];

    // If we have an AI theme, show that with calories
    if (theme) {
      return `${theme} • ${calories} cal`;
    }

    // Otherwise, show meal count with calories
    return `${mealCount} meal${mealCount > 1 ? 's' : ''} • ${calories} cal`;
  };

  if (!weeklyPlan || weeklyPlan.length === 0) {
    return null;
  }

  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to the end (latest day) after mount
  useEffect(() => {
    if (weeklyPlan.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        const dayWidth = 110; // 96px width + 14px gap
        const maxScroll = weeklyPlan.length * dayWidth;
        scrollViewRef.current?.scrollTo({ x: maxScroll, y: 0, animated: false });
      }, 100);
    }
  }, [weeklyPlan.length]);

  return (
    <>
      {/* Week Strip - Glass Morphism matching CalendarCard exactly */}
      <GlassCard style={styles.container} interactive>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekStrip}
          scrollEnabled={true}
          pagingEnabled={false}
          decelerationRate="fast"
          accessibilityRole="tablist"
        >
          {weeklyPlan.map((day, index) => {
            const isSelected = index === selectedDayIndex;
            const shortDayName = getShortDayName(day.dayName, day.date);
            const isCheat = isCheatDay(day.dayName, day.date);
            const accessibilityLabel = `${shortDayName} ${getDayNumber(day.date)}${isSelected ? ', Selected' : ''}${isCheat ? ', Cheat Day' : ''}`;

            return (
              <View key={day.dayNumber} style={styles.dayCardContainer}>
                <TouchableOpacity
                  style={[
                    styles.dayItem,
                    isSelected && styles.dayItemActive,
                  ]}
                  onPress={() => onSelectDay(index)}
                  accessible={true}
                  accessibilityLabel={accessibilityLabel}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  activeOpacity={0.85}
                >
                  {/* Frosted glass background with dynamic intensity */}
                  <BlurView
                    intensity={isSelected ? 100 : 60}
                    tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
                    style={styles.glassBackground}
                  >
                    {/* Colored overlay for selection and cheat day states */}
                    <View
                      style={[
                        styles.colorOverlay,
                        {
                          backgroundColor: isSelected
                            ? (isCheat
                                ? (isDark ? 'rgba(251, 146, 60, 0.35)' : 'rgba(251, 146, 60, 0.30)')
                                : (isDark ? 'rgba(94, 169, 221, 0.35)' : 'rgba(94, 169, 221, 0.28)'))
                            : (isCheat
                                ? (isDark ? 'rgba(251, 146, 60, 0.08)' : 'rgba(251, 146, 60, 0.06)')
                                : 'transparent')
                        }
                      ]}
                    />

                    {/* Premium cheat day badge */}
                    {isCheat && (
                      <View style={styles.cheatBadgeContainer}>
                        <BlurView
                          intensity={40}
                          tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
                          style={styles.cheatBadgeGlass}
                        >
                          <View style={[
                            styles.cheatBadge,
                            {
                              backgroundColor: isSelected
                                ? (isDark ? 'rgba(251, 146, 60, 0.25)' : 'rgba(251, 146, 60, 0.20)')
                                : (isDark ? 'rgba(251, 146, 60, 0.15)' : 'rgba(251, 146, 60, 0.12)')
                            }
                          ]}>
                            <Ionicons
                              name="pizza"
                              size={11}
                              color={isSelected ? (isDark ? '#fff' : '#fff') : cheatDayColor}
                              style={{ marginRight: 4 }}
                            />
                            <Text style={[
                              styles.cheatBadgeText,
                              { color: isSelected ? '#fff' : cheatDayColor }
                            ]}>
                              CHEAT
                            </Text>
                          </View>
                        </BlurView>
                      </View>
                    )}

                    {/* Day content with refined typography */}
                    <View style={styles.dayContent}>
                      <Text style={[
                        styles.dayName,
                        {
                          color: isSelected
                            ? (isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.90)')
                            : (isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.40)')
                        },
                      ]}>
                        {shortDayName.toUpperCase()}
                      </Text>
                      <NumberText
                        weight="semiBold"
                        style={[
                          styles.dayNumber,
                          {
                            color: isSelected
                              ? (isDark ? '#fff' : '#fff')
                              : (isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.90)')
                          },
                        ]}
                      >
                        {getDayNumber(day.date)}
                      </NumberText>
                      {/* Meal summary with elegant line breaks */}
                      {getMealSummary(day, isCheat) && (
                        <View style={styles.mealSummaryContainer}>
                          {getMealSummary(day, isCheat).split(' • ').map((part, idx) => (
                            <Text
                              key={idx}
                              style={[
                                styles.mealSummary,
                                {
                                  color: isSelected
                                    ? (isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.80)')
                                    : (isDark ? 'rgba(255, 255, 255, 0.50)' : 'rgba(0, 0, 0, 0.50)')
                                },
                              ]}
                            >
                              {part}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  </BlurView>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        {/* View Full Calendar Button - matching CalendarCard exactly */}
        <TouchableOpacity
          onPress={() => setShowFullCalendar(true)}
          style={styles.fullCalendarButton}
          accessible={true}
          accessibilityLabel="View full calendar"
          accessibilityHint="Opens the full month calendar view"
          accessibilityRole="button"
        >
          <Text style={[styles.fullCalendarButtonText, { color: colors.primary }]}>VIEW FULL CALENDAR →</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Full Calendar Modal - matching CalendarCard exactly */}
      <Modal
        visible={showFullCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFullCalendar(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => changeMonth('prev')}
                accessible={true}
                accessibilityLabel="Previous month"
                accessibilityRole="button"
              >
                <Text style={[styles.navButton, { color: colors.text }]}>←</Text>
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: colors.text }]} accessibilityRole="header">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                onPress={() => changeMonth('next')}
                accessible={true}
                accessibilityLabel="Next month"
                accessibilityRole="button"
              >
                <Text style={[styles.navButton, { color: colors.text }]}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Day Labels */}
            <View style={styles.dayLabels}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayLabel) => (
                <Text key={dayLabel} style={[styles.dayLabel, { color: colors.textMuted }]}>{dayLabel}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((item, index) => (
                item.empty ? (
                  <View key={index} style={styles.emptyDay} />
                ) : (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      item.isCheat && !item.isSelected && { backgroundColor: cheatDayBg },
                      item.isSelected && { backgroundColor: item.isCheat ? cheatDayColor : colors.text },
                      item.isInPlan && !item.isSelected && !item.isCheat && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                      !item.isInPlan && !item.isCheat && styles.calendarDayDisabled,
                    ]}
                    onPress={() => handleCalendarDayPress(item)}
                    disabled={!item.isInPlan}
                    accessible={true}
                    accessibilityLabel={`${monthNames[currentMonth.getMonth()]} ${item.day}${item.isToday ? ', Today' : ''}${item.isSelected ? ', Selected' : ''}${item.isCheat ? ', Cheat Day' : ''}${item.isInPlan ? ', Has meal plan' : ', No meal plan'}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.isSelected, disabled: !item.isInPlan }}
                  >
                    {item.isCheat && (
                      <Ionicons
                        name="pizza-outline"
                        size={10}
                        color={item.isSelected ? (isDark ? Colors.background : Colors.text) : cheatDayColor}
                        style={{ position: 'absolute', top: 2, right: 2 }}
                      />
                    )}
                    <NumberText
                      weight="medium"
                      style={[
                        styles.calendarDayText,
                        { color: colors.text },
                        item.isCheat && !item.isSelected && { color: cheatDayColor },
                        item.isSelected && { color: item.isCheat ? (isDark ? Colors.background : Colors.text) : colors.background },
                        !item.isInPlan && !item.isCheat && { color: colors.textMuted },
                      ]}
                    >
                      {item.day}
                    </NumberText>
                  </TouchableOpacity>
                )
              ))}
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowFullCalendar(false)}
              accessible={true}
              accessibilityLabel="Close calendar"
              accessibilityRole="button"
            >
              <Text style={[styles.closeButtonText, { color: colors.primaryText }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 28,
    paddingVertical: 6,
  },
  weekStrip: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dayCardContainer: {
    position: 'relative',
  },
  dayItem: {
    width: 96,
    minHeight: 136,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    // Premium layered shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dayItemActive: {
    transform: [{ scale: 1.06 }],
    // Enhanced glow for selected state
    ...Platform.select({
      ios: {
        shadowColor: '#5EA9DD',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 28,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  glassBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    position: 'relative',
  },
  colorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dayName: {
    fontSize: 10,
    marginBottom: 8,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  dayNumber: {
    fontSize: 32,
    marginBottom: 2,
    // Font family handled by NumberText component (SF Pro Rounded)
  },
  mealSummaryContainer: {
    marginTop: 8,
    alignItems: 'center',
    gap: 2,
  },
  mealSummary: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 13,
    paddingHorizontal: 4,
  },
  cheatBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    zIndex: 3,
  },
  cheatBadgeGlass: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  cheatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cheatBadgeText: {
    fontSize: 8,
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  fullCalendarButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  fullCalendarButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: Fonts.medium,
    letterSpacing: 2,
  },
  // Modal styles - matching CalendarCard exactly
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  navButton: {
    fontSize: 24,
    color: Colors.text,
    fontFamily: Fonts.bold,
    paddingHorizontal: 12,
  },
  monthTitle: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
    width: (SCREEN_WIDTH - 88) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyDay: {
    width: (SCREEN_WIDTH - 88) / 7 - 4,
    height: 44,
    marginHorizontal: 2,
    marginBottom: 6,
  },
  calendarDay: {
    width: (SCREEN_WIDTH - 88) / 7 - 4,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
    marginBottom: 6,
  },
  // Borders removed from calendar day cards
  calendarDayText: {
    fontSize: 14,
    color: Colors.text,
    // Font family handled by NumberText component (SF Pro Rounded)
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
    marginTop: 24,
  },
  closeButtonText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});

export default DaySelector;
