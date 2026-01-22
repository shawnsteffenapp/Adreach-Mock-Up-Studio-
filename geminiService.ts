
import { GoogleGenAI } from "@google/genai";
import { AppData } from "../types";

export const generateMockup = async (data: AppData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  // 1. Prepare parts for the prompt
  const parts: any[] = [];

  // Add the street photo as context for editing
  if (data.streetPhoto) {
    const base64Data = data.streetPhoto.split(',')[1];
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg'
      }
    });
  }

  // Add the client logo if available
  if (data.clientLogo) {
    const logoBase64 = data.clientLogo.split(',')[1];
    parts.push({
      inlineData: {
        data: logoBase64,
        mimeType: 'image/png'
      }
    });
  }

  // Construct a sophisticated prompt for Gemini to perform the mockup
  const boardDescriptions = data.boards.map((b, i) => `
    Board ${i + 1}:
    - Headline: "${b.headline}"
    - Visual Style: ${b.imagePrompt}
    - Branding: Use primary color ${data.primaryColor}.
    - Logo: ${b.includeLogo ? "Include the provided client logo prominently." : "Do not include logo."}
  `).join('\n');

  const mainPrompt = `
    You are an expert advertising designer. I have provided a street scene photo with existing street pole advertisement boards.
    Your task is to realistically replace the artwork on those specific boards with new client designs for "${data.clientName}".
    
    Client Branding Context (derived from URL: ${data.brandUrl}): Use a professional, cohesive visual identity.
    
    Designs for the 3 boards:
    ${boardDescriptions}
    
    CRITICAL INSTRUCTIONS:
    1. Maintain perfect perspective and distortion to match the boards in the original photo.
    2. Apply realistic environmental lighting, reflections, and subtle weathering so the mockups look like they were actually installed and photographed.
    3. The text should be sharp but naturally blended into the scene's lighting.
    4. Ensure the output is a single high-resolution image of the entire street scene with the new advertisements.
  `;

  parts.push({ text: mainPrompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini Mockup Generation Error:", error);
    throw error;
  }
};
