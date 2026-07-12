
import { chromaClientLibrary } from "./chroma-client.library";

async function createCollection() {
    const collection = await chromaClientLibrary.createCollection("test-collection");
    console.log("Collection created:", collection);
}

async function listCollections() {
    const collections = await chromaClientLibrary.listCollections();
    console.log("Collections:", collections);
}

async function addDocument() {
    const document = {
        ids: ["21445900-e8c6-40a9-af18-2d59d97b216f", "863c58fc-5cf3-4244-b9e8-001d2e6e04de"],
        embeddings: [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
        metadatas: [
            { author: "John Doe", category: "example" },
            { author: "John Doe", category: "example" },
        ],
        documents: ["This is a test doc.", "This is another test doc."],
        uris: ["http://example.com/doc1", "http://example.com/doc2"]
    };

    await chromaClientLibrary.addDocument("test-collection", document);
}

async function getRecordsByCollection() {
    const records = await chromaClientLibrary.getRecordsByCollection("test-collection");
    console.log("Records:", records);
}

getRecordsByCollection().catch((error) => {
    console.error("Error:", error);
});