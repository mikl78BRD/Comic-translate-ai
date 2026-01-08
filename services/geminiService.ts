
import { GoogleGenAI, Type } from "@google/genai";
import { TargetLanguage, TextBubble, BoundingBox, AiModelId, TranslationStyle, RestorationType } from "../types";

const bubbleSchema = {
  type: Type.OBJECT,
  properties: {
    bubbles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original_text: { type: Type.STRING, description: "The original text found." },
          translated_text: { type: Type.STRING, description: "The translated text." },
          type: { 
            type: Type.STRING, 
            enum: ["dialogue", "caption"],
            description: "Type of text region. 'dialogue' for rounded speech bubbles. 'caption' for rectangular narrative boxes, screens, or signs." 
          },
          box_2d: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description: "The bounding box [ymin, xmin, ymax, xmax].",
          },
          confidence: { 
            type: Type.NUMBER, 
            description: "Confidence score between 0.0 and 1.0 for the text detection." 
          },
          description: {
            type: Type.STRING,
            description: "Brief description of the text type (e.g., 'speech bubble', 'narration box', 'sign text')."
          }
        },
        required: ["original_text", "translated_text", "type", "box_2d"],
      },
    },
  },
  required: ["bubbles"],
};

export const analyzeAndTranslateComic = async (
  base64Image: string,
  targetLanguage: TargetLanguage,
  sourceLanguage: TargetLanguage,
  modelId: AiModelId,
  existingBubbles: TextBubble[] = [],
  mimeType: string = "image/jpeg",
  onlyDetect: boolean = false,
  translationStyle: TranslationStyle = 'default'
): Promise<TextBubble[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let prompt = "";
    
    const effectiveStyle = translationStyle === 'default' ? 'yandex' : translationStyle;
    
    let styleInstruction = "";
    if (effectiveStyle === 'google') {
        styleInstruction = "Translation Mode: GOOGLE TRANSLATE STYLE. Prioritize literal word-for-word translation and standard sentence structures. Ensure high accuracy and strictly preserve the literal meaning. Do not localize idioms; translate them literally. Avoid creative paraphrasing.";
    } else if (effectiveStyle === 'yandex' || effectiveStyle === 'default') {
        styleInstruction = "Translation Mode: CONTEXTUAL & NATURAL. Mimic fluent human translation. Priority: 1. Native phrasing and flow. 2. Idiomatic equivalence. 3. Contextual adaptation.";
    }

    if (existingBubbles.length > 0) {
      const regionsList = existingBubbles.map((b, i) => 
        `Region ${i + 1}: [${b.box.ymin}, ${b.box.xmin}, ${b.box.ymax}, ${b.box.xmax}]`
      ).join("\n");

      prompt = `
        Analyze this comic book page.
        Coordinates:
        ${regionsList}

        For EACH Region:
        1. Extract the original text found strictly inside that region (Source Language: ${sourceLanguage}).
        2. Translate the text into ${targetLanguage}.
        ${styleInstruction}
        3. Classify the type: 'dialogue' (rounded), 'caption' (square).
        4. Return the exact coordinates I provided in 'box_2d'.
      `;
    } else if (onlyDetect) {
      prompt = `
        Task: AUTO-DETECT TEXT REGIONS.
        Identify all speech bubbles, narrative captions, signs, and sound effects containing text.
        For each region:
        1. Provide precise bounding boxes [ymin, xmin, ymax, xmax] in 0-1000 scale.
        2. Extract the 'original_text' exactly as it appears.
        3. Set 'translated_text' to an empty string.
        4. Classify as 'dialogue' (bubbles) or 'caption' (rectangular boxes).
        Ensure boxes are tight around the bubble boundaries.
      `;
    } else {
      prompt = `
        Analyze this comic book page (Source Language: ${sourceLanguage}).
        Detect and translate ALL text regions into ${targetLanguage}.
        ${styleInstruction}
        Provide tight bounding boxes [ymin, xmin, ymax, xmax] (0-1000).
      `;
    }

    // Map IDs to available Gemini models. 
    // basic/text tasks: gemini-3-flash-preview, complex: gemini-3-pro-preview
    let realModel = 'gemini-3-flash-preview';
    let customSystemInstruction = "You are a professional comic book translator and computer vision expert specialized in text bubble detection.";

    switch (modelId) {
      case 'gemini-flash': 
        realModel = 'gemini-3-flash-preview'; 
        break;
      case 'gemini-pro': 
        realModel = 'gemini-3-pro-preview'; 
        break;
      case 'gpt-4o': 
        realModel = 'gemini-3-pro-preview'; 
        customSystemInstruction += " Emulate the reasoning style and precision of GPT-4o.";
        break;
      case 'claude-3-5-sonnet': 
        realModel = 'gemini-3-pro-preview'; 
        customSystemInstruction += " Emulate the creative flair and nuance of Claude 3.5 Sonnet.";
        break;
      default: 
        realModel = 'gemini-3-flash-preview';
    }

    const response = await ai.models.generateContent({
      model: realModel,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: bubbleSchema,
        systemInstruction: customSystemInstruction,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");

    const parsed = JSON.parse(jsonText);
    
    if (existingBubbles.length > 0) {
        return existingBubbles.map((bubble, index) => {
            const aiData = parsed.bubbles[index];
            return {
                ...bubble,
                originalText: aiData?.original_text || "",
                translatedText: aiData?.translated_text || "",
                type: aiData?.type || 'dialogue',
                shape: bubble.shape || (aiData?.type === 'caption' ? 'rectangle' : 'ellipse'),
                box: bubble.box 
            };
        });
    } else {
        return parsed.bubbles.map((b: any, index: number) => ({
            id: `bubble-${index}-${Date.now()}`,
            originalText: b.original_text || "",
            translatedText: b.translated_text || "",
            box: {
                ymin: b.box_2d[0],
                xmin: b.box_2d[1],
                ymax: b.box_2d[2],
                xmax: b.box_2d[3],
            },
            backgroundColor: '#ffffff',
            textColor: '#000000',
            type: b.type || 'dialogue',
            shape: b.type === 'caption' ? 'rectangle' : 'ellipse' 
        }));
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const upscaleComicPage = async (
  base64Image: string,
  mimeType: string,
  aspectRatio: string,
  modelId: 'gemini-flash' | 'gemini-pro',
  restorationType: RestorationType = 'balanced'
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const realModel = modelId === 'gemini-pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    let prompt = "Professional Comic Page Restoration: ";
    
    switch (restorationType) {
        case 'gpen':
            prompt += "Perform high-end Face Restoration (GPEN-style). Reconstruct blurry or distorted faces, eyes, and expressions to be crystal sharp. Fix character features while maintaining the original artistic style. High resolution line art.";
            break;
        case 'diffusion':
            prompt += "Stable Diffusion Redraw: Re-imagine the details of this comic page with modern digital painting quality. Enhance shadows, lighting, and textures. Maintain the exact character poses and panel structure, but increase the artistic fidelity significantly.";
            break;
        case 'hd_upscale':
            prompt += "Super-Resolution Upscale: Increase resolution 4x. Denoise and sharpen all edges. Remove JPEG artifacts and grain. Make every detail clear as if it were a fresh digital render.";
            break;
        case 'faces':
            prompt += "Focus on fixing faces and hands. Reconstruct anatomy to be natural and sharp.";
            break;
        case 'denoise':
            prompt += "Deep Denoise: Remove all paper texture and scan grain. Pure white gutters and clean lines.";
            break;
        case 'color':
            prompt += "Vivid Color Correction: Fix white balance, boost saturation, and enhance the dynamic range of colors.";
            break;
        case 'balanced':
        default:
            prompt += "Balanced HD restoration. Sharpen lines, remove noise, and enhance colors.";
            break;
    }

    const response = await ai.models.generateContent({
      model: realModel,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
           aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Upscale Error:", error);
    throw error;
  }
};
