
import "dotenv/config";
import { createPartFromUri, GoogleGenAI } from "@google/genai";
import * as path from "node:path";

const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

async function main() {
    // upload audio file to the Gemini API
    const uploadedFile = await client.files.upload({
        file: path.join(__dirname, "Power_English_Update.mp3"),
        config: { mimeType: "audio/mp3" }
    });

    // generate a description of the audio file using the Gemini API
    const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            "Describe this audio clip",
            createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!),
        ]
    });
    console.log(response.text);
}
main();
