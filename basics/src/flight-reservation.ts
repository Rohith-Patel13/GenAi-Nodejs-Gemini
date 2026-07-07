

import "dotenv/config";
import { Chat, FunctionDeclaration, GenerateContentResponse, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = "gemini-2.5-flash";
const SYSTEM_INSTRUCTION = "You are a helpful flight reservation assistant.";

const getFindFlightDeclaration: FunctionDeclaration = {
  name: "findFlight",
  description: "Finds available flights based on the provided criteria.",
  parametersJsonSchema: {
    type: "OBJECT",
    properties: {}
  }
};

const getReserveFlightNumberDeclaration: FunctionDeclaration = {
  name: "reserveFlightNumber",
  description: "Reserves a flight based on the provided flight number.",
  parametersJsonSchema: {
    type: "OBJECT",
    properties: {}
  }
}

// Create a chat session
let chat: Chat = ai.chats.create({
  model: MODEL,
  config: {
    systemInstruction: SYSTEM_INSTRUCTION,
  },
});

console.log("🤖 Gemini Flight Reservation Chat Started!");

process.stdin.setEncoding("utf8");

process.stdin.addListener("data", async (data) => {
  try {
    const prompt = data.toString().trim();

    if (!prompt) {
      return;
    }

    const response: GenerateContentResponse = await chat.sendMessage({
      message: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [
          {
            functionDeclarations: [
              getFindFlightDeclaration,
            ],
          },
          {
            functionDeclarations: [
              getReserveFlightNumberDeclaration,
            ]
          }
        ],
      },
    });
    console.log(`🤖 ${response.text}\n`);
  } catch (error) {
    console.error(error);
  }
});
