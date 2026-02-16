/**
 * PlannerChatSheet - Conversational AI chat for schedule editing
 * Bottom sheet with message bubbles, action preview cards, and suggestion chips.
 * Reuses glass styling patterns from CoachChatModal.
 */

import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { Sparkles, Send, Check, X, ChevronDown } from 'lucide-react-native';
import { useDayPlanner } from '../../../contexts/DayPlannerContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useSleepRecovery } from '../../../contexts/SleepRecoveryContext';
import { useGoalWizard } from '../../../contexts/GoalWizardContext';
import { api } from '../../../services/api';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';
import { PlannerChatMessage, ScheduleAction, TimeBlock } from '../../../types/planner';
import { mediumImpact, lightImpact } from '../../../utils/haptics';

// ============================================================================
// Glass theme colors (from CoachChatModal)
// ============================================================================

const GLASS_COLORS = {
  light: {
    background: LightColors.background,
    headerBg: 'rgba(255, 255, 255, 0.92)',
    inputBg: 'rgba(255, 255, 255, 0.92)',
    userBubble: 'rgba(0, 122, 255, 0.9)',
    assistantBubble: 'rgba(0, 0, 0, 0.05)',
    text: LightColors.text,
    textSecondary: LightColors.textSecondary,
    border: 'rgba(0, 0, 0, 0.08)',
    inputBorder: 'rgba(0, 0, 0, 0.12)',
    accent: 'rgba(78, 205, 196, 0.9)',
    actionCard: 'rgba(0, 0, 0, 0.04)',
    actionCardBorder: 'rgba(0, 0, 0, 0.08)',
    chipBg: 'rgba(0, 0, 0, 0.05)',
  },
  dark: {
    background: DarkColors.background,
    headerBg: 'rgba(44, 44, 46, 0.85)',
    inputBg: 'rgba(44, 44, 46, 0.85)',
    userBubble: 'rgba(10, 132, 255, 0.9)',
    assistantBubble: 'rgba(255, 255, 255, 0.08)',
    text: DarkColors.text,
    textSecondary: DarkColors.textSecondary,
    border: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    accent: 'rgba(78, 205, 196, 0.9)',
    actionCard: 'rgba(255, 255, 255, 0.06)',
    actionCardBorder: 'rgba(255, 255, 255, 0.1)',
    chipBg: 'rgba(255, 255, 255, 0.08)',
  },
};

const genId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const SUGGESTION_CHIPS = [
  "Move my workout to afternoon",
  "Add a yoga session",
  "Free up my morning",
  "Why is my day so packed?",
  "What's my recovery status?",
];

// ============================================================================
// AI response parser
// ============================================================================

function parseAIResponse(text: string): { message: string; actions: ScheduleAction[] } {
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
  let actions: ScheduleAction[] = [];
  let message = text;

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      actions = parsed.actions || [];
      message = text.replace(/```json\n[\s\S]*?\n```/, '').trim();
    } catch {
      // Failed to parse JSON, just return the message as-is
    }
  }

  return { message, actions };
}

// ============================================================================
// Component
// ============================================================================

export interface PlannerChatSheetRef {
  present: () => void;
  dismiss: () => void;
}

