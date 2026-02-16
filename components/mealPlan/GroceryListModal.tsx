import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Leaf, Beef, Milk, Wheat, Package, Flame, Box, ShoppingCart, Carrot } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
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

const getCategoryIcon = (category: string, color: string, size: number = 18) => {
  const iconProps = { size, color, strokeWidth: 2 };

  switch (category) {
    case 'Produce':
      return <Leaf {...iconProps} color="#4CAF50" />;
    case 'Protein':
      return <Beef {...iconProps} color="#E91E63" />;
    case 'Dairy':
      return <Milk {...iconProps} color="#2196F3" />;
    case 'Grains':
      return <Wheat {...iconProps} color="#FF9800" />;
    case 'Pantry':
      return <Package {...iconProps} color="#795548" />;
    case 'Spices':
      return <Flame {...iconProps} color="#FF5722" />;
    default:
      return <Box {...iconProps} color="#9E9E9E" />;
  }
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
            <Ionicons name="trash-outline" size={18} color={isDark ? '#FF8A80' : '#FF6B6B'} />
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
        <View style={styles.categoryIconContainer}>
          {getCategoryIcon(category.category, glassColors.text)}
        </View>
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
    console.log('[GroceryListModal] 🔍 useEffect triggered:', {
      visible,
      hasGroceryList: !!groceryList,
      isLoading,
      hasGenerateFunction: !!onGenerateList,
      budgetTier
    });

    if (visible && !groceryList && !isLoading && onGenerateList) {
      console.log('[GroceryListModal] ✅ Auto-generating grocery list with budget:', budgetTier);
      onGenerateList(budgetTier);
    } else {
      console.log('[GroceryListModal] ⚠️ Conditions not met for auto-generation');
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
            {groceryList && groceryList.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  // Toggle select all/deselect all
                  const allChecked = checkedItems === totalItems;
                  groceryList.forEach((category, catIndex) => {
                    category.items.forEach((item, itemIndex) => {
                      if (item.checked === allChecked) {
                        onToggleItem(catIndex, itemIndex);
                      }
                    });
                  });
                }}
                style={styles.closeButton}
                accessibilityLabel={checkedItems === totalItems ? "Deselect all items" : "Select all items"}
                accessibilityRole="button"
                accessibilityHint={checkedItems === totalItems ? "Unchecks all grocery items" : "Checks all grocery items"}
              >
                <Text style={[styles.closeButtonText, { color: glassColors.checkboxChecked }]}>
                  {checkedItems === totalItems ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            )}
            {(!groceryList || groceryList.length === 0) && <View style={styles.placeholder} />}
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

        {/* Loading State - AI Fetching Recipes */}
        {isLoading && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.loadingContainer}
          >
            <GlassCard
              style={styles.loadingCard}
              intensity={isDark ? 60 : 80}
            >
              {/* Animated Activity Indicator */}
              <View style={styles.loadingIconContainer}>
                <ActivityIndicator
                  size="large"
                  color={glassColors.checkboxChecked}
                />
              </View>

              {/* Loading Title */}
              <Text style={[styles.loadingTitle, { color: glassColors.text }]}>
                Fetching Recipes for Entire Week
              </Text>

              {/* Loading Description */}
              <Text style={[styles.loadingDescription, { color: glassColors.textMuted }]}>
                AI is generating detailed ingredient lists for all 7 days with {budgetTier} budget ingredients...
              </Text>

              {/* Animated Steps */}
              <View style={styles.loadingSteps}>
                <Animated.View
                  entering={FadeIn.delay(300)}
                  style={styles.loadingStep}
                >
                  <View style={[styles.loadingStepDot, { backgroundColor: glassColors.checkboxChecked }]} />
                  <Text style={[styles.loadingStepText, { color: glassColors.textSecondary }]}>
                    Analyzing meal plan structure
                  </Text>
                </Animated.View>

                <Animated.View
                  entering={FadeIn.delay(600)}
                  style={styles.loadingStep}
                >
                  <View style={[styles.loadingStepDot, { backgroundColor: glassColors.checkboxChecked }]} />
                  <Text style={[styles.loadingStepText, { color: glassColors.textSecondary }]}>
                    Fetching recipes from AI
                  </Text>
                </Animated.View>

                <Animated.View
                  entering={FadeIn.delay(900)}
                  style={styles.loadingStep}
                >
                  <View style={[styles.loadingStepDot, { backgroundColor: glassColors.checkboxChecked }]} />
                  <Text style={[styles.loadingStepText, { color: glassColors.textSecondary }]}>
                    Aggregating ingredients
                  </Text>
                </Animated.View>

                <Animated.View
                  entering={FadeIn.delay(1200)}
                  style={styles.loadingStep}
                >
                  <View style={[styles.loadingStepDot, { backgroundColor: glassColors.checkboxChecked }]} />
                  <Text style={[styles.loadingStepText, { color: glassColors.textSecondary }]}>
                    Categorizing grocery items
                  </Text>
                </Animated.View>
              </View>

              {/* Tip */}
              <View style={[styles.loadingTip, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)' }]}>
                <Ionicons name="bulb-outline" size={16} color={glassColors.checkboxChecked} />
                <Text style={[styles.loadingTipText, { color: glassColors.textMuted }]}>
                  This usually takes 10-20 seconds. Check your console for detailed progress!
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Budget Tier Card */}
        {groceryList && !isLoading && (
          <Animated.View
            entering={FadeIn.delay(150)}
            style={styles.budgetCard}
          >
            <GlassCard intensity={isDark ? 60 : 80} style={styles.filtersCardInner}>
              <View style={styles.filterSection}>
                <Text style={[styles.compactFilterLabel, { color: glassColors.text }]}>
                  Budget
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillScrollContainer}
                >
                  {['low', 'medium', 'high'].map((tier) => (
                    <TouchableOpacity
                      key={tier}
                      style={[
                        styles.compactPillButton,
                        {
                          backgroundColor: budgetTier === tier
                            ? glassColors.checkboxChecked
                            : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                      onPress={() => setBudgetTier(tier as 'low' | 'medium' | 'high')}
                      accessibilityLabel={`${tier.charAt(0).toUpperCase() + tier.slice(1)} budget tier`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: budgetTier === tier }}
                    >
                      <Text
                        style={[
                          styles.compactPillText,
                          { color: budgetTier === tier ? glassColors.buttonText : glassColors.text },
                          budgetTier === tier && { fontFamily: Fonts.semiBold },
                        ]}
                      >
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Dietary Preferences Card */}
        {groceryList && !isLoading && (
          <Animated.View
            entering={FadeIn.delay(200)}
            style={styles.dietaryCard}
          >
            <GlassCard intensity={isDark ? 60 : 80} style={styles.filtersCardInner}>
              <View style={styles.filterSection}>
                <Text style={[styles.compactFilterLabel, { color: glassColors.text }]}>
                  Dietary
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillScrollContainer}
                >
                  {availableDietaryFilters.map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.compactPillButton,
                        {
                          backgroundColor: dietaryFilters.includes(filter)
                            ? glassColors.checkboxChecked
                            : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                      onPress={() => toggleDietaryFilter(filter)}
                      accessibilityLabel={`${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: dietaryFilters.includes(filter) }}
                    >
                      <Text
                        style={[
                          styles.compactPillText,
                          { color: dietaryFilters.includes(filter) ? glassColors.buttonText : glassColors.text },
                          dietaryFilters.includes(filter) && { fontFamily: Fonts.semiBold },
                        ]}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Progress Section - iOS 26 Design */}
        {groceryList && !isLoading && (
          <Animated.View
            entering={FadeIn.delay(200)}
            style={styles.progressSection}
          >
            <GlassCard style={styles.progressCard} intensity={isDark ? 35 : 55}>
              <View style={styles.progressContent}>
                {/* Circular Progress Ring */}
                <View style={styles.circularProgressContainer}>
                  <Svg width={56} height={56}>
                    {/* Background Circle */}
                    <Circle
                      cx={28}
                      cy={28}
                      r={24}
                      stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}
                      strokeWidth={5}
                      fill="none"
                    />
                    {/* Progress Circle */}
                    <Circle
                      cx={28}
                      cy={28}
                      r={24}
                      stroke={progress === 100 ? (isDark ? '#4CAF50' : '#66BB6A') : (isDark ? '#0A84FF' : '#007AFF')}
                      strokeWidth={5}
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      rotation="-90"
                      origin="28, 28"
                    />
                  </Svg>
                  {/* Center Content */}
                  <View style={styles.circularProgressCenter}>
                    {progress === 100 ? (
                      <Ionicons name="checkmark-circle" size={26} color={isDark ? '#4CAF50' : '#66BB6A'} />
                    ) : (
                      <NumberText weight="semibold" style={[styles.progressPercentage, { color: glassColors.text }]}>
                        {Math.round(progress)}%
                      </NumberText>
                    )}
                  </View>
                </View>

                {/* Text Content */}
                <View style={styles.progressTextContainer}>
                  <Text style={[styles.progressTitle, { color: glassColors.text }]}>
                    {progress === 100 ? 'All Done!' : 'Shopping Progress'}
                  </Text>
                  <View style={styles.progressStats}>
                    <NumberText weight="semibold" style={[styles.progressNumbers, { color: isDark ? '#0A84FF' : '#007AFF' }]}>
                      {checkedItems}
                    </NumberText>
                    <Text style={[styles.progressSeparator, { color: glassColors.textMuted }]}>
                      {' / '}
                    </Text>
                    <NumberText weight="regular" style={[styles.progressNumbers, { color: glassColors.textMuted }]}>
                      {totalItems}
                    </NumberText>
                    <Text style={[styles.progressLabel, { color: glassColors.textMuted }]}>
                      {' items'}
                    </Text>
                  </View>
                </View>
              </View>
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
            <View style={{ height: 280 }} />
          </ScrollView>
        )}

        {/* Sticky Instacart button - Carrot Icon Only */}
        {groceryList && groceryList.length > 0 && !isLoading && (
          <Animated.View
            entering={SlideInUp.delay(300).springify()}
            style={[styles.instacartButtonContainer, { paddingBottom: insets.bottom + 8 }]}
          >
            <TouchableOpacity
              onPress={handleInstacartPress}
              activeOpacity={0.7}
              style={[styles.instacartCircleButton, buttonAnimatedStyle]}
              accessibilityLabel={`Order ${totalItems} grocery items with Instacart`}
              accessibilityRole="button"
              accessibilityHint="Opens Instacart with your grocery list pre-filled for delivery"
            >
              <LinearGradient
                colors={isDark
                  ? ['rgba(255, 140, 0, 0.15)', 'rgba(255, 184, 77, 0.12)', 'rgba(76, 175, 80, 0.15)']
                  : ['rgba(255, 152, 0, 0.12)', 'rgba(255, 167, 38, 0.10)', 'rgba(102, 187, 106, 0.12)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.circleGradient}
              >
                <Carrot size={24} color={isDark ? '#FF8C00' : '#FF9800'} strokeWidth={2} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
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
    paddingTop: 8,
    paddingBottom: 6,
  },
  progressCard: {
    padding: 14,
    borderRadius: Spacing.borderRadius,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  circularProgressContainer: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  circularProgressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 15,
    fontFamily: Fonts.numericSemiBold,
  },
  progressTextContainer: {
    flex: 1,
    gap: 2,
  },
  progressTitle: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    marginBottom: 1,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressNumbers: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
  },
  progressSeparator: {
    fontSize: 15,
    fontFamily: Fonts.numericRegular,
  },
  progressLabel: {
    fontSize: 15,
    fontFamily: Fonts.regular,
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
  categoryIconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  instacartButtonContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 999,
    elevation: 10,
  },
  instacartCircleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: Spacing.borderRadius * 1.5,
    alignItems: 'center',
  },
  loadingIconContainer: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loadingSteps: {
    width: '100%',
    marginBottom: 20,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 8,
  },
  loadingStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  loadingStepText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    flex: 1,
  },
  loadingTip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  loadingTipText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    flex: 1,
    lineHeight: 16,
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
  dietaryFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  pillText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  // Compact Filters Card Styles
  budgetCard: {
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  dietaryCard: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filtersCardInner: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Spacing.borderRadius,
  },
  filterSection: {
    marginVertical: 2,
  },
  compactFilterLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillScrollContainer: {
    gap: 8,
    paddingRight: 16,
  },
  compactPillButton: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  compactPillText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
});

export default GroceryListModal;
