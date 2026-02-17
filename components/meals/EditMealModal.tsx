/**
 * Edit Meal Modal - Allows users to edit or delete logged meals
 * Critical UX feature - users must be able to fix mistakes
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { GlassModal } from '../liquidGlass/GlassModal';
import { Button } from '../Button';
import { Colors, Fonts, Spacing } from '../../constants/Theme';
import { NumberText } from '../NumberText';

// iOS 26 Liquid Glass spring physics
const GLASS_SPRING = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export interface LoggedMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
}

interface EditMealModalProps {
  visible: boolean;
  meal: LoggedMeal | null;
  onClose: () => void;
  onSave: (updatedMeal: LoggedMeal) => Promise<void>;
  onDelete: (mealId: string) => Promise<void>;
}

export function EditMealModal({
  visible,
  meal,
  onClose,
  onSave,
  onDelete,
}: EditMealModalProps) {
  const [name, setName] = useState(meal?.name || '');
  const [calories, setCalories] = useState(meal?.calories.toString() || '');
  const [protein, setProtein] = useState(meal?.protein.toString() || '');
  const [carbs, setCarbs] = useState(meal?.carbs.toString() || '');
  const [fat, setFat] = useState(meal?.fat.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update local state when meal prop changes
  React.useEffect(() => {
    if (meal) {
      setName(meal.name);
      setCalories(meal.calories.toString());
      setProtein(meal.protein.toString());
      setCarbs(meal.carbs.toString());
      setFat(meal.fat.toString());
    }
  }, [meal]);

  const handleSave = async () => {
    if (!meal) return;

    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    const caloriesNum = parseFloat(calories);
    const proteinNum = parseFloat(protein);
    const carbsNum = parseFloat(carbs);
    const fatNum = parseFloat(fat);

    if (isNaN(caloriesNum) || caloriesNum < 0) {
      Alert.alert('Error', 'Please enter valid calories');
      return;
    }

    if (isNaN(proteinNum) || proteinNum < 0) {
      Alert.alert('Error', 'Please enter valid protein grams');
      return;
    }

    if (isNaN(carbsNum) || carbsNum < 0) {
      Alert.alert('Error', 'Please enter valid carb grams');
      return;
    }

    if (isNaN(fatNum) || fatNum < 0) {
      Alert.alert('Error', 'Please enter valid fat grams');
      return;
    }

    setIsSaving(true);

    try {
      const updatedMeal: LoggedMeal = {
        ...meal,
        name: name.trim(),
        calories: caloriesNum,
        protein: proteinNum,
        carbs: carbsNum,
        fat: fatNum,
      };

      await onSave(updatedMeal);
      onClose();
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!meal) return;

    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${meal.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDelete(meal.id);
              onClose();
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!meal) return null;

  return (
    <GlassModal
      visible={visible}
      onDismiss={onClose}
      title="Edit Meal"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Meal Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Meal Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter meal name"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* Calories */}
        <View style={styles.field}>
          <Text style={styles.label}>Calories</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>

        {/* Macros Row */}
        <View style={styles.macrosContainer}>
          {/* Protein */}
          <View style={[styles.field, styles.macroField]}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              value={protein}
              onChangeText={setProtein}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          {/* Carbs */}
          <View style={[styles.field, styles.macroField]}>
            <Text style={styles.label}>Carbs (g)</Text>
            <TextInput
              style={styles.input}
              value={carbs}
              onChangeText={setCarbs}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          {/* Fat */}
          <View style={[styles.field, styles.macroField]}>
            <Text style={styles.label}>Fat (g)</Text>
            <TextInput
              style={styles.input}
              value={fat}
              onChangeText={setFat}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Calculated Macros Info */}
        <View style={styles.infoCard}>
          <NumberText weight="medium" style={styles.infoText}>
            Calculated from macros:{' '}
            {Math.round(
              (parseFloat(protein) || 0) * 4 +
              (parseFloat(carbs) || 0) * 4 +
              (parseFloat(fat) || 0) * 9
            )}{' '}
            calories
          </NumberText>
          <NumberText weight="regular" style={styles.infoSubtext}>
            Protein: 4 cal/g • Carbs: 4 cal/g • Fat: 9 cal/g
          </NumberText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            variant="primary"
            loading={isSaving}
            disabled={isSaving || isDeleting}
          />

          <Button
            title="Delete Meal"
            onPress={handleDelete}
            variant="secondary"
            loading={isDeleting}
            disabled={isSaving || isDeleting}
            style={styles.deleteButton}
          />

          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            disabled={isSaving || isDeleting}
          />
        </View>
      </ScrollView>
    </GlassModal>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.radiusMD,
    padding: Spacing.md,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  macrosContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  macroField: {
    flex: 1,
    marginBottom: 0,
  },
  infoCard: {
    backgroundColor: Colors.glassTintSuccess,
    borderRadius: Spacing.radiusMD,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  actions: {
    gap: Spacing.md,
  },
  deleteButton: {
    backgroundColor: Colors.glassTintError,
  },
});
