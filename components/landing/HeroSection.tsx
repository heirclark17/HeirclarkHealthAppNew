// Landing Page Hero Section
import React from 'react';
import { View, Text, StyleSheet, Platform, Linking, Image } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { liquidGlass, spacing, typography } from '../../constants/landingTheme';
import { useBreakpoint, useResponsiveValue } from '../../hooks/useResponsive';
import { LandingGlassButton } from './LandingGlassButton';
import { LandingGlassPill } from './LandingGlassPill';
import { Sparkles, ChevronDown, Apple } from 'lucide-react-native';
import { Colors } from '../../constants/Theme';

export function HeroSection() {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  const headlineSize = useResponsiveValue({
    mobile: { fontSize: 40, lineHeight: 48 },
    tablet: { fontSize: 56, lineHeight: 64 },
    desktop: { fontSize: 72, lineHeight: 80 },
  });

  const handleDownload = () => {
    Linking.openURL('https://apps.apple.com/app/heirclark');
  };

  const scrollToFeatures = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View style={[styles.content, isMobile && styles.contentMobile]}>
        {/* Text content */}
        <View style={[styles.textContent, isMobile && styles.textContentMobile]}>
          {/* Badge */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 100 }}
          >
            <LandingGlassPill
              label="AI-Powered Nutrition"
              icon={<Sparkles size={14} color={liquidGlass.accent.primary} />}
              variant="accent"
            />
          </MotiView>

          {/* Headline */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 200 }}
          >
            <Text
              style={[
                typography.displayLarge,
                styles.headline,
                headlineSize,
                isMobile && styles.headlineMobile,
              ]}
            >
              Transform Your{'\n'}
              <Text style={styles.headlineAccent}>Health</Text> Journey
            </Text>
          </MotiView>

          {/* Subheadline */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 400 }}
          >
            <Text
              style={[
                typography.bodyLarge,
                styles.subheadline,
                isMobile && styles.subheadlineMobile,
              ]}
            >
              Intelligent meal planning, seamless tracking, and personalized
              insights powered by AI. Your path to better nutrition starts here.
            </Text>
          </MotiView>

          {/* CTAs */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 600 }}
            style={[styles.ctas, isMobile && styles.ctasMobile]}
          >
            <LandingGlassButton
              variant="primary"
              size="lg"
              label="Download Free"
              icon={<Apple size={20} color="#fff" />}
              onPress={handleDownload}
              fullWidth={isMobile}
            />
            <LandingGlassButton
              variant="secondary"
              size="lg"
              label="See How It Works"
              onPress={scrollToFeatures}
              fullWidth={isMobile}
            />
          </MotiView>

          {/* Social proof mini */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 800, delay: 800 }}
            style={styles.socialProof}
          >
            <Text style={[typography.bodySmall, styles.socialProofText]}>
              4.9 App Store Rating  |  10,000+ Active Users
            </Text>
          </MotiView>
        </View>

        {/* Phone mockup - placeholder for actual screenshot */}
        <MotiView
          from={{ opacity: 0, translateX: 50, scale: 0.95 }}
          animate={{ opacity: 1, translateX: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 1000, delay: 300 }}
          style={[styles.phoneContainer, isMobile && styles.phoneContainerMobile]}
        >
          <View style={styles.phoneMockup}>
            {/* Phone frame */}
            <LinearGradient
              colors={['#2a2a2e', '#1a1a1e', '#0f0f12']}
              style={styles.phoneFrame}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Screen */}
              <View style={styles.phoneScreen}>
                <LinearGradient
                  colors={[liquidGlass.deepSpace, '#111']}
                  style={StyleSheet.absoluteFill}
                />
                {/* App content preview */}
                <View style={styles.screenContent}>
                  <Text style={styles.screenGreeting}>Good Morning</Text>
                  <Text style={styles.screenName}>DERRICK</Text>
                  <View style={styles.screenStats}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>1,847</Text>
                      <Text style={styles.statLabel}>Calories</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>142g</Text>
                      <Text style={styles.statLabel}>Protein</Text>
                    </View>
                  </View>
                </View>
                {/* Dynamic Island */}
                <View style={styles.dynamicIsland} />
              </View>
            </LinearGradient>
            {/* Glow effect */}
            <View style={styles.phoneGlow} />
          </View>
        </MotiView>
      </View>

      {/* Scroll indicator */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 1000, delay: 1200 }}
        style={styles.scrollIndicator}
      >
        <MotiView
          from={{ translateY: 0 }}
          animate={{ translateY: 8 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            repeatReverse: true,
          }}
        >
          <ChevronDown size={32} color={liquidGlass.text.tertiary} />
        </MotiView>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
    paddingTop: 120,
    paddingBottom: spacing['3xl'],
    justifyContent: 'center',
  },
  containerMobile: {
    paddingTop: 100,
    paddingBottom: spacing['2xl'],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1280,
    marginHorizontal: 'auto',
    paddingHorizontal: spacing.xl,
    width: '100%',
    gap: spacing['3xl'],
  },
  contentMobile: {
    flexDirection: 'column',
    paddingHorizontal: spacing.lg,
    gap: spacing['2xl'],
  },
  textContent: {
    flex: 1,
    maxWidth: 600,
    gap: spacing.lg,
  },
  textContentMobile: {
    alignItems: 'center',
  },
  headline: {
    color: liquidGlass.text.primary,
    fontWeight: '700',
    letterSpacing: -2,
  },
  headlineMobile: {
    textAlign: 'center',
  },
  headlineAccent: {
    color: liquidGlass.accent.primary,
  },
  subheadline: {
    color: liquidGlass.text.secondary,
    maxWidth: 480,
  },
  subheadlineMobile: {
    textAlign: 'center',
  },
  ctas: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  ctasMobile: {
    flexDirection: 'column',
    width: '100%',
  },
  socialProof: {
    marginTop: spacing.md,
  },
  socialProofText: {
    color: liquidGlass.text.tertiary,
  },
  phoneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneContainerMobile: {
    marginTop: spacing.xl,
  },
  phoneMockup: {
    position: 'relative',
  },
  phoneFrame: {
    width: 280,
    height: 580,
    borderRadius: 44,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: Colors.background,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 40,
      },
      android: {
        elevation: 20,
      },
      default: {
        boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 38,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  screenContent: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: 60,
    alignItems: 'center',
  },
  screenGreeting: {
    color: liquidGlass.text.tertiary,
    fontSize: 14,
    marginBottom: 4,
  },
  screenName: {
    color: liquidGlass.text.primary,
    fontSize: 28,
    fontWeight: '200',
    letterSpacing: 4,
    marginBottom: spacing.xl,
  },
  screenStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statBox: {
    backgroundColor: liquidGlass.glass.standard,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: liquidGlass.border.subtle,
  },
  statValue: {
    color: liquidGlass.accent.primary,
    fontSize: 24,
    fontWeight: '600',
  },
  statLabel: {
    color: liquidGlass.text.tertiary,
    fontSize: 12,
    marginTop: 4,
  },
  dynamicIsland: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 100,
    height: 28,
    backgroundColor: Colors.background,
    borderRadius: 20,
  },
  phoneGlow: {
    position: 'absolute',
    bottom: -30,
    left: '20%',
    width: '60%',
    height: 20,
    backgroundColor: liquidGlass.accent.glow,
    borderRadius: 100,
    ...(Platform.OS === 'web' ? { filter: 'blur(30px)' } : {}),
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
  },
});
