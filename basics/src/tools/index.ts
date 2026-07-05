import "dotenv/config";
import { Content, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = "gemini-2.5-flash";
const SYSTEM_INSTRUCTION =
  "You are a helpful assistant that gives information about time of the day.";

async function callGeminiWithTools() {
  const context: Content[] = [
    {
      role: "user",
      parts: [{ text: "What is the time of day?" }],
    },
  ];

  // configure chat tools (first Gemini call)
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: context,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  console.log(response.text);
}

callGeminiWithTools();
