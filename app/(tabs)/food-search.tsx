/**
 * Food Search Screen
 * Search 3M+ foods from USDA + Open Food Facts database
 * Includes barcode scanning for quick food lookup
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { api } from '../../services/api';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../../components/GlassCard';

interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string;
  serving_unit?: string;
  barcode?: string;
}

export default function FoodSearchScreen() {
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'chicken breast',
    'brown rice',
    'avocado',
    'salmon',
    'greek yogurt',
  ]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    Keyboard.dismiss();

    try {
      const results = await api.searchFood(query);
      setSearchResults(results || []);

      // Add to recent searches if not already there
      if (!recentSearches.includes(query.toLowerCase())) {
        setRecentSearches(prev => [query.toLowerCase(), ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Food search error:', error);
      Alert.alert('Search Error', 'Failed to search for foods. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [recentSearches]);

  // Handle barcode scan
  const handleBarcodeScan = useCallback(async (data: string) => {
    setShowScanner(false);
    setIsSearching(true);
    setHasSearched(true);

    try {
      const result = await api.getFoodByBarcode(data);
      if (result) {
        setSearchResults([result]);
      } else {
        Alert.alert('Not Found', 'This product was not found in our database.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      Alert.alert('Scan Error', 'Failed to look up barcode. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle add to meal log
  const handleAddFood = useCallback(async (food: FoodItem) => {
    try {
      await api.logMeal({
        date: new Date().toISOString().split('T')[0],
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        mealType: 'snack', // Default, user can change
        source: 'food-search',
      });
      Alert.alert('Added!', `${food.name} has been logged.`);
    } catch (error) {
      console.error('Error logging food:', error);
      Alert.alert('Error', 'Failed to log food. Please try again.');
    }
  }, []);

  // Open barcode scanner
  const openScanner = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in settings to scan barcodes.'
        );
        return;
      }
    }
    setShowScanner(true);
  }, [permission, requestPermission]);

  // Render food item
  const renderFoodItem = useCallback(({ item }: { item: FoodItem }) => (
    <GlassCard
      style={[
        styles.foodCard,
        { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' }
      ]}
      interactive
    >
      <TouchableOpacity
        style={styles.foodCardContent}
        onPress={() => handleAddFood(item)}
        activeOpacity={0.7}
      >
        <View style={styles.foodInfo}>
          <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.brand && (
            <Text style={[styles.foodBrand, { color: colors.textMuted }]} numberOfLines={1}>
              {item.brand}
            </Text>
          )}
          {item.serving_size && (
            <Text style={[styles.servingInfo, { color: colors.textMuted }]}>
              {item.serving_size} {item.serving_unit || 'g'}
            </Text>
          )}
        </View>
        <View style={styles.nutritionInfo}>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.text }]}>{item.calories}</Text>
              <Text style={[styles.macroLabel, { color: colors.textMuted }]}>cal</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#60a5fa' }]}>{item.protein}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textMuted }]}>P</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#fbbf24' }]}>{item.carbs}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textMuted }]}>C</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#f472b6' }]}>{item.fat}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textMuted }]}>F</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)' }]}
            onPress={() => handleAddFood(item)}
          >
            <Ionicons name="add" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </GlassCard>
  ), [colors, isDark, handleAddFood]);

  // Render barcode scanner
  if (showScanner) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={({ data }) => handleBarcodeScan(data)}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
          }}
        />
        <SafeAreaView style={styles.scannerOverlay}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowScanner(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Barcode</Text>
            <View style={{ width: 44 }} />
          </View>
          <View style={styles.scannerTarget}>
            <View style={[styles.targetCorner, styles.topLeft]} />
            <View style={[styles.targetCorner, styles.topRight]} />
            <View style={[styles.targetCorner, styles.bottomLeft]} />
            <View style={[styles.targetCorner, styles.bottomRight]} />
          </View>
          <Text style={styles.scannerHint}>
            Position barcode within the frame
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Food Search</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Search 3M+ foods or scan barcode
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchInputContainer,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            }
          ]}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search foods..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.scanButton,
              { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)' }
            ]}
            onPress={openScanner}
          >
            <Ionicons name="barcode-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Recent Searches - Show when no results */}
        {!hasSearched && !isSearching && (
          <View style={styles.recentSection}>
            <Text style={[styles.recentTitle, { color: colors.textMuted }]}>
              Popular Searches
            </Text>
            <View style={styles.recentChips}>
              {recentSearches.map((term, index) => (
                <TouchableOpacity
                  key={`${term}-${index}`}
                  style={[
                    styles.recentChip,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                    }
                  ]}
                  onPress={() => {
                    setSearchQuery(term);
                    handleSearch(term);
                  }}
                >
                  <Text style={[styles.recentChipText, { color: colors.text }]}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Loading State */}
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Searching foods...
            </Text>
          </View>
        )}

        {/* Search Results */}
        {!isSearching && hasSearched && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderFoodItem}
            contentContainerStyle={[
              styles.resultsList,
              { paddingBottom: insets.bottom + 160 }
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No foods found
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                  Try a different search term or scan a barcode
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.thin,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentSection: {
    paddingHorizontal: 16,
  },
  recentTitle: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  recentChipText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  resultsList: {
    paddingHorizontal: 16,
  },
  foodCard: {
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  foodCardContent: {
    flexDirection: 'row',
    padding: 14,
  },
  foodInfo: {
    flex: 1,
    marginRight: 12,
  },
  foodName: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  foodBrand: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginBottom: 2,
  },
  servingInfo: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  nutritionInfo: {
    alignItems: 'flex-end',
    gap: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroItem: {
    alignItems: 'center',
    minWidth: 36,
  },
  macroValue: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  macroLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: '#fff',
  },
  scannerTarget: {
    width: 280,
    height: 160,
    alignSelf: 'center',
    position: 'relative',
  },
  targetCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  scannerHint: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 40,
  },
});
