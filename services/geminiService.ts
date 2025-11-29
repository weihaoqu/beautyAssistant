import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, SpecificProduct, ConcernExplanation, ProductSuitability, Language } from "../types";
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

export const analyzeImage = async (base64Image: string, language: Language = 'en'): Promise<AnalysisResult> => {
  const t = getTranslation(language);
  
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const langInstruction = language === 'zh' 
      ? "Provide the response strictly in Simplified Chinese (简体中文)." 
      : "Provide the response strictly in English.";

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

    // Handle specific error codes
    if (msg.includes('429') || msg.includes('quota') || msg.includes('resource exhausted')) {
      throw new Error(t.errors.quota);
    }
    
    if (msg.includes('safety') || msg.includes('blocked') || msg.includes('content') || msg.includes('harmful')) {
      throw new Error(t.errors.safety);
    }
    
    if (msg.includes('network') || msg.includes('fetch failed')) {
      throw new Error(t.errors.network);
    }

    // Default error
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
  language: Language = 'en'
): Promise<SpecificProduct[]> => {
  try {
    const langInstruction = language === 'zh' 
      ? "Ensure all text fields (reason, product_name, usage_frequency, etc) are in Simplified Chinese (简体中文)." 
      : "Ensure all text fields are in English.";

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
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
              1. Provide 3 tiers: 
                 - Gold (Best Overall/Premium, works best for the profile)
                 - Silver (Best Value/Mid-range)
                 - Bronze (Budget-friendly but effective)
              2. Strict Budget Handling:
                 - If budget is low (e.g. <$30), prioritize 'Budget/Accessible' brands for all tiers or mix with lower-end Mid-Range.
                 - If budget is high ($100+), feel free to suggest 'Luxury' or 'Premium' brands for Gold/Silver.
                 - If budget is mid-range ($50), stick to 'Premium' and 'Mid-Range' brands.
              3. Include estimated price.
              4. Include a Google Search link for the product.
              5. Include key ingredients and usage frequency.
              6. If you know a valid public image URL for the product, include it. Otherwise, leave image_url empty.
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
  language: Language = 'en'
): Promise<SpecificProduct[]> => {
  try {
    const langInstruction = language === 'zh' 
      ? "Ensure all text fields are in Simplified Chinese (简体中文)." 
      : "Ensure all text fields are in English.";

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `
              Task: Recommend the top 3 best-suited products specifically from the brand "${brand}" for a user with this profile: "${userContext}".
              
              Requirements:
              1. Focus strictly on products from "${brand}".
              2. Select products that best address the user's specific concerns (e.g. if they have acne, pick the acne line; if aging, pick the anti-aging line).
              3. Assign tiers based on priority for this user:
                 - Gold: The "Must Have" hero product for their primary concern.
                 - Silver: A highly recommended secondary product (e.g. maintenance).
                 - Bronze: A complementary product or hidden gem.
              4. Include estimated price.
              5. Include a Google Search link.
              6. Include key ingredients.
              7. Valid image URL if possible.
              8. ${langInstruction}
              9. Return purely JSON matching the schema.
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
    what_is_it: { type: Type.STRING, description: "A 1-sentence easy-to-understand definition." },
    why_it_occurs: { type: Type.STRING, description: "A 1-sentence explanation of the cause." },
    management_tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 short, actionable steps (max 5 words each)." },
    ingredients_to_look_for: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 key active ingredients." }
  },
  required: ["concern_name", "what_is_it", "why_it_occurs", "management_tips", "ingredients_to_look_for"]
};

export const getConcernExplanation = async (
  concern: string,
  userContext: string,
  language: Language = 'en'
): Promise<ConcernExplanation> => {
  try {
    const langInstruction = language === 'zh' 
      ? "Output strictly in Simplified Chinese (简体中文)." 
      : "Output strictly in English.";

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `
              You are a visual design oriented dermatologist.
              Task: Create content for an infographic explaining: "${concern}" for a user with profile: "${userContext}".
              
              Keep text concise, punchy, and easy to read quickly. Avoid long paragraphs.
              
              Provide:
              1. what_is_it: A 1-sentence easy-to-understand definition.
              2. why_it_occurs: A 1-sentence explanation of the cause.
              3. management_tips: 3-4 short, actionable steps (max 5-7 words each).
              4. ingredients_to_look_for: 3-4 key active ingredients.
              
              Output JSON only.
              ${langInstruction}
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

const productSuitabilitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    product_name: { type: Type.STRING },
    brand: { type: Type.STRING },
    suitability_score: { type: Type.INTEGER, description: "Score from 0 to 100 where 100 is a perfect match." },
    verdict: { type: Type.STRING, enum: ["Excellent Match", "Good", "Fair", "Caution", "Not Recommended"] },
    reasoning: { type: Type.STRING, description: "Why this fits or doesn't fit the user's skin profile." },
    ingredients_analysis: { type: Type.STRING, description: "Analysis of visible or known ingredients in the product." },
    quantity_to_buy: { type: Type.STRING, description: "Recommendation on how many to buy (e.g., '1 to test', 'Stock up', 'None')." },
    usage_instructions: { type: Type.STRING, description: "Brief instructions on how to use this product for this specific user." }
  },
  required: ["product_name", "brand", "suitability_score", "verdict", "reasoning", "ingredients_analysis", "quantity_to_buy", "usage_instructions"]
};

export const analyzeProductSuitability = async (
  productImageBase64: string,
  userProfile: string,
  language: Language = 'en'
): Promise<ProductSuitability> => {
  try {
    const cleanBase64 = productImageBase64.split(',')[1] || productImageBase64;
    const langInstruction = language === 'zh' 
      ? "Output strictly in Simplified Chinese (简体中文)." 
      : "Output strictly in English.";

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
            text: `
              Task: Identify this beauty product from the image (label/packaging).
              Analyze its suitability for a user with this profile: "${userProfile}".
              
              1. Identify the Brand and Product Name.
              2. Rate suitability (0-100) and give a verdict.
              3. Explain reasoning based on ingredients vs user profile.
              4. Highlight key ingredients.
              5. Recommend QUANTITY TO BUY: Should they buy 1 to test? Is it a daily essential to stock up? Or avoid?
              6. Provide brief USAGE instructions (AM/PM, order in routine).
              
              ${langInstruction}
              Output purely JSON.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: productSuitabilitySchema,
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text) as ProductSuitability;

  } catch (error) {
    console.error("Gemini Product Suitability Error:", error);
    throw new Error("Failed to analyze product.");
  }
};