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
}

export interface SpeakerMapping {
  count: number;
  names: string[];
}

export type TranscriptionProvider = "gladia" | "deepgram" | "assemblyai";

export const PROVIDERS: { value: TranscriptionProvider; label: string }[] = [
  { value: "gladia", label: "Gladia" },
  { value: "deepgram", label: "Deepgram" },
  { value: "assemblyai", label: "AssemblyAI" },
];
