import type { Transcriber } from "./transcriber";

export interface Utterance {
  speaker: number;
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionOptions {
  speakerNames: string[];
  language?: string;
  signal?: AbortSignal;
  model?: string;
  onProgress?: (pct: number) => void;
}

export interface SpeakerMapping {
  count: number;
  names: string[];
}

export type RecordingSampleRate = 16000 | 22050 | 44100;

export type RecordingMode = "desktop" | "mobile";

export type TranscriptionProvider =
  | "gladia"
  | "deepgram"
  | "assemblyai"
  | "whisper"
  | "groq"
  | "whisper-local"
  | "spob";

export interface ProviderMeta {
  id: TranscriptionProvider;
  label: string;
  transcriber: Transcriber;
  apiKeyField: keyof import("./settings").PluginSettings;
  modelField?: keyof import("./settings").PluginSettings;
  supportsDiarization: boolean;
  requiresApiKey: boolean;
  testEndpoint?: string;
}

export const PROVIDERS: {
  value: TranscriptionProvider;
  label: string;
}[] = [
  { value: "gladia", label: "Gladia" },
  { value: "deepgram", label: "Deepgram" },
  { value: "assemblyai", label: "AssemblyAI" },
  { value: "whisper", label: "OpenAI Whisper" },
  { value: "groq", label: "Groq (Whisper)" },
  { value: "whisper-local", label: "Whisper (local)" },
  { value: "spob", label: "Smart Plugins Obsidian (AssemblyAI)" },
];

export const DIARIZATION_WARNING: Record<TranscriptionProvider, string | null> =
  {
    gladia: null,
    deepgram: null,
    assemblyai: null,
    whisper:
      "OpenAI Whisper no tiene diarización de hablantes. La transcripción será un solo bloque de texto.",
    groq: "Groq (Whisper) no tiene diarización de hablantes. La transcripción será un solo bloque de texto.",
    "whisper-local":
      "Whisper local no tiene diarización de hablantes. La transcripción será un solo bloque de texto.",
    spob: null,
  };
