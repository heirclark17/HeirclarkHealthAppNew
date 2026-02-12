// BackgroundSelector - Settings UI for background selection
// Displays thumbnail grid with live calorie counter preview
// Supports pattern, gradient, solid, and custom photo backgrounds

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useSettings } from '../contexts/SettingsContext';
import {
  BACKGROUNDS,
  BackgroundId,
  BackgroundOption,
  getGradientColors,
  getBackgroundById,
} from '../constants/backgrounds';
import { Colors, DarkColors, LightColors, Fonts, Spacing } from '../constants/Theme';
import { lightImpact, mediumImpact } from '../utils/haptics';
import { PatternBackground } from './patterns/PatternBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMBNAIL_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - Spacing.md - Spacing.sm * 2) / 3;

// Category labels for organization
const CATEGORY_LABELS: Record<string, string> = {
  pattern: 'Patterns & Textures',
  abstract: 'Abstract',
  nature: 'Nature',
  weather: 'Weather',
  animal: 'Animal Prints',
  holiday: 'Holiday & Seasonal',
};

interface BackgroundSelectorProps {
  visible: boolean;
  onClose: () => void;
}

// Mini pattern thumbnail renderer (simplified version for thumbnails)
function PatternThumbnail({ patternType, isDark }: { patternType: string; isDark: boolean }) {
  // Render a scaled-down version of the pattern
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <PatternBackground pattern={patternType as any} isDark={isDark} />
    </View>
  );
}

