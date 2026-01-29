// Nutrition Accuracy Service
// Verifies nutrition data against multiple sources

import {
  NutritionVerificationResult,
  NutritionData,
  NutritionAdjustment,
  NutritionFlag,
  NutritionFlagCode,
  VerificationSource,
  USDAFoodItem,
  FoodSearchResult,
  NUTRITION_RULES,
  USDA_CONFIG,
} from '../types/nutritionAccuracy';

/**
 * Calculate expected calories from macros
 */
function calculateExpectedCalories(protein: number, carbs: number, fat: number): number {
  const { CALORIES_PER_GRAM } = NUTRITION_RULES;
  return Math.round(
    protein * CALORIES_PER_GRAM.protein +
    carbs * CALORIES_PER_GRAM.carbs +
    fat * CALORIES_PER_GRAM.fat
  );
}

/**
 * Check if calorie count matches macros within tolerance
 */
function isCalorieMacroMatch(calories: number, protein: number, carbs: number, fat: number): boolean {
  const expected = calculateExpectedCalories(protein, carbs, fat);
  const tolerance = expected * (NUTRITION_RULES.CALORIE_TOLERANCE_PERCENT / 100);
  return Math.abs(calories - expected) <= tolerance;
}

/**
 * Validate nutrition data and generate flags
 */
function validateNutritionData(data: NutritionData): NutritionFlag[] {
  const flags: NutritionFlag[] = [];
  const { MAX_CALORIES_PER_SERVING, MAX_PROTEIN_PER_SERVING, MAX_CARBS_PER_SERVING, MAX_FAT_PER_SERVING, MIN_CALORIES_PER_SERVING } = NUTRITION_RULES;

  // Check for negative values
  if (data.calories < 0 || data.protein < 0 || data.carbs < 0 || data.fat < 0) {
    flags.push({
      type: 'error',
      code: 'NEGATIVE_VALUES',
      message: 'Nutrition values cannot be negative',
      severity: 'high',
    });
  }

  // Check for zero macros with calories
  if (data.calories > 0 && data.protein === 0 && data.carbs === 0 && data.fat === 0) {
    flags.push({
      type: 'warning',
      code: 'ZERO_MACROS',
      message: 'Calorie source unclear - all macros are zero',
      severity: 'medium',
    });
  }

  // Check calorie-macro mismatch
  if (!isCalorieMacroMatch(data.calories, data.protein, data.carbs, data.fat)) {
    const expected = calculateExpectedCalories(data.protein, data.carbs, data.fat);
    flags.push({
      type: 'warning',
      code: 'CALORIE_MACRO_MISMATCH',
      message: `Calories (${data.calories}) don't match macros (expected ~${expected})`,
      severity: 'medium',
      field: 'calories',
    });
  }

  // Check unusually high calories
  if (data.calories > MAX_CALORIES_PER_SERVING) {
    flags.push({
      type: 'warning',
      code: 'UNUSUALLY_HIGH_CALORIES',
      message: `Calories (${data.calories}) exceed typical serving size`,
      severity: 'medium',
      field: 'calories',
    });
  }

  // Check unusually low calories (but not zero)
  if (data.calories > 0 && data.calories < MIN_CALORIES_PER_SERVING) {
    flags.push({
      type: 'info',
      code: 'UNUSUALLY_LOW_CALORIES',
      message: `Very low calorie count (${data.calories})`,
      severity: 'low',
      field: 'calories',
    });
  }

  // Check high protein
  if (data.protein > MAX_PROTEIN_PER_SERVING) {
    flags.push({
      type: 'warning',
      code: 'PROTEIN_TOO_HIGH',
      message: `Protein (${data.protein}g) exceeds typical serving`,
      severity: 'medium',
      field: 'protein',
    });
  }

  // Check high carbs
  if (data.carbs > MAX_CARBS_PER_SERVING) {
    flags.push({
      type: 'warning',
      code: 'CARBS_TOO_HIGH',
      message: `Carbs (${data.carbs}g) exceeds typical serving`,
      severity: 'medium',
      field: 'carbs',
    });
  }

  // Check high fat
  if (data.fat > MAX_FAT_PER_SERVING) {
    flags.push({
      type: 'warning',
      code: 'FAT_TOO_HIGH',
      message: `Fat (${data.fat}g) exceeds typical serving`,
      severity: 'medium',
      field: 'fat',
    });
  }

  return flags;
}

/**
 * Search USDA FoodData Central database
 */
