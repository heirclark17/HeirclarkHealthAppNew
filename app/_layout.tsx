import { useEffect } from 'react';
import { Slot, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Urbanist_100Thin,
  Urbanist_200ExtraLight,
  Urbanist_300Light,
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';
import { GoalWizardProvider, MealPlanProvider, TrainingProvider, SettingsProvider, FastingTimerProvider, WorkoutTrackingProvider, AdaptiveTDEEProvider, SmartMealLoggerProvider, CalorieBankingProvider, AccountabilityPartnerProvider, ProgressPredictionProvider, WorkoutFormCoachProvider, HabitFormationProvider, RestaurantMenuProvider, SleepRecoveryProvider, HydrationProvider, FoodPreferencesProvider } from '../contexts';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { BackgroundLayer } from '../components/BackgroundLayer';
import { ProviderComposer } from '../utils/ProviderComposer';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Urbanist_100Thin,
    Urbanist_200ExtraLight,
    Urbanist_300Light,
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <SettingsProvider>
            <GoalWizardProvider>
              <MealPlanProvider>
                <TrainingProvider>
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
                </TrainingProvider>
              </MealPlanProvider>
            </GoalWizardProvider>
          </SettingsProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
    </ErrorBoundary>
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
