import { useEffect, useState } from 'react';
import { Slot, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Urbanist_100Thin,
  Urbanist_200ExtraLight,
  Urbanist_300Light,
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';
import { GoalWizardProvider, MealPlanProvider, TrainingProvider, CustomWorkoutProvider, SettingsProvider, FastingTimerProvider, WorkoutTrackingProvider, AdaptiveTDEEProvider, SmartMealLoggerProvider, CalorieBankingProvider, AccountabilityPartnerProvider, ProgressPredictionProvider, WorkoutFormCoachProvider, HabitFormationProvider, RestaurantMenuProvider, SleepRecoveryProvider, HydrationProvider, FoodPreferencesProvider } from '../contexts';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { BackgroundLayer } from '../components/BackgroundLayer';
import { ProviderComposer } from '../utils/ProviderComposer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { registerBackgroundSync } from '../services/backgroundSync';
import { secureStorage } from '../services/secureStorage';
import { NamePromptModal } from '../components/NamePromptModal';

// Wrapper component to show name prompt when needed
function AuthGatedContent({ children }: { children: React.ReactNode }) {
  const { needsNamePrompt } = useAuth();
  return (
    <>
      {children}
      <NamePromptModal visible={needsNamePrompt} />
    </>
  );
}

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontTimeout, setFontTimeout] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    // Urbanist fonts for text
    Urbanist_100Thin,
    Urbanist_200ExtraLight,
    Urbanist_300Light,
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
    // SF Pro Rounded fonts for numbers
    'SFProRounded-Ultralight': require('../assets/fonts/SF-Pro-Rounded-Ultralight.otf'),
    'SFProRounded-Thin': require('../assets/fonts/SF-Pro-Rounded-Thin.otf'),
    'SFProRounded-Light': require('../assets/fonts/SF-Pro-Rounded-Light.otf'),
    'SFProRounded-Regular': require('../assets/fonts/SF-Pro-Rounded-Regular.otf'),
    'SFProRounded-Medium': require('../assets/fonts/SF-Pro-Rounded-Medium.otf'),
    'SFProRounded-Semibold': require('../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
    'SFProRounded-Bold': require('../assets/fonts/SF-Pro-Rounded-Bold.otf'),
    'SFProRounded-Heavy': require('../assets/fonts/SF-Pro-Rounded-Heavy.otf'),
    'SFProRounded-Black': require('../assets/fonts/SF-Pro-Rounded-Black.otf'),
  });

  // Add timeout to prevent infinite black screen if fonts fail
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fontsLoaded) {
        console.warn('[RootLayout] Font loading timeout - proceeding without custom fonts');
        setFontTimeout(true);
      }
    }, 5000); // 5 second timeout
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded || fontTimeout || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontTimeout, fontError]);

  // Initialize background sync for Apple Health data
  useEffect(() => {
    const initBackgroundSync = async () => {
      try {
        // Only register on iOS (Apple Health)
        if (Platform.OS === 'ios') {
          await registerBackgroundSync();
          console.log('[RootLayout] Background sync registered');
        }
        // Migrate any existing auth data to secure storage
        await secureStorage.migrateFromAsyncStorage();
      } catch (error) {
        console.error('[RootLayout] Background sync init error:', error);
      }
    };
    initBackgroundSync();
  }, []);

  // Proceed if fonts loaded, timed out, or errored
  if (!fontsLoaded && !fontTimeout && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ErrorBoundary>
      <SafeAreaProvider>
      <AuthProvider>
        <AuthGatedContent>
          <NotificationProvider>
            <SettingsProvider>
              <GoalWizardProvider>
                <MealPlanProvider>
                  <TrainingProvider>
                    <CustomWorkoutProvider>
                      <FastingTimerProvider>
                        <WorkoutTrackingProvider>
                          <CalorieBankingProvider>
                          <RestaurantMenuProvider>
                            <FoodPreferencesProvider>
                              <AccountabilityPartnerProvider>
                                <ProgressPredictionProvider>
                                  <WorkoutFormCoachProvider>
                                    <SleepRecoveryProvider>
                                      <HydrationProvider>
                                        <HabitFormationProvider>
                                          <AdaptiveTDEEProvider>
                                            <SmartMealLoggerProvider>
                                              <BackgroundLayer>
                                                <Slot />
                                              </BackgroundLayer>
                                            </SmartMealLoggerProvider>
                                          </AdaptiveTDEEProvider>
                                        </HabitFormationProvider>
                                      </HydrationProvider>
                                    </SleepRecoveryProvider>
                                  </WorkoutFormCoachProvider>
                                </ProgressPredictionProvider>
                              </AccountabilityPartnerProvider>
                            </FoodPreferencesProvider>
                          </RestaurantMenuProvider>
                          </CalorieBankingProvider>
                        </WorkoutTrackingProvider>
                      </FastingTimerProvider>
                    </CustomWorkoutProvider>
                  </TrainingProvider>
                </MealPlanProvider>
              </GoalWizardProvider>
            </SettingsProvider>
          </NotificationProvider>
        </AuthGatedContent>
      </AuthProvider>
    </SafeAreaProvider>
    </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#000000', // Dark background for web demo
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileFrame: {
    width: 430, // iPhone 16 Pro Max width (latest)
    height: '100%',
    maxHeight: 932, // iPhone 16 Pro Max height
    backgroundColor: '#000000',
    overflow: 'hidden',
    borderRadius: 40, // iPhone rounded corners
    // Use boxShadow for web (RN shadow props are deprecated on web)
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.3)',
  } as any,
});
