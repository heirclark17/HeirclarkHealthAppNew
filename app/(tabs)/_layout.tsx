/**
 * iOS 26 Liquid Glass Tab Bar
 *
 * Design based on Apple's WWDC 2025 Liquid Glass guidelines:
 * - Floating capsule-shaped tab bar
 * - Real-time blur and refraction effects
 * - Dynamic shadow adaptation
 * - Interactive press animations with haptic feedback
 * - Specular highlights responding to interaction
 *
 * References:
 * - https://developer.apple.com/videos/play/wwdc2025/219/
 * - https://github.com/conorluddy/LiquidGlassReference
 */

import { useRouter, Redirect, usePathname } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { Platform, StyleSheet, View, Pressable, useWindowDimensions, ActivityIndicator, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Flag, UtensilsCrossed, Bookmark, Dumbbell, Library, Activity, Watch, Settings, Plus } from 'lucide-react-native';
import { lightImpact, mediumImpact, rigidImpact, selectionFeedback } from '../../utils/haptics';
import { useState, useEffect, forwardRef, useRef, useCallback, useMemo } from 'react';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

// Conditionally import Reanimated only on native platforms to avoid web infinite loops
// Provide no-op implementations for web to avoid conditional hook calls
let Animated: any = View;
let useSharedValue: any;
let useAnimatedStyle: any;
let withSpring: any;
let withTiming: any;

if (Platform.OS !== 'web') {
  try {
    const Reanimated = require('react-native-reanimated');
    Animated = Reanimated.default;
    useSharedValue = Reanimated.useSharedValue;
    useAnimatedStyle = Reanimated.useAnimatedStyle;
    withSpring = Reanimated.withSpring;
    withTiming = Reanimated.withTiming;
  } catch (e) {
    // Reanimated not available, will use fallback
  }
}

// Fallback implementations for web - no-op hooks that don't animate
if (!useSharedValue) {
  useSharedValue = (initialValue: any) => ({ value: initialValue });
  useAnimatedStyle = (callback: () => any) => callback();
  withSpring = (toValue: any) => toValue;
  withTiming = (toValue: any) => toValue;
}

// Try to import Liquid Glass (only works after rebuild with Xcode 26+)
let LiquidGlassView: any = null;
let isLiquidGlassSupported = false;
try {
  const liquidGlass = require('@callstack/liquid-glass');
  LiquidGlassView = liquidGlass.LiquidGlassView;
  isLiquidGlassSupported = liquidGlass.isLiquidGlassSupported;
} catch (e) {
  // Liquid Glass requires native rebuild
}

// ============================================================================
// iOS 26 Design Constants
// Based on Apple HIG and WWDC 2025 Liquid Glass specifications
// ============================================================================

const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM_MARGIN = 12;
const FAB_SIZE = 56;
const FAB_GAP = 10;
const HORIZONTAL_MARGIN = 16;
const ICON_SIZE = 26;
const ACTIVE_ICON_SIZE = 26;

// Liquid Glass Active Indicator - iOS 26 style
const INDICATOR_HEIGHT = 56; // Larger pill size
const INDICATOR_PADDING = 4; // Minimal padding for maximum width

// Scrollable tab bar dimensions
const TAB_ITEM_WIDTH = 56; // Fixed width for each tab item
const TAB_ITEM_SPACING = 4; // Spacing between tabs

