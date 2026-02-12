/**
 * AI Coach Card Component
 * Unified AI coaching interface for meal, training, and general guidance
 */

import React, { useState, useCallback } from 'react';
import { Colors } from '../../../constants/Theme';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../liquidGlass';
import { CoachChatModal } from './CoachChatModal';
import { CoachMode } from '../../../types/ai';

interface AICoachCardProps {
  mode: CoachMode;
  title?: string;
  subtitle?: string;
  quickActions?: {
    label: string;
    icon: string;
    onPress: () => void;
  }[];
}

const MODE_CONFIG: Record<CoachMode, {
  icon: string;
  defaultTitle: string;
  defaultSubtitle: string;
  accentColor: string;
  suggestions: string[];
}> = {
  meal: {
    icon: 'nutrition',
    defaultTitle: 'Meal Coach',
    defaultSubtitle: 'Powered by GPT-4.1-mini',
    accentColor: Colors.successStrong,
    suggestions: [
      'What should I eat for dinner?',
      'High protein meal ideas',
      'Quick breakfast options',
      'How can I reduce calories?',
    ],
  },
  training: {
    icon: 'barbell',
    defaultTitle: 'Training Coach',
    defaultSubtitle: 'Powered by GPT-4.1-mini',
    accentColor: '#6366F1',
    suggestions: [
      'How do I improve my squat form?',
      'Best exercises for back',
      'How to build muscle faster?',
      'Recovery tips for sore muscles',
    ],
  },
  general: {
    icon: 'fitness',
    defaultTitle: 'AI Coach',
    defaultSubtitle: 'Powered by GPT-4.1-mini',
    accentColor: '#6366F1',
    suggestions: [
      'How do I lose weight safely?',
      'Tips for staying motivated',
      'How much protein do I need?',
      'Best time to workout?',
    ],
  },
};

export function AICoachCard({
  mode,
  title,
  subtitle,
  quickActions,
}: AICoachCardProps) {
  const [showChat, setShowChat] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>();

  const config = MODE_CONFIG[mode];

  const handleOpenChat = useCallback((message?: string) => {
    setInitialMessage(message);
    setShowChat(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setShowChat(false);
    setInitialMessage(undefined);
  }, []);

  return (
    <>
      <GlassCard variant="elevated" style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: `${config.accentColor}20` }]}>
            <Ionicons name={config.icon as any} size={24} color={config.accentColor} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title || config.defaultTitle}</Text>
            <Text style={styles.subtitle}>{subtitle || config.defaultSubtitle}</Text>
          </View>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleOpenChat()}
            accessibilityLabel={`Open ${title || config.defaultTitle} chat`}
            accessibilityRole="button"
            accessibilityHint="Opens a conversation with your AI coach to ask questions and get personalized guidance"
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={config.accentColor} />
          </TouchableOpacity>
        </View>

        {/* Quick Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsLabel}>Try asking:</Text>
          <View style={styles.suggestions}>
            {config.suggestions.slice(0, 2).map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleOpenChat(suggestion)}
                accessibilityLabel={`Ask: ${suggestion}`}
                accessibilityRole="button"
                accessibilityHint="Opens chat with this pre-filled question for quick AI guidance"
              >
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {suggestion}
                </Text>
                <Ionicons name="arrow-forward" size={12} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        {quickActions && quickActions.length > 0 && (
          <View style={styles.actionsContainer}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionButton, { borderColor: `${config.accentColor}40` }]}
                onPress={action.onPress}
                accessibilityLabel={action.label}
                accessibilityRole="button"
                accessibilityHint={`Quickly access ${action.label.toLowerCase()} feature`}
              >
                <Ionicons name={action.icon as any} size={16} color={config.accentColor} />
                <Text style={[styles.actionText, { color: config.accentColor }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </GlassCard>

      {/* Chat Modal */}
      <CoachChatModal
        visible={showChat}
        onClose={handleCloseChat}
        mode={mode}
        initialMessage={initialMessage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    marginBottom: 12,
  },
  suggestionsLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    maxWidth: '48%',
  },
  suggestionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default AICoachCard;
