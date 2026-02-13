import Constants from 'expo-constants';

const UNSPLASH_ACCESS_KEY = Constants.expoConfig?.extra?.unsplashAccessKey ||
                            process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  urls: {
    raw: string;
    full: string;
    regular: string;  // 1080px wide
    small: string;    // 400px wide
    thumb: string;    // 200px wide
  };
  user: {
    name: string;
  };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

// In-memory cache to avoid repeated API calls for same meals
const photoCache = new Map<string, string>();

class FoodImageService {
  private accessKey: string;
  private baseUrl = 'https://api.unsplash.com';

  constructor() {
    const rawKey = UNSPLASH_ACCESS_KEY || '';
    // Detect placeholder values
    this.accessKey = rawKey.includes('YOUR_') || rawKey.includes('_HERE') || rawKey.length < 10 ? '' : rawKey;
    if (!this.accessKey) {
      console.warn('[FoodImageService] Unsplash key not configured. Using TheMealDB fallback.');
    }
  }

  /**
   * Search for food photos based on meal name
   */
  async searchFoodPhoto(mealName: string, size: 'card' | 'modal' = 'card'): Promise<string> {
    // Check cache first
    const cacheKey = `${mealName}-${size}`;
    if (photoCache.has(cacheKey)) {
      return photoCache.get(cacheKey)!;
    }

    // If no API key, try TheMealDB fallback
    if (!this.accessKey) {
      return this.getTheMealDBFallback(mealName, size);
    }

    try {
      const searchTerm = this.extractFoodKeywords(mealName);
      console.log('[FoodImageService] Unsplash searching:', searchTerm);

      const response = await fetch(
        `${this.baseUrl}/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=5&orientation=landscape&content_filter=high`,
        {
          headers: {
            Authorization: `Client-ID ${this.accessKey}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[FoodImageService] Unsplash API error:', response.status);
        return this.getTheMealDBFallback(mealName, size);
      }

      const data: UnsplashSearchResponse = await response.json();

      if (data.results && data.results.length > 0) {
        // Deterministic selection based on meal name
        const hash = this.hashString(mealName);
        const idx = Math.abs(hash) % data.results.length;
        const photo = data.results[idx];

        // Use raw URL with size parameters for optimal loading
        // card: 600w, modal: 1080w (regular)
        const imageUrl = size === 'card'
          ? `${photo.urls.raw}&w=600&h=400&fit=crop&crop=center&q=80`
          : `${photo.urls.raw}&w=1080&h=720&fit=crop&crop=center&q=80`;

        // Cache the result
        photoCache.set(cacheKey, imageUrl);

        console.log('[FoodImageService] Found Unsplash photo by:', photo.user.name);
        return imageUrl;
      }

      console.log('[FoodImageService] No Unsplash results for:', searchTerm);
      return this.getTheMealDBFallback(mealName, size);

    } catch (error) {
      console.error('[FoodImageService] Unsplash error:', error);
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
      return matches.slice(0, 2).join(' ') + ' food';
    }

    // Use full meal name for search
    return `${mealName} food`;
  }

  /**
   * TheMealDB fallback (free, no API key needed)
   */
  private async getTheMealDBFallback(mealName: string, size: 'card' | 'modal' = 'card'): Promise<string> {
    try {
      const searchTerm = this.extractFoodKeywords(mealName).split(' ')[0];
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm)}`,
        { signal: AbortSignal.timeout(5000) }
      );

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
