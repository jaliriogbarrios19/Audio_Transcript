import type { TranscriptionProvider, ProviderMeta } from "../types";
import { GladiaTranscriber } from "./gladia";
import { DeepgramTranscriber } from "./deepgram";
import { AssemblyAITranscriber } from "./assemblyai";
import { WhisperTranscriber } from "./whisper";
import { GroqTranscriber } from "./groq";
import { WhisperLocalTranscriber } from "./whisper-local";

export const PROVIDER_REGISTRY: Record<TranscriptionProvider, ProviderMeta> = {
  gladia: {
    id: "gladia",
    label: "Gladia",
    transcriber: new GladiaTranscriber(),
    apiKeyField: "gladiaApiKey",
    supportsDiarization: true,
    requiresApiKey: true,
    testEndpoint: "https://api.gladia.io/v2/upload",
  },
  deepgram: {
    id: "deepgram",
    label: "Deepgram",
    transcriber: new DeepgramTranscriber(),
    apiKeyField: "deepgramApiKey",
    supportsDiarization: true,
    requiresApiKey: true,
    testEndpoint: "https://api.deepgram.com/v1/listen",
  },
  assemblyai: {
    id: "assemblyai",
    label: "AssemblyAI",
    transcriber: new AssemblyAITranscriber(),
    apiKeyField: "assemblyaiApiKey",
    modelField: "assemblyaiModel",
    supportsDiarization: true,
    requiresApiKey: true,
    testEndpoint: "https://api.assemblyai.com/v2/transcript",
  },
  whisper: {
    id: "whisper",
    label: "OpenAI Whisper",
    transcriber: new WhisperTranscriber(),
    apiKeyField: "whisperApiKey",
    supportsDiarization: false,
    requiresApiKey: true,
    testEndpoint: "https://api.openai.com/v1/models",
  },
  groq: {
    id: "groq",
    label: "Groq (Whisper)",
    transcriber: new GroqTranscriber(),
    apiKeyField: "groqApiKey",
    supportsDiarization: false,
    requiresApiKey: true,
    testEndpoint: "https://api.groq.com/openai/v1/models",
  },
  "whisper-local": {
    id: "whisper-local",
    label: "Whisper (local)",
    transcriber: new WhisperLocalTranscriber(),
    apiKeyField: "whisperLocalUrl",
    supportsDiarization: false,
    requiresApiKey: false,
    testEndpoint: undefined,
  },
};