// iOS 26 Liquid Glass color system
const GLASS_COLORS = {
  light: {
    background: 'rgba(255, 255, 255, 0.72)',
    backgroundPressed: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(255, 255, 255, 0.5)',
    borderOuter: 'rgba(0, 0, 0, 0.06)',
    iconActive: '#1D1D1F',
    iconInactive: 'rgba(60, 60, 67, 0.45)',
    fabBackground: 'rgba(255, 255, 255, 0.88)',
    fabIcon: '#1D1D1F',
    shadow: 'rgba(0, 0, 0, 0.12)',
    shadowDeep: 'rgba(0, 0, 0, 0.08)',
    // Liquid glass indicator - iOS 26 style (light mode) - clean, no borders
    indicatorBackground: 'rgba(255, 255, 255, 0.5)',
    indicatorShadow: 'rgba(0, 0, 0, 0.08)',
    indicatorHighlight: 'rgba(255, 255, 255, 0.95)',
  },
  dark: {
    background: 'rgba(44, 44, 46, 0.72)',
    backgroundPressed: 'rgba(58, 58, 60, 0.85)',
    border: 'rgba(255, 255, 255, 0.12)',
    borderOuter: 'rgba(0, 0, 0, 0.3)',
    iconActive: '#FFFFFF',
    iconInactive: 'rgba(235, 235, 245, 0.45)',
    fabBackground: 'rgba(58, 58, 60, 0.88)',
    fabIcon: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.45)',
    shadowDeep: 'rgba(0, 0, 0, 0.35)',
    // Liquid glass indicator - iOS 26 style (dark mode) - lighter, clean
    indicatorBackground: 'rgba(255, 255, 255, 0.28)',
    indicatorShadow: 'rgba(0, 0, 0, 0.25)',
    indicatorHighlight: 'rgba(255, 255, 255, 0.5)',
  },
};

// iOS 26 Spring Animation Config (matches Apple's glass behavior)
const GLASS_SPRING = {
  damping: 18,
  stiffness: 380,
  mass: 0.8,
};

const PRESS_SPRING = {
  damping: 22,
  stiffness: 450,
};

// Liquid indicator spring - smooth glass effect
const LIQUID_SPRING = {
  damping: 18,
  stiffness: 180,
  mass: 1,
};

// ============================================================================
// Tab Configuration with Semantic Icons
// Icons chosen to clearly represent each page's function
// ============================================================================

type LucideIcon = React.ComponentType<{ size: number; color: string }>;

interface TabConfig {
  name: string;
  href: string;
  Icon: LucideIcon;
  label: string;
}

const TAB_CONFIG: TabConfig[] = [
  {
    name: 'index',
    href: '/',
    Icon: Home,
    label: 'Home'
  },
  {
    name: 'goals',
    href: '/goals',
    Icon: Flag,
    label: 'Goals'
  },
  {
    name: 'meals',
    href: '/meals',
    Icon: UtensilsCrossed,
    label: 'Meals'
  },
  {
    name: 'saved-meals',
    href: '/saved-meals',
    Icon: Bookmark,
    label: 'Saved'
  },
  {
    name: 'programs',
    href: '/programs',
    Icon: Dumbbell,
    label: 'Training'
  },
  {
    name: 'program-library',
    href: '/program-library',
    Icon: Library,
    label: 'Programs'
  },
  {
    name: 'accountability',
    href: '/accountability',
    Icon: Activity,
    label: 'Tracking'
  },
  {
    name: 'wearables',
    href: '/wearables',
    Icon: Watch,
    label: 'Devices'
  },
  {
    name: 'settings',
    href: '/settings',
    Icon: Settings,
    label: 'Settings'
  },
];

// ============================================================================
// Animated Tab Button Component
// iOS 26-style glass button with press animation and haptic feedback
// ============================================================================

interface GlassTabButtonProps extends TabTriggerSlotProps {
  Icon: LucideIcon;
  isDark: boolean;
}

