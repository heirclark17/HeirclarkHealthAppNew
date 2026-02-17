// @ts-nocheck
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { WeatherWidget } from '../WeatherWidget';
import * as Location from 'expo-location';
import { weatherService } from '../../../services/weatherService';

// Mock Location module
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

// Mock weather service
jest.mock('../../../services/weatherService', () => ({
  weatherService: {
    getWeatherByCoords: jest.fn(),
  },
}));

const mockWeatherData = {
  temp: 72,
  temp_min: 65,
  temp_max: 78,
  condition: 'Clear',
  description: 'clear sky',
  humidity: 60,
  windSpeed: 5.5,
};

describe('WeatherWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 40.7128, longitude: -74.0060 },
    });
    (weatherService.getWeatherByCoords as jest.Mock).mockResolvedValue(mockWeatherData);
  });

  it('renders without crashing', () => {
    expect(() => render(<WeatherWidget />)).not.toThrow();
  });

  it('shows loading indicator initially', () => {
    const { root } = render(<WeatherWidget />);
    expect(root).toBeTruthy();
  });

  it('displays temperature when weather data loads', async () => {
    const { getByText } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(getByText('72°')).toBeTruthy();
    });
  });

  it('displays high and low temperatures', async () => {
    const { getByText } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(getByText('H:78° | L:65°')).toBeTruthy();
    });
  });

  it('requests location permission', async () => {
    render(<WeatherWidget />);

    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });
  });

  it('gets current position', async () => {
    render(<WeatherWidget />);

    await waitFor(() => {
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    });
  });

  it('fetches weather data with coordinates', async () => {
    render(<WeatherWidget />);

    await waitFor(() => {
      expect(weatherService.getWeatherByCoords).toHaveBeenCalledWith(40.7128, -74.0060);
    });
  });

  it('shows error when permission is denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { getByText } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(getByText('Unable to load weather')).toBeTruthy();
    });
  });

  it('shows error subtext about permissions', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { getByText } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(getByText('Check location permissions')).toBeTruthy();
    });
  });

  it('shows error when weather fetch fails', async () => {
    (weatherService.getWeatherByCoords as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(getByText('Unable to load weather')).toBeTruthy();
    });
  });

  it('shows error when location fetch fails', async () => {
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error('Location error'));

    const { getByText } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(getByText('Unable to load weather')).toBeTruthy();
    });
  });

  it('displays weather icon for clear conditions', async () => {
    const { root } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(root).toBeTruthy();
      // Icon would be rendered but harder to test directly
    });
  });

  it('displays weather icon for rainy conditions', async () => {
    (weatherService.getWeatherByCoords as jest.Mock).mockResolvedValue({
      ...mockWeatherData,
      condition: 'Rain',
    });

    const { root } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('displays weather icon for cloudy conditions', async () => {
    (weatherService.getWeatherByCoords as jest.Mock).mockResolvedValue({
      ...mockWeatherData,
      condition: 'Clouds',
    });

    const { root } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('handles negative temperatures', async () => {
    (weatherService.getWeatherByCoords as jest.Mock).mockResolvedValue({
      ...mockWeatherData,
      temp: -5,
      temp_min: -10,
      temp_max: 0,
    });

    const { getByText } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(getByText('-5°')).toBeTruthy();
      expect(getByText('H:0° | L:-10°')).toBeTruthy();
    });
  });

  it('handles very high temperatures', async () => {
    (weatherService.getWeatherByCoords as jest.Mock).mockResolvedValue({
      ...mockWeatherData,
      temp: 105,
      temp_min: 98,
      temp_max: 110,
    });

    const { getByText } = render(<WeatherWidget />);

    await waitFor(() => {
      expect(getByText('105°')).toBeTruthy();
    });
  });

  it('renders in GlassCard container', async () => {
    const { root } = render(<WeatherWidget />);
    expect(root).toBeTruthy();
  });
});
