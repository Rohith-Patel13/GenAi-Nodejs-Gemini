
import "dotenv/config";
import { createPartFromUri, GoogleGenAI } from "@google/genai";
import * as path from "path";

// 1. Initialize the client. It automatically picks up process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

async function translateAudioToEnglish(filePath: string, mimeType: string) {
  try {
    console.log(`Uploading ${filePath}...`);
    
    // 2. Upload the audio file using the Files API
    const uploadedFile = await ai.files.upload({
      file: filePath,
      config: { mimeType: mimeType }
    });

    console.log(`File uploaded successfully. URI: ${uploadedFile.uri}`);
    console.log("Processing audio translation...");

    // 3. Request translation from Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        "Listen to this audio. It's a Japanese word/phrase famous from the Naruto anime series. Transcribe it and translate the text into fluent English.",
        createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!),
      ]
    });

    // 4. Output the translated text
    console.log("\n--- English Translation Result ---");
    console.log(response.text);
    console.log("----------------------------------\n");

  } catch (error) {
    console.error("Error during translation:", error);
  }
}

// Example usage:
const audioPath = path.join(__dirname, "dattebayo.mp3");
// Supported mime types include: audio/mp3, audio/wav, audio/ogg, audio/aac, etc.
translateAudioToEnglish(audioPath, "audio/mp3");
