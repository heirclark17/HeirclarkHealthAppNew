import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Ruler, Hand } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, DarkColors, LightColors } from '../../constants/Theme';
import { useGoalWizard, WeightUnit, HeightUnit } from '../../contexts/GoalWizardContext';
import { useSettings } from '../../contexts/SettingsContext';
import { lightImpact, selectionFeedback } from '../../utils/haptics';
import { GlassCard } from '../GlassCard';
import { NumberText } from '../NumberText';
import { WizardHeader } from './WizardHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// iOS 26 Liquid Glass Section wrapper
function GlassSection({ children, isDark, style }: { children: React.ReactNode; isDark: boolean; style?: any }) {
  return (
    <GlassCard style={[styles.glassSection, style]} interactive>
      <View style={styles.glassSectionInner}>
        {children}
      </View>
    </GlassCard>
  );
}

// Helper to format date for display
const formatDateForDisplay = (dateStr: string | null): string => {
  if (!dateStr) return 'Select Date';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

interface ToggleButtonProps {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  colors: typeof DarkColors;
}

function ToggleButton({ options, selected, onSelect, colors }: ToggleButtonProps & { isDark?: boolean }) {
  const selectedBg = (colors as any).background === DarkColors.background
    ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)';
  return (
    <View style={[styles.toggleContainer, { backgroundColor: colors.background }]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.toggleOption,
            selected === option.value && [styles.toggleOptionSelected, { backgroundColor: selectedBg }],
          ]}
          onPress={async () => {
            await selectionFeedback();
            onSelect(option.value);
          }}
          activeOpacity={0.7}
          accessibilityLabel={option.label}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === option.value }}
          accessibilityHint={`Select ${option.label}`}
        >
          <Text
            style={[
              styles.toggleText,
              { color: colors.textMuted },
              selected === option.value && { color: colors.text },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ============================================
// SIMPLE AGE PICKER WITH BUTTONS (iOS-friendly)
// ============================================

interface SimplePickerProps {
  data: { value: number; label: string }[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  colors: typeof DarkColors;
  isDark: boolean;
}

function SimplePicker({ data, selectedValue, onValueChange, colors, isDark }: SimplePickerProps) {
  const currentIndex = useMemo(() => {
    const idx = data.findIndex(item => item.value === selectedValue);
    return idx >= 0 ? idx : 0;
  }, [data, selectedValue]);

  const handleIncrement = useCallback(async () => {
    if (currentIndex < data.length - 1) {
      await lightImpact();
      onValueChange(data[currentIndex + 1].value);
    }
  }, [data, currentIndex, onValueChange]);

  const handleDecrement = useCallback(async () => {
    if (currentIndex > 0) {
      await lightImpact();
      onValueChange(data[currentIndex - 1].value);
    }
  }, [data, currentIndex, onValueChange]);

  // Show 5 items centered around current value
  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = -2; i <= 2; i++) {
      const idx = currentIndex + i;
      if (idx >= 0 && idx < data.length) {
        items.push({ ...data[idx], offset: i });
      } else {
        items.push({ value: -1, label: '', offset: i });
      }
    }
    return items;
  }, [data, currentIndex]);

  const secondaryBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const highlightBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <View style={[styles.simplePickerContainer, { backgroundColor: secondaryBg }]}>
      {/* Up button */}
      <TouchableOpacity
        style={[styles.simplePickerButton, currentIndex <= 0 && styles.simplePickerButtonDisabled]}
        onPress={handleDecrement}
        disabled={currentIndex <= 0}
        activeOpacity={0.6}
        accessibilityLabel="Decrease value"
        accessibilityRole="button"
        accessibilityState={{ disabled: currentIndex <= 0 }}
        accessibilityHint="Decreases the selected value by one"
      >
        <Ionicons name="chevron-up" size={28} color={currentIndex <= 0 ? colors.border : colors.textMuted} />
      </TouchableOpacity>

      {/* Visible items */}
      <View style={styles.simplePickerItems}>
        {visibleItems.map((item, idx) => {
          const isSelected = item.offset === 0;
          const distance = Math.abs(item.offset);
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.25;
          const scale = distance === 0 ? 1 : distance === 1 ? 0.9 : 0.8;

          if (item.value === -1) {
            return <View key={`empty-${idx}`} style={styles.simplePickerItemEmpty} />;
          }

          return (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.simplePickerItem,
                isSelected && [styles.simplePickerItemSelected, { backgroundColor: highlightBg }],
                { opacity, transform: [{ scale }] },
              ]}
              onPress={async () => {
                if (!isSelected) {
                  await lightImpact();
                  onValueChange(item.value);
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel={item.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityHint="Selects this value"
            >
              <NumberText
                weight={isSelected ? "semiBold" : "regular"}
                style={[
                  styles.simplePickerText,
                  { color: isSelected ? colors.primary : colors.text },
                  isSelected && styles.simplePickerTextSelected,
                ]}
              >
                {item.label}
              </NumberText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Down button */}
      <TouchableOpacity
        style={[styles.simplePickerButton, currentIndex >= data.length - 1 && styles.simplePickerButtonDisabled]}
        onPress={handleIncrement}
        disabled={currentIndex >= data.length - 1}
        activeOpacity={0.6}
        accessibilityLabel="Increase value"
        accessibilityRole="button"
        accessibilityState={{ disabled: currentIndex >= data.length - 1 }}
        accessibilityHint="Increases the selected value by one"
      >
        <Ionicons name="chevron-down" size={28} color={currentIndex >= data.length - 1 ? colors.border : colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// HORIZONTAL SCALE PICKER (Ruler-style swiper)
// ============================================

const TICK_WIDTH = 10; // px per 1 unit

interface HorizontalScalePickerProps {
  min: number;
  max: number;
  value: number;
  onValueChange: (value: number) => void;
  unit: string;
  colors: typeof DarkColors;
  isDark: boolean;
}

function HorizontalScalePicker({ min, max, value, onValueChange, unit, colors, isDark }: HorizontalScalePickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lastValueRef = useRef(value);
  const isUserScrolling = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const halfWidth = containerWidth / 2;
  const totalTicks = max - min;

  // Generate tick marks
  const ticks = useMemo(() => {
    const items: { val: number; type: 'small' | 'medium' | 'large' }[] = [];
    for (let i = 0; i <= totalTicks; i++) {
      const v = min + i;
      if (v % 10 === 0) items.push({ val: v, type: 'large' });
      else if (v % 5 === 0) items.push({ val: v, type: 'medium' });
      else items.push({ val: v, type: 'small' });
    }
    return items;
  }, [min, max, totalTicks]);

  // Scroll to value on mount and when value changes externally
  useEffect(() => {
    if (!isUserScrolling.current && containerWidth > 0) {
      const offset = (value - min) * TICK_WIDTH;
      scrollRef.current?.scrollTo({ x: offset, animated: false });
    }
  }, [value, min, containerWidth]);

  // Re-sync scroll position when unit changes (min/max change)
  useEffect(() => {
    if (containerWidth <= 0) return;
    const timeout = setTimeout(() => {
      const offset = (value - min) * TICK_WIDTH;
      scrollRef.current?.scrollTo({ x: offset, animated: false });
    }, 50);
    return () => clearTimeout(timeout);
  }, [min, max]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserScrolling.current = true;
    const scrollX = e.nativeEvent.contentOffset.x;
    const rawValue = min + Math.round(scrollX / TICK_WIDTH);
    const clampedValue = Math.max(min, Math.min(max, rawValue));

    if (clampedValue !== lastValueRef.current) {
      lastValueRef.current = clampedValue;
      onValueChange(clampedValue);
      selectionFeedback();
    }
  }, [min, max, onValueChange]);

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = e.nativeEvent.contentOffset.x;
    const rawValue = min + Math.round(scrollX / TICK_WIDTH);
    const snappedValue = Math.max(min, Math.min(max, rawValue));
    const snappedOffset = (snappedValue - min) * TICK_WIDTH;

    scrollRef.current?.scrollTo({ x: snappedOffset, animated: true });
    onValueChange(snappedValue);
    isUserScrolling.current = false;
  }, [min, max, onValueChange]);

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = e.nativeEvent.contentOffset.x;
    const rawValue = min + Math.round(scrollX / TICK_WIDTH);
    const snappedValue = Math.max(min, Math.min(max, rawValue));
    const snappedOffset = (snappedValue - min) * TICK_WIDTH;

    scrollRef.current?.scrollTo({ x: snappedOffset, animated: true });
    onValueChange(snappedValue);
    isUserScrolling.current = false;
  }, [min, max, onValueChange]);

  const tickColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const tickMedColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.20)';
  const tickLargeColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';

  return (
    <View style={scaleStyles.container}>
      {/* Large value display */}
      <View style={scaleStyles.valueContainer}>
        <NumberText weight="light" style={[scaleStyles.valueText, { color: colors.primary }]}>
          {value}
        </NumberText>
        <Text style={[scaleStyles.unitText, { color: colors.textMuted }]}>{unit}</Text>
      </View>

      {/* Scale ruler */}
      <View
        style={scaleStyles.scaleWrapper}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {/* Center indicator line */}
        {containerWidth > 0 && (
          <View style={[scaleStyles.centerIndicator, { backgroundColor: colors.primary, left: halfWidth - 1 }]} />
        )}

        {containerWidth > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumEnd}
            onScrollEndDrag={handleScrollEnd}
            scrollEventThrottle={16}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: halfWidth,
            }}
            bounces={false}
          >
            <View style={scaleStyles.tickRow}>
              {ticks.map((tick, i) => (
                <View key={i} style={scaleStyles.tickContainer}>
                  <View
                    style={[
                      scaleStyles.tick,
                      tick.type === 'small' && { height: 16, backgroundColor: tickColor },
                      tick.type === 'medium' && { height: 26, backgroundColor: tickMedColor },
                      tick.type === 'large' && { height: 36, backgroundColor: tickLargeColor },
                    ]}
                  />
                  {tick.type === 'large' && (
                    <NumberText weight="regular" style={[scaleStyles.tickLabel, { color: colors.textMuted }]}>
                      {tick.val}
                    </NumberText>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const scaleStyles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 12,
  },
  valueText: {
    fontSize: 44,
    fontFamily: Fonts.numericLight,
  },
  unitText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  scaleWrapper: {
    height: 72,
    position: 'relative',
    overflow: 'hidden',
  },
  centerIndicator: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 44,
    borderRadius: 1,
    zIndex: 10,
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 72,
  },
  tickContainer: {
    width: TICK_WIDTH,
    alignItems: 'center',
  },
  tick: {
    width: 1.5,
    borderRadius: 1,
  },
  tickLabel: {
    fontSize: 9,
    marginTop: 4,
    fontFamily: Fonts.numericRegular,
  },
});

// ============================================
// COMPACT STEPPER FOR HEIGHT
// ============================================
interface NumberStepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  colors: typeof DarkColors;
  isDark: boolean;
}

function NumberStepper({ value, min, max, step = 1, onChange, unit, colors, isDark }: NumberStepperProps) {
  const handleDecrement = async () => {
    if (value > min) {
      await lightImpact();
      onChange(value - step);
    }
  };

  const handleIncrement = async () => {
    if (value < max) {
      await lightImpact();
      onChange(value + step);
    }
  };

  const stepperBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={[styles.stepperContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
      <TouchableOpacity
        style={[styles.stepperButton, { backgroundColor: stepperBg }, value <= min && styles.stepperButtonDisabled]}
        onPress={handleDecrement}
        disabled={value <= min}
        accessibilityLabel={`Decrease ${unit || 'value'}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: value <= min }}
        accessibilityHint={`Decreases ${unit || 'value'} by ${step}`}
      >
        <Ionicons name="remove" size={20} color={value <= min ? colors.textMuted : colors.text} />
      </TouchableOpacity>
      <View style={styles.stepperValueContainer}>
        <NumberText weight="light" style={[styles.stepperValue, { color: colors.text }]}>{value}</NumberText>
        {unit && <Text style={[styles.stepperUnit, { color: colors.textMuted }]}>{unit}</Text>}
      </View>
      <TouchableOpacity
        style={[styles.stepperButton, { backgroundColor: stepperBg }, value >= max && styles.stepperButtonDisabled]}
        onPress={handleIncrement}
        disabled={value >= max}
        accessibilityLabel={`Increase ${unit || 'value'}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: value >= max }}
        accessibilityHint={`Increases ${unit || 'value'} by ${step}`}
      >
        <Ionicons name="add" size={20} color={value >= max ? colors.textMuted : colors.text} />
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
interface BodyMetricsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function BodyMetricsStep({ onNext, onBack }: BodyMetricsStepProps) {
  const {
    state,
    setCurrentWeight,
    setTargetWeight,
    setWeightUnit,
    setHeightFt,
    setHeightIn,
    setHeightCm,
    setHeightUnit,
    setAge,
    setSex,
    setStartDate,
    setTargetDate,
  } = useGoalWizard();
  const { settings } = useSettings();

  // Dynamic theme colors
  const colors = useMemo(() => {
    return settings.themeMode === 'light' ? LightColors : DarkColors;
  }, [settings.themeMode]);
  const isDark = settings.themeMode === 'dark';

  // Date picker state - synced with context
  const [showTargetDatePicker, setShowTargetDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);

  // Local date state for picker (initialized from context)
  const [localStartDate, setLocalStartDate] = useState<Date>(() => {
    return state.startDate ? new Date(state.startDate) : new Date();
  });

  const [localTargetDate, setLocalTargetDate] = useState<Date>(() => {
    if (state.targetDate) {
      return new Date(state.targetDate);
    }
    // Default to 3 months from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 90);
    return defaultDate;
  });

  // Sync local state when context changes
  useEffect(() => {
    if (state.startDate) {
      setLocalStartDate(new Date(state.startDate));
    }
  }, [state.startDate]);

  useEffect(() => {
    if (state.targetDate) {
      setLocalTargetDate(new Date(state.targetDate));
    }
  }, [state.targetDate]);

  const ageData = useMemo(() => {
    return Array.from({ length: 108 }, (_, i) => ({
      value: 13 + i,
      label: `${13 + i} years`,
    }));
  }, []);

  // Translucent primary color for frosted glass button
  const primaryGlassBg = isDark ? 'rgba(150, 206, 180, 0.25)' : 'rgba(150, 206, 180, 0.20)';

  // Handle start date changes - FIXED
  const handleStartDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (date && !isNaN(date.getTime())) {
      setLocalStartDate(date);
      // Always sync to context on valid date
      setStartDate(date.toISOString().split('T')[0]);
      if (Platform.OS === 'android') {
        selectionFeedback();
      }
    }
  };

  const handleStartDateDismiss = () => {
    // Sync to context when Done is pressed
    if (localStartDate && !isNaN(localStartDate.getTime())) {
      setStartDate(localStartDate.toISOString().split('T')[0]);
      selectionFeedback();
    }
    setShowStartDatePicker(false);
  };

  // Handle target date changes - FIXED
  const handleTargetDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTargetDatePicker(false);
    }
    if (date && !isNaN(date.getTime())) {
      setLocalTargetDate(date);
      // Always sync to context on valid date
      setTargetDate(date.toISOString().split('T')[0]);
      if (Platform.OS === 'android') {
        selectionFeedback();
      }
    }
  };

  const handleTargetDateDismiss = () => {
    // Sync to context when Done is pressed
    if (localTargetDate && !isNaN(localTargetDate.getTime())) {
      setTargetDate(localTargetDate.toISOString().split('T')[0]);
      selectionFeedback();
    }
    setShowTargetDatePicker(false);
  };

  const isValid = () => {
    return (
      state.currentWeight > 0 &&
      state.targetWeight > 0 &&
      state.age >= 13 &&
      state.age <= 120 &&
      (state.heightUnit === 'ft_in'
        ? state.heightFt >= 3 && state.heightFt <= 8
        : state.heightCm >= 91 && state.heightCm <= 244)
    );
  };

  const handleContinue = async () => {
    if (!isValid()) return;
    await lightImpact();
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Header with Title and Icon */}
      <WizardHeader
        currentStep={2}
        totalSteps={6}
        title="Your Body Metrics"
        icon={<Ruler size={36} color={isDark ? '#FFFFFF' : '#000000'} />}
        onBack={onBack}
        isDark={isDark}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Spacer for header */}
        <View style={{ height: Platform.OS === 'ios' ? 200 : 170 }} />

        <View style={styles.subtitle}>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
            Help us calculate your ideal nutrition targets with accurate measurements.
          </Text>
        </View>

      {/* Weight Section */}
      <GlassSection isDark={isDark}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>WEIGHT</Text>
          <ToggleButton
            options={[
              { value: 'lb', label: 'lb' },
              { value: 'kg', label: 'kg' },
            ]}
            selected={state.weightUnit}
            onSelect={(value) => setWeightUnit(value as WeightUnit)}
            colors={colors}
          />
        </View>

        <Text style={[styles.inputLabel, { color: colors.text }]}>Current Weight</Text>
        <HorizontalScalePicker
          min={state.weightUnit === 'lb' ? 80 : 36}
          max={state.weightUnit === 'lb' ? 400 : 181}
          value={Math.round(state.currentWeight)}
          onValueChange={setCurrentWeight}
          unit={state.weightUnit === 'lb' ? 'lbs' : 'kg'}
          colors={colors}
          isDark={isDark}
        />

        {state.primaryGoal !== 'maintain' && (
          <>
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 24 }]}>Target Weight</Text>
            <HorizontalScalePicker
              min={state.weightUnit === 'lb' ? 80 : 36}
              max={state.weightUnit === 'lb' ? 400 : 181}
              value={Math.round(state.targetWeight)}
              onValueChange={setTargetWeight}
              unit={state.weightUnit === 'lb' ? 'lbs' : 'kg'}
              colors={colors}
              isDark={isDark}
            />
          </>
        )}
      </GlassSection>

      {/* Start Date Section */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>WHEN DO YOU WANT TO START?</Text>
        <TouchableOpacity
          style={[styles.datePickerButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}
          onPress={() => setShowStartDatePicker(true)}
          activeOpacity={0.7}
          accessibilityLabel={`Start date: ${formatDateForDisplay(state.startDate)}`}
          accessibilityRole="button"
          accessibilityHint="Opens date picker to select when you want to start"
        >
          <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          <NumberText weight="semiBold" style={[styles.datePickerButtonText, { color: colors.text }]}>
            {formatDateForDisplay(state.startDate)}
          </NumberText>
        </TouchableOpacity>

        {showStartDatePicker && (
          <DateTimePicker
            value={localStartDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
            minimumDate={new Date()}
            textColor={isDark ? Colors.text : Colors.background}
            accentColor={colors.primary}
            themeVariant={isDark ? "dark" : "light"}
          />
        )}

        {showStartDatePicker && Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.datePickerDoneButton, { backgroundColor: colors.primary }]}
            onPress={handleStartDateDismiss}
            accessibilityLabel="Done selecting start date"
            accessibilityRole="button"
            accessibilityHint="Confirms selected start date and closes date picker"
          >
            <Text style={[styles.datePickerDoneText, { color: colors.primaryText }]}>Done</Text>
          </TouchableOpacity>
        )}
      </GlassSection>

      {/* Target Date Section - Show for all goals except maintain */}
      {state.primaryGoal !== 'maintain' && (
        <GlassSection isDark={isDark}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>WHEN DO YOU WANT TO REACH YOUR GOAL?</Text>
          <TouchableOpacity
            style={[styles.datePickerButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}
            onPress={() => setShowTargetDatePicker(true)}
            activeOpacity={0.7}
            accessibilityLabel={`Target date: ${formatDateForDisplay(state.targetDate)}`}
            accessibilityRole="button"
            accessibilityHint="Opens date picker to select your goal completion date"
          >
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
            <NumberText weight="semiBold" style={[styles.datePickerButtonText, { color: colors.text }]}>
              {formatDateForDisplay(state.targetDate)}
            </NumberText>
          </TouchableOpacity>

          {showTargetDatePicker && (
            <DateTimePicker
              value={localTargetDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTargetDateChange}
              minimumDate={new Date()}
              maximumDate={new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000)}
              textColor={isDark ? Colors.text : Colors.background}
              accentColor={colors.primary}
              themeVariant={isDark ? "dark" : "light"}
            />
          )}

          {showTargetDatePicker && Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.datePickerDoneButton, { backgroundColor: colors.primary }]}
              onPress={handleTargetDateDismiss}
              accessibilityLabel="Done selecting target date"
              accessibilityRole="button"
              accessibilityHint="Confirms selected target date and closes date picker"
            >
              <Text style={[styles.datePickerDoneText, { color: colors.primaryText }]}>Done</Text>
            </TouchableOpacity>
          )}
        </GlassSection>
      )}

      {/* Height Section */}
      <GlassSection isDark={isDark}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>HEIGHT</Text>
          <ToggleButton
            options={[
              { value: 'ft_in', label: 'ft/in' },
              { value: 'cm', label: 'cm' },
            ]}
            selected={state.heightUnit}
            onSelect={(value) => setHeightUnit(value as HeightUnit)}
            colors={colors}
          />
        </View>

        {state.heightUnit === 'ft_in' ? (
          <View style={styles.heightRow}>
            <View style={styles.heightInput}>
              <NumberStepper
                value={state.heightFt}
                min={3}
                max={8}
                onChange={setHeightFt}
                unit="ft"
                colors={colors}
                isDark={isDark}
              />
            </View>
            <View style={styles.heightInput}>
              <NumberStepper
                value={state.heightIn}
                min={0}
                max={11}
                onChange={setHeightIn}
                unit="in"
                colors={colors}
                isDark={isDark}
              />
            </View>
          </View>
        ) : (
          <NumberStepper
            value={state.heightCm}
            min={91}
            max={244}
            onChange={setHeightCm}
            unit="cm"
            colors={colors}
            isDark={isDark}
          />
        )}
      </GlassSection>

      {/* Age Section - Using simple picker */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { marginBottom: 12, color: colors.text }]}>AGE</Text>
        <SimplePicker
          data={ageData}
          selectedValue={state.age}
          onValueChange={setAge}
          colors={colors}
          isDark={isDark}
        />
      </GlassSection>

      {/* Biological Sex Section */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>BIOLOGICAL SEX</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Used for accurate BMR calculation</Text>
        <View style={styles.sexToggle}>
          <TouchableOpacity
            style={[
              styles.sexOption,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
              state.sex === 'male' && { backgroundColor: primaryGlassBg },
            ]}
            onPress={async () => {
              await selectionFeedback();
              setSex('male');
            }}
            accessibilityLabel="Male"
            accessibilityRole="button"
            accessibilityState={{ selected: state.sex === 'male' }}
            accessibilityHint="Select male for BMR calculation"
          >
            <Ionicons
              name="male"
              size={24}
              color={state.sex === 'male' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.sexText,
                { color: colors.text },
              ]}
            >
              Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sexOption,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
              state.sex === 'female' && { backgroundColor: primaryGlassBg },
            ]}
            onPress={async () => {
              await selectionFeedback();
              setSex('female');
            }}
            accessibilityLabel="Female"
            accessibilityRole="button"
            accessibilityState={{ selected: state.sex === 'female' }}
            accessibilityHint="Select female for BMR calculation"
          >
            <Ionicons
              name="female"
              size={24}
              color={state.sex === 'female' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.sexText,
                { color: colors.text },
              ]}
            >
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </GlassSection>

      {/* Bottom Spacing - extra space to prevent blending with buttons */}
      <View style={{ height: 180 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
            accessibilityRole="button"
            accessibilityHint="Returns to previous step"
          >
            <GlassCard style={styles.backButton} interactive>
              <View style={{ transform: [{ rotate: '-90deg' }, { scaleX: -1 }] }}>
                <Hand size={24} color={colors.text} />
              </View>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isValid()}
            activeOpacity={0.7}
            accessibilityLabel="Continue to next step"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid() }}
            accessibilityHint="Proceeds to the next step if all fields are filled"
          >
            <GlassCard style={styles.continueButton} interactive>
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <Hand size={24} color={isValid() ? colors.primary : colors.textMuted} />
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  subtitle: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: Fonts.light,
    color: Colors.textSecondary,
    lineHeight: 19,
    textAlign: 'center',
  },
  glassSection: {
    marginBottom: 24,
    marginHorizontal: 16,
  },
  glassSectionInner: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.light,
    marginTop: 4,
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 2,
  },
  toggleOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleOptionSelected: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.textMuted,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.text,
    marginBottom: 8,
  },
  // Simple Picker Styles (Age)
  simplePickerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 8,
  },
  simplePickerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  simplePickerButtonDisabled: {
    opacity: 0.3,
  },
  simplePickerItems: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  simplePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 2,
  },
  simplePickerItemSelected: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  simplePickerItemEmpty: {
    height: 40,
  },
  simplePickerText: {
    fontSize: 18,
    fontFamily: Fonts.numericRegular,
    fontWeight: '400',
    textAlign: 'center',
  },
  simplePickerTextSelected: {
    fontSize: 24,
    fontFamily: Fonts.numericSemiBold,
    fontWeight: '600',
  },
  // Date Picker Styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200',
  },
  datePickerDoneButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  datePickerDoneText: {
    fontSize: 16,
    fontFamily: Fonts.light,
    fontWeight: '200',
    color: Colors.primaryText,
  },
  // Height & Stepper Styles
  heightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heightInput: {
    flex: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stepperButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  stepperButtonDisabled: {
    opacity: 0.3,
  },
  stepperValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stepperValue: {
    fontSize: 24,
    fontFamily: Fonts.numericLight,
    fontWeight: '100',
    color: Colors.text,
  },
  stepperUnit: {
    fontSize: 14,
    fontFamily: Fonts.light,
    color: Colors.textMuted,
  },
  // Sex Toggle Styles
  sexToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  sexOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  sexText: {
    fontSize: 15,
    fontFamily: Fonts.numericSemiBold,
    color: Colors.text,
  },
  // Button Styles
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
    color: Colors.text,
  },
  continueButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: Fonts.numericSemiBold,
    letterSpacing: 1,
  },
});
