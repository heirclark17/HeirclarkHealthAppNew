import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useSettings } from '../../contexts/SettingsContext';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

interface StepDotProps {
  stepNumber: number;
  currentStep: number;
  label?: string;
  colors: typeof DarkColors;
  isDark: boolean;
}

function StepDot({ stepNumber, currentStep, label, colors, isDark }: StepDotProps) {
  const isActive = stepNumber <= currentStep;

  // Theme-aware unselected colors
  const unselectedBg = isDark ? colors.backgroundSecondary : 'rgba(0,0,0,0.05)';
  const unselectedBorder = colors.border;
  const unselectedText = colors.textMuted;

  return (
    <View style={styles.stepContainer}>
      <View style={[
        styles.dot,
        {
          backgroundColor: isActive ? Colors.success : unselectedBg,
          borderColor: isActive ? Colors.success : unselectedBorder,
        }
      ]}>
        <Text style={[
          styles.dotText,
          { color: isActive ? Colors.background : unselectedText }
        ]}>
          {stepNumber}
        </Text>
      </View>
      {label && (
        <Text style={[styles.label, { color: colors.textMuted }, isActive && styles.labelActive]}>
          {label}
        </Text>
      )}
    </View>
  );
}

interface ConnectorProps {
  isActive: boolean;
  colors: typeof DarkColors;
}

function Connector({ isActive, colors }: ConnectorProps) {
  return (
    <View style={styles.connectorContainer}>
      <View style={[styles.connectorBackground, { backgroundColor: colors.border }]} />
      <View style={[styles.connectorFill, { width: isActive ? '100%' : '0%' }]} />
    </View>
  );
}

export function StepProgressBar({ currentStep, totalSteps, labels }: StepProgressBarProps) {
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  const defaultLabels = ['Goal', 'Body', 'Activity', 'Nutrition', 'Review'];
  const stepLabels = labels || defaultLabels.slice(0, totalSteps);

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <React.Fragment key={index}>
            <StepDot
              stepNumber={index + 1}
              currentStep={currentStep}
              label={stepLabels[index]}
              colors={colors}
              isDark={isDark}
            />
            {index < totalSteps - 1 && (
              <Connector isActive={currentStep > index + 1} colors={colors} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    width: 56,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
  },
  dotText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.success,
  },
  connectorContainer: {
    flex: 1,
    height: 2,
    marginTop: 15,
    marginHorizontal: -4,
    position: 'relative',
  },
  connectorBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  connectorFill: {
    position: 'absolute',
    left: 0,
    height: 2,
    backgroundColor: Colors.success,
    borderRadius: 1,
  },
});
