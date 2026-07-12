
import "dotenv/config";
import { chromaClientLibrary } from "./chroma-client.library";

async function createCollection() {
    const collection = await chromaClientLibrary.createCollection("third-test-collection");
    console.log("Collection created:", collection);
}

async function listCollections() {
    const collections = await chromaClientLibrary.listCollections();
    console.log("Collections:", collections);
}

async function addDocument() {
    const document = {
        ids: ["eb9fb1a8-bf90-4974-ae61-223a394202da", "180da162-1019-4d6b-a9f2-ba4648765c94"],
        metadatas: [
            { author: "John dog", category: "no" },
            { author: "John dog", category: "no" },
        ],
        documents: ["This is a test doc.", "This is another test doc."],
        uris: ["http://example.com/doc1", "http://example.com/doc2"]
    };

    await chromaClientLibrary.addDocument("third-test-collection", document);
}

async function getRecordsByCollection() {
    const records = await chromaClientLibrary.getRecordsByCollection("third-test-collection");
    console.log("Records:", records);
}

getRecordsByCollection().catch((error) => {
    console.error("Error:", error);
});