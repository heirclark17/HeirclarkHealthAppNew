import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  useColorScheme,
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
import { Colors, Fonts, Spacing } from '../../constants/Theme';
import { GroceryCategory, GroceryItem } from '../../types/mealPlan';
import { lightImpact, mediumImpact } from '../../utils/haptics';

// iOS 26 Liquid Glass spring configuration
const GLASS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

// iOS 26 Liquid Glass colors
const GLASS_COLORS = {
  light: {
    background: '#F8F8F8',
    card: 'rgba(255, 255, 255, 0.75)',
    cardBorder: 'rgba(255, 255, 255, 0.5)',
    header: 'rgba(255, 255, 255, 0.85)',
    text: '#1D1D1F',
    textMuted: 'rgba(60, 60, 67, 0.6)',
    textSecondary: 'rgba(60, 60, 67, 0.4)',
    border: 'rgba(0, 0, 0, 0.08)',
    checkbox: 'rgba(0, 0, 0, 0.1)',
    checkboxChecked: 'rgba(0, 122, 255, 0.9)',
    progressBg: 'rgba(0, 0, 0, 0.06)',
    progressFill: 'rgba(0, 122, 255, 0.9)',
    buttonBg: 'rgba(0, 122, 255, 0.9)',
  },
  dark: {
    background: '#0A0A0A',
    card: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    header: 'rgba(44, 44, 46, 0.85)',
    text: Colors.text,
    textMuted: 'rgba(235, 235, 245, 0.6)',
    textSecondary: 'rgba(235, 235, 245, 0.4)',
    border: 'rgba(255, 255, 255, 0.1)',
    checkbox: 'rgba(255, 255, 255, 0.15)',
    checkboxChecked: 'rgba(10, 132, 255, 0.9)',
    progressBg: 'rgba(255, 255, 255, 0.1)',
    progressFill: 'rgba(10, 132, 255, 0.9)',
    buttonBg: 'rgba(10, 132, 255, 0.9)',
  },
};

interface GroceryListModalProps {
  visible: boolean;
  onClose: () => void;
  groceryList: GroceryCategory[] | null;
  onToggleItem: (categoryIndex: number, itemIndex: number) => void;
  onOrderInstacart: () => void;
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
  glassColors,
}: {
  item: GroceryItem;
  onToggle: () => void;
  glassColors: typeof GLASS_COLORS.dark;
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

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.itemRow,
          { backgroundColor: glassColors.card, borderColor: glassColors.cardBorder },
          item.checked && styles.itemRowChecked,
        ]}
      >
        <View style={[
          styles.checkbox,
          { borderColor: glassColors.textMuted },
          item.checked && { backgroundColor: glassColors.checkboxChecked, borderColor: glassColors.checkboxChecked },
        ]}>
          {item.checked && <Ionicons name="checkmark" size={14} color=Colors.text />}
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
      </Pressable>
    </Animated.View>
  );
};

const CategorySection = ({
  category,
  categoryIndex,
  onToggleItem,
  glassColors,
}: {
  category: GroceryCategory;
  categoryIndex: number;
  onToggleItem: (categoryIndex: number, itemIndex: number) => void;
  glassColors: typeof GLASS_COLORS.dark;
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
        <Text style={[styles.categoryCount, { color: glassColors.textMuted }]}>
          {checkedCount}/{totalCount}
        </Text>
      </View>
      {category.items.map((item, itemIndex) => (
        <CheckboxItem
          key={`${item.name}-${itemIndex}`}
          item={item}
          onToggle={() => onToggleItem(categoryIndex, itemIndex)}
          glassColors={glassColors}
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
  onOrderInstacart,
}: GroceryListModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glassColors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;
  const insets = useSafeAreaInsets();

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
    onOrderInstacart();
  };

  if (!groceryList) return null;

  const totalItems = groceryList.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedItems = groceryList.reduce(
    (acc, cat) => acc + cat.items.filter(item => item.checked).length,
    0
  );
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

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
          style={[styles.header, { borderBottomColor: glassColors.border }]}
        >
          <Animated.View entering={FadeIn.delay(100)} style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: glassColors.checkboxChecked }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: glassColors.text }]}>Grocery List</Text>
            <View style={styles.placeholder} />
          </Animated.View>
        </BlurView>

        {/* Progress Section */}
        <Animated.View
          entering={FadeIn.delay(200)}
          style={[styles.progressSection, { borderBottomColor: glassColors.border }]}
        >
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
          <Text style={[styles.progressText, { color: glassColors.textMuted }]}>
            {checkedItems} of {totalItems} items checked
          </Text>
        </Animated.View>

        {/* Grocery list */}
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
                glassColors={glassColors}
              />
            </Animated.View>
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Instacart button with Glass Effect */}
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.bottomSection, { paddingBottom: insets.bottom + 16, borderTopColor: glassColors.border }]}
        >
          <Animated.View entering={SlideInUp.delay(500).springify()} style={buttonAnimatedStyle}>
            <TouchableOpacity
              style={[styles.instacartButton, {
                backgroundColor: glassColors.buttonBg,
                shadowColor: glassColors.buttonBg,
              }]}
              onPress={handleInstacartPress}
              activeOpacity={1}
            >
              <Text style={styles.instacartIcon}>🛒</Text>
              <Text style={styles.instacartButtonText}>Order with Instacart</Text>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
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
    borderBottomWidth: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
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
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  instacartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: Spacing.borderRadius,
    gap: 8,
    // Glow shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  instacartIcon: {
    fontSize: 20,
  },
  instacartButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
});

export default GroceryListModal;
