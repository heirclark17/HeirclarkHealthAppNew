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
import { GoalWizardProvider, MealPlanProvider, TrainingProvider, SettingsProvider, FastingTimerProvider, WorkoutTrackingProvider, AdaptiveTDEEProvider, SmartMealLoggerProvider, CalorieBankingProvider, AccountabilityPartnerProvider, ProgressPredictionProvider, WorkoutFormCoachProvider, HabitFormationProvider, RestaurantMenuProvider, SleepRecoveryProvider, HydrationProvider } from '../contexts';
import { AuthProvider } from '../contexts/AuthContext';
import { BackgroundLayer } from '../components/BackgroundLayer';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Urbanist_100Thin,
    Urbanist_200ExtraLight,
    Urbanist_300Light,
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Web: Force mobile view with iPhone dimensions
  if (Platform.OS === 'web') {
    return (
      <SafeAreaProvider>
        <AuthProvider>
          <SettingsProvider>
            <BackgroundLayer>
              <GoalWizardProvider>
                <AdaptiveTDEEProvider>
                  <SmartMealLoggerProvider>
                    <CalorieBankingProvider>
                      <MealPlanProvider>
                        <TrainingProvider>
                          <FastingTimerProvider>
                            <WorkoutTrackingProvider>
                              <AccountabilityPartnerProvider>
                                <ProgressPredictionProvider>
                                  <WorkoutFormCoachProvider>
                                    <HabitFormationProvider>
                                      <RestaurantMenuProvider>
                                        <SleepRecoveryProvider>
                                          <HydrationProvider>
                                            <View style={styles.webContainer}>
                                              <View style={styles.mobileFrame}>
                                                <Slot />
                                              </View>
                                            </View>
                                          </HydrationProvider>
                                        </SleepRecoveryProvider>
                                      </RestaurantMenuProvider>
                                    </HabitFormationProvider>
                                  </WorkoutFormCoachProvider>
                                </ProgressPredictionProvider>
                              </AccountabilityPartnerProvider>
                            </WorkoutTrackingProvider>
                          </FastingTimerProvider>
                        </TrainingProvider>
                      </MealPlanProvider>
                    </CalorieBankingProvider>
                  </SmartMealLoggerProvider>
                </AdaptiveTDEEProvider>
              </GoalWizardProvider>
            </BackgroundLayer>
          </SettingsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
          <BackgroundLayer>
            <GoalWizardProvider>
              <AdaptiveTDEEProvider>
                <SmartMealLoggerProvider>
                  <CalorieBankingProvider>
                    <MealPlanProvider>
                      <TrainingProvider>
                        <FastingTimerProvider>
                          <WorkoutTrackingProvider>
                            <AccountabilityPartnerProvider>
                              <ProgressPredictionProvider>
                                <WorkoutFormCoachProvider>
                                  <HabitFormationProvider>
                                    <RestaurantMenuProvider>
                                      <SleepRecoveryProvider>
                                        <HydrationProvider>
                                          <Slot />
                                        </HydrationProvider>
                                      </SleepRecoveryProvider>
                                    </RestaurantMenuProvider>
                                  </HabitFormationProvider>
                                </WorkoutFormCoachProvider>
                              </ProgressPredictionProvider>
                            </AccountabilityPartnerProvider>
                          </WorkoutTrackingProvider>
                        </FastingTimerProvider>
                      </TrainingProvider>
                    </MealPlanProvider>
                  </CalorieBankingProvider>
                </SmartMealLoggerProvider>
              </AdaptiveTDEEProvider>
            </GoalWizardProvider>
          </BackgroundLayer>
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
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
