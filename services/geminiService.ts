

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SpecificProduct, ConcernExplanation, ProductSuitability, Language, ModelType, VersusReport } from "../types";
import { getTranslation } from "../utils/translations";

// Initialize ai client using the correct named parameter as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Existing analysisSchema...
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    skin_analysis: {
      type: Type.OBJECT,
      properties: {
        skin_type: { type: Type.STRING },
        skin_tone: { type: Type.STRING },
        concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
        summary: { type: Type.STRING }
      },
      required: ["skin_type", "concerns", "summary"],
    },
    face_map: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          zone: { type: Type.STRING },
          condition: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["High", "Medium", "Low", "None"] }
        },
        required: ["zone", "condition", "severity"]
      }
    },
    hair_analysis: {
      type: Type.OBJECT,
      properties: {
        hair_type: { type: Type.STRING },
        condition: { type: Type.STRING },
        concerns: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["hair_type", "condition"],
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          product_type: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          key_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          usage_frequency: { type: Type.STRING }
        },
        required: ["category", "product_type", "suggestion", "key_ingredients", "usage_frequency"],
      }
    },
    lifestyle_suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          title: { type: Type.STRING },
          details: { type: Type.STRING }
        },
        required: ["category", "title", "details"]
      }
    }
  },
  required: ["skin_analysis", "face_map", "hair_analysis", "recommendations", "lifestyle_suggestions"],
};

// Updated default model to gemini-3-flash-preview as per recommendations for basic tasks
export const analyzeImage = async (base64Image: string, language: Language = 'en', model: ModelType = 'gemini-3-flash-preview'): Promise<AnalysisResult> => {
  const t = getTranslation(language);
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    const langInstruction = language === 'zh' ? "Provide response in Simplified Chinese." : "Provide response in English.";

    // Using ai.models.generateContent with the model name and contents
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          { text: `Analyze skin and hair health. Include "Eye Area". Be professional. ${langInstruction} Output strictly JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });

    if (!response.text) throw new Error("No response from AI");
    return JSON.parse(response.text) as AnalysisResult;
  } catch (error: any) {
    console.error(error);
    throw new Error(t.errors.generic);
  }
};

const versusSchema = {
  type: Type.OBJECT,
  properties: {
    battle_summary: { type: Type.STRING },
    categories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category_name: { type: Type.STRING },
          winner: { type: Type.STRING, enum: ["Player 1", "Player 2", "Draw"] },
          reason: { type: Type.STRING },
          p1_status: { type: Type.STRING },
          p2_status: { type: Type.STRING }
        },
        required: ["category_name", "winner", "reason", "p1_status", "p2_status"]
      }
    },
    overall_glow_winner: { type: Type.STRING, enum: ["Player 1", "Player 2", "Draw"] },
    final_verdict: { type: Type.STRING }
  },
  required: ["battle_summary", "categories", "overall_glow_winner", "final_verdict"]
};

export const generateVersusReport = async (
  p1Result: AnalysisResult,
  p2Result: AnalysisResult,
  language: Language = 'en',
  model: ModelType = 'gemini-3-flash-preview'
): Promise<VersusReport> => {
  try {
    const langInstruction = language === 'zh' ? "Output strictly in Simplified Chinese." : "Output strictly in English.";
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: `
              Task: Compare the beauty analysis of two users for a "Glow Battle".
              Player 1 Data: ${JSON.stringify(p1Result)}
              Player 2 Data: ${JSON.stringify(p2Result)}
              
              Requirements:
              1. Summarize the comparison in battle_summary.
              2. Compare across 5 categories (e.g. Skin Clarity, Eye Area Health, Hair Vitality, Hydration Levels, Overall Texture).
              3. For each category, pick a winner and explain why.
              4. Give a final "Glow Winner".
              5. Keep it fun, competitive, yet health-focused.
              ${langInstruction}
              Output strictly JSON.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: versusSchema
      }
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text) as VersusReport;
  } catch (error) {
    console.error("Versus Error:", error);
    throw new Error("Failed to generate versus report.");
  }
};

/**
 * Common schema for specific product recommendations
 */
const specificProductSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      tier: { type: Type.STRING, enum: ["Gold", "Silver", "Bronze"] },
      brand: { type: Type.STRING },
      product_name: { type: Type.STRING },
      price_estimate: { type: Type.STRING },
      reason: { type: Type.STRING },
      product_link: { type: Type.STRING },
      key_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
      usage_frequency: { type: Type.STRING },
      image_url: { type: Type.STRING }
    },
    required: ["tier", "brand", "product_name", "price_estimate", "reason", "product_link", "key_ingredients", "usage_frequency"]
  }
};

export const getSpecificProductRecommendations = async (
  productType: string,
  context: string,
  budget: string,
  language: Language = 'en',
  model: ModelType = 'gemini-3-flash-preview'
): Promise<SpecificProduct[]> => {
  try {
    const langInstruction = language === 'zh' ? "Output strictly in Simplified Chinese." : "Output strictly in English.";
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{
          text: `Find specific beauty product recommendations for: ${productType}. 
          User Context: ${context}. 
          Budget target: ${budget}. 
          Provide 3 products (Gold, Silver, Bronze tiers). Gold is high-end/best, Bronze is budget-friendly. 
          ${langInstruction} Output strictly JSON.`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: specificProductSchema
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Product Search Error:", error);
    return [];
  }
};

export const getBrandRecommendations = async (
  brand: string,
  context: string,
  language: Language = 'en',
  model: ModelType = 'gemini-3-flash-preview'
): Promise<SpecificProduct[]> => {
  try {
    const langInstruction = language === 'zh' ? "Output strictly in Simplified Chinese." : "Output strictly in English.";
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{
          text: `Recommend exactly 3 specific products from the brand "${brand}" that best suit this profile: ${context}.
          Assign them Gold, Silver, Bronze tiers based on effectiveness and popularity.
          ${langInstruction} Output strictly JSON.`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: specificProductSchema
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Brand Search Error:", error);
    return [];
  }
};

const concernExplanationSchema = {
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
  context: string,
  language: Language = 'en',
  model: ModelType = 'gemini-3-flash-preview'
): Promise<ConcernExplanation | null> => {
  try {
    const langInstruction = language === 'zh' ? "Output strictly in Simplified Chinese." : "Output strictly in English.";
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{
          text: `Explain this skin/hair concern: ${concern}. 
          User Context: ${context}. 
          Provide detailed explanation, root causes, tips, and ingredients.
          ${langInstruction} Output strictly JSON.`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: concernExplanationSchema
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Concern Explanation Error:", error);
    return null;
  }
};

const productSuitabilitySchema = {
  type: Type.OBJECT,
  properties: {
    product_name: { type: Type.STRING },
    brand: { type: Type.STRING },
    suitability_score: { type: Type.NUMBER },
    verdict: { type: Type.STRING, enum: ["Excellent Match", "Good", "Fair", "Not Recommended", "Caution"] },
    reasoning: { type: Type.STRING },
    ingredients_analysis: { type: Type.STRING },
    quantity_to_buy: { type: Type.STRING },
    usage_instructions: { type: Type.STRING }
  },
  required: ["product_name", "brand", "suitability_score", "verdict", "reasoning", "ingredients_analysis", "quantity_to_buy", "usage_instructions"]
};

export const analyzeProductSuitability = async (
  productBase64: string,
  userProfile: string,
  language: Language = 'en',
  model: ModelType = 'gemini-3-flash-preview'
): Promise<ProductSuitability> => {
  try {
    const cleanBase64 = productBase64.split(',')[1] || productBase64;
    const langInstruction = language === 'zh' ? "Output strictly in Simplified Chinese." : "Output strictly in English.";
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          { text: `Identify this beauty product and determine its suitability for a user with this profile: ${userProfile}. 
          Analyze the ingredients on the label. Provide score (0-100), verdict, reasoning, and usage tips. 
          ${langInstruction} Output strictly JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: productSuitabilitySchema
      }
    });
    if (!response.text) throw new Error("Suitability analysis failed");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Suitability Error:", error);
    throw error;
  }
};