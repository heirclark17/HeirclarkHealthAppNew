import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { NumberText } from '../NumberText';
import { GroceryCategory, GroceryItem } from '../../types/mealPlan';
import { lightImpact, mediumImpact } from '../../utils/haptics';
import { useSettings } from '../../contexts/SettingsContext';
import { GlassCard } from '../GlassCard';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

// iOS 26 Liquid Glass spring configuration - removed shaded borders
const getGlassColors = (isDark: boolean) => ({
  background: isDark ? DarkColors.background : LightColors.background,
  card: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.75)',
  text: isDark ? DarkColors.text : LightColors.text,
  textMuted: isDark ? DarkColors.textMuted : LightColors.textMuted,
  textSecondary: isDark ? 'rgba(235, 235, 245, 0.4)' : 'rgba(60, 60, 67, 0.5)',
  checkbox: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
  checkboxChecked: isDark ? 'rgba(10, 132, 255, 0.9)' : 'rgba(0, 122, 255, 0.9)',
  checkboxText: '#FFFFFF',
  progressBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
  progressFill: isDark ? 'rgba(10, 132, 255, 0.9)' : 'rgba(0, 122, 255, 0.9)',
  buttonBg: isDark ? 'rgba(10, 132, 255, 0.9)' : 'rgba(0, 122, 255, 0.9)',
  buttonText: '#FFFFFF',
});

interface GroceryListModalProps {
  visible: boolean;
  onClose: () => void;
  groceryList: GroceryCategory[] | null;
  onToggleItem: (categoryIndex: number, itemIndex: number) => void;
  onDeleteItem: (categoryIndex: number, itemIndex: number) => void;
  onOrderInstacart: (filters?: { budgetTier?: 'low' | 'medium' | 'high'; dietary?: string[] }) => void;
  isLoading?: boolean;
  onGenerateList?: (budgetTier?: 'low' | 'medium' | 'high') => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Produce: '🥬',
  Protein: '🥩',
  Dairy: '🥛',
  Grains: '🌾',
  Pantry: '🥫',
  Spices: '🧂',
  Other: '📦',
};

const CheckboxItem = ({
  item,
  onToggle,
  onDelete,
  glassColors,
  isDark,
}: {
  item: GroceryItem;
  onToggle: () => void;
  onDelete: () => void;
  glassColors: ReturnType<typeof getGlassColors>;
  isDark: boolean;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    await lightImpact();
    scale.value = withSpring(0.95, GLASS_SPRING);
    setTimeout(() => {
      scale.value = withSpring(1, GLASS_SPRING);
    }, 100);
    onToggle();
  };

  const handleDelete = async () => {
    await mediumImpact();
    onDelete();
  };

  return (
    <Animated.View style={animatedStyle}>
      <GlassCard
        style={styles.itemRow}
        intensity={isDark ? 40 : 60}
        interactive
      >
        <Pressable
          onPress={handlePress}
          style={styles.itemRowInner}
        >
          <View style={[
            styles.checkbox,
            { borderColor: glassColors.checkbox },
            item.checked && {
              backgroundColor: glassColors.checkboxChecked,
              borderColor: glassColors.checkboxChecked
            },
          ]}>
            {item.checked && <Ionicons name="checkmark" size={14} color={glassColors.checkboxText} />}
          </View>
          <View style={styles.itemInfo}>
            <Text style={[
              styles.itemName,
              { color: glassColors.text },
              item.checked && { color: glassColors.textMuted, textDecorationLine: 'line-through' },
            ]}>
              {item.name}
            </Text>
            <Text style={[styles.itemAmount, { color: glassColors.textSecondary }]}>
              {item.totalAmount} {item.unit}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            accessibilityLabel={`Delete ${item.name}`}
            accessibilityRole="button"
            accessibilityHint="Removes this item from your grocery list"
          >
            <Ionicons name="trash-outline" size={18} color={glassColors.textMuted} />
          </TouchableOpacity>
        </Pressable>
      </GlassCard>
    </Animated.View>
  );
};

const CategorySection = ({
  category,
  categoryIndex,
  onToggleItem,
  onDeleteItem,
  glassColors,
  isDark,
}: {
  category: GroceryCategory;
  categoryIndex: number;
  onToggleItem: (categoryIndex: number, itemIndex: number) => void;
  onDeleteItem: (categoryIndex: number, itemIndex: number) => void;
  glassColors: ReturnType<typeof getGlassColors>;
  isDark: boolean;
}) => {
  const checkedCount = category.items.filter(item => item.checked).length;
  const totalCount = category.items.length;

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryIcon}>
          {CATEGORY_ICONS[category.category] || '📦'}
        </Text>
        <Text style={[styles.categoryTitle, { color: glassColors.text }]}>{category.category}</Text>
        <NumberText weight="regular" style={[styles.categoryCount, { color: glassColors.textMuted }]}>
          {checkedCount}/{totalCount}
        </NumberText>
      </View>
      {category.items.map((item, itemIndex) => (
        <CheckboxItem
          key={`${item.name}-${itemIndex}`}
          item={item}
          onToggle={() => onToggleItem(categoryIndex, itemIndex)}
          onDelete={() => onDeleteItem(categoryIndex, itemIndex)}
          glassColors={glassColors}
          isDark={isDark}
        />
      ))}
    </View>
  );
};

