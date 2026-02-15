/**
 * CalendarSyncButton - Manual calendar sync trigger
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CalendarSync } from 'lucide-react-native';
import { Colors } from '../../../constants/Theme';

interface Props {
  onPress: () => void;
  loading: boolean;
}

export function CalendarSyncButton({ onPress, loading }: Props) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <CalendarSync size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
