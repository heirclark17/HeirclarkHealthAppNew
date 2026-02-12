/**
 * Restaurant Menu Card
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { UtensilsCrossed, ArrowRight, Lightbulb, X, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useGlassTheme } from '../../liquidGlass';
import { useRestaurantMenu } from '../../../contexts/RestaurantMenuContext';
import { useGoalWizard } from '../../../contexts/GoalWizardContext';
import { useMealPlan } from '../../../contexts/MealPlanContext';
import { Fonts } from '../../../constants/Theme';
import { generateRestaurantDishGuidance, RestaurantDishParams } from '../../../services/openaiService';

const CUISINE_TYPES = ['mexican', 'italian', 'asian', 'american', 'fastfood', 'general'];

export default function RestaurantMenuCard() {
  const { colors } = useGlassTheme();
  const { state: goalState } = useGoalWizard();
  const { state: mealState } = useMealPlan();
  const { addRecentSearch } = useRestaurantMenu();

  const [showModal, setShowModal] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [aiGuidance, setAiGuidance] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate remaining macros for the day
  const dailyTargets = goalState.dailyTargets || { calories: 2000, protein: 150, carbs: 200, fat: 60 };
  const todayTotals = mealState.weeklyPlan?.[mealState.selectedDayIndex]?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const remainingCalories = Math.max(0, dailyTargets.calories - todayTotals.calories);
  const remainingProtein = Math.max(0, dailyTargets.protein - todayTotals.protein);
  const remainingCarbs = Math.max(0, dailyTargets.carbs - todayTotals.carbs);
  const remainingFat = Math.max(0, dailyTargets.fat - todayTotals.fat);

  const handleCuisineSelect = useCallback(async (cuisine: string) => {
    setSelectedCuisine(cuisine);
    addRecentSearch(cuisine);
    setIsGenerating(true);
    setError(null);

    try {
      console.log('[RestaurantMenu] Generating AI guidance for:', cuisine);

      const params: RestaurantDishParams = {
        cuisine,
        dailyCalories: dailyTargets.calories,
        remainingCalories,
        dailyProtein: dailyTargets.protein,
        remainingProtein,
        dailyCarbs: dailyTargets.carbs,
        remainingCarbs,
        dailyFat: dailyTargets.fat,
        remainingFat,
        primaryGoal: goalState.primaryGoal || 'maintain',
        allergies: goalState.allergies || [],
        dietaryPreferences: goalState.dietStyle ? [goalState.dietStyle] : [],
      };

      const guidance = await generateRestaurantDishGuidance(params);
      setAiGuidance(guidance);
      console.log('[RestaurantMenu] ✅ AI guidance generated');
    } catch (err) {
      console.error('[RestaurantMenu] Error generating guidance:', err);
      setError('Unable to generate guidance. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [addRecentSearch, dailyTargets, remainingCalories, remainingProtein, remainingCarbs, remainingFat, goalState.primaryGoal, goalState.allergies, goalState.dietStyle]);

  return (
    <>
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <UtensilsCrossed size={20} color={colors.primary} strokeWidth={1.5} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Eating Out Guide</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                AI-powered accountability
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => setShowModal(true)}
          >
            <Text style={[styles.viewButtonText, { color: colors.primary }]}>Open</Text>
            <ArrowRight size={14} color={colors.primary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Calorie Budget Display */}
        <View style={[styles.budgetPreview, { backgroundColor: remainingCalories < dailyTargets.calories * 0.3 ? colors.error + '15' : colors.success + '15' }]}>
          <View style={styles.budgetRow}>
            <Text style={[styles.budgetLabel, { color: colors.textMuted }]}>Remaining Today</Text>
            <Text style={[styles.budgetValue, { color: remainingCalories < dailyTargets.calories * 0.3 ? colors.error : colors.success }]}>
              {Math.round(remainingCalories)} cal
            </Text>
          </View>
          <Text style={[styles.budgetHint, { color: colors.textSecondary }]}>
            {remainingCalories < dailyTargets.calories * 0.3
              ? '⚠️ Tight budget - choose wisely'
              : '✓ Good budget - enjoy mindfully'}
          </Text>
        </View>

        {/* Cuisine Quick Select */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cuisineScroll}>
          {CUISINE_TYPES.map((cuisine) => (
            <TouchableOpacity
              key={cuisine}
              style={[styles.cuisineChip, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
              onPress={() => {
                handleCuisineSelect(cuisine);
                setShowModal(true);
              }}
            >
              <Text style={[styles.cuisineText, { color: colors.text }]}>
                {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </GlassCard>

      {/* Tips Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedCuisine
                  ? `${selectedCuisine.charAt(0).toUpperCase() + selectedCuisine.slice(1)} Guide`
                  : 'Restaurant Guide'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                {Math.round(remainingCalories)} cal remaining • {goalState.primaryGoal?.replace('_', ' ') || 'Stay on track'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary + '15' }]}
              onPress={() => setShowModal(false)}
            >
              <X size={22} color={colors.text} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Calorie Budget Alert */}
            <View style={[styles.budgetAlert, {
              backgroundColor: remainingCalories < dailyTargets.calories * 0.3 ? colors.error + '15' : colors.success + '15',
              borderColor: remainingCalories < dailyTargets.calories * 0.3 ? colors.error : colors.success,
            }]}>
              {remainingCalories < dailyTargets.calories * 0.3 ? (
                <AlertCircle size={20} color={colors.error} strokeWidth={1.5} />
              ) : (
                <CheckCircle2 size={20} color={colors.success} strokeWidth={1.5} />
              )}
              <View style={styles.budgetAlertText}>
                <Text style={[styles.budgetAlertTitle, { color: colors.text }]}>
                  {remainingCalories < dailyTargets.calories * 0.3 ? 'Tight Budget' : 'Good Budget'}
                </Text>
                <Text style={[styles.budgetAlertSubtitle, { color: colors.textSecondary }]}>
                  {Math.round(remainingCalories)} cal • {Math.round(remainingProtein)}g protein • {Math.round(remainingCarbs)}g carbs • {Math.round(remainingFat)}g fat
                </Text>
              </View>
            </View>

            {/* Cuisine Selector */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Cuisine Type</Text>
            <View style={styles.cuisineGrid}>
              {CUISINE_TYPES.map((cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.cuisineButton,
                    {
                      backgroundColor: selectedCuisine === cuisine ? colors.primary : colors.backgroundSecondary,
                      borderColor: selectedCuisine === cuisine ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleCuisineSelect(cuisine)}
                  disabled={isGenerating}
                >
                  <Text style={{ color: selectedCuisine === cuisine ? '#FFF' : colors.text, fontSize: 13, fontFamily: Fonts.medium }}>
                    {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* AI-Generated Guidance */}
            {selectedCuisine && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
                  AI-Powered Guidance
                </Text>

                {isGenerating ? (
                  <View style={[styles.loadingContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                      Analyzing {selectedCuisine} dishes and your daily budget...
                    </Text>
                  </View>
                ) : error ? (
                  <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
                    <AlertCircle size={20} color={colors.error} strokeWidth={1.5} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                  </View>
                ) : aiGuidance ? (
                  <View style={[styles.guidanceContainer, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.guidanceText, { color: colors.text }]}>
                      {aiGuidance}
                    </Text>
                  </View>
                ) : null}
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontFamily: Fonts.semiBold },
  subtitle: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
  viewButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  viewButtonText: { fontSize: 13, fontFamily: Fonts.medium },
  budgetPreview: { padding: 12, borderRadius: 12, marginBottom: 12 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  budgetLabel: { fontSize: 12, fontFamily: Fonts.regular },
  budgetValue: { fontSize: 18, fontFamily: Fonts.semiBold },
  budgetHint: { fontSize: 11, fontFamily: Fonts.regular },
  cuisineScroll: { marginTop: 4 },
  cuisineChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderWidth: 1, marginRight: 8 },
  cuisineText: { fontSize: 12, fontFamily: Fonts.medium },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontFamily: Fonts.semiBold },
  modalSubtitle: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalContent: { flex: 1, padding: 16 },
  budgetAlert: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  budgetAlertText: { flex: 1 },
  budgetAlertTitle: { fontSize: 14, fontFamily: Fonts.semiBold, marginBottom: 4 },
  budgetAlertSubtitle: { fontSize: 11, fontFamily: Fonts.regular },
  sectionTitle: { fontSize: 15, fontFamily: Fonts.semiBold, marginBottom: 12 },
  cuisineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  cuisineButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  loadingContainer: { padding: 32, borderRadius: 12, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontFamily: Fonts.regular, textAlign: 'center' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12 },
  errorText: { flex: 1, fontSize: 13, fontFamily: Fonts.regular },
  guidanceContainer: { padding: 16, borderRadius: 12 },
  guidanceText: { fontSize: 14, fontFamily: Fonts.regular, lineHeight: 22 },
});
