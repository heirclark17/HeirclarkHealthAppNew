/**
 * Restaurant Menu Card
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { UtensilsCrossed, ArrowRight, Lightbulb, X, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { GlassCard } from '../../GlassCard';
import { useGlassTheme } from '../../liquidGlass';
import { useRestaurantMenu } from '../../../contexts/RestaurantMenuContext';
import { useGoalWizard } from '../../../contexts/GoalWizardContext';
import { useMealPlan } from '../../../contexts/MealPlanContext';
import { Fonts } from '../../../constants/Theme';
import { generateRestaurantDishGuidance, RestaurantDishParams } from '../../../services/openaiService';

const CUISINE_TYPES = ['mexican', 'italian', 'asian', 'american', 'fastfood', 'general'];

export default function RestaurantMenuCard() {
  const { colors } = useGlassTheme();
  const { state, getRestaurantTips, getHealthyModifications, addRecentSearch } = useRestaurantMenu();

  const [showModal, setShowModal] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCuisineSelect = useCallback((cuisine: string) => {
    setSelectedCuisine(cuisine);
    addRecentSearch(cuisine);
  }, [addRecentSearch]);

  const tips = selectedCuisine ? getRestaurantTips(selectedCuisine) : [];
  const modifications = getHealthyModifications();

  return (
    <>
      <GlassCard variant="elevated" material="thick" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="restaurant" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Eating Out Guide</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Make healthier choices
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: colors.cardGlass }]}
            onPress={() => setShowModal(true)}
          >
            <Text style={[styles.viewButtonText, { color: colors.primary }]}>Tips</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Tips Preview */}
        <View style={[styles.tipsPreview, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name="bulb" size={16} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Tap to get healthy dining tips for any cuisine
          </Text>
        </View>

        {/* Cuisine Quick Select */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cuisineScroll}>
          {CUISINE_TYPES.map((cuisine) => (
            <TouchableOpacity
              key={cuisine}
              style={[styles.cuisineChip, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
              onPress={() => {
                handleCuisineSelect(cuisine);
                setShowModal(true);
              }}
            >
              <Text style={[styles.cuisineText, { color: colors.text }]}>
                {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </GlassCard>

      {/* Tips Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedCuisine
                ? `${selectedCuisine.charAt(0).toUpperCase() + selectedCuisine.slice(1)} Tips`
                : 'Restaurant Tips'}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.cardGlass }]}
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Cuisine Selector */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Cuisine</Text>
            <View style={styles.cuisineGrid}>
              {CUISINE_TYPES.map((cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.cuisineButton,
                    {
                      backgroundColor: selectedCuisine === cuisine ? colors.primary : colors.cardGlass,
                      borderColor: selectedCuisine === cuisine ? colors.primary : colors.glassBorder,
                    },
                  ]}
                  onPress={() => handleCuisineSelect(cuisine)}
                >
                  <Text style={{ color: selectedCuisine === cuisine ? '#FFF' : colors.text, fontSize: 13, fontFamily: Fonts.medium }}>
                    {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tips */}
            {selectedCuisine && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
                  Healthy Dining Tips
                </Text>
                {tips.map((tip, index) => (
                  <View key={index} style={[styles.tipItem, { backgroundColor: colors.cardGlass }]}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    <Text style={[styles.tipItemText, { color: colors.textSecondary }]}>{tip}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Modifications */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
              Ask for These Modifications
            </Text>
            <View style={styles.modificationList}>
              {modifications.map((mod, index) => (
                <View key={index} style={[styles.modChip, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.modText, { color: colors.primary }]}>{mod}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontFamily: Fonts.semiBold },
  subtitle: { fontSize: 12, fontFamily: Fonts.regular, marginTop: 2 },
  viewButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  viewButtonText: { fontSize: 13, fontFamily: Fonts.medium },
  tipsPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 12 },
  tipText: { flex: 1, fontSize: 12, fontFamily: Fonts.regular },
  cuisineScroll: { marginTop: 4 },
  cuisineChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1, marginRight: 8 },
  cuisineText: { fontSize: 12, fontFamily: Fonts.medium },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontFamily: Fonts.semiBold },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 15, fontFamily: Fonts.semiBold, marginBottom: 12 },
  cuisineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cuisineButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 10, marginBottom: 8 },
  tipItemText: { flex: 1, fontSize: 13, fontFamily: Fonts.regular, lineHeight: 18 },
  modificationList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  modText: { fontSize: 12, fontFamily: Fonts.medium },
});
