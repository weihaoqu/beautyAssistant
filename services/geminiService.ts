import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, SpecificProduct, ConcernExplanation, ProductSuitability, Language, ModelType } from "../types";
import { getTranslation } from "../utils/translations";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    skin_analysis: {
      type: Type.OBJECT,
      properties: {
        skin_type: { type: Type.STRING, description: "e.g., Oily, Dry, Combination, Sensitive" },
        skin_tone: { type: Type.STRING, description: "Brief description of skin tone" },
        concerns: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of visible concerns like Acne, Wrinkles, Dark Circles, etc." 
        },
        summary: { type: Type.STRING, description: "A friendly 1-2 sentence overview of the skin health." }
      },
      required: ["skin_type", "concerns", "summary"],
    },
    face_map: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          zone: { type: Type.STRING, description: "The face area: Forehead, Nose, Cheeks, Chin, Eye Area" },
          condition: { type: Type.STRING, description: "Specific condition observed in this area (e.g., 'Fine lines', 'Dark circles', 'Enlarged pores')" },
          severity: { type: Type.STRING, enum: ["High", "Medium", "Low", "None"], description: "Severity of the concern in this zone." }
        },
        required: ["zone", "condition", "severity"]
      },
      description: "Detailed analysis of specific face zones including Eye Area."
    },
    hair_analysis: {
      type: Type.OBJECT,
      properties: {
        hair_type: { type: Type.STRING, description: "e.g., Straight, Wavy, Curly, Coily" },
        condition: { type: Type.STRING, description: "e.g., Dry, Oily, Damaged, Healthy" },
        concerns: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["hair_type", "condition"],
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "e.g., Cleanser, Moisturizer, Serum, Eye Cream" },
          product_type: { type: Type.STRING, description: "Generic product name, e.g., 'Retinol Eye Cream'" },
          suggestion: { type: Type.STRING, description: "Why this is recommended." },
          key_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          usage_frequency: { type: Type.STRING, description: "e.g., Daily AM/PM, Weekly" }
        },
        required: ["category", "product_type", "suggestion", "key_ingredients", "usage_frequency"],
      }
    },
    lifestyle_suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Category: Diet, Hydration, Sleep, Stress Management, or General" },
          title: { type: Type.STRING, description: "Short punchy title, e.g., 'Hydrate Deeply'" },
          details: { type: Type.STRING, description: "Actionable advice in 1-2 sentences." }
        },
        required: ["category", "title", "details"]
      },
      description: "List of 5 diverse lifestyle tips covering diet, hydration, sleep, and stress management."
    }
  },
  required: ["skin_analysis", "face_map", "hair_analysis", "recommendations", "lifestyle_suggestions"],
};

export const analyzeImage = async (base64Image: string, language: Language = 'en', model: ModelType = 'gemini-2.5-flash'): Promise<AnalysisResult> => {
  const t = getTranslation(language);
  
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    const langInstruction = language === 'zh' 
      ? "Provide the response strictly in Simplified Chinese (简体中文)." 
      : "Provide the response strictly in English.";

    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: `Analyze this photo for a beauty consultation. Assess the skin health (type, concerns) and hair condition. 
            
            CRITICAL: You must include a distinct analysis for the "Eye Area" in the face_map (checking for dark circles, puffiness, fine lines, or crow's feet).
            
            Break down the analysis by face zones (Forehead, Nose, Cheeks, Chin, Eye Area) identifying specific conditions and severity. Provide specific product recommendations (including eye care if needed) and diverse lifestyle suggestions. Be professional, kind, and helpful. ${langInstruction} Output strictly JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: `You are an expert dermatologist and hair stylist AI assistant. Provide helpful, safe, and generally accepted beauty advice based on visual analysis. ${langInstruction}`,
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    return result;

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('429') || msg.includes('quota')) throw new Error(t.errors.quota);
    if (msg.includes('safety') || msg.includes('blocked')) throw new Error(t.errors.safety);
    if (msg.includes('network')) throw new Error(t.errors.network);
    throw new Error(t.errors.generic);
  }
};

const specificProductSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tier: { type: Type.STRING, enum: ["Gold", "Silver", "Bronze"] },
          brand: { type: Type.STRING },
          product_name: { type: Type.STRING },
          price_estimate: { type: Type.STRING, description: "e.g., $45" },
          reason: { type: Type.STRING, description: "Why this specific product matches the user's needs." },
          product_link: { type: Type.STRING, description: "A valid Google Search URL for this specific product, e.g., 'https://www.google.com/search?q=Brand+Product+Name'" },
          key_ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 main active ingredients in this specific product." },
          usage_frequency: { type: Type.STRING, description: "e.g. 'Use daily in AM', 'Use 2x week'" },
          image_url: { type: Type.STRING, description: "A publicly accessible image URL for the product if widely known (e.g. from wikimedia or standard brand assets), otherwise return empty string." }
        },
        required: ["tier", "brand", "product_name", "price_estimate", "reason", "product_link", "key_ingredients", "usage_frequency"]
      }
    }
  }
};

export const getSpecificProductRecommendations = async (
  productType: string,
  userContext: string,
  budget: string,
  language: Language = 'en',
  model: ModelType = 'gemini-2.5-flash'
): Promise<SpecificProduct[]> => {
  try {
    const langInstruction = language === 'zh' 
      ? "Ensure all text fields are in Simplified Chinese (简体中文)." 
      : "Ensure all text fields are in English.";

    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: `
              Task: Recommend 3 specific commercial beauty products for the category: "${productType}".
              User Context (Skin/Hair Profile): ${userContext}
              Budget Constraint: ${budget}
              
              Brand Guidance & Budget Tiers:
              - Luxury/High-End ($100+): La Mer, La Prairie, Helena Rubinstein (HR), SK-II, Sisley, Augustinus Bader.
              - Premium ($50-$100): Lancôme, Estée Lauder, Shiseido, Aveda (Hair), Kérastase (Hair), Oribe.
              - Mid-Range ($30-$60): Kiehl's, Clinique, Origins, Clarins, Dr. Jart+, Briogeo.
              - Budget/Accessible ($10-$30): The Ordinary, CeraVe, La Roche-Posay, Neutrogena, Inkey List.
              
              Requirements:
              1. Provide 3 tiers: Gold (Premium), Silver (Value), Bronze (Budget).
              2. Strict Budget Handling.
              3. Include estimated price.
              4. Include a Google Search link for the product.
              5. Include key ingredients and usage frequency.
              6. If you know a valid public image URL, include it.
              7. Return purely JSON.
              8. ${langInstruction}
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: specificProductSchema,
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }
    const data = JSON.parse(response.text);
    return data.recommendations || [];
  } catch (error) {
    console.error("Gemini Product Rec Error:", error);
    throw new Error("Failed to fetch specific recommendations.");
  }
};

