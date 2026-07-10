
import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";

async function main() {

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY!
    });

    const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: 'What is the meaning of life?',
    });

    console.log(response.embeddings);
}

main();
