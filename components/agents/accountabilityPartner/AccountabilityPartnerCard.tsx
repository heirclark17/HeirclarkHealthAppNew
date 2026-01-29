/**
 * Accountability Partner Card
 * Dashboard card showing streaks, check-ins, messages, and motivation
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../GlassCard';
import { useGlassTheme } from '../../liquidGlass';
import { useAccountabilityPartner } from '../../../contexts/AccountabilityPartnerContext';
import { ActivityStreaks, MotivationalMessage } from '../../../types/accountabilityPartner';
import { Fonts } from '../../../constants/Theme';

// Activity icons mapping
const ACTIVITY_ICONS: Record<keyof ActivityStreaks, keyof typeof Ionicons.glyphMap> = {
  mealLogging: 'restaurant',
  weightLogging: 'scale',
  workoutCompletion: 'barbell',
  waterIntake: 'water',
  calorieGoalMet: 'flame',
};

// Activity display names
const ACTIVITY_NAMES: Record<keyof ActivityStreaks, string> = {
  mealLogging: 'Meals',
  weightLogging: 'Weight',
  workoutCompletion: 'Workouts',
  waterIntake: 'Hydration',
  calorieGoalMet: 'Calories',
};

export default function AccountabilityPartnerCard() {
  const { colors } = useGlassTheme();
  const {
    state,
    getBestCurrentStreak,
    getAtRiskStreaks,
    getUnreadCount,
    getRecommendations,
    getConsistencyScore,
    hasCompletedTodayCheckIn,
    submitMorningCheckIn,
    submitEveningCheckIn,
    markAllAsRead,
    getRecentMessages,
  } = useAccountabilityPartner();

  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showStreaksModal, setShowStreaksModal] = useState(false);

  // Check-in state
  const [moodRating, setMoodRating] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [goals, setGoals] = useState('');
  const [accomplishments, setAccomplishments] = useState('');
  const [notes, setNotes] = useState('');

  // Get data
  const bestStreak = useMemo(() => getBestCurrentStreak(), [getBestCurrentStreak]);
  const atRiskStreaks = useMemo(() => getAtRiskStreaks(), [getAtRiskStreaks]);
  const unreadCount = useMemo(() => getUnreadCount(), [getUnreadCount]);
  const recommendations = useMemo(() => getRecommendations(), [getRecommendations]);
  const consistencyScore = useMemo(() => getConsistencyScore(), [getConsistencyScore]);
  const hasCheckedIn = useMemo(() => hasCompletedTodayCheckIn(), [hasCompletedTodayCheckIn]);
  const messages = useMemo(() => getRecentMessages(), [getRecentMessages]);

  // Determine current hour for check-in type
  const currentHour = new Date().getHours();
  const isMorning = currentHour < 14;

  // Handle check-in submission
  const handleSubmitCheckIn = useCallback(async () => {
    try {
      if (isMorning) {
        const goalsList = goals.split('\n').filter((g) => g.trim());
        await submitMorningCheckIn(moodRating, energyLevel, goalsList);
      } else {
        const accomplishmentsList = accomplishments.split('\n').filter((a) => a.trim());
        await submitEveningCheckIn(accomplishmentsList, notes);
      }
      setShowCheckInModal(false);
      // Reset form
      setMoodRating(3);
      setEnergyLevel(3);
      setGoals('');
      setAccomplishments('');
      setNotes('');
    } catch (error) {
      console.error('Error submitting check-in:', error);
    }
  }, [
    isMorning,
    moodRating,
    energyLevel,
    goals,
    accomplishments,
    notes,
    submitMorningCheckIn,
    submitEveningCheckIn,
  ]);

  // Render mood/energy selector
  const renderRatingSelector = (
    value: number,
    onChange: (v: number) => void,
    label: string
  ) => (
    <View style={styles.ratingContainer}>
      <Text style={[styles.ratingLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.ratingButtons}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.ratingButton,
              {
                backgroundColor:
                  value === rating ? colors.primary : colors.cardGlass,
                borderColor: value === rating ? colors.primary : colors.glassBorder,
              },
            ]}
            onPress={() => onChange(rating)}
          >
            <Text
              style={[
                styles.ratingButtonText,
                { color: value === rating ? '#FFFFFF' : colors.text },
              ]}
            >
              {rating}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render streak item
  const renderStreakItem = (activity: keyof ActivityStreaks) => {
    const streak = state.streaks[activity];
    const isAtRisk = atRiskStreaks.includes(activity);

    return (
      <View key={activity} style={styles.streakItem}>
        <View style={styles.streakIconContainer}>
          <Ionicons
            name={ACTIVITY_ICONS[activity]}
            size={20}
            color={isAtRisk ? '#FF6B6B' : colors.primary}
          />
        </View>
        <View style={styles.streakInfo}>
          <Text style={[styles.streakName, { color: colors.text }]}>
            {ACTIVITY_NAMES[activity]}
          </Text>
          <Text style={[styles.streakSubtext, { color: colors.textMuted }]}>
            Best: {streak.longestStreak} days
          </Text>
        </View>
        <View style={styles.streakValueContainer}>
          <Text
            style={[
              styles.streakValue,
              { color: isAtRisk ? '#FF6B6B' : colors.primary },
            ]}
          >
            {streak.currentStreak}
          </Text>
          <Text style={[styles.streakUnit, { color: colors.textMuted }]}>days</Text>
          {isAtRisk && (
            <View style={styles.atRiskBadge}>
              <Ionicons name="warning" size={12} color="#FF6B6B" />
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render message item
  const renderMessageItem = (message: MotivationalMessage) => (
    <GlassCard
      key={message.id}
      style={[styles.messageItem, !message.read && styles.unreadMessage]}
    >
      <View style={styles.messageHeader}>
        <View style={[styles.messageIconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons
            name={message.icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={colors.primary}
          />
        </View>
        <View style={styles.messageContent}>
          <Text style={[styles.messageTitle, { color: colors.text }]}>
            {message.title}
          </Text>
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>
            {message.message}
          </Text>
          <Text style={[styles.messageTime, { color: colors.textMuted }]}>
            {formatTimeAgo(message.timestamp)}
          </Text>
        </View>
        {!message.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </View>
    </GlassCard>
  );

  return (
    <>
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="heart" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Accountability Partner</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {consistencyScore}% consistency score
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.messagesButton, { backgroundColor: colors.cardGlass }]}
            onPress={() => setShowMessagesModal(true)}
          >
            <Ionicons name="notifications" size={18} color={colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Best Streak Display */}
        <TouchableOpacity
          style={[styles.bestStreakCard, { backgroundColor: colors.primary + '15' }]}
          onPress={() => setShowStreaksModal(true)}
        >
          <View style={styles.bestStreakLeft}>
            <Ionicons name="flame" size={28} color={colors.primary} />
            <View style={styles.bestStreakInfo}>
              <Text style={[styles.bestStreakLabel, { color: colors.textMuted }]}>
                BEST STREAK
              </Text>
              <Text style={[styles.bestStreakActivity, { color: colors.text }]}>
                {ACTIVITY_NAMES[bestStreak.activity]}
              </Text>
            </View>
          </View>
          <View style={styles.bestStreakRight}>
            <Text style={[styles.bestStreakValue, { color: colors.primary }]}>
              {bestStreak.streak}
            </Text>
            <Text style={[styles.bestStreakUnit, { color: colors.textMuted }]}>days</Text>
          </View>
        </TouchableOpacity>

        {/* At Risk Streaks Warning */}
        {atRiskStreaks.length > 0 && (
          <View style={[styles.warningBanner, { backgroundColor: '#FF6B6B20' }]}>
            <Ionicons name="warning" size={16} color="#FF6B6B" />
            <Text style={[styles.warningText, { color: '#FF6B6B' }]}>
              {atRiskStreaks.length} streak{atRiskStreaks.length > 1 ? 's' : ''} at risk!
              Log today to keep {atRiskStreaks.length > 1 ? 'them' : 'it'} going.
            </Text>
          </View>
        )}

        {/* Quick Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TODAY'S TIP</Text>
            <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
              {recommendations[0]}
            </Text>
          </View>
        )}

        {/* Check-In Button */}
        <TouchableOpacity
          style={[
            styles.checkInButton,
            {
              backgroundColor: hasCheckedIn ? colors.cardGlass : colors.primary,
              borderColor: hasCheckedIn ? colors.glassBorder : colors.primary,
              borderWidth: hasCheckedIn ? 1 : 0,
            },
          ]}
          onPress={() => setShowCheckInModal(true)}
          disabled={hasCheckedIn}
        >
          <Ionicons
            name={hasCheckedIn ? 'checkmark-circle' : 'checkbox'}
            size={18}
            color={hasCheckedIn ? colors.primary : '#FFFFFF'}
          />
          <Text
            style={[
              styles.checkInButtonText,
              { color: hasCheckedIn ? colors.primary : '#FFFFFF' },
            ]}
          >
            {hasCheckedIn
              ? 'Check-in Complete'
              : isMorning
              ? 'Morning Check-in'
              : 'Evening Check-in'}
          </Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Messages Modal */}
      <Modal
        visible={showMessagesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMessagesModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Messages</Text>
            <View style={styles.modalHeaderButtons}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={[styles.markAllReadButton, { backgroundColor: colors.cardGlass }]}
                  onPress={markAllAsRead}
                >
                  <Text style={[styles.markAllReadText, { color: colors.primary }]}>
                    Mark All Read
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
                onPress={() => setShowMessagesModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.messagesList}>
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
                  No messages yet
                </Text>
              </View>
            ) : (
              messages.map(renderMessageItem)
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Check-In Modal */}
      <Modal
        visible={showCheckInModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isMorning ? 'Morning Check-in' : 'Evening Check-in'}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowCheckInModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.checkInForm}>
            {isMorning ? (
              <>
                {renderRatingSelector(moodRating, setMoodRating, 'How are you feeling?')}
                {renderRatingSelector(energyLevel, setEnergyLevel, 'Energy level?')}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Goals for today (one per line)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.cardGlass,
                        color: colors.text,
                        borderColor: colors.glassBorder,
                      },
                    ]}
                    multiline
                    numberOfLines={4}
                    value={goals}
                    onChangeText={setGoals}
                    placeholder="What do you want to accomplish today?"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    What did you accomplish today?
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.cardGlass,
                        color: colors.text,
                        borderColor: colors.glassBorder,
                      },
                    ]}
                    multiline
                    numberOfLines={4}
                    value={accomplishments}
                    onChangeText={setAccomplishments}
                    placeholder="List your wins (one per line)"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Any notes or reflections?
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.cardGlass,
                        color: colors.text,
                        borderColor: colors.glassBorder,
                      },
                    ]}
                    multiline
                    numberOfLines={3}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="How did the day go?"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmitCheckIn}
            >
              <Text style={styles.submitButtonText}>Complete Check-in</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Streaks Modal */}
      <Modal
        visible={showStreaksModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStreaksModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>All Streaks</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowStreaksModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.streaksList}>
            {(Object.keys(state.streaks) as Array<keyof ActivityStreaks>).map(renderStreakItem)}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

// Helper function to format time ago
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  messagesButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Fonts.semiBold,
  },
  bestStreakCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  bestStreakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bestStreakInfo: {
    gap: 2,
  },
  bestStreakLabel: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  bestStreakActivity: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  bestStreakRight: {
    alignItems: 'flex-end',
  },
  bestStreakValue: {
    fontSize: 28,
    fontFamily: Fonts.bold,
  },
  bestStreakUnit: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  recommendationsContainer: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  checkInButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  markAllReadText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageItem: {
    marginBottom: 12,
    padding: 12,
  },
  unreadMessage: {
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  messageIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  checkInForm: {
    flex: 1,
    padding: 16,
  },
  ratingContainer: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 12,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  ratingButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  streaksList: {
    flex: 1,
    padding: 16,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  streakIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  streakInfo: {
    flex: 1,
    marginLeft: 12,
  },
  streakName: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  streakSubtext: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  streakValueContainer: {
    alignItems: 'flex-end',
    position: 'relative',
  },
  streakValue: {
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
  streakUnit: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  atRiskBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
  },
});