export const getBrandRecommendations = async (
  brand: string,
  userContext: string,
  language: Language = 'en',
  model: ModelType = 'gemini-2.5-flash'
): Promise<SpecificProduct[]> => {
  try {
    const langInstruction = language === 'zh' 
      ? "Ensure all text fields are in Simplified Chinese (简体中文)." 
      : "Ensure all text fields are in English.";

    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: `
              Task: Recommend the top 3 best-suited products specifically from the brand "${brand}" for a user with this profile: "${userContext}".
              Requirements: Return purely JSON matching the schema. ${langInstruction}
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: specificProductSchema,
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }
    const data = JSON.parse(response.text);
    return data.recommendations || [];
  } catch (error) {
    console.error("Gemini Brand Rec Error:", error);
    throw new Error("Failed to fetch brand recommendations.");
  }
};

const concernExplanationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    concern_name: { type: Type.STRING },
    what_is_it: { type: Type.STRING },
    why_it_occurs: { type: Type.STRING },
    management_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
    ingredients_to_look_for: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["concern_name", "what_is_it", "why_it_occurs", "management_tips", "ingredients_to_look_for"]
};

export const getConcernExplanation = async (
  concern: string,
  userContext: string,
  language: Language = 'en',
  model: ModelType = 'gemini-2.5-flash'
): Promise<ConcernExplanation> => {
  try {
    const langInstruction = language === 'zh' ? "Output strictly in Simplified Chinese (简体中文)." : "Output strictly in English.";
    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: `Create content for an infographic explaining: "${concern}" for profile: "${userContext}". Return JSON only. ${langInstruction}`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: concernExplanationSchema,
      }
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text) as ConcernExplanation;
  } catch (error) {
    console.error("Gemini Concern Explanation Error:", error);
    throw new Error("Failed to fetch concern details.");
  }
};

const productSuitabilitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    product_name: { type: Type.STRING },
    brand: { type: Type.STRING },
    suitability_score: { type: Type.INTEGER },
    verdict: { type: Type.STRING, enum: ["Excellent Match", "Good", "Fair", "Caution", "Not Recommended"] },
    reasoning: { type: Type.STRING },
    ingredients_analysis: { type: Type.STRING },
    quantity_to_buy: { type: Type.STRING },
    usage_instructions: { type: Type.STRING }
  },
  required: ["product_name", "brand", "suitability_score", "verdict", "reasoning", "ingredients_analysis", "quantity_to_buy", "usage_instructions"]
};

export const analyzeProductSuitability = async (
  productImageBase64: string,
  userProfile: string,
  language: Language = 'en',
  model: ModelType = 'gemini-2.5-flash'
): Promise<ProductSuitability> => {
  try {
    const cleanBase64 = productImageBase64.split(',')[1] || productImageBase64;
    const langInstruction = language === 'zh' ? "Output strictly in Simplified Chinese (简体中文)." : "Output strictly in English.";
    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          { text: `Identify this product and analyze suitability for profile: "${userProfile}". ${langInstruction} Output purely JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: productSuitabilitySchema,
      }
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text) as ProductSuitability;
  } catch (error) {
    console.error("Gemini Product Suitability Error:", error);
    throw new Error("Failed to analyze product.");
  }
};