export const PlannerChatSheet = forwardRef<PlannerChatSheetRef>((_props, ref) => {
  const { state, actions } = useDayPlanner();
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const glass = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

  let recoveryScore: number | null = null;
  try {
    const sleepRecovery = useSleepRecovery();
    recoveryScore = sleepRecovery?.state?.recoveryScore ?? null;
  } catch { /* not available */ }

  let goalState: any = null;
  try {
    const goalWizard = useGoalWizard();
    goalState = goalWizard?.state;
  } catch { /* not available */ }

  const [messages, setMessages] = useState<PlannerChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const flatListRef = useRef<FlatList>(null);
  const snapPoints = useMemo(() => ['70%', '88%', '96%'], []);

  // Expose present/dismiss to parent
  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    []
  );

  // Build schedule context for the AI
  const buildScheduleContext = useCallback(() => {
    const timeline = state.weeklyPlan?.days[state.selectedDayIndex];
    if (!timeline) return null;

    return {
      date: timeline.date,
      dayOfWeek: timeline.dayOfWeek,
      blocks: timeline.blocks
        .filter((b) => !b.isAllDay)
        .map((b) => ({
          id: b.id,
          type: b.type,
          title: b.title,
          startTime: b.startTime,
          endTime: b.endTime,
          duration: b.duration,
          status: b.status,
        })),
      totalScheduledMinutes: timeline.totalScheduledMinutes,
      totalFreeMinutes: timeline.totalFreeMinutes,
      completionRate: timeline.completionRate,
      preferences: state.preferences ? {
        wakeTime: state.preferences.wakeTime,
        sleepTime: state.preferences.sleepTime,
        energyPeak: state.preferences.energyPeak,
      } : undefined,
      recoveryScore,
      isCheatDay: false,
      isFasting: goalState?.intermittentFasting ?? false,
    };
  }, [state.weeklyPlan, state.selectedDayIndex, state.preferences, recoveryScore, goalState]);

  // Send message
  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || inputText).trim();
    if (!messageText || isLoading) return;

    lightImpact();
    Keyboard.dismiss();
    setInputText('');

    const userMessage: PlannerChatMessage = {
      id: genId(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const scheduleContext = buildScheduleContext();
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await api.sendPlannerChat(messageText, scheduleContext, conversationHistory);

      if (result?.message) {
        const { message: cleanMessage, actions: parsedActions } = parseAIResponse(result.message);

        const assistantMessage: PlannerChatMessage = {
          id: genId(),
          role: 'assistant',
          content: cleanMessage,
          timestamp: new Date(),
          actions: parsedActions.length > 0 ? parsedActions : undefined,
          actionsApplied: false,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: PlannerChatMessage = {
          id: genId(),
          role: 'assistant',
          content: "Sorry, I couldn't process that right now. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('[PlannerChat] Error:', error);
      const errorMessage: PlannerChatMessage = {
        id: genId(),
        role: 'assistant',
        content: "Something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [inputText, isLoading, messages, buildScheduleContext]);

  // Apply actions from AI response
  const handleApplyActions = useCallback(async (messageId: string, messageActions: ScheduleAction[]) => {
    const timeline = state.weeklyPlan?.days[state.selectedDayIndex];
    if (!timeline) return;

    mediumImpact();

    for (const action of messageActions) {
      try {
        switch (action.type) {
          case 'reschedule':
            if (action.blockId && action.newStartTime) {
              await actions.updateBlockTime(action.blockId, timeline.date, action.newStartTime);
            }
            break;
          case 'add':
            if (action.block) {
              await actions.addBlock(action.block as Partial<TimeBlock>, timeline.date);
            }
            break;
          case 'remove':
            if (action.blockId) {
              await actions.removeBlock(action.blockId, timeline.date);
            }
            break;
          case 'info':
            // No action needed
            break;
        }
      } catch (error) {
        console.error('[PlannerChat] Action failed:', action, error);
      }
    }

    // Mark actions as applied
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, actionsApplied: true } : m
      )
    );
  }, [state.weeklyPlan, state.selectedDayIndex, actions]);

  // Dismiss actions
  const handleDismissActions = useCallback((messageId: string) => {
    lightImpact();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, actionsApplied: true } : m
      )
    );
  }, []);

  // ============================================================================
  // Renderers
  // ============================================================================

  const renderActionCard = useCallback((action: ScheduleAction, messageId: string, applied: boolean) => {
    const icon = action.type === 'reschedule' ? '\u{1F504}' :
                 action.type === 'add' ? '\u{2795}' :
                 action.type === 'remove' ? '\u{274C}' : '\u{2139}\u{FE0F}';

    return (
      <View
        key={action.description}
        style={[styles.actionCard, { backgroundColor: glass.actionCard, borderColor: glass.actionCardBorder }]}
      >
        <Text style={[styles.actionText, { color: glass.text }]}>
          {icon} {action.description}
        </Text>
        {action.type === 'reschedule' && action.newStartTime && (
          <Text style={[styles.actionDetail, { color: glass.textSecondary }]}>
            New time: {action.newStartTime}
          </Text>
        )}
        {action.type === 'add' && action.block?.duration && (
          <Text style={[styles.actionDetail, { color: glass.textSecondary }]}>
            Duration: {action.block.duration} min
          </Text>
        )}
      </View>
    );
  }, [glass]);

  const renderMessage = useCallback(({ item }: { item: PlannerChatMessage }) => {
    const isUser = item.role === 'user';
    const AnimatedView = Animated.View;

    return (
      <AnimatedView
        entering={isUser ? FadeInRight.springify().damping(24).stiffness(300) : FadeInLeft.springify().damping(18).stiffness(200)}
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          {
            backgroundColor: isUser ? glass.userBubble : glass.assistantBubble,
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isUser ? '#FFFFFF' : glass.text },
          ]}
        >
          {item.content}
        </Text>

        {/* Action preview cards */}
        {item.actions && item.actions.length > 0 && !item.actionsApplied && (
          <View style={styles.actionsContainer}>
            {item.actions.map((action) => renderActionCard(action, item.id, !!item.actionsApplied))}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: 'rgba(52, 199, 89, 0.9)' }]}
                onPress={() => handleApplyActions(item.id, item.actions!)}
                activeOpacity={0.7}
              >
                <Check size={16} color="#fff" />
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dismissButton, { backgroundColor: glass.chipBg }]}
                onPress={() => handleDismissActions(item.id)}
                activeOpacity={0.7}
              >
                <X size={16} color={glass.textSecondary} />
                <Text style={[styles.dismissButtonText, { color: glass.textSecondary }]}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Applied indicator */}
        {item.actions && item.actionsApplied && (
          <View style={styles.appliedIndicator}>
            <Check size={14} color="rgba(52, 199, 89, 0.9)" />
            <Text style={[styles.appliedText, { color: glass.textSecondary }]}>
              Changes applied
            </Text>
          </View>
        )}
      </AnimatedView>
    );
  }, [glass, renderActionCard, handleApplyActions, handleDismissActions]);

  const renderSuggestionChips = useCallback(() => (
    <View style={styles.suggestionsContainer}>
      <View style={styles.emptyStateHeader}>
        <Sparkles size={32} color={glass.accent} style={{ opacity: 0.7 }} />
        <Text style={[styles.emptyTitle, { color: glass.text }]}>Schedule Assistant</Text>
        <Text style={[styles.emptySubtitle, { color: glass.textSecondary }]}>
          Ask me to modify your schedule or answer questions about your day.
        </Text>
      </View>
      <View style={styles.chipsWrap}>
        {SUGGESTION_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip}
            style={[styles.chip, { backgroundColor: glass.chipBg, borderColor: glass.border }]}
            onPress={() => handleSend(chip)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, { color: glass.text }]}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [glass, handleSend]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={{
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.97)' : 'rgba(248, 248, 250, 0.97)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}
      enableDynamicSizing={false}
    >
      <View style={styles.sheetContainer}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: glass.border }]}>
          <Sparkles size={18} color={glass.accent} />
          <Text style={[styles.headerTitle, { color: glass.text }]}>Schedule Assistant</Text>
          <TouchableOpacity onPress={() => bottomSheetRef.current?.dismiss()} hitSlop={12}>
            <ChevronDown size={22} color={glass.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={renderSuggestionChips}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={[styles.loadingBubble, { backgroundColor: glass.assistantBubble }]}>
            <ActivityIndicator size="small" color={glass.textSecondary} />
            <Text style={[styles.loadingText, { color: glass.textSecondary }]}>Thinking...</Text>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { borderTopColor: glass.border, backgroundColor: isDark ? 'rgba(28, 28, 30, 0.98)' : 'rgba(248, 248, 250, 0.98)' }]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: glass.inputBg,
                borderColor: glass.inputBorder,
                color: glass.text,
              },
            ]}
            placeholder="Ask about your schedule..."
            placeholderTextColor={glass.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? glass.accent : glass.chipBg,
                opacity: inputText.trim() && !isLoading ? 1 : 0.5,
              },
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.7}
          >
            <Send size={18} color={inputText.trim() ? '#fff' : glass.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
});

PlannerChatSheet.displayName = 'PlannerChatSheet';

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    fontWeight: '600' as const,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 21,
  },
  // Action cards
  actionsContainer: {
    marginTop: 10,
    gap: 6,
  },
  actionCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  actionDetail: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  applyButtonText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    fontWeight: '600' as const,
    color: '#fff',
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dismissButtonText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  appliedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  appliedText: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  // Loading
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 16,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
  },
  // Empty state / suggestions
  suggestionsContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  emptyStateHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    fontWeight: '600' as const,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200' as const,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    fontFamily: Fonts.regular,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
