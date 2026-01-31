/**
 * LiquidGlassProfileImage
 * A profile picture component with iOS 26 liquid glass aesthetic
 * Features: frosted overlay, soft glowing border, subtle blur effects
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSettings } from '../contexts/SettingsContext';
import { DarkColors, LightColors, Fonts } from '../constants/Theme';
import { lightImpact } from '../utils/haptics';

interface LiquidGlassProfileImageProps {
  size?: number;
  showEditButton?: boolean;
  onImageChange?: (uri: string | null) => void;
}

export function LiquidGlassProfileImage({
  size = 120,
  showEditButton = true,
  onImageChange,
}: LiquidGlassProfileImageProps) {
  const { settings, setProfileImageUri } = useSettings();
  const isDark = settings.themeMode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const [isLoading, setIsLoading] = useState(false);
  const profileImage = settings.profileImageUri;

  // Animation values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Process image - the picker's allowsEditing already handles cropping
  // Visual liquid glass effects are applied via overlays in the render
  const processProfileImage = async (uri: string): Promise<string> => {
    // The image picker with allowsEditing already crops to square
    // Additional processing can be added here if needed
    return uri;
  };

  // Handle image selection
  const handleSelectImage = useCallback(async () => {
    try {
      await lightImpact();

      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        console.log('[ProfileImage] Permission denied');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);

        // Process the image
        const processedUri = await processProfileImage(result.assets[0].uri);

        // Save to settings
        if (setProfileImageUri) {
          setProfileImageUri(processedUri);
        }

        // Notify parent
        onImageChange?.(processedUri);

        // Animate success
        scale.value = withSpring(1.05, {}, () => {
          scale.value = withSpring(1);
        });
        glowOpacity.value = withTiming(0.6, { duration: 300 }, () => {
          glowOpacity.value = withTiming(0.3, { duration: 500 });
        });

        setIsLoading(false);
      }
    } catch (error) {
      console.error('[ProfileImage] Selection error:', error);
      setIsLoading(false);
    }
  }, [setProfileImageUri, onImageChange, scale, glowOpacity, size]);

  // Remove profile image
  const handleRemoveImage = useCallback(async () => {
    await lightImpact();
    if (setProfileImageUri) {
      setProfileImageUri(null);
    }
    onImageChange?.(null);
  }, [setProfileImageUri, onImageChange]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Calculate sizes
  const borderRadius = size / 2;
  const innerSize = size - 4; // Account for border
  const innerBorderRadius = innerSize / 2;

  // Glass border color based on theme
  const glassBorderColor = isDark
    ? 'rgba(255, 255, 255, 0.25)'
    : 'rgba(0, 0, 0, 0.12)';

  const glowColor = isDark
    ? 'rgba(255, 255, 255, 0.4)'
    : 'rgba(255, 255, 255, 0.6)';

  const overlayColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.15)';

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
          },
          animatedContainerStyle,
        ]}
      >
        {/* Outer glow effect */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: size + 16,
              height: size + 16,
              borderRadius: (size + 16) / 2,
              backgroundColor: glowColor,
            },
            animatedGlowStyle,
          ]}
        />

        {/* Main container with glass border */}
        <View
          style={[
            styles.imageWrapper,
            {
              width: size,
              height: size,
              borderRadius,
              borderColor: glassBorderColor,
            },
          ]}
        >
          {profileImage ? (
            <>
              {/* Profile image */}
              <Image
                source={{ uri: profileImage }}
                style={[
                  styles.image,
                  {
                    width: innerSize,
                    height: innerSize,
                    borderRadius: innerBorderRadius,
                  },
                ]}
                resizeMode="cover"
              />

              {/* Frosted glass overlay for liquid glass effect */}
              {Platform.OS === 'ios' && (
                <BlurView
                  intensity={8}
                  tint={isDark ? 'dark' : 'light'}
                  style={[
                    styles.frostedOverlay,
                    {
                      width: innerSize,
                      height: innerSize,
                      borderRadius: innerBorderRadius,
                    },
                  ]}
                />
              )}

              {/* Semi-transparent overlay */}
              <View
                style={[
                  styles.colorOverlay,
                  {
                    width: innerSize,
                    height: innerSize,
                    borderRadius: innerBorderRadius,
                    backgroundColor: overlayColor,
                  },
                ]}
              />

              {/* Inner liquid glass border */}
              <View
                style={[
                  styles.innerBorder,
                  {
                    width: innerSize,
                    height: innerSize,
                    borderRadius: innerBorderRadius,
                    borderColor: glassBorderColor,
                  },
                ]}
              />
            </>
          ) : (
            /* Placeholder when no image */
            <View
              style={[
                styles.placeholder,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerBorderRadius,
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
                },
              ]}
            >
              <Ionicons
                name="person"
                size={size * 0.4}
                color={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'}
              />
            </View>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <View
              style={[
                styles.loadingOverlay,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerBorderRadius,
                },
              ]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>

        {/* Edit button */}
        {showEditButton && (
          <TouchableOpacity
            style={[
              styles.editButton,
              {
                backgroundColor: isDark
                  ? 'rgba(30, 30, 30, 0.9)'
                  : 'rgba(255, 255, 255, 0.9)',
                borderColor: glassBorderColor,
              },
            ]}
            onPress={handleSelectImage}
            activeOpacity={0.7}
          >
            <Ionicons
              name="camera"
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Remove image button (only show if image exists) */}
      {profileImage && showEditButton && (
        <TouchableOpacity
          style={[styles.removeButton, { borderColor: colors.error }]}
          onPress={handleRemoveImage}
          activeOpacity={0.7}
        >
          <Text style={[styles.removeButtonText, { color: colors.error }]}>
            Remove Photo
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 12,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    // Blur effect for glow
    ...Platform.select({
      ios: {
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
    }),
  },
  imageWrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    // Liquid glass shadow
    ...Platform.select({
      ios: {
        shadowColor: Colors.background,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  image: {
    position: 'absolute',
  },
  frostedOverlay: {
    position: 'absolute',
    opacity: 0.3,
  },
  colorOverlay: {
    position: 'absolute',
  },
  innerBorder: {
    position: 'absolute',
    borderWidth: 1,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: Colors.background,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  removeButtonText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
});

export default LiquidGlassProfileImage;
