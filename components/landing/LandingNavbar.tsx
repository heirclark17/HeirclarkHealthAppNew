// Landing Page Glass Navbar
import React, { useEffect } from 'react';
import {
  Platform,
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
} from 'react-native';
import { Link } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { liquidGlass, spacing, radius } from '../../constants/landingTheme';
import { useBreakpoint } from '../../hooks/useResponsive';
import { LandingGlassButton } from './LandingGlassButton';
import { GLASS_SPRING } from '../../constants/Animations';
import { withSpring } from 'react-native-reanimated';

export function LandingNavbar() {
  const insets = useSafeAreaInsets();
  const breakpoint = useBreakpoint();
  const scrollY = useSharedValue(0);
  const hasScrolled = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleScroll = () => {
      const y = window.scrollY;
      scrollY.value = y;
      hasScrolled.value = withSpring(y > 50 ? 1 : 0, GLASS_SPRING);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolate(
      hasScrolled.value,
      [0, 1],
      [0, 0.8],
      Extrapolation.CLAMP
    );

    return {
      backgroundColor: `rgba(5, 5, 7, ${backgroundColor})`,
      borderBottomColor: `rgba(255, 255, 255, ${interpolate(hasScrolled.value, [0, 1], [0, 0.06])})`,
    };
  });

  const blurStyle = useAnimatedStyle((): any => ({
    // @ts-ignore
    backdropFilter: `blur(${interpolate(hasScrolled.value, [0, 1], [0, 60])}px)`,
    WebkitBackdropFilter: `blur(${interpolate(hasScrolled.value, [0, 1], [0, 60])}px)`,
  }));

  const isMobile = breakpoint === 'mobile';

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Pricing', href: '#pricing' },
  ];

  const handleAppStorePress = () => {
    // Replace with actual App Store link
    Linking.openURL('https://apps.apple.com/app/heirclark');
  };

  const scrollToSection = (href: string) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top || spacing.md },
        animatedStyle,
        Platform.OS === 'web' && blurStyle,
      ]}
    >
      <View style={[styles.content, isMobile && styles.contentMobile]}>
        {/* Logo */}
        <Link href="/(marketing)" asChild>
          <Pressable style={styles.logo}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoText}>H</Text>
            </View>
            {!isMobile && (
              <Text style={styles.brandName}>Heirclark</Text>
            )}
          </Pressable>
        </Link>

        {/* Nav Links - Desktop */}
        {!isMobile && (
          <View style={styles.navLinks}>
            {navLinks.map((link) => (
              <Pressable
                key={link.label}
                style={styles.navLink}
                onPress={() => scrollToSection(link.href)}
              >
                <Text style={styles.navLinkText}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* CTA */}
        <View style={styles.actions}>
          <LandingGlassButton
            variant="primary"
            size={isMobile ? 'sm' : 'md'}
            label={isMobile ? 'Get App' : 'Download App'}
            onPress={handleAppStorePress}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    maxWidth: 1280,
    marginHorizontal: 'auto',
    width: '100%',
  },
  contentMobile: {
    paddingHorizontal: spacing.md,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: liquidGlass.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
  },
  brandName: {
    color: liquidGlass.text.primary,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
  },
  navLinks: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  navLink: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  navLinkText: {
    color: liquidGlass.text.secondary,
    fontSize: 15,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
