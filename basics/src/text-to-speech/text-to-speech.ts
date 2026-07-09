
/**
 * @see https://ai.google.dev/gemini-api/docs/generate-content/speech-generation#single-speaker
 */

import "dotenv/config";
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// 1. Initialize the client. It automatically picks up process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

// Gemini TTS returns raw 16-bit PCM audio (mono, 24kHz) with no file header,
// so it isn't a playable file by itself. We wrap it in a standard 44-byte WAV
// header so it can be opened by any media player.
function pcmToWav(pcmData: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const blockAlign = channels * (bitDepth / 8);
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // audio format: 1 = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmData.length, 40);

  return Buffer.concat([header, pcmData]);
}

async function textToSpeech(text: string, outputPath: string) {
  try {
    console.log(`Generating speech for: "${text}"`);

    // 2. Ask Gemini's TTS model for an AUDIO response, picking a prebuilt voice.
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: text,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const audioData = response.data;
    if (!audioData) {
      console.log("No audio was returned:", response.text);
      return;
    }

    // 3. The base64 payload is raw PCM, so wrap it in a WAV header before saving.
    const pcmBuffer = Buffer.from(audioData, "base64");
    const wavBuffer = pcmToWav(pcmBuffer);
    fs.writeFileSync(outputPath, wavBuffer);

    console.log(`Audio saved as ${outputPath}`);
  } catch (error) {
    console.error("Error during text-to-speech generation:", error);
  }
}

// Example usage:
const outputPath = path.join(__dirname, "gemini-tts-output.wav");
textToSpeech("Believe it! Dattebayo means, roughly, 'you know it', or 'I mean it', in fluent English.", outputPath);
