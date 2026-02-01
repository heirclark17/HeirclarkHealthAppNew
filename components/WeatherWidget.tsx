import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../constants/Theme';
import * as Location from 'expo-location';
import { weatherService, WeatherData } from '../services/weatherService';
import { GlassCard } from './GlassCard';

// Map weather condition to Ionicon name
const getWeatherIcon = (condition: string): keyof typeof Ionicons.glyphMap => {
  const conditionMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Clear': 'sunny-outline',
    'Clouds': 'cloud-outline',
    'Rain': 'rainy-outline',
    'Drizzle': 'rainy-outline',
    'Thunderstorm': 'thunderstorm-outline',
    'Snow': 'snow-outline',
    'Mist': 'cloud-outline',
    'Fog': 'cloud-outline',
    'Haze': 'cloud-outline',
    'Smoke': 'cloud-outline',
  };
  return conditionMap[condition] || 'partly-sunny-outline';
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(true);
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Fetch weather using service
      const weatherData = await weatherService.getWeatherByCoords(latitude, longitude);

      if (weatherData) {
        setWeather(weatherData);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard style={styles.container} interactive>
        <ActivityIndicator color={Colors.text} size="large" />
      </GlassCard>
    );
  }

  if (error || !weather) {
    return (
      <GlassCard style={styles.container} interactive>
        <Text style={styles.errorText}>Unable to load weather</Text>
        <Text style={styles.errorSubtext}>Check location permissions</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.container} interactive>
      {/* Weather Icon */}
      <Ionicons name={getWeatherIcon(weather.condition)} size={64} color={Colors.text} style={[styles.icon, { opacity: 0.9 }]} />

      {/* Large Temperature */}
      <Text style={styles.temp}>{weather.temp}°</Text>

      {/* High/Low Temperatures */}
      <Text style={styles.highLow}>
        H:{weather.temp_max}° | L:{weather.temp_min}°
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  icon: {
    marginBottom: 16,
  },
  temp: {
    fontSize: 96,
    fontWeight: '200',
    color: Colors.text,
    lineHeight: 96,
    letterSpacing: -4,
    textAlign: 'center',
  },
  highLow: {
    fontSize: 16,
    fontWeight: '300',
    color: Colors.text,
    marginTop: 12,
    letterSpacing: 1,
    opacity: 0.9,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
});
