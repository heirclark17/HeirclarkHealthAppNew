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
   * Search for food photos via backend (Unsplash key stored on Railway)
   */
  async searchFoodPhoto(mealName: string, size: 'card' | 'modal' = 'card'): Promise<string> {
    // Check cache first
    const cacheKey = `${mealName}-${size}`;
    if (photoCache.has(cacheKey)) {
      return photoCache.get(cacheKey)!;
    }

    try {
      const searchTerm = this.extractFoodKeywords(mealName);
      console.log('[FoodImageService] Searching:', searchTerm);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `${this.baseUrl}/api/v1/food-photo?query=${encodeURIComponent(searchTerm)}&size=${size}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('[FoodImageService] API error:', response.status);
        return this.getTheMealDBFallback(mealName, size);
      }

      const data = await response.json();

      if (data.photos && data.photos.length > 0) {
        // Deterministic selection based on meal name
        const hash = this.hashString(mealName);
        const idx = Math.abs(hash) % data.photos.length;
        const photo = data.photos[idx];

        // Use raw URL with size parameters for optimal loading
        const imageUrl = size === 'card'
          ? `${photo.raw}&w=600&h=400&fit=crop&crop=center&q=80`
          : `${photo.raw}&w=1080&h=720&fit=crop&crop=center&q=80`;

        photoCache.set(cacheKey, imageUrl);
        console.log('[FoodImageService] Found photo by:', photo.photographer);
        return imageUrl;
      }

      console.log('[FoodImageService] No results, trying TheMealDB');
      return this.getTheMealDBFallback(mealName, size);

    } catch (error) {
      console.error('[FoodImageService] Error:', error);
      return this.getTheMealDBFallback(mealName, size);
    }
  }

  /**
   * Extract food keywords from meal name for better search results
   */
  private extractFoodKeywords(mealName: string): string {
    const foodKeywords = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp',
      'pasta', 'rice', 'noodles', 'quinoa', 'oatmeal',
      'salad', 'soup', 'stew', 'burger', 'sandwich', 'wrap', 'taco', 'burrito',
      'pizza', 'stir fry', 'curry', 'grilled', 'roasted', 'baked',
      'eggs', 'omelet', 'pancakes', 'waffles', 'toast', 'bacon',
      'smoothie', 'bowl', 'vegetables', 'fruit',
      'avocado', 'turkey', 'steak', 'lamb', 'tofu', 'tempeh',
      'yogurt', 'granola', 'cereal', 'muffin', 'bread',
      'sweet potato', 'broccoli', 'spinach', 'kale',
      'cod', 'tilapia', 'lentil', 'chickpea', 'chili',
    ];

    const lowerName = mealName.toLowerCase();
    const matches = foodKeywords.filter(keyword => lowerName.includes(keyword));

    if (matches.length > 0) {
      return matches.slice(0, 2).join(' ');
    }

    // Use first 3 words of meal name
    return mealName.split(' ').slice(0, 3).join(' ');
  }

  /**
   * TheMealDB fallback (free, no API key needed)
   */
  private async getTheMealDBFallback(mealName: string, size: 'card' | 'modal' = 'card'): Promise<string> {
    try {
      const searchTerm = this.extractFoodKeywords(mealName).split(' ')[0];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm)}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.meals && data.meals.length > 0) {
          const hash = this.hashString(mealName);
          const idx = Math.abs(hash) % data.meals.length;
          const thumbUrl = data.meals[idx].strMealThumb;
          if (thumbUrl) {
            const sizedUrl = size === 'card' ? `${thumbUrl}/preview` : thumbUrl;
            const cacheKey = `${mealName}-${size}`;
            photoCache.set(cacheKey, sizedUrl);
            console.log('[FoodImageService] TheMealDB fallback:', data.meals[idx].strMeal);
            return sizedUrl;
          }
        }
      }
    } catch (error) {
      console.log('[FoodImageService] TheMealDB fallback failed');
    }

    return '';
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
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
