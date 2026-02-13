import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl ||
                process.env.EXPO_PUBLIC_API_URL ||
                'https://heirclarkinstacartbackend-production.up.railway.app';

// In-memory cache to avoid repeated API calls for same meals
const photoCache = new Map<string, string>();

class FoodImageService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  /**
   * Get AI-generated food photo via backend (DALL-E)
   */
  async searchFoodPhoto(mealName: string, _size: 'card' | 'modal' = 'card'): Promise<string> {
    // Check cache first
    const cacheKey = mealName.toLowerCase().trim();
    if (photoCache.has(cacheKey)) {
      return photoCache.get(cacheKey)!;
    }

    try {
      console.log('[FoodImageService] Requesting image for:', mealName);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s for DALL-E generation

      const response = await fetch(
        `${this.baseUrl}/api/v1/food-photo?query=${encodeURIComponent(mealName)}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('[FoodImageService] API error:', response.status);
        return '';
      }

      const data = await response.json();

      if (data.url) {
        photoCache.set(cacheKey, data.url);
        console.log('[FoodImageService] Got DALL-E image for:', mealName);
        return data.url;
      }

      console.log('[FoodImageService] No image returned for:', mealName);
      return '';

    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.log('[FoodImageService] Request timed out for:', mealName);
      } else {
        console.error('[FoodImageService] Error:', error);
      }
      return '';
    }
  }

  clearCache(): void {
    photoCache.clear();
    console.log('[FoodImageService] Cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: photoCache.size,
      keys: Array.from(photoCache.keys()),
    };
  }
}

// Export as pexelsService for backward compatibility with MealCard import
export const pexelsService = new FoodImageService();
