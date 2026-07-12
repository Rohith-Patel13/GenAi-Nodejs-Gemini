
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
        ids: ["40f1baef-f302-4fb8-bb6a-d7a039c97f89"],
        embeddings: [[0.1, 0.2, 0.3]],
        metadatas: [{ author: "John Doe", category: "example" }],
        documents: ["This is a test doc."],
        uris: ["http://example.com/doc1"]
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