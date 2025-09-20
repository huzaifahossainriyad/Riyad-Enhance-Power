import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

// This check is for a browser environment where process.env is not available.
// The API_KEY should be set in the environment where the app is built/served.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real application, you might use a placeholder or show an error.
  // For this example, we proceed but API calls will fail without a key.
  console.warn("API_KEY is not set. API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const ENHANCEMENT_PROMPT = `**CRITICAL RULE: DO NOT CHANGE THE PERSON'S IDENTITY.** The face, its structure, and all unique features (eyes, nose, mouth, facial shape) in the output photo must be an exact match to the original. Any alteration of the person's identity is a failure.

Your task is to perform a professional-level photo enhancement based on this critical rule. Apply the following improvements:

1.  **Upscale to Maximum Quality:** Significantly increase the image's resolution and sharpness. The goal is a crystal-clear, high-definition result with photorealistic detail. Eliminate any blurriness or digital noise.
2.  **Professional Skin Retouching:** Perform a detailed and natural skin enhancement. Remove all temporary imperfections like acne, pimples, spots, and redness. Even out the skin tone for a smooth, clean appearance. It is important to preserve the natural skin texture and not make it look artificial or plastic. Do not remove permanent features like moles or scars.
3.  **Advanced Lighting and Color Correction:** Automatically adjust the lighting and exposure for a professional look. Balance highlights and shadows to bring out detail. Correct any color cast and enhance the colors to be vibrant, rich, and true-to-life.

The final image must be a dramatically improved, high-quality version of the original photo, showcasing the same person with flawless clarity and professional polish.`;

// Helper function to convert data URL to parts for Gemini API
const dataUrlToGeminiPart = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL");
  }
  const mimeType = match[1];
  const base64Data = match[2];
  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
};

export const enhanceImageWithGemini = async (imageDataUrl: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Cannot enhance image: API_KEY is not configured.");
  }
  try {
    const imagePart = dataUrlToGeminiPart(imageDataUrl);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          imagePart,
          { text: ENHANCEMENT_PROMPT },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Find the image part in the response
    const imageParts = response.candidates?.[0]?.content?.parts?.filter(
      (part) => part.inlineData
    );

    if (!imageParts || imageParts.length === 0 || !imageParts[0].inlineData) {
      const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text)?.text;
      if (textPart) {
          throw new Error(`Model returned a text response instead of an image: ${textPart}`);
      }
      throw new Error("No enhanced image data found in the API response.");
    }
    
    const enhancedImagePart = imageParts[0].inlineData;
    const enhancedImageDataUrl = `data:${enhancedImagePart.mimeType};base64,${enhancedImagePart.data}`;
    
    return enhancedImageDataUrl;

  } catch (error) {
    console.error("Error enhancing image with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to enhance image: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image enhancement.");
  }
};