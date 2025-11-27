import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, SpecificProduct, ConcernExplanation } from "../types";

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
          zone: { type: Type.STRING, description: "The face area: Forehead, Nose, Cheeks, Chin, Under Eyes" },
          condition: { type: Type.STRING, description: "Specific condition observed in this area (e.g., 'Fine lines', 'Enlarged pores', 'Clear', 'Redness')" },
          severity: { type: Type.STRING, enum: ["High", "Medium", "Low", "None"], description: "Severity of the concern in this zone." }
        },
        required: ["zone", "condition", "severity"]
      },
      description: "Detailed analysis of specific face zones."
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
          category: { type: Type.STRING, description: "e.g., Cleanser, Moisturizer, Serum, Hair Mask" },
          product_type: { type: Type.STRING, description: "Generic product name, e.g., 'Salicylic Acid Cleanser'" },
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

export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Analyze this photo for a beauty consultation. Assess the skin health (type, concerns) and hair condition. Break down the analysis by face zones (Forehead, Nose, Cheeks, Chin, Under Eyes) identifying specific conditions and severity. Provide specific product recommendations and diverse lifestyle suggestions. Be professional, kind, and helpful. Output strictly JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are an expert dermatologist and hair stylist AI assistant. Provide helpful, safe, and generally accepted beauty advice based on visual analysis.",
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze the image. Please try again with a clearer photo.");
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
  budget: string
): Promise<SpecificProduct[]> => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `
              Task: Recommend 3 specific commercial beauty products for the category: "${productType}".
              User Context (Skin/Hair Profile): ${userContext}
              Budget Constraint: ${budget}
              
              Requirements:
              1. Provide 3 tiers: 
                 - Gold (Best Overall/Premium, works best for the profile)
                 - Silver (Best Value/Mid-range)
                 - Bronze (Budget-friendly but effective)
              2. If the budget is tight, adjust all tiers to fit within or near the budget, but keep the Gold/Silver/Bronze quality distinction.
              3. Include estimated price.
              4. Include a Google Search link for the product.
              5. Include key ingredients and usage frequency.
              6. If you know a valid public image URL for the product, include it. Otherwise, leave image_url empty.
              7. Return purely JSON.
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

const concernExplanationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    concern_name: { type: Type.STRING },
    what_is_it: { type: Type.STRING, description: "Simple, clear medical/aesthetic explanation" },
    why_it_occurs: { type: Type.STRING, description: "Causes relevant to this specific user's skin profile" },
    management_tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 actionable daily tips" },
    ingredients_to_look_for: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3-5 best ingredients for this" }
  },
  required: ["concern_name", "what_is_it", "why_it_occurs", "management_tips", "ingredients_to_look_for"]
};

export const getConcernExplanation = async (
  concern: string,
  userContext: string
): Promise<ConcernExplanation> => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `
              You are a dermatologist. Explain the skin/hair concern: "${concern}" for a user with this profile: "${userContext}".
              Provide:
              1. What it is.
              2. Why it might be happening to them.
              3. Practical management tips.
              4. Key ingredients that help.
              Output JSON only.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: concernExplanationSchema,
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text) as ConcernExplanation;

  } catch (error) {
    console.error("Gemini Concern Explanation Error:", error);
    throw new Error("Failed to fetch concern details.");
  }
};
