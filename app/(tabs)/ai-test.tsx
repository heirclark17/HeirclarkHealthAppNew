/**
 * AI Features Test Screen
 * Test all AI endpoints and features
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../components/GlassCard';
import { useSettings } from '../../contexts/SettingsContext';
import { aiService } from '../../services/aiService';
import { DarkColors, LightColors, Spacing, Fonts } from '../../constants/Theme';

export default function AITestScreen() {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const [loading, setLoading] = useState<string | null>(null);
  const [mealPlanResult, setMealPlanResult] = useState<any>(null);
  const [workoutPlanResult, setWorkoutPlanResult] = useState<any>(null);
  const [coachResponse, setCoachResponse] = useState<string | null>(null);

  // Test 1: Generate AI Meal Plan
  const testMealPlan = async () => {
    setLoading('meal-plan');
    setMealPlanResult(null);

    try {
      const result = await aiService.generateAIMealPlan({
        calorieTarget: 2000,
        proteinTarget: 150,
        carbsTarget: 200,
        fatTarget: 65,
        dietType: 'balanced',
        mealsPerDay: 3,
        allergies: [],
        favoriteProteins: ['chicken', 'salmon'],
        hatedFoods: 'mushrooms',
      }, 7);

      if (result) {
        setMealPlanResult(result);
        Alert.alert('Success!', `Generated ${result.days?.length || 0}-day meal plan`);
      } else {
        Alert.alert('Error', 'Failed to generate meal plan. Check console for details.');
      }
    } catch (error: any) {
      console.error('Meal plan test error:', error);
      Alert.alert('Error', error.message || 'Failed to generate meal plan');
    } finally {
      setLoading(null);
    }
  };

  // Test 2: Generate AI Workout Plan
  const testWorkoutPlan = async () => {
    setLoading('workout-plan');
    setWorkoutPlanResult(null);

    try {
      const result = await aiService.generateAIWorkoutPlan({
        fitnessGoal: 'strength',
        experienceLevel: 'intermediate',
        daysPerWeek: 3,
        sessionDuration: 60,
        availableEquipment: ['dumbbells', 'barbell', 'gym'],
        injuries: [],
      }, 4);

      if (result) {
        setWorkoutPlanResult(result);
        Alert.alert('Success!', `Generated ${result.weeks?.length || 0}-week workout plan`);
      } else {
        Alert.alert('Error', 'Failed to generate workout plan. Check console for details.');
      }
    } catch (error: any) {
      console.error('Workout plan test error:', error);
      Alert.alert('Error', error.message || 'Failed to generate workout plan');
    } finally {
      setLoading(null);
    }
  };

  // Test 3: AI Coach Chat - Meal Mode
  const testCoachMeal = async () => {
    setLoading('coach-meal');
    setCoachResponse(null);

    try {
      const result = await aiService.sendCoachMessage('How much protein do I need for muscle gain?', {
        mode: 'meal',
        userGoals: {
          calorieTarget: 2500,
          proteinTarget: 180,
          fitnessGoal: 'muscle_gain',
        },
      });

      if (result) {
        setCoachResponse(result.message);
        Alert.alert('Coach Response', result.message);
      } else {
        Alert.alert('Error', 'Failed to get coach response. Check console for details.');
      }
    } catch (error: any) {
      console.error('Coach chat test error:', error);
      Alert.alert('Error', error.message || 'Failed to get coach response');
    } finally {
      setLoading(null);
    }
  };

  // Test 4: AI Coach Chat - Training Mode
  const testCoachTraining = async () => {
    setLoading('coach-training');
    setCoachResponse(null);

    try {
      const result = await aiService.sendCoachMessage('How do I improve my squat form?', {
        mode: 'training',
        userGoals: {
          fitnessGoal: 'strength',
          activityLevel: 'active',
        },
      });

      if (result) {
        setCoachResponse(result.message);
        Alert.alert('Coach Response', result.message);
      } else {
        Alert.alert('Error', 'Failed to get coach response. Check console for details.');
      }
    } catch (error: any) {
      console.error('Coach chat test error:', error);
      Alert.alert('Error', error.message || 'Failed to get coach response');
    } finally {
      setLoading(null);
    }
  };

  // Test 5: AI Coach Chat - General Mode
  const testCoachGeneral = async () => {
    setLoading('coach-general');
    setCoachResponse(null);

    try {
      const result = await aiService.sendCoachMessage('How do I stay motivated?', {
        mode: 'general',
        userGoals: {
          calorieTarget: 2000,
          fitnessGoal: 'weight_loss',
        },
      });

      if (result) {
        setCoachResponse(result.message);
        Alert.alert('Coach Response', result.message);
      } else {
        Alert.alert('Error', 'Failed to get coach response. Check console for details.');
      }
    } catch (error: any) {
      console.error('Coach chat test error:', error);
      Alert.alert('Error', error.message || 'Failed to get coach response');
    } finally {
      setLoading(null);
    }
  };

  const renderTestButton = (
    title: string,
    description: string,
    onPress: () => void,
    loadingKey: string,
    icon: string,
    iconColor: string
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading !== null}
      style={{ marginBottom: Spacing.md }}
    >
      <GlassCard style={styles.testCard}>
        <View style={styles.testCardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon as any} size={24} color={iconColor} />
          </View>
          <View style={styles.testCardText}>
            <Text style={[styles.testTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.testDescription, { color: colors.textSecondary }]}>
              {description}
            </Text>
          </View>
          {loading === loadingKey ? (
            <ActivityIndicator color={iconColor} />
          ) : (
            <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>AI FEATURES TEST</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Test all AI endpoints
          </Text>
        </View>

        {/* Status Card */}
        <GlassCard style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#4ade80' }]} />
              <Text style={[styles.statusText, { color: colors.text }]}>Backend Online</Text>
            </View>
            <Text style={[styles.statusUrl, { color: colors.textSecondary }]}>
              {process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'}
            </Text>
          </View>
        </GlassCard>

        {/* Rate Limit Warning */}
        <GlassCard style={[styles.warningCard, { backgroundColor: '#fbbf24' + '20' }]}>
          <Ionicons name="warning" size={20} color="#f59e0b" />
          <Text style={[styles.warningText, { color: colors.text }]}>
            Rate Limit: 10 requests/minute. Test ONE button at a time and wait for completion.
          </Text>
        </GlassCard>

        {/* Test Buttons */}
        <View style={styles.testsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>MEAL PLANNING</Text>
          {renderTestButton(
            'Generate AI Meal Plan',
            'Generate a 7-day personalized meal plan',
            testMealPlan,
            'meal-plan',
            'restaurant',
            '#22c55e'
          )}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xl }]}>
            TRAINING
          </Text>
          {renderTestButton(
            'Generate AI Workout Plan',
            'Generate a 4-week training program',
            testWorkoutPlan,
            'workout-plan',
            'barbell',
            '#3b82f6'
          )}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xl }]}>
            AI COACH CHAT
          </Text>
          {renderTestButton(
            'Meal Coach (Green)',
            'Ask nutrition questions',
            testCoachMeal,
            'coach-meal',
            'nutrition',
            '#22c55e'
          )}
          {renderTestButton(
            'Training Coach (Blue)',
            'Ask fitness questions',
            testCoachTraining,
            'coach-training',
            'fitness',
            '#3b82f6'
          )}
          {renderTestButton(
            'General Coach (Purple)',
            'Ask health questions',
            testCoachGeneral,
            'coach-general',
            'heart',
            '#a855f7'
          )}
        </View>

        {/* Results Preview */}
        {(mealPlanResult || workoutPlanResult || coachResponse) && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>LAST RESULT</Text>
            <GlassCard style={styles.resultCard}>
              <ScrollView style={styles.resultScroll} nestedScrollEnabled>
                <Text style={[styles.resultText, { color: colors.text }]}>
                  {mealPlanResult
                    ? `Meal Plan: ${mealPlanResult.days?.length || 0} days generated`
                    : workoutPlanResult
                    ? `Workout Plan: ${workoutPlanResult.weeks?.length || 0} weeks generated`
                    : coachResponse
                    ? `Coach: ${coachResponse}`
                    : 'No results yet'}
                </Text>
              </ScrollView>
            </GlassCard>
          </View>
        )}

        {/* Info */}
        <GlassCard style={[styles.infoCard, { backgroundColor: colors.surface + '40' }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            These buttons test the backend AI endpoints. Check console for detailed logs.
          </Text>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  statusCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statusRow: {
    gap: Spacing.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  statusUrl: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: Spacing.xs,
  },
  testsContainer: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  testCard: {
    padding: Spacing.md,
  },
  testCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testCardText: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  testDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  resultsContainer: {
    marginBottom: Spacing.xl,
  },
  resultCard: {
    padding: Spacing.md,
    maxHeight: 200,
  },
  resultScroll: {
    maxHeight: 180,
  },
  resultText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  infoCard: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  warningCard: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    lineHeight: 18,
  },
});
