/**
 * GlassTabBar - Bottom Tab Bar Component with Liquid Glass Effect
 *
 * A bottom tab bar component with Liquid Glass styling.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassSpacing, GlassShadows, GlassMaterials } from '../../theme/liquidGlass';
import { useGlassTheme } from './useGlassTheme';
import { AdaptiveText } from './AdaptiveText';
import { AdaptiveIcon } from './AdaptiveIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface GlassTabItem {
  /** Tab key/route name */
  key: string;

  /** Tab label */
  label: string;

  /** Icon name (Ionicons) */
  icon: React.ComponentProps<typeof AdaptiveIcon>['name'];

  /** Active icon name (optional) */
  activeIcon?: React.ComponentProps<typeof AdaptiveIcon>['name'];

  /** Badge count (optional) */
  badge?: number;
}

export interface GlassTabBarProps {
  /** Tab items */
  tabs: GlassTabItem[];

  /** Currently active tab key */
  activeTab: string;

  /** On tab press */
  onTabPress: (key: string) => void;

  /** Show labels */
  showLabels?: boolean;

  /** Container style */
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface TabItemProps {
  item: GlassTabItem;
  isActive: boolean;
  showLabel: boolean;
  onPress: () => void;
  tabWidth: number;
}

const TabItem: React.FC<TabItemProps> = ({
  item,
  isActive,
  showLabel,
  onPress,
  tabWidth,
}) => {
  const { isDark, colors } = useGlassTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isActive ? 1 : 0.6);

  React.useEffect(() => {
    opacity.value = withTiming(isActive ? 1 : 0.6, { duration: 200 });
  }, [isActive]);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconName = isActive && item.activeIcon ? item.activeIcon : item.icon;
  const activeColor = isDark ? Colors.text : Colors.background;
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';

  return (
    <AnimatedTouchable
      style={[styles.tabItem, { width: tabWidth }, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={1}
    >
      <View style={styles.tabContent}>
        <View style={styles.iconContainer}>
          <AdaptiveIcon
            name={iconName}
            size={24}
            customColor={isActive ? activeColor : inactiveColor}
          />
          {item.badge !== undefined && item.badge > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.semantic.error }]}>
              <AdaptiveText
                variant="caption2"
                customColor=Colors.text
                weight="600"
              >
                {item.badge > 99 ? '99+' : item.badge}
              </AdaptiveText>
            </View>
          )}
        </View>
        {showLabel && (
          <AdaptiveText
            variant="caption2"
            customColor={isActive ? activeColor : inactiveColor}
            style={styles.tabLabel}
          >
            {item.label}
          </AdaptiveText>
        )}
      </View>
    </AnimatedTouchable>
  );
};

export const GlassTabBar: React.FC<GlassTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  showLabels = true,
  style,
}) => {
  const { isDark, getGlassBackground } = useGlassTheme();
  const insets = useSafeAreaInsets();
  const tabWidth = SCREEN_WIDTH / tabs.length;

  const blurTint = isDark ? 'dark' : 'light';
  const materialSpec = GlassMaterials.regular;

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => (
        <TabItem
          key={tab.key}
          item={tab}
          isActive={activeTab === tab.key}
          showLabel={showLabels}
          onPress={() => onTabPress(tab.key)}
          tabWidth={tabWidth}
        />
      ))}
    </View>
  );

  // iOS with BlurView
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={materialSpec.blurIntensity}
        tint={blurTint}
        style={[
          styles.container,
          styles.blurContainer,
          {
            paddingBottom: insets.bottom,
          },
          style,
        ]}
      >
        <View style={[styles.overlay, { backgroundColor: getGlassBackground('thin') }]}>
          {renderTabs()}
        </View>
      </BlurView>
    );
  }

  // Android/Web fallback
  return (
    <View
      style={[
        styles.container,
        styles.fallbackContainer,
        {
          paddingBottom: insets.bottom,
          backgroundColor: getGlassBackground('regular'),
        },
        style,
      ]}
    >
      {renderTabs()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurContainer: {
    overflow: 'hidden',
  },
  fallbackContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    ...GlassShadows.elevated,
  },
  overlay: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 49,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabLabel: {
    marginTop: 2,
  },
});

export default GlassTabBar;
