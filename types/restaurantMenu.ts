/**
 * Restaurant Menu Agent Types
 * Helps users make healthier choices when eating out
 */

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isHealthyChoice: boolean;
  healthScore: number; // 1-10
  modifications: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  healthyOptions: MenuItem[];
  tips: string[];
}

export interface RestaurantSearchResult {
  restaurant: string;
  menuItems: MenuItem[];
  generalTips: string[];
}

export interface SavedRestaurant {
  id: string;
  name: string;
  cuisine: string;
  lastVisited: string;
  favoriteItems: string[];
}

export interface RestaurantMenuState {
  recentSearches: string[];
  savedRestaurants: SavedRestaurant[];
  favoriteItems: MenuItem[];
  isLoading: boolean;
}

// Common restaurant tips
export const RESTAURANT_TIPS: Record<string, string[]> = {
  general: [
    'Ask for dressings and sauces on the side',
    'Choose grilled over fried options',
    'Start with a salad or soup',
    'Ask for smaller portions or half-size',
    'Skip the bread basket',
    'Choose water or unsweetened beverages',
  ],
  mexican: [
    'Choose corn tortillas over flour',
    'Skip the cheese and sour cream',
    'Get black beans instead of refried',
    'Opt for fajitas without the tortillas',
  ],
  italian: [
    'Choose red sauce over cream-based',
    'Get pasta primavera or grilled fish',
    'Ask for whole wheat pasta if available',
    'Skip the breadsticks',
  ],
  asian: [
    'Choose steamed over fried',
    'Ask for brown rice',
    'Get sauce on the side',
    'Choose miso soup as appetizer',
  ],
  american: [
    'Get a side salad instead of fries',
    'Choose grilled chicken sandwich',
    'Skip the mayo-based sauces',
    'Ask for the kids portion',
  ],
  fastfood: [
    'Choose grilled options',
    'Skip the combo meal',
    'Get water instead of soda',
    'Remove half the bun',
    'Skip the cheese and special sauce',
  ],
};

// Common healthy modifications
export const HEALTHY_MODIFICATIONS = [
  'Dressing on the side',
  'No cheese',
  'Grilled instead of fried',
  'Steamed vegetables instead of fries',
  'Light sauce',
  'No butter',
  'Whole grain if available',
  'Double vegetables',
];
