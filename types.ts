
export type Language = 'en' | 'zh';

export interface SkinAnalysis {
  skin_type: string;
  skin_tone: string;
  concerns: string[];
  summary: string;
}

export interface HairAnalysis {
  hair_type: string;
  condition: string;
  concerns: string[];
}

export interface ProductRecommendation {
  category: string;
  product_type: string;
  suggestion: string;
  key_ingredients: string[];
  usage_frequency: string;
}

export interface LifestyleSuggestion {
  category: string;
  title: string;
  details: string;
}

export interface FaceZone {
  zone: string;
  condition: string;
  severity: 'High' | 'Medium' | 'Low' | 'None';
}

export interface AnalysisResult {
  skin_analysis: SkinAnalysis;
  hair_analysis: HairAnalysis;
  face_map: FaceZone[];
  recommendations: ProductRecommendation[];
  lifestyle_suggestions: LifestyleSuggestion[];
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: AnalysisResult | null;
}

export type ProductTier = 'Gold' | 'Silver' | 'Bronze';

export interface SpecificProduct {
  tier: ProductTier;
  brand: string;
  product_name: string;
  price_estimate: string;
  reason: string;
  product_link: string;
  key_ingredients: string[];
  usage_frequency: string;
  image_url?: string;
}

export interface ConcernExplanation {
  concern_name: string;
  what_is_it: string;
  why_it_occurs: string;
  management_tips: string[];
  ingredients_to_look_for: string[];
}

export interface ProductSuitability {
  product_name: string;
  brand: string;
  suitability_score: number;
  verdict: 'Excellent Match' | 'Good' | 'Fair' | 'Not Recommended' | 'Caution';
  reasoning: string;
  ingredients_analysis: string;
  quantity_to_buy: string;
  usage_instructions: string;
}

export interface StoredScan {
  id: string;
  timestamp: number;
  image: string; // base64
  result: AnalysisResult;
}