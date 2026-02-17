/**
 * GlassSegmentedControl - Segmented Control Component with Liquid Glass Effect
 *
 * A segmented control/tab selector with Liquid Glass styling and animations.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Platform, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassRadius, GlassSpacing, GlassShadows, GlassMaterials } from '../../theme/liquidGlass';
import { useGlassTheme } from './useGlassTheme';
import { AdaptiveText } from './AdaptiveText';
import { AdaptiveIcon } from './AdaptiveIcon';

export type GlassSegmentedControlSize = 'small' | 'medium' | 'large';

export interface SegmentItem {
  /** Segment key */
  key: string;

  /** Segment label */
  label: string;

  /** Icon name (optional) */
  icon?: React.ComponentProps<typeof AdaptiveIcon>['name'];

  /** Disabled state */
  disabled?: boolean;
}

export interface GlassSegmentedControlProps {
  /** Segment items */
  segments: SegmentItem[];

  /** Currently selected segment key */
  selectedKey: string;

  /** On segment change */
  onChange: (key: string) => void;

  /** Size variant */
  size?: GlassSegmentedControlSize;

  /** Full width */
  fullWidth?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Container style */
  style?: ViewStyle;
}

const getSizeStyles = (size: GlassSegmentedControlSize) => {
  switch (size) {
    case 'small':
      return {
        paddingVertical: GlassSpacing.xs,
        paddingHorizontal: GlassSpacing.sm,
        fontSize: 13,
        iconSize: 14,
        indicatorPadding: 2,
        borderRadius: GlassRadius.small,
      };
    case 'large':
      return {
        paddingVertical: GlassSpacing.md,
        paddingHorizontal: GlassSpacing.xl,
        fontSize: 16,
        iconSize: 20,
        indicatorPadding: 4,
        borderRadius: GlassRadius.large,
      };
    case 'medium':
    default:
      return {
        paddingVertical: GlassSpacing.sm,
        paddingHorizontal: GlassSpacing.lg,
        fontSize: 14,
        iconSize: 16,
        indicatorPadding: 3,
        borderRadius: GlassRadius.medium,
      };
  }
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const GlassSegmentedControl: React.FC<GlassSegmentedControlProps> = ({
  segments,
  selectedKey,
  onChange,
  size = 'medium',
  fullWidth = false,
  disabled = false,
  style,
}) => {
  const { isDark, colors, getGlassBackground, getGlassBorder } = useGlassTheme();
  const sizeStyles = getSizeStyles(size);

  // Track segment widths for indicator animation
  const [segmentWidths, setSegmentWidths] = React.useState<number[]>([]);
  const indicatorLeft = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const selectedIndex = segments.findIndex((s) => s.key === selectedKey);

  useEffect(() => {
    if (segmentWidths.length === segments.length && selectedIndex >= 0) {
      let left = sizeStyles.indicatorPadding;
      for (let i = 0; i < selectedIndex; i++) {
        left += segmentWidths[i];
      }
      indicatorLeft.value = withSpring(left, { damping: 20, stiffness: 200 });
      indicatorWidth.value = withSpring(
        segmentWidths[selectedIndex] - sizeStyles.indicatorPadding * 2,
        { damping: 20, stiffness: 200 }
      );
    }
  }, [selectedIndex, segmentWidths, sizeStyles.indicatorPadding]);

  const handleSegmentLayout = (index: number, event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setSegmentWidths((prev) => {
      const newWidths = [...prev];
      newWidths[index] = width;
      return newWidths;
    });
  };

  const handleSegmentPress = (key: string, isDisabled?: boolean) => {
    if (disabled || isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(key);
  };

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    left: indicatorLeft.value,
    width: indicatorWidth.value,
  }));

  const blurTint = isDark ? 'dark' : 'light';
  const materialSpec = GlassMaterials.thin;

  // Indicator background color
  const indicatorBgColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)';

  const renderSegments = () => (
    <>
      {/* Selection Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: indicatorBgColor,
            borderRadius: sizeStyles.borderRadius - sizeStyles.indicatorPadding,
            top: sizeStyles.indicatorPadding,
            bottom: sizeStyles.indicatorPadding,
          },
          animatedIndicatorStyle,
        ]}
      />

      {/* Segments */}
      {segments.map((segment, index) => {
        const isSelected = segment.key === selectedKey;
        const isSegmentDisabled = segment.disabled || disabled;

        return (
          <TouchableOpacity
            key={segment.key}
            onLayout={(e) => handleSegmentLayout(index, e)}
            onPress={() => handleSegmentPress(segment.key, segment.disabled)}
            disabled={isSegmentDisabled}
            style={[
              styles.segment,
              {
                paddingVertical: sizeStyles.paddingVertical,
                paddingHorizontal: sizeStyles.paddingHorizontal,
              },
              fullWidth && styles.segmentFullWidth,
              isSegmentDisabled && styles.segmentDisabled,
            ]}
            activeOpacity={0.7}
            accessibilityLabel={segment.label}
            accessibilityRole="button"
            accessibilityState={{
              selected: isSelected,
              disabled: isSegmentDisabled,
            }}
          >
            <View style={styles.segmentContent}>
              {segment.icon && (
                <AdaptiveIcon
                  name={segment.icon}
                  size={sizeStyles.iconSize}
                  customColor={
                    isSegmentDisabled
                      ? colors.textMuted
                      : isSelected
                      ? isDark
                        ? Colors.text
                        : Colors.background
                      : colors.textSecondary
                  }
                  style={segment.label ? styles.segmentIcon : undefined}
                />
              )}
              <AdaptiveText
                variant={size === 'small' ? 'caption1' : 'callout'}
                weight={isSelected ? '600' : '400'}
                customColor={
                  isSegmentDisabled
                    ? colors.textMuted
                    : isSelected
                    ? isDark
                      ? Colors.text
                      : Colors.background
                    : colors.textSecondary
                }
              >
                {segment.label}
              </AdaptiveText>
            </View>
          </TouchableOpacity>
        );
      })}
    </>
  );

  const containerStyle: ViewStyle[] = [
    styles.container,
    {
      borderRadius: sizeStyles.borderRadius,
    },
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  // iOS with BlurView
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={materialSpec.blurIntensity}
        tint={blurTint}
        style={[containerStyle, styles.blurContainer]}
      >
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: getGlassBackground('ultraThin'),
              borderRadius: sizeStyles.borderRadius,
            },
          ]}
        >
          {renderSegments()}
        </View>
      </BlurView>
    );
  }

  // Android/Web fallback
  return (
    <View
      style={[
        containerStyle,
        styles.fallbackContainer,
        {
          backgroundColor: getGlassBackground('thin'),
          borderColor: getGlassBorder('thin'),
        },
      ]}
    >
      {renderSegments()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  blurContainer: {
    overflow: 'hidden',
  },
  fallbackContainer: {
    borderWidth: 1,
  },
  overlay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  indicator: {
    position: 'absolute',
    ...GlassShadows.subtle,
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentFullWidth: {
    flex: 1,
  },
  segmentDisabled: {
    opacity: 0.5,
  },
  segmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentIcon: {
    marginRight: GlassSpacing.xs,
  },
});

export default GlassSegmentedControl;
