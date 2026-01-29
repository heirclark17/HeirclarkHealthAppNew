import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { Colors, Fonts, Spacing } from '../../constants/Theme';
import { GroceryCategory, GroceryItem } from '../../types/mealPlan';

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
}: {
  item: GroceryItem;
  onToggle: () => void;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 15 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15 });
    }, 100);
    onToggle();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={[styles.itemRow, item.checked && styles.itemRowChecked]}
      >
        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
          {item.checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
            {item.name}
          </Text>
          <Text style={styles.itemAmount}>
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
}: {
  category: GroceryCategory;
  categoryIndex: number;
  onToggleItem: (categoryIndex: number, itemIndex: number) => void;
}) => {
  const checkedCount = category.items.filter(item => item.checked).length;
  const totalCount = category.items.length;

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryIcon}>
          {CATEGORY_ICONS[category.category] || '📦'}
        </Text>
        <Text style={styles.categoryTitle}>{category.category}</Text>
        <Text style={styles.categoryCount}>
          {checkedCount}/{totalCount}
        </Text>
      </View>
      {category.items.map((item, itemIndex) => (
        <CheckboxItem
          key={`${item.name}-${itemIndex}`}
          item={item}
          onToggle={() => onToggleItem(categoryIndex, itemIndex)}
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
  if (!groceryList) return null;

  const totalItems = groceryList.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedItems = groceryList.reduce(
    (acc, cat) => acc + cat.items.filter(item => item.checked).length,
    0
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(100)}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Grocery List</Text>
          <View style={styles.placeholder} />
        </Animated.View>

        {/* Progress */}
        <Animated.View
          entering={FadeIn.delay(200)}
          style={styles.progressSection}
        >
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
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
              />
            </Animated.View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Instacart button */}
        <Animated.View
          entering={SlideInUp.delay(500).springify()}
          style={styles.bottomSection}
        >
          <TouchableOpacity
            style={styles.instacartButton}
            onPress={onOrderInstacart}
            activeOpacity={0.8}
          >
            <Text style={styles.instacartIcon}>🛒</Text>
            <Text style={styles.instacartButtonText}>Order with Instacart</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.accent,
    fontFamily: Fonts.regular,
  },
  headerTitle: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  placeholder: {
    width: 60,
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: Colors.textMuted,
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
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    flex: 1,
  },
  categoryCount: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemRowChecked: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    fontSize: 14,
    color: Colors.primaryText,
    fontFamily: Fonts.bold,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: Fonts.medium,
    marginBottom: 2,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  itemAmount: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  instacartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Spacing.borderRadius,
    gap: 8,
  },
  instacartIcon: {
    fontSize: 20,
  },
  instacartButtonText: {
    fontSize: 16,
    color: Colors.primaryText,
    fontFamily: Fonts.semiBold,
  },
});

export default GroceryListModal;
