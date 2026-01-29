// Heirclark Weather Service - Backend Proxy Integration
// Proxies weather requests through backend to keep API keys secure

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://heirclarkinstacartbackend-production.up.railway.app';

export interface WeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  condition: string;
  description: string;
  icon: string;
  city: string;
  humidity: number;
  wind_speed: number;
  rain_chance?: number;
}

class WeatherService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Get weather by coordinates via backend proxy
  async getWeatherByCoords(latitude: number, longitude: number): Promise<WeatherData | null> {
    try {
      const url = `${this.baseUrl}/api/v1/weather/current?lat=${latitude}&lon=${longitude}&units=imperial`;
      console.log('Fetching weather from:', url);

      const response = await fetch(url);

      if (!response.ok) {
        console.error('Backend weather API error:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('Weather response:', JSON.stringify(data).substring(0, 200));

      // Validate response has required fields (backend uses custom format, not OpenWeatherMap)
      if (!data || !data.success || !data.weather) {
        console.error('Invalid weather data format:', data);
        return null;
      }

      // Backend returns custom format with {success, weather: {...}, location: {...}}
      const weather = data.weather;
      const location = data.location;

      return {
        temp: Math.round(weather.temp),
        feels_like: Math.round(weather.feelsLike),
        temp_min: Math.round(weather.tempMin),
        temp_max: Math.round(weather.tempMax),
        condition: weather.condition,
        description: weather.description,
        icon: this.getWeatherEmoji(weather.condition),
        city: location.name,
        humidity: weather.humidity,
        wind_speed: Math.round(weather.wind.speed),
        rain_chance: weather.rain ? Math.round((weather.rain['1h'] || 0) * 10) : 0,
      };
    } catch (error) {
      console.error('Weather fetch error:', error);
      return null;
    }
  }

  // Get weather by city name via backend proxy
  async getWeatherByCity(city: string): Promise<WeatherData | null> {
    try {
      const url = `${this.baseUrl}/api/v1/weather/current?city=${encodeURIComponent(city)}&units=imperial`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error('Backend weather API error:', response.status);
        return null;
      }

      const data = await response.json();

      // Validate response has required fields (backend uses custom format)
      if (!data || !data.success || !data.weather) {
        console.error('Invalid weather data format:', data);
        return null;
      }

      // Backend returns custom format with {success, weather: {...}, location: {...}}
      const weather = data.weather;
      const location = data.location;

      return {
        temp: Math.round(weather.temp),
        feels_like: Math.round(weather.feelsLike),
        temp_min: Math.round(weather.tempMin),
        temp_max: Math.round(weather.tempMax),
        condition: weather.condition,
        description: weather.description,
        icon: this.getWeatherEmoji(weather.condition),
        city: location.name,
        humidity: weather.humidity,
        wind_speed: Math.round(weather.wind.speed),
        rain_chance: weather.rain ? Math.round((weather.rain['1h'] || 0) * 10) : 0,
      };
    } catch (error) {
      console.error('Weather fetch error:', error);
      return null;
    }
  }

  // Convert weather condition to emoji
  private getWeatherEmoji(condition: string): string {
    const icons: Record<string, string> = {
      Clear: '☀️',
      Clouds: '☁️',
      Rain: '🌧️',
      Drizzle: '🌦️',
      Thunderstorm: '⛈️',
      Snow: '❄️',
      Mist: '🌫️',
      Fog: '🌫️',
      Haze: '🌫️',
      Smoke: '🌫️',
    };
    return icons[condition] || '🌤️';
  }

  // Get weather health tip based on temperature
  getHealthTip(temp: number): string {
    if (temp > 80) {
      return 'Stay hydrated! Drink extra water in hot weather.';
    } else if (temp < 50) {
      return 'Cold weather burns more calories. Dress warmly!';
    } else {
      return 'Perfect weather for outdoor activity!';
    }
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
export default weatherService;
