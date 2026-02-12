/**
 * BudgetTierSelector Component
 * Allows users to select budget tier (budget/moderate/premium) for meal planning
 * and optionally enter pantry items for cost savings
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../GlassCard';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';
import { BudgetTier, PantryItem } from '../../types/mealPlan';

export type BudgetTierType = 'budget' | 'moderate' | 'premium';

interface BudgetTierSelectorProps {
  selectedTier: BudgetTierType;
  onSelectTier: (tier: BudgetTierType) => void;
  pantryItems: PantryItem[];
  onPantryItemsChange: (items: PantryItem[]) => void;
  showPantryInput?: boolean;
}

const BUDGET_TIERS: { type: BudgetTierType; label: string; description: string; icon: string; weeklyRange: string }[] = [
  {
    type: 'budget',
    label: 'Budget',
    description: 'Cost-effective meals',
    icon: 'wallet-outline',
    weeklyRange: '$50-75/week',
  },
  {
    type: 'moderate',
    label: 'Moderate',
    description: 'Balanced variety',
    icon: 'basket-outline',
    weeklyRange: '$75-125/week',
  },
  {
    type: 'premium',
    label: 'Premium',
    description: 'High-quality ingredients',
    icon: 'diamond-outline',
    weeklyRange: '$125-200/week',
  },
];

export function BudgetTierSelector({
  selectedTier,
  onSelectTier,
  pantryItems,
  onPantryItemsChange,
  showPantryInput = true,
}: BudgetTierSelectorProps) {
  const { settings } = useSettings();
  const [newPantryItem, setNewPantryItem] = useState('');
  const [showPantrySection, setShowPantrySection] = useState(false);

  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const handleAddPantryItem = () => {
    if (newPantryItem.trim()) {
      const item: PantryItem = {
        name: newPantryItem.trim(),
        quantity: 1,
        unit: 'item',
      };
      onPantryItemsChange([...pantryItems, item]);
      setNewPantryItem('');
    }
  };

  const handleRemovePantryItem = (index: number) => {
    const updated = pantryItems.filter((_, i) => i !== index);
    onPantryItemsChange(updated);
  };

  return (
    <View style={styles.container}>
      {/* Budget Tier Selection */}
      <Text style={[styles.label, { color: colors.text }]}>Budget Preference</Text>
      <View style={styles.tiersRow}>
        {BUDGET_TIERS.map((tier) => {
          const isSelected = selectedTier === tier.type;
          return (
            <TouchableOpacity
              key={tier.type}
              style={[
                styles.tierCard,
                {
                  backgroundColor: isSelected
                    ? (isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)')
                    : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                  borderColor: isSelected
                    ? (isDark ? colors.accentPurple : colors.accentPurple)
                    : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
                },
              ]}
              onPress={() => onSelectTier(tier.type)}
              activeOpacity={0.7}
              accessibilityLabel={`${tier.label} budget tier: ${tier.weeklyRange}${isSelected ? ', currently selected' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityHint={`Sets meal plan budget to ${tier.label.toLowerCase()} tier with ${tier.description.toLowerCase()}`}
            >
              <View style={[
                styles.tierIconContainer,
                {
                  backgroundColor: isSelected
                    ? (isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)')
                    : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                },
              ]}>
                <Ionicons
                  name={tier.icon as any}
                  size={20}
                  color={isSelected ? colors.accentPurple : colors.textMuted}
                />
              </View>
              <Text style={[
                styles.tierLabel,
                { color: isSelected ? (isDark ? '#a5b4fc' : colors.accentPurple) : colors.text },
              ]}>
                {tier.label}
              </Text>
              <Text style={[styles.tierPrice, { color: colors.textMuted }]}>
                {tier.weeklyRange}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.accentPurple} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Pantry Items Section */}
      {showPantryInput && (
        <View style={styles.pantrySection}>
          <TouchableOpacity
            style={styles.pantryHeader}
            onPress={() => setShowPantrySection(!showPantrySection)}
            activeOpacity={0.7}
            accessibilityLabel={`Pantry items${pantryItems.length > 0 ? `, ${pantryItems.length} items added` : ''}${showPantrySection ? ', expanded' : ', collapsed'}`}
            accessibilityRole="button"
            accessibilityState={{ expanded: showPantrySection }}
            accessibilityHint={`${showPantrySection ? 'Collapses' : 'Expands'} the pantry items section to ${showPantrySection ? 'hide' : 'show'} items you already have at home`}
          >
            <View style={styles.pantryHeaderLeft}>
              <Ionicons
                name="cube-outline"
                size={18}
                color={colors.textMuted}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.pantryLabel, { color: colors.text }]}>
                Pantry Items
              </Text>
              {pantryItems.length > 0 && (
                <View style={[styles.pantryBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)' }]}>
                  <Text style={[styles.pantryBadgeText, { color: isDark ? '#a5b4fc' : colors.accentPurple }]}>
                    {pantryItems.length}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.pantryHeaderRight}>
              <Text style={[styles.pantrySavingsHint, { color: colors.textMuted }]}>
                Save on groceries
              </Text>
              <Ionicons
                name={showPantrySection ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </View>
          </TouchableOpacity>

          {showPantrySection && (
            <View style={styles.pantryContent}>
              <Text style={[styles.pantryDesc, { color: colors.textMuted }]}>
                Add items you already have. We'll create recipes using them to save money.
              </Text>

              {/* Input Row */}
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.pantryInput,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g., chicken, rice, eggs..."
                  placeholderTextColor={colors.textMuted}
                  value={newPantryItem}
                  onChangeText={setNewPantryItem}
                  onSubmitEditing={handleAddPantryItem}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: newPantryItem.trim()
                        ? (isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)')
                        : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                    },
                  ]}
                  onPress={handleAddPantryItem}
                  disabled={!newPantryItem.trim()}
                  activeOpacity={0.7}
                  accessibilityLabel={newPantryItem.trim() ? `Add ${newPantryItem} to pantry` : 'Add pantry item'}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !newPantryItem.trim() }}
                  accessibilityHint="Adds the entered item to your pantry list for meal planning cost savings"
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={newPantryItem.trim() ? colors.accentPurple : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Pantry Items List */}
              {pantryItems.length > 0 && (
                <View style={styles.pantryList}>
                  {pantryItems.map((item, index) => (
                    <View
                      key={`${item.name}-${index}`}
                      style={[
                        styles.pantryItem,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                    >
                      <Text style={[styles.pantryItemText, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemovePantryItem(index)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={`Remove ${item.name} from pantry`}
                        accessibilityRole="button"
                        accessibilityHint={`Removes ${item.name} from your pantry item list`}
                      >
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 10,
  },
  tiersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tierCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
  },
  tierIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tierLabel: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginBottom: 2,
  },
  tierPrice: {
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  pantrySection: {
    marginTop: 16,
  },
  pantryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  pantryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pantryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pantryLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  pantryBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pantryBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  pantrySavingsHint: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  pantryContent: {
    marginTop: 8,
  },
  pantryDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pantryInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pantryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pantryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  pantryItemText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
});
