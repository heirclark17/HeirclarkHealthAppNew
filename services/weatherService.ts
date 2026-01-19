// Heirclark Weather Service
// Fetches weather data from OpenWeatherMap API

const WEATHER_API_KEY = process.env.OPENWEATHERMAP_API_KEY || '';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

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
  private apiKey: string;

  constructor() {
    this.apiKey = WEATHER_API_KEY;
  }

  // Get weather by coordinates
  async getWeatherByCoords(latitude: number, longitude: number): Promise<WeatherData | null> {
    try {
      if (!this.apiKey) {
        console.warn('Weather API key not configured');
        return null;
      }

      const url = `${WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=imperial`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error('Weather API error:', response.status);
        return null;
      }

      const data = await response.json();

      return {
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        temp_min: Math.round(data.main.temp_min),
        temp_max: Math.round(data.main.temp_max),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: this.getWeatherEmoji(data.weather[0].main),
        city: data.name,
        humidity: data.main.humidity,
        wind_speed: Math.round(data.wind.speed),
        rain_chance: data.rain ? Math.round((data.rain['1h'] || 0) * 10) : 0,
      };
    } catch (error) {
      console.error('Weather fetch error:', error);
      return null;
    }
  }

  // Get weather by city name
  async getWeatherByCity(city: string): Promise<WeatherData | null> {
    try {
      if (!this.apiKey) {
        console.warn('Weather API key not configured');
        return null;
      }

      const url = `${WEATHER_API_URL}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=imperial`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error('Weather API error:', response.status);
        return null;
      }

      const data = await response.json();

      return {
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        temp_min: Math.round(data.main.temp_min),
        temp_max: Math.round(data.main.temp_max),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: this.getWeatherEmoji(data.weather[0].main),
        city: data.name,
        humidity: data.main.humidity,
        wind_speed: Math.round(data.wind.speed),
        rain_chance: data.rain ? Math.round((data.rain['1h'] || 0) * 10) : 0,
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
