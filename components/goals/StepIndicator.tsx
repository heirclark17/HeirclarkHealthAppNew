import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Theme-aware backgrounds
  const circleBg = isDark ? colors.backgroundSecondary : 'rgba(255,255,255,0.9)';

  const steps = [
    { num: 1, label: 'Profile' },
    { num: 2, label: 'Activity' },
    { num: 3, label: 'Goals' },
  ];

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <React.Fragment key={step.num}>
          <View style={styles.stepContainer}>
            <View
              style={[
                styles.stepCircle,
                { backgroundColor: circleBg, borderColor: colors.border },
                step.num <= currentStep && [styles.stepCircleActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  { color: colors.text },
                  step.num <= currentStep && { color: colors.primaryText },
                ]}
              >
                {step.num}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: colors.textMuted },
                step.num === currentStep && { color: colors.text },
              ]}
            >
              {step.label}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.line,
                { backgroundColor: colors.border },
                step.num < currentStep && { backgroundColor: colors.primary },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  stepContainer: {
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  stepNumberActive: {
    color: Colors.primaryText,
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.textMuted,
  },
  stepLabelActive: {
    color: Colors.text,
  },
  line: {
    width: 50,
    height: 2,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  lineActive: {
    backgroundColor: Colors.primary,
  },
});
