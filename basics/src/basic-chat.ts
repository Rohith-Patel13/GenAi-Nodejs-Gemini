import "dotenv/config";
import { GenerateContentResponse, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MAX_TOKENS = 700;
const MODEL = "gemini-2.5-flash";
const SYSTEM_INSTRUCTION = "You are a helpful chatbot.";

// Create a chat session
let chat = ai.chats.create({
  model: MODEL,
  config: {
    systemInstruction: SYSTEM_INSTRUCTION,
  },
});

// Drops the oldest turns from history until we're back under MAX_TOKENS,
// then rebuilds the chat session with the trimmed history.
async function deleteOlderMessages() {
  const history = chat.getHistory();

  while (history.length > 0) {
    const { totalTokens } = await ai.models.countTokens({
      model: MODEL,
      contents: history,
    });
    console.log(`Current context length: ${totalTokens}`);

    if (!totalTokens || totalTokens <= MAX_TOKENS) {
      console.log("Context length is now within limits.");
      break;
    }

    console.log("Trimming older messages...");
    console.log(`history before shift:`, history);
    history.shift();
    console.log(`history after shift:`, history);
    console.log(`Removed oldest message. New context length: ${history.length}`);
  }

  chat = ai.chats.create({
    model: MODEL,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    history,
  });
}

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

    if (response.usageMetadata?.totalTokenCount && response.usageMetadata.totalTokenCount > MAX_TOKENS) {
      console.warn("⚠️  Token limit exceeded! Trimming older messages...");
      await deleteOlderMessages();
    }
  } catch (error) {
    console.error(error);
  }
});
