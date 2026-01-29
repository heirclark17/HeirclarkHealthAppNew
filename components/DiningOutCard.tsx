import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { Colors, Fonts, Spacing } from '../constants/Theme';

const RESTAURANTS = [
  'Select a restaurant...',
  "McDonald's",
  'Starbucks',
  'Subway',
  'Chick-fil-A',
  'Taco Bell',
  "Wendy's",
  "Dunkin'",
  'Burger King',
  'Chipotle',
  'Sonic Drive-In',
  'Panera Bread',
  "Domino's Pizza",
  'Pizza Hut',
  'KFC',
  'Popeyes',
  "Arby's",
  "Jimmy John's",
  'Panda Express',
  'Five Guys',
  "Jersey Mike's",
  'Qdoba',
  "Raising Cane's",
  'Whataburger',
  'In-N-Out Burger',
  'Shake Shack',
];

const MEAL_TYPES = ['Any', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

export const DiningOutCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRestaurants, setShowRestaurants] = useState(false);
  const [showMealTypes, setShowMealTypes] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(RESTAURANTS[0]);
  const [selectedMealType, setSelectedMealType] = useState('Any');
  const [maxCalories, setMaxCalories] = useState('');

  const handleGetRecommendations = () => {
    if (selectedRestaurant === RESTAURANTS[0]) {
      Alert.alert('Select Restaurant', 'Please select a restaurant first.');
      return;
    }

    Alert.alert(
      'Coming Soon',
      `Restaurant recommendations for ${selectedRestaurant} will be available soon!`,
    );
  };

  return (
    <GlassCard style={styles.card} interactive>
      {/* Collapsible Header */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.header}
        accessible={true}
        accessibilityLabel={`Dining Out card, ${isExpanded ? 'expanded' : 'collapsed'}`}
        accessibilityHint="Tap to expand or collapse"
        accessibilityRole="button"
      >
        <View>
          <Text style={styles.sectionTitle}>DINING OUT</Text>
          <Text style={styles.subtitle}>Click to expand • Get restaurant recommendations</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.textMuted}
        />
      </TouchableOpacity>

      {/* Expandable Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Restaurant Selector */}
          <Text style={styles.label}>Restaurant</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowRestaurants(!showRestaurants)}
          >
            <Text style={[styles.pickerText, selectedRestaurant === RESTAURANTS[0] && styles.placeholder]}>
              {selectedRestaurant}
            </Text>
            <Text style={styles.arrow}>{showRestaurants ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showRestaurants && (
            <View style={styles.dropdown}>
              {RESTAURANTS.slice(1).map((restaurant, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedRestaurant(restaurant);
                    setShowRestaurants(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{restaurant}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Meal Type Selector */}
          <Text style={styles.label}>Meal Type (Optional)</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowMealTypes(!showMealTypes)}
          >
            <Text style={styles.pickerText}>{selectedMealType}</Text>
            <Text style={styles.arrow}>{showMealTypes ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showMealTypes && (
            <View style={styles.dropdown}>
              {MEAL_TYPES.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedMealType(type);
                    setShowMealTypes(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Max Calories Input */}
          <Text style={styles.label}>Max Calories</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter max calories"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={maxCalories}
            onChangeText={setMaxCalories}
          />

          {/* Get Recommendations Button */}
          <TouchableOpacity style={styles.button} onPress={handleGetRecommendations}>
            <Text style={styles.buttonText}>Get Recommendations</Text>
          </TouchableOpacity>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.sectionMargin,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  content: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
    fontFamily: Fonts.medium,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    padding: 14,
  },
  pickerText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.regular,
    flex: 1,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  arrow: {
    fontSize: 10,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  dropdown: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.regular,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.regular,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
});
