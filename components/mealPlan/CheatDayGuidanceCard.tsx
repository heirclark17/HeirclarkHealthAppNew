import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';
import { aiService } from '../../services/aiService';
import { CheatDayGuidance } from '../../types/ai';

interface CheatDayGuidanceCardProps {
  dayName: string;
  userGoals?: {
    goalType?: string;
    dailyCalories?: number;
  };
}

export function CheatDayGuidanceCard({ dayName, userGoals }: CheatDayGuidanceCardProps) {
  const [guidance, setGuidance] = useState<CheatDayGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware styling
  const glassOverlay = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.5)';
  const tipBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const accentColor = isDark ? Colors.warning : Colors.warningOrange; // Amber/gold for cheat day
  const accentBg = isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.12)';
  const quoteBg = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.10)';

  useEffect(() => {
    const fetchGuidance = async () => {
      setIsLoading(true);
      const result = await aiService.generateCheatDayGuidance(dayName, userGoals);
      setGuidance(result);
      setIsLoading(false);
    };

    fetchGuidance();
  }, [dayName, userGoals?.goalType]);

  if (isLoading) {
    return (
      <GlassCard style={styles.loadingCard} interactive>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Preparing your cheat day guidance...
        </Text>
      </GlassCard>
    );
  }

  if (!guidance) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <GlassCard
        style={[
          styles.container,
          {
            borderColor: isDark ? 'rgba(251, 191, 36, 0.25)' : 'rgba(245, 158, 11, 0.20)',
            borderWidth: 1,
          },
        ]}
        interactive
      >
        {/* Header with Pizza Icon */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: accentBg }]}>
            <BlurView
              intensity={isDark ? 30 : 50}
              tint={isDark ? 'dark' : 'light'}
              style={styles.iconBlur}
            >
              <Ionicons name="pizza-outline" size={32} color={accentColor} />
            </BlurView>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Flexible Day</Text>
            <Text style={[styles.subtitle, { color: accentColor }]}>{dayName}</Text>
          </View>
        </View>

        {/* Greeting */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {guidance.greeting}
          </Text>
        </Animated.View>

        {/* Encouragement Card */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={[styles.encouragementCard, { backgroundColor: glassOverlay }]}>
            <BlurView
              intensity={isDark ? 20 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.encouragementContent}>
              <Ionicons name="heart-outline" size={20} color={accentColor} />
              <Text style={[styles.encouragementText, { color: colors.textSecondary }]}>
                {guidance.encouragement}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Mindful Tips Section */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={styles.tipsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={18} color={accentColor} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Mindful Tips
              </Text>
            </View>
            {guidance.mindfulTips.map((tip, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(350 + index * 50)}
                style={[styles.tipItem, { backgroundColor: tipBg }]}
              >
                <View style={[styles.tipBullet, { backgroundColor: accentColor }]} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  {tip}
                </Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Hydration Reminder */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <View style={[styles.reminderCard, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.10)' }]}>
            <Ionicons name="water-outline" size={20} color={isDark ? Colors.restingEnergy : '#3B82F6'} />
            <Text style={[styles.reminderText, { color: colors.textSecondary }]}>
              {guidance.hydrationReminder}
            </Text>
          </View>
        </Animated.View>

        {/* Balance Tip */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <View style={[styles.balanceCard, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.10)' }]}>
            <Ionicons name="refresh-outline" size={20} color={isDark ? Colors.successStrong : Colors.successStrong} />
            <Text style={[styles.balanceText, { color: colors.textSecondary }]}>
              {guidance.balanceTip}
            </Text>
          </View>
        </Animated.View>

        {/* Motivational Quote */}
        <Animated.View entering={FadeInDown.delay(700)}>
          <View style={[styles.quoteCard, { backgroundColor: quoteBg }]}>
            <Ionicons name="sparkles" size={18} color={isDark ? '#A78BFA' : '#8B5CF6'} style={styles.quoteIcon} />
            <Text style={[styles.quoteText, { color: colors.text }]}>
              {guidance.motivationalQuote}
            </Text>
          </View>
        </Animated.View>

        {/* Footer Message */}
        <Animated.View entering={FadeInDown.delay(800)}>
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Enjoy your day! No meal tracking needed.
            </Text>
          </View>
        </Animated.View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  loadingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginTop: 2,
  },
  greeting: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    lineHeight: 24,
    marginBottom: 16,
  },
  encouragementCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.background,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  encouragementContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  encouragementText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
  tipsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  reminderText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 19,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  balanceText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 19,
  },
  quoteCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  quoteIcon: {
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  footerText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
});

export default CheatDayGuidanceCard;
