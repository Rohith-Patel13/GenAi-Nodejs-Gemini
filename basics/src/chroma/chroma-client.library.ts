
/**
 * how to setup and run chroma server in your local machine
 * 
 * 1. Start the Chroma server by running the following command in your terminal:
 * @see https://docs.trychroma.com/docs/run-chroma/clients#persistent-client
 * 
 * 2. Embedding functions 
 * @see https://docs.trychroma.com/docs/embeddings/embedding-functions#typescript
 * 
 * 3. Google Gemini Embedding Function for Chroma
 * @see https://www.npmjs.com/package/@chroma-core/google-gemini
 */

/**
 * 1. start the server with the following command in powershell terminal:
 *  `npm run chroma`
 * 
 * 2. run following command in new terminal to connect to the server and perform operations:
 *  `npm run dev`
 *   
 */
import "dotenv/config";
import { ChromaClient, Collection, Metadata } from "chromadb";
import { GoogleGeminiEmbeddingFunction } from '@chroma-core/google-gemini';

// Initialize the embedder
const embedder = new GoogleGeminiEmbeddingFunction({
  apiKey: process.env.GEMINI_API_KEY!, // Or set GEMINI_API_KEY env var
  modelName: 'gemini-embedding-2', // Optional, defaults to latest model
  taskType: 'RETRIEVAL_DOCUMENT', // Optional
});

const client = new ChromaClient();

class ChromaClientLibrary {
  async createCollection(collectionName: string) {
    try {
      const collection: Collection = await client.createCollection({ name: collectionName, embeddingFunction: embedder });
      console.log(`Collection '${collectionName}' created successfully.`);
      return collection;
    } catch (error) {
      console.error(`Error creating collection '${collectionName}':`, error);
      throw error;
    }
  }

  async listCollections() {
    try {
      const collections: Collection[] = await client.listCollections();
      console.log("Collections retrieved successfully.");
      return collections;
    } catch (error) {
      console.error("Error listing collections:", error);
      throw error;
    }
  }

  async addDocument(collectionName: string, document: {
    ids: string[];
    embeddings?: number[][];
    metadatas?: Metadata[];
    documents?: string[];
    uris?: string[];
  }) {
    try {
      const collection: Collection = await client.getCollection({ name: collectionName });
      if (!collection) {
        throw new Error(`Collection '${collectionName}' does not exist.`);
      }
      await collection.add(document);
      console.log(`Document added to collection '${collectionName}' successfully.`);
    } catch (error) {
      console.error(`Error adding document to collection '${collectionName}':`, error);
      throw error;
    } 
  }

  async getRecordsByCollection(collectionName: string) {
    try {
      const collection: Collection = await client.getCollection({ name: collectionName });
      if (!collection) {
        throw new Error(`Collection '${collectionName}' does not exist.`);
      }
      const records = await collection.get({
        include: ["metadatas", "documents", "embeddings", "uris"],
      });
      console.log(`Records retrieved from collection '${collectionName}' successfully.`);
      return records;
    } catch (error) {
      console.error(`Error retrieving records from collection '${collectionName}':`, error);
      throw error;
    }
  }
}

const chromaClientLibrary = new ChromaClientLibrary();
export { chromaClientLibrary };