async function searchUSDA(query: string): Promise<USDAFoodItem[]> {
  try {
    const url = `${USDA_CONFIG.BASE_URL}${USDA_CONFIG.ENDPOINTS.search}?api_key=${USDA_CONFIG.API_KEY}&query=${encodeURIComponent(query)}&pageSize=5`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn('[NutritionAccuracy] USDA API error:', response.status);
      return [];
    }

    const data: FoodSearchResult = await response.json();
    return data.foods || [];
  } catch (error) {
    console.error('[NutritionAccuracy] USDA search error:', error);
    return [];
  }
}

/**
 * Extract nutrition data from USDA food item
 */
function extractUSDANutrition(item: USDAFoodItem): Partial<NutritionData> {
  const { NUTRIENT_IDS } = USDA_CONFIG;

  const getNutrient = (id: number): number => {
    const nutrient = item.nutrients.find(n => n.nutrientId === id);
    return nutrient?.value || 0;
  };

  return {
    name: item.description,
    calories: Math.round(getNutrient(NUTRIENT_IDS.energy)),
    protein: Math.round(getNutrient(NUTRIENT_IDS.protein)),
    carbs: Math.round(getNutrient(NUTRIENT_IDS.carbs)),
    fat: Math.round(getNutrient(NUTRIENT_IDS.fat)),
    fiber: Math.round(getNutrient(NUTRIENT_IDS.fiber)),
    sugar: Math.round(getNutrient(NUTRIENT_IDS.sugar)),
    sodium: Math.round(getNutrient(NUTRIENT_IDS.sodium)),
    servingGrams: item.servingSize,
    servingSize: item.servingSizeUnit ? `${item.servingSize} ${item.servingSizeUnit}` : undefined,
  };
}

/**
 * Calculate match score between two nutrition datasets
 */
function calculateMatchScore(original: NutritionData, reference: Partial<NutritionData>): number {
  const fields: (keyof NutritionData)[] = ['calories', 'protein', 'carbs', 'fat'];
  let totalScore = 0;
  let fieldCount = 0;

  for (const field of fields) {
    const origValue = original[field];
    const refValue = reference[field];

    if (typeof origValue === 'number' && typeof refValue === 'number' && refValue > 0) {
      const diff = Math.abs(origValue - refValue) / refValue;
      const fieldScore = Math.max(0, 100 - diff * 100);
      totalScore += fieldScore;
      fieldCount++;
    }
  }

  return fieldCount > 0 ? Math.round(totalScore / fieldCount) : 0;
}

/**
 * Generate adjustments based on verification sources
 */
function generateAdjustments(
  original: NutritionData,
  sources: VerificationSource[]
): { adjustedData: NutritionData; adjustments: NutritionAdjustment[] } {
  const adjustments: NutritionAdjustment[] = [];
  const adjustedData = { ...original };

  // Find the highest confidence source with data
  const bestSource = sources
    .filter(s => s.data && s.confidence > 60)
    .sort((a, b) => b.confidence - a.confidence)[0];

  if (!bestSource?.data) {
    return { adjustedData, adjustments };
  }

  const fields: (keyof NutritionData)[] = ['calories', 'protein', 'carbs', 'fat'];

  for (const field of fields) {
    const origValue = original[field] as number;
    const refValue = bestSource.data[field] as number | undefined;

    if (typeof refValue === 'number' && refValue > 0) {
      const diff = origValue - refValue;
      const percentChange = (diff / refValue) * 100;

      // Only adjust if difference is significant (>20%)
      if (Math.abs(percentChange) > 20) {
        adjustments.push({
          field,
          originalValue: origValue,
          adjustedValue: refValue,
          percentChange: Math.round(percentChange),
          reason: `Adjusted to match ${bestSource.name} reference data`,
        });
        (adjustedData as any)[field] = refValue;
      }
    }
  }

  // Recalculate calories if macros were adjusted
  if (adjustments.some(a => ['protein', 'carbs', 'fat'].includes(a.field))) {
    const expectedCalories = calculateExpectedCalories(
      adjustedData.protein,
      adjustedData.carbs,
      adjustedData.fat
    );

    if (!isCalorieMacroMatch(adjustedData.calories, adjustedData.protein, adjustedData.carbs, adjustedData.fat)) {
      const origCalories = adjustedData.calories;
      adjustedData.calories = expectedCalories;
      adjustments.push({
        field: 'calories',
        originalValue: origCalories,
        adjustedValue: expectedCalories,
        percentChange: Math.round(((origCalories - expectedCalories) / expectedCalories) * 100),
        reason: 'Recalculated to match adjusted macros',
      });
    }
  }

  return { adjustedData, adjustments };
}

