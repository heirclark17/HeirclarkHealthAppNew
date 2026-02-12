import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, DarkColors, LightColors } from '../../constants/Theme';
import { Sex } from '../../constants/goals';
import { useSettings } from '../../contexts/SettingsContext';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  unit?: string;
  colors: typeof DarkColors;
  isDark: boolean;
}

function Input({ label, value, onChangeText, placeholder, unit, colors, isDark }: InputProps) {
  const inputBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.9)';
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={[styles.inputLabel, { color: colors.textMuted }]}>{label}</Text>}
      <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
        />
        {unit && <Text style={[styles.unit, { color: colors.textMuted }]}>{unit}</Text>}
      </View>
    </View>
  );
}

interface ProfileStepProps {
  age: string;
  setAge: (value: string) => void;
  sex: Sex;
  setSex: (value: Sex) => void;
  heightFt: string;
  setHeightFt: (value: string) => void;
  heightIn: string;
  setHeightIn: (value: string) => void;
  weight: string;
  setWeight: (value: string) => void;
  onNext: () => void;
}

export function ProfileStep({
  age,
  setAge,
  sex,
  setSex,
  heightFt,
  setHeightFt,
  heightIn,
  setHeightIn,
  weight,
  setWeight,
  onNext,
}: ProfileStepProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware backgrounds
  const cardBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.95)';
  const inputBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.9)';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Tell Us About Yourself</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          This information helps us calculate your personalized nutrition plan.
        </Text>

        <View style={styles.form}>
          <Input
            label="Age"
            value={age}
            onChangeText={setAge}
            placeholder="25"
            unit="years"
            colors={colors}
            isDark={isDark}
          />

          <View>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Biological Sex</Text>
            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={[styles.toggle, { backgroundColor: inputBg, borderColor: colors.border }, sex === 'male' && [styles.toggleActive, { backgroundColor: colors.primary, borderColor: colors.primary }]]}
                onPress={() => setSex('male')}
                accessibilityLabel="Male"
                accessibilityRole="button"
                accessibilityState={{ selected: sex === 'male' }}
              >
                <Text style={[styles.toggleText, { color: colors.text }, sex === 'male' && { color: colors.primaryText }]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggle, { backgroundColor: inputBg, borderColor: colors.border }, sex === 'female' && [styles.toggleActive, { backgroundColor: colors.primary, borderColor: colors.primary }]]}
                onPress={() => setSex('female')}
                accessibilityLabel="Female"
                accessibilityRole="button"
                accessibilityState={{ selected: sex === 'female' }}
              >
                <Text style={[styles.toggleText, { color: colors.text }, sex === 'female' && { color: colors.primaryText }]}>
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Height</Text>
            <View style={styles.heightRow}>
              <View style={{ flex: 1 }}>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={heightFt}
                    onChangeText={setHeightFt}
                    placeholder="5"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.unit, { color: colors.textMuted }]}>ft</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={heightIn}
                    onChangeText={setHeightIn}
                    placeholder="10"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.unit, { color: colors.textMuted }]}>in</Text>
                </View>
              </View>
            </View>
          </View>

          <Input
            label="Current Weight"
            value={weight}
            onChangeText={setWeight}
            placeholder="180"
            unit="lbs"
            colors={colors}
            isDark={isDark}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onNext}
        accessibilityLabel="Continue to next step"
        accessibilityRole="button"
        accessibilityHint="Proceeds to the next step of the goal wizard"
      >
        <Text style={[styles.buttonText, { color: colors.primaryText }]}>CONTINUE</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primaryText} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius + 8,
    padding: Spacing.cardPadding + 4,
    marginBottom: Spacing.sectionMargin,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: Colors.textMuted,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  unit: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  toggle: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius,
    paddingVertical: 16,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  toggleTextActive: {
    color: Colors.primaryText,
  },
  heightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 100,
  },
  buttonText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    letterSpacing: 1,
    color: Colors.primaryText,
  },
});
