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
        <NumberText weight="regular" style={[scaleStyles.unitText, { color: colors.textMuted }]}>{unit}</NumberText>
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
    fontFamily: Fonts.numericRegular,
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
// VERTICAL SCROLL PICKER (Drum/Wheel style)
// ============================================

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface VerticalScrollPickerProps {
  min: number;
  max: number;
  value: number;
  onValueChange: (value: number) => void;
  unit?: string;
  colors: typeof DarkColors;
  isDark: boolean;
}

function VerticalScrollPicker({ min, max, value, onValueChange, unit, colors, isDark }: VerticalScrollPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lastValueRef = useRef(value);
  const isUserScrolling = useRef(false);
  const [scrollValue, setScrollValue] = useState(value);
  const totalItems = max - min + 1;
  const topPadding = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

  // Scroll to value on mount and when value changes externally
  useEffect(() => {
    if (!isUserScrolling.current) {
      const offset = (value - min) * ITEM_HEIGHT;
      scrollRef.current?.scrollTo({ y: offset, animated: false });
      setScrollValue(value);
    }
  }, [value, min]);

  // Re-sync when range changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      const offset = (value - min) * ITEM_HEIGHT;
      scrollRef.current?.scrollTo({ y: offset, animated: false });
    }, 50);
    return () => clearTimeout(timeout);
  }, [min, max]);

  // Track scroll position for visual updates only (no state change = no re-render lag)
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserScrolling.current = true;
    const scrollY = e.nativeEvent.contentOffset.y;
    const rawValue = min + Math.round(scrollY / ITEM_HEIGHT);
    const clampedValue = Math.max(min, Math.min(max, rawValue));

    if (clampedValue !== lastValueRef.current) {
      lastValueRef.current = clampedValue;
      setScrollValue(clampedValue);
      selectionFeedback();
    }
  }, [min, max]);

  // Commit value only when scrolling stops
  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const rawValue = min + Math.round(scrollY / ITEM_HEIGHT);
    const snappedValue = Math.max(min, Math.min(max, rawValue));
    const snappedOffset = (snappedValue - min) * ITEM_HEIGHT;

    scrollRef.current?.scrollTo({ y: snappedOffset, animated: true });
    onValueChange(snappedValue);
    setScrollValue(snappedValue);
    isUserScrolling.current = false;
  }, [min, max, onValueChange]);

  const highlightBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  // Render items
  const items = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < totalItems; i++) {
      arr.push(min + i);
    }
    return arr;
  }, [min, max, totalItems]);

  return (
    <View style={vPickerStyles.container}>
      {/* Selection highlight band */}
      <View style={[vPickerStyles.highlight, { backgroundColor: highlightBg, top: topPadding }]} pointerEvents="none" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={32}
        decelerationRate={0.985}
        snapToInterval={ITEM_HEIGHT}
        contentContainerStyle={{
          paddingVertical: topPadding,
        }}
      >
        {items.map((val) => {
          const distance = Math.abs(val - scrollValue);
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : distance === 2 ? 0.25 : 0.12;
          const isSelected = val === scrollValue;

          return (
            <View key={val} style={[vPickerStyles.item, { opacity }]}>
              <NumberText
                weight={isSelected ? 'semiBold' : 'regular'}
                style={[
                  vPickerStyles.itemText,
                  { color: isSelected ? colors.primary : colors.text },
                  isSelected && vPickerStyles.itemTextSelected,
                ]}
              >
                {val}
              </NumberText>
              {unit && (
                <Text style={[
                  vPickerStyles.itemUnit,
                  { color: isSelected ? colors.primary : colors.textMuted },
                  isSelected && { opacity: 0.8 },
                ]}>
                  {unit}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const vPickerStyles = StyleSheet.create({
  container: {
    height: PICKER_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    zIndex: 0,
  },
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  itemText: {
    fontSize: 20,
    fontFamily: Fonts.numericRegular,
    textAlign: 'center',
  },
  itemTextSelected: {
    fontSize: 26,
    fontFamily: Fonts.numericSemiBold,
  },
  itemUnit: {
    fontSize: 14,
    fontFamily: Fonts.light,
  },
});

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
          <NumberText weight="light" style={[styles.subtitleText, { color: colors.textSecondary }]}>
            Help us calculate your ideal nutrition targets with accurate measurements.
          </NumberText>
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

        <NumberText weight="light" style={[styles.inputLabel, { color: colors.text }]}>Current Weight</NumberText>
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
            <NumberText weight="light" style={[styles.inputLabel, { color: colors.text, marginTop: 24 }]}>Target Weight</NumberText>
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
              <VerticalScrollPicker
                min={3}
                max={8}
                value={state.heightFt}
                onValueChange={setHeightFt}
                unit="ft"
                colors={colors}
                isDark={isDark}
              />
            </View>
            <View style={styles.heightInput}>
              <VerticalScrollPicker
                min={0}
                max={11}
                value={state.heightIn}
                onValueChange={setHeightIn}
                unit="in"
                colors={colors}
                isDark={isDark}
              />
            </View>
          </View>
        ) : (
          <VerticalScrollPicker
            min={91}
            max={244}
            value={state.heightCm}
            onValueChange={setHeightCm}
            unit="cm"
            colors={colors}
            isDark={isDark}
          />
        )}
      </GlassSection>

      {/* Age Section */}
      <GlassSection isDark={isDark}>
        <Text style={[styles.sectionTitle, { marginBottom: 12, color: colors.text }]}>AGE</Text>
        <VerticalScrollPicker
          min={13}
          max={120}
          value={state.age}
          onValueChange={setAge}
          unit="years"
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
    fontFamily: Fonts.numericLight,
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
    fontFamily: Fonts.numericLight,
    color: Colors.text,
    marginBottom: 8,
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
    fontFamily: Fonts.numericSemiBold,
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
