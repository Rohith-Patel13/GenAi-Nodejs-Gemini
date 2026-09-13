/**
 * WORKFLOW OVERVIEW — Gemini function calling with a stateful Chat session
 * ------------------------------------------------------------------------
 * 1. TOOLS: We describe our local functions to the model as JSON schemas
 *    (FunctionDeclaration). The model never runs our code directly — it just
 *    decides *when* a tool is needed and *what arguments* to call it with.
 * 2. CONTEXT / MEMORY: `ai.chats.create()` returns a `Chat` object that keeps
 *    an internal `history` array of every turn (user text, model text, model
 *    function calls, our function responses). Every `chat.sendMessage()` call
 *    appends to that same history and resends the whole conversation so far,
 *    which is why the model can "remember" things like a flight number from
 *    a previous turn.
 * 3. LOOP: user message -> model responds with either plain text OR a
 *    functionCalls request -> if it's a function call, we run the real JS
 *    function ourselves -> we send the result back into the SAME chat
 *    session as a functionResponse part -> model reads it and produces a
 *    final, grounded answer.
 */

import "dotenv/config";
import { Chat, createPartFromFunctionResponse, FunctionCall, FunctionDeclaration, GenerateContentResponse, GoogleGenAI, Part } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = "gemini-2.5-flash";

// The system instruction is sent with every request in the chat session.
// It steers the model's persona/behavior but is NOT part of the visible
// conversation history (unlike user/model turns).
const SYSTEM_INSTRUCTION =
  "You are a helpful assistant. You can answer general questions, and you also have tools to find and reserve flights when the user asks about that.";

// --- Actual tool implementations (the "real work") -------------------------
// These are plain JS/TS functions. The model has no idea these exist until we
// describe them below as FunctionDeclarations and hand them the result
// afterwards. `args` is whatever object the model decided to pass in,
// validated against the parametersJsonSchema we declare per tool.

function getFindFlight(args: Record<string, unknown>) {
  // This function would contain the logic to find flights based on user input.
  // For demonstration purposes, we'll return a mock response.
  return {
    flights: [
      { flightNumber: "AB123", departure: "2024-06-01T10:00:00Z", arrival: "2024-06-01T14:00:00Z" }
    ]
  };
}

function getReserveFlightNumber(args: Record<string, unknown>) {
  // This function would contain the logic to reserve a flight based on the provided flight number.
  // For demonstration purposes, we'll return a mock response.
  return {
    reservation: {
      flightNumber: args.flightNumber,
      status: "confirmed"
    }
  };
}

// Dispatch table: maps the tool NAME the model calls (must match the `name`
// field in the FunctionDeclaration below) to the local function that
// actually performs the work.
const availableFunctions: Record<string, (args: Record<string, unknown>) => Record<string, unknown>> = {
  findFlight: getFindFlight,
  reserveFlightNumber: getReserveFlightNumber,
};

// --- Tool declarations (the "menu" shown to the model) ----------------------
// These schemas are what the model actually "sees". It never sees our JS
// code — only name, description, and parametersJsonSchema. The model uses
// the description + schema to decide when to call the tool and how to fill
// in the arguments.

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
    properties: {
      // Declaring this property is what lets the model fill in a flightNumber
      // it already learned earlier in the conversation (e.g. from a prior
      // findFlight result) when the user later says "book this flight".
      flightNumber: {
        type: "STRING",
        description: "The flight number to reserve, e.g. AB123."
      }
    },
    required: ["flightNumber"]
  }
}

// Tools are grouped into one or more `functionDeclarations` buckets and
// passed into the chat config so the model has them available on every turn.
const TOOLS = [
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
];

// --- Chat session: this IS the context/memory ------------------------------
// `chat` holds the running conversation history internally. Because tools
// and systemInstruction are set here (at creation time) rather than per-call,
// EVERY sendMessage() call automatically reuses them — including the
// follow-up call where we hand back a function's result. (A per-call
// `config` would instead override this base config for just that one call.)
let chat: Chat = ai.chats.create({
  model: MODEL,
  config: {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: TOOLS,
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

    console.log(`\n[you] ${prompt}`);
    // getHistory() lets us see exactly what "memory" is about to be sent
    // to the model alongside this new message.
    console.log(`[context] sending ${chat.getHistory().length} prior turn(s) + new message`);

    // STEP 1: send the user's message. The model sees the full history plus
    // this new turn and decides: answer directly, or ask to call a tool.
    const response: GenerateContentResponse = await chat.sendMessage({
      message: prompt,
    });

    const functionCalls: FunctionCall[] | undefined = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      // No tool needed — the model had enough context/knowledge to answer
      // directly from conversation history and its own training.
      console.log("[model] answered directly, no tool needed:", response.text);
      return;
    }

    // STEP 2: the model paused generation and asked us to run one or more
    // tools, supplying the arguments itself based on the declared schema.
    console.log("[model] requested function call(s):", functionCalls);

    const functionResponseParts: Part[] = functionCalls.map((call) => {
      console.log(`[tool] executing "${call.name}" with args:`, call.args);

      const fn = call.name ? availableFunctions[call.name] : undefined;
      const result = fn ? fn(call.args ?? {}) : { error: `Unknown function: ${call.name}` };

      console.log(`[tool] "${call.name}" result:`, result);

      // Package the local result back into the shape Gemini expects
      // (a Part containing a functionResponse keyed by call id/name).
      return createPartFromFunctionResponse(call.id ?? call.name!, call.name!, result);
    });

    console.log("[context] sending tool result(s) back into the same chat session");

    // STEP 3: send the tool result(s) back as a new turn in the SAME chat
    // session. This appends to history (memory) so the model can ground its
    // final answer in real data instead of guessing.
    const finalResponse: GenerateContentResponse = await chat.sendMessage({
      message: functionResponseParts,
    });

    console.log("[model] final response:", finalResponse.text);
  } catch (error) {
    console.error(error);
  }
});
