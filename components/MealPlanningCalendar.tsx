import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing } from '../constants/Theme';
import { MealLibraryModal } from './MealLibrary';

interface PlannedMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealTime: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
}

interface DayPlan {
  date: string;
  dayName: string;
  meals: PlannedMeal[];
}

export function MealPlanningCalendarModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  // Get Sunday of the current week
  const getSundayOfWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek); // Go back to Sunday
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  };

  const [currentWeekStart] = useState(getSundayOfWeek());
  const [weekDays, setWeekDays] = useState<DayPlan[]>([]);
  const [showMealLibrary, setShowMealLibrary] = useState(false);
  const [selectedDayMealTime, setSelectedDayMealTime] = useState<{ date: string; mealTime: string } | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const mealTimes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  // Generate week days starting from Sunday
  useEffect(() => {
    generateWeekDays(currentWeekStart);
  }, [currentWeekStart]);

  const generateWeekDays = (startDate: Date) => {
    const days: DayPlan[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      days.push({
        date: dateStr,
        dayName: dayNames[i], // Use index directly since we start from Sunday
        meals: [],
      });
    }

    setWeekDays(days);
  };

  const openMealLibrary = (date: string, mealTime: string) => {
    setSelectedDayMealTime({ date, mealTime });
    setShowMealLibrary(true);
  };

  const addMealToPlan = (meal: any) => {
    if (!selectedDayMealTime) return;

    const updatedWeek = weekDays.map(day => {
      if (day.date === selectedDayMealTime.date) {
        return {
          ...day,
          meals: [
            ...day.meals,
            {
              id: `${Date.now()}`,
              name: meal.name,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
              mealTime: selectedDayMealTime.mealTime as any,
            },
          ],
        };
      }
      return day;
    });

    setWeekDays(updatedWeek);
    setShowMealLibrary(false);
    setSelectedDayMealTime(null);
  };

  const removeMealFromPlan = (date: string, mealId: string) => {
    const updatedWeek = weekDays.map(day => {
      if (day.date === date) {
        return {
          ...day,
          meals: day.meals.filter(meal => meal.id !== mealId),
        };
      }
      return day;
    });

    setWeekDays(updatedWeek);
  };

  const getDayTotals = (day: DayPlan) => {
    return day.meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getMealsForTimeSlot = (day: DayPlan, mealTime: string) => {
    return day.meals.filter(meal => meal.mealTime === mealTime);
  };

  const getWeekDateRange = () => {
    if (weekDays.length === 0) return '';
    const start = new Date(weekDays[0].date);
    const end = new Date(weekDays[6].date);
    const startStr = `${start.getMonth() + 1}/${start.getDate()}`;
    const endStr = `${end.getMonth() + 1}/${end.getDate()}`;
    return `${startStr} - ${endStr}`;
  };

  const generateShoppingList = () => {
    // Collect all unique meals
    const allMeals = weekDays.flatMap(day => day.meals);
    const mealCounts: Record<string, number> = {};

    allMeals.forEach(meal => {
      if (mealCounts[meal.name]) {
        mealCounts[meal.name]++;
      } else {
        mealCounts[meal.name] = 1;
      }
    });

    return Object.entries(mealCounts).map(([name, count]) => ({ name, count }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.background, Colors.card, Colors.background]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>MEAL PLANNING</Text>
            <Text style={styles.headerSubtitle}>{getWeekDateRange()}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Current Week Label */}
        <View style={styles.weekLabel}>
          <Text style={styles.weekLabelText}>This Week</Text>
        </View>

        {/* Shopping List Button */}
        <TouchableOpacity
          style={styles.shoppingListButton}
          onPress={() => setShowShoppingList(true)}
        >
          <Text style={styles.shoppingListButtonText}>🛒 Generate Shopping List</Text>
        </TouchableOpacity>

        {/* Meal Plan Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gridScroll}>
          <View style={styles.grid}>
            {weekDays.map((day, dayIndex) => {
              const totals = getDayTotals(day);

              return (
                <View key={day.date} style={styles.dayColumn}>
                  {/* Day Header */}
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayName}>{day.dayName}</Text>
                    <Text style={styles.dayDate}>
                      {new Date(day.date).getDate()}
                    </Text>
                    <View style={styles.dayTotals}>
                      <Text style={styles.dayTotalsText}>{totals.calories} cal</Text>
                      <Text style={styles.dayTotalsSubtext}>
                        P: {totals.protein}g • C: {totals.carbs}g • F: {totals.fat}g
                      </Text>
                    </View>
                  </View>

                  {/* Meal Time Slots */}
                  {mealTimes.map(mealTime => {
                    const meals = getMealsForTimeSlot(day, mealTime);

                    return (
                      <View key={mealTime} style={styles.mealSlot}>
                        <Text style={styles.mealTimeLabel}>{mealTime}</Text>

                        {meals.length === 0 ? (
                          <TouchableOpacity
                            style={styles.addMealButton}
                            onPress={() => openMealLibrary(day.date, mealTime)}
                          >
                            <Text style={styles.addMealButtonText}>+ Add Meal</Text>
                          </TouchableOpacity>
                        ) : (
                          <>
                            {meals.map(meal => (
                              <View key={meal.id} style={styles.plannedMeal}>
                                <View style={styles.plannedMealInfo}>
                                  <Text style={styles.plannedMealName}>{meal.name}</Text>
                                  <Text style={styles.plannedMealMacros}>
                                    {meal.calories} cal • P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  onPress={() => removeMealFromPlan(day.date, meal.id)}
                                >
                                  <Text style={styles.removeMealButton}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                            <TouchableOpacity
                              style={styles.addAnotherButton}
                              onPress={() => openMealLibrary(day.date, mealTime)}
                            >
                              <Text style={styles.addAnotherButtonText}>+ Add Another</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Meal Library Modal */}
        <MealLibraryModal
          visible={showMealLibrary}
          onClose={() => {
            setShowMealLibrary(false);
            setSelectedDayMealTime(null);
          }}
        />

        {/* Shopping List Modal */}
        <Modal
          visible={showShoppingList}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowShoppingList(false)}
        >
          <View style={styles.container}>
            <LinearGradient
              colors={[Colors.background, Colors.card, Colors.background]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>SHOPPING LIST</Text>
                <Text style={styles.headerSubtitle}>{getWeekDateRange()}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowShoppingList(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.shoppingListScroll}>
              <View style={styles.shoppingListContent}>
                {generateShoppingList().map((item, idx) => (
                  <View key={idx} style={styles.shoppingListItem}>
                    <View style={styles.shoppingListCheckbox} />
                    <View style={styles.shoppingListItemInfo}>
                      <Text style={styles.shoppingListItemName}>{item.name}</Text>
                      <Text style={styles.shoppingListItemCount}>Quantity: {item.count}</Text>
                    </View>
                  </View>
                ))}

                {generateShoppingList().length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No meals planned yet</Text>
                    <Text style={styles.emptySubtext}>Add meals to your plan to generate a shopping list</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.text,
    letterSpacing: 2,
    fontFamily: Fonts.bold,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    fontFamily: Fonts.regular,
  },
  closeButton: {
    fontSize: 28,
    color: Colors.text,
    fontFamily: Fonts.regular,
  },
  weekLabel: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  weekLabelText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shoppingListButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: Spacing.borderRadius,
    alignItems: 'center',
  },
  shoppingListButtonText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  gridScroll: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  dayColumn: {
    width: 200,
    marginRight: 12,
  },
  dayHeader: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayName: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1,
  },
  dayDate: {
    fontSize: 20,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginVertical: 4,
  },
  dayTotals: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dayTotalsText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  dayTotalsSubtext: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  mealSlot: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealTimeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  addMealButton: {
    backgroundColor: Colors.background,
    paddingVertical: 20,
    borderRadius: Spacing.borderRadius - 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addMealButtonText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  plannedMeal: {
    backgroundColor: Colors.background,
    borderRadius: Spacing.borderRadius - 4,
    padding: 8,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plannedMealInfo: {
    flex: 1,
  },
  plannedMealName: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: Fonts.medium,
    marginBottom: 2,
  },
  plannedMealMacros: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  removeMealButton: {
    fontSize: 16,
    color: Colors.textMuted,
    paddingLeft: 8,
    fontFamily: Fonts.regular,
  },
  addAnotherButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  addAnotherButtonText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  shoppingListScroll: {
    flex: 1,
  },
  shoppingListContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  shoppingListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: Spacing.borderRadius,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shoppingListCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
  },
  shoppingListItemInfo: {
    flex: 1,
  },
  shoppingListItemName: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.medium,
    marginBottom: 2,
  },
  shoppingListItemCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
    fontFamily: Fonts.medium,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
});
