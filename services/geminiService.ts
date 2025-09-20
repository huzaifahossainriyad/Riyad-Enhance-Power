import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set. API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const ENHANCEMENT_PROMPT = `**CRITICAL RULE: DO NOT CHANGE THE PERSON'S IDENTITY.** The face, its structure, and all unique features (eyes, nose, mouth, facial shape) in the output photo must be an exact match to the original. Any alteration of the person's identity is a failure. Your task is to perform a professional-level photo enhancement based on this critical rule. Apply the following improvements: 1. **Upscale to Maximum Quality:** Significantly increase the image's resolution and sharpness. The goal is a crystal-clear, high-definition result with photorealistic detail. Eliminate any blurriness or digital noise. 2. **Professional Skin Retouching:** Perform a detailed and natural skin enhancement. Remove all temporary imperfections like acne, pimples, spots, and redness. Even out the skin tone for a smooth, clean appearance. It is important to preserve the natural skin texture. 3. **Advanced Lighting and Color Correction:** Automatically adjust the lighting and exposure for a professional look. Balance highlights and shadows to bring out detail. Correct any color cast and enhance the colors to be vibrant, rich, and true-to-life. The final image must be a dramatically improved, high-quality version of the original photo, showcasing the same person with flawless clarity.`;

const FRAME_PROMPT = `Analyze the composition of this image. Your task is to apply an intelligent, aesthetically pleasing crop that enhances the main subject. Find the best aspect ratio and framing to create a professional-looking photo. The output must be only the cropped image. Do not add any text or explanation.`;

const dataUrlToGeminiPart = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  return { inlineData: { mimeType: match[1], data: match[2] } };
};

const callGemini = async (imageDataUrl: string, prompt: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Cannot make API call: API_KEY is not configured.");
  }
  try {
    const imagePart = dataUrlToGeminiPart(imageDataUrl);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts: [imagePart, { text: prompt }] },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    const imageParts = response.candidates?.[0]?.content?.parts?.filter(
      (part) => part.inlineData
    );

    if (!imageParts || imageParts.length === 0 || !imageParts[0].inlineData) {
      const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text)?.text;
      if (textPart) {
          throw new Error(`Model returned a text response instead of an image: ${textPart}`);
      }
      throw new Error("No image data found in the API response.");
    }
    
    const newImagePart = imageParts[0].inlineData;
    return `data:${newImagePart.mimeType};base64,${newImagePart.data}`;

  } catch (error) {
    console.error("Error with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`AI request failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during the AI request.");
  }
};

export const enhanceImageWithGemini = (imageDataUrl: string): Promise<string> => {
  return callGemini(imageDataUrl, ENHANCEMENT_PROMPT);
};

export const frameImageWithGemini = (imageDataUrl: string): Promise<string> => {
    return callGemini(imageDataUrl, FRAME_PROMPT);
};