const GlassTabButton = forwardRef<View, GlassTabButtonProps>(
  ({ isFocused, Icon, isDark, ...props }, ref) => {
    const colors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

    // Animation values - works on both native and web
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const handlePressIn = useCallback(() => {
      // iOS 26 glass press: subtle scale with rigid haptic
      if (withSpring && withTiming) {
        scale.value = withSpring(0.92, PRESS_SPRING);
        opacity.value = withSpring(0.7, GLASS_SPRING);
      }
      rigidImpact(); // Glass-like rigid feedback
    }, []);

    const handlePressOut = useCallback(() => {
      if (withSpring && withTiming) {
        scale.value = withSpring(1, GLASS_SPRING);
        opacity.value = withSpring(1, GLASS_SPRING);
      }
    }, []);

    const handlePress = useCallback(() => {
      if (!isFocused) {
        selectionFeedback(); // Selection haptic for tab change
      }
      props.onPress?.();
    }, [isFocused, props.onPress]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const iconColor = isFocused ? colors.iconActive : colors.iconInactive;

    // Use Animated.View on native, regular View on web
    const AnimatedViewComponent = Animated !== View ? Animated.View : View;

    return (
      <AnimatedViewComponent style={[styles.tabButtonWrapper, animatedContainerStyle]}>
        <Pressable
          ref={ref}
          {...props}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={styles.tabButton}
          accessibilityRole="tab"
          accessibilityState={{ selected: isFocused }}
        >
          <Icon
            size={ICON_SIZE}
            color={iconColor}
          />
        </Pressable>
      </AnimatedViewComponent>
    );
  }
);

GlassTabButton.displayName = 'GlassTabButton';

// ============================================================================
// Floating Action Button (Log Meal)
// iOS 26-style floating glass button with enhanced press effects
// ============================================================================

function FloatingActionButton({
  style,
  isDark
}: {
  style?: any;
  isDark: boolean;
}) {
  const router = useRouter();
  const colors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

  // Animation values - works on both native and web
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    if (withSpring) {
      scale.value = withSpring(0.9, PRESS_SPRING);
      rotation.value = withSpring(45, { damping: 12, stiffness: 200 });
    }
  }, []);

  const handlePressOut = useCallback(() => {
    if (withSpring) {
      scale.value = withSpring(1, GLASS_SPRING);
      rotation.value = withSpring(0, GLASS_SPRING);
    }
  }, []);

  const handlePress = useCallback(() => {
    mediumImpact(); // Medium haptic for primary action
    router.push('/(tabs)/?openMealModal=true');
  }, [router]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glassStyle = {
    borderRadius: FAB_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
  };

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.4 : 0.18,
      shadowRadius: 16,
    },
    android: {
      elevation: 10,
    },
    default: {
      boxShadow: isDark
        ? '0px 6px 16px rgba(0, 0, 0, 0.4)'
        : '0px 6px 16px rgba(0, 0, 0, 0.18)',
    },
  });

  // Use Animated.View on native, regular View on web
  const AnimatedViewComponent = Animated !== View ? Animated.View : View;

  return (
    <AnimatedViewComponent style={[styles.fabContainer, style, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.fab}
        accessibilityLabel="Log a meal"
        accessibilityRole="button"
      >
        {LiquidGlassView && isLiquidGlassSupported ? (
          <LiquidGlassView
            interactive
            effect="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, glassStyle, shadowStyle]}
          />
        ) : (
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={[
              StyleSheet.absoluteFill,
              glassStyle,
              shadowStyle,
              { backgroundColor: colors.fabBackground },
            ]}
          />
        )}

        {/* Plus icon */}
        <Plus
          size={28}
          color={colors.fabIcon}
        />
      </Pressable>
    </AnimatedViewComponent>
  );
}

// ============================================================================
// Liquid Glass Active Indicator
// Animated pill that slides between tabs with liquid glass effect
// ============================================================================

interface LiquidGlassIndicatorProps {
  activeIndex: number;
  tabCount: number;
  isDark: boolean;
  scrollOffset?: number;
}

function LiquidGlassIndicator({
  activeIndex,
  tabCount,
  isDark,
  scrollOffset = 0,
}: LiquidGlassIndicatorProps) {
  const colors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

  // Fixed-width tabs for scrollable layout
  const tabWidth = TAB_ITEM_WIDTH + TAB_ITEM_SPACING;
  const indicatorWidth = TAB_ITEM_WIDTH; // Same width as tab item

  // Animated position - center indicator over tab
  const getTargetX = (index: number) => INDICATOR_PADDING + (index * tabWidth) + (TAB_ITEM_SPACING / 2);
  const translateX = useSharedValue(getTargetX(activeIndex));
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);

  // Animate when active index changes - smooth transition
  useEffect(() => {
    const targetX = getTargetX(activeIndex);

    if (withSpring) {
      // Subtle stretch during movement
      scaleX.value = withSpring(1.08, { damping: 15, stiffness: 200 });
      scaleY.value = withSpring(0.95, { damping: 15, stiffness: 200 });

      // Move to new position
      translateX.value = withSpring(targetX, LIQUID_SPRING, () => {
        // Settle back
        scaleX.value = withSpring(1, LIQUID_SPRING);
        scaleY.value = withSpring(1, LIQUID_SPRING);
      });
    } else {
      // Web fallback - no animation
      translateX.value = targetX;
    }
  }, [activeIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));

  // Shadow for depth
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.35 : 0.28,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    default: {
      boxShadow: isDark
        ? '0px 3px 20px rgba(0, 0, 0, 0.45)'
        : '0px 3px 20px rgba(0, 0, 0, 0.22)',
    },
  });

  // Use Animated.View on native, regular View on web
  const AnimatedViewComponent = Animated !== View ? Animated.View : View;

  return (
    <AnimatedViewComponent
      style={[
        styles.liquidIndicator,
        {
          width: indicatorWidth,
          height: INDICATOR_HEIGHT,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      {/* Liquid Glass blur effect */}
      <BlurView
        intensity={isDark ? 40 : 60}
        tint="light"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: INDICATOR_HEIGHT / 2,
            overflow: 'hidden',
          },
        ]}
      />

      {/* Glass background - clean, no borders */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: INDICATOR_HEIGHT / 2,
            backgroundColor: colors.indicatorBackground,
          },
          shadowStyle,
        ]}
      />

      {/* Subtle top highlight for glass depth */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: INDICATOR_HEIGHT / 2,
            overflow: 'hidden',
          },
        ]}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: '5%',
            right: '5%',
            height: INDICATOR_HEIGHT / 2.5,
            backgroundColor: colors.indicatorHighlight,
            borderBottomLeftRadius: INDICATOR_HEIGHT,
            borderBottomRightRadius: INDICATOR_HEIGHT,
            opacity: isDark ? 0.08 : 0.35,
          }}
        />
      </View>
    </AnimatedViewComponent>
  );
}

// ============================================================================
// iOS 26 Liquid Glass Tab Bar
// Main tab bar component with glass effect and floating capsule design
// Horizontally scrollable to accommodate all tabs
// ============================================================================