export function GroceryListModal({
  visible,
  onClose,
  groceryList,
  onToggleItem,
  onDeleteItem,
  onOrderInstacart,
  isLoading = false,
  onGenerateList,
}: GroceryListModalProps) {
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  // Dynamic theme colors
  const isDark = useMemo(() => settings.themeMode === 'dark', [settings.themeMode]);
  const glassColors = useMemo(() => getGlassColors(isDark), [isDark]);

  // Budget tier selection
  const [budgetTier, setBudgetTier] = React.useState<'low' | 'medium' | 'high'>('medium');

  // Dietary filters selection
  const [dietaryFilters, setDietaryFilters] = React.useState<string[]>([]);

  // Auto-generate grocery list when modal opens (if not already generated)
  React.useEffect(() => {
    if (visible && !groceryList && !isLoading && onGenerateList) {
      console.log('[GroceryListModal] Auto-generating grocery list with budget:', budgetTier);
      onGenerateList(budgetTier);
    }
  }, [visible]);

  // Regenerate grocery list when budget tier changes (after initial generation)
  React.useEffect(() => {
    if (groceryList && onGenerateList && !isLoading) {
      console.log('[GroceryListModal] Budget tier changed to:', budgetTier, '- Regenerating grocery list...');
      onGenerateList(budgetTier);
    }
  }, [budgetTier]);

  // Button animation
  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleInstacartPress = async () => {
    await mediumImpact();
    buttonScale.value = withSpring(0.95, GLASS_SPRING);
    setTimeout(() => {
      buttonScale.value = withSpring(1, GLASS_SPRING);
    }, 100);
    onOrderInstacart({ budgetTier, dietary: dietaryFilters });
  };

  const toggleDietaryFilter = (filter: string) => {
    setDietaryFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const totalItems = groceryList ? groceryList.reduce((acc, cat) => acc + cat.items.length, 0) : 0;
  const checkedItems = groceryList ? groceryList.reduce(
    (acc, cat) => acc + cat.items.filter(item => item.checked).length,
    0
  ) : 0;
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  const availableDietaryFilters = ['organic', 'gluten-free', 'vegan', 'vegetarian'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: glassColors.background }]}>
        {/* Header with Glass Effect */}
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={styles.header}
        >
          <Animated.View entering={FadeIn.delay(100)} style={styles.headerContent}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close grocery list"
              accessibilityRole="button"
              accessibilityHint="Dismisses the grocery list and returns to meal plan"
            >
              <Text style={[styles.closeButtonText, { color: glassColors.checkboxChecked }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: glassColors.text }]}>Grocery List</Text>
            <View style={styles.placeholder} />
          </Animated.View>
        </BlurView>

        {/* Empty State or Generate Button */}
        {!groceryList && !isLoading && onGenerateList && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: glassColors.textMuted }]}>
              No grocery list yet
            </Text>
            <GlassCard style={styles.generateButtonGlass} intensity={isDark ? 60 : 80} interactive>
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: glassColors.buttonBg }]}
                onPress={() => onGenerateList(budgetTier)}
                accessibilityLabel="Generate grocery list from meal plan"
                accessibilityRole="button"
                accessibilityHint="Creates a categorized grocery list with all ingredients from your 7-day meal plan"
              >
                <Text style={[styles.generateButtonText, { color: glassColors.buttonText }]}>
                  Generate Grocery List
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingState}>
            <Text style={[styles.loadingText, { color: glassColors.textMuted }]}>
              Generating grocery list...
            </Text>
          </View>
        )}

        {/* Budget Tier Selector */}
        {groceryList && !isLoading && (
          <Animated.View
            entering={FadeIn.delay(150)}
            style={styles.filtersSection}
          >
            <Text style={[styles.filterLabel, { color: glassColors.text }]}>Budget Tier</Text>
            <View style={styles.budgetTierRow}>
              {['low', 'medium', 'high'].map((tier) => (
                <GlassCard
                  key={tier}
                  style={[
                    styles.budgetTierButton,
                    budgetTier === tier && {
                      backgroundColor: glassColors.checkboxChecked,
                    },
                  ]}
                  intensity={budgetTier === tier ? 80 : (isDark ? 40 : 60)}
                  interactive
                >
                  <TouchableOpacity
                    style={styles.budgetTierInner}
                    onPress={() => setBudgetTier(tier as 'low' | 'medium' | 'high')}
                    accessibilityLabel={`${tier.charAt(0).toUpperCase() + tier.slice(1)} budget tier${budgetTier === tier ? ', currently selected' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: budgetTier === tier }}
                    accessibilityHint={`Selects ${tier} budget tier for grocery shopping recommendations`}
                  >
                    <Text
                      style={[
                        styles.budgetTierText,
                        { color: budgetTier === tier ? glassColors.buttonText : glassColors.text },
                        budgetTier === tier && { fontFamily: Fonts.semiBold },
                      ]}
                    >
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </Text>
                  </TouchableOpacity>
                </GlassCard>
              ))}
            </View>

            <Text style={[styles.filterLabel, { color: glassColors.text, marginTop: 12 }]}>
              Dietary Preferences
            </Text>
            <View style={styles.dietaryFiltersRow}>
              {availableDietaryFilters.map((filter) => (
                <GlassCard
                  key={filter}
                  style={[
                    styles.dietaryFilterChip,
                    dietaryFilters.includes(filter) && {
                      backgroundColor: glassColors.checkboxChecked,
                    },
                  ]}
                  intensity={dietaryFilters.includes(filter) ? 80 : (isDark ? 40 : 60)}
                  interactive
                >
                  <TouchableOpacity
                    style={styles.dietaryFilterInner}
                    onPress={() => toggleDietaryFilter(filter)}
                    accessibilityLabel={`${filter.charAt(0).toUpperCase() + filter.slice(1)}${dietaryFilters.includes(filter) ? ', selected' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: dietaryFilters.includes(filter) }}
                    accessibilityHint={`${dietaryFilters.includes(filter) ? 'Removes' : 'Adds'} ${filter} dietary preference filter for grocery shopping`}
                  >
                    <Text
                      style={[
                        styles.dietaryFilterText,
                        { color: dietaryFilters.includes(filter) ? glassColors.buttonText : glassColors.text },
                        dietaryFilters.includes(filter) && { fontFamily: Fonts.semiBold },
                      ]}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                </GlassCard>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Progress Section */}
        {groceryList && !isLoading && (
          <Animated.View
            entering={FadeIn.delay(200)}
            style={styles.progressSection}
          >
            <GlassCard style={styles.progressCard} intensity={isDark ? 40 : 60}>
              <View style={[styles.progressBar, { backgroundColor: glassColors.progressBg }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { width: `${progress}%`, backgroundColor: glassColors.progressFill },
                  ]}
                />
                {/* Glass highlight */}
                <View style={styles.progressHighlight} />
              </View>
              <NumberText weight="regular" style={[styles.progressText, { color: glassColors.textMuted }]}>
                {checkedItems} of {totalItems} items checked
              </NumberText>
            </GlassCard>
          </Animated.View>
        )}

        {/* Grocery list */}
        {groceryList && !isLoading && (
          <ScrollView
            style={styles.listContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {groceryList.map((category, categoryIndex) => (
              <Animated.View
                key={category.category}
                entering={SlideInUp.delay(300 + categoryIndex * 50).springify()}
              >
                <CategorySection
                  category={category}
                  categoryIndex={categoryIndex}
                  onToggleItem={onToggleItem}
                  onDeleteItem={onDeleteItem}
                  glassColors={glassColors}
                  isDark={isDark}
                />
              </Animated.View>
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        {/* Instacart button with Glass Effect */}
        {groceryList && groceryList.length > 0 && !isLoading && (
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}
          >
            <Animated.View entering={SlideInUp.delay(500).springify()} style={buttonAnimatedStyle}>
              <TouchableOpacity
                style={[styles.instacartButton, {
                  backgroundColor: glassColors.buttonBg,
                }]}
                onPress={handleInstacartPress}
                activeOpacity={1}
                accessibilityLabel={`Order ${totalItems} grocery items with Instacart`}
                accessibilityRole="button"
                accessibilityHint="Opens Instacart with your grocery list pre-filled for delivery"
              >
                <Text style={styles.instacartIcon}>🛒</Text>
                <Text style={[styles.instacartButtonText, { color: glassColors.buttonText }]}>
                  Order with Instacart
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    // No border - frosted glass only
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  placeholder: {
    width: 60,
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  progressCard: {
    padding: 16,
    borderRadius: Spacing.borderRadius,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressHighlight: {
    position: 'absolute',
    top: 1,
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 1,
  },
  progressText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    flex: 1,
  },
  categoryCount: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  itemRow: {
    borderRadius: 16,
    marginBottom: 8,
  },
  itemRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  itemRowChecked: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    marginBottom: 2,
  },
  itemAmount: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  instacartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: Spacing.borderRadius,
    gap: 8,
  },
  instacartIcon: {
    fontSize: 20,
  },
  instacartButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    marginBottom: 16,
    textAlign: 'center',
  },
  generateButtonGlass: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  generateButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  loadingState: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetTierRow: {
    flexDirection: 'row',
    gap: 8,
  },
  budgetTierButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  budgetTierInner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  budgetTierText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  dietaryFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryFilterChip: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  dietaryFilterInner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dietaryFilterText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
});

export default GroceryListModal;
