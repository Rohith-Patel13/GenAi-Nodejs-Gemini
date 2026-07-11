import path from "path/win32";
import { generateEmbedding, loadJsonFile } from "./save-embeddings";


function dotProduct(a: number[], b: number[]) {
    return a.map((value, index) => value * (b[index] ?? 0)).reduce((a, b) => a + b, 0);
}

function cosineSimilarity(a: number[], b: number[]) {
    const product = dotProduct(a,b);
    const aMagnitude = Math.sqrt(a.map(value => value * value).reduce((a, b) => a + b, 0));
    const bMagnitude = Math.sqrt(b.map(value => value * value).reduce((a, b) => a + b, 0));
    const similarity = product / (aMagnitude * bMagnitude);
    return similarity;
}

async function main() {
    const dataWithEmbeddings = await loadJsonFile<{ input: string, embedding: number[] }[]>(path.join(__dirname, 'dataWithEmbeddings.json'));

    const userPrompt = "which animal is mostly used as a pet in south india ?";
    
    const generatedEmbeddingForUserPrompt: number[] = await   generateEmbedding(userPrompt);

    const similarities: {
        input: string;
        similarity: number;
    }[] = dataWithEmbeddings.map(item => {
        const similarity = cosineSimilarity(generatedEmbeddingForUserPrompt, item.embedding);
        return { input: item.input, similarity };
    });
    
    console.log("Similarities:", similarities);
}

main();
