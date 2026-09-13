import "dotenv/config";
import {
  Content,
  FunctionCallingConfigMode,
  FunctionDeclaration,
  GenerateContentResponse,
  GoogleGenAI,
  createPartFromFunctionResponse,
} from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = "gemini-2.5-flash";
const SYSTEM_INSTRUCTION =
  "You are a helpful assistant that gives information about time of the day.";

// The actual local function Gemini is allowed to call.
function getCurrentTime() {
  const now = new Date();
  return {
    time: now.toLocaleTimeString(),
    date: now.toLocaleDateString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

const availableFunctions: Record<string, () => Record<string, unknown>> = {
  getCurrentTime,
};

// Describes getCurrentTime to Gemini so it knows the tool exists and when to call it.
const getCurrentTimeDeclaration: FunctionDeclaration = {
  name: "getCurrentTime",
  description: "Returns the current date, time, and timezone on the server.",
  parametersJsonSchema: {
    type: "OBJECT",
    properties: {},
  },
};

async function callGeminiWithTools() {
  console.log("STEP 3: building the starting conversation (just your question)");
  const contents: Content[] = [
    {
      role: "user",
      parts: [{ text: "What is the time of day?" }],
    },
  ];
  console.log("contents after step 3:", JSON.stringify(contents, null, 2));

  console.log("\nSTEP 4: sending first request to Gemini, with the tool description attached");
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [getCurrentTimeDeclaration] }],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
        },
      },
    },
  });

  const functionCalls = response.functionCalls;
  console.log("STEP 5: checking response.functionCalls ->", functionCalls);

  if (!functionCalls || functionCalls.length === 0) {
    console.log("Gemini answered directly, no tool needed:", response.text);
    return;
  }

  console.log("\nSTEP 6: saving Gemini's 'please call a function' turn into the conversation");
  contents.push(response.candidates![0]!.content!);
  console.log("contents after step 6:", JSON.stringify(contents, null, 2));

  console.log("\nSTEP 7: actually running the local function(s) Gemini asked for");
  const functionResponseParts = functionCalls.map((call) => {
    const fn = call.name ? availableFunctions[call.name] : undefined;
    const result = fn ? fn() : { error: `Unknown function: ${call.name}` };
    console.log(`Calling ${call.name}() ->`, result);
    return createPartFromFunctionResponse(call.id ?? call.name!, call.name!, result);
  });

  console.log("\nSTEP 8: adding the real function result into the conversation");
  contents.push({
    role: "user",
    parts: functionResponseParts,
  });
  console.log("contents after step 8:", JSON.stringify(contents, null, 2));

  console.log("\nSTEP 9: sending second request to Gemini, now with the real result included");
  const finalResponse = await ai.models.generateContent({
    model: MODEL,
    contents: contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [getCurrentTimeDeclaration] }],
    },
  });

  console.log("\nSTEP 10: Gemini's final plain-English answer:");
  console.log(finalResponse.text);
}

callGeminiWithTools();
