import { Utterance, TranscriptionOptions } from "./types";

export interface Transcriber {
  readonly name: string;

  transcribe(
    audioBlob: Blob,
    apiKey: string,
    options: TranscriptionOptions
  ): Promise<Utterance[]>;
}
