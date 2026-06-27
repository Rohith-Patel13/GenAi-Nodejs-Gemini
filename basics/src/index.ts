import "dotenv/config";
import { GenerateContentResponse, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

async function main(): Promise<void> {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain Node.js in one paragraph",
  });

  console.log("text response:", response.text);
  console.log(response);
}

main().catch(console.error);
