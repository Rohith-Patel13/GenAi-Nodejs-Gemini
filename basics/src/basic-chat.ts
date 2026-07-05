import "dotenv/config";
import { Chat, Content, GenerateContentResponse, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MAX_CONTEXT_TOKENS = 700;
const MODEL = "gemini-2.5-flash";
const SYSTEM_INSTRUCTION = "You are a helpful chatbot.";

// Create a chat session
let chat: Chat = ai.chats.create({
  model: MODEL,
  config: {
    systemInstruction: SYSTEM_INSTRUCTION,
  },
});

// Counts tokens for whatever is currently in history — this is the same
// number that will be sent as the prompt on the *next* turn, so it's the
// correct thing to compare against MAX_CONTEXT_TOKENS (unlike usageMetadata.totalTokenCount,
// which also includes thinking/candidate tokens from the last call that never get resent).
async function getContextLength(history: Content[]) {
  const { totalTokens } = await ai.models.countTokens({
    model: MODEL,
    contents: history,
  });
  return totalTokens ?? 0;
}

// Drops the oldest user+model turn pairs from history until we're back
// under MAX_CONTEXT_TOKENS, then rebuilds the chat session with the trimmed history.
async function deleteOlderMessages() {
  const history: Content[] = chat.getHistory();
  let contextLength = await getContextLength(history);

  while (contextLength > MAX_CONTEXT_TOKENS && history.length > 0) {
    // Remove the oldest turn pair (user + model) together, since history
    // alternates user/model and removing just one leaves an orphaned turn.
    history.splice(0, 2);
    contextLength = await getContextLength(history);
    console.log(`Removed oldest turn. New context length: ${contextLength}`);
  }

  // Rebuild the chat session with the trimmed history
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

    console.log(`Tokens used this turn (prompt+output+thinking): ${response.usageMetadata?.totalTokenCount}`);

    const contextLength = await getContextLength(chat.getHistory());
    console.log(`Current context length: ${contextLength}`);

    if (contextLength > MAX_CONTEXT_TOKENS) {
      console.warn("⚠️  Context length exceeded! Trimming older messages...");
      await deleteOlderMessages();
    }
  } catch (error) {
    console.error(error);
  }
});
