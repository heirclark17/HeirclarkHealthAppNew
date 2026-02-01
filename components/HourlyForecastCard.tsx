import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../constants/Theme';
import * as Location from 'expo-location';
import { GlassCard } from './GlassCard';

interface HourlyForecast {
  time: string;
  date: string;
  temp: number;
  iconName: keyof typeof Ionicons.glyphMap;
  condition: string;
  isWeekStart?: boolean;
  weekLabel?: string;
}

export function HourlyForecastCard() {
  const [forecasts, setForecasts] = useState<HourlyForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateMockForecasts();
  }, []);

  // Generate mock hourly forecasts for a week (7 days x 24 hours = 168 hours)
  const generateMockForecasts = () => {
    const now = new Date();
    const mockData: HourlyForecast[] = [];

    // Weather conditions for variety (using Ionicons outlined icons)
    const conditions = [
      { condition: 'Clear', iconName: 'sunny-outline' as const },
      { condition: 'Clouds', iconName: 'cloud-outline' as const },
      { condition: 'Rain', iconName: 'rainy-outline' as const },
      { condition: 'Partly Cloudy', iconName: 'partly-sunny-outline' as const },
    ];

    // Generate 168 hours (7 days)
    for (let i = 0; i < 168; i++) {
      const forecastTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = forecastTime.getHours();

      // Simulate temperature variation (warmer during day, cooler at night)
      const baseTemp = 60;
      const variation = Math.sin((hour - 6) * Math.PI / 12) * 15; // Peak at 6pm
      const randomVariation = Math.random() * 5 - 2.5;
      const temp = Math.round(baseTemp + variation + randomVariation);

      // Pick weather condition (more sun during day, clouds at night)
      const isDay = hour >= 6 && hour <= 18;
      const conditionIndex = isDay
        ? (Math.random() > 0.7 ? 1 : 0) // Mostly clear during day
        : (Math.random() > 0.6 ? 1 : 3); // Mostly cloudy at night

      const weather = conditions[conditionIndex];

      // Format time
      const timeStr = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

      // Format date
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = days[forecastTime.getDay()];
      const dayNum = forecastTime.getDate();
      const dateStr = `${dayName} ${dayNum}`;

      // Check if this is the start of a new week (Sunday midnight)
      const isWeekStart = hour === 0 && forecastTime.getDay() === 0 && i > 0;
      const weekNumber = Math.floor(i / 168) + 1;
      const weekLabel = isWeekStart ? `Week ${weekNumber}` : undefined;

      mockData.push({
        time: timeStr,
        date: dateStr,
        temp,
        iconName: weather.iconName,
        condition: weather.condition,
        isWeekStart,
        weekLabel,
      });
    }

    setForecasts(mockData);
    setLoading(false);
  };

  if (loading) {
    return (
      <GlassCard style={styles.container} interactive>
        <ActivityIndicator color={Colors.text} size="small" />
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.container} interactive>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {forecasts.map((forecast, index) => (
          <React.Fragment key={index}>
            {forecast.isWeekStart && (
              <View style={styles.weekSeparator}>
                <Text style={styles.weekLabel}>{forecast.weekLabel}</Text>
              </View>
            )}
            <View style={styles.hourlyCard}>
              <Text style={styles.time}>{forecast.time}</Text>
              <Ionicons name={forecast.iconName} size={28} color={Colors.text} style={[styles.icon, { opacity: 0.9 }]} />
              <Text style={styles.temp}>{forecast.temp}°</Text>
              <Text style={styles.date}>{forecast.date}</Text>
            </View>
          </React.Fragment>
        ))}
      </ScrollView>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  hourlyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  time: {
    fontSize: 11,
    fontWeight: '300',
    color: Colors.text,
    marginBottom: 12,
    opacity: 0.8,
  },
  icon: {
    marginBottom: 12,
  },
  temp: {
    fontSize: 18,
    fontWeight: '100',
    color: Colors.text,
    marginBottom: 10,
  },
  date: {
    fontSize: 10,
    fontWeight: '100',
    color: Colors.text,
    opacity: 0.7,
  },
  weekSeparator: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  weekLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text,
    opacity: 0.6,
    letterSpacing: 1,
  },
});