/**
 * Calculate overall confidence score
 */
function calculateConfidenceScore(sources: VerificationSource[], flags: NutritionFlag[]): number {
  // Base score from sources
  let sourceScore = 0;
  let totalWeight = 0;

  for (const source of sources) {
    const weight = NUTRITION_RULES.SOURCE_WEIGHTS[source.type] || 30;
    sourceScore += source.confidence * (source.matchScore || 50) / 100 * weight;
    totalWeight += weight;
  }

  const baseScore = totalWeight > 0 ? (sourceScore / totalWeight) : 30;

  // Deduct points for flags
  let deduction = 0;
  for (const flag of flags) {
    if (flag.type === 'error') deduction += 30;
    else if (flag.type === 'warning' && flag.severity === 'high') deduction += 20;
    else if (flag.type === 'warning' && flag.severity === 'medium') deduction += 10;
    else if (flag.type === 'warning') deduction += 5;
  }

  return Math.max(0, Math.min(100, Math.round(baseScore - deduction)));
}

/**
 * Get confidence level from score
 */
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Verify nutrition data against multiple sources
 */
export async function verifyNutritionData(
  data: NutritionData,
  sourceType: 'ai_estimate' | 'barcode' | 'user_input' = 'ai_estimate'
): Promise<NutritionVerificationResult> {
  const sources: VerificationSource[] = [];
  const flags = validateNutritionData(data);

  // Add original source
  sources.push({
    name: 'Original Input',
    type: sourceType,
    confidence: NUTRITION_RULES.SOURCE_WEIGHTS[sourceType],
    data,
  });

  // Try to verify with USDA
  try {
    const usdaResults = await searchUSDA(data.name);

    if (usdaResults.length > 0) {
      // Find best match
      let bestMatch: { item: USDAFoodItem; score: number } | null = null;

      for (const item of usdaResults) {
        const usdaNutrition = extractUSDANutrition(item);
        const score = calculateMatchScore(data, usdaNutrition);

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { item, score };
        }
      }

      if (bestMatch && bestMatch.score > 30) {
        const usdaNutrition = extractUSDANutrition(bestMatch.item);
        sources.push({
          name: 'USDA FoodData Central',
          type: 'usda',
          confidence: NUTRITION_RULES.SOURCE_WEIGHTS.usda,
          data: usdaNutrition,
          matchScore: bestMatch.score,
          url: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${bestMatch.item.fdcId}`,
        });
      }
    }
  } catch (error) {
    console.error('[NutritionAccuracy] USDA verification error:', error);
    flags.push({
      type: 'info',
      code: 'UNVERIFIED_SOURCE',
      message: 'Could not verify against USDA database',
      severity: 'low',
    });
  }

  // Generate adjustments based on sources
  const { adjustedData, adjustments } = generateAdjustments(data, sources);

  // Calculate confidence
  const confidenceScore = calculateConfidenceScore(sources, flags);
  const confidence = getConfidenceLevel(confidenceScore);

  // Add verification info flag if confidence is low
  if (confidence === 'low' && !flags.some(f => f.code === 'UNVERIFIED_SOURCE')) {
    flags.push({
      type: 'warning',
      code: 'UNVERIFIED_SOURCE',
      message: 'Low confidence - consider manual verification',
      severity: 'medium',
    });
  }

  return {
    isVerified: confidence !== 'low',
    confidence,
    confidenceScore,
    originalData: data,
    verifiedData: adjustments.length > 0 ? adjustedData : data,
    adjustments,
    flags,
    sources,
    verificationDate: new Date().toISOString(),
  };
}

/**
 * Quick validation check (no API calls)
 */
export function quickValidate(data: NutritionData): {
  isValid: boolean;
  flags: NutritionFlag[];
  suggestedCalories: number;
} {
  const flags = validateNutritionData(data);
  const suggestedCalories = calculateExpectedCalories(data.protein, data.carbs, data.fat);

  return {
    isValid: !flags.some(f => f.type === 'error' || (f.type === 'warning' && f.severity === 'high')),
    flags,
    suggestedCalories,
  };
}

/**
 * Search USDA for food suggestions
 */
export async function searchFoodDatabase(query: string): Promise<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
}[]> {
  const results = await searchUSDA(query);

  return results.slice(0, 10).map(item => {
    const nutrition = extractUSDANutrition(item);
    return {
      name: item.description,
      calories: nutrition.calories || 0,
      protein: nutrition.protein || 0,
      carbs: nutrition.carbs || 0,
      fat: nutrition.fat || 0,
      source: 'USDA',
    };
  });
}
