import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, Spacing } from '../constants/Theme';
import { useAuth } from '../contexts/AuthContext';

// Storage key must match AuthContext
const AUTH_STORAGE_KEY = '@heirclark_auth_user';

export default function LoginScreen() {
  const { isAuthenticated, isLoading, signInWithApple, isAppleSignInAvailable, user } = useAuth();
  const [cachedName, setCachedName] = useState<string | null>(null);

  // Check for cached user name (even if signed out, we can personalize the greeting)
  useEffect(() => {
    const loadCachedName = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          const name = parsed.firstName || parsed.fullName?.split(' ')[0] || null;
          setCachedName(name);
        }
      } catch (error) {
        console.log('[Login] No cached user data');
      }
    };
    loadCachedName();
  }, []);

  // Redirect to onboarding or dashboard based on status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoading && isAuthenticated) {
        try {
          const hasCompleted = await AsyncStorage.getItem('hasCompletedOnboarding');
          if (hasCompleted === 'true') {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding');
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          // Default to showing onboarding on error
          router.replace('/onboarding');
        }
      }
    };
    checkOnboardingStatus();
  }, [isLoading, isAuthenticated]);

  const handleSignIn = async () => {
    const success = await signInWithApple();
    if (success) {
      router.replace('/(tabs)');
    }
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#1a1a1a', '#000000']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // If authenticated, show nothing (will redirect)
  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#1a1a1a', '#000000']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Text style={styles.logo}>HEIRCLARK</Text>
        <Text style={styles.tagline}>Your Personal Health Companion</Text>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>&#x1F3CB;&#xFE0F;</Text>
        </View>

        <Text style={styles.title}>
          {cachedName || user?.firstName
            ? `Welcome Back, ${cachedName || user?.firstName}`
            : 'Welcome'}
        </Text>
        <Text style={styles.subtitle}>
          Track your nutrition, optimize your training, and achieve your fitness goals.
        </Text>

        {/* Features Preview */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>&#x1F34E;</Text>
            <Text style={styles.featureText}>Nutrition</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>&#x1F4AA;</Text>
            <Text style={styles.featureText}>Training</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>&#x1F3AF;</Text>
            <Text style={styles.featureText}>Goals</Text>
          </View>
        </View>
      </View>

      {/* Sign In Section */}
      <View style={styles.signInSection}>
        {Platform.OS === 'ios' && isAppleSignInAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={Spacing.borderRadius}
            style={styles.appleButton}
            onPress={handleSignIn}
          />
        ) : (
          // Fallback for web/Android - styled button that calls the same function
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <LinearGradient
              colors={['#FFFFFF', '#F5F5F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.signInButtonGradient}
            >
              <Text style={styles.appleIcon}>&#xF8FF;</Text>
              <Text style={styles.signInButtonText}>Sign in with Apple</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  logoSection: {
    paddingTop: 80,
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.text,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 40,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  signInSection: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    alignItems: 'center',
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  signInButton: {
    width: '100%',
  },
  signInButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: Spacing.borderRadius,
    gap: 8,
  },
  appleIcon: {
    fontSize: 20,
    color: '#000000',
  },
  signInButtonText: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: '#000000',
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },
});
