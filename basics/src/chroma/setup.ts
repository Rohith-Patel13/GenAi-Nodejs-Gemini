
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
        ids: ["2a3f0374-ae6f-45b6-8d13-ff1dc25671ec"],
        embeddings: [[0.1, 0.2, 0.3]],
        metadatas: [{ author: "John Doe", category: "example" }],
        documents: ["This is a test doc."],
        uris: ["http://example.com/doc1"]
    };

    await chromaClientLibrary.addDocument("test-collection", document);
}

addDocument();
