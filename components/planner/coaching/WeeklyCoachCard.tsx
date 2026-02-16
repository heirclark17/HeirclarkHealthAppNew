/**
 * WeeklyCoachCard - Tier 5b
 * AI coaching card shown at top of DailyTimelineView on Mondays
 * or whenever optimization data is available.
 * Displays personalized weekly insights and a habit tip.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Sparkles, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassCard } from '../../GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { DarkColors, LightColors, Fonts } from '../../../constants/Theme';
import { AIOptimization } from '../../../types/planner';

const DISMISSED_KEY = 'hc_planner_coach_dismissed';

interface WeeklyCoachCardProps {
  optimization: AIOptimization | null;
}

export function WeeklyCoachCard({ optimization }: WeeklyCoachCardProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const { actions, state } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  // Check if previously dismissed for this week
  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY).then((val) => {
      if (val) {
        const dismissedDate = new Date(val);
        const now = new Date();
        // Reset dismissal after 7 days
        if (now.getTime() - dismissedDate.getTime() > 7 * 24 * 60 * 60 * 1000) {
          setDismissed(false);
          AsyncStorage.removeItem(DISMISSED_KEY);
        } else {
          setDismissed(true);
        }
      }
    });
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    AsyncStorage.setItem(DISMISSED_KEY, new Date().toISOString());
  }, []);

  const handleRefresh = useCallback(() => {
    actions.optimizeWeek();
  }, [actions]);

  if (!optimization || dismissed) return null;

  // Truncate insights to 3 lines when collapsed
  const insights = optimization.weeklyInsights || '';
  const firstParagraph = insights.split('\n\n')[0] || insights.slice(0, 200);
  const displayText = collapsed ? firstParagraph : insights;

  return (
    <GlassCard style={styles.container}>
      {/* Gradient accent bar */}
      <View style={styles.gradientBar}>
        <View style={styles.gradientLeft} />
        <View style={styles.gradientRight} />
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Sparkles size={20} color="#8B5CF6" />
          <Text style={[styles.title, { color: themeColors.text }]}>Your Weekly Coaching</Text>
          <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.dismissText, { color: themeColors.textSecondary }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>

        {/* Insights body */}
        <Text
          style={[styles.body, { color: themeColors.text }]}
          numberOfLines={collapsed ? 3 : undefined}
        >
          {displayText}
        </Text>

        {/* Expand/collapse toggle */}
        {insights.length > 200 && (
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setCollapsed(!collapsed)}
            activeOpacity={0.7}
          >
            {collapsed ? (
              <>
                <Text style={[styles.toggleText, { color: '#8B5CF6' }]}>Read more</Text>
                <ChevronDown size={14} color="#8B5CF6" />
              </>
            ) : (
              <>
                <Text style={[styles.toggleText, { color: '#8B5CF6' }]}>Show less</Text>
                <ChevronUp size={14} color="#8B5CF6" />
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Habit tip pill */}
        {optimization.habitTip && (
          <View style={[styles.habitPill, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)' }]}>
            <Sparkles size={12} color="#8B5CF6" />
            <Text style={[styles.habitText, { color: themeColors.text }]}>{optimization.habitTip}</Text>
          </View>
        )}

        {/* Refresh button */}
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          onPress={handleRefresh}
          disabled={state.isOptimizing}
          activeOpacity={0.7}
        >
          {state.isOptimizing ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <RefreshCw size={14} color="#8B5CF6" />
          )}
          <Text style={[styles.refreshText, { color: '#8B5CF6' }]}>
            {state.isOptimizing ? 'Refreshing...' : 'Refresh Insights'}
          </Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  gradientBar: {
    height: 3,
    flexDirection: 'row',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  gradientLeft: {
    flex: 1,
    backgroundColor: '#8B5CF6', // purple
  },
  gradientRight: {
    flex: 1,
    backgroundColor: '#3B82F6', // blue
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600' as const,
  },
  dismissText: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  body: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  habitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  habitText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    lineHeight: 18,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  refreshText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
});
