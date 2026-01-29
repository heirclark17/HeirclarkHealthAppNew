// Nutrition Accuracy Agent Types
// Ensures food database accuracy with multi-source verification

export interface NutritionVerificationResult {
  isVerified: boolean;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0-100
  originalData: NutritionData;
  verifiedData: NutritionData;
  adjustments: NutritionAdjustment[];
  flags: NutritionFlag[];
  sources: VerificationSource[];
  verificationDate: string;
}

export interface NutritionData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize?: string;
  servingGrams?: number;
}

export interface NutritionAdjustment {
  field: keyof NutritionData;
  originalValue: number;
  adjustedValue: number;
  percentChange: number;
  reason: string;
}

export interface NutritionFlag {
  type: 'warning' | 'error' | 'info';
  code: NutritionFlagCode;
  message: string;
  severity: 'low' | 'medium' | 'high';
  field?: keyof NutritionData;
}

export type NutritionFlagCode =
  | 'CALORIE_MACRO_MISMATCH'
  | 'UNUSUALLY_HIGH_CALORIES'
  | 'UNUSUALLY_LOW_CALORIES'
  | 'PROTEIN_TOO_HIGH'
  | 'FAT_TOO_HIGH'
  | 'CARBS_TOO_HIGH'
  | 'NEGATIVE_VALUES'
  | 'ZERO_MACROS'
  | 'MISSING_DATA'
  | 'UNVERIFIED_SOURCE'
  | 'SERVING_SIZE_UNCLEAR'
  | 'DATA_CONFLICT';

export interface VerificationSource {
  name: string;
  type: 'usda' | 'open_food_facts' | 'ai_estimate' | 'user_input' | 'barcode';
  confidence: number; // 0-100
  data?: Partial<NutritionData>;
  matchScore?: number; // How well the source data matches
  url?: string;
}

export interface USDAFoodItem {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  nutrients: USDANutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  unitName: string;
  value: number;
}

export interface FoodSearchResult {
  query: string;
  totalHits: number;
  foods: USDAFoodItem[];
}

// Nutrition validation rules
export const NUTRITION_RULES = {
  // Calorie calculation: Protein=4cal/g, Carbs=4cal/g, Fat=9cal/g
  CALORIES_PER_GRAM: {
    protein: 4,
    carbs: 4,
    fat: 9,
  },

  // Acceptable calorie deviation (15%)
  CALORIE_TOLERANCE_PERCENT: 15,

  // Maximum reasonable values per serving
  MAX_CALORIES_PER_SERVING: 2500,
  MAX_PROTEIN_PER_SERVING: 150, // grams
  MAX_CARBS_PER_SERVING: 300, // grams
  MAX_FAT_PER_SERVING: 150, // grams

  // Minimum reasonable values (non-water items)
  MIN_CALORIES_PER_SERVING: 5,

  // Serving size bounds
  MIN_SERVING_GRAMS: 5,
  MAX_SERVING_GRAMS: 1000,

  // Source confidence weights
  SOURCE_WEIGHTS: {
    usda: 95,
    open_food_facts: 75,
    barcode: 70,
    ai_estimate: 50,
    user_input: 30,
  },
};

// USDA FoodData Central API configuration
export const USDA_CONFIG = {
  BASE_URL: 'https://api.nal.usda.gov/fdc/v1',
  // Demo API key - users should replace with their own
  API_KEY: 'DEMO_KEY',
  ENDPOINTS: {
    search: '/foods/search',
    food: '/food',
  },
  NUTRIENT_IDS: {
    energy: 1008, // Calories
    protein: 1003,
    fat: 1004,
    carbs: 1005,
    fiber: 1079,
    sugar: 2000,
    sodium: 1093,
  },
};
