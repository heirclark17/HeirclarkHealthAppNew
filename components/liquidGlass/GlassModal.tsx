/**
 * GlassModal - Modal/Sheet Component with Liquid Glass Effect
 *
 * A modal overlay component with Liquid Glass styling and animations.
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GlassRadius, GlassSpacing, GlassShadows, GlassMaterials } from '../../theme/liquidGlass';
import { useGlassTheme } from './useGlassTheme';
import { AdaptiveText } from './AdaptiveText';
import { GlassButton } from './GlassButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type GlassModalVariant = 'sheet' | 'center' | 'fullscreen';
export type GlassModalSize = 'small' | 'medium' | 'large' | 'auto';

export interface GlassModalProps {
  /** Whether the modal is visible */
  visible: boolean;

  /** On dismiss/close */
  onDismiss: () => void;

  /** Modal variant */
  variant?: GlassModalVariant;

  /** Modal size (for sheet variant) */
  size?: GlassModalSize;

  /** Modal title */
  title?: string;

  /** Show close button */
  showCloseButton?: boolean;

  /** Show drag indicator (for sheet variant) */
  showDragIndicator?: boolean;

  /** Enable swipe to dismiss (for sheet variant) */
  swipeToDismiss?: boolean;

  /** Enable tap outside to dismiss */
  tapOutsideToDismiss?: boolean;

  /** Custom header content */
  headerContent?: React.ReactNode;

  /** Custom footer content */
  footerContent?: React.ReactNode;

  /** Children elements */
  children?: React.ReactNode;

  /** Container style */
  style?: ViewStyle;

  /** Content style */
  contentStyle?: ViewStyle;
}

const getSizeHeight = (size: GlassModalSize): number | 'auto' => {
  switch (size) {
    case 'small':
      return SCREEN_HEIGHT * 0.3;
    case 'medium':
      return SCREEN_HEIGHT * 0.5;
    case 'large':
      return SCREEN_HEIGHT * 0.85;
    case 'auto':
    default:
      return 'auto' as any;
  }
};

export const GlassModal: React.FC<GlassModalProps> = ({
  visible,
  onDismiss,
  variant = 'sheet',
  size = 'medium',
  title,
  showCloseButton = true,
  showDragIndicator = true,
  swipeToDismiss = true,
  tapOutsideToDismiss = true,
  headerContent,
  footerContent,
  children,
  style,
  contentStyle,
}) => {
  const { isDark, colors, getGlassBackground, getGlassBorder } = useGlassTheme();
  const insets = useSafeAreaInsets();

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      if (variant === 'center') {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      if (variant === 'center') {
        scale.value = withTiming(0.9, { duration: 150 });
      } else {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
      }
    }
  }, [visible, variant]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => {
    if (variant === 'center') {
      return {
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
      };
    }
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // Swipe gesture for sheet
  const panGesture = Gesture.Pan()
    .enabled(swipeToDismiss && variant === 'sheet')
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
        runOnJS(onDismiss)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const blurTint = isDark ? 'dark' : 'light';
  const materialSpec = GlassMaterials.thick;
  const sheetHeight = getSizeHeight(size);

  const renderHeader = () => {
    if (!title && !showCloseButton && !headerContent && !showDragIndicator) {
      return null;
    }

    return (
      <View style={styles.header}>
        {showDragIndicator && variant === 'sheet' && (
          <View style={[styles.dragIndicator, { backgroundColor: colors.text.muted }]} />
        )}
        {headerContent || (
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              {title && (
                <AdaptiveText variant="headline" weight="600">
                  {title}
                </AdaptiveText>
              )}
            </View>
            {showCloseButton && (
              <GlassButton
                icon="close"
                variant="ghost"
                size="small"
                onPress={onDismiss}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    const contentContainerStyle: ViewStyle[] = [
      styles.contentContainer,
      variant === 'sheet' && {
        maxHeight: typeof sheetHeight === 'number' ? sheetHeight : undefined,
        borderTopLeftRadius: GlassRadius.xlarge,
        borderTopRightRadius: GlassRadius.xlarge,
      },
      variant === 'center' && {
        borderRadius: GlassRadius.xlarge,
        maxWidth: 400,
        width: '90%',
      },
      variant === 'fullscreen' && {
        borderRadius: 0,
      },
      style,
    ];

    // iOS with BlurView
    if (Platform.OS === 'ios') {
      return (
        <BlurView
          intensity={materialSpec.blurIntensity}
          tint={blurTint}
          style={[contentContainerStyle, styles.blurContent]}
        >
          <View style={[styles.overlay, { backgroundColor: getGlassBackground('thick') }]}>
            {renderHeader()}
            <View style={[styles.body, contentStyle]}>{children}</View>
            {footerContent && (
              <View style={[styles.footer, { paddingBottom: insets.bottom || GlassSpacing.lg }]}>
                {footerContent}
              </View>
            )}
          </View>
        </BlurView>
      );
    }

    // Android/Web fallback
    return (
      <View
        style={[
          contentContainerStyle,
          styles.fallbackContent,
          {
            backgroundColor: getGlassBackground('thick'),
            borderColor: getGlassBorder('thick'),
          },
        ]}
      >
        {renderHeader()}
        <View style={[styles.body, contentStyle]}>{children}</View>
        {footerContent && (
          <View style={[styles.footer, { paddingBottom: insets.bottom || GlassSpacing.lg }]}>
            {footerContent}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback
          onPress={tapOutsideToDismiss ? onDismiss : undefined}
        >
          <Animated.View
            style={[
              styles.backdrop,
              { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)' },
              animatedBackdropStyle,
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Content */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              variant === 'sheet' && styles.sheetWrapper,
              variant === 'center' && styles.centerWrapper,
              variant === 'fullscreen' && styles.fullscreenWrapper,
              animatedContentStyle,
            ]}
          >
            {renderContent()}
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenWrapper: {
    flex: 1,
  },
  contentContainer: {
    overflow: 'hidden',
    ...GlassShadows.deep,
  },
  blurContent: {
    overflow: 'hidden',
  },
  fallbackContent: {
    borderWidth: 1,
  },
  overlay: {
    flex: 1,
  },
  header: {
    paddingTop: GlassSpacing.sm,
  },
  dragIndicator: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: GlassSpacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GlassSpacing.lg,
    paddingBottom: GlassSpacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: GlassSpacing.lg,
  },
  footer: {
    paddingHorizontal: GlassSpacing.lg,
    paddingTop: GlassSpacing.md,
  },
});

export default GlassModal;