// Background thumbnail preview
function BackgroundThumbnail({
  background,
  isSelected,
  isDark,
  onSelect,
  index,
}: {
  background: BackgroundOption;
  isSelected: boolean;
  isDark: boolean;
  onSelect: () => void;
  index: number;
}) {
  const colors = useMemo(() => {
    return isDark ? DarkColors : LightColors;
  }, [isDark]);

  const gradientColors = getGradientColors(background, isDark);

  // Render background content based on type
  const renderBackgroundPreview = () => {
    if (background.type === 'solid') {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? DarkColors.background : LightColors.background },
          ]}
        />
      );
    }

    if (background.type === 'pattern' && background.patternType) {
      return <PatternThumbnail patternType={background.patternType} isDark={isDark} />;
    }

    // Gradient or animated
    return (
      <LinearGradient
        colors={gradientColors as any}
        locations={background.colors?.locations as any}
        start={background.colors?.start || { x: 0, y: 0 }}
        end={background.colors?.end || { x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(300)}>
      <TouchableOpacity
        style={[
          styles.thumbnail,
          { borderColor: isSelected ? colors.success : colors.border },
          isSelected && styles.thumbnailSelected,
        ]}
        onPress={() => {
          lightImpact();
          onSelect();
        }}
        activeOpacity={0.7}
      >
        {/* Background preview */}
        <View style={styles.thumbnailContent}>
          {renderBackgroundPreview()}

          {/* Glass card preview overlay */}
          <View style={styles.previewCard}>
            <BlurView
              intensity={20}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.previewCardInner,
                {
                  backgroundColor: isDark
                    ? 'rgba(26, 26, 26, 0.6)'
                    : 'rgba(255, 255, 255, 0.6)',
                },
              ]}
            >
              <View style={[styles.previewLine, { backgroundColor: colors.textMuted }]} />
              <View
                style={[
                  styles.previewLineShort,
                  { backgroundColor: colors.textMuted, opacity: 0.5 },
                ]}
              />
            </View>
          </View>

          {/* Selected checkmark */}
          {isSelected && (
            <View style={[styles.checkmark, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={12} color={Colors.text} />
            </View>
          )}

          {/* Premium badge */}
          {background.premium && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.warning }]}>
              <Ionicons name="star" size={8} color={Colors.text} />
            </View>
          )}

          {/* Pattern indicator badge */}
          {background.type === 'pattern' && (
            <View style={[styles.patternBadge, { backgroundColor: isDark ? 'rgba(78, 205, 196, 0.8)' : 'rgba(78, 205, 196, 0.9)' }]}>
              <Ionicons name="grid-outline" size={8} color={Colors.text} />
            </View>
          )}
        </View>

        {/* Label */}
        <Text style={[styles.thumbnailLabel, { color: colors.text }]} numberOfLines={1}>
          {background.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Section header component
function SectionHeader({ title, isDark }: { title: string; isDark: boolean }) {
  const colors = isDark ? DarkColors : LightColors;
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

export function BackgroundSelector({ visible, onClose }: BackgroundSelectorProps) {
  const { settings, setBackgroundImage, setCustomBackgroundUri } = useSettings();
  const [previewId, setPreviewId] = useState<BackgroundId | null>(null);

  const isDark = settings.themeMode === 'dark';
  const colors = useMemo(() => {
    return isDark ? DarkColors : LightColors;
  }, [isDark]);

  const currentBackground = (settings.backgroundImage || 'default') as BackgroundId;
  const displayBackground = previewId || currentBackground;
  const displayBgData = getBackgroundById(displayBackground);
  const displayColors = getGradientColors(displayBgData, isDark);

  // Pick custom photo from device
  const handlePickCustomPhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to set a custom background.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 19], // Phone aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        mediumImpact();
        setCustomBackgroundUri(result.assets[0].uri);
        setBackgroundImage('custom');
        setPreviewId(null);
      }
    } catch (error) {
      console.error('[BackgroundSelector] Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Clear custom photo
  const handleClearCustomPhoto = () => {
    Alert.alert(
      'Remove Custom Photo',
      'Are you sure you want to remove your custom background photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setCustomBackgroundUri(null);
            setBackgroundImage('default');
          },
        },
      ]
    );
  };

  // Organize backgrounds by category
  const organizedBackgrounds = useMemo(() => {
    const defaultBg = BACKGROUNDS.filter(bg => bg.id === 'default');
    const patternBgs = BACKGROUNDS.filter(bg => bg.category === 'pattern');
    const holidayBgs = BACKGROUNDS.filter(bg => bg.category === 'holiday');
    const abstractBgs = BACKGROUNDS.filter(bg => bg.category === 'abstract');
    const natureBgs = BACKGROUNDS.filter(bg => bg.category === 'nature');
    const weatherBgs = BACKGROUNDS.filter(bg => bg.category === 'weather');
    const animalBgs = BACKGROUNDS.filter(bg => bg.category === 'animal');

    return [
      { category: 'default', label: 'Default', items: defaultBg },
      { category: 'pattern', label: CATEGORY_LABELS.pattern, items: patternBgs },
      { category: 'holiday', label: CATEGORY_LABELS.holiday, items: holidayBgs },
      { category: 'animal', label: CATEGORY_LABELS.animal, items: animalBgs },
      { category: 'abstract', label: CATEGORY_LABELS.abstract, items: abstractBgs },
      { category: 'nature', label: CATEGORY_LABELS.nature, items: natureBgs },
      { category: 'weather', label: CATEGORY_LABELS.weather, items: weatherBgs },
    ].filter(section => section.items.length > 0);
  }, []);

  const handleSelect = (id: BackgroundId) => {
    mediumImpact();
    setBackgroundImage(id);
    setPreviewId(null);
  };

  const handleClose = () => {
    setPreviewId(null);
    onClose();
  };

  // Render background preview based on type
  const renderLivePreview = () => {
    // Custom photo background
    if (displayBackground === 'custom' && settings.customBackgroundUri) {
      return (
        <Image
          source={{ uri: settings.customBackgroundUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      );
    }

    if (!displayBgData || displayBgData.type === 'solid') {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? DarkColors.background : LightColors.background },
          ]}
        />
      );
    }

    if (displayBgData.type === 'pattern' && displayBgData.patternType) {
      return (
        <View style={StyleSheet.absoluteFill}>
          <PatternBackground pattern={displayBgData.patternType} isDark={isDark} />
        </View>
      );
    }

    return (
      <LinearGradient
        colors={displayColors as any}
        locations={displayBgData?.colors?.locations as any}
        start={displayBgData?.colors?.start || { x: 0, y: 0 }}
        end={displayBgData?.colors?.end || { x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Live background preview */}
        <View style={styles.previewContainer}>
          {renderLivePreview()}
        </View>

        {/* Content overlay */}
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.headerContent,
                {
                  backgroundColor: isDark
                    ? 'rgba(0, 0, 0, 0.5)'
                    : 'rgba(255, 255, 255, 0.5)',
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={[styles.headerTitle, { color: colors.textMuted }]}>
                  APP BACKGROUND
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.text }]}>
                  {displayBackground === 'custom' ? 'Custom Photo' : (displayBgData?.name || 'Default')}
                </Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Background Preview Area - shows the actual background */}
          <View style={styles.previewArea}>
            {/* This area is transparent so the background shows through */}
          </View>

          {/* Background grid - bottom sheet style */}
          <View style={styles.gridContainer}>
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.gridContent,
                {
                  backgroundColor: isDark
                    ? 'rgba(0, 0, 0, 0.6)'
                    : 'rgba(255, 255, 255, 0.6)',
                },
              ]}
            >
              {/* Drag handle indicator */}
              <View style={styles.dragHandle}>
                <View style={[styles.dragHandleBar, { backgroundColor: colors.textMuted }]} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Custom Photo Section */}
                <View style={styles.customPhotoSection}>
                  <TouchableOpacity
                    style={[
                      styles.customPhotoButton,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        borderColor: currentBackground === 'custom' ? colors.success : 'transparent',
                        borderWidth: currentBackground === 'custom' ? 2 : 0,
                      }
                    ]}
                    onPress={handlePickCustomPhoto}
                    activeOpacity={0.7}
                  >
                    {settings.customBackgroundUri ? (
                      <Image
                        source={{ uri: settings.customBackgroundUri }}
                        style={styles.customPhotoPreview}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.customPhotoPlaceholder}>
                        <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={styles.customPhotoInfo}>
                      <Text style={[styles.customPhotoTitle, { color: colors.text }]}>
                        {settings.customBackgroundUri ? 'Custom Photo' : 'Add Custom Photo'}
                      </Text>
                      <Text style={[styles.customPhotoSubtitle, { color: colors.textMuted }]}>
                        {settings.customBackgroundUri ? 'Tap to change' : 'Choose from your library'}
                      </Text>
                    </View>
                    {settings.customBackgroundUri && (
                      <TouchableOpacity
                        style={[styles.removePhotoButton, { backgroundColor: isDark ? 'rgba(255,107,107,0.2)' : 'rgba(255,107,107,0.15)' }]}
                        onPress={handleClearCustomPhoto}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                      </TouchableOpacity>
                    )}
                    {currentBackground === 'custom' && (
                      <View style={[styles.customPhotoCheckmark, { backgroundColor: colors.success }]}>
                        <Ionicons name="checkmark" size={14} color={Colors.text} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {organizedBackgrounds.map((section, sectionIndex) => (
                  <View key={section.category}>
                    {section.category !== 'default' && (
                      <SectionHeader title={section.label} isDark={isDark} />
                    )}
                    <View style={styles.grid}>
                      {section.items.map((background, index) => (
                        <BackgroundThumbnail
                          key={background.id}
                          background={background}
                          isSelected={currentBackground === background.id}
                          isDark={isDark}
                          onSelect={() => handleSelect(background.id)}
                          index={sectionIndex * 10 + index}
                        />
                      ))}
                    </View>
                  </View>
                ))}

                {/* Info footer */}
                <View style={styles.infoFooter}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.infoText, { color: colors.textMuted }]}>
                    Patterns & textures blur beautifully with liquid glass
                  </Text>
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  previewArea: {
    flex: 1,
    minHeight: 200,
  },
  gridContainer: {
    height: '55%',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gridContent: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  thumbnail: {
    width: THUMBNAIL_WIDTH,
    marginBottom: Spacing.xs,
    borderRadius: Spacing.radiusSM,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderWidth: 2,
  },
  thumbnailContent: {
    aspectRatio: 9 / 14,
    borderRadius: Spacing.radiusSM - 2,
    overflow: 'hidden',
  },
  previewCard: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '25%',
    height: '35%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewCardInner: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  previewLine: {
    height: 4,
    width: '80%',
    borderRadius: 2,
    marginBottom: 4,
  },
  previewLineShort: {
    height: 3,
    width: '50%',
    borderRadius: 1.5,
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    paddingVertical: 6,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  infoText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  // Custom Photo Section Styles
  customPhotoSection: {
    marginBottom: Spacing.md,
  },
  customPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Spacing.radiusSM,
    gap: Spacing.sm,
  },
  customPhotoPreview: {
    width: 56,
    height: 56,
    borderRadius: Spacing.radiusSM,
  },
  customPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: Spacing.radiusSM,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  customPhotoInfo: {
    flex: 1,
  },
  customPhotoTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  customPhotoSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  removePhotoButton: {
    width: 36,
    height: 36,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPhotoCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BackgroundSelector;
