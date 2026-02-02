import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function DebugClearScreen() {
  const clearAllLoadingStates = async () => {
    try {
      console.log('🔧 Clearing all loading states...');

      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      console.log('📦 Found keys:', keys);

      // Clear known loading state keys
      const keysToCheck = [
        'hc_meal_plan_state',
        'hc_training_state',
        'hc_goal_wizard_progress',
        'hc_fasting_timer',
        'hc_workout_tracking',
      ];

      for (const key of keysToCheck) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            console.log(`📄 Checking ${key}:`, parsed);

            // Clear loading flags
            if (parsed.isGenerating !== undefined) parsed.isGenerating = false;
            if (parsed.isLoading !== undefined) parsed.isLoading = false;
            if (parsed.isSaving !== undefined) parsed.isSaving = false;
            if (parsed.error) parsed.error = null;

            await AsyncStorage.setItem(key, JSON.stringify(parsed));
            console.log(`✅ Cleared ${key}`);
          } catch (e) {
            console.error(`❌ Error parsing ${key}:`, e);
          }
        }
      }

      Alert.alert(
        'Success',
        'Cleared all loading states. Pull down to refresh or restart the app.',
        [
          {
            text: 'Go to Home',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error clearing states:', error);
      Alert.alert('Error', 'Failed to clear states: ' + error.message);
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data?',
      'This will delete ALL app data including goals, preferences, and history. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'All data cleared. Restart the app.', [
              { text: 'OK', onPress: () => router.replace('/(tabs)') },
            ]);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Menu</Text>
      <Text style={styles.subtitle}>App stuck in loading state?</Text>

      <TouchableOpacity style={styles.button} onPress={clearAllLoadingStates}>
        <Text style={styles.buttonText}>Clear Loading States</Text>
        <Text style={styles.buttonSubtext}>Keeps your data, clears stuck states</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAllData}>
        <Text style={styles.buttonText}>Clear ALL Data (Nuclear)</Text>
        <Text style={styles.buttonSubtext}>⚠️ Deletes everything!</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    padding: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
});
