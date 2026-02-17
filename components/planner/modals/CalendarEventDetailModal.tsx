/**
 * CalendarEventDetailModal - Shows detailed calendar event information
 *
 * Features:
 * - Event details (title, location, notes)
 * - Time and duration
 * - Open in native calendar app option
 * - Liquid glass design
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { X, Calendar, Clock, MapPin, ExternalLink } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { NumberText } from '../../NumberText';
import { TimeBlock } from '../../../types/planner';
import { useSettings } from '../../../contexts/SettingsContext';
import { Colors, DarkColors, LightColors, Fonts } from '../../../constants/Theme';

interface Props {
  visible: boolean;
  block: TimeBlock | null;
  onClose: () => void;
}

export function CalendarEventDetailModal({
  visible,
  block,
  onClose,
}: Props) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const themeColors = isDark ? DarkColors : LightColors;

  if (!block || !visible) return null;

  const handleOpenInCalendar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Open native calendar app (iOS/Android)
    const url = Platform.OS === 'ios'
      ? `calshow:${Math.floor(Date.now() / 1000)}`  // iOS calendar URL scheme
      : 'content://com.android.calendar/time/';     // Android calendar content URI

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('[CalendarEvent] Failed to open calendar:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={isDark ? 80 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          <GlassCard style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Calendar size={24} color={block.color || Colors.primary} />
                <Text style={[styles.title, { color: themeColors.text }]}>
                  {block.title}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Time & Duration */}
            {!block.isAllDay && (
              <View style={styles.timeRow}>
                <Clock size={16} color={themeColors.textSecondary} />
                <Text style={[styles.timeText, { color: themeColors.textSecondary }]}>
                  {block.startTime} – {block.endTime}  ·  <NumberText style={styles.timeText}>{block.duration}</NumberText>m
                </Text>
              </View>
            )}

            {block.isAllDay && (
              <View style={styles.timeRow}>
                <Calendar size={16} color={themeColors.textSecondary} />
                <Text style={[styles.timeText, { color: themeColors.textSecondary }]}>
                  All-day event
                </Text>
              </View>
            )}

            {/* Location (if available) */}
            {block.notes && block.notes.includes('Location:') && (
              <View style={styles.locationRow}>
                <MapPin size={16} color={themeColors.textSecondary} />
                <Text style={[styles.locationText, { color: themeColors.textSecondary }]}>
                  {block.notes.split('Location:')[1].trim()}
                </Text>
              </View>
            )}

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

            {/* Event Details */}
            <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Event Details
              </Text>
              <Text style={[styles.detailsText, { color: themeColors.textSecondary }]}>
                {block.notes || 'No additional details available.'}
              </Text>
            </ScrollView>

            {/* Action */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
              onPress={handleOpenInCalendar}
            >
              <ExternalLink size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                Open in Calendar
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  card: {
    padding: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    fontFamily: Fonts.numericRegular,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailsContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    marginBottom: 10,
  },
  detailsText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