function LiquidGlassTabBar({
  screenWidth,
  bottomInset
}: {
  screenWidth: number;
  bottomInset: number;
}) {
  const { settings } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;
  const pathname = usePathname();
  const scrollViewRef = useRef<ScrollView>(null);

  // Determine active tab index from pathname
  const activeTabIndex = useMemo(() => {
    const path = pathname.replace('/(tabs)', '').replace(/^\//, '');
    const index = TAB_CONFIG.findIndex(tab => {
      if (tab.name === 'index' && (path === '' || path === 'index')) return true;
      return path === tab.name || path.startsWith(tab.name + '/');
    });
    return index >= 0 ? index : 0;
  }, [pathname]);

  // Calculate dimensions - iOS 26 capsule layout
  const tabBarWidth = screenWidth - (HORIZONTAL_MARGIN * 2) - FAB_SIZE - FAB_GAP;
  const tabBarLeft = HORIZONTAL_MARGIN;
  const fabLeft = tabBarLeft + tabBarWidth + FAB_GAP;

  // Calculate total content width for scrollable tabs
  const totalTabsWidth = (TAB_ITEM_WIDTH + TAB_ITEM_SPACING) * TAB_CONFIG.length + (INDICATOR_PADDING * 2);

  // Auto-scroll to active tab when it changes
  useEffect(() => {
    if (scrollViewRef.current) {
      const tabPosition = activeTabIndex * (TAB_ITEM_WIDTH + TAB_ITEM_SPACING);
      const centerOffset = (tabBarWidth - TAB_ITEM_WIDTH) / 2;
      const scrollTo = Math.max(0, tabPosition - centerOffset);
      scrollViewRef.current.scrollTo({ x: scrollTo, animated: true });
    }
  }, [activeTabIndex, tabBarWidth]);

  // iOS 26 glass styling
  const glassStyle = {
    borderRadius: TAB_BAR_HEIGHT / 2,
    borderWidth: 1,
    borderColor: colors.border,
  };

  // iOS 26 layered shadow system - disabled
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    android: {
      elevation: 0,
    },
    default: {
      boxShadow: 'none',
    },
  });

  // Outer glow for depth (iOS 26 characteristic) - disabled
  const outerGlowStyle = Platform.select({
    ios: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    default: {},
  });

  return (
    <View
      style={[
        styles.bottomContainer,
        {
          bottom: bottomInset + TAB_BAR_BOTTOM_MARGIN,
          pointerEvents: 'box-none'
        }
      ]}
    >
      {/* Tab Bar Capsule */}
      <View
        style={[
          styles.tabBarContainer,
          {
            left: tabBarLeft,
            width: tabBarWidth,
            height: TAB_BAR_HEIGHT,
          },
          outerGlowStyle,
        ]}
      >
        {/* Glass Background */}
        {LiquidGlassView && isLiquidGlassSupported ? (
          <LiquidGlassView
            interactive
            effect="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, glassStyle, shadowStyle]}
          />
        ) : (
          <>
            {/* Outer border for depth */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: TAB_BAR_HEIGHT / 2,
                  borderWidth: 1,
                  borderColor: colors.borderOuter,
                },
              ]}
            />
            <BlurView
              intensity={isDark ? 55 : 75}
              tint={isDark ? 'dark' : 'light'}
              style={[
                StyleSheet.absoluteFill,
                glassStyle,
                shadowStyle,
                {
                  backgroundColor: colors.background,
                  margin: 1, // Inset for outer border
                },
              ]}
            />
          </>
        )}

        {/* Scrollable Tab Container */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollableTabList,
            { width: totalTabsWidth },
          ]}
          style={styles.tabScrollView}
          bounces={true}
          decelerationRate="fast"
          snapToInterval={TAB_ITEM_WIDTH + TAB_ITEM_SPACING}
          snapToAlignment="center"
        >
          {/* Liquid Glass Active Indicator - renders behind tabs */}
          <LiquidGlassIndicator
            activeIndex={activeTabIndex}
            tabCount={TAB_CONFIG.length}
            isDark={isDark}
          />

          {/* Tab Buttons */}
          {TAB_CONFIG.map((tab) => (
            <View key={tab.name} style={styles.scrollableTabItem}>
              <TabTrigger name={tab.name} asChild>
                <GlassTabButton
                  Icon={tab.Icon}
                  isDark={isDark}
                />
              </TabTrigger>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <FloatingActionButton
        isDark={isDark}
        style={{
          position: 'absolute',
          left: fabLeft,
          width: FAB_SIZE,
          height: FAB_SIZE,
          top: (TAB_BAR_HEIGHT - FAB_SIZE) / 2,
        }}
      />
    </View>
  );
}

// ============================================================================
// Tab Layout Export
// ============================================================================

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  // Removed auth check - let index.tsx handle routing

  return (
    <Tabs>
      {/* Screen content */}
      <TabSlot />

      {/* iOS 26 Liquid Glass Tab Bar */}
      <LiquidGlassTabBar
        screenWidth={screenWidth}
        bottomInset={insets.bottom}
      />

      {/* Hidden TabList for route definitions */}
      <TabList style={styles.hiddenTabList}>
        {TAB_CONFIG.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} />
        ))}
      </TabList>
    </Tabs>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  hiddenTabList: {
    display: 'none',
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
    height: 0,
    width: 0,
    overflow: 'hidden',
  },
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBarContainer: {
    position: 'absolute',
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  tabScrollView: {
    flex: 1,
    height: '100%',
  },
  scrollableTabList: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: INDICATOR_PADDING,
  },
  scrollableTabItem: {
    width: TAB_ITEM_WIDTH,
    height: '100%',
    marginHorizontal: TAB_ITEM_SPACING / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Above the liquid indicator
  },
  tabList: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: '100%',
    paddingHorizontal: 4,
    zIndex: 1, // Above the liquid indicator
  },
  tabButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  fabContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: '100%',
    height: '100%',
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  liquidIndicator: {
    position: 'absolute',
    top: (TAB_BAR_HEIGHT - INDICATOR_HEIGHT) / 2,
    left: 0,
    borderRadius: INDICATOR_HEIGHT / 2,
    zIndex: 0,
  },
});
