// Landing Page Final CTA Section
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, Platform, Linking } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { liquidGlass, spacing, typography, radius } from '../../constants/landingTheme';
import { useBreakpoint } from '../../hooks/useResponsive';
import { useScrollReveal } from '../../hooks/useResponsive';
import { LandingGlassCard } from './LandingGlassCard';
import { LandingGlassButton } from './LandingGlassButton';
import { Mail, ArrowRight, Apple } from 'lucide-react-native';

export function CTASection() {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
      setEmail('');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppStorePress = () => {
    Linking.openURL('https://apps.apple.com/app/heirclark');
  };

  return (
    <View ref={ref} style={styles.container} nativeID="download">
      <MotiView
        animate={{
          opacity: isVisible ? 1 : 0,
          translateY: isVisible ? 0 : 40,
          scale: isVisible ? 1 : 0.98,
        }}
        transition={{ type: 'timing', duration: 800 }}
      >
        <LandingGlassCard
          tier="elevated"
          hasSpecular
          hasGlow
          glowColor={liquidGlass.accent.glow}
          style={[styles.card, isMobile && styles.cardMobile]}
        >
          {/* Background gradient */}
          <LinearGradient
            colors={[
              'rgba(78, 205, 196, 0.1)',
              'rgba(150, 206, 180, 0.05)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.content, isMobile && styles.contentMobile]}>
            {/* Text content */}
            <View style={[styles.textContent, isMobile && styles.textContentMobile]}>
              <Text style={[
                typography.displaySmall,
                styles.title,
                isMobile && styles.titleMobile
              ]}>
                Ready to Transform{'\n'}
                <Text style={styles.titleAccent}>Your Health?</Text>
              </Text>

              <Text style={[typography.bodyLarge, styles.description]}>
                Join thousands of users who have already started their journey
                to better nutrition. Download the app today.
              </Text>

              {/* Email signup */}
              {!isSubmitted ? (
                <View style={[styles.emailForm, isMobile && styles.emailFormMobile]}>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                      <Mail size={20} color={liquidGlass.text.tertiary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email for updates"
                        placeholderTextColor={liquidGlass.text.tertiary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                  <LandingGlassButton
                    variant="primary"
                    size="lg"
                    label="Get Early Access"
                    icon={<ArrowRight size={18} color="#fff" />}
                    iconPosition="right"
                    loading={isLoading}
                    onPress={handleSubmit}
                    fullWidth={isMobile}
                  />
                </View>
              ) : (
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  style={styles.successMessage}
                >
                  <Text style={[typography.h4, styles.successText]}>
                    You're on the list!
                  </Text>
                  <Text style={[typography.bodyMedium, styles.successSubtext]}>
                    We'll notify you when we launch.
                  </Text>
                </MotiView>
              )}

              {/* App store button */}
              <View style={styles.appStore}>
                <Text style={[typography.labelMedium, styles.availableText]}>
                  Available now on
                </Text>
                <LandingGlassButton
                  variant="secondary"
                  size="lg"
                  label="Download on App Store"
                  icon={<Apple size={20} color={liquidGlass.text.primary} />}
                  onPress={handleAppStorePress}
                />
              </View>
            </View>
          </View>
        </LandingGlassCard>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  card: {
    maxWidth: 900,
    marginHorizontal: 'auto',
    padding: spacing['3xl'],
    overflow: 'hidden',
  },
  cardMobile: {
    padding: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3xl'],
  },
  contentMobile: {
    flexDirection: 'column',
  },
  textContent: {
    flex: 1,
    gap: spacing.lg,
  },
  textContentMobile: {
    alignItems: 'center',
  },
  title: {
    color: liquidGlass.text.primary,
  },
  titleMobile: {
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 40,
  },
  titleAccent: {
    color: liquidGlass.accent.primary,
  },
  description: {
    color: liquidGlass.text.secondary,
    maxWidth: 500,
  },
  emailForm: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  emailFormMobile: {
    flexDirection: 'column',
    width: '100%',
  },
  inputWrapper: {
    flex: 1,
    minWidth: 280,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: liquidGlass.glass.standard,
    borderWidth: 1,
    borderColor: liquidGlass.border.standard,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: liquidGlass.text.primary,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  successMessage: {
    padding: spacing.lg,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
    alignItems: 'center',
    gap: spacing.xs,
  },
  successText: {
    color: liquidGlass.success,
  },
  successSubtext: {
    color: liquidGlass.text.secondary,
  },
  appStore: {
    marginTop: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  availableText: {
    color: liquidGlass.text.tertiary,
  },
});
