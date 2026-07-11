

import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
});

async function loadJsonFile<T>(filePath: string): Promise<T> {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

async function saveDataToJsonFile<T>(filePath: string, data: T): Promise<void> {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(filePath, jsonData, 'utf8');
}

// gemini-embedding-2 only embeds one content per request (unlike the older
// text-embedding-004, which supports batching multiple strings in one call),
// so we call embedContent once per input string instead of sending them all
// as a single batched `contents` array.
async function generateEmbedding(text: string) {
    const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text,
    });

    return response.embeddings?.[0]?.values ?? [];
}


async function main() {
    const data = await loadJsonFile<string[]>(path.join(__dirname, 'load-data.json'));

    // Pair each input back up with its own embedding, e.g.
    // [{ input: "Dog", embedding: [...] }, { input: "Cat", embedding: [...] }]
    const dataWithEmbeddings = [];
    for (const input of data) {
        const embedding = await generateEmbedding(input);
        dataWithEmbeddings.push({ input, embedding });
    }

    await saveDataToJsonFile(path.join(__dirname, 'dataWithEmbeddings.json'), dataWithEmbeddings);
}

main();


