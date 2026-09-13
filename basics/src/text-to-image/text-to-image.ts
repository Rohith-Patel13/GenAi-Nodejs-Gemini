
/**
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */

import "dotenv/config";
import { GenerateContentResponse, GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const prompt = "Give a picture of naruto uzumaki in a ninja pose.";

  const response: GenerateContentResponse = await ai.models.generateContent({

    /**
     * @see https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-1-flash-image
     */
    model: "gemini-3.1-flash-image",

    contents: prompt,
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const generatedImage: string | undefined = response.data;
  if (generatedImage) {
    const buffer = Buffer.from(generatedImage, "base64");
    fs.writeFileSync("src/text-to-image/gemini-native-image.png", buffer);
    console.log("Image saved as gemini-native-image.png");
  } else {
    console.log("No image was returned:", response.text);
  }
}

main();