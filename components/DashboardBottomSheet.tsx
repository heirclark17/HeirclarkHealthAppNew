import React, { useCallback, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import BottomSheet, {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../contexts/SettingsContext';
import { Colors, Fonts, DarkColors, LightColors } from '../constants/Theme';

export interface DashboardBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface DashboardBottomSheetProps {
  title: string;
  children: React.ReactNode;
  snapPoints?: string[];
}

export const DashboardBottomSheet = forwardRef<DashboardBottomSheetRef, DashboardBottomSheetProps>(
  ({ title, children, snapPoints = ['50%', '85%'] }, ref) => {
    const { settings } = useSettings();
    const isDark = settings.themeMode === 'dark';
    const colors = isDark ? DarkColors : LightColors;

    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // Snap points for the bottom sheet
    const snapPointsMemo = useMemo(() => snapPoints, [snapPoints]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetModalRef.current?.present();
      },
      dismiss: () => {
        bottomSheetModalRef.current?.dismiss();
      },
    }));

    // Backdrop component with animated opacity
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    );

    // Handle component for the drag indicator
    const renderHandle = useCallback(() => (
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]} />
      </View>
    ), [isDark]);

    // Background style
    const backgroundStyle = useMemo(() => ({
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    }), [isDark]);

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPointsMemo}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleComponent={renderHandle}
        backgroundStyle={backgroundStyle}
        enableDynamicSizing={false}
        style={styles.bottomSheet}
        accessibilityRole="none"
        accessibilityLabel={`${title} modal`}
      >
        <View style={styles.contentContainer}>
          {/* Header with title and close button */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity
              onPress={() => bottomSheetModalRef.current?.dismiss()}
              style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Scrollable content */}
          <BottomSheetScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    );
  }
);

DashboardBottomSheet.displayName = 'DashboardBottomSheet';

// Export the provider for wrapping the dashboard
export { BottomSheetModalProvider };

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  handleContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
});
