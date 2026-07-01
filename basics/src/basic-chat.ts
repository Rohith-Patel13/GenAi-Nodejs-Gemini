import "dotenv/config";
import { GenerateContentResponse, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// Create a chat session
const chat = ai.chats.create({
  model: "gemini-2.5-flash",
  config: {
    systemInstruction: "You are a helpful chatbot.",
  },
});

console.log("🤖 Gemini Chat Started!");
console.log("Type your message and press Enter.\n");

process.stdin.setEncoding("utf8");

process.stdin.addListener("data", async (data) => {
  try {
    const prompt = data.toString().trim();

    if (!prompt) {
      return;
    }

    const response: GenerateContentResponse = await chat.sendMessage({
      message: prompt,
    });

    console.log(`🤖 ${response.text}\n`);
  } catch (error) {
    console.error(error);
  }
});
