import "dotenv/config";
import { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { get_encoding, encoding_for_model } from "tiktoken";

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

function encodePrompt(prompt: string): void {
  const encoding = encoding_for_model("gpt-4o");
  const encoded = encoding.encode(prompt);
  console.log("Encoded prompt:", encoded); // Encoded prompt: Uint32Array(6) [ 176289, 10882, 5391, 306, 1001, 27853 ]
  console.log("Number of tokens:", encoded.length); // Number of tokens: 6
}

// encodePrompt("Explain Node.js in one paragraph");
main().catch((error) => {
  console.error("Error:", error);
